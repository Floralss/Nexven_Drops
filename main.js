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
    if (typeof bal === 'number' && !isNaN(bal) && bal >= 0) { user.balance = bal; setTimeout(function () { NX.toast('Баланс синхронизирован: ' + bal + ' TON', 'success'); NX.sfx('win'); }, 900); }
    try { var dep = q && parseFloat(q.get('dep')); if (!dep && sp && /^(sync_\d+_)?dep_/.test(sp)) dep = parseFloat(sp.split('dep_')[1]); if (dep > 0 && !isNaN(dep)) { var dk = 'dep_' + (q && q.get('dt') || dep); user.dep_seen = user.dep_seen || []; if (user.dep_seen.indexOf(dk) < 0) { user.dep_seen.push(dk); user.total_deposited = NX.r2((user.total_deposited || 0) + dep); } } } catch (e) {}
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
      if (user.ref_by) return;
      var sp = tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param;
      if (sp && String(sp).indexOf('ref_') === 0) {
        var inviter = String(sp).slice(4).replace(/[^0-9]/g, '');
        if (inviter && inviter !== String(user.id)) user.ref_by = inviter;
      }
    } catch (e) {}
  }

  /* admin grants + referral earnings, applied on start and every 20s */
  function syncRemote() {
    var u = NX.user(); if (!u || !NX.net.enabled()) return;
    NX.net.fetchGrants(u.id).then(function (gs) {
      gs.forEach(function (g) {
        NX.net.dropGrant(g.path).then(function () {
          if (g.kind === 'ton') { NX.credit(g.amount); NX.toast('Вам начислено ' + NX.fmt(g.amount) + ' TON', 'success'); NX.sfx('win'); }
          else if (g.kind === 'take') { NX.credit(-Math.min(g.amount, u.balance)); NX.toast('С баланса списано ' + NX.fmt(g.amount) + ' TON', 'error'); }
          else if (g.kind === 'free') { u.last_free = 0; NX.save(true); NX.toast('Бесплатный кейс готов!', 'success'); }
          else if (g.kind === 'case') { u.cc = u.cc || {}; u.cc[g.caseId] = (u.cc[g.caseId] || 0) + Math.round(g.amount); NX.save(true); NX.toast('Вам выдан кейс ×' + Math.round(g.amount), 'success'); NX.sfx('win'); }
        }, function () {});
      });
    }, function () {});
    NX.net.fetchRefs(u.id).then(function (rl) {
      u.ref_paid = u.ref_paid || {}; var add = 0;
      rl.forEach(function (r) {
        var earned = NX.r2(r.dep * 0.02), paid = u.ref_paid[r.id] || 0;
        if (earned > paid) { add += earned - paid; u.ref_paid[r.id] = earned; }
      });
      add = NX.r2(add);
      if (add > 0) { NX.credit(add); NX.toast('Реферальный бонус +' + NX.fmt(add) + ' TON', 'success'); }
    }, function () {});
  }
  NX.syncRemote = syncRemote;

  function boot() {
    var fill = $('ldFill'); function prog(p) { if (fill) fill.style.width = p + '%'; }
    $('ldLogo').innerHTML = window.ART.logo(84); $('balIcon').innerHTML = NX.tonI(22);
    prog(20);
    var tu = tgUser(), loc = NX.loadLocal(tu.id);
    var user = { id: tu.id, first_name: tu.first_name || 'Игрок', username: tu.username || '', photo_url: tu.photo_url || null,
      balance: 0, inventory: [], inventory_cs2: [], last_free: 0, total_deposited: 0, total_spent: 0, stats: {}, pend: [], mn: null, wd_requests: [], cc: {}, promos_used: [], ref_by: '', ref_paid: {}, _updated: 0 };
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
      setTimeout(syncRemote, 1500); setInterval(function () { if (!document.hidden) syncRemote(); }, 20000);
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
    NX.cloudLoad(start);
    setTimeout(function () { start(null); }, 3800);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window.NX);
