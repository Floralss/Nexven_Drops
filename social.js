/* Nexven Drop — shared leaderboard + online presence (Firestore REST) */
(function (NX) {
  'use strict';
  var cfg = window.NEXVEN_CFG || {}, ONLINE_MS = 70000, HEART_MS = 20000;
  var net = NX.net = {};
  net.enabled = function () { return !!(cfg.projectId && cfg.apiKey); };
  function base() { return 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(cfg.projectId) + '/databases/' + encodeURIComponent(cfg.database || '(default)') + '/documents'; }
  function key() { return 'key=' + encodeURIComponent(cfg.apiKey); }
  function num(f) { return f ? Number(f.doubleValue != null ? f.doubleValue : f.integerValue || 0) : 0; }
  function str(f) { return f && f.stringValue != null ? f.stringValue : ''; }

  net.err = '';
  function errText(status, body) {
    var m = '';
    try { m = (JSON.parse(body).error || {}).message || ''; } catch (e) {}
    if (status === 403) return 'Firestore: доступ запрещён (403). Опубликуйте правила из FIREBASE_RULES.txt';
    if (status === 404) return 'Firestore: база не создана (404). Создайте Firestore Database в консоли';
    if (status === 400) return 'Firestore 400: ' + m.slice(0, 80);
    return 'Firestore ' + status + (m ? ': ' + m.slice(0, 80) : '');
  }
  function http(url, opt) {
    return fetch(url, opt).then(function (r) {
      if (r.ok) { net.err = ''; return r; }
      return r.text().then(function (b) { var e = new Error(errText(r.status, b)); e.status = r.status; net.err = e.message; throw e; });
    }, function (e) { var x = new Error('Нет связи с Firebase'); net.err = x.message; throw x; });
  }
  var lastPush = 0, inflight = false;
  net.push = function (force) {
    var u = NX.user(); if (!net.enabled() || !u) return;
    var now = Date.now(); if (!force && now - lastPush < 8000) return;
    if (inflight && !force) return;
    lastPush = now; inflight = true;
    var best = (u.stats && u.stats.best) || {};
    var f = { uid: { stringValue: String(u.id) }, name: { stringValue: String(u.first_name || 'Игрок').slice(0, 40) }, photo: { stringValue: String(u.photo_url || '') },
      spent: { doubleValue: NX.r2(u.total_spent || 0) }, bestN: { stringValue: String(best.name || '') }, bestV: { doubleValue: Number(best.value || 0) }, seen: { integerValue: String(now) } };
    var mask = Object.keys(f).map(function (k) { return 'updateMask.fieldPaths=' + k; }).join('&');
    return http(base() + '/players/' + encodeURIComponent(String(u.id)) + '?' + mask + '&' + key(), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: f }) })
      .then(function () { inflight = false; return true; }, function () { inflight = false; return false; });
  };
  function query(q) {
    return http(base() + ':runQuery?' + key(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ structuredQuery: q }) })
      .then(function (r) { return r.json(); });
  }
  /* index-free: list the players collection, sort/filter on the client */
  function listPlayers() {
    var out = [];
    function page(tok) {
      return http(base() + '/players?pageSize=300&' + key() + (tok ? '&pageToken=' + encodeURIComponent(tok) : '')).then(function (r) { return r.json(); }).then(function (j) {
        (j.documents || []).forEach(function (d) { out.push(d); });
        if (j.nextPageToken && out.length < 3000) return page(j.nextPageToken);
        return out;
      });
    }
    return page('');
  }
  /* -> { rows:[{id,name,photo,spent,best,online,seen}], online:N } */
  net.fetchBoard = function () {
    var cutoff = Date.now() - ONLINE_MS;
    return listPlayers().then(function (docs) {
      var n = 0;
      var rows = docs.map(function (d) {
        var f = d.fields || {}, id = str(f.uid) || d.name.split('/').pop(), seen = num(f.seen), on = seen >= cutoff;
        if (on) n++;
        return { id: id, name: str(f.name) || 'Игрок', photo: str(f.photo) || null, spent: num(f.spent), best: str(f.bestN) ? { name: str(f.bestN), value: num(f.bestV) } : null, online: on, seen: seen };
      });
      rows.sort(function (a, b) { return b.spent - a.spent || b.seen - a.seen; });
      return { rows: rows.slice(0, 200), online: n, total: rows.length };
    });
  };
  net.fetchOnline = function () { return net.fetchBoard().then(function (b) { return b.online; }); };

  /* ---------- full state in Firestore (survives reinstall / other device) ---------- */
  net.loaded = false;
  var stInflight = false, stDirty = false, stT = null;
  net.saveState = function (now) {
    var u = NX.user(); if (!net.enabled() || !u || !net.loaded) return;
    if (!now) { clearTimeout(stT); stT = setTimeout(function () { net.saveState(true); }, 2500); return; }
    if (stInflight) { stDirty = true; return; }
    stInflight = true; stDirty = false;
    var f = { data: { stringValue: NX.pack() }, updated: { integerValue: String(Date.now()) } };
    http(base() + '/saves/' + encodeURIComponent(String(u.id)) + '?updateMask.fieldPaths=data&updateMask.fieldPaths=updated&' + key(), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: f }) })
      .then(function () { stInflight = false; if (stDirty) net.saveState(true); }, function () { stInflight = false; });
  };
  /* cb(stateObj|null, ok) ; ok=false means the request failed (do not overwrite remote!) */
  net.loadState = function (cb) {
    var u = NX.user(); if (!net.enabled() || !u) { cb(null, false); return; }
    var done = false, t = setTimeout(function () { fin(null, false); }, 4500);
    function fin(v, ok) { if (done) return; done = true; clearTimeout(t); if (ok) net.loaded = true; cb(v, ok); }
    http(base() + '/saves/' + encodeURIComponent(String(u.id)) + '?' + key())
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j === null || done) return;
        var raw = j && j.fields && j.fields.data && j.fields.data.stringValue, o = null;
        try { o = raw ? JSON.parse(raw) : null; } catch (e) {}
        fin(o, true);
      })
      .catch(function (e) { if (e && e.status === 404) fin(null, true); else fin(null, false); });
  };
  /* keep trying in the background until the first successful load; then merge if the remote copy is newer */
  net.retryLoad = function (onNewer) {
    if (!net.enabled() || net.loaded) return;
    var iv = setInterval(function () {
      if (net.loaded) { clearInterval(iv); return; }
      net.loadState(function (o, ok) {
        if (!ok) return; clearInterval(iv);
        if (o && (o.updated_at || 0) > (NX.lastSaved || 0)) onNewer(o);
        else net.saveState(true);
      });
    }, 8000);
  };

  /* ---------- admin grants (owner -> any player) ---------- */
  function boolF(b) { return { booleanValue: !!b }; }
  net.sendGrant = function (to, amount, type) {
    var u = NX.user();
    var f = { to: { stringValue: String(to) }, amount: { doubleValue: Number(amount) || 0 }, type: { stringValue: type || 'ton' }, by: { stringValue: String(u.id) }, ts: { integerValue: String(Date.now()) }, applied: boolF(false) };
    return http(base() + '/grants?' + key(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: f }) })
      .then(function (r) { return r.json(); });
  };
  var polling = false;
  net.pollGrants = function () {
    var u = NX.user(); if (!net.enabled() || !u || !NX.ready || polling) return; polling = true;
    query({ from: [{ collectionId: 'grants' }], where: { fieldFilter: { field: { fieldPath: 'to' }, op: 'EQUAL', value: { stringValue: String(u.id) } } }, limit: 100 })
      .then(function (res) {
        polling = false;
        var changed = false, msgs = [];
        res.forEach(function (x) {
          if (!x.document) return;
          var gid = x.document.name.split('/').pop(), f = x.document.fields || {}, by = str(f.by), type = str(f.type) || 'ton', amt;
          if (f.applied && f.applied.booleanValue) return;
          amt = f.amount ? Number(f.amount.doubleValue != null ? f.amount.doubleValue : f.amount.integerValue || 0) : 0;
          u.grants_done = u.grants_done || [];
          var seen = u.grants_done.indexOf(gid) >= 0;
          if (!seen) {
            var okBy = type === 'ton' ? NX.sameId(by, NX.OWNER_ID) : (NX.sameId(by, NX.OWNER_ID) || NX.ADMIN_IDS.some(function (id) { return NX.sameId(by, id); }));
            if (okBy) {
              if (type === 'ton') { u.balance = NX.r2(Math.max(0, u.balance + amt)); msgs.push((amt >= 0 ? 'Вам начислено +' : 'Списано ') + NX.fmt(Math.abs(amt)) + ' TON'); }
              else if (type === 'free') { u.last_free = 0; msgs.push('Бесплатный кейс снова доступен'); }
              changed = true;
            }
            u.grants_done.push(gid);
          }
          http(base() + '/grants/' + encodeURIComponent(gid) + '?updateMask.fieldPaths=applied&' + key(), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { applied: boolF(true) } }) }).catch(function () {});
        });
        if (msgs.length || changed) NX.save(true);
        if (changed) { NX.renderUser(); msgs.forEach(function (m, i) { setTimeout(function () { NX.toast(m, 'success'); NX.sfx('win'); NX.haptic('success'); }, i * 1800); }); if (NX.cur() === 'cases' && NX.pages.cases.enter) NX.pages.cases.enter(); }
      })
      .catch(function () { polling = false; });
  };

  net.start = function () {
    if (!net.enabled()) return;
    net.push(true); net.pollGrants();
    setInterval(function () { if (!document.hidden) { net.push(true); net.pollGrants(); } }, HEART_MS);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { net.push(true); net.pollGrants(); } });
  };
})(window.NX);
