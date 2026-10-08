/* Nexven Drop — cases, opening animation, inventory */
(function (NX) {
  'use strict';
  var $ = NX.$, ART = window.ART;

  /* ===== CASE DATA =====
     Every prize takes its price (TON) from gifts.js, so one table controls the whole economy.
     Pools are tuned to ~90% return-to-player (the free case pays ~0.2 TON on average): about 27-37% of openings pay back the case price,
     small prizes (0.05-0.5 TON) are common, expensive NFTs stay very rare. Chances in each case sum to 100%. */
  function P(name, chance) { var g = window.GIFTS[name] || { value: 0.1, nft: false }; return { name: name, value: g.value, chance: chance, nft: !!g.nft }; }
  var CASES = {
    free: { id: 'free', name: "Daily case", price: 0, desc: "Раз в 24 часа", prizes: [
      P("0.05 TON", 39.357),
      P("0.1 TON", 15.016),
      P("Сердце", 8.546),
      P("Мишка", 8.546),
      P("Подарок", 4.201),
      P("Роза", 4.201),
      P("0.25 TON", 4.201),
      P("0.5 TON", 1.603),
      P("Торт", 1.603),
      P("Букет", 1.603),
      P("Ракета", 1.603),
      P("Бутылка", 1.603),
      P("Ёлка", 1.603),
      P("Санта", 1.603),
      P("Тыква", 1.603),
      P("1 TON", 0.611),
      P("Кубок", 0.611),
      P("Кольцо", 0.611),
      P("Алмаз", 0.611),
      P("2 TON", 0.233),
      P("Ice Cream", 0.133),
      P("Santa Hat", 0.133),
      P("Pool Float", 0.089),
      P("Lol Pop", 0.076)
    ] },
    dust: { id: 'dust', name: "Poronomal case", price: 0.5, desc: "Милые подарки и первые NFT", prizes: [
      P("0.05 TON", 20.334),
      P("0.1 TON", 11.26),
      P("Сердце", 7.97),
      P("Мишка", 7.97),
      P("Подарок", 5.156),
      P("Роза", 5.156),
      P("0.25 TON", 5.156),
      P("0.5 TON", 3.131),
      P("Торт", 3.131),
      P("Букет", 3.131),
      P("Ракета", 3.131),
      P("Бутылка", 3.131),
      P("Ёлка", 3.131),
      P("Санта", 3.131),
      P("Тыква", 3.131),
      P("1 TON", 1.734),
      P("Кубок", 1.734),
      P("Кольцо", 1.734),
      P("Алмаз", 1.734),
      P("2 TON", 0.876),
      P("Ice Cream", 0.62),
      P("Santa Hat", 0.62),
      P("Candy Cane", 0.544),
      P("Snow Mittens", 0.544),
      P("Pool Float", 0.485),
      P("5 TON", 0.401),
      P("Easter Egg", 0.485),
      P("Lol Pop", 0.439)
    ] },
    selected: { id: 'selected', name: "Chromical case", price: 1.5, desc: "Подарки и недорогие NFT", prizes: [
      P("0.1 TON", 10.869),
      P("Сердце", 7.442),
      P("Мишка", 7.442),
      P("Подарок", 4.618),
      P("Роза", 4.618),
      P("0.25 TON", 4.618),
      P("0.5 TON", 2.417),
      P("Торт", 2.417),
      P("Букет", 2.417),
      P("Ракета", 2.417),
      P("Бутылка", 2.417),
      P("Ёлка", 2.417),
      P("Санта", 2.417),
      P("Тыква", 2.417),
      P("1 TON", 1.265),
      P("Кубок", 1.265),
      P("Кольцо", 1.265),
      P("Алмаз", 1.265),
      P("2 TON", 9.125),
      P("Ice Cream", 6.248),
      P("Santa Hat", 6.248),
      P("Candy Cane", 5.41),
      P("Snow Mittens", 5.41),
      P("Jingle Bells", 0.346),
      P("Spiced Wine", 0.346),
      P("Pool Float", 0.346),
      P("5 TON", 0.281),
      P("Hanging Star", 0.281),
      P("Homemade Cake", 0.281),
      P("Berry Box", 0.237),
      P("Cookie Heart", 0.237),
      P("Toy Bear", 0.237),
      P("Happy Brownie", 0.281),
      P("Jack-in-the-Box", 0.22),
      P("Witch Hat", 0.181),
      P("10 TON", 0.147),
      P("Top Hat", 0.135)
    ] },
    half: { id: 'half', name: "50|50 case", price: 3, desc: "Подарок или NFT", prizes: [
      P("Сердце", 8.19),
      P("Мишка", 8.194),
      P("Подарок", 5.726),
      P("Роза", 5.726),
      P("0.5 TON", 3.521),
      P("Торт", 3.521),
      P("Букет", 3.521),
      P("Ракета", 3.521),
      P("Бутылка", 3.521),
      P("Ёлка", 3.521),
      P("Санта", 3.521),
      P("Тыква", 3.521),
      P("1 TON", 2.165),
      P("Кубок", 2.165),
      P("Кольцо", 2.165),
      P("Алмаз", 2.165),
      P("2 TON", 1.331),
      P("Ice Cream", 2.564),
      P("Santa Hat", 2.564),
      P("Candy Cane", 2.301),
      P("Lol Pop", 1.929),
      P("5 TON", 1.792),
      P("Bunny Muffin", 1.792),
      P("Hanging Star", 1.792),
      P("Berry Box", 1.577),
      P("Cookie Heart", 1.577),
      P("Hypno Lollipop", 1.577),
      P("Lunar Snake", 1.577),
      P("Party Sparkler", 1.577),
      P("Toy Bear", 1.577),
      P("Whip Cupcake", 1.577),
      P("Fresh Socks", 1.577),
      P("Snow Globe", 1.577),
      P("Jester Hat", 0.464),
      P("10 TON", 0.43),
      P("Jelly Bunny", 0.43),
      P("Top Hat", 0.403),
      P("Evil Eye", 0.379),
      P("Hex Pot", 0.379),
      P("Kissed Frog", 0.34),
      P("Scared Cat", 0.34),
      P("Trapped Heart", 0.285),
      P("Astral Shard", 0.265),
      P("Skull Flower", 0.248),
      P("Eternal Rose", 0.214),
      P("Vintage Cigar", 0.209),
      P("Magic Potion", 0.199),
      P("Crystal Ball", 0.175),
      P("Genie Lamp", 0.15),
      P("Signet Ring", 0.065),
      P("Perfume Bottle", 0.051),
      P("Diamond Ring", 0.04),
      P("Mini Oscar", 0.012),
      P("Plush Pepe", 0.00004)
    ] },
    candy: { id: 'candy', name: "Candy case", price: 5, desc: "Сладкие NFT и подарки", prizes: [
      P("0.5 TON", 6.495),
      P("Торт", 6.493),
      P("Букет", 6.493),
      P("Ракета", 6.493),
      P("Бутылка", 6.493),
      P("1 TON", 4.189),
      P("Кубок", 4.189),
      P("Кольцо", 4.189),
      P("Алмаз", 4.189),
      P("2 TON", 2.702),
      P("Ice Cream", 2.091),
      P("Santa Hat", 2.091),
      P("Candy Cane", 1.897),
      P("Snow Mittens", 1.897),
      P("Easter Egg", 1.743),
      P("Ginger Cookie", 1.743),
      P("Lol Pop", 1.618),
      P("5 TON", 1.626),
      P("Homemade Cake", 1.626),
      P("Cookie Heart", 1.449),
      P("Holiday Drink", 1.449),
      P("Hypno Lollipop", 1.449),
      P("Lunar Snake", 1.449),
      P("Party Sparkler", 1.449),
      P("Whip Cupcake", 1.449),
      P("Lush Bouquet", 1.449),
      P("Happy Brownie", 1.626),
      P("Jack-in-the-Box", 1.378),
      P("Pet Snake", 1.315),
      P("Sakura Flower", 1.315),
      P("Light Sword", 1.208),
      P("Witch Hat", 1.208),
      P("Jester Hat", 1.121),
      P("10 TON", 1.049),
      P("Jelly Bunny", 1.049),
      P("Top Hat", 0.988),
      P("Ionic Dryer", 1.049),
      P("Evil Eye", 0.935),
      P("Spy Agaric", 0.935),
      P("Kissed Frog", 0.789),
      P("Scared Cat", 0.789),
      P("Trapped Heart", 0.673),
      P("Astral Shard", 0.63),
      P("Skull Flower", 0.593),
      P("Eternal Rose", 0.521),
      P("Love Potion", 0.509),
      P("Vintage Cigar", 0.509),
      P("25 TON", 0.547),
      P("Magic Potion", 0.487),
      P("Signet Ring", 0.109),
      P("Ion Gem", 0.088),
      P("Perfume Bottle", 0.086),
      P("Diamond Ring", 0.067),
      P("Swiss Watch", 0.027)
    ] },
    cake: { id: 'cake', name: "Cake case", price: 8, desc: "Подарки, конфеты и NFT", prizes: [
      P("1 TON", 7.7109),
      P("Алмаз", 7.707),
      P("Кольцо", 7.707),
      P("Кубок", 7.707),
      P("2 TON", 4.74),
      P("B-Day Candle", 2.915),
      P("5 TON", 2.492),
      P("Bunny Muffin", 2.492),
      P("Homemade Cake", 2.492),
      P("Love Candle", 2.492),
      P("Berry Box", 2.193),
      P("Cookie Heart", 2.193),
      P("Holiday Drink", 2.193),
      P("Hypno Lollipop", 2.193),
      P("Party Sparkler", 2.193),
      P("Toy Bear", 2.193),
      P("Whip Cupcake", 2.193),
      P("Money Pot", 2.193),
      P("Light Sword", 1.653),
      P("Sleigh Bell", 1.653),
      P("Snake Box", 1.653),
      P("Witch Hat", 1.653),
      P("Instant Ramen", 1.522),
      P("Jester Hat", 1.522),
      P("10 TON", 1.413),
      P("Input Key", 1.413),
      P("Jelly Bunny", 1.413),
      P("Restless Jar", 1.413),
      P("Top Hat", 1.322),
      P("Snoop Cigar", 1.244),
      P("Evil Eye", 1.244),
      P("Hex Pot", 1.244),
      P("Spy Agaric", 1.244),
      P("Kissed Frog", 1.116),
      P("Scared Cat", 1.116),
      P("Trapped Heart", 0.936),
      P("Vice Cream", 0.936),
      P("Low Rider", 1.016),
      P("Astral Shard", 0.869),
      P("Skull Flower", 0.882),
      P("Record Player", 0.806),
      P("Eternal Rose", 0.764),
      P("Vintage Cigar", 0.744),
      P("25 TON", 0.806),
      P("Magic Potion", 0.709),
      P("Voodoo Doll", 0.678),
      P("Signet Ring", 0.175),
      P("Perfume Bottle", 0.137),
      P("Gem Signet", 0.56),
      P("Diamond Ring", 0.107),
      P("Mini Oscar", 0.032),
      P("Precious Peach", 0.00606)
    ] },
    royal: { id: 'royal', name: "Royal case", price: 15, desc: "Редкие NFT, шанс на Durov's Cap", prizes: [
      P("5 TON", 14.1878),
      P("Pet Snake", 7.095),
      P("Sakura Flower", 7.095),
      P("Light Sword", 5.39),
      P("Instant Ramen", 4.229),
      P("Jester Hat", 4.229),
      P("10 TON", 3.405),
      P("Jelly Bunny", 3.405),
      P("Restless Jar", 3.405),
      P("Top Hat", 2.798),
      P("Snoop Cigar", 2.339),
      P("Evil Eye", 2.339),
      P("Hex Pot", 2.339),
      P("Spy Agaric", 2.339),
      P("Kissed Frog", 1.703),
      P("Scared Cat", 1.703),
      P("Trapped Heart", 3.197),
      P("Vice Cream", 3.197),
      P("Low Rider", 4.075),
      P("Astral Shard", 2.574),
      P("Skull Flower", 2.115),
      P("Record Player", 1.626),
      P("Flying Broom", 1.5),
      P("Cupid Charm", 2.574),
      P("Eternal Rose", 1.388),
      P("Love Potion", 1.287),
      P("Vintage Cigar", 1.287),
      P("Bow Tie", 1.117),
      P("Magic Potion", 1.117),
      P("Voodoo Doll", 0.978),
      P("Crystal Ball", 0.767),
      P("Bonded Ring", 0.218),
      P("Electric Skull", 0.196),
      P("Sharp Tongue", 0.196),
      P("Genie Lamp", 0.154),
      P("Mad Pumpkin", 0.154),
      P("Gem Signet", 0.177),
      P("Signet Ring", 0.102),
      P("Mighty Arm", 0.102),
      P("Ion Gem", 0.066),
      P("Perfume Bottle", 0.062),
      P("Nail Bracelet", 0.042),
      P("Diamond Ring", 0.037),
      P("Swiss Watch", 0.024),
      P("Neko Helmet", 0.02),
      P("Mini Oscar", 0.013),
      P("Loot Bag", 0.00793),
      P("Precious Peach", 0.00255),
      P("Durov's Cap", 0.00074),
      P("25 TON", 1.626)
    ] },
    diamond: { id: 'diamond', name: "Diamond case", price: 30, desc: "Топовые NFT, шанс на Plush Pepe", prizes: [
      P("10 TON", 3.939),
      P("25 TON", 4.099),
      P("Top Hat", 3.955),
      P("Spy Agaric", 3.97),
      P("Kissed Frog", 3.997),
      P("Scared Cat", 3.997),
      P("Trapped Heart", 4.041),
      P("Vice Cream", 4.041),
      P("Astral Shard", 4.059),
      P("Skull Flower", 4.076),
      P("Record Player", 4.099),
      P("Flying Broom", 4.106),
      P("Cupid Charm", 4.059),
      P("Westside Sign", 4.092),
      P("Eternal Rose", 4.113),
      P("Love Potion", 4.1167),
      P("Vintage Cigar", 4.119),
      P("Bling Binky", 4.119),
      P("Bow Tie", 2.301),
      P("Magic Potion", 2.301),
      P("Voodoo Doll", 2.307),
      P("Crystal Ball", 2.319),
      P("Bonded Ring", 2.325),
      P("Electric Skull", 2.33),
      P("Sharp Tongue", 2.33),
      P("Genie Lamp", 2.342),
      P("Mad Pumpkin", 2.342),
      P("Gem Signet", 2.335),
      P("Signet Ring", 0.655),
      P("Mighty Arm", 0.655),
      P("Ion Gem", 0.529),
      P("Perfume Bottle", 0.514),
      P("Nail Bracelet", 0.424),
      P("Diamond Ring", 0.4),
      P("Swiss Watch", 0.164),
      P("Neko Helmet", 0.15),
      P("Mini Oscar", 0.12),
      P("Loot Bag", 0.095),
      P("Heroic Helmet", 0.027),
      P("Precious Peach", 0.023),
      P("Durov's Cap", 0.013),
      P("Heart Locket", 0.0009),
      P("Plush Pepe", 0.00035)
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
