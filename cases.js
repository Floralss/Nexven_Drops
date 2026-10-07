/* Nexven Drop — cases, opening animation, inventory */
(function (NX) {
  'use strict';
  var $ = NX.$, ART = window.ART;

  /* ===== CASE DATA (names / prices / odds unchanged) ===== */
  /* helper: prize taken from the gifts catalogue (value comes from gifts.js) */
  function gp(name, chance) { var g = window.GIFTS[name] || {}; return { name: name, value: g.value || 10, chance: chance, nft: !!g.nft }; }
  var CASES = {
    free: { id: 'free', name: 'Daily case', price: 0, desc: 'Раз в 24 часа', prizes: [
      { name: 'Мишка', value: 0.05, chance: 46 }, { name: 'Сердце', value: 0.08, chance: 34 }, { name: '1 TON', value: 1, chance: 20 },
      { name: 'Plush Pepe', value: 900, chance: 0.001, nft: true }
    ] },
    dust: { id: 'dust', name: 'Poronomal case', price: 0.8, desc: 'Мишки, сердца и редкие NFT', prizes: [
      { name: 'Мишка', value: 0.12, chance: 40 }, { name: 'Сердце', value: 0.16, chance: 32 }, { name: '1 TON', value: 1, chance: 28 },
      { name: 'Крошка', value: 0.05, chance: 6 }, { name: 'Наклейка', value: 0.05, chance: 6 }, { name: '2 TON', value: 2, chance: 1.2 },
      gp('Toy Bear', 0.08), gp('Eternal Rose', 0.04),
      { name: 'Ice Cream', value: 640, chance: 0.001, nft: true },
      gp('Top Hat', 0.001), gp('Hypno Lollipop', 0.001), gp('Jester Hat', 0.001), gp('Snow Mittens', 0.001), gp('Santa Hat', 0.001), gp('Witch Hat', 0.001), gp('Evil Eye', 0.001)
    ] },
    selected: { id: 'selected', name: 'Chromical case', price: 2.4, desc: 'Редкие плюши и NFT', prizes: [
      { name: 'Мишка', value: 0.2, chance: 36 }, { name: 'Сердце', value: 0.3, chance: 30 }, { name: '1 TON', value: 1, chance: 34 },
      { name: '2 TON', value: 2, chance: 6 }, { name: '5 TON', value: 5, chance: 1 },
      gp('Toy Bear', 0.25), gp('Eternal Rose', 0.12), gp('Cookie Heart', 0.05), gp('Love Candle', 0.05),
      { name: 'Crystal Ball', value: 1200, chance: 0.001, nft: true },
      gp('Lunar Snake', 0.002), gp('Party Sparkler', 0.002), gp('Magic Potion', 0.002), gp('Genie Lamp', 0.002), gp('Voodoo Doll', 0.002),
      gp('Flying Broom', 0.002), gp('Skull Flower', 0.002), gp('Hex Pot', 0.002), gp('Sharp Tongue', 0.002), gp('Spiced Wine', 0.002), gp('Bunny Muffin', 0.002)
    ] },
    half: { id: 'half', name: '50|50 case', price: 5, desc: 'Мишка или NFT', prizes: [
      { name: 'Мишка', value: 0.4, chance: 99.9 },
      { name: 'Plush Pepe', value: 1600, chance: 0.1, nft: true },
      gp('Precious Peach', 0.004), gp('Durov\'s Cap', 0.003), gp('Spy Agaric', 0.004), gp('Kissed Frog', 0.004), gp('Jelly Bunny', 0.004), gp('Scared Cat', 0.004),
      gp('Trapped Heart', 0.004), gp('Perfume Bottle', 0.004), gp('Vintage Cigar', 0.004), gp('Signet Ring', 0.004), gp('Astral Shard', 0.004), gp('Hanging TON', 0.004),
      gp('Crystal Ball', 0.004), gp('Genie Lamp', 0.004), gp('Jack-in-the-Box', 0.004)
    ] },
    cake: { id: 'cake', name: 'Cake case', price: 8, desc: 'Конфеты, торты и NFT', prizes: [
      { name: 'Мишка', value: 0.3, chance: 28 }, { name: 'Сердце', value: 0.4, chance: 24 }, { name: '1 TON', value: 1, chance: 22 },
      { name: 'Homemade Cake', value: 2, chance: 16 }, { name: 'Berry Box', value: 2.4, chance: 10 },
      { name: '2 TON', value: 2, chance: 4 }, { name: '5 TON', value: 5, chance: 1.5 },
      gp('Cookie Heart', 0.4), gp('B-Day Candle', 0.4), gp('Love Candle', 0.4), gp('Desk Calendar', 0.4), gp('Toy Bear', 0.3), gp('Eternal Rose', 0.15),
      { name: 'Candy Cane', value: 1800, chance: 0.001, nft: true }, { name: 'Ice Cream', value: 2100, chance: 0.001, nft: true },
      gp('Snow Mittens', 0.002), gp('Santa Hat', 0.002), gp('Spiced Wine', 0.002), gp('Bunny Muffin', 0.002), gp('Party Sparkler', 0.002),
      gp('Hypno Lollipop', 0.002), gp('Top Hat', 0.002), gp('Jester Hat', 0.002), gp('Lunar Snake', 0.002), gp('Plush Pepe', 0.001), gp('Precious Peach', 0.001)
    ] }
  };
  NX.CASES = CASES;

  /* every prize drops at exactly its listed chance; NFTs are listed at a tiny chance, so they are very rare */
  function roll(prizes) {
    var pool = prizes.filter(function (p) { return p.chance > 0; });
    var t = 0, i; for (i = 0; i < pool.length; i++) t += pool[i].chance;
    var r = NX.rand() * t;
    for (i = 0; i < pool.length; i++) { r -= pool[i].chance; if (r <= 0) return pool[i]; }
    return pool[pool.length - 1];
  }
  NX.roll = roll;
  function isTonPrize(p) { return /^\d+(\.\d+)? TON$/.test(p.name) && !p.nft; }

  function art(id) { return ART.caseArt(id, window.giftImg(window.CASE_GIFT[id], '')); }

  /* ===== cases page ===== */
  var filter = 'all', selCase = null, qty = 1, demo = false, fast = false, opening = false, tickT = null;
  try { fast = localStorage.getItem('nv_fast') === '1'; } catch (e) {}

  function freeLeft() { var u = NX.user(); return (u.last_free || 0) + 86400000 - Date.now(); }
  function hms(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (x < 10 ? '0' : '') + x;
  }
  function priceHtml(c) {
    if (c.id === 'free') {
      var l = freeLeft();
      return l > 0 ? '<span class="cprice wait" data-free>' + hms(l) + '</span>' : '<span class="cprice free" data-free>БЕСПЛАТНО</span>';
    }
    return '<span class="cprice">' + NX.tonI(16) + NX.fmt(c.price) + '</span>';
  }
  function caseCard(c, i, wide) {
    return '<button type="button" class="ccard' + (wide ? ' wide' : '') + '" data-case="' + c.id + '" style="animation-delay:' + (i * 70) + 'ms">' + art(c.id) +
      '<div class="cname">' + c.name + '</div><div class="cdesc">' + c.desc + '</div>' + priceHtml(c) + '</button>';
  }
  function renderCases() {
    var body = $('csBody'); if (!body) return;
    var paid = ['dust', 'selected', 'half', 'cake'], html = '', i = 0;
    if (filter !== 'paid') html += '<div class="sec">Free</div><div class="cgrid">' + caseCard(CASES.free, i++, true) + '</div>';
    if (filter !== 'free') html += '<div class="sec">Кейсы</div><div class="cgrid">' + paid.map(function (k) { return caseCard(CASES[k], i++, false); }).join('') + '</div>';
    body.innerHTML = html;
  }
  function tickFree() {
    NX.qa('[data-free]').forEach(function (el) {
      var l = freeLeft();
      if (l > 0) { el.className = 'cprice wait'; el.textContent = hms(l); }
      else if (el.className.indexOf('free') < 0) { el.className = 'cprice free'; el.textContent = 'БЕСПЛАТНО'; }
    });
    if (selCase === 'free') refreshSheet();
  }

  NX.pages.cases = {
    build: function () {
      $('v-cases').innerHTML = '<div class="chips" id="csChips"><button type="button" class="chip on" data-f="all">Все</button><button type="button" class="chip" data-f="free">Free</button><button type="button" class="chip" data-f="paid">Платные</button></div><div id="csBody"></div>';
      $('csChips').onclick = function (e) {
        var b = e.target.closest('.chip'); if (!b) return;
        filter = b.getAttribute('data-f'); NX.qa('.chip', $('csChips')).forEach(function (x) { x.classList.toggle('on', x === b); });
        NX.sfx('click'); NX.haptic('select'); renderCases();
      };
      $('v-cases').addEventListener('click', function (e) { var b = e.target.closest('[data-case]'); if (b) { NX.sfx('click'); openSheet(b.getAttribute('data-case')); } });
    },
    enter: function () { renderCases(); clearInterval(tickT); tickT = setInterval(tickFree, 1000); },
    leave: function () { clearInterval(tickT); }
  };

  /* ===== preview sheet ===== */
  function openSheet(id) {
    var c = CASES[id]; if (!c) return;
    selCase = id; qty = 1; demo = false;
    var items = c.prizes.slice().sort(function (a, b) { return b.value - a.value; });
    $('shCaseBody').innerHTML =
      '<div class="cs-top"><div class="cs-art">' + art(id) + '</div><div><div class="cs-n">' + c.name + '</div><div class="cs-d">' + c.desc + '</div><span id="csPrice"></span></div></div>' +
      '<div class="sw-row"><span>Демо-режим</span><label class="sw"><input type="checkbox" id="demoMode"><i></i></label></div>' +
      '<div class="sw-row"><span>Быстрое открытие</span><label class="sw"><input type="checkbox" id="fastOpen"' + (fast ? ' checked' : '') + '><i></i></label></div>' +
      (id === 'free' ? '' : '<div class="lab">Сколько открыть?</div><div class="qty" id="qtyBox">' + [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" data-q="' + n + '"' + (n === 1 ? ' class="on"' : '') + '>' + n + '</button>'; }).join('') + '</div>') +
      '<div class="lab">Содержимое кейса</div><div class="items">' + items.map(function (p) {
        return '<div class="it' + (p.nft ? ' nft' : '') + '" style="--rc:' + NX.tier(p.value, p.nft) + '">' + window.giftImg(p.name) +
          '<div class="it-n">' + NX.esc(p.name) + '</div><div class="it-v">' + NX.tonI(13) + NX.fmt(p.value) + '</div><div class="it-c">' + p.chance + '%</div></div>';
      }).join('') + '</div>' +
      '<button type="button" class="btn" id="btnOpen" style="margin-top:16px"></button>';
    $('demoMode').onchange = function () { demo = this.checked; refreshSheet(); NX.haptic('select'); };
    $('fastOpen').onchange = function () { fast = this.checked; try { localStorage.setItem('nv_fast', fast ? '1' : '0'); } catch (e) {} NX.haptic('select'); };
    var qb = $('qtyBox');
    if (qb) qb.onclick = function (e) {
      var b = e.target.closest('[data-q]'); if (!b) return;
      qty = Number(b.getAttribute('data-q')); NX.qa('[data-q]', qb).forEach(function (x) { x.classList.toggle('on', x === b); });
      NX.sfx('click'); NX.haptic('select'); refreshSheet();
    };
    $('btnOpen').onclick = function () { if (!this.disabled) startOpen(); };
    refreshSheet();
    $('shCase').querySelector('.sh-p').scrollTop = 0;
    NX.open('shCase');
  }
  function refreshSheet() {
    if (!selCase || !$('btnOpen')) return;
    var c = CASES[selCase], u = NX.user(), btn = $('btnOpen'), ok = true, pr = $('csPrice');
    if (c.id === 'free') {
      var l = freeLeft();
      if (l > 0) { ok = demo; pr.innerHTML = '<span class="cprice wait">' + hms(l) + '</span>'; btn.textContent = demo ? 'Открыть демо' : 'Доступно через ' + hms(l); }
      else { pr.innerHTML = '<span class="cprice free">БЕСПЛАТНО</span>'; btn.textContent = demo ? 'Открыть демо' : 'Открыть бесплатно'; }
    } else {
      pr.innerHTML = '<span class="cprice">' + NX.tonI(16) + NX.fmt(c.price) + '</span>';
      var cost = NX.r2(c.price * qty);
      if (demo) btn.textContent = 'Открыть демо' + (qty > 1 ? ' ×' + qty : '');
      else if (!NX.canPay(cost)) { ok = false; btn.textContent = 'Не хватает TON · нужно ' + NX.fmt(cost); }
      else btn.textContent = 'Открыть' + (qty > 1 ? ' ×' + qty : '') + ' · ' + NX.fmt(cost) + ' TON';
    }
    btn.disabled = !ok;
  }

  /* ===== opening ===== */
  function fillerFor(c) {
    var pool = c.prizes, tot = 0, ws = pool.map(function (p) { var w = Math.sqrt(Math.max(p.chance, 0.6)) + 0.8; tot += w; return w; });
    return function () { var r = NX.rand() * tot, i; for (i = 0; i < pool.length; i++) { r -= ws[i]; if (r <= 0) return pool[i]; } return pool[pool.length - 1]; };
  }
  function siHtml(p) { return '<div class="si" style="--rc:' + NX.tier(p.value, p.nft) + '">' + window.giftImg(p.name) + '<span>' + NX.esc(p.name) + '</span></div>'; }

  function startOpen() {
    if (opening) return;
    var c = CASES[selCase], u = NX.user(), n = c.id === 'free' ? 1 : qty, isDemo = demo;
    if (!isDemo) {
      if (c.id === 'free') { if (freeLeft() > 0) { NX.toast('Бесплатный кейс ещё не готов', 'error'); return; } }
      else { var cost = NX.r2(c.price * n); if (!NX.canPay(cost)) { NX.toast('Не хватает TON', 'error'); return; } }
    }
    opening = true; NX.close('shCase');
    var wins = [], i;
    for (i = 0; i < n; i++) wins.push(roll(c.prizes));
    var added = [], tonGain = 0;
    if (!isDemo) {
      if (c.id === 'free') u.last_free = Date.now(); else NX.spend(c.price * n);
      wins.forEach(function (p) {
        if (isTonPrize(p)) tonGain += p.value; else added.push(NX.addItem(p));
        NX.noteBest(p.name, p.value);
      });
      if (tonGain) u.balance = NX.r2(u.balance + tonGain);
      NX.stat('opened', n); NX.save(true);
    }
    /* build strips */
    var rows = $('spinRows'), filler = fillerFor(c), N = 54, W = 46, small = n > 1, html = '';
    for (i = 0; i < n; i++) {
      var s = '', k;
      for (k = 0; k < N; k++) s += siHtml(k === W ? wins[i] : filler());
      html += '<div class="srow' + (small ? ' small' : '') + '"><div class="mk"></div><div class="strip">' + s + '</div></div>';
    }
    rows.innerHTML = html;
    $('spinTitle').textContent = c.name + (n > 1 ? ' ×' + n : '') + (isDemo ? ' · демо' : '');
    $('spinSub').textContent = 'Открываем…';
    $('spin').classList.add('on'); NX.sfx('open'); NX.haptic('medium');
    var skipBtn = $('spinSkip'); skipBtn.classList.add('hide');
    var strips = NX.qa('.strip', rows), skip = false, t0 = performance.now() + 250, done = 0, lastIdx = {};
    var base = fast ? 1100 : 4800;
    var info = strips.map(function (st, idx) {
      var it = st.children[0], iw = it.offsetWidth + 8, cw = st.parentNode.clientWidth;
      var tx = cw / 2 - (W * iw + it.offsetWidth / 2) + (NX.rand() - .5) * it.offsetWidth * .6;
      return { st: st, iw: iw, cw: cw, tx: tx, dur: base + idx * (fast ? 150 : 380), fin: false };
    });
    if (!fast) setTimeout(function () { if (opening) skipBtn.classList.remove('hide'); }, 1600);
    skipBtn.onclick = function () { skip = true; };
    var guard = setTimeout(function () { if (opening) { skip = true; } }, 20000);
    (function frame(now) {
      var all = true;
      try {
      info.forEach(function (o, idx) {
        if (o.fin) return;
        var t = skip ? 1 : Math.max(0, Math.min(1, (now - t0) / o.dur));
        var x = o.tx * NX.ease.out5(t);
        o.st.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
        var ix = Math.floor((o.cw / 2 - x) / o.iw);
        if (idx === 0 && lastIdx[idx] !== ix) { lastIdx[idx] = ix; if (t < .985) { NX.sfx('tick'); if (ix % 2) NX.haptic('light'); } }
        if (t >= 1) { o.fin = true; o.st.children[W].classList.add('win'); NX.sfx('land'); } else all = false;
      });
      } catch (err) { all = true; try { console.error(err); } catch (x) {} }
      if (!all) requestAnimationFrame(frame);
      else { clearTimeout(guard); setTimeout(function () { finishOpen(c, wins, added, isDemo, tonGain); }, skip ? 450 : 850); }
    })(performance.now());
  }

  function finishOpen(c, wins, added, isDemo, tonGain) {
    $('spin').classList.remove('on'); $('spinSkip').classList.add('hide');
    opening = false; if (!wins.length) return;
    NX.renderUser(); if (NX.cur() === 'cases') renderCases();
    var best = wins.reduce(function (a, b) { return b.value > a.value ? b : a; }, wins[0]);
    var sum = NX.r2(wins.reduce(function (s, p) { return s + p.value; }, 0));
    var html = '<div class="rays"></div><div class="res-t">' + (isDemo ? 'Демо-режим' : 'Ваш дроп') + '</div>';
    if (wins.length === 1) {
      html += '<div class="res-art" style="filter:drop-shadow(0 0 28px ' + NX.tier(best.value, best.nft) + ')">' + window.giftImg(best.name) + '</div>' +
        '<div class="res-n">' + NX.esc(best.name) + (best.nft ? ' · NFT' : '') + '</div>';
    } else {
      html += '<div class="res-multi">' + wins.map(function (p, i) {
        return '<div class="it' + (p.nft ? ' nft' : '') + '" style="--rc:' + NX.tier(p.value, p.nft) + ';animation-delay:' + (i * 90) + 'ms">' + window.giftImg(p.name) + '<div class="it-n">' + NX.esc(p.name) + '</div><div class="it-v">' + NX.tonI(13) + NX.fmt(p.value) + '</div></div>';
      }).join('') + '</div><div class="res-n">Предметов: ' + wins.length + '</div>';
    }
    html += '<div class="res-v">' + (isDemo ? '' : '+') + NX.fmt(sum) + ' ' + NX.tonI(22) + '</div>' +
      '<button type="button" class="btn" id="btnResOk">' + (isDemo ? 'Закрыть' : 'Забрать') + '</button>';
    var sellable = added.reduce(function (s, e) { return s + e.value; }, 0);
    if (!isDemo && added.length) html += '<button type="button" class="btn ghost" id="btnResSell">Продать за ' + NX.fmt(sellable) + ' TON</button>';
    $('modResBody').innerHTML = html;
    $('btnResOk').onclick = function () { NX.close('modRes'); NX.sfx('click'); };
    var sb = $('btnResSell');
    if (sb) sb.onclick = function () {
      var ids = added.map(function (e) { return e.id; }), u = NX.user();
      u.inventory = u.inventory.filter(function (it) { return ids.indexOf(it.id) < 0; });
      NX.credit(sellable); NX.toast('Продано +' + NX.fmt(sellable) + ' TON', 'success'); NX.sfx('win'); NX.close('modRes');
    };
    NX.open('modRes');
    if (best.value >= 50) { NX.sfx('big'); NX.haptic('success'); NX.confetti(1.6); } else if (best.value >= 1) { NX.sfx('win'); NX.haptic('success'); NX.confetti(.6); } else NX.sfx('gem');
  }

  /* ===== inventory (shared) ===== */
  NX.invGrid = function (box, items, opt) {
    opt = opt || {};
    if (!items.length) { box.innerHTML = '<div class="empty">' + (opt.empty || 'Инвентарь пуст. Откройте кейсы, чтобы получить предметы.') + '</div>'; return; }
    box.innerHTML = '<div class="items">' + items.map(function (it, i) {
      return '<button type="button" class="it tap' + (it.nft ? ' nft' : '') + (it.status === 'withdrawing' ? ' wd' : '') + (opt.sel === it.id ? ' sel' : '') + '" data-i="' + i + '" style="--rc:' + NX.tier(it.value, it.nft) + '">' +
        (it.status === 'withdrawing' ? '<span class="tagw">ВЫВОД</span>' : '') + window.giftImg(it.name) +
        '<div class="it-n">' + NX.esc(it.name) + '</div><div class="it-v">' + NX.tonI(13) + NX.fmt(it.value) + '</div></button>';
    }).join('') + '</div>';
    box.onclick = function (e) {
      var b = e.target.closest('[data-i]'); if (!b) return;
      NX.sfx('click'); NX.haptic('select'); if (opt.onTap) opt.onTap(items[Number(b.getAttribute('data-i'))]);
    };
  };

  NX.showItem = function (item) {
    var wd = item.status === 'withdrawing', body = $('modItemBody');
    body.innerHTML = '<button type="button" class="mx" data-close="modItem" aria-label="Закрыть">✕</button>' +
      '<div class="res-art" style="width:130px;height:130px;filter:drop-shadow(0 0 24px ' + NX.tier(item.value, item.nft) + ')">' + window.giftImg(item.name) + '</div>' +
      '<div class="res-n">' + NX.esc(item.name) + '</div>' +
      '<div class="res-v" style="margin-bottom:6px">' + NX.fmt(item.value) + ' ' + NX.tonI(22) + '</div>' +
      '<div class="hint" style="margin-bottom:14px">' + (wd ? 'На выводе (до 7 дней)' : (item.nft ? 'NFT-подарок' : 'Подарок')) + '</div>' +
      (wd ? '' : '<button type="button" class="btn" id="btnSell">Продать за ' + NX.fmt(item.value) + ' TON</button><button type="button" class="btn ghost" id="btnWd">Вывести подарок</button>');
    var s = $('btnSell'), w = $('btnWd');
    if (s) s.onclick = function () { sellItem(item); };
    if (w) w.onclick = function () { withdrawItem(item); };
    NX.open('modItem');
  };
  function sellItem(item) {
    var u = NX.user(), i = u.inventory.indexOf(item); if (i < 0) return;
    u.inventory.splice(i, 1); NX.credit(item.value); NX.close('modItem');
    NX.toast('Продано +' + NX.fmt(item.value) + ' TON', 'success'); NX.sfx('win'); NX.haptic('success');
    if (NX.pages.profile && NX.cur() === 'profile') NX.pages.profile.enter();
    if (NX.cur() === 'craft' && NX.pages.craft.refresh) NX.pages.craft.refresh();
  }
  function withdrawItem(item) {
    var u = NX.user();
    if (item.status === 'withdrawing') { NX.toast('Уже на выводе', 'error'); return; }
    var wdId = 'wd_' + Date.now() + '_' + Math.floor(Math.random() * 9999);
    item.status = 'withdrawing'; item.wd_id = wdId; item.wd_at = Date.now();
    var short = 'wd_' + u.id + '_' + item.value + '_' + wdId.slice(-8);
    u.wd_requests = u.wd_requests || [];
    u.wd_requests.push({ wd_id: wdId, name: item.name, value: item.value, nft: !!item.nft, uid: u.id, username: u.username || '', first_name: u.first_name || '', status: 'pending', ts: Date.now() });
    NX.save(true); NX.close('modItem'); NX.toast('Заявка на вывод создана (до 7 дней)', 'success');
    try { if (NX.tg && NX.tg.openTelegramLink) NX.tg.openTelegramLink('https://t.me/' + NX.BOT + '?start=' + short); } catch (e) {}
    if (NX.cur() === 'profile') NX.pages.profile.enter();
  }

  NX.onBalance = refreshSheet;
})(window.NX);
