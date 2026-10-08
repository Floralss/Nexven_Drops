/* Nexven Drop — bootstrap */
(function (NX) {
  'use strict';
  var $ = NX.$, tg = NX.tg;

  function tgUser() {
    try { if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) return tg.initDataUnsafe.user; } catch (e) {}
    try {
      var raw = tg && tg.initData;
      if (raw) { var u = JSON.parse(new URLSearchParams(raw).get('user') || '{}'); if (u && u.id) return u; }
    } catch (e) {}
    return { id: 999001, first_name: 'Test', username: 'test', photo_url: null };
  }

  function applyDeepLink(user) {
    var bal = null, free = false, acc = null, q, sp, m;
    try { q = new URLSearchParams(location.search || ''); if (q.get('sync')) bal = parseFloat(String(q.get('sync')).replace(',', '.')); if (q.get('free') === '1') free = true; if (q.get('acc')) acc = parseInt(q.get('acc'), 10); } catch (e) {}
    try {
      if (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) {
        sp = String(tg.initDataUnsafe.start_param);
        /* sync_12_5 = 12.5 TON; optional access suffix: sync_12_5_acc_1791500000 (withdrawal access until that unix time, seconds); or just acc_1791500000 */
        m = /^sync_(\d+(?:_\d+)?)(?:_acc_(\d+))?$/.exec(sp);
        if (m) { bal = parseFloat(m[1].replace('_', '.')); if (m[2]) acc = parseInt(m[2], 10); }
        else if (sp.indexOf('sync_') === 0) bal = parseFloat(sp.slice(5).replace('_', '.'));
        else if ((m = /^acc_(\d+)$/.exec(sp))) acc = parseInt(m[1], 10);
        if (sp === 'free_ok') free = true;
      }
    } catch (e) {}
    /* a sync link is applied ONCE; re-opening the same stale link no longer resets the balance */
    if (typeof bal === 'number' && !isNaN(bal) && bal >= 0 && bal !== user.last_sync) {
      bal = NX.r2(bal); user.balance = bal; user.last_sync = bal;
      setTimeout(function () { NX.toast('Баланс синхронизирован: ' + bal + ' TON', 'success'); NX.sfx('win'); }, 900);
    }
    if (acc && !isNaN(acc)) {
      var until = acc * 1000;  /* seconds -> ms; never accept more than ~8 days ahead */
      if (until > Date.now() && until < Date.now() + (NX.WD_ACCESS_DAYS + 1) * 86400000 && until > (user.wd_until || 0)) {
        user.wd_until = until;
        setTimeout(function () { NX.toast('Вывод подарков открыт на ' + NX.WD_ACCESS_DAYS + ' дн.', 'success'); NX.sfx('win'); }, 1500);
      }
    }
    if (free && !user.free_link_done) { user.last_free = 0; user.free_link_done = true; setTimeout(function () { NX.toast('Бесплатный кейс готов!', 'success'); }, 900); }
    try {  /* bot rejected / cancelled a withdrawal: give the item back */
      var wdNo = new URLSearchParams(location.search || '').get('wd_cancel');
      if (wdNo && user.inventory) {
        user.inventory.forEach(function (it) { if (it.wd_id && it.status === 'withdrawing' && (String(it.wd_id) === wdNo || String(it.wd_id).slice(-8) === wdNo)) { delete it.status; delete it.wd_id; delete it.wd_at; } });
        setTimeout(function () { NX.toast('Заявка на вывод отклонена — подарок возвращён в инвентарь', 'error'); }, 900);
      }
    } catch (e) {}
    try {
      var wdOk = new URLSearchParams(location.search || '').get('wd_ok');
      if (wdOk && user.inventory) {
        var before = user.inventory.length;
        user.inventory = user.inventory.filter(function (it) { return !(it.wd_id && (String(it.wd_id) === wdOk || String(it.wd_id).slice(-8) === wdOk)); });
        if (user.inventory.length < before) setTimeout(function () { NX.toast('Вывод выполнен — предмет удалён', 'success'); NX.sfx('win'); }, 900);
      }
    } catch (e) {}
  }

  function trackReferral(user) {
    try {
      var sp = tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param;
      if (sp && String(sp).indexOf('ref_') === 0) {
        var inviter = String(sp).slice(4);
        if (inviter && inviter !== String(user.id)) {
          var key = 'nv_refs_' + inviter, arr = [];
          try { arr = JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) {}
          if (!arr.some(function (r) { return String(r.id) === String(user.id); })) { arr.push({ id: user.id, name: user.first_name || 'Друг', earned: 0 }); localStorage.setItem(key, JSON.stringify(arr)); }
        }
      }
    } catch (e) {}
  }

  function boot() {
    var fill = $('ldFill'); function prog(p) { if (fill) fill.style.width = p + '%'; }
    $('ldLogo').innerHTML = window.ART.logo(84); $('balIcon').innerHTML = NX.tonI(22);
    prog(20);
    var tu = tgUser(), loc = NX.loadLocal(tu.id);
    var user = { id: tu.id, first_name: tu.first_name || 'Игрок', username: tu.username || '', photo_url: tu.photo_url || null,
      balance: 0, inventory: [], inventory_cs2: [], last_free: 0, total_deposited: 0, total_spent: 0, stats: {}, pend: [], mn: null, wd_requests: [], _updated: 0 };
    if (loc) NX.unpack(loc, user);
    NX.setUser(user); trackReferral(user);
    prog(45);
    var started = false, got = { cloud: undefined, remote: undefined };
    function newest() {
      var best = null;
      [got.cloud, got.remote].forEach(function (o) { if (o && (o.updated_at || 0) >= (user._updated || 0) && (!best || (o.updated_at || 0) > (best.updated_at || 0))) best = o; });
      return best;
    }
    function start() {
      if (started) return; started = true;
      var b = newest(); if (b) NX.unpack(b, user);
      applyDeepLink(user);
      /* v25: re-price items the player already owns by the current catalog (gifts.js), so old prices can't be farmed. Items on withdrawal keep their price. */
      try { (user.inventory || []).forEach(function (it) { var g = window.GIFTS && window.GIFTS[it.name]; if (g && it.status !== 'withdrawing' && it.value !== g.value) { it.value = g.value; it.nft = !!g.nft; } }); } catch (e) {}
      prog(75);
      var order = ['games', 'cases', 'top', 'profile', 'plinko', 'mines', 'crash', 'roulette', 'craft'], main = $('main');
      order.forEach(function (n) { var s = document.createElement('section'); s.className = 'view'; s.id = 'v-' + n; main.appendChild(s); });
      order.forEach(function (n) { try { if (NX.pages[n].build) NX.pages[n].build(); } catch (e) { console.error(e); } });
      NX.renderAvatar(); NX.renderUser(true); NX.bindModals();
      NX.ready = true;
      NX.settleDue(); NX.save(true);
      if (NX.net) { NX.net.start(); NX.net.retryLoad(function (o) { NX.unpack(o, user); NX.save(); NX.renderUser(true); NX.go(NX.cur() || 'games', { force: true }); }); }
      $('nav').onclick = function (e) { var b = e.target.closest('.nb'); if (!b) return; NX.sfx('tab'); NX.haptic('light'); var t = b.getAttribute('data-t'); NX.go(t, { force: NX.cur() !== t }); };
      $('btnAvatar').onclick = function () { NX.sfx('click'); NX.go('profile'); };
      document.addEventListener('click', function (e) { if (e.target.closest('[data-back]')) { NX.sfx('click'); NX.back(); } });
      try { if (tg && tg.BackButton) tg.BackButton.onClick(function () { NX.back(); }); } catch (e) {}
      NX.go('games', { force: true });
      prog(100);
      setInterval(NX.settleDue, 1000);
      setInterval(function () { NX.cloudSave(); if (NX.net) NX.net.saveState(false); }, 15000);
      function flush() { NX.save(true); }
      document.addEventListener('visibilitychange', function () { if (document.hidden) flush(); else NX.settleDue(); });
      window.addEventListener('pagehide', flush);
      try { if (tg && tg.onEvent) tg.onEvent('viewportChanged', function (e) { if (e && e.isStateStable === false) return; }); } catch (e) {}
      setTimeout(function () { $('app').classList.remove('hide'); $('loader').classList.add('out'); setTimeout(function () { $('loader').classList.add('hide'); }, 600); NX.go('games', { force: true }); }, 250);
    }
    var waiting = 2;
    function step() { if (--waiting <= 0) start(); }
    NX.cloudLoad(function (c) { got.cloud = c; step(); });
    if (NX.net && NX.net.enabled()) NX.net.loadState(function (o) { got.remote = o; step(); }); else step();
    setTimeout(start, 5200);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window.NX);

/* global safety net: never leave the user stuck behind a dead overlay */
(function (NX) {
  window.addEventListener('error', function () { try { if (NX.openGuard) NX.openGuard(); } catch (e) {} });
  window.addEventListener('unhandledrejection', function (e) { try { e.preventDefault(); } catch (x) {} });
  document.addEventListener('visibilitychange', function () { if (!document.hidden && NX.openGuard) setTimeout(NX.openGuard, 300); });
})(window.NX);
