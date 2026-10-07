/* Nexven Drop — Firestore REST: shared leaderboard, online presence, state backup,
   admin grants for other players, dynamic admins. No SDK. */
(function (NX) {
  'use strict';
  var cfg = window.NEXVEN_CFG || {}, ONLINE_MS = 70000, HEART_MS = 20000, POLL_MS = 12000;
  var net = NX.net = {};
  net.enabled = function () { return !!(cfg.projectId && cfg.apiKey); };
  function root() { return 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(cfg.projectId) + '/databases/(default)'; }
  function base() { return root() + '/documents'; }
  function key() { return 'key=' + encodeURIComponent(cfg.apiKey); }
  function num(f) { return f ? Number(f.doubleValue != null ? f.doubleValue : f.integerValue || 0) : 0; }
  function str(f) { return f && f.stringValue != null ? f.stringValue : ''; }
  function jfetch(url, opt) {
    return fetch(url, opt).then(function (r) {
      if (!r.ok) { var e = new Error('http ' + r.status); e.status = r.status; throw e; }
      return r.json();
    });
  }
  function post(url, body, method) {
    return jfetch(url, { method: method || 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  }

  /* ---------- player doc: leaderboard fields + full state backup ---------- */
  var lastPush = 0, inflight = false, again = false;
  function doPush() {
    var u = NX.user(); if (!u) return;
    inflight = true; again = false; lastPush = Date.now();
    var best = (u.stats && u.stats.best) || {}, packed = NX.pack();
    var f = {
      uid: { stringValue: String(u.id) }, name: { stringValue: String(u.first_name || 'Игрок').slice(0, 40) }, photo: { stringValue: String(u.photo_url || '') },
      spent: { doubleValue: NX.r2(u.total_spent || 0) }, bestN: { stringValue: String(best.name || '') }, bestV: { doubleValue: Number(best.value || 0) },
      seen: { integerValue: String(Date.now()) }, state: { stringValue: packed }, upd: { integerValue: String(JSON.parse(packed).updated_at || Date.now()) }
    };
    var mask = Object.keys(f).map(function (k) { return 'updateMask.fieldPaths=' + k; }).join('&');
    post(base() + '/players/' + encodeURIComponent(String(u.id)) + '?' + mask + '&' + key(), { fields: f }, 'PATCH')
      .then(function () { inflight = false; if (again) doPush(); }, function () { inflight = false; });
  }
  net.push = function (force) {
    var u = NX.user(); if (!net.enabled() || !u) return;
    if (inflight) { if (force) again = true; return; }
    if (!force && Date.now() - lastPush < 8000) return;
    doPush();
  };
  /* -> state object or null */
  net.pullState = function () {
    var u = NX.user(); if (!net.enabled() || !u) return Promise.resolve(null);
    return jfetch(base() + '/players/' + encodeURIComponent(String(u.id)) + '?' + key())
      .then(function (d) { var s = str((d.fields || {}).state); return s ? JSON.parse(s) : null; })
      .catch(function () { return null; });
  };

  /* ---------- leaderboard / online ---------- */
  function query(q) {
    return post(base() + ':runQuery?' + key(), { structuredQuery: q });
  }
  function onlineQuery() {
    var cutoff = Date.now() - ONLINE_MS;
    return query({ from: [{ collectionId: 'players' }], where: { fieldFilter: { field: { fieldPath: 'seen' }, op: 'GREATER_THAN_OR_EQUAL', value: { integerValue: String(cutoff) } } }, select: { fields: [{ fieldPath: 'uid' }] }, limit: 1000 });
  }
  /* -> { rows:[{id,name,photo,spent,best,online}], online:N } */
  net.fetchBoard = function () {
    var top = query({ from: [{ collectionId: 'players' }], orderBy: [{ field: { fieldPath: 'spent' }, direction: 'DESCENDING' }], select: { fields: [{ fieldPath: 'uid' }, { fieldPath: 'name' }, { fieldPath: 'photo' }, { fieldPath: 'spent' }, { fieldPath: 'bestN' }, { fieldPath: 'bestV' }] }, limit: 100 });
    return Promise.all([top, onlineQuery()]).then(function (res) {
      var ids = {}, n = 0;
      res[1].forEach(function (x) { if (x.document) { n++; ids[str((x.document.fields || {}).uid) || x.document.name.split('/').pop()] = 1; } });
      var rows = res[0].filter(function (x) { return x.document; }).map(function (x) {
        var f = x.document.fields || {}, id = str(f.uid) || x.document.name.split('/').pop();
        return { id: id, name: str(f.name) || 'Игрок', photo: str(f.photo) || null, spent: num(f.spent), best: str(f.bestN) ? { name: str(f.bestN), value: num(f.bestV) } : null, online: !!ids[id] };
      });
      return { rows: rows, online: n };
    });
  };
  net.fetchOnline = function () {
    return onlineQuery().then(function (r) { return r.filter(function (x) { return x.document; }).length; });
  };

  /* ---------- dynamic admins: admins/{id} ---------- */
  net.checkAdmin = function () {
    var u = NX.user(); if (!net.enabled() || !u) return Promise.resolve(null);
    return jfetch(base() + '/admins/' + encodeURIComponent(String(u.id)) + '?' + key())
      .then(function () { return true; }, function (e) { return e && e.status === 404 ? false : null; });
  };
  net.setAdmin = function (id, on) {
    var url = base() + '/admins/' + encodeURIComponent(String(id));
    if (on) return post(url + '?updateMask.fieldPaths=uid&updateMask.fieldPaths=ts&' + key(), { fields: { uid: { stringValue: String(id) }, ts: { integerValue: String(Date.now()) } } }, 'PATCH');
    return fetch(url + '?' + key(), { method: 'DELETE' }).then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return true; });
  };
  net.listAdmins = function () {
    return jfetch(base() + '/admins?pageSize=100&' + key()).then(function (d) {
      return (d.documents || []).map(function (x) { return x.name.split('/').pop(); });
    });
  };

  /* ---------- grants: owner/admin -> another player ---------- */
  net.sendGrant = function (to, type, amt) {
    var u = NX.user();
    return post(base() + '/grants?' + key(), { fields: {
      to: { stringValue: String(to) }, type: { stringValue: type }, amt: { doubleValue: Number(amt) || 0 },
      by: { stringValue: String(u.id) }, ts: { integerValue: String(Date.now()) }, applied: { booleanValue: false }
    } });
  };
  var polling = false;
  net.pollGrants = function () {
    var u = NX.user(); if (!net.enabled() || !u || polling) return;
    polling = true;
    query({ from: [{ collectionId: 'grants' }], where: { compositeFilter: { op: 'AND', filters: [
      { fieldFilter: { field: { fieldPath: 'to' }, op: 'EQUAL', value: { stringValue: String(u.id) } } },
      { fieldFilter: { field: { fieldPath: 'applied' }, op: 'EQUAL', value: { booleanValue: false } } }
    ] } }, limit: 50 }).then(function (rows) {
      var docs = rows.filter(function (x) { return x.document; }).map(function (x) { return x.document; });
      return docs.reduce(function (p, d) { return p.then(function () { return claim(d); }); }, Promise.resolve());
    }).then(function () { polling = false; }, function () { polling = false; });
  };
  /* claim = flip applied:true with an updateTime precondition, so a grant is applied exactly once */
  function claim(d) {
    var f = d.fields || {}, url = 'https://firestore.googleapis.com/v1/' + d.name + '?updateMask.fieldPaths=applied&currentDocument.updateTime=' + encodeURIComponent(d.updateTime) + '&' + key();
    return post(url, { fields: { applied: { booleanValue: true } } }, 'PATCH').then(function () {
      var type = str(f.type), amt = num(f.amt), u = NX.user();
      if (type === 'ton') {
        if (amt < 0) amt = -Math.min(-amt, Math.max(0, u.balance));
        NX.credit(amt);
        NX.toast((amt >= 0 ? 'Вам начислено +' : 'Списано ') + NX.fmt(Math.abs(amt)) + ' TON', amt >= 0 ? 'success' : 'error'); NX.sfx(amt >= 0 ? 'win' : 'lose');
      } else if (type === 'free') {
        u.last_free = 0; NX.save(true); NX.toast('Бесплатный кейс готов!', 'success'); NX.sfx('win');
        if (NX.cur() === 'cases' && NX.pages.cases.enter) NX.pages.cases.enter();
      }
      NX.save(true);
    }, function () { /* someone else claimed it, or network error: retry next poll */ });
  }

  net.start = function () {
    if (!net.enabled()) return;
    net.push(true);
    net.pollGrants();
    net.checkAdmin().then(function (v) {
      if (v === null) return;
      NX.dynAdmin = v;
      try { localStorage.setItem('nv_adm_' + NX.user().id, v ? '1' : '0'); } catch (e) {}
      if (NX.cur() === 'profile' && NX.pages.profile.enter) NX.pages.profile.enter();
    });
    setInterval(function () { if (!document.hidden) { net.push(true); } }, HEART_MS);
    setInterval(function () { if (!document.hidden) net.pollGrants(); }, POLL_MS);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { net.push(true); net.pollGrants(); } });
  };
})(window.NX);
