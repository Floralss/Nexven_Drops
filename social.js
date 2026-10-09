/* Nexven Drop — shared leaderboard + online presence (Firestore REST) */
(function (NX) {
  'use strict';
  var cfg = window.NEXVEN_CFG || {}, ONLINE_MS = 150000, HEART_MS = 60000;  /* v35: fewer Firestore reads/writes (free quota) */
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
    var now = Date.now(); if (!force && now - lastPush < 30000) return;
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
  /* -> { rows:[{id,name,photo,spent,best,online,seen}], online:N }
     v35: reads only the top 50 players (orderBy spent) + a COUNT aggregation for "online" (1 read per 1000 matches), cached for 60s.
     Falls back to the old full listing if the queries are refused. */
  var boardCache = null, boardAt = 0, boardP = null;
  function rowOf(d, cutoff) {
    var f = d.fields || {}, id = str(f.uid) || d.name.split('/').pop(), seen = num(f.seen);
    return { id: id, name: str(f.name) || 'Игрок', photo: str(f.photo) || null, spent: num(f.spent), best: str(f.bestN) ? { name: str(f.bestN), value: num(f.bestV) } : null, online: seen >= cutoff, seen: seen };
  }
  function fetchBoardRaw() {
    var cutoff = Date.now() - ONLINE_MS;
    var top = query({ from: [{ collectionId: C('players') }], orderBy: [{ field: { fieldPath: 'spent' }, direction: 'DESCENDING' }], limit: 50 })
      .then(function (res) { return res.filter(function (x) { return x.document; }).map(function (x) { return rowOf(x.document, cutoff); }); });
    var online = http(base() + ':runAggregationQuery?' + key(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ structuredAggregationQuery: { structuredQuery: { from: [{ collectionId: C('players') }], where: { fieldFilter: { field: { fieldPath: 'seen' }, op: 'GREATER_THAN_OR_EQUAL', value: { integerValue: String(cutoff) } } } }, aggregations: [{ alias: 'n', count: {} }] } }) })
      .then(function (r) { return r.json(); })
      .then(function (j) { var f = j && j[0] && j[0].result && j[0].result.aggregateFields && j[0].result.aggregateFields.n; return f ? Number(f.integerValue || 0) : null; })
      .catch(function () { return null; });
    return Promise.all([top, online]).then(function (r) {
      var rows = r[0]; rows.sort(function (a, b) { return b.spent - a.spent || b.seen - a.seen; });
      var n = r[1] != null ? r[1] : rows.filter(function (x) { return x.online; }).length;
      return { rows: rows, online: n, total: rows.length };
    }).catch(function (e) {
      if (e && e.status === 429) throw e;
      return listPlayers().then(function (docs) {
        var rows = docs.map(function (d) { return rowOf(d, cutoff); }); rows.sort(function (a, b) { return b.spent - a.spent || b.seen - a.seen; });
        return { rows: rows.slice(0, 200), online: rows.filter(function (x) { return x.online; }).length, total: rows.length };
      });
    });
  }
  net.fetchBoard = function (force) {
    if (!force && boardCache && Date.now() - boardAt < 60000) return Promise.resolve(boardCache);
    if (boardP) return boardP;
    boardP = fetchBoardRaw().then(function (b) { boardCache = b; boardAt = Date.now(); boardP = null; return b; }, function (e) { boardP = null; if (boardCache) return boardCache; throw e; });
    return boardP;
  };
  net.fetchOnline = function () { return net.fetchBoard().then(function (b) { return b.online; }); };
  try { document.addEventListener('visibilitychange', function () { if (document.hidden) net.saveState(true, true); }); } catch (e) {}

  /* ---------- full state in Firestore (survives reinstall / other device) ---------- */
  net.loaded = false;
  var stInflight = false, stDirty = false, stT = null;
  var lastSt = 0;
  net.saveState = function (now, force) {
    var u = NX.user(); if (!net.enabled() || !u || !net.loaded) return;
    if (!now) { clearTimeout(stT); stT = setTimeout(function () { net.saveState(true); }, 2500); return; }
    if (stInflight) { stDirty = true; return; }
    var wait = force ? 0 : lastSt + 20000 - Date.now();   /* v35: at most one cloud write per 20s (local + Telegram CloudStorage keep every change) */
    if (wait > 0) { clearTimeout(stT); stT = setTimeout(function () { net.saveState(true); }, wait); return; }
    lastSt = Date.now(); stInflight = true; stDirty = false;
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

  /* ---------- rewards from the bot (deposits, referrals, promo, admin) ----------
     Two delivery paths, same data: (1) ?rw=<base64url json> in the "Открыть приложение" button, (2) Firestore doc {prefix}rewards/{uid}.
     Each reward has a unique id and is applied ONCE (ids kept in user.grants_done as 'rw:<id>'). */
  net.applyRewards = function (list) {
    var u = NX.user(); if (!u || !Array.isArray(list)) return 0;
    u.grants_done = u.grants_done || []; u.refs = u.refs || [];
    var msgs = [], n = 0;
    list.forEach(function (r) {
      if (!r || r.id == null) return;
      var gid = 'rw:' + r.id; if (u.grants_done.indexOf(gid) >= 0) return;
      u.grants_done.push(gid); n++;
      var ton = Number(r.ton) || 0;
      if (r.ref && r.ref.id != null) {
        var rid = String(r.ref.id), row = null;
        u.refs.forEach(function (x) { if (String(x.id) === rid) row = x; });
        if (!row) { row = { id: rid, name: String(r.ref.name || 'Друг'), earned: 0 }; u.refs.push(row); if (r.src === 'ref') msgs.push('Новый реферал: ' + row.name); }
        if (r.ref.name) row.name = String(r.ref.name);
        if (r.src === 'referral' && ton > 0) { row.earned = NX.r2((row.earned || 0) + ton); msgs.push('Реферал ' + row.name + ': +' + NX.fmt(ton) + ' TON'); }
      }
      if (ton) {
        u.balance = NX.r2(Math.max(0, u.balance + ton));
        if (r.src === 'deposit' && ton > 0) { u.total_deposited = NX.r2((u.total_deposited || 0) + ton); msgs.push('Пополнение: +' + NX.fmt(ton) + ' TON'); }
        else if (r.src === 'promo') msgs.push('Промокод: +' + NX.fmt(ton) + ' TON');
        else if (r.src !== 'referral') msgs.push((ton > 0 ? 'Начислено +' : 'Списано ') + NX.fmt(Math.abs(ton)) + ' TON');
      }
      if (r.free) { u.last_free = 0; msgs.push('Бесплатный кейс готов'); }
      if (Array.isArray(r.gifts)) r.gifts.forEach(function (nm) { try { var gi = window.giftInfo(nm); NX.addItem({ name: nm, value: gi.value, nft: !!gi.nft }); msgs.push('Подарок: ' + nm); } catch (e) {} });
      if (r.wdu && Number(r.wdu) > (u.wd_until || 0)) { u.wd_until = Number(r.wdu); msgs.push('Вывод подарков открыт'); }
    });
    if (n) {
      NX.save(true); try { NX.renderUser(); } catch (e) {}
      msgs.forEach(function (m, i) { setTimeout(function () { NX.toast(m, 'success'); NX.sfx('win'); }, i * 1500); });
      try { var cur = NX.cur(); if (cur && NX.pages[cur] && NX.pages[cur].enter) NX.pages[cur].enter(); } catch (e) {}
    }
    return n;
  };
  /* snapshot of the player's referral list from the bot: [[id, name, earned], ...] (URL ?rs= or Firestore rewards/{uid}.refs) */
  net.applyRefSnapshot = function (rows) {
    var u = NX.user(); if (!u || !Array.isArray(rows)) return;
    u.refs = u.refs || [];
    var changed = false;
    rows.forEach(function (x) {
      var id, name, earned;
      if (Array.isArray(x)) { id = x[0]; name = x[1]; earned = Number(x[2]) || 0; } else if (x) { id = x.id; name = x.name; earned = Number(x.earned) || 0; } else return;
      if (id == null) return; id = String(id);
      var row = null; u.refs.forEach(function (r) { if (String(r.id) === id) row = r; });
      if (!row) { u.refs.push({ id: id, name: String(name || 'Друг'), earned: NX.r2(earned) }); changed = true; return; }
      if (name && row.name !== name) { row.name = String(name); changed = true; }
      if (earned > (row.earned || 0)) { row.earned = NX.r2(earned); changed = true; }
    });
    if (changed) { NX.save(true); try { var cur = NX.cur(); if (cur === 'profile' && NX.pages.profile.enter) NX.pages.profile.enter(); } catch (e) {} }
  };
  function b64json(t) {
    t = String(t).replace(/-/g, '+').replace(/_/g, '/'); while (t.length % 4) t += '=';
    var bin = atob(t), bytes = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return JSON.parse(new TextDecoder('utf-8').decode(bytes));
  }
  net.rewardFromUrl = function () {
    try { var rs = new URLSearchParams(location.search || '').get('rs'); if (rs) net.applyRefSnapshot(b64json(rs)); } catch (e) {}
    try {
      var t = new URLSearchParams(location.search || '').get('rw'); if (!t) return;
      t = t.replace(/-/g, '+').replace(/_/g, '/'); while (t.length % 4) t += '=';
      var bin = atob(t), bytes = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      net.applyRewards([JSON.parse(new TextDecoder('utf-8').decode(bytes))]);
    } catch (e) {}
  };

  /* ---------- BANS (Firestore: {prefix}bans/{uid} = {banned, reason, by, ts}) ---------- */
  net.getBan = function (id) {
    return http(base() + '/' + C('bans') + '/' + encodeURIComponent(String(id)) + '?' + key())
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var f = (j && j.fields) || {}, until = num(f.until);
        if (!(f.banned && f.banned.booleanValue)) return null;
        if (until && until <= Date.now()) return null;      /* timed ban already expired */
        return { banned: true, reason: str(f.reason), until: until };
      })
      .catch(function (e) { if (e && e.status === 404) return null; throw e; });
  };
  /* until = unix ms, 0 = forever */
  net.setBan = function (id, banned, reason, until) {
    var f = { banned: boolF(banned), reason: { stringValue: String(reason || '') }, by: { stringValue: String((NX.user() || {}).id || '') }, ts: { integerValue: String(Date.now()) }, until: { integerValue: String(Math.round(banned ? (until || 0) : 0)) } };
    var mask = Object.keys(f).map(function (k) { return 'updateMask.fieldPaths=' + k; }).join('&');
    return http(base() + '/' + C('bans') + '/' + encodeURIComponent(String(id)) + '?' + mask + '&' + key(), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: f }) }).then(function (r) { return r.json(); });
  };
  net.listBans = function () {
    return http(base() + '/' + C('bans') + '?pageSize=300&' + key()).then(function (r) { return r.json(); }).then(function (j) {
      return (j.documents || []).map(function (d) { var f = d.fields || {}; return { id: d.name.split('/').pop(), banned: !!(f.banned && f.banned.booleanValue), reason: str(f.reason), ts: num(f.ts), until: num(f.until) }; })
        .filter(function (b) { return b.banned && (!b.until || b.until > Date.now()); });
    });
  };
  net.fmtLeft = function (ms) {
    var s = Math.max(0, Math.floor(ms / 1000)), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60, p = [];
    if (d) p.push(d + ' д'); if (d || h) p.push(h + ' ч'); p.push(m + ' мин'); if (!d) p.push(sec + ' с');
    return p.join(' ');
  };
  /* Everything behind the overlay is blurred (backdrop-filter) and made inert; the card shows the term with a live countdown. */
  var banTick = null;
  function hideBanScreen() {
    clearInterval(banTick); banTick = null;
    var el = document.getElementById('banScreen'); if (el) el.remove();
    var app = document.getElementById('app'); if (app) app.removeAttribute('inert');
  }
  function showBanScreen(reason, until) {
    var ex = document.getElementById('banScreen'); if (ex) ex.remove(); clearInterval(banTick);
    var d = document.createElement('div'); d.id = 'banScreen';
    d.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(5,10,8,.45);-webkit-backdrop-filter:blur(16px) saturate(.8);backdrop-filter:blur(16px) saturate(.8);font-family:system-ui,-apple-system,sans-serif;color:#fff;touch-action:none';
    var until_s = until ? new Date(until).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    d.innerHTML = '<div style="width:100%;max-width:340px;text-align:center;padding:26px 22px;border-radius:22px;background:rgba(10,20,16,.82);border:1px solid rgba(255,80,80,.35);box-shadow:0 20px 60px rgba(0,0,0,.5)">' +
      '<div style="font-size:46px;line-height:1;margin-bottom:10px">⛔</div>' +
      '<div style="font-size:21px;font-weight:800;margin-bottom:8px">Вы заблокированы</div>' +
      '<div style="font-size:14px;opacity:.75;line-height:1.45;margin-bottom:14px">Доступ к приложению закрыт администрацией.</div>' +
      '<div style="padding:12px;border-radius:14px;background:rgba(255,255,255,.06);margin-bottom:10px">' +
        '<div style="font-size:12px;opacity:.6;margin-bottom:4px">' + (until ? 'Осталось' : 'Срок блокировки') + '</div>' +
        '<div id="banLeft" style="font-size:20px;font-weight:800;color:#ff8a8a">' + (until ? NX.esc(net.fmtLeft(until - Date.now())) : 'навсегда') + '</div>' +
        (until ? '<div style="font-size:12px;opacity:.6;margin-top:4px">до ' + NX.esc(until_s) + '</div>' : '') + '</div>' +
      (reason ? '<div style="font-size:14px;margin-bottom:14px"><span style="opacity:.6">Причина:</span> ' + NX.esc(reason) + '</div>' : '<div style="height:6px"></div>') +
      '<a href="https://t.me/nexvendropmananger" style="display:block;padding:13px;border-radius:14px;background:#2de6a0;color:#04130c;font-weight:800;text-decoration:none">Написать в поддержку</a></div>';
    document.body.appendChild(d);
    var app = document.getElementById('app'); if (app) app.setAttribute('inert', '');
    if (until) banTick = setInterval(function () {
      var left = until - Date.now(), el = document.getElementById('banLeft');
      if (left <= 0) { hideBanScreen(); try { NX.toast('Блокировка закончилась', 'success'); } catch (e) {} return; }
      if (el) el.textContent = net.fmtLeft(left);
    }, 1000);
  }
  var banT = 0;
  net.checkBan = function (force) {
    var u = NX.user(); if (!net.enabled() || !u) return;
    if (NX.isStaff && NX.isStaff()) return;      /* staff can't be locked out */
    var now = Date.now(); if (!force && now - banT < 120000) return; banT = now;
    net.getBan(u.id).then(function (b) { if (b && b.banned) showBanScreen(b.reason, b.until); else hideBanScreen(); }, function () {});
  };
  var polling2 = false, lastRw = 0;
  function refHint(t) { try { var el = document.getElementById('refSync'); if (el) el.textContent = t || ''; } catch (e) {} }
  net.pollRewards = function () {
    var u = NX.user(); if (!net.enabled() || !u || !NX.ready || polling2 || Date.now() - lastRw < 30000) return; polling2 = true; lastRw = Date.now();
    http(base() + '/' + C('rewards') + '/' + encodeURIComponent(String(u.id)) + '?' + key())
      .then(function (r) { return r.json(); })
      .then(function (j) {
        polling2 = false;
        var raw = j && j.fields && j.fields.rewards && j.fields.rewards.stringValue, list = [];
        try { list = raw ? JSON.parse(raw) : []; } catch (e) {}
        try { var rf = j && j.fields && j.fields.refs && j.fields.refs.stringValue; if (rf) net.applyRefSnapshot(JSON.parse(rf)); } catch (e) {}
        var wd = j && j.fields && j.fields.wd_until && Number(j.fields.wd_until.integerValue || 0);
        if (wd && wd > (u.wd_until || 0)) { u.wd_until = wd; NX.save(); }
        net.applyRewards(list);
        if (!(u.refs || []).length) refHint('Синхронизация: данных от бота пока нет');
      })
      .catch(function (e) { polling2 = false; refHint(e && e.status === 404 ? 'Синхронизация: от бота пока ничего нет (документ не создан — проверь /fscheck в боте)' : 'Синхронизация: ' + (net.err || (e && e.message) || 'ошибка')); });
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
          if (!seen) {
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
    net.push(true); net.pollGrants(); net.pollRewards(); net.checkBan();
    setInterval(function () { if (!document.hidden) { net.push(true); net.pollGrants(); net.pollRewards(); net.checkBan(); } }, HEART_MS);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { net.push(true); net.pollGrants(); net.pollRewards(); net.checkBan(); } });
  };
})(window.NX);
