/* Nexven Drop — Craft / upgrade */
(function (NX) {
  'use strict';
  var $ = NX.$, MULTS = [1.5, 2, 3, 5], C = 2 * Math.PI * 104;
  var selId = null, mult = 2, target = null, busy = false, angle = 0;

  function chanceOf(m) { return Math.max(5, Math.floor(100 / m * 0.92)); }
  function items() { return (NX.user().inventory || []).filter(function (it) { return it.status !== 'withdrawing'; }); }
  function selItem() { var l = items(); for (var i = 0; i < l.length; i++) if (l[i].id === selId) return l[i]; return null; }

  function pickTarget() {
    var it = selItem(); if (!it) { target = null; return; }
    var T = it.value * mult, pool = Object.keys(window.GIFTS).map(function (n) { return { name: n, value: window.GIFTS[n].value, nft: window.GIFTS[n].nft }; })
      .filter(function (g) { return g.name !== it.name && !/ TON$/.test(g.name) && g.value >= T * 0.8 && g.value <= T * 1.3; });
    if (pool.length) { var g = pool[NX.randInt(pool.length)]; target = { name: g.name, value: Math.max(g.value, NX.r2(T)), nft: g.nft, img: g.name }; }
    else target = { name: 'TON', value: NX.r2(T), nft: false, cash: true, img: '1 TON' };
  }

  function ringSvg() {
    return '<svg class="ring" viewBox="0 0 240 240" aria-hidden="true"><defs><linearGradient id="upg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5dffc2"/><stop offset="1" stop-color="#14c98a"/></linearGradient>' +
      '<radialGradient id="upbg"><stop offset="0" stop-color="#1a2140"/><stop offset="1" stop-color="#0a0c14"/></radialGradient></defs>' +
      '<circle cx="120" cy="120" r="118" fill="url(#upbg)" stroke="rgba(255,255,255,.07)"/>' +
      '<circle cx="120" cy="120" r="104" fill="none" stroke="#1d2336" stroke-width="16"/>' +
      '<circle id="upArc" cx="120" cy="120" r="104" fill="none" stroke="url(#upg)" stroke-width="16" stroke-linecap="round" stroke-dasharray="0 ' + C + '" transform="rotate(-90 120 120)" style="transition:stroke-dasharray .6s cubic-bezier(.22,1,.36,1);filter:drop-shadow(0 0 8px rgba(43,227,160,.55))"/>' +
      '<g id="upPtr" style="transform-origin:120px 120px"><path d="M120 6l9 18h-18z" fill="#fff" style="filter:drop-shadow(0 0 6px rgba(255,255,255,.9))"/></g></svg>';
  }

  function render() {
    var it = selItem(); if (selId && !it) { selId = null; target = null; }
    var mid = $('upMid'), ch = chanceOf(mult);
    if (it) mid.innerHTML = window.giftImg(it.name) , mid.className = 'up-mid sel';
    else { mid.innerHTML = 'Выберите<br>предметы'; mid.className = 'up-mid'; }
    $('upArc').style.strokeDasharray = it ? (C * ch / 100) + ' ' + C : '0 ' + C;
    $('upPct').textContent = it ? ch + '%' : '';
    var t = $('upTarget');
    if (it && target) { t.className = 'up-target'; t.innerHTML = window.giftImg(target.img) + '<div style="flex:1;min-width:0"><div style="font-weight:800;font-size:15px">' + NX.esc(target.cash ? 'Выигрыш в TON' : target.name) + '</div><div class="hint">Цель · x' + mult + '</div></div><div class="pill-ton" style="font-size:16px">' + NX.tonI(18) + NX.fmt(target.value) + '</div>'; }
    else { t.className = 'hide'; t.innerHTML = ''; }
    NX.qa('#upMults button').forEach(function (b) { b.classList.toggle('on', Number(b.getAttribute('data-m')) === mult); });
    var go = $('upGo'); go.disabled = !it || busy; go.textContent = it ? 'Улучшить · шанс ' + ch + '%' : 'Выберите предмет';
    NX.invGrid($('upInv'), items(), { sel: selId, empty: 'Инвентарь пуст. Откройте кейсы, чтобы получить предметы.', onTap: function (item) { if (busy) return; selId = item.id; pickTarget(); render(); } });
    $('upCnt').textContent = items().length ? items().length + ' шт.' : '';
  }

  function go() {
    var it = selItem(); if (!it || busy || !target) return;
    var u = NX.user(), ch = chanceOf(mult), win = NX.rand() * 100 < ch, tg = target;
    busy = true;
    /* apply result up-front (safe if the app is closed mid-animation) */
    var idx = u.inventory.indexOf(it); if (idx >= 0) u.inventory.splice(idx, 1);
    var cons = 0;
    if (win) { if (tg.cash) u.balance = NX.r2(u.balance + tg.value); else NX.addItem({ name: tg.name, value: tg.value, nft: !!tg.nft }); }
    else { cons = NX.r2(it.value * 0.02); if (cons > 0) u.balance = NX.r2(u.balance + cons); }
    NX.stat('craft'); NX.save(true);
    var zone = ch * 3.6, fin = win ? zone * (0.1 + NX.rand() * 0.8) : zone + (360 - zone) * (0.06 + NX.rand() * 0.88);
    var cur = ((angle % 360) + 360) % 360, to = angle + 360 * 6 + ((((fin - cur) % 360) + 360) % 360);
    var from = angle, t0 = performance.now(), dur = 5000, last = -1, ptr = $('upPtr');
    NX.sfx('open'); NX.haptic('medium'); NX.qa('#upMults button').forEach(function (b) { b.disabled = true; }); $('upGo').disabled = true; $('upGo').textContent = 'Крутим…';
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur), a = from + (to - from) * NX.ease.out5(p);
      ptr.style.transform = 'rotate(' + a.toFixed(2) + 'deg)';
      var tk = Math.floor(a / 14); if (tk !== last) { last = tk; if (p < .97) NX.sfx('tick'); }
      if (p < 1) { requestAnimationFrame(step); return; }
      angle = to; busy = false; NX.qa('#upMults button').forEach(function (b) { b.disabled = false; });
      result(win, it, tg, cons);
    })(t0);
  }

  function result(win, it, tg, cons) {
    NX.renderUser(); selId = null; target = null; render();
    var h = '<div class="rays"></div>';
    if (win) {
      h += '<div class="res-t">Улучшение успешно</div><div class="res-art" style="filter:drop-shadow(0 0 28px ' + NX.tier(tg.value, tg.nft) + ')">' + window.giftImg(tg.img) + '</div><div class="res-n">' + NX.esc(tg.cash ? 'Выигрыш в TON' : tg.name) + '</div><div class="res-v">+' + NX.fmt(tg.value) + ' ' + NX.tonI(22) + '</div>';
      NX.sfx('big'); NX.haptic('success'); NX.confetti(1.6);
    } else {
      h += '<div class="res-t" style="color:#ff8c98">Неудача</div><div class="res-art" style="filter:grayscale(.7) opacity(.7)">' + window.giftImg(it.name) + '</div><div class="res-n">' + NX.esc(it.name) + ' сгорел</div><div class="res-v" style="color:var(--m);font-size:15px">' + (cons > 0 ? 'Утешительный приз +' + NX.fmt(cons) + ' ' : 'Утешительный приз отсутствует ') + (cons > 0 ? NX.tonI(16) : '') + '</div>';
      NX.sfx('lose'); NX.haptic('error');
    }
    h += '<button type="button" class="btn" id="btnResOk">' + (win ? 'Отлично' : 'Закрыть') + '</button>';
    $('modResBody').innerHTML = h; $('btnResOk').onclick = function () { NX.close('modRes'); };
    NX.open('modRes');
  }

  NX.pages.craft = {
    build: function () {
      $('v-craft').innerHTML = NX.pageHead('КРАФТ', 'Улучшай предметы до более редких') +
        '<div class="up-stage">' + ringSvg() + '<div class="up-mid" id="upMid"></div><div class="up-pct" id="upPct"></div></div>' +
        '<div id="upTarget" class="hide"></div>' +
        '<div class="lab" style="margin-top:4px">Множитель</div><div class="up-mults" id="upMults">' + MULTS.map(function (m) { return '<button type="button" data-m="' + m + '">x' + m + '</button>'; }).join('') + '</div>' +
        '<button type="button" class="btn" id="upGo">Выберите предмет</button>' +
        '<div class="inv-box"><div class="inv-head"><b>Инвентарь</b><span class="hint" id="upCnt"></span></div><div id="upInv"></div></div>' +
        '<p class="hint" style="margin:12px 4px 0">При проигрыше предмет сгорает, а вы получаете 2% его стоимости в TON.</p>';
      $('upMults').onclick = function (e) { var b = e.target.closest('[data-m]'); if (!b || busy) return; mult = Number(b.getAttribute('data-m')); pickTarget(); render(); NX.sfx('click'); NX.haptic('select'); };
      $('upGo').onclick = go;
    },
    enter: function () { if (!busy) { selId = null; target = null; } render(); },
    refresh: function () { render(); }
  };
})(window.NX);
