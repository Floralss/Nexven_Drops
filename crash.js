/* Nexven Drop — Crash (shared wall-clock rounds, manual + auto cash-out) */
(function (NX) {
  'use strict';
  var $ = NX.$;
  var BET = 6000, K = 0.18, MAXC = 10, SHOW = 3600, PERIOD = BET + Math.ceil(Math.log(MAXC) / K * 1000) + 100 + SHOW;
  var bet = null, cv = null, ctx = null, W = 0, H = 300, raf = 0, on = false;
  var stars = [], parts = [], lastKey = '', lastHist = '', autoOn = true, autoVal = 2, shock = null, lastRound = -1, rocketEl = null, msgT = 0;

  function crashOf(round) {
    var r = NX.seeded(round, 2), v = 0.96 / (1 - r);
    return Math.max(1, Math.min(MAXC, Math.floor(v * 100) / 100));
  }
  function flyDur(c) { return c <= 1 ? 0 : Math.ceil(Math.log(c) / K * 1000); }
  function multAt(ms) { return Math.floor(Math.exp(K * Math.max(0, ms) / 1000) * 100) / 100; }
  function phaseAt(now) {
    var round = Math.floor(now / PERIOD), el = now - round * PERIOD, crash = crashOf(round), fd = flyDur(crash);
    if (el < BET) return { ph: 'bet', round: round, left: BET - el, crash: crash, el: el };
    var fe = el - BET;
    if (fe < fd) return { ph: 'fly', round: round, crash: crash, ms: fe, mult: Math.min(multAt(fe), crash - 0.01 > 1 ? crash - 0.01 : 1) , fd: fd };
    return { ph: 'crash', round: round, crash: crash, since: fe - fd };
  }

  /* deterministic settlement for bets whose owner left the page */
  NX.pendH.cr = function (e, now) {
    var crash = crashOf(e.round), end = e.round * PERIOD + BET + flyDur(crash);
    if (now < end) return null;
    var pay = (e.auto && e.auto < crash) ? NX.r2(e.amt * e.auto) : 0;
    return { pay: pay, after: function () { if (pay > 0 && NX.cur() !== 'crash') NX.toast('Краш: авто-вывод x' + e.auto.toFixed(2) + ' · +' + NX.fmt(pay) + ' TON', 'success'); } };
  };
  function myBet() { return NX.findPend('cr'); }
  function setMsg(t, cls, keep) { var m = $('crMsg'); if (!m) return; m.textContent = t || ''; m.className = 'my-state ' + (cls || ''); clearTimeout(msgT); if (t && !keep) msgT = setTimeout(function () { m.textContent = ''; }, 6000); }

  function parseAuto() { var v = parseFloat(String($('crAuto').value).replace(',', '.')); return (v && v > 1) ? Math.min(MAXC, Math.round(v * 100) / 100) : 0; }

  function place(p) {
    if (p.ph !== 'bet') { NX.toast('Дождитесь следующего раунда', 'error'); return; }
    if (myBet()) return;
    var a = NX.parseBet(bet); if (!a) return;
    var auto = autoOn ? parseAuto() : 0;
    if (autoOn && !auto) { NX.toast('Укажите авто-вывод больше x1.00', 'error'); return; }
    NX.spend(a); NX.stat('crash');
    NX.addPend({ t: 'cr', round: p.round, amt: a, auto: auto });
    setMsg('Ставка принята', 'pos', true); NX.sfx('click'); NX.haptic('medium'); lastKey = '';
  }
  function cancel(p) {
    var e = myBet(); if (!e || p.ph !== 'bet' || e.round !== p.round) return;
    var u = NX.user(); NX.dropPend(e.id); u.balance = NX.r2(u.balance + e.amt); u.total_spent = NX.r2(Math.max(0, (u.total_spent || 0) - e.amt));
    NX.save(true); NX.renderUser(); setMsg('Ставка отменена'); NX.sfx('click'); lastKey = '';
  }
  function cashNow(p, forceMult) {
    var e = myBet(); if (!e || e.round !== p.round) return;
    var m = forceMult || p.mult;
    if (p.ph !== 'fly' && !forceMult) return;
    if (m >= p.crash) { return; }
    var pay = NX.r2(e.amt * m);
    NX.dropPend(e.id); NX.credit(pay);
    setMsg('Выигрыш x' + m.toFixed(2) + ' · +' + NX.fmt(pay) + ' TON', 'pos', true);
    NX.sfx(m >= 3 ? 'big' : 'win'); NX.haptic('success'); if (m >= 3) NX.confetti(.9, .5, .3);
    lastKey = '';
  }

  /* ---- scene ---- */
  function bez(t) {
    var x0 = W * .12, y0 = H * .64, x1 = W * .34, y1 = H * .5, x2 = W * .8, y2 = H * .17, u = 1 - t;
    return { x: u * u * x0 + 2 * u * t * x1 + t * t * x2, y: u * u * y0 + 2 * u * t * y1 + t * t * y2,
      dx: 2 * u * (x1 - x0) + 2 * t * (x2 - x1), dy: 2 * u * (y1 - y0) + 2 * t * (y2 - y1) };
  }
  function initStars() { stars = []; var i; for (i = 0; i < 70; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, z: .3 + Math.random() * .9, tw: Math.random() * 6 }); }

  var lastT = 0;
  function frame(ts) {
    if (!on) return;
    raf = requestAnimationFrame(frame);
    var dt = Math.min(50, ts - lastT || 16) / 16.6; lastT = ts;
    var now = Date.now(), p = phaseAt(now), c = ctx, i;
    NX.settleDue();
    if (p.round !== lastRound) { lastRound = p.round; lastKey = ''; if (p.ph === 'bet') setMsg(''); if (p.ph === 'bet') { shock = null; parts = []; } }

    /* progress & rocket pos */
    var m = p.ph === 'fly' ? p.mult : (p.ph === 'crash' ? p.crash : 1);
    var prog = p.ph === 'bet' ? 0 : Math.pow(Math.min(1, Math.log(Math.max(1, m)) / Math.log(MAXC)), .72);
    var pos = bez(prog), ang = Math.atan2(pos.dx, -pos.dy) * 180 / Math.PI;
    var wob = p.ph === 'bet' ? Math.sin(ts / 420) * 3 : Math.sin(ts / 90) * 1.2;

    /* auto cash-out in real time */
    var e = myBet();
    if (p.ph === 'fly' && e && e.round === p.round && e.auto && e.auto <= p.mult && e.auto < p.crash) cashNow(p, e.auto);
    /* loss feedback */
    if (p.ph === 'crash' && p.since < 300) {
      var e2 = myBet();
      if (e2 && e2.round === p.round) { NX.dropPend(e2.id); NX.save(true); setMsg('Улетела на x' + p.crash.toFixed(2) + ' · −' + NX.fmt(e2.amt) + ' TON', 'neg', true); NX.sfx('lose'); NX.haptic('error'); lastKey = ''; }
    }
    if (p.ph === 'crash' && !shock) { shock = { t: ts, x: pos.x, y: pos.y }; var k; for (k = 0; k < 46; k++) { var a = Math.random() * 6.283, s = 1 + Math.random() * 6; parts.push({ x: pos.x, y: pos.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, l: 1, d: .016 + Math.random() * .02, r: 2 + Math.random() * 4, c: Math.random() > .5 ? '#ff9d2e' : '#ff4d5e' }); } if (p.crash > 1 || true) NX.sfx('boom'); }

    /* DOM text */
    var mult = $('crMult'), st = $('crState');
    if (p.ph === 'bet') { mult.textContent = 'СТАВКИ'; mult.className = 'cr-mult wait'; st.textContent = 'Взлёт через ' + (p.left / 1000).toFixed(1) + ' с'; }
    else if (p.ph === 'fly') { mult.textContent = p.mult.toFixed(2) + 'x'; mult.className = 'cr-mult'; st.textContent = 'В раунде'; }
    else { mult.textContent = p.crash.toFixed(2) + 'x'; mult.className = 'cr-mult dead'; st.textContent = 'Ракета улетела'; }
    rocketEl.style.opacity = p.ph === 'crash' ? 0 : 1;
    rocketEl.style.transform = 'translate3d(' + (pos.x - 29 + wob) + 'px,' + (pos.y - 40) + 'px,0) rotate(' + ang + 'deg)';
    rocketEl.style.transformOrigin = '50% 60%';

    /* canvas */
    c.clearRect(0, 0, W, H);
    var spd = p.ph === 'fly' ? (.8 + Math.log(m + 1) * 2.2) : (p.ph === 'bet' ? .25 : .1);
    for (i = 0; i < stars.length; i++) {
      var s = stars[i]; s.y += s.z * spd * dt; s.x -= s.z * spd * .35 * dt;
      if (s.y > H) { s.y = -2; s.x = Math.random() * W; } if (s.x < 0) s.x = W;
      c.globalAlpha = .35 + .55 * Math.abs(Math.sin(ts / 700 + s.tw)); c.fillStyle = '#fff';
      c.fillRect(s.x, s.y, s.z * 1.6, s.z * (p.ph === 'fly' ? 1.6 + spd * .5 : 1.6));
    }
    c.globalAlpha = 1;
    if (p.ph !== 'bet') {
      var N = 40, j; c.beginPath(); c.moveTo(W * .12, H * .64);
      for (j = 1; j <= N; j++) { var q = bez(prog * j / N); c.lineTo(q.x, q.y); }
      var tg = c.createLinearGradient(W * .12, 0, pos.x, 0); tg.addColorStop(0, 'rgba(47,123,255,0)'); tg.addColorStop(1, p.ph === 'crash' ? 'rgba(255,77,94,.9)' : 'rgba(90,162,255,.95)');
      c.lineWidth = 4; c.strokeStyle = tg; c.lineCap = 'round'; c.shadowColor = p.ph === 'crash' ? '#ff4d5e' : '#2f7bff'; c.shadowBlur = 14; c.stroke(); c.shadowBlur = 0;
      c.lineTo(pos.x, H); c.lineTo(W * .12, H); c.closePath();
      var fg = c.createLinearGradient(0, H * .2, 0, H); fg.addColorStop(0, p.ph === 'crash' ? 'rgba(255,77,94,.18)' : 'rgba(47,123,255,.2)'); fg.addColorStop(1, 'rgba(47,123,255,0)'); c.fillStyle = fg; c.fill();
    }
    /* flame sparks */
    if (p.ph !== 'crash' && (p.ph === 'fly' || ts % 3 < 1)) {
      var rad = (ang + 180) * Math.PI / 180, fx = pos.x + Math.sin(rad) * -28 * -1, fy = pos.y - Math.cos(rad) * 28 * -1;
      parts.push({ x: pos.x - Math.sin(ang * Math.PI / 180) * -30 + (Math.random() - .5) * 6, y: pos.y + Math.cos(ang * Math.PI / 180) * 30 + (Math.random() - .5) * 6, vx: (Math.random() - .5) * .8 - Math.sin(ang * Math.PI / 180) * 1.6, vy: 1.4 + Math.random() * 1.6, l: .9, d: .035 + Math.random() * .03, r: 2 + Math.random() * 3, c: Math.random() > .4 ? '#ffb347' : '#ff6a3d' });
    }
    parts = parts.filter(function (q) { return q.l > 0; });
    parts.forEach(function (q) { q.x += q.vx * dt; q.y += q.vy * dt; q.l -= q.d * dt; c.globalAlpha = Math.max(0, q.l); c.fillStyle = q.c; c.beginPath(); c.arc(q.x, q.y, q.r * q.l + .5, 0, 7); c.fill(); });
    c.globalAlpha = 1;
    if (shock) { var sp = (ts - shock.t) / 700; if (sp < 1) { c.strokeStyle = 'rgba(255,120,90,' + (1 - sp) + ')'; c.lineWidth = 5 * (1 - sp); c.beginPath(); c.arc(shock.x, shock.y, 10 + sp * 90, 0, 7); c.stroke(); } }

    /* info chips */
    var eb = myBet(), active = eb && eb.round === p.round;
    var key = p.ph + '|' + (active ? 'a' + eb.amt : 'n') + '|' + (p.ph === 'fly' && active ? '' : '');
    var info = $('crInfo'), ik = (active ? 1 : 0) + '_' + (active ? eb.amt : 0); if (info.getAttribute('data-k') !== ik) { info.setAttribute('data-k', ik); info.innerHTML = '<div><svg width="16" height="16" viewBox="0 0 24 24" fill="#9db4e6"><circle cx="9" cy="8" r="3.6"/><path d="M2.5 20c0-3.6 3-5.6 6.5-5.6s6.5 2 6.5 5.6zM16.5 5.2a3.4 3.4 0 0 1 0 6.4M18 14.6c2.3.6 3.8 2.3 3.8 5.4h-3.2"/></svg>' + (active ? 1 : 0) + '</div><div>' + NX.tonI(16) + NX.fmt(active ? eb.amt : 0) + '</div>'; }
    /* history */
    var hist = [], base = p.ph === 'crash' ? p.round : p.round - 1, hh = '', n;
    for (n = 0; n < 9; n++) hist.push(crashOf(base - n));
    hh = hist.join(',');
    if (hh !== lastHist) { lastHist = hh; $('crHist').innerHTML = hist.map(function (v, idx) { return '<span class="hchip ' + (v >= 5 ? 'hi' : v < 1.5 ? 'lo' : '') + '" style="animation-delay:' + idx * 40 + 'ms">' + v.toFixed(2) + 'x</span>'; }).join(''); }

    /* button */
    var btn = $('crGo'), bkey = p.ph + '|' + (active ? 'a' : 'n') + (p.ph === 'fly' && active ? '|' + Math.floor(p.mult * 100) : '');
    if (bkey !== lastKey) {
      lastKey = bkey;
      if (p.ph === 'bet' && !active) { btn.className = 'btn'; btn.disabled = false; btn.textContent = 'Поставить'; }
      else if (p.ph === 'bet' && active) { btn.className = 'btn ghost'; btn.disabled = false; btn.textContent = 'Отменить ставку · ' + NX.fmt(eb.amt) + ' TON'; }
      else if (p.ph === 'fly' && active) { btn.className = 'btn green'; btn.disabled = false; btn.textContent = 'Забрать ' + NX.fmt(NX.r2(eb.amt * p.mult)) + ' TON'; }
      else { btn.className = 'btn ghost'; btn.disabled = true; btn.textContent = p.ph === 'fly' ? 'Раунд идёт…' : 'Следующий раунд…'; }
    }
    frame.p = p;
  }

  NX.pages.crash = {
    build: function () {
      $('v-crash').innerHTML = NX.pageHead('КРАШ', 'Забери до того, как ракета улетит') +
        '<div class="cr-card" id="crCard"><canvas id="crCanvas"></canvas><div class="cr-mult wait" id="crMult">СТАВКИ</div><div class="cr-state" id="crState"></div>' +
        '<div class="cr-rocket" id="crRocket">' + window.ART.rocket('') + '</div><div class="cr-info" id="crInfo"></div><div class="cr-hist" id="crHist"></div></div>' +
        '<div class="ctrl"><div id="crBet">' + NX.betHtml('cr') + '</div>' +
        '<div class="auto-row"><b>Авто вывод</b><label class="sw"><input type="checkbox" id="crAutoOn" checked><i></i></label></div>' +
        '<div id="crAutoBox"><div class="auto-in"><input id="crAuto" inputmode="decimal" value="2" /><b style="font-size:18px">x</b></div><div class="auto-chips" id="crChips">' + [1.5, 2, 3, 5].map(function (v) { return '<button type="button" data-v="' + v + '">x' + v + '</button>'; }).join('') + '</div></div>' +
        '<button type="button" class="btn" id="crGo" style="margin-top:14px">Поставить</button><div class="my-state" id="crMsg"></div></div>';
      bet = NX.betBind($('crBet'), 'cr'); bet.set(1);
      rocketEl = NX.q('#crRocket');
      $('crAutoOn').onchange = function () { autoOn = this.checked; $('crAutoBox').style.display = autoOn ? '' : 'none'; NX.haptic('select'); };
      function chipSync() { var v = parseAuto(); NX.qa('#crChips button').forEach(function (b) { b.classList.toggle('on', Number(b.getAttribute('data-v')) === v); }); }
      $('crAuto').addEventListener('input', function () { this.value = this.value.replace(/[^0-9.,]/g, ''); chipSync(); });
      $('crChips').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; $('crAuto').value = b.getAttribute('data-v'); chipSync(); NX.sfx('click'); NX.haptic('select'); };
      chipSync();
      $('crGo').onclick = function () {
        var p = frame.p || phaseAt(Date.now()), act = myBet() && myBet().round === p.round;
        if (p.ph === 'bet') { if (act) cancel(p); else place(p); }
        else if (p.ph === 'fly' && act) cashNow(p);
      };
    },
    enter: function () {
      var card = $('crCard'); W = card.clientWidth || 360; H = 300;
      ctx = NX.fitCanvas($('crCanvas'), W, H); initStars(); parts = []; shock = null; lastKey = ''; lastHist = ''; lastRound = -1; $('crInfo').setAttribute('data-k', '');
      on = true; cancelAnimationFrame(raf); lastT = performance.now(); raf = requestAnimationFrame(frame);
    },
    leave: function () { on = false; cancelAnimationFrame(raf); }
  };
  NX.crash = { crashOf: crashOf, PERIOD: PERIOD, BET: BET, flyDur: flyDur, phaseAt: phaseAt, multAt: multAt };
})(window.NX);
