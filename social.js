/* Nexven Drop — shared leaderboard + online presence (Firestore REST) */
(function (NX) {
  'use strict';
  var cfg = window.NEXVEN_CFG || {}, ONLINE_MS = 70000, HEART_MS = 20000;
  var net = NX.net = {};
  net.enabled = function () { return !!(cfg.projectId && cfg.apiKey); };
  var dbs = cfg.databases || [cfg.database || '(default)'], dbi = 0;
  function C(n) { return (cfg.prefix || '') + n; }
  function dbSeg(i) { return '/databases/' + encodeURIComponent(dbs[i]) + '/documents'; }
  function base() { return 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(cfg.projectId) + dbSeg(dbi); }
  function key() { return 'key=' + encodeURIComponent(cfg.apiKey); }
  function num(f) { return f ? Number(f.doubleValue != null ? f.doubleValue : f.integerValue || 0) : 0; }
  function str(f) { return f && f.stringValue != null ? f.stringValue : ''; }

  net.err = '';
  function errText(status, body) {
    var m = '';
    try { m = (JSON.parse(body).error || {}).message || ''; } catch (e) {}
    if (status === 403) return 'Firestore 403: ' + (m ? m.slice(0, 140) : 'доступ запрещён') + (/referer|blocked|API key|API_KEY/i.test(m) ? ' → в Google Cloud снимите ограничение с ключа' : '');
    if (status === 404) return 'Firestore: база не создана (404). Создайте Firestore Database в консоли';
    if (status === 400) return 'Firestore 400: ' + m.slice(0, 80);
    return 'Firestore ' + status + (m ? ': ' + m.slice(0, 80) : '');
  }
  /* tries the configured databases in order (e.g. '(default)' then 'premium') and remembers the one that works */
  function http(url, opt, tried) {
    tried = tried || 0;
    return fetch(url, opt).then(function (r) {
      if (r.ok) { net.err = ''; return r; }
      return r.text().then(function (b) {
        var m = ''; try { m = (JSON.parse(b).error || {}).message || ''; } catch (e) {}
        var dbProblem = r.status === 403 || (r.status === 404 && /database/i.test(m));
        if (dbProblem && dbs.length > 1 && tried < dbs.length - 1) {
          var from = dbSeg(dbi); dbi = (dbi + 1) % dbs.length;
          return http(url.replace(from, dbSeg(dbi)), opt, tried + 1);
        }
        var e = new Error(errText(r.status, b) + (dbs.length > 1 ? ' [база: ' + dbs[dbi] + ']' : '')); e.status = r.status; net.err = e.message; throw e;
      });
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
    return http(base() + '/' + C('players') + '/' + encodeURIComponent(String(u.id)) + '?' + mask + '&' + key(), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: f }) })
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
      return http(base() + '/' + C('players') + '?pageSize=300&' + key() + (tok ? '&pageToken=' + encodeURIComponent(tok) : '')).then(function (r) { return r.json(); }).then(function (j) {
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
    http(base() + '/' + C('saves') + '/' + encodeURIComponent(String(u.id)) + '?updateMask.fieldPaths=data&updateMask.fieldPaths=updated&' + key(), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: f }) })
      .then(function () { stInflight = false; if (stDirty) net.saveState(true); }, function () { stInflight = false; });
  };
  /* cb(stateObj|null, ok) ; ok=false means the request failed (do not overwrite remote!) */
  net.loadState = function (cb) {
    var u = NX.user(); if (!net.enabled() || !u) { cb(null, false); return; }
    var done = false, t = setTimeout(function () { fin(null, false); }, 4500);
    function fin(v, ok) { if (done) return; done = true; clearTimeout(t); if (ok) net.loaded = true; cb(v, ok); }
    http(base() + '/' + C('saves') + '/' + encodeURIComponent(String(u.id)) + '?' + key())
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
    return http(base() + '/' + C('grants') + '?' + key(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: f }) })
      .then(function (r) { return r.json(); });
  };
  /* owner resets a player: clears their leaderboard row right away + sends a 'reset' grant the player applies on next visit (amount 1 = also clear inventory) */
  net.resetPlayer = function (to, withInv) {
    var row = { spent: { doubleValue: 0 }, bestN: { stringValue: '' }, bestV: { doubleValue: 0 } };
    var mask = Object.keys(row).map(function (k) { return 'updateMask.fieldPaths=' + k; }).join('&');
    var wipeRow = http(base() + '/' + C('players') + '/' + encodeURIComponent(String(to)) + '?' + mask + '&currentDocument.exists=true&' + key(), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: row }) }).catch(function () {});
    return net.sendGrant(to, withInv ? 1 : 0, 'reset').then(function (r) { return wipeRow.then(function () { return r; }); });
  };
  var polling = false;
  net.pollGrants = function () {
    var u = NX.user(); if (!net.enabled() || !u || !NX.ready || polling) return; polling = true;
    query({ from: [{ collectionId: C('grants') }], where: { fieldFilter: { field: { fieldPath: 'to' }, op: 'EQUAL', value: { stringValue: String(u.id) } } }, limit: 100 })
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
          if (!seen && type === 'ref') {
            var rid = str(f.uid), rname = str(f.name) || 'Друг', row = null;
            u.refs = u.refs || [];
            u.refs.forEach(function (r) { if (String(r.id) === rid) row = r; });
            if (!row) { u.refs.push({ id: rid, name: rname, earned: 0 }); msgs.push('Новый реферал: ' + rname); changed = true; row = u.refs[u.refs.length - 1]; }
            if (amt > 0) row.earned = NX.r2((row.earned || 0) + amt);  /* TON itself is credited by the bot; this is only the counter */
            u.grants_done.push(gid); changed = true;
          } else if (!seen) {
            var okBy = (type === 'ton' || type === 'reset') ? NX.sameId(by, NX.OWNER_ID) : (NX.sameId(by, NX.OWNER_ID) || NX.ADMIN_IDS.some(function (id) { return NX.sameId(by, id); }));
            if (okBy) {
              if (type === 'ton') { u.balance = NX.r2(Math.max(0, u.balance + amt)); msgs.push((amt >= 0 ? 'Вам начислено +' : 'Списано ') + NX.fmt(Math.abs(amt)) + ' TON'); }
              else if (type === 'free') { u.last_free = 0; msgs.push('Бесплатный кейс снова доступен'); }
              else if (type === 'reset') { NX.resetAccount(amt >= 1); msgs.push('Баланс и статистика обнулены'); }
              changed = true;
            }
            u.grants_done.push(gid);
          }
          http(base() + '/' + C('grants') + '/' + encodeURIComponent(gid) + '?updateMask.fieldPaths=applied&' + key(), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { applied: boolF(true) } }) }).catch(function () {});
        });
        if (msgs.length || changed) NX.save(true);
        if (changed) { NX.renderUser(); msgs.forEach(function (m, i) { setTimeout(function () { NX.toast(m, 'success'); NX.sfx('win'); NX.haptic('success'); }, i * 1800); }); if (NX.cur() === 'cases' && NX.pages.cases.enter) NX.pages.cases.enter(); }
      })
      .catch(function () { polling = false; });
  };

  /* ---------- PROMO CODES (Firestore: nx_promos/{CODE}, nx_promo_uses/{CODE}__{uid}) ----------
     A code can: give TON ('ton'), give a gift/NFT ('item'), reset the free case ('free').
     Limits: max total uses (0 = unlimited), expiry date (0 = never), one use per player.
     Redeeming is ONE atomic Firestore commit (counter +1 and a per-player "used" marker),
     so a code with max=10 can never be redeemed an 11th time, even if many players press it at once. */
  var PROMO_RE = /^[A-Z0-9_-]{3,24}$/;
  net.promoNorm = function (c) { return String(c || '').trim().toUpperCase().replace(/\s+/g, ''); };
  net.promoValid = function (c) { return PROMO_RE.test(c); };
  function docPath(coll, id) { return 'projects/' + cfg.projectId + '/databases/' + dbs[dbi] + '/documents/' + C(coll) + '/' + id; }
  function intOf(f) { return f ? Number(f.integerValue != null ? f.integerValue : f.doubleValue || 0) : 0; }
  function parsePromo(d) {
    var f = d.fields || {};
    return { code: d.name.split('/').pop(), type: str(f.type) || 'ton', amount: num(f.amount), item: str(f.item), max: intOf(f.max), used: intOf(f.used),
      exp: intOf(f.exp), active: f.active ? !!f.active.booleanValue : true, by: str(f.by), ts: intOf(f.ts), updateTime: d.updateTime };
  }
  net.promoDescribe = function (p) {
    if (p.type === 'item') return 'Подарок: ' + p.item;
    if (p.type === 'free') return 'Бесплатный кейс';
    return '+' + NX.fmt(p.amount) + ' TON';
  };
  /* -> Promise<{promo, msg}>  rejects with Error(user-readable text) */
  net.promoRedeem = function (rawCode) {
    var u = NX.user(), code = net.promoNorm(rawCode);
    if (!net.enabled()) return Promise.reject(new Error('Промокоды работают через Firebase (config.js)'));
    if (!net.promoValid(code)) return Promise.reject(new Error('Неверный формат кода'));
    var attempt = 0;
    function once() {
      attempt++;
      return http(base() + '/' + C('promos') + '/' + encodeURIComponent(code) + '?' + key())
        .then(function (r) { return r.json(); }, function (e) { if (e && e.status === 404) throw new Error('Такого промокода нет'); throw e; })
        .then(function (d) {
          var p = parsePromo(d);
          if (!p.active) throw new Error('Промокод отключён');
          if (p.exp && Date.now() > p.exp) throw new Error('Срок действия промокода истёк');
          if (p.max && p.used >= p.max) throw new Error('Промокод уже закончился');
          return http(base() + '/' + C('promo_uses') + '/' + encodeURIComponent(code + '__' + u.id) + '?' + key())
            .then(function () { throw new Error('Вы уже активировали этот промокод'); },
              function (e) {
                if (e && e.status !== 404) throw e;
                var body = { writes: [
                  { update: { name: docPath('promos', code), fields: { used: { integerValue: String(p.used + 1) } } }, updateMask: { fieldPaths: ['used'] }, currentDocument: { updateTime: p.updateTime } },
                  { update: { name: docPath('promo_uses', code + '__' + u.id), fields: { code: { stringValue: code }, uid: { stringValue: String(u.id) }, ts: { integerValue: String(Date.now()) } } }, currentDocument: { exists: false } }
                ] };
                return http(base() + ':commit?' + key(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
                  .then(function () { return p; }, function (er) {
                    /* somebody redeemed at the same moment -> re-read and try again (max 4 times) */
                    if (er && (er.status === 409 || er.status === 400 || er.status === 412) && attempt < 4) return once();
                    throw er;
                  });
              });
        });
    }
    return once().then(function (p) {
      var msg;
      if (p.type === 'item') { var gi = window.giftInfo(p.item); NX.addItem({ name: p.item, value: gi.value, nft: !!gi.nft }); msg = 'Вы получили: ' + p.item; }
      else if (p.type === 'free') { u.last_free = 0; msg = 'Бесплатный кейс снова доступен'; }
      else { NX.credit(p.amount); msg = 'Начислено +' + NX.fmt(p.amount) + ' TON'; }
      u.stats = u.stats || {}; NX.stat('promos', 1); NX.save(true);
      return { promo: p, msg: msg };
    });
  };
  net.promoList = function () {
    var out = [];
    function page(tok) {
      return http(base() + '/' + C('promos') + '?pageSize=300&' + key() + (tok ? '&pageToken=' + encodeURIComponent(tok) : '')).then(function (r) { return r.json(); }).then(function (j) {
        (j.documents || []).forEach(function (d) { out.push(parsePromo(d)); });
        if (j.nextPageToken && out.length < 1000) return page(j.nextPageToken);
        out.sort(function (a, b) { return b.ts - a.ts; }); return out;
      });
    }
    return page('');
  };
  /* o: {code, type:'ton'|'item'|'free', amount, item, max, days} */
  net.promoCreate = function (o) {
    var u = NX.user(), code = net.promoNorm(o.code);
    if (!net.promoValid(code)) return Promise.reject(new Error('Код: 3-24 символа, A-Z, 0-9, _ или -'));
    var f = { type: { stringValue: o.type }, amount: { doubleValue: Number(o.amount) || 0 }, item: { stringValue: o.item || '' }, max: { integerValue: String(Math.max(0, parseInt(o.max, 10) || 0)) },
      used: { integerValue: '0' }, exp: { integerValue: String(o.days > 0 ? Date.now() + o.days * 86400000 : 0) }, active: boolF(true), by: { stringValue: String(u.id) }, ts: { integerValue: String(Date.now()) } };
    return http(base() + '/' + C('promos') + '/' + encodeURIComponent(code) + '?currentDocument.exists=false&' + key(), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: f }) })
      .then(function () { return code; }, function (e) { if (e && (e.status === 409 || e.status === 400 || e.status === 412)) throw new Error('Код ' + code + ' уже существует'); throw e; });
  };
  net.promoToggle = function (code, on) {
    return http(base() + '/' + C('promos') + '/' + encodeURIComponent(code) + '?updateMask.fieldPaths=active&' + key(), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { active: boolF(on) } }) });
  };
  net.promoDelete = function (code) {
    return http(base() + '/' + C('promos') + '/' + encodeURIComponent(code) + '?' + key(), { method: 'DELETE' });
  };

  net.start = function () {
    if (!net.enabled()) return;
    net.push(true); net.pollGrants();
    setInterval(function () { if (!document.hidden) { net.push(true); net.pollGrants(); } }, HEART_MS);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { net.push(true); net.pollGrants(); } });
  };
})(window.NX);
