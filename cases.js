/* Nexven Drop — cases, opening animation, inventory */
(function (NX) {
  'use strict';
  var $ = NX.$, ART = window.ART;

  /* ===== CASE DATA =====
     Every prize takes its price (TON) from gifts.js, so one table controls the whole economy.
     Pools are tuned to ~90% return-to-player: about 30-45% of openings pay back the case price,
     cheap gifts/NFTs are common, expensive NFTs stay rare. Chances in each case sum to 100%. */
  function P(name, chance) { var g = window.GIFTS[name] || { value: 0.1, nft: false }; return { name: name, value: g.value, chance: chance, nft: !!g.nft }; }
  var CASES = {
    free: { id: 'free', name: "Daily case", price: 0, desc: "Раз в 24 часа", prizes: [
      P("Мишка", 25.978),
      P("Сердце", 26),
      P("Подарок", 10),
      P("Роза", 10),
      P("0.5 TON", 4.4),
      P("Букет", 4.4),
      P("Бутылка", 4.4),
      P("Ракета", 4.4),
      P("Торт", 4.4),
      P("1 TON", 1.38),
      P("Алмаз", 1.38),
      P("Кольцо", 1.38),
      P("Кубок", 1.38),
      P("2 TON", 0.113),
      P("Ice Cream", 0.113),
      P("Santa Hat", 0.113),
      P("Candy Cane", 0.113),
      P("Lol Pop", 0.025),
      P("Toy Bear", 0.025)
    ] },
    dust: { id: 'dust', name: "Poronomal case", price: 1, desc: "Милые подарки и первые NFT", prizes: [
      P("Мишка", 11.097),
      P("Сердце", 11.05),
      P("Подарок", 11.05),
      P("Роза", 11.05),
      P("0.5 TON", 5.18),
      P("Букет", 5.18),
      P("Бутылка", 5.18),
      P("Ракета", 5.18),
      P("Торт", 5.18),
      P("1 TON", 4.48),
      P("Алмаз", 4.48),
      P("Кольцо", 4.48),
      P("Кубок", 4.48),
      P("2 TON", 1.59),
      P("Ice Cream", 1.59),
      P("Santa Hat", 1.59),
      P("Candy Cane", 1.59),
      P("Snow Mittens", 1.59),
      P("Easter Egg", 0.598),
      P("Lol Pop", 0.598),
      P("5 TON", 0.598),
      P("Hypno Lollipop", 0.598),
      P("Lunar Snake", 0.149),
      P("Toy Bear", 0.598),
      P("Jack-in-the-Box", 0.149),
      P("Sakura Flower", 0.149),
      P("Light Sword", 0.149),
      P("Witch Hat", 0.149),
      P("Jester Hat", 0.149),
      P("Astral Shard", 0.033),
      P("Eternal Rose", 0.033),
      P("Vintage Cigar", 0.033)
    ] },
    selected: { id: 'selected', name: "Chromical case", price: 3, desc: "Подарки и недорогие NFT", prizes: [
      P("Мишка", 3.19),
      P("Сердце", 3.2),
      P("Подарок", 3.2),
      P("Роза", 3.2),
      P("0.5 TON", 4.25),
      P("Букет", 4.25),
      P("Бутылка", 4.25),
      P("Ракета", 4.25),
      P("Торт", 4.25),
      P("1 TON", 4.75),
      P("Алмаз", 4.75),
      P("Кольцо", 4.75),
      P("Кубок", 4.75),
      P("Ice Cream", 4.47),
      P("Santa Hat", 4.47),
      P("Candy Cane", 4.47),
      P("Snow Mittens", 4.47),
      P("Jingle Bells", 4.47),
      P("Spiced Wine", 4.47),
      P("5 TON", 4.47),
      P("Hanging Star", 1.68),
      P("Homemade Cake", 1.68),
      P("Berry Box", 1.68),
      P("Cookie Heart", 1.68),
      P("Hypno Lollipop", 1.68),
      P("Toy Bear", 1.68),
      P("Jack-in-the-Box", 0.745),
      P("Witch Hat", 0.745),
      P("Jester Hat", 0.745),
      P("10 TON", 0.745),
      P("Top Hat", 0.745),
      P("Evil Eye", 0.745),
      P("Kissed Frog", 0.252),
      P("Scared Cat", 0.252),
      P("Trapped Heart", 0.252),
      P("Astral Shard", 0.252),
      P("Eternal Rose", 0.028),
      P("Magic Potion", 0.028),
      P("Genie Lamp", 0.028),
      P("Signet Ring", 0.028)
    ] },
    half: { id: 'half', name: "50|50 case", price: 5, desc: "Подарок или NFT", prizes: [
      P("Мишка", 4.303),
      P("Сердце", 4.22),
      P("Подарок", 4.22),
      P("Роза", 4.22),
      P("0.5 TON", 3.24),
      P("Букет", 3.24),
      P("Бутылка", 3.24),
      P("Ракета", 3.24),
      P("Торт", 3.24),
      P("1 TON", 3.04),
      P("Алмаз", 3.04),
      P("Кольцо", 3.04),
      P("Кубок", 3.04),
      P("2 TON", 4.05),
      P("Ice Cream", 1.01),
      P("Santa Hat", 1.01),
      P("Candy Cane", 1.01),
      P("Snow Mittens", 1.01),
      P("Spiced Wine", 1.01),
      P("Lol Pop", 1.01),
      P("5 TON", 3.04),
      P("Bunny Muffin", 3.04),
      P("Hanging Star", 3.04),
      P("Berry Box", 3.04),
      P("Cookie Heart", 3.04),
      P("Hypno Lollipop", 3.04),
      P("Lunar Snake", 3.04),
      P("Party Sparkler", 3.04),
      P("Toy Bear", 3.04),
      P("Whip Cupcake", 3.04),
      P("Jester Hat", 1.18),
      P("10 TON", 1.18),
      P("Jelly Bunny", 1.18),
      P("Top Hat", 1.18),
      P("Evil Eye", 1.18),
      P("Hex Pot", 1.18),
      P("Spy Agaric", 1.18),
      P("Kissed Frog", 1.18),
      P("Scared Cat", 1.18),
      P("Trapped Heart", 0.507),
      P("Astral Shard", 0.507),
      P("Skull Flower", 0.507),
      P("Flying Broom", 0.507),
      P("Eternal Rose", 0.507),
      P("Vintage Cigar", 0.507),
      P("Magic Potion", 0.091),
      P("Crystal Ball", 0.091),
      P("Genie Lamp", 0.091),
      P("Signet Ring", 0.091),
      P("Perfume Bottle", 0.091),
      P("Diamond Ring", 0.025),
      P("Mini Oscar", 0.025),
      P("Plush Pepe", 0.0002)
    ] },
    candy: { id: 'candy', name: "Candy case", price: 6, desc: "Сладкие NFT и подарки", prizes: [
      P("0.5 TON", 5.892),
      P("Букет", 5.77),
      P("Бутылка", 5.77),
      P("Ракета", 5.77),
      P("Торт", 5.77),
      P("1 TON", 3.31),
      P("Алмаз", 3.31),
      P("Кольцо", 3.31),
      P("Кубок", 3.31),
      P("2 TON", 1.98),
      P("Ice Cream", 1.98),
      P("Santa Hat", 1.98),
      P("Candy Cane", 1.98),
      P("Snow Mittens", 1.98),
      P("Easter Egg", 1.5),
      P("Ginger Cookie", 1.5),
      P("Lol Pop", 1.5),
      P("5 TON", 1.5),
      P("Homemade Cake", 1.5),
      P("Cookie Heart", 1.5),
      P("Holiday Drink", 1.5),
      P("Hypno Lollipop", 1.5),
      P("Lunar Snake", 1.5),
      P("Party Sparkler", 1.5),
      P("Whip Cupcake", 1.5),
      P("Jack-in-the-Box", 2.02),
      P("Pet Snake", 2.02),
      P("Sakura Flower", 2.02),
      P("Light Sword", 2.02),
      P("Witch Hat", 2.02),
      P("Jester Hat", 2.02),
      P("10 TON", 2.02),
      P("Jelly Bunny", 2.02),
      P("Top Hat", 2.02),
      P("Evil Eye", 1.98),
      P("Spy Agaric", 1.98),
      P("Kissed Frog", 1.98),
      P("Scared Cat", 1.98),
      P("Trapped Heart", 1.98),
      P("Astral Shard", 0.562),
      P("Skull Flower", 0.562),
      P("Eternal Rose", 0.562),
      P("Love Potion", 0.562),
      P("Vintage Cigar", 0.562),
      P("Magic Potion", 0.114),
      P("Signet Ring", 0.114),
      P("Ion Gem", 0.114),
      P("Perfume Bottle", 0.114),
      P("Diamond Ring", 0.021),
      P("Swiss Watch", 0.021)
    ] },
    cake: { id: 'cake', name: "Cake case", price: 8, desc: "Подарки, конфеты и NFT", prizes: [
      P("0.5 TON", 3.367),
      P("Букет", 3.33),
      P("Бутылка", 3.33),
      P("Ракета", 3.33),
      P("Торт", 3.33),
      P("1 TON", 3.88),
      P("Алмаз", 3.88),
      P("Кольцо", 3.88),
      P("Кубок", 3.88),
      P("2 TON", 2.26),
      P("B-Day Candle", 2.26),
      P("5 TON", 1.94),
      P("Bunny Muffin", 1.94),
      P("Homemade Cake", 2.26),
      P("Love Candle", 2.26),
      P("Berry Box", 2.26),
      P("Cookie Heart", 2.26),
      P("Holiday Drink", 1.94),
      P("Hypno Lollipop", 1.94),
      P("Party Sparkler", 1.94),
      P("Toy Bear", 1.94),
      P("Whip Cupcake", 1.94),
      P("Light Sword", 2.11),
      P("Sleigh Bell", 2.11),
      P("Snake Box", 2.11),
      P("Witch Hat", 2.11),
      P("Instant Ramen", 2.11),
      P("Jester Hat", 2.11),
      P("10 TON", 2.11),
      P("Input Key", 2.11),
      P("Jelly Bunny", 2.11),
      P("Restless Jar", 2.11),
      P("Top Hat", 2.11),
      P("Evil Eye", 1.8),
      P("Hex Pot", 1.8),
      P("Spy Agaric", 1.8),
      P("Kissed Frog", 1.8),
      P("Scared Cat", 1.8),
      P("Trapped Heart", 1.8),
      P("Vice Cream", 1.8),
      P("Astral Shard", 0.775),
      P("Skull Flower", 0.775),
      P("Record Player", 0.775),
      P("Eternal Rose", 0.775),
      P("Vintage Cigar", 0.775),
      P("Magic Potion", 0.206),
      P("Voodoo Doll", 0.206),
      P("Signet Ring", 0.206),
      P("Perfume Bottle", 0.206),
      P("Diamond Ring", 0.048),
      P("Mini Oscar", 0.048),
      P("Precious Peach", 0.048)
    ] },
    royal: { id: 'royal', name: "Royal case", price: 15, desc: "Редкие NFT, шанс на Durov's Cap", prizes: [
      P("1 TON", 9.262),
      P("Алмаз", 9.21),
      P("Кольцо", 9.21),
      P("Кубок", 9.21),
      P("2 TON", 1.92),
      P("Jingle Bells", 1.92),
      P("5 TON", 2.06),
      P("Pet Snake", 1.92),
      P("Sakura Flower", 1.92),
      P("Light Sword", 1.92),
      P("Instant Ramen", 2.06),
      P("Jester Hat", 2.06),
      P("10 TON", 1.6),
      P("Jelly Bunny", 2.06),
      P("Restless Jar", 1.6),
      P("Top Hat", 2.06),
      P("Evil Eye", 1.6),
      P("Hex Pot", 1.6),
      P("Spy Agaric", 2.06),
      P("Kissed Frog", 1.6),
      P("Scared Cat", 1.6),
      P("Trapped Heart", 1.94),
      P("Vice Cream", 1.94),
      P("Astral Shard", 1.94),
      P("Skull Flower", 1.94),
      P("Record Player", 1.94),
      P("Flying Broom", 1.94),
      P("Eternal Rose", 1.83),
      P("Love Potion", 1.83),
      P("Vintage Cigar", 1.83),
      P("Bow Tie", 1.83),
      P("Magic Potion", 1.83),
      P("Voodoo Doll", 1.83),
      P("Crystal Ball", 1.03),
      P("Bonded Ring", 1.03),
      P("Electric Skull", 1.03),
      P("Sharp Tongue", 1.03),
      P("Genie Lamp", 1.03),
      P("Mad Pumpkin", 1.03),
      P("Signet Ring", 0.755),
      P("Ion Gem", 0.755),
      P("Perfume Bottle", 0.755),
      P("Diamond Ring", 0.137),
      P("Swiss Watch", 0.137),
      P("Neko Helmet", 0.137),
      P("Mini Oscar", 0.023),
      P("Loot Bag", 0.023),
      P("Precious Peach", 0.023),
      P("Durov's Cap", 0.003)
    ] },
    diamond: { id: 'diamond', name: "Diamond case", price: 25, desc: "Топовые NFT, шанс на Plush Pepe", prizes: [
      P("1 TON", 3.129),
      P("Алмаз", 3.05),
      P("Кольцо", 3.05),
      P("Кубок", 3.05),
      P("2 TON", 2.86),
      P("Jingle Bells", 2.86),
      P("5 TON", 2.86),
      P("Pet Snake", 2.86),
      P("Light Sword", 2.86),
      P("Jester Hat", 2.86),
      P("10 TON", 2.67),
      P("Jelly Bunny", 2.86),
      P("Top Hat", 2.86),
      P("Spy Agaric", 2.86),
      P("Kissed Frog", 2.67),
      P("Scared Cat", 2.67),
      P("Trapped Heart", 2.67),
      P("Vice Cream", 2.67),
      P("Astral Shard", 2.86),
      P("Skull Flower", 2.86),
      P("Record Player", 2.86),
      P("Flying Broom", 2.86),
      P("Eternal Rose", 2.86),
      P("Love Potion", 2.7),
      P("Vintage Cigar", 2.86),
      P("Bow Tie", 2.7),
      P("Magic Potion", 2.7),
      P("Voodoo Doll", 2.7),
      P("Crystal Ball", 2.7),
      P("Bonded Ring", 2.7),
      P("Electric Skull", 2.1),
      P("Sharp Tongue", 2.1),
      P("Genie Lamp", 2.1),
      P("Mad Pumpkin", 2.1),
      P("Signet Ring", 2.1),
      P("Ion Gem", 1.27),
      P("Perfume Bottle", 1.27),
      P("Diamond Ring", 1.27),
      P("Swiss Watch", 0.286),
      P("Neko Helmet", 0.286),
      P("Mini Oscar", 0.286),
      P("Loot Bag", 0.048),
      P("Precious Peach", 0.048),
      P("Durov's Cap", 0.006),
      P("Heart Locket", 0.0008),
      P("Plush Pepe", 0.0002)
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
  var filter = 'all', selCase = null, qty = 1, demo = false, fast = false, opening = false, tickT = null, cur = null;
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
    var paid = ['dust', 'selected', 'half', 'candy', 'cake', 'royal', 'diamond'], html = '', i = 0;
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

  var failT = null;
  NX.skipSpin = function () { var b = $('spinSkip'); if (b && b.onclick) b.onclick(); };
  function startOpen() {
    if (opening) return;
    var c = CASES[selCase], u = NX.user(), n = c.id === 'free' ? 1 : qty, isDemo = demo;
    if (!isDemo) {
      if (c.id === 'free') { if (freeLeft() > 0) { NX.toast('Бесплатный кейс ещё не готов', 'error'); return; } }
      else { var cost = NX.r2(c.price * n); if (!NX.canPay(cost)) { NX.toast('Не хватает TON', 'error'); return; } }
    }
    opening = true; NX.close('shCase'); cur = null;
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
    cur = { c: c, wins: wins, added: added, isDemo: isDemo, tonGain: tonGain, t: Date.now() };
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
    var tokRef = cur, maxDur = Math.max.apply(null, info.map(function (o) { return o.dur; })) + 2500;
    clearTimeout(failT); failT = setTimeout(function () { if (cur === tokRef) finishOpen(c, wins, added, isDemo, tonGain, tokRef); }, maxDur);
    (function frame(now) {
      var all = true;
      info.forEach(function (o, idx) {
        if (o.fin) return;
        var t = skip ? 1 : Math.max(0, Math.min(1, (now - t0) / o.dur));
        var x = o.tx * NX.ease.out5(t);
        o.st.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
        var ix = Math.floor((o.cw / 2 - x) / o.iw);
        if (idx === 0 && lastIdx[idx] !== ix) { lastIdx[idx] = ix; if (t < .985) { NX.sfx('tick'); if (ix % 2) NX.haptic('light'); } }
        if (t >= 1) { o.fin = true; o.st.children[W].classList.add('win'); NX.sfx('land'); } else all = false;
      });
      if (!all) requestAnimationFrame(frame);
      else setTimeout(function () { finishOpen(c, wins, added, isDemo, tonGain, tokRef); }, skip ? 450 : 850);
    })(performance.now());
  }

  function finishOpen(c, wins, added, isDemo, tonGain, tok) {
    if (!cur) { if (!opening) return; }
    if (tok && tok !== cur) return;
    cur = null; clearTimeout(failT);
    $('spin').classList.remove('on'); $('spinSkip').classList.add('hide');
    opening = false;
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
    if (best.value >= 20) { NX.sfx('big'); NX.haptic('success'); NX.confetti(1.6); } else if (best.value >= 1) { NX.sfx('win'); NX.haptic('success'); NX.confetti(.6); } else NX.sfx('gem');
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
  NX.openGuard = function () { if (cur && Date.now() - cur.t > 12000) { var o = cur; finishOpen(o.c, o.wins, o.added, o.isDemo, o.tonGain); } };
})(window.NX);

/* watchdog: if the animation ever stalls (page frozen / error), finish the open instead of leaving a dead overlay */
(function (NX) {
  setInterval(function () {
    var ov = document.getElementById('spin');
    if (ov && ov.classList.contains('on') && NX.openGuard) NX.openGuard();
  }, 1500);
})(window.NX);
