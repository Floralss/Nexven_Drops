/* Nexven Drop — gifts catalogue + image helpers */
(function (w) {
  function frag(slug) { return 'https://fragment.com/file/gifts/' + slug + '/thumb.webp'; }
  function big(slug) { return 'https://api.changes.tg/original/' + slug + '.png?size=512'; }
  function enc(s) { return 'data:image/svg+xml,' + encodeURIComponent(s); }

  /* hand-drawn icons for simple items */
  var SVG = {
    ton: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6fd0ff"/><stop offset="1" stop-color="#1768f0"/></linearGradient></defs><circle cx="48" cy="48" r="40" fill="#0b1b3a"/><circle cx="48" cy="48" r="40" fill="none" stroke="url(#a)" stroke-width="4"/><path d="M27 29h42c2.6 0 4.2 2.8 2.9 5L51.3 69c-1.4 2.4-4.9 2.4-6.3 0L24.1 34c-1.3-2.2.3-5 2.9-5z" fill="url(#a)"/><path d="M48 33v34" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/><path d="M33 33h30" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/></svg>',
    bear: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><radialGradient id="a" cx=".4" cy=".35"><stop offset="0" stop-color="#d9a97a"/><stop offset="1" stop-color="#9a6a42"/></radialGradient></defs><circle cx="24" cy="24" r="12" fill="url(#a)"/><circle cx="72" cy="24" r="12" fill="url(#a)"/><circle cx="24" cy="24" r="6" fill="#e9c6a0"/><circle cx="72" cy="24" r="6" fill="#e9c6a0"/><circle cx="48" cy="52" r="30" fill="url(#a)"/><ellipse cx="48" cy="62" rx="14" ry="11" fill="#ecd0ac"/><circle cx="37" cy="46" r="4" fill="#2a1a10"/><circle cx="59" cy="46" r="4" fill="#2a1a10"/><circle cx="38.2" cy="44.8" r="1.3" fill="#fff"/><circle cx="60.2" cy="44.8" r="1.3" fill="#fff"/><ellipse cx="48" cy="57" rx="5" ry="3.6" fill="#2a1a10"/><path d="M48 60.5v4M43 66c2 2 8 2 10 0" stroke="#2a1a10" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
    heart: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7a9c"/><stop offset="1" stop-color="#d11a4a"/></linearGradient></defs><path d="M48 84C20 62 10 46 10 32 10 20 19 12 30 12c8 0 14 4 18 11 4-7 10-11 18-11 11 0 20 8 20 20 0 14-10 30-38 52z" fill="url(#a)"/><path d="M24 30c0-6 4-10 10-10" stroke="#fff" stroke-opacity=".6" stroke-width="5" fill="none" stroke-linecap="round"/></svg>',
    crumb: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><radialGradient id="a" cx=".4" cy=".35"><stop offset="0" stop-color="#dfe6f5"/><stop offset="1" stop-color="#7b88a6"/></radialGradient></defs><path d="M20 58c-6-14 6-30 22-30 8 0 10-6 18-4 12 3 22 16 18 30-3 12-14 20-28 20-14 0-26-4-30-16z" fill="url(#a)"/><circle cx="40" cy="48" r="3" fill="#5b6785"/><circle cx="58" cy="56" r="2.5" fill="#5b6785"/><circle cx="50" cy="40" r="2" fill="#5b6785"/></svg>',
    sticker: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#f0a21c"/></linearGradient></defs><path d="M16 16h50l14 14v50H16z" fill="url(#a)"/><path d="M66 16v14h14z" fill="#fff" fill-opacity=".55"/><path d="M48 32l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="#fff" fill-opacity=".92"/></svg>'
  };
  function ico(k) { return enc(SVG[k]); }

  var G = {
    '1 TON':  { value: 1, nft: false, img: ico('ton'), local: true },
    '2 TON':  { value: 2, nft: false, img: ico('ton'), local: true },
    '5 TON':  { value: 5, nft: false, img: ico('ton'), local: true },
    'Мишка':   { value: 0.1,  nft: false, img: ico('bear'), local: true },
    'Сердце':  { value: 0.08, nft: false, img: ico('heart'), local: true },
    'Крошка':  { value: 0.05, nft: false, img: ico('crumb'), local: true },
    'Наклейка':{ value: 0.05, nft: false, img: ico('sticker'), local: true },

    'Toy Bear':       { value: 15,  nft: false, slug: 'toybear' },
    'Eternal Rose':   { value: 25,  nft: false, slug: 'eternalrose' },
    'Homemade Cake':  { value: 50,  nft: false, slug: 'homemadecake' },
    'Berry Box':      { value: 50,  nft: false, slug: 'berrybox' },
    'Cookie Heart':   { value: 50,  nft: false, slug: 'cookieheart' },
    'B-Day Candle':   { value: 50,  nft: false, slug: 'bdaycandle' },
    'Love Candle':    { value: 50,  nft: false, slug: 'lovecandle' },
    'Desk Calendar':  { value: 50,  nft: false, slug: 'deskcalendar' },
    'Candy Cane':     { value: 500, nft: true,  slug: 'candycane' },

    'Ice Cream':      { value: 505, nft: true, slug: 'icecream' },
    'Top Hat':        { value: 530, nft: true, slug: 'tophat' },
    'Hypno Lollipop': { value: 544, nft: true, slug: 'hypnolollipop' },
    'Lunar Snake':    { value: 549, nft: true, slug: 'lunarsnake' },
    'Jester Hat':     { value: 550, nft: true, slug: 'jesterhat' },
    'Party Sparkler': { value: 587, nft: true, slug: 'partysparkler' },
    'Snow Mittens':   { value: 500, nft: true, slug: 'snowmittens' },
    'Jack-in-the-Box':{ value: 500, nft: true, slug: 'jackinthebox' },
    'Spy Agaric':     { value: 814, nft: true, slug: 'spyagaric' },
    'Kissed Frog':    { value: 721, nft: true, slug: 'kissedfrog' },
    'Jelly Bunny':    { value: 721, nft: true, slug: 'jellybunny' },
    'Trapped Heart':  { value: 690, nft: true, slug: 'trappedheart' },
    'Scared Cat':     { value: 721, nft: true, slug: 'scaredcat' },
    'Magic Potion':   { value: 600, nft: true, slug: 'magicpotion' },
    'Genie Lamp':     { value: 650, nft: true, slug: 'genielamp' },
    'Voodoo Doll':    { value: 655, nft: true, slug: 'voodoodoll' },
    'Crystal Ball':   { value: 666, nft: true, slug: 'crystalball' },
    'Flying Broom':   { value: 650, nft: true, slug: 'flyingbroom' },
    'Witch Hat':      { value: 550, nft: true, slug: 'witchhat' },
    'Santa Hat':      { value: 500, nft: true, slug: 'santahat' },
    'Precious Peach': { value: 900, nft: true, slug: 'preciouspeach' },
    'Plush Pepe':     { value: 900, nft: true, slug: 'plushpepe' },
    "Durov's Cap":    { value: 1000,nft: true, slug: 'durovscap' },
    'Perfume Bottle': { value: 710, nft: true, slug: 'perfumebottle' },
    'Vintage Cigar':  { value: 700, nft: true, slug: 'vintagecigar' },
    'Skull Flower':   { value: 600, nft: true, slug: 'skullflower' },
    'Evil Eye':       { value: 550, nft: true, slug: 'evileye' },
    'Hex Pot':        { value: 550, nft: true, slug: 'hexpot' },
    'Sharp Tongue':   { value: 600, nft: true, slug: 'sharptongue' },
    'Signet Ring':    { value: 700, nft: true, slug: 'signetring' },
    'Spiced Wine':    { value: 500, nft: true, slug: 'spicedwine' },
    'Bunny Muffin':   { value: 510, nft: true, slug: 'bunnymuffin' },
    'Astral Shard':   { value: 800, nft: true, slug: 'astralshard' },
    'Hanging TON':    { value: 505, nft: true, slug: 'hangingstar' }
  };

  function hueOf(name) { var h = 0, i; for (i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0; return h % 360; }
  function fallback(name) { return w.ART ? w.ART.giftFallback(name, hueOf(name)) : ''; }

  /* list of sources to try, best first */
  function sources(name) {
    var g = G[name];
    if (!g) return [fallback(name)];
    if (g.local) return [g.img];
    return [big(g.slug), frag(g.slug), fallback(name)];
  }
  function giftSrc(name) { return sources(name)[0]; }

  /* <img> with automatic fallback chain; keeps picture crisp (big source first) */
  function giftImg(name, cls) {
    var s = sources(name);
    return '<img class="gimg ' + (cls || '') + '" alt="' + String(name).replace(/"/g, '') + '" decoding="async" src="' + s[0] + '"' +
      (s[1] ? ' data-s1="' + s[1] + '"' : '') + (s[2] ? ' data-s2="' + s[2] + '"' : '') + ' onerror="window.nxImgErr(this)">';
  }
  w.nxImgErr = function (el) {
    var n = el.getAttribute('data-s1');
    if (n) { el.removeAttribute('data-s1'); el.src = n; return; }
    n = el.getAttribute('data-s2');
    if (n) { el.removeAttribute('data-s2'); el.src = n; return; }
    el.onerror = null;
  };

  function giftInfo(name) { return G[name] || { value: 10, nft: false }; }

  /* case cover gifts (peek out of the chest) */
  var CASE_GIFT = { free: 'B-Day Candle', dust: 'Desk Calendar', selected: 'Ice Cream', half: 'Plush Pepe', cake: 'Homemade Cake' };

  w.GIFTS = G; w.giftImg = giftImg; w.giftSrc = giftSrc; w.giftInfo = giftInfo; w.CASE_GIFT = CASE_GIFT;
})(window);
