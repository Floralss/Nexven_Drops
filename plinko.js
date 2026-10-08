/* Nexven Drop — Plinko (8 rows, 9 bins, binomial path, v28: ~83-85% RTP) */
(function (NX) {
  'use strict';
  var $ = NX.$;
  var ROWS = 8, DX = 34, CX = 180, CW = 360, CH = 312, PEG_Y0 = 42, PEG_DY = 28, BIN_Y = 266, BIN_H = 30, BIN_W = 30, PEG_R = 3.6, BALL_R = 6.6;
  var RISK = {
    low:  { label: 'Низкий',  cls: 'low',  m: [4.8, 1.9, 1, 0.8, 0.45, 0.8, 1, 1.9, 4.8] },
    mid:  { label: 'Средний', cls: 'mid',  m: [12, 3, 1.1, 0.5, 0.35, 0.5, 1.1, 3, 12] },
    high: { label: 'Высокий', cls: 'high', m: [24, 3.6, 1.3, 0.25, 0.15, 0.25, 1.3, 3.6, 24] }
  };
  var BIN_COL = ['#d9264a', '#e0432e', '#e2692a', '#e8962a', '#f0b429', '#e8962a', '#e2692a', '#e0432e', '#d9264a'];
  var risk = 'mid', bet = null, cv = null, ctx = null, raf = 0, on = false;
  var balls = {}, flash = {}, binHit = {}, floats = [], lastPeg = 0;

  function multLabel(m) { return (m >= 10 ? String(m) : String(m)).replace(/^0\./, '.') + 'x'; }
  function pegX(r, i) { return CX + (i - (r + 2) / 2) * DX; }
  function pegY(r) { return PEG_Y0 + r * PEG_DY; }
  function binX(i) { return CX + (i - 4) * DX; }

  function makePath() {
    var px = CX, dirs = [], pts = [], r, d;
    pts.push({ x: CX, y: 6, t: 0, kind: 'drop' });
    for (r = 0; r < ROWS; r++) { d = NX.rand() < .5 ? -1 : 1; dirs.push(d); }
    var segs = [], t = 0, x = CX, y = 6;
    function seg(x1, y1, dur, kind, row) { segs.push({ x0: x, y0: y, x1: x1, y1: y1, t0: t, dur: dur, kind: kind, row: row }); t += dur; x = x1; y = y1; }
    seg(CX, pegY(0) - 10, .36, 'drop', -1);
    var cxp = CX;
    for (r = 0; r < ROWS; r++) {
      var nx = cxp + dirs[r] * DX / 2;
      if (r < ROWS - 1) seg(nx, pegY(r + 1) - 10, .31, 'hop', r);
      else seg(nx, BIN_Y - 9, .31, 'hop', r);
      segs[segs.length - 1].peg = { r: r, x: cxp };
      cxp = nx;
    }
    seg(cxp, BIN_Y + 10, .2, 'fall', -1);
    var bin = Math.round((cxp - CX) / DX) + 4;
    return { segs: segs, total: t, bin: bin, dirs: dirs };
  }

  function posAt(path, tt) {
    var s = path.segs, i;
    for (i = 0; i < s.length; i++) if (tt < s[i].t0 + s[i].dur || i === s.length - 1) break;
    var g = s[i], p = Math.max(0, Math.min(1, (tt - g.t0) / g.dur)), x, y;
    if (g.kind === 'drop') { x = g.x0; y = g.y0 + (g.y1 - g.y0) * p * p; }
    else if (g.kind === 'fall') { x = g.x0; y = g.y0 + (g.y1 - g.y0) * p; }
    else { x = g.x0 + (g.x1 - g.x0) * (p * (2 - p)); y = g.y0 + (g.y1 - g.y0) * p * p - 11 * Math.sin(Math.PI * p); }
    return { x: x, y: y, seg: i, p: p, fall: g.kind === 'fall' };
  }

  /* ---- drawing ---- */
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function draw() {
    var c = ctx, now = Date.now(), r, i;
    c.clearRect(0, 0, CW, CH);
    /* pegs */
    for (r = 0; r < ROWS; r++) for (i = 0; i < r + 3; i++) {
      var k = r + '_' + i, f = flash[k] ? Math.max(0, 1 - (now - flash[k]) / 380) : 0, x = pegX(r, i), y = pegY(r);
      if (f > 0) {
        var g = c.createRadialGradient(x, y, 0, x, y, 20); g.addColorStop(0, 'rgba(120,180,255,' + (.7 * f) + ')'); g.addColorStop(1, 'rgba(120,180,255,0)');
        c.fillStyle = g; c.fillRect(x - 20, y - 20, 40, 40);
      }
      c.beginPath(); c.arc(x, y, PEG_R + f * 1.6, 0, 7); c.fillStyle = f > 0 ? '#bcd9ff' : 'rgba(255,255,255,.92)'; c.fill();
    }
    /* bins */
    var m = RISK[risk].m;
    for (i = 0; i < 9; i++) {
      var h = binHit[i] ? Math.max(0, 1 - (now - binHit[i]) / 420) : 0, bx = binX(i) - BIN_W / 2, by = BIN_Y + Math.sin(h * Math.PI) * 5;
      c.save();
      c.shadowColor = BIN_COL[i]; c.shadowBlur = 6 + h * 18;
      var gr = c.createLinearGradient(0, by, 0, by + BIN_H); gr.addColorStop(0, BIN_COL[i]); gr.addColorStop(1, shade(BIN_COL[i], -.28));
      c.fillStyle = gr; rr(c, bx, by, BIN_W, BIN_H, 8); c.fill(); c.restore();
      c.fillStyle = 'rgba(255,255,255,.2)'; rr(c, bx + 2, by + 2, BIN_W - 4, 8, 5); c.fill();
      c.fillStyle = i === 4 ? '#3a2300' : '#fff'; c.font = '800 ' + (multLabel(m[i]).length > 4 ? 10 : 11.5) + 'px Inter,system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(multLabel(m[i]), bx + BIN_W / 2, by + BIN_H / 2 + 1);
    }
    /* balls */
    Object.keys(balls).forEach(function (id) {
      var b = balls[id], tt = (now - b.t0) / 1000;
      if (tt < 0) return;
      var capped = Math.min(tt, b.path.total), p = posAt(b.path, capped);
      /* peg hit effects */
      var s = b.path.segs[p.seg];
      if (s && s.peg && !b.hit[p.seg]) {
        b.hit[p.seg] = 1;
        var rr0 = s.peg.r, ii = Math.round((s.peg.x - CX) / DX + (rr0 + 2) / 2);
        flash[rr0 + '_' + ii] = now; if (now - lastPeg > 45) { NX.sfx('peg'); lastPeg = now; }
      }
      b.trail.push({ x: p.x, y: p.y }); if (b.trail.length > 14) b.trail.shift();
      var j;
      for (j = 0; j < b.trail.length; j++) {
        var a = j / b.trail.length; c.beginPath(); c.arc(b.trail[j].x, b.trail[j].y, BALL_R * (.3 + a * .6), 0, 7); c.fillStyle = 'rgba(90,162,255,' + (a * .28) + ')'; c.fill();
      }
      var sc = p.fall ? 1 - p.p * .55 : 1, al = p.fall ? 1 - p.p * .8 : 1;
      c.save(); c.globalAlpha = al;
      var gg = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, 20); gg.addColorStop(0, 'rgba(70,140,255,.5)'); gg.addColorStop(1, 'rgba(70,140,255,0)'); c.fillStyle = gg; c.fillRect(p.x - 20, p.y - 20, 40, 40);
      var bg = c.createRadialGradient(p.x - 2, p.y - 2, 1, p.x, p.y, BALL_R * sc); bg.addColorStop(0, '#d8eaff'); bg.addColorStop(.45, '#5aa2ff'); bg.addColorStop(1, '#1f5fd8');
      c.beginPath(); c.arc(p.x, p.y, BALL_R * sc, 0, 7); c.fillStyle = bg; c.fill(); c.restore();
      if (tt > b.path.total + .5) delete balls[id];
    });
    /* floating texts */
    floats = floats.filter(function (f) { return now - f.t < 1100; });
    floats.forEach(function (f) {
      var p = (now - f.t) / 1100, y = f.y - 10 - p * 34;
      c.save(); c.globalAlpha = 1 - p * p; c.font = '900 15px Inter,system-ui,sans-serif'; c.textAlign = 'center'; c.fillStyle = f.col; c.shadowColor = f.col; c.shadowBlur = 12;
      c.fillText(f.txt, f.x, y); c.restore();
    });
  }
  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    function f(v) { return Math.max(0, Math.min(255, Math.round(v + 255 * amt))); }
    return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
  }
  function loop() { if (!on) return; draw(); raf = requestAnimationFrame(loop); }

  /* ---- gameplay ---- */
  function drop() {
    var u = NX.user(), a = NX.parseBet(bet); if (!a) return;
    var path = makePath(), m = RISK[risk].m[path.bin], pay = NX.r2(a * m);
    NX.spend(a); NX.stat('plinko');
    var now = Date.now(), e = NX.addPend({ t: 'pl', due: now + Math.round(path.total * 1000) - 40, pay: pay, amt: a, mult: m, bin: path.bin, risk: risk });
    balls[e.id] = { t0: now, path: path, trail: [], hit: {}, e: e };
    NX.sfx('click'); NX.haptic('light');
  }
  NX.pendH.pl = function (e, now) {
    if (now < e.due) return null;
    return { pay: e.pay, after: function () {
      var u = NX.user(); u.stats = u.stats || {}; u.stats.pl = (u.stats.pl || []).slice(-39);
      u.stats.pl.push({ a: e.amt, m: e.mult, w: e.pay, ts: Date.now() });
      binHit[e.bin] = Date.now();
      if (on) {
        var good = e.mult >= 1;
        floats.push({ x: binX(e.bin), y: BIN_Y, t: Date.now(), txt: (e.mult >= 1 ? '+' : '') + NX.fmt(e.pay), col: good ? '#2be3a0' : '#ff8c98' });
        NX.sfx(good ? 'win' : 'land'); NX.haptic(e.mult >= 3 ? 'success' : 'light');
        if (e.mult >= 10) { NX.confetti(1.4, .5, .35); NX.sfx('big'); }
      }
    } };
  };

  function setRisk(k) {
    risk = k;
    NX.qa('#plRisk button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-r') === k); });
  }
  function showHistory() {
    var u = NX.user(), list = ((u.stats && u.stats.pl) || []).slice().reverse().slice(0, 25);
    $('modInfoBody').innerHTML = '<button type="button" class="mx" data-close="modInfo">✕</button><h3>История выигрышей</h3><p class="hint" style="margin-bottom:12px">Последние игры в Плинко</p>' +
      (list.length ? list.map(function (h) {
        var d = NX.r2(h.w - h.a);
        return '<div class="hrow"><span class="mx2">' + multLabel(h.m) + '</span><span>' + NX.fmt(h.a) + ' → ' + NX.fmt(h.w) + '</span><span class="' + (d >= 0 ? 'pos' : 'neg') + '">' + (d >= 0 ? '+' : '') + NX.fmt(d) + '</span></div>';
      }).join('') : '<div class="empty">Пока нет игр</div>');
    NX.open('modInfo');
  }

  NX.pages.plinko = {
    build: function () {
      $('v-plinko').innerHTML = NX.pageHead('ПЛИНКО', 'Шарик и множители') +
        '<div class="pl-card"><canvas id="plCanvas"></canvas></div>' +
        '<button type="button" class="hist-btn" id="plHist"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>История выигрышей</button>' +
        '<div class="ctrl"><div class="lab">Риск</div><div class="seg risk" id="plRisk">' +
        Object.keys(RISK).map(function (k) { return '<button type="button" data-r="' + k + '" class="' + RISK[k].cls + (k === risk ? ' on' : '') + '">' + RISK[k].label + '</button>'; }).join('') +
        '</div><div class="lab">Ставка</div><div id="plBet">' + NX.betHtml('pl') + '</div><button type="button" class="btn" id="plGo" style="margin-top:14px">Играть</button></div>';
      cv = $('plCanvas'); ctx = NX.fitCanvas(cv, CW, CH);
      bet = NX.betBind($('plBet'), 'pl'); bet.set(1);
      $('plRisk').onclick = function (e) { var b = e.target.closest('[data-r]'); if (b) { setRisk(b.getAttribute('data-r')); NX.sfx('click'); NX.haptic('select'); } };
      $('plGo').onclick = drop; $('plHist').onclick = showHistory;
    },
    enter: function () { on = true; cancelAnimationFrame(raf); loop(); },
    leave: function () { on = false; cancelAnimationFrame(raf); }
  };
  /* theoretical RTP for tests */
  NX.plinkoRTP = function (k) { var m = RISK[k].m, w = [1, 8, 28, 56, 70, 56, 28, 8, 1], s = 0, i; for (i = 0; i < 9; i++) s += w[i] * m[i]; return s / 256; };
})(window.NX);
