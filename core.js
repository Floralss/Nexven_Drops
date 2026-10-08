/* Nexven Drop — core: helpers, state, storage, routing, fx */
(function (w) {
  'use strict';
  var NX = w.NX = { pages: {}, pendH: {} };
  var doc = document;

  var tg = w.Telegram && w.Telegram.WebApp;
  NX.tg = tg;
  if (tg) {
    try { tg.ready(); tg.expand(); tg.setHeaderColor('#0b0c10'); tg.setBackgroundColor('#0b0c10'); } catch (e) {}
    try { if (tg.disableVerticalSwipes) tg.disableVerticalSwipes(); } catch (e) {}
  }

  NX.OWNER_ID = 8920532333;
  NX.ADMIN_IDS = [7064801154, 8866989412];
  NX.BOT = 'nexvendrop_bot';
  /* promo codes: true = every admin can create TON codes; false = only the owner (admins can still create gift / free-case codes) */
  NX.PROMO_ADMINS_CAN_TON = true;
  var LS = 'iz_v6_', CS_KEY = 'iz_user_v6';

  /* ---------- tiny helpers ---------- */
  var $ = NX.$ = function (id) { return doc.getElementById(id); };
  NX.q = function (sel, root) { return (root || doc).querySelector(sel); };
  NX.qa = function (sel, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); };
  NX.r2 = function (x) { return Math.round((Number(x) || 0) * 100) / 100; };
  NX.fmt = function (x) {
    x = NX.r2(x);
    try { return x.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); } catch (e) { return String(x); }
  };
  NX.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  /* compact number for the leaderboard (1.5M, 22.5Qi ...) so huge test values never overflow the row */
  NX.fmtShort = function (x) {
    x = Number(x) || 0; if (x < 1e6) return NX.fmt(x);
    var u = ['K', 'M', 'B', 'T', 'Qa', 'Qi'], i = 0, y = x / 1000;
    while (y >= 1000 && i < u.length - 1) { y /= 1000; i++; }
    return (Math.round(y * 100) / 100).toLocaleString('ru-RU') + u[i];
  };
  NX.STARS_PER_TON = Number((window.NEXVEN_CFG || {}).starsPerTon) || 100;
  (function () {
    var c = window.NEXVEN_CFG || {};
    NX.DEP_MIN_STARS = Number(c.depositMinStars) || 10;
    NX.WD_MIN_TON = Number(c.wdMinTon) || 1;
    NX.WD_ACCESS_STARS = Number(c.wdAccessStars) || 100;
    NX.WD_ACCESS_DAYS = Number(c.wdAccessDays) || 7;
  })();
  /* withdrawal access: user.wd_until = ms timestamp until which gift withdrawal is unlocked (granted by the bot after a >= 100 Stars top-up) */
  NX.wdAccessLeft = function () { var u = NX.user(); return u && u.wd_until ? Math.max(0, u.wd_until - Date.now()) : 0; };
  NX.wdAccessOn = function () { return NX.wdAccessLeft() > 0; };
  NX.wdAccessText = function () {
    var ms = NX.wdAccessLeft(), d = Math.floor(ms / 86400000), h = Math.floor(ms % 86400000 / 3600000), m = Math.floor(ms % 3600000 / 60000);
    return d > 0 ? d + ' дн. ' + h + ' ч.' : h > 0 ? h + ' ч. ' + m + ' мин.' : Math.max(1, m) + ' мин.';
  };
  NX.tonI = function (s) { return w.ART.ton(s || 16); };
  NX.sameId = function (a, b) { return Number(a) === Number(b); };
  NX.rand = function () {
    try { var a = new Uint32Array(1); w.crypto.getRandomValues(a); return a[0] / 4294967296; } catch (e) { return Math.random(); }
  };
  NX.randInt = function (n) { return Math.floor(NX.rand() * n); };
  /* deterministic per-round randomness (shared between players) */
  NX.seeded = function (id, salt) {
    var a = (Math.floor(id) ^ (salt * 2654435761)) >>> 0;
    a = (a + 0x6D2B79F5) >>> 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    var r = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    /* second pass for better spread */
    var x = Math.sin(id * 12.9898 + salt * 78.233) * 43758.5453;
    return (r + (x - Math.floor(x))) % 1;
  };
  NX.ease = {
    out4: function (t) { return 1 - Math.pow(1 - t, 4); },
    out5: function (t) { return 1 - Math.pow(1 - t, 5); },
    io3: function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  };
  NX.tier = function (value, nft) {
    if (value >= 100) return '#ffc857';
    if (value >= 20) return '#ff6aa8';
    if (value >= 5 || nft) return '#a971ff';
    if (value >= 0.5) return '#4aa3ff';
    return '#8d94a8';
  };

  /* ---------- feedback ---------- */
  var toastT;
  NX.toast = function (m, t) {
    var el = $('toast'); if (!el) return;
    el.textContent = m; el.className = 'toast ' + (t === 'error' ? 'err' : t === 'success' ? 'ok' : '');
    void el.offsetWidth; el.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove('on'); }, 2600);
  };
  NX.haptic = function (k) {
    try {
      var h = tg && tg.HapticFeedback; if (!h) return;
      if (k === 'success' || k === 'error' || k === 'warning') h.notificationOccurred(k);
      else if (k === 'select') h.selectionChanged();
      else h.impactOccurred(k || 'light');
    } catch (e) {}
  };
  var actx = null, muted = false;
  try { muted = localStorage.getItem('nv_mute') === '1'; } catch (e) {}
  NX.isMuted = function () { return muted; };
  NX.setMuted = function (m) { muted = !!m; try { localStorage.setItem('nv_mute', m ? '1' : '0'); } catch (e) {} };
  function ctx() {
    if (!actx) { try { actx = new (w.AudioContext || w.webkitAudioContext)(); } catch (e) { return null; } }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  function beep(f, d, type, v, delay, slide) {
    if (muted) return;
    try {
      var c = ctx(); if (!c) return;
      var t0 = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + d);
      g.gain.setValueAtTime(v || 0.06, t0); g.gain.exponentialRampToValueAtTime(0.0008, t0 + d);
      o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + d + 0.03);
    } catch (e) {}
  }
  NX.sfx = function (n) {
    if (n === 'click') beep(520, .04, 'sine', .035);
    else if (n === 'tab') beep(440, .05, 'sine', .03, 0, 620);
    else if (n === 'tick') beep(1100 + Math.random() * 120, .025, 'square', .018);
    else if (n === 'open') { beep(260, .12, 'triangle', .06, 0, 520); beep(520, .16, 'triangle', .05, .1, 880); }
    else if (n === 'win') { beep(523, .12, 'sine', .09); beep(659, .12, 'sine', .09, .1); beep(784, .22, 'sine', .1, .2); beep(1046, .3, 'sine', .08, .32); }
    else if (n === 'big') { [523, 659, 784, 1046, 1318].forEach(function (f, i) { beep(f, .22, 'triangle', .09, i * .09); }); }
    else if (n === 'lose') beep(220, .28, 'sawtooth', .04, 0, 110);
    else if (n === 'gem') { beep(880, .09, 'sine', .07); beep(1320, .14, 'sine', .06, .06); }
    else if (n === 'boom') beep(120, .45, 'sawtooth', .09, 0, 40);
    else if (n === 'peg') beep(700 + Math.random() * 500, .04, 'triangle', .03);
    else if (n === 'land') beep(300, .12, 'sine', .07, 0, 180);
  };
  doc.addEventListener('touchstart', function () { ctx(); }, { once: true, passive: true });
  doc.addEventListener('click', function () { ctx(); }, { once: true });

  /* ---------- state ---------- */
  var user = null;
  NX.user = function () { return user; };
  NX.isStaff = function () {
    if (!user) return false;
    if (NX.sameId(user.id, NX.OWNER_ID)) return true;
    return NX.ADMIN_IDS.some(function (id) { return NX.sameId(user.id, id); });
  };
  NX.isOwner = function () { return user && NX.sameId(user.id, NX.OWNER_ID); };

  function slimStats(st) {
    st = st || {}; var o = {}, k;
    for (k in st) o[k] = st[k];
    if (o.pl && o.pl.length > 15) o.pl = o.pl.slice(-15);
    return o;
  }
  function pack() {
    return JSON.stringify({
      balance: NX.r2(user.balance), inventory: user.inventory || [], inventory_cs2: user.inventory_cs2 || [],
      last_free: user.last_free || 0, total_deposited: user.total_deposited || 0, total_spent: NX.r2(user.total_spent || 0),
      stats: slimStats(user.stats), pend: user.pend || [], mn: user.mn || null, wd_requests: (user.wd_requests || []).slice(-15),
      grants_done: (user.grants_done || []).slice(-60), wd_until: user.wd_until || 0, last_sync: user.last_sync == null ? null : user.last_sync, updated_at: Date.now()
    });
  }
  function unpack(raw, into) {
    try {
      var d = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!d || typeof d !== 'object') return into;
      if (typeof d.balance === 'number') into.balance = d.balance;
      if (Array.isArray(d.inventory)) into.inventory = d.inventory;
      if (Array.isArray(d.inventory_cs2)) into.inventory_cs2 = d.inventory_cs2;
      if (typeof d.last_free === 'number') into.last_free = d.last_free;
      if (typeof d.total_deposited === 'number') into.total_deposited = d.total_deposited;
      if (typeof d.total_spent === 'number') into.total_spent = d.total_spent;
      if (d.stats && typeof d.stats === 'object') into.stats = d.stats;
      if (Array.isArray(d.pend)) into.pend = d.pend;
      if (d.mn !== undefined) into.mn = d.mn;
      if (Array.isArray(d.wd_requests)) into.wd_requests = d.wd_requests;
      if (Array.isArray(d.grants_done)) into.grants_done = d.grants_done;
      if (typeof d.wd_until === 'number') into.wd_until = Math.max(into.wd_until || 0, d.wd_until);
      if (d.last_sync !== undefined) into.last_sync = d.last_sync;
      into._updated = d.updated_at || 0;
    } catch (e) {}
    return into;
  }
  NX.pack = pack; NX.unpack = unpack;
  NX.loadLocal = function (id) { try { var r = localStorage.getItem(LS + id); return r ? JSON.parse(r) : null; } catch (e) { return null; } };
  function saveLocal() { if (user) try { localStorage.setItem(LS + user.id, pack()); NX.lastSaved = Date.now(); } catch (e) {} }
  var CH = 3600, cloudBusy = false, cloudDirty = false;
  NX.lastSaved = 0;
  NX.cloudSave = function () {
    saveLocal();
    if (!tg || !tg.CloudStorage) return;
    if (cloudBusy) { cloudDirty = true; return; }
    cloudBusy = true; cloudDirty = false;
    var s, parts = [], i;
    try { s = pack(); for (i = 0; i < s.length; i += CH) parts.push(s.slice(i, i + CH)); } catch (e) { cloudBusy = false; return; }
    var k = 0, n = parts.length, st = tg.CloudStorage;
    function finish() { cloudBusy = false; if (cloudDirty) NX.cloudSave(); }
    (function next() {
      try {
        if (k < n) st.setItem('nx7_' + k, parts[k], function (err) { if (err) { finish(); return; } k++; next(); });
        else st.setItem('nx7_n', String(n), function () { finish(); });
      } catch (e) { finish(); }
    })();
  };
  NX.cloudLoad = function (cb) {
    if (!tg || !tg.CloudStorage) { cb(null); return; }
    var done = false, t = setTimeout(function () { fin(null); }, 3000);
    function fin(v) { if (done) return; done = true; clearTimeout(t); cb(v); }
    function legacy() {
      try { tg.CloudStorage.getItem(CS_KEY, function (err, val) { if (err || !val) { fin(null); return; } try { fin(JSON.parse(val)); } catch (e) { fin(null); } }); } catch (e) { fin(null); }
    }
    try {
      tg.CloudStorage.getItem('nx7_n', function (err, n) {
        n = parseInt(n, 10);
        if (err || !n) { legacy(); return; }
        var keys = [], i; for (i = 0; i < n; i++) keys.push('nx7_' + i);
        tg.CloudStorage.getItems(keys, function (err2, vals) {
          if (err2 || !vals) { legacy(); return; }
          var s = ''; for (i = 0; i < n; i++) s += vals['nx7_' + i] || '';
          try { fin(JSON.parse(s)); } catch (e) { legacy(); }
        });
      });
    } catch (e) { legacy(); }
  };
  var saveT = null;
  NX.ready = false;
  function persist(now) {
    NX.cloudSave();
    if (NX.net) NX.net.saveState(now);
  }
  NX.save = function (now) {
    saveLocal(); touchLb();
    if (!NX.ready) return;
    if (NX.net) NX.net.push();
    if (now) { clearTimeout(saveT); persist(true); return; }
    clearTimeout(saveT); saveT = setTimeout(function () { persist(false); }, 700);
  };
  NX.setUser = function (u) { user = u; };

  /* local leaderboard (same device storage; shape kept from previous versions) */
  function touchLb() {
    if (!user) return;
    try {
      var rows = JSON.parse(localStorage.getItem('nv_top') || '[]');
      var mine = { id: user.id, name: user.first_name || 'Игрок', spent: NX.r2(user.total_spent || 0), photo: user.photo_url || null, best: (user.stats && user.stats.best) || null };
      var i = rows.findIndex(function (r) { return String(r.id) === String(user.id); });
      if (i >= 0) rows[i] = mine; else rows.push(mine);
      localStorage.setItem('nv_top', JSON.stringify(rows));
    } catch (e) {}
  }

  /* ---------- money ---------- */
  var shownBal = null, balAnim = 0;
  NX.renderUser = function (instant) {
    if (!user) return;
    var el = $('balanceTON'), pill = $('balPill');
    var to = NX.r2(user.balance);
    if (shownBal == null || instant) { shownBal = to; el.textContent = NX.fmt(to); return; }
    if (to === shownBal) { el.textContent = NX.fmt(to); return; }
    var from = shownBal, t0 = performance.now(), dur = 650, id = ++balAnim, up = to > from;
    pill.classList.remove('up', 'down', 'bump'); void pill.offsetWidth;
    pill.classList.add(up ? 'up' : 'down', 'bump');
    shownBal = to;
    (function step(now) {
      if (id !== balAnim) return;
      var p = Math.min(1, (now - t0) / dur), v = from + (to - from) * NX.ease.out4(p);
      el.textContent = NX.fmt(v);
      if (p < 1) requestAnimationFrame(step);
      else { el.textContent = NX.fmt(to); setTimeout(function () { pill.classList.remove('up', 'down'); }, 500); }
    })(t0);
  };
  NX.renderAvatar = function () {
    var av = $('avatar');
    if (user.photo_url) { av.innerHTML = '<img src="' + NX.esc(user.photo_url) + '" alt="">'; var im = av.firstChild; im.onerror = function () { av.textContent = ((user.first_name || '?')[0] || '?').toUpperCase(); }; }
    else av.textContent = ((user.first_name || '?')[0] || '?').toUpperCase();
  };
  NX.canPay = function (amt) { return amt > 0 && NX.r2(user.balance) + 1e-9 >= amt; };
  NX.spend = function (amt) {
    amt = NX.r2(amt); user.balance = NX.r2(user.balance - amt); user.total_spent = NX.r2((user.total_spent || 0) + amt);
    NX.save(); NX.renderUser();
  };
  NX.credit = function (amt) {
    amt = NX.r2(amt); if (!amt) return; user.balance = NX.r2(user.balance + amt); NX.save(); NX.renderUser();
  };
  /* wipe the account's all-time numbers (balance, turnover for the leaderboard, best gift, stats, pending payouts) */
  NX.resetAccount = function (withInventory) {
    user.balance = 0; user.total_spent = 0; user.total_deposited = 0; user.stats = {}; user.pend = [];
    if (withInventory) user.inventory = [];
    NX.save(true); NX.renderUser(true);
    if (NX.net) NX.net.push(true);
  };
  NX.stat = function (k, inc) { user.stats = user.stats || {}; user.stats[k] = (user.stats[k] || 0) + (inc == null ? 1 : inc); };
  NX.noteBest = function (name, value) {
    user.stats = user.stats || {};
    if (!user.stats.best || value > user.stats.best.value) user.stats.best = { name: name, value: value };
  };
  NX.addItem = function (it) {
    user.inventory = user.inventory || [];
    var e = { id: Date.now() + Math.random(), name: it.name, value: it.value, nft: !!it.nft, ts: Date.now() };
    user.inventory.unshift(e);
    NX.noteBest(it.name, it.value);
    return e;
  };

  /* ---------- pending (deterministic delayed payouts, survives app close) ---------- */
  NX.addPend = function (e) { user.pend = user.pend || []; e.id = e.id || (Date.now() + '_' + Math.floor(Math.random() * 1e6)); user.pend.push(e); NX.save(true); return e; };
  NX.findPend = function (type) { return (user.pend || []).filter(function (e) { return e.t === type; })[0]; };
  NX.dropPend = function (id) { user.pend = (user.pend || []).filter(function (e) { return e.id !== id; }); };
  NX.settleDue = function () {
    if (!user || !user.pend || !user.pend.length) return;
    var now = Date.now(), list = user.pend.slice(), changed = false;
    list.forEach(function (e) {
      var h = NX.pendH[e.t]; if (!h) { NX.dropPend(e.id); changed = true; return; }
      var res = h(e, now);
      if (res && typeof res.pay === 'number') {
        NX.dropPend(e.id); changed = true;
        if (res.pay > 0) { user.balance = NX.r2(user.balance + res.pay); }
        if (res.after) try { res.after(); } catch (er) {}
      }
    });
    if (changed) { NX.save(); NX.renderUser(); }
  };

  /* ---------- modals / sheets ---------- */
  NX.open = function (id) { var el = $(id); if (el) { el.classList.add('on'); NX.haptic('light'); } };
  NX.close = function (id) { var el = $(id); if (el) el.classList.remove('on'); };
  doc.addEventListener('click', function (e) {
    var c = e.target.closest && e.target.closest('[data-close]');
    if (c) { NX.close(c.getAttribute('data-close')); }
  });

  /* ---------- routing ---------- */
  var TAB_OF = { cases: 'cases', top: 'top', games: 'games', profile: 'profile', plinko: 'games', mines: 'games', crash: 'games', roulette: 'games', craft: 'games' };
  var TAB_ORDER = ['cases', 'top', 'games', 'profile'];
  var cur = null;
  NX.cur = function () { return cur; };
  NX.go = function (name, opt) {
    if (!NX.pages[name]) return;
    opt = opt || {};
    if (cur === name && !opt.force) return;
    var from = cur;
    try { if (from && NX.pages[from] && NX.pages[from].leave) NX.pages[from].leave(); } catch (e) { console.error(e); }
    cur = name;
    NX.qa('.view').forEach(function (v) { v.classList.remove('on', 'vback'); });
    var v = $('v-' + name);
    if (opt.back) v.classList.add('vback');
    void v.offsetWidth; v.classList.add('on');
    var tab = TAB_OF[name];
    NX.qa('.nb').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-t') === tab); });
    var gi = TAB_ORDER.indexOf(tab); var gl = $('dockGlow'); if (gl && gi >= 0) gl.style.transform = 'translateX(' + (gi * 100) + '%)';
    w.scrollTo(0, 0); try { doc.scrollingElement.scrollTop = 0; } catch (e) {}
    try { if (NX.pages[name].enter) NX.pages[name].enter(); } catch (e) { console.error(e); }
    try { if (tg && tg.BackButton) { if (tab === 'games' && name !== 'games') tg.BackButton.show(); else tg.BackButton.hide(); } } catch (e) {}
  };
  /* back: first close an open sheet / modal, otherwise leave the game */
  NX.back = function () {
    var sp = $('spin');
    if (sp && sp.classList.contains('on')) { if (NX.skipSpin) NX.skipSpin(); return; }
    var open = NX.qa('.mod.on, .sheet.on');
    if (open.length) { open[open.length - 1].classList.remove('on'); return; }
    NX.go('games', { back: true });
  };
  NX.pageHead = function (title, sub, right) {
    return '<div class="phead"><button type="button" class="back" data-back aria-label="Назад"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button><div><div class="ptitle">' + title + '</div>' + (sub ? '<div class="psub">' + sub + '</div>' : '') + '</div>' + (right ? '<div class="rt">' + right + '</div>' : '') + '</div>';
  };

  /* ---------- bet control component ---------- */
  NX.betHtml = function (p) {
    return '<div class="bet"><button type="button" data-b="dec" aria-label="Меньше">−</button>' +
      '<div class="bet-in"><input id="' + p + 'Amt" inputmode="decimal" autocomplete="off" placeholder="Введите сумму" />' + NX.tonI(22) + '</div>' +
      '<button type="button" data-b="inc" aria-label="Больше">+</button></div>' +
      '<div class="bet-q"><button type="button" data-b="half">1/2</button><button type="button" data-b="max">ALL IN</button><button type="button" data-b="dbl">x2</button></div>';
  };
  NX.betBind = function (root, p) {
    var inp = $(p + 'Amt');
    function val() { return parseFloat(String(inp.value).replace(',', '.')) || 0; }
    function set(v) { v = Math.max(0, NX.r2(v)); inp.value = v ? String(v) : ''; }
    function stepOf(v) { return v >= 100 ? 10 : v >= 10 ? 1 : v >= 1 ? 0.5 : 0.1; }
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-b]'); if (!b || inp.disabled) return;
      var k = b.getAttribute('data-b'), v = val();
      if (k === 'inc') set(v + stepOf(v));
      else if (k === 'dec') set(Math.max(0.01, v - stepOf(v - 0.0001)));
      else if (k === 'half') set(v / 2 || 0.01);
      else if (k === 'dbl') set((v || 0.01) * 2);
      else if (k === 'max') set(Math.floor(user.balance * 100) / 100);
      NX.sfx('click'); NX.haptic('select');
    });
    inp.addEventListener('input', function () { inp.value = inp.value.replace(/[^0-9.,]/g, ''); });
    return { get: val, set: set, el: inp, setDisabled: function (d) { inp.disabled = d; NX.qa('[data-b]', root).forEach(function (b) { b.disabled = d; }); } };
  };
  NX.parseBet = function (b) {
    var v = NX.r2(b.get());
    if (v < 0.01) { NX.toast('Введите сумму ставки', 'error'); NX.haptic('error'); return 0; }
    if (!NX.canPay(v)) { NX.toast('Не хватает TON', 'error'); NX.haptic('error'); return 0; }
    return v;
  };

  /* ---------- fx: confetti ---------- */
  var fx = { parts: [], on: false, cv: null, c2: null };
  function fxSize() {
    var cv = fx.cv, dpr = Math.min(2, w.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; fx.dpr = dpr;
  }
  NX.confetti = function (power, ox, oy) {
    fx.cv = fx.cv || $('fx'); if (!fx.cv) return;
    if (!fx.c2) { fx.c2 = fx.cv.getContext('2d'); w.addEventListener('resize', fxSize); }
    fxSize();
    var n = Math.round(60 * (power || 1)), cols = ['#ffc857', '#2be3a0', '#5aa2ff', '#ff6aa8', '#a971ff', '#fff'];
    var x0 = (ox == null ? 0.5 : ox) * innerWidth, y0 = (oy == null ? 0.4 : oy) * innerHeight, i;
    for (i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, s = 4 + Math.random() * 11;
      fx.parts.push({ x: x0, y: y0, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 6, g: .28 + Math.random() * .12, r: 3 + Math.random() * 5, rot: Math.random() * 6, vr: (Math.random() - .5) * .4, c: cols[i % cols.length], life: 1, d: .008 + Math.random() * .012, sq: Math.random() > .4 });
    }
    if (!fx.on) { fx.on = true; requestAnimationFrame(fxLoop); }
  };
  function fxLoop() {
    var c = fx.c2, d = fx.dpr;
    c.clearRect(0, 0, fx.cv.width, fx.cv.height);
    fx.parts = fx.parts.filter(function (p) { return p.life > 0 && p.y < innerHeight + 40; });
    fx.parts.forEach(function (p) {
      p.x += p.vx; p.y += p.vy; p.vy += p.g; p.vx *= .985; p.rot += p.vr; p.life -= p.d;
      c.save(); c.globalAlpha = Math.max(0, Math.min(1, p.life * 1.6)); c.translate(p.x * d, p.y * d); c.rotate(p.rot); c.fillStyle = p.c;
      if (p.sq) c.fillRect(-p.r * d, -p.r * .5 * d, p.r * 2 * d, p.r * d); else { c.beginPath(); c.arc(0, 0, p.r * .6 * d, 0, 7); c.fill(); }
      c.restore();
    });
    if (fx.parts.length) requestAnimationFrame(fxLoop); else { fx.on = false; c.clearRect(0, 0, fx.cv.width, fx.cv.height); }
  }

  /* ---------- DPR canvas ---------- */
  NX.fitCanvas = function (cv, W, H) {
    var dpr = Math.min(2.5, w.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); return c;
  };
})(window);
