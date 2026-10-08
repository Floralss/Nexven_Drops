/* Nexven Drop — Mines (5x5, real bet / cash-out, state survives reload) */
(function (NX) {
  'use strict';
  var $ = NX.$, EDGE = 0.96, SIZE = 25;
  var cfgMines = 3, bet = null, over = null; /* over = {pos, rev, hit} after a finished round */

  var GEM = '<svg viewBox="0 0 48 48"><defs><linearGradient id="gm1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9dffe0"/><stop offset="1" stop-color="#14c98a"/></linearGradient></defs><path d="M24 5l15 10-15 28L9 15z" fill="url(#gm1)"/><path d="M24 5l15 10H9z" fill="#fff" fill-opacity=".45"/><path d="M24 15l-6 0 6 28zM24 15h6l-6 28z" fill="#0a7a55" fill-opacity=".35"/></svg>';
  var BOMB = '<svg viewBox="0 0 48 48"><defs><radialGradient id="bb1" cx=".35" cy=".3"><stop offset="0" stop-color="#5a5f78"/><stop offset="1" stop-color="#14151e"/></radialGradient></defs><circle cx="23" cy="27" r="14" fill="url(#bb1)"/><path d="M30 14l5-6" stroke="#c8a064" stroke-width="3.2" stroke-linecap="round"/><circle cx="37" cy="7" r="3.6" fill="#ffb347"/><circle cx="37" cy="7" r="1.8" fill="#fff4b8"/><circle cx="17" cy="22" r="3" fill="#fff" fill-opacity=".35"/></svg>';

  function mult(k, m) {
    var v = EDGE, i;
    for (i = 0; i < k; i++) v *= (SIZE - i) / (SIZE - m - i);
    return v;
  }
  function mtxt(v) { return v >= 100 ? Math.round(v).toString() : v.toFixed(2); }
  function shuffled(n) { var a = [], i; for (i = 0; i < n; i++) a.push(i); for (i = n - 1; i > 0; i--) { var j = NX.randInt(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  function tilesHtml() {
    var h = '', i;
    for (i = 0; i < SIZE; i++) h += '<button type="button" class="tile" data-i="' + i + '"><span class="f front"></span><span class="f back"></span></button>';
    return h;
  }

  function render(animate) {
    var u = NX.user(), g = u.mn, tiles = NX.qa('#mnGrid .tile'), shownM = g ? g.mines : cfgMines;
    var pos = g ? g.pos : (over ? over.pos : []), rev = g ? g.rev : (over ? over.rev : []);
    tiles.forEach(function (t, i) {
      var isMine = pos.indexOf(i) >= 0, isRev = rev.indexOf(i) >= 0, finished = !g && over;
      var show = isRev || (finished && (isMine || true));
      if (!g && !over) show = false;
      t.classList.toggle('mine', isMine && (finished));
      t.classList.toggle('open', !!show);
      t.classList.toggle('ghost', !!(finished && !isRev && !(over.hit === i)));
      t.classList.toggle('locked', !g);
      var back = t.querySelector('.back');
      var want = (finished && isMine) ? 'b' : (show ? 'g' : '');
      if (back.getAttribute('data-k') !== want) { back.setAttribute('data-k', want); back.innerHTML = want === 'b' ? BOMB : want === 'g' ? GEM : ''; }
    });
    /* strip */
    var steps = Math.min(SIZE - shownM, 14), done = g ? g.rev.length : 0, h = '', k;
    for (k = 1; k <= steps; k++) h += '<div class="mstep' + (k <= done ? ' done' : (k === done + 1 && g ? ' cur' : '')) + '"><b>x' + mtxt(mult(k, shownM)) + '</b><small>' + k + (k === 1 ? ' шаг' : k < 5 ? ' шага' : ' шагов') + '</small></div>';
    $('mnStrip').innerHTML = h;
    var cur = $('mnStrip').querySelector('.cur,.done:last-of-type'); if (cur && g) try { $('mnStrip').scrollTo({ left: Math.max(0, cur.offsetLeft - 90), behavior: 'smooth' }); } catch (e) {}
    /* controls */
    NX.qa('#mnCount button').forEach(function (b) { b.classList.toggle('on', Number(b.getAttribute('data-n')) === shownM); b.disabled = !!g; });
    bet.setDisabled(!!g);
    var info = $('mnInfo'), go = $('mnGo');
    if (g) {
      var m = g.rev.length ? mult(g.rev.length, g.mines) : 1, nxt = mult(g.rev.length + 1, g.mines);
      info.classList.remove('hide');
      info.innerHTML = '<div><small>Ставка</small><b>' + NX.tonI(18) + NX.fmt(g.bet) + '</b></div><div><small>Дальше</small><b>x' + mtxt(nxt) + '</b></div>';
      go.className = 'btn green';
      if (g.rev.length) { go.disabled = false; go.innerHTML = 'Забрать ' + NX.fmt(NX.r2(g.bet * m)) + ' TON'; }
      else { go.disabled = true; go.textContent = 'Выберите ячейку'; }
    } else {
      info.classList.add('hide'); go.className = 'btn'; go.disabled = false; go.textContent = 'Начать игру';
    }
  }

  function setMsg(t, cls) { var m = $('mnMsg'); m.textContent = t || ''; m.className = 'my-state ' + (cls || ''); }

  function start() {
    var u = NX.user(); if (u.mn) return;
    var a = NX.parseBet(bet); if (!a) return;
    NX.spend(a); NX.stat('mines');
    u.mn = { bet: a, mines: cfgMines, pos: shuffled(SIZE).slice(0, cfgMines), rev: [], ts: Date.now() };
    over = null; NX.save(true); setMsg('');
    NX.sfx('click'); NX.haptic('medium'); render();
  }

  function pick(i) {
    var u = NX.user(), g = u.mn; if (!g || g.rev.indexOf(i) >= 0) return;
    if (g.pos.indexOf(i) >= 0) { /* boom */
      over = { pos: g.pos.slice(), rev: g.rev.slice(), hit: i }; u.mn = null; NX.save(true);
      render(); NX.sfx('boom'); NX.haptic('error');
      var gr = $('mnGrid'); gr.classList.remove('shake'); void gr.offsetWidth; gr.classList.add('shake');
      setMsg('Мина! −' + NX.fmt(g.bet) + ' TON', 'neg'); return;
    }
    g.rev.push(i); NX.save(); NX.sfx('gem'); NX.haptic('light');
    if (g.rev.length >= SIZE - g.mines) { render(); cash(true); return; }
    render();
  }

  function cash(auto) {
    var u = NX.user(), g = u.mn; if (!g || !g.rev.length) return;
    var m = mult(g.rev.length, g.mines), pay = NX.r2(g.bet * m);
    over = { pos: g.pos.slice(), rev: g.rev.slice(), hit: -1 }; u.mn = null;
    NX.credit(pay); NX.save(true); render();
    setMsg('+' + NX.fmt(pay) + ' TON · x' + mtxt(m), 'pos');
    NX.sfx(m >= 3 ? 'big' : 'win'); NX.haptic('success');
    if (m >= 2) NX.confetti(Math.min(2, .5 + m / 6), .5, .3);
    if (auto) NX.toast('Все ячейки открыты!', 'success');
  }

  NX.pages.mines = {
    build: function () {
      $('v-mines').innerHTML = NX.pageHead('МИНЫ', 'Открывай ячейки и забирай выигрыш') +
        '<div class="mn-grid" id="mnGrid">' + tilesHtml() + '</div><div class="mstrip" id="mnStrip"></div>' +
        '<div class="ctrl"><div class="lab">Количество мин</div><div class="mcount" id="mnCount">' + [1, 3, 5, 10, 24].map(function (n) { return '<button type="button" data-n="' + n + '">' + n + '</button>'; }).join('') + '</div>' +
        '<div class="lab">Ставка</div><div id="mnBet">' + NX.betHtml('mn') + '</div><div class="m-info hide" id="mnInfo"></div>' +
        '<button type="button" class="btn" id="mnGo" style="margin-top:14px">Начать игру</button><div class="my-state" id="mnMsg"></div></div>';
      bet = NX.betBind($('mnBet'), 'mn'); bet.set(1);
      $('mnGrid').onclick = function (e) { var t = e.target.closest('.tile'); if (t) pick(Number(t.getAttribute('data-i'))); };
      $('mnCount').onclick = function (e) { var b = e.target.closest('button'); if (!b || b.disabled) return; cfgMines = Number(b.getAttribute('data-n')); NX.sfx('click'); NX.haptic('select'); render(); };
      $('mnGo').onclick = function () { if (NX.user().mn) cash(); else start(); };
    },
    enter: function () { var g = NX.user().mn; if (g) { cfgMines = g.mines; bet.set(g.bet); } render(); },
    leave: function () { /* keep mn state so game can resume */ }
  };
  NX.minesMult = mult;
})(window.NX);
