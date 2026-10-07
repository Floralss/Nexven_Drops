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
    var bal = null, free = false, q, sp;
    try { q = new URLSearchParams(location.search || ''); if (q.get('sync')) bal = parseInt(q.get('sync'), 10); if (q.get('free') === '1') free = true; } catch (e) {}
    try {
      if (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) {
        sp = String(tg.initDataUnsafe.start_param);
        if (sp.indexOf('sync_') === 0) bal = parseInt(sp.slice(5), 10);
        if (sp === 'free_ok') free = true;
      }
    } catch (e) {}
    /* the bot's sync link used to overwrite the balance on EVERY open (grants vanished) -> apply each distinct value once */
    if (typeof bal === 'number' && !isNaN(bal) && bal >= 0 && user.sync_seen !== bal) { user.sync_seen = bal; user.balance = bal; setTimeout(function () { NX.toast('Баланс синхронизирован: ' + bal + ' TON', 'success'); NX.sfx('win'); }, 900); }
    if (free) { user.last_free = 0; setTimeout(function () { NX.toast('Бесплатный кейс готов!', 'success'); }, 900); }
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
    var started = false;
    function start(cloud) {
      if (started) return; started = true;
      if (cloud) { if ((cloud.updated_at || 0) >= (user._updated || 0)) NX.unpack(cloud, user); else NX.cloudSave(); }
      applyDeepLink(user);
      prog(75);
      /* views */
      var order = ['games', 'cases', 'top', 'profile', 'plinko', 'mines', 'crash', 'roulette', 'craft'], main = $('main');
      order.forEach(function (n) { var s = document.createElement('section'); s.className = 'view'; s.id = 'v-' + n; main.appendChild(s); });
      order.forEach(function (n) { if (NX.pages[n].build) NX.pages[n].build(); });
      NX.renderAvatar(); NX.renderUser(true); NX.bindModals();
      NX.settleDue(); NX.save(true); if (NX.net) NX.net.start();
      $('nav').onclick = function (e) { var b = e.target.closest('.nb'); if (!b) return; NX.sfx('tab'); NX.haptic('light'); var t = b.getAttribute('data-t'); NX.go(t, { force: NX.cur() !== t }); };
      $('btnAvatar').onclick = function () { NX.sfx('click'); NX.go('profile'); };
      document.addEventListener('click', function (e) { if (e.target.closest('[data-back]')) { NX.sfx('click'); NX.back(); } });
      try { if (tg && tg.BackButton) tg.BackButton.onClick(function () { NX.back(); }); } catch (e) {}
      NX.go('games', { force: true });
      prog(100);
      setInterval(NX.settleDue, 1000);
      setInterval(NX.cloudSave, 15000);
      document.addEventListener('visibilitychange', function () { if (document.hidden) NX.save(true); else NX.settleDue(); });
      setTimeout(function () { $('app').classList.remove('hide'); $('loader').classList.add('out'); setTimeout(function () { $('loader').classList.add('hide'); }, 600); NX.go('games', { force: true }); }, 250);
    }
    try { NX.dynAdmin = localStorage.getItem('nv_adm_' + user.id) === '1'; } catch (e) {}
    function newest(a, b) { if (!a) return b; if (!b) return a; return (b.updated_at || 0) > (a.updated_at || 0) ? b : a; }
    NX.cloudLoad(function (tgCloud) {
      if (!NX.net || !NX.net.enabled()) { start(tgCloud); return; }
      NX.net.pullState().then(function (fs) { start(newest(tgCloud, fs)); }, function () { start(tgCloud); });
    });
    setTimeout(function () { start(null); }, 5500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window.NX);
