/* Nexven Drop — shared leaderboard + online + admin grants (Firestore REST) */
(function (NX) {
  'use strict';
  var cfg = window.NEXVEN_CFG || {}, ONLINE_MS = 90000, HEART_MS = 20000;
  var net = NX.net = {};
  net.enabled = function () { return !!(cfg.projectId && cfg.apiKey); };
  function base() {
    var db = cfg.databaseId || '(default)';
    return 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(cfg.projectId) +
      '/databases/' + encodeURIComponent(db) + '/documents';
  }
  function key() { return 'key=' + encodeURIComponent(cfg.apiKey); }
  function num(f) {
    if (!f) return 0;
    if (f.doubleValue != null) return Number(f.doubleValue);
    if (f.integerValue != null) return Number(f.integerValue);
    return 0;
  }
  function str(f) { return f && f.stringValue != null ? f.stringValue : ''; }

  var lastPush = 0, inflight = false, dbOk = null;

  net.dbStatus = function () { return dbOk; };

  function markDb(ok, errMsg) {
    dbOk = ok;
    if (!ok && errMsg) try { console.warn('[Nexven Firebase]', errMsg); } catch (e) {}
  }

  net.push = function (force) {
    var u = NX.user(); if (!net.enabled() || !u) return;
    var now = Date.now();
    if (!force && now - lastPush < 8000) return;
    if (inflight && !force) return;
    lastPush = now; inflight = true;
    var best = (u.stats && u.stats.best) || {};
    var f = {
      uid: { stringValue: String(u.id) },
      name: { stringValue: String(u.first_name || 'Игрок').slice(0, 40) },
      photo: { stringValue: String(u.photo_url || '') },
      spent: { doubleValue: NX.r2(u.total_spent || 0) },
      bestN: { stringValue: String(best.name || '') },
      bestV: { doubleValue: Number(best.value || 0) },
      seen: { integerValue: String(now) }
    };
    var mask = Object.keys(f).map(function (k) { return 'updateMask.fieldPaths=' + k; }).join('&');
    var url = base() + '/players/' + encodeURIComponent(String(u.id)) + '?' + mask + '&' + key();
    fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: f }) })
      .then(function (r) {
        inflight = false;
        if (r.ok) { markDb(true); return; }
        return r.text().then(function (t) {
          if (t && t.indexOf('does not exist') >= 0) markDb(false, 'Firestore database not created');
          else markDb(false, 'push http ' + r.status);
          /* create via POST if missing doc (not missing DB) */
          if (r.status === 404 && t && t.indexOf('does not exist') < 0) {
            return fetch(base() + '/players?' + key() + '&documentId=' + encodeURIComponent(String(u.id)), {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: f })
            }).then(function (r2) { if (r2.ok) markDb(true); });
          }
        });
      }, function () { inflight = false; markDb(false, 'network'); });
  };

  function query(q) {
    return fetch(base() + ':runQuery?' + key(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ structuredQuery: q })
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) {
        if (t && t.indexOf('does not exist') >= 0) markDb(false, 'Firestore database not created');
        throw new Error('http ' + r.status);
      });
      markDb(true);
      return r.json();
    });
  }

  net.fetchBoard = function () {
    var cutoff = Date.now() - ONLINE_MS;
    var top = query({
      from: [{ collectionId: 'players' }],
      orderBy: [{ field: { fieldPath: 'spent' }, direction: 'DESCENDING' }],
      limit: 100
    });
    var on = query({
      from: [{ collectionId: 'players' }],
      where: { fieldFilter: { field: { fieldPath: 'seen' }, op: 'GREATER_THAN_OR_EQUAL', value: { integerValue: String(cutoff) } } },
      select: { fields: [{ fieldPath: 'uid' }] },
      limit: 1000
    });
    return Promise.all([top, on]).then(function (res) {
      var ids = {}, n = 0;
      (res[1] || []).forEach(function (x) {
        if (x.document) { n++; ids[str((x.document.fields || {}).uid)] = 1; }
      });
      var rows = (res[0] || []).filter(function (x) { return x.document; }).map(function (x) {
        var f = x.document.fields || {};
        var id = str(f.uid) || (x.document.name || '').split('/').pop();
        return {
          id: id,
          name: str(f.name) || 'Игрок',
          photo: str(f.photo) || null,
          spent: num(f.spent),
          best: str(f.bestN) ? { name: str(f.bestN), value: num(f.bestV) } : null,
          online: !!ids[id]
        };
      });
      return { rows: rows, online: n };
    });
  };

  net.fetchOnline = function () {
    var cutoff = Date.now() - ONLINE_MS;
    return query({
      from: [{ collectionId: 'players' }],
      where: { fieldFilter: { field: { fieldPath: 'seen' }, op: 'GREATER_THAN_OR_EQUAL', value: { integerValue: String(cutoff) } } },
      select: { fields: [{ fieldPath: 'uid' }] },
      limit: 1000
    }).then(function (r) { return (r || []).filter(function (x) { return x.document; }).length; });
  };

  net.grant = function (uid, amount, cb) {
    if (!net.enabled()) { if (cb) cb(new Error('no config')); return; }
    uid = String(uid); amount = Number(amount) || 0;
    if (!uid || !amount) { if (cb) cb(new Error('bad args')); return; }
    var path = base() + '/grants/' + encodeURIComponent(uid) + '?' + key();
    fetch(path).then(function (r) {
      if (r.status === 404) return r.text().then(function (txt) {
        if (txt && txt.indexOf('does not exist') >= 0) throw new Error('NO_DB');
        return { fields: {} };
      });
      if (!r.ok) return r.text().then(function (txt) {
        if (txt && txt.indexOf('does not exist') >= 0) throw new Error('NO_DB');
        throw new Error('http ' + r.status);
      });
      return r.json();
    }).then(function (doc) {
      var cur = num((doc.fields || {}).amount) || 0;
      var f = {
        amount: { doubleValue: NX.r2(cur + amount) },
        from: { stringValue: String((NX.user() || {}).id || '') },
        updated: { integerValue: String(Date.now()) }
      };
      return fetch(base() + '/grants/' + encodeURIComponent(uid) + '?updateMask.fieldPaths=amount&updateMask.fieldPaths=from&updateMask.fieldPaths=updated&' + key(), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: f })
      }).then(function (r2) {
        if (!r2.ok) return r2.text().then(function (txt) {
          if (txt && txt.indexOf('does not exist') >= 0) throw new Error('NO_DB');
          throw new Error('http ' + r2.status);
        });
        markDb(true);
      });
    }).then(function () { if (cb) cb(null); }, function (e) { if (cb) cb(e || new Error('fail')); });
  };

  /* Забирает всё, что для игрока лежит в grants/{id}: награды бота (rewards), окно вывода (wd_until)
     и старое поле amount (выдача TON из админки мини-аппа). Награды применяются один раз (user.applied). */
  net.claimGrants = function (cb) {
    if (!net.enabled()) { if (cb) cb(0); return; }
    var u = NX.user(); if (!u) { if (cb) cb(0); return; }
    var path = base() + '/grants/' + encodeURIComponent(String(u.id)) + '?' + key();
    fetch(path).then(function (r) {
      if (r.status === 404) { if (cb) cb(0); return null; }
      if (!r.ok) throw new Error('http ' + r.status);
      return r.json();
    }).then(function (doc) {
      if (!doc) return;
      var f = doc.fields || {}, got = 0, list = [], changed = false;

      var wdu = num(f.wd_until);
      if (wdu > (u.wd_until || 0)) { u.wd_until = wdu; changed = true; }

      try { list = JSON.parse(str(f.rewards) || '[]'); } catch (e) { list = []; }
      if (!Array.isArray(list)) list = [];
      list.forEach(function (rw) { if (NX.applyReward(rw)) got++; });
      if (changed && !got) { NX.save(true); }

      /* очистить обработанные награды; если документ изменился — не страшно, повторно они не применятся */
      if (list.length && doc.updateTime) {
        fetch(path + '&updateMask.fieldPaths=rewards&currentDocument.updateTime=' + encodeURIComponent(doc.updateTime), {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: { rewards: { stringValue: '[]' } } })
        }).catch(function () {});
      }

      var amt = num(f.amount) || 0;
      if (amt <= 0) { if (cb) cb(got); return; }
      return fetch(path + '&updateMask.fieldPaths=amount', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { amount: { doubleValue: 0 } } })
      }).then(function () {
        NX.credit(amt);
        NX.toast('Получено от админа: +' + NX.fmt(amt) + ' TON', 'success');
        NX.sfx('win');
        if (cb) cb(amt);
      });
    }).catch(function () { if (cb) cb(0); });
  };

  net.start = function () {
    if (!net.enabled()) return;
    net.push(true);
    net.claimGrants();
    setInterval(function () {
      if (!document.hidden) { net.push(true); net.claimGrants(); }
    }, HEART_MS);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) { net.push(true); net.claimGrants(); }
    });
  };
})(window.NX);
