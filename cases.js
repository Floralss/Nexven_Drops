/* Nexven Drop — cases, opening animation, inventory */
(function (NX) {
  'use strict';
  var $ = NX.$, ART = window.ART;

  /* ===== CASE DATA =====
     Every prize takes its price (TON) from gifts.js, so one table controls the whole economy.
     v28 odds: paid cases return ~62-74% to the player (house edge 26-38%), only ~13-25% of openings pay back the case price, all NFT chances are cut (x0.6),
     cheap prizes are the common drops. The chance shown on every item is the real chance. Chances in each case sum to 100%. */
  function P(name, chance) { var g = window.GIFTS[name] || { value: 0.1, nft: false }; return { name: name, value: g.value, chance: chance, nft: !!g.nft }; }
  var CASES = {
    free: { id: 'free', name: "Daily case", price: 0, desc: "Раз в 24 часа", prizes: [
      P("0.05 TON", 72.401),
      P("0.1 TON", 0.3),
      P("Сердце", 0.171),
      P("Мишка", 0.171),
      P("Подарок", 3.991),
      P("Роза", 3.991),
      P("0.25 TON", 3.991),
      P("0.5 TON", 1.523),
      P("Торт", 1.523),
      P("Букет", 1.523),
      P("Ракета", 1.523),
      P("Бутылка", 1.523),
      P("Ёлка", 1.523),
      P("Санта", 1.523),
      P("Тыква", 1.523),
      P("1 TON", 0.58),
      P("Кубок", 0.58),
      P("Кольцо", 0.58),
      P("Алмаз", 0.58),
      P("2 TON", 0.221),
      P("Ice Cream", 0.08),
      P("Santa Hat", 0.08),
      P("Pool Float", 0.053),
      P("Lol Pop", 0.046)
    ] },
    dust: { id: 'dust', name: "Poronomal case", price: 0.5, desc: "Милые подарки и первые NFT", prizes: [
      P("0.05 TON", 22.05),
      P("0.1 TON", 12.211),
      P("Сердце", 8.643),
      P("Мишка", 8.643),
      P("Подарок", 4.887),
      P("Роза", 4.887),
      P("0.25 TON", 4.887),
      P("0.5 TON", 2.974),
      P("Торт", 2.968),
      P("Букет", 2.968),
      P("Ракета", 2.968),
      P("Бутылка", 2.968),
      P("Ёлка", 2.968),
      P("Санта", 2.968),
      P("Тыква", 2.968),
      P("1 TON", 1.647),
      P("Кубок", 1.647),
      P("Кольцо", 1.647),
      P("Алмаз", 1.647),
      P("2 TON", 0.832),
      P("Ice Cream", 0.372),
      P("Santa Hat", 0.372),
      P("Candy Cane", 0.326),
      P("Snow Mittens", 0.326),
      P("Pool Float", 0.291),
      P("5 TON", 0.381),
      P("Easter Egg", 0.291),
      P("Lol Pop", 0.263)
    ] },
    selected: { id: 'selected', name: "Chromical case", price: 1.5, desc: "Подарки и недорогие NFT", prizes: [
      P("0.1 TON", 11.126),
      P("Сердце", 7.621),
      P("Мишка", 7.621),
      P("Подарок", 4.729),
      P("Роза", 4.729),
      P("0.25 TON", 4.729),
      P("0.5 TON", 2.475),
      P("Торт", 2.475),
      P("Букет", 2.475),
      P("Ракета", 2.475),
      P("Бутылка", 2.475),
      P("Ёлка", 2.475),
      P("Санта", 2.475),
      P("Тыква", 2.475),
      P("1 TON", 3.675),
      P("Кубок", 3.675),
      P("Кольцо", 3.675),
      P("Алмаз", 3.675),
      P("2 TON", 8.669),
      P("Ice Cream", 3.749),
      P("Santa Hat", 3.749),
      P("Candy Cane", 3.246),
      P("Snow Mittens", 3.246),
      P("Jingle Bells", 0.208),
      P("Spiced Wine", 0.208),
      P("Pool Float", 0.208),
      P("5 TON", 0.267),
      P("Hanging Star", 0.169),
      P("Homemade Cake", 0.169),
      P("Berry Box", 0.142),
      P("Cookie Heart", 0.142),
      P("Toy Bear", 0.142),
      P("Happy Brownie", 0.169),
      P("Jack-in-the-Box", 0.132),
      P("Witch Hat", 0.109),
      P("10 TON", 0.14),
      P("Top Hat", 0.081)
    ] },
    half: { id: 'half', name: "50|50 case", price: 3, desc: "Подарок или NFT", prizes: [
      P("Сердце", 8.634),
      P("Мишка", 8.638),
      P("Подарок", 6.037),
      P("Роза", 6.037),
      P("0.5 TON", 3.712),
      P("Торт", 3.712),
      P("Букет", 3.712),
      P("Ракета", 3.712),
      P("Бутылка", 3.712),
      P("Ёлка", 3.712),
      P("Санта", 3.712),
      P("Тыква", 3.712),
      P("1 TON", 2.282),
      P("Кубок", 2.282),
      P("Кольцо", 2.282),
      P("Алмаз", 2.282),
      P("2 TON", 10.654),
      P("Ice Cream", 1.538),
      P("Santa Hat", 1.538),
      P("Candy Cane", 1.381),
      P("Lol Pop", 1.157),
      P("5 TON", 1.702),
      P("Bunny Muffin", 1.075),
      P("Hanging Star", 1.075),
      P("Berry Box", 0.946),
      P("Cookie Heart", 0.946),
      P("Hypno Lollipop", 0.946),
      P("Lunar Snake", 0.946),
      P("Party Sparkler", 0.946),
      P("Toy Bear", 0.946),
      P("Whip Cupcake", 0.946),
      P("Fresh Socks", 0.946),
      P("Snow Globe", 0.946),
      P("Jester Hat", 0.278),
      P("10 TON", 0.409),
      P("Jelly Bunny", 0.258),
      P("Top Hat", 0.242),
      P("Evil Eye", 0.227),
      P("Hex Pot", 0.227),
      P("Kissed Frog", 0.204),
      P("Scared Cat", 0.204),
      P("Trapped Heart", 0.171),
      P("Astral Shard", 0.159),
      P("Skull Flower", 0.149),
      P("Eternal Rose", 0.128),
      P("Vintage Cigar", 0.125),
      P("Magic Potion", 0.119),
      P("Crystal Ball", 0.105),
      P("Genie Lamp", 0.09),
      P("Signet Ring", 0.039),
      P("Perfume Bottle", 0.031),
      P("Diamond Ring", 0.024),
      P("Mini Oscar", 0.007),
      P("Plush Pepe", 0)
    ] },
    candy: { id: 'candy', name: "Candy case", price: 5, desc: "Сладкие NFT и подарки", prizes: [
      P("0.5 TON", 8.76),
      P("Торт", 8.757),
      P("Букет", 8.757),
      P("Ракета", 8.757),
      P("Бутылка", 8.757),
      P("1 TON", 5.649),
      P("Кубок", 5.649),
      P("Кольцо", 5.649),
      P("Алмаз", 5.649),
      P("2 TON", 3.644),
      P("Ice Cream", 1.255),
      P("Santa Hat", 1.255),
      P("Candy Cane", 1.138),
      P("Snow Mittens", 1.138),
      P("Easter Egg", 1.046),
      P("Ginger Cookie", 1.046),
      P("Lol Pop", 0.971),
      P("5 TON", 1.545),
      P("Homemade Cake", 0.976),
      P("Cookie Heart", 0.869),
      P("Holiday Drink", 0.869),
      P("Hypno Lollipop", 0.869),
      P("Lunar Snake", 0.869),
      P("Party Sparkler", 0.869),
      P("Whip Cupcake", 0.869),
      P("Lush Bouquet", 0.869),
      P("Happy Brownie", 0.976),
      P("Jack-in-the-Box", 0.827),
      P("Pet Snake", 0.789),
      P("Sakura Flower", 0.789),
      P("Light Sword", 0.725),
      P("Witch Hat", 0.725),
      P("Jester Hat", 0.673),
      P("10 TON", 0.997),
      P("Jelly Bunny", 0.629),
      P("Top Hat", 0.593),
      P("Ionic Dryer", 0.629),
      P("Evil Eye", 0.561),
      P("Spy Agaric", 0.561),
      P("Kissed Frog", 0.473),
      P("Scared Cat", 0.473),
      P("Trapped Heart", 0.404),
      P("Astral Shard", 0.378),
      P("Skull Flower", 0.356),
      P("Eternal Rose", 0.313),
      P("Love Potion", 0.305),
      P("Vintage Cigar", 0.305),
      P("25 TON", 0.52),
      P("Magic Potion", 0.292),
      P("Signet Ring", 0.065),
      P("Ion Gem", 0.053),
      P("Perfume Bottle", 0.052),
      P("Diamond Ring", 0.04),
      P("Swiss Watch", 0.016)
    ] },
    cake: { id: 'cake', name: "Cake case", price: 8, desc: "Подарки, конфеты и NFT", prizes: [
      P("1 TON", 9.132),
      P("Алмаз", 9.127),
      P("Кольцо", 9.127),
      P("Кубок", 9.127),
      P("2 TON", 5.613),
      P("B-Day Candle", 1.749),
      P("5 TON", 19.935),
      P("Bunny Muffin", 1.495),
      P("Homemade Cake", 1.495),
      P("Love Candle", 1.495),
      P("Berry Box", 1.316),
      P("Cookie Heart", 1.316),
      P("Holiday Drink", 1.316),
      P("Hypno Lollipop", 1.316),
      P("Party Sparkler", 1.316),
      P("Toy Bear", 1.316),
      P("Whip Cupcake", 1.316),
      P("Money Pot", 1.316),
      P("Light Sword", 0.992),
      P("Sleigh Bell", 0.992),
      P("Snake Box", 0.992),
      P("Witch Hat", 0.992),
      P("Instant Ramen", 0.913),
      P("Jester Hat", 0.913),
      P("10 TON", 1.342),
      P("Input Key", 0.848),
      P("Jelly Bunny", 0.848),
      P("Restless Jar", 0.848),
      P("Top Hat", 0.793),
      P("Snoop Cigar", 0.746),
      P("Evil Eye", 0.746),
      P("Hex Pot", 0.746),
      P("Spy Agaric", 0.746),
      P("Kissed Frog", 0.67),
      P("Scared Cat", 0.67),
      P("Trapped Heart", 0.562),
      P("Vice Cream", 0.562),
      P("Low Rider", 0.61),
      P("Astral Shard", 0.521),
      P("Skull Flower", 0.529),
      P("Record Player", 0.484),
      P("Eternal Rose", 0.458),
      P("Vintage Cigar", 0.446),
      P("25 TON", 0.766),
      P("Magic Potion", 0.425),
      P("Voodoo Doll", 0.407),
      P("Signet Ring", 0.105),
      P("Perfume Bottle", 0.082),
      P("Gem Signet", 0.336),
      P("Diamond Ring", 0.064),
      P("Mini Oscar", 0.019),
      P("Precious Peach", 0.004)
    ] },
    royal: { id: 'royal', name: "Royal case", price: 15, desc: "Редкие NFT, шанс на Durov's Cap", prizes: [
      P("5 TON", 30.216),
      P("Pet Snake", 4.257),
      P("Sakura Flower", 4.257),
      P("Light Sword", 3.234),
      P("Instant Ramen", 2.537),
      P("Jester Hat", 2.537),
      P("10 TON", 19.774),
      P("Jelly Bunny", 2.043),
      P("Restless Jar", 2.043),
      P("Top Hat", 1.679),
      P("Snoop Cigar", 1.403),
      P("Evil Eye", 1.403),
      P("Hex Pot", 1.403),
      P("Spy Agaric", 1.403),
      P("Kissed Frog", 1.022),
      P("Scared Cat", 1.022),
      P("Trapped Heart", 1.918),
      P("Vice Cream", 1.918),
      P("Low Rider", 2.445),
      P("Astral Shard", 1.544),
      P("Skull Flower", 1.269),
      P("Record Player", 0.976),
      P("Flying Broom", 0.9),
      P("Cupid Charm", 1.544),
      P("Eternal Rose", 0.833),
      P("Love Potion", 0.772),
      P("Vintage Cigar", 0.772),
      P("Bow Tie", 0.67),
      P("Magic Potion", 0.67),
      P("Voodoo Doll", 0.587),
      P("Crystal Ball", 0.46),
      P("Bonded Ring", 0.131),
      P("Electric Skull", 0.118),
      P("Sharp Tongue", 0.118),
      P("Genie Lamp", 0.092),
      P("Mad Pumpkin", 0.092),
      P("Gem Signet", 0.106),
      P("Signet Ring", 0.061),
      P("Mighty Arm", 0.061),
      P("Ion Gem", 0.04),
      P("Perfume Bottle", 0.037),
      P("Nail Bracelet", 0.025),
      P("Diamond Ring", 0.022),
      P("Swiss Watch", 0.014),
      P("Neko Helmet", 0.012),
      P("Mini Oscar", 0.008),
      P("Loot Bag", 0.005),
      P("Precious Peach", 0.002),
      P("Durov's Cap", 0),
      P("25 TON", 1.545)
    ] },
    diamond: { id: 'diamond', name: "Diamond case", price: 30, desc: "Топовые NFT, шанс на Plush Pepe", prizes: [
      P("10 TON", 29.052),
      P("25 TON", 15.773),
      P("Top Hat", 2.373),
      P("Spy Agaric", 2.382),
      P("Kissed Frog", 2.398),
      P("Scared Cat", 2.398),
      P("Trapped Heart", 2.425),
      P("Vice Cream", 2.425),
      P("Astral Shard", 2.435),
      P("Skull Flower", 2.446),
      P("Record Player", 2.459),
      P("Flying Broom", 2.464),
      P("Cupid Charm", 2.435),
      P("Westside Sign", 2.455),
      P("Eternal Rose", 2.468),
      P("Love Potion", 2.47),
      P("Vintage Cigar", 2.471),
      P("Bling Binky", 2.471),
      P("Bow Tie", 1.381),
      P("Magic Potion", 1.381),
      P("Voodoo Doll", 1.384),
      P("Crystal Ball", 1.391),
      P("Bonded Ring", 1.395),
      P("Electric Skull", 1.398),
      P("Sharp Tongue", 1.398),
      P("Genie Lamp", 1.405),
      P("Mad Pumpkin", 1.405),
      P("Gem Signet", 1.401),
      P("Signet Ring", 0.393),
      P("Mighty Arm", 0.393),
      P("Ion Gem", 0.317),
      P("Perfume Bottle", 0.308),
      P("Nail Bracelet", 0.254),
      P("Diamond Ring", 0.24),
      P("Swiss Watch", 0.098),
      P("Neko Helmet", 0.09),
      P("Mini Oscar", 0.072),
      P("Loot Bag", 0.057),
      P("Heroic Helmet", 0.016),
      P("Precious Peach", 0.014),
      P("Durov's Cap", 0.008),
      P("Heart Locket", 0.001),
      P("Plush Pepe", 0)
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

  /* v28: return to the opened case's screen after the result window is closed */
  function backToCase(id) { if (id && CASES[id] && $('shCaseBody')) { selCase = id; refreshSheet(); NX.open('shCase'); } }

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
    NX.afterRes = function () { backToCase(c.id); };
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
      (wd ? '' : '<button type="button" class="btn" id="btnSell">Продать за ' + NX.fmt(item.value) + ' TON</button><button type="button" class="btn ghost" id="btnWd">Вывести подарок</button>' + wdNote(item));
    var s = $('btnSell'), w = $('btnWd');
    if (s) s.onclick = function () { sellItem(item); };
    if (w) w.onclick = function () { withdrawItem(item); };
    NX.open('modItem');
  };
  /* v26: withdrawal is only for gifts worth >= WD_MIN_TON and only while the player has withdrawal access (>= 100 Stars top-up = 7 days) */
  /* gift name -> base64url (start param may only contain A-Za-z0-9_-, max 64 chars), cut to fit */
  function b64name(name) {
    try {
      var bytes = unescape(encodeURIComponent(String(name || ''))), out = '';
      while (bytes.length > 30) bytes = bytes.slice(0, -1);
      out = btoa(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      return out;
    } catch (e) { return ''; }
  }
  function canWd(item) { return item.value + 1e-9 >= NX.WD_MIN_TON; }
  function wdNote(item) {
    var t;
    if (!canWd(item)) t = 'Вывод доступен только для подарков от ' + NX.WD_MIN_TON + ' TON';
    else if (NX.wdAccessOn()) t = 'Бесплатный вывод активен ещё ' + NX.wdAccessText();
    else t = 'Для вывода пополни от ' + NX.WD_ACCESS_STARS + ' Stars — откроется бесплатный вывод на ' + NX.WD_ACCESS_DAYS + ' дн.';
    return '<div class="hint" style="margin-top:10px">' + t + '</div>';
  }
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
    if (!canWd(item)) { NX.toast('Вывод только для подарков от ' + NX.WD_MIN_TON + ' TON', 'error'); return; }
    if (!NX.wdAccessOn()) {
      NX.close('modItem'); NX.toast('Нужен доступ к выводу: пополни от ' + NX.WD_ACCESS_STARS + ' Stars', 'error');
      setTimeout(function () { NX.openDeposit(NX.WD_ACCESS_STARS); }, 350); return;
    }
    var wdId = 'wd' + Date.now().toString(36) + Math.floor(Math.random() * 1679616).toString(36);  /* letters+digits only, so the last 8 chars are safe inside a start link */
    item.status = 'withdrawing'; item.wd_id = wdId; item.wd_at = Date.now();
    var short = 'wd_' + Math.round(item.value * 100) + '_' + wdId.slice(-8) + '_' + b64name(item.name);
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
