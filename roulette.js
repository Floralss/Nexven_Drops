/* Nexven Drop — Roulette (15 slots: 1 green x13, 7 red x1.9, 7 black x1.9; shared rounds) */
(function (NX) {
  'use strict';
  var $ = NX.$;
  var BET = 10000, SPIN = 6500, SHOW = 3500, PERIOD = BET + SPIN + SHOW, SL = 15, DEG = 360 / SL;
  var choice = 'red', bet = null, on = false, raf = 0, lastRound = -1, lastKey = '', lastHist = '', lastTick = -1, msgT = 0;
  var NAMES = { red: 'КРАСНОЕ', black: 'ЧЁРНОЕ', green: 'ЗЕЛЁНОЕ' }, MULT = { red: 1.9, black: 1.9, green: 13 };  /* v28: ~87-89% RTP (was x2 / x14 = 93%) */

  function slotOf(r) { return Math.min(SL - 1, Math.floor(NX.seeded(r, 1) * SL)); }
  function colorOf(s) { return s === 0 ? 'green' : (s % 2 ? 'red' : 'black'); }
  function rotAt(round, el) {
    var prev = slotOf(round - 1), tgt = slotOf(round), A = -prev * DEG;
    var B = A + 1800 + ((((-tgt * DEG - A) % 360) + 360) % 360);
    if (el < BET) return A;
    if (el >= BET + SPIN) return B;
    return A + (B - A) * NX.ease.out5((el - BET) / SPIN);
  }
  function wheelSvg() {
    var cx = 150, cy = 150, R = 128, s = '', i, a0, a1, x0, y0, x1, y1, col;
    s += '<circle cx="150" cy="150" r="146" fill="#c99a2e"/><circle cx="150" cy="150" r="141" fill="#8a6414"/><circle cx="150" cy="150" r="136" fill="#12131b"/>';
    for (i = 0; i < SL; i++) {
      a0 = (i * DEG - DEG / 2 - 90) * Math.PI / 180; a1 = (i * DEG + DEG / 2 - 90) * Math.PI / 180;
      x0 = cx + Math.cos(a0) * R; y0 = cy + Math.sin(a0) * R; x1 = cx + Math.cos(a1) * R; y1 = cy + Math.sin(a1) * R;
      col = i === 0 ? '#15a34a' : (i % 2 ? '#d62839' : '#1d1e29');
      s += '<path d="M150 150L' + x0.toFixed(2) + ' ' + y0.toFixed(2) + 'A' + R + ' ' + R + ' 0 0 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2) + 'Z" fill="' + col + '" stroke="rgba(0,0,0,.35)" stroke-width="1"/>';
      s += '<text x="150" y="36" transform="rotate(' + (i * DEG) + ' 150 150)" text-anchor="middle" font-size="15" font-weight="800" fill="#fff" fill-opacity=".92" font-family="Inter,system-ui,sans-serif">' + i + '</text>';
    }
    s += '<circle cx="150" cy="150" r="58" fill="#0f1018" stroke="#e8b84a" stroke-width="3"/>';
    return '<svg id="roSvg" viewBox="0 0 300 300" aria-hidden="true">' + s + '</svg>';
  }

  NX.pendH.ro = function (e, now) {
    var end = e.round * PERIOD + BET + SPIN; if (now < end) return null;
    var slot = slotOf(e.round), col = colorOf(slot), win = col === e.choice, pay = win ? NX.r2(e.amt * MULT[col]) : 0;
    return { pay: pay, after: function () {
      var txt = slot + ' · ' + NAMES[col] + (win ? ' · +' + NX.fmt(pay) + ' TON' : ' · −' + NX.fmt(e.amt) + ' TON');
      if (NX.cur() === 'roulette') { setMsg(txt, win ? 'pos' : 'neg'); NX.sfx(win ? (col === 'green' ? 'big' : 'win') : 'lose'); NX.haptic(win ? 'success' : 'error'); if (win && col === 'green') NX.confetti(1.4, .5, .35); }
      else if (win) NX.toast('Рулетка: +' + NX.fmt(pay) + ' TON', 'success');
    } };
  };
  function myBet() { return NX.findPend('ro'); }
  function setMsg(t, cls) { var m = $('roMsg'); if (!m) return; m.textContent = t || ''; m.className = 'my-state ' + (cls || ''); clearTimeout(msgT); if (t) msgT = setTimeout(function () { m.textContent = ''; }, 9000); }

  function frame() {
    if (!on) return; raf = requestAnimationFrame(frame);
    var now = Date.now(), round = Math.floor(now / PERIOD), el = now - round * PERIOD;
    NX.settleDue();
    if (round !== lastRound) { lastRound = round; lastKey = ''; }
    var rot = rotAt(round, el); $('roSvg').style.transform = 'rotate(' + rot.toFixed(2) + 'deg)';
    if (el >= BET && el < BET + SPIN) { var tk = Math.floor((-rot + DEG / 2) / DEG); if (tk !== lastTick) { lastTick = tk; if (el < BET + SPIN - 120) NX.sfx('tick'); } }
    var T = $('roT'), L = $('roL'), res = $('roRes'), phase = el < BET ? 'bet' : el < BET + SPIN ? 'spin' : 'show';
    if (phase === 'bet') { T.textContent = ((BET - el) / 1000).toFixed(1); L.textContent = 'СТАВКИ'; res.textContent = ''; }
    else if (phase === 'spin') { T.textContent = '···'; L.textContent = 'КРУТИТСЯ'; res.textContent = ''; }
    else { var s = slotOf(round), c = colorOf(s); T.textContent = s; L.textContent = NAMES[c]; res.textContent = 'Выпало ' + s + ' · ' + NAMES[c]; res.style.color = c === 'red' ? '#ff6b7b' : c === 'green' ? '#2be3a0' : '#c9cfdf'; }
    /* history */
    var base = phase === 'show' ? round : round - 1, hs = [], n;
    for (n = 0; n < 12; n++) hs.push(slotOf(base - n));
    var hk = hs.join(',');
    if (hk !== lastHist) { lastHist = hk; $('roHist').innerHTML = hs.map(function (v, i) { return '<span class="ro-dot ' + colorOf(v) + '" style="animation-delay:' + i * 30 + 'ms;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800">' + v + '</span>'; }).join(''); }
    /* button */
    var e = myBet(), act = e && e.round === round, key = phase + '|' + (act ? e.amt + e.choice : 'n');
    if (key !== lastKey) {
      lastKey = key; var b = $('roGo');
      if (phase === 'bet' && !act) { b.className = 'btn'; b.disabled = false; b.textContent = 'Поставить'; }
      else if (phase === 'bet' && act) { b.className = 'btn ghost'; b.disabled = false; b.textContent = 'Отменить · ' + NAMES[e.choice].toLowerCase() + ' ' + NX.fmt(e.amt) + ' TON'; }
      else { b.className = 'btn ghost'; b.disabled = true; b.textContent = act ? 'Ставка в игре…' : 'Следующий раунд…'; }
    }
    frame.round = round; frame.phase = phase; frame.el = el;
  }

  NX.pages.roulette = {
    build: function () {
      $('v-roulette').innerHTML = NX.pageHead('РУЛЕТКА', 'Красное, чёрное или зелёное x13') +
        '<div class="ro-card"><div class="ro-wheel"><div class="ro-pin"></div>' + wheelSvg() + '<div class="ro-timer"><b id="roT">0</b><small id="roL"></small></div></div><div class="ro-res" id="roRes"></div><div class="ro-hist" id="roHist"></div></div>' +
        '<div class="ctrl"><div class="ro-opts" id="roOpts"><button type="button" class="ro-opt red on" data-c="red">Красное<small>x1.9</small></button><button type="button" class="ro-opt green" data-c="green">Зелёное<small>x13</small></button><button type="button" class="ro-opt black" data-c="black">Чёрное<small>x1.9</small></button></div>' +
        '<div id="roBet">' + NX.betHtml('ro') + '</div><button type="button" class="btn" id="roGo" style="margin-top:14px">Поставить</button><div class="my-state" id="roMsg"></div></div>';
      bet = NX.betBind($('roBet'), 'ro'); bet.set(1);
      $('roOpts').onclick = function (e) {
        var b = e.target.closest('[data-c]'); if (!b || myBet()) return; choice = b.getAttribute('data-c');
        NX.qa('.ro-opt', $('roOpts')).forEach(function (x) { x.classList.toggle('on', x === b); }); NX.sfx('click'); NX.haptic('select');
      };
      $('roGo').onclick = function () {
        var round = frame.round, el = Date.now() - round * PERIOD, e = myBet(), act = e && e.round === round;
        if (el >= BET - 300) { NX.toast('Ставки закрыты, дождитесь следующего раунда', 'error'); return; }
        if (act) {
          var u = NX.user(); NX.dropPend(e.id); u.balance = NX.r2(u.balance + e.amt); u.total_spent = NX.r2(Math.max(0, (u.total_spent || 0) - e.amt));
          NX.save(true); NX.renderUser(); setMsg('Ставка отменена'); lastKey = ''; NX.sfx('click'); return;
        }
        if (e) { NX.toast('Предыдущая ставка ещё в игре', 'error'); return; }
        var a = NX.parseBet(bet); if (!a) return;
        NX.spend(a); NX.stat('roulette'); NX.addPend({ t: 'ro', round: round, amt: a, choice: choice });
        setMsg('Ставка принята: ' + NAMES[choice].toLowerCase() + ' · ' + NX.fmt(a) + ' TON'); NX.sfx('click'); NX.haptic('medium'); lastKey = '';
      };
    },
    enter: function () { on = true; lastKey = ''; lastRound = -1; lastHist = ''; cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); },
    leave: function () { on = false; cancelAnimationFrame(raf); }
  };
  NX.roulette = { slotOf: slotOf, colorOf: colorOf, PERIOD: PERIOD };
})(window.NX);
