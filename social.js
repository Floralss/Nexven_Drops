/* Nexven Drop — shared leaderboard + online presence (Firestore REST) */
(function (NX) {
  'use strict';
  var cfg = window.NEXVEN_CFG || {}, ONLINE_MS = 70000, HEART_MS = 20000;
  var net = NX.net = {};
  net.enabled = function () { return !!(cfg.projectId && cfg.apiKey); };
  function base() { return 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(cfg.projectId) + '/databases/(default)/documents'; }
  function key() { return 'key=' + encodeURIComponent(cfg.apiKey); }
  function num(f) { return f ? Number(f.doubleValue != null ? f.doubleValue : f.integerValue || 0) : 0; }
  function str(f) { return f && f.stringValue != null ? f.stringValue : ''; }

  var lastPush = 0, inflight = false;
  net.push = function (force) {
    var u = NX.user(); if (!net.enabled() || !u) return;
    var now = Date.now(); if (!force && now - lastPush < 8000) return;
    if (inflight && !force) return;
    lastPush = now; inflight = true;
    var best = (u.stats && u.stats.best) || {};
    var f = { uid: { stringValue: String(u.id) }, name: { stringValue: String(u.first_name || 'Игрок').slice(0, 40) }, photo: { stringValue: String(u.photo_url || '') },
      spent: { doubleValue: NX.r2(u.total_spent || 0) }, bestN: { stringValue: String(best.name || '') }, bestV: { doubleValue: Number(best.value || 0) }, seen: { integerValue: String(now) }, dep: { doubleValue: NX.r2(u.total_deposited || 0) }, refBy: { stringValue: String(u.ref_by || '') } };
    var mask = Object.keys(f).map(function (k) { return 'updateMask.fieldPaths=' + k; }).join('&');
    fetch(base() + '/players/' + encodeURIComponent(String(u.id)) + '?' + mask + '&' + key(), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: f }) })
      .then(function () { inflight = false; }, function () { inflight = false; });
  };
  function query(q) {
    return fetch(base() + ':runQuery?' + key(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ structuredQuery: q }) })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); });
  }
  /* -> { rows:[{id,name,photo,spent,best,online}], online:N } */
  net.fetchBoard = function () {
    var cutoff = Date.now() - ONLINE_MS;
    var top = query({ from: [{ collectionId: 'players' }], orderBy: [{ field: { fieldPath: 'spent' }, direction: 'DESCENDING' }], limit: 100 });
    var on = query({ from: [{ collectionId: 'players' }], where: { fieldFilter: { field: { fieldPath: 'seen' }, op: 'GREATER_THAN_OR_EQUAL', value: { integerValue: String(cutoff) } } }, select: { fields: [{ fieldPath: 'uid' }] }, limit: 1000 });
    return Promise.all([top, on]).then(function (res) {
      var ids = {}, n = 0;
      res[1].forEach(function (x) { if (x.document) { n++; ids[str((x.document.fields || {}).uid)] = 1; } });
      var rows = res[0].filter(function (x) { return x.document; }).map(function (x) {
        var f = x.document.fields || {}, id = str(f.uid) || x.document.name.split('/').pop();
        return { id: id, name: str(f.name) || 'Игрок', photo: str(f.photo) || null, spent: num(f.spent), best: str(f.bestN) ? { name: str(f.bestN), value: num(f.bestV) } : null, online: !!ids[id] };
      });
      return { rows: rows, online: n };
    });
  };
  net.fetchOnline = function () {
    var cutoff = Date.now() - ONLINE_MS;
    return query({ from: [{ collectionId: 'players' }], where: { fieldFilter: { field: { fieldPath: 'seen' }, op: 'GREATER_THAN_OR_EQUAL', value: { integerValue: String(cutoff) } } }, select: { fields: [{ fieldPath: 'uid' }] }, limit: 1000 })
      .then(function (r) { return r.filter(function (x) { return x.document; }).length; });
  };

  /* ---------- generic REST helpers ---------- */
  function hdr() { return { 'Content-Type': 'application/json' }; }
  function getDoc(path) {
    return fetch(base() + '/' + path + '?' + key()).then(function (r) { if (r.status === 404) return null; if (!r.ok) throw new Error('http ' + r.status); return r.json(); });
  }
  function setDoc(path, fields) {
    return fetch(base() + '/' + path + '?' + key(), { method: 'PATCH', headers: hdr(), body: JSON.stringify({ fields: fields }) }).then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); });
  }
  function delDoc(path) { return fetch(base() + '/' + path + '?' + key(), { method: 'DELETE' }).then(function (r) { if (!r.ok) throw new Error('http ' + r.status); }); }
  function incUsed(path) {
    var name = 'projects/' + cfg.projectId + '/databases/(default)/documents/' + path;
    return fetch(base() + ':commit?' + key(), { method: 'POST', headers: hdr(), body: JSON.stringify({ writes: [{ transform: { document: name, fieldTransforms: [{ fieldPath: 'used', increment: { integerValue: '1' } }] } }] }) })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); });
  }

  /* ---------- referrals: players whose refBy == my id ---------- */
  net.fetchRefs = function (uid) {
    return query({ from: [{ collectionId: 'players' }], where: { fieldFilter: { field: { fieldPath: 'refBy' }, op: 'EQUAL', value: { stringValue: String(uid) } } }, limit: 500 })
      .then(function (r) {
        return r.filter(function (x) { return x.document; }).map(function (x) {
          var f = x.document.fields || {};
          return { id: str(f.uid) || x.document.name.split('/').pop(), name: str(f.name) || 'Друг', dep: num(f.dep) };
        });
      });
  };

  /* ---------- promo codes ---------- */
  function promoFrom(d) {
    var f = d.fields || {};
    return { code: str(f.code), kind: str(f.kind), amount: num(f.amount), caseId: str(f.caseId), gift: str(f.gift), max: num(f.max), used: num(f.used), exp: num(f.exp) };
  }
  net.getPromo = function (code) { return getDoc('promos/' + encodeURIComponent(code)).then(function (d) { return d ? promoFrom(d) : null; }); };
  net.usePromo = function (code) { return incUsed('promos/' + encodeURIComponent(code)); };
  net.createPromo = function (p) {
    return setDoc('promos/' + encodeURIComponent(p.code), {
      code: { stringValue: p.code }, kind: { stringValue: p.kind }, amount: { doubleValue: p.amount || 0 },
      caseId: { stringValue: p.caseId || '' }, gift: { stringValue: p.gift || '' }, max: { integerValue: String(p.max || 0) },
      used: { integerValue: '0' }, exp: { integerValue: String(p.exp || 0) }
    });
  };
  net.deletePromo = function (code) { return delDoc('promos/' + encodeURIComponent(code)); };
  net.listPromos = function () {
    return query({ from: [{ collectionId: 'promos' }], limit: 100 }).then(function (r) { return r.filter(function (x) { return x.document; }).map(function (x) { return promoFrom(x.document); }); });
  };

  /* ---------- grants: admin -> any player (applied when that player opens the app) ---------- */
  net.sendGrant = function (uid, g) {
    var id = String(uid) + '_' + Date.now();
    return setDoc('grants/' + id, { uid: { stringValue: String(uid) }, kind: { stringValue: g.kind }, amount: { doubleValue: g.amount || 0 }, caseId: { stringValue: g.caseId || '' }, ts: { integerValue: String(Date.now()) } });
  };
  net.fetchGrants = function (uid) {
    return query({ from: [{ collectionId: 'grants' }], where: { fieldFilter: { field: { fieldPath: 'uid' }, op: 'EQUAL', value: { stringValue: String(uid) } } }, limit: 50 })
      .then(function (r) {
        return r.filter(function (x) { return x.document; }).map(function (x) {
          var f = x.document.fields || {};
          return { path: x.document.name.split('/documents/')[1], kind: str(f.kind), amount: num(f.amount), caseId: str(f.caseId) };
        });
      });
  };
  net.dropGrant = function (path) { return delDoc(path); };
  net.start = function () {
    if (!net.enabled()) return;
    net.push(true);
    setInterval(function () { if (!document.hidden) net.push(true); }, HEART_MS);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) net.push(true); });
  };
})(window.NX);
