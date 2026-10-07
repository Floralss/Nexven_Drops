/* Real Telegram gift images via Fragment CDN + changes.tg API */
(function (w) {
  function frag(slug) {
    return 'https://fragment.com/file/gifts/' + slug + '/thumb.webp';
  }
  function apiPng(slug) {
    return 'https://api.changes.tg/original/' + slug + '.png?size=128';
  }
  function starSvg() {
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#2a2410"/><path d="M32 10 L38 24 L54 26 L42 36 L46 52 L32 44 L18 52 L22 36 L10 26 L26 24 Z" fill="#f0c14b"/></svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(s);
  }

  // slug = fragment folder name (lowercase, no spaces/apostrophe)
  var G = {
    // TON (currency)
    '1 TON':  { value: 1,   nft: false, img: starSvg() },
    '2 TON': { value: 2,   nft: false, img: starSvg() },
    '5 TON': { value: 5,   nft: false, img: starSvg() },

    // Classic-priced + real collectible thumbs
    'Toy Bear':       { value: 15,  nft: false, img: frag('toybear'), slug: 'toybear' },
    'Eternal Rose':   { value: 25,  nft: false, img: frag('eternalrose'), slug: 'eternalrose' },
    'Homemade Cake':  { value: 50,  nft: false, img: frag('homemadecake'), slug: 'homemadecake' },
    'Berry Box':      { value: 50,  nft: false, img: frag('berrybox'), slug: 'berrybox' },
    'Cookie Heart':   { value: 50,  nft: false, img: frag('cookieheart'), slug: 'cookieheart' },
    'B-Day Candle':   { value: 50,  nft: false, img: frag('bdaycandle'), slug: 'bdaycandle' },
    'Love Candle':    { value: 50,  nft: false, img: frag('lovecandle'), slug: 'lovecandle' },
    'Desk Calendar':  { value: 50,  nft: false, img: frag('deskcalendar'), slug: 'deskcalendar' },

    // Market-style NFTs (real TG collections)
    'Ice Cream':      { value: 505, nft: true, img: frag('icecream'), slug: 'icecream' },
    'Top Hat':        { value: 530, nft: true, img: frag('tophat'), slug: 'tophat' },
    'Hypno Lollipop': { value: 544, nft: true, img: frag('hypnolollipop'), slug: 'hypnolollipop' },
    'Lunar Snake':    { value: 549, nft: true, img: frag('lunarsnake'), slug: 'lunarsnake' },
    'Jester Hat':     { value: 550, nft: true, img: frag('jesterhat'), slug: 'jesterhat' },
    'Party Sparkler': { value: 587, nft: true, img: frag('partysparkler'), slug: 'partysparkler' },
    'Snow Mittens':   { value: 500, nft: true, img: frag('snowmittens'), slug: 'snowmittens' },
    'Jack-in-the-Box':{ value: 500, nft: true, img: frag('jackinthebox'), slug: 'jackinthebox' },
    'Spy Agaric':     { value: 814, nft: true, img: frag('spyagaric'), slug: 'spyagaric' },
    'Kissed Frog':    { value: 721, nft: true, img: frag('kissedfrog'), slug: 'kissedfrog' },
    'Jelly Bunny':    { value: 721, nft: true, img: frag('jellybunny'), slug: 'jellybunny' },
    'Trapped Heart':  { value: 690, nft: true, img: frag('trappedheart'), slug: 'trappedheart' },
    'Scared Cat':     { value: 721, nft: true, img: frag('scaredcat'), slug: 'scaredcat' },
    'Magic Potion':   { value: 600, nft: true, img: frag('magicpotion'), slug: 'magicpotion' },
    'Genie Lamp':     { value: 650, nft: true, img: frag('genielamp'), slug: 'genielamp' },
    'Voodoo Doll':    { value: 655, nft: true, img: frag('voodoodoll'), slug: 'voodoodoll' },
    'Crystal Ball':   { value: 666, nft: true, img: frag('crystalball'), slug: 'crystalball' },
    'Flying Broom':   { value: 650, nft: true, img: frag('flyingbroom'), slug: 'flyingbroom' },
    'Witch Hat':      { value: 550, nft: true, img: frag('witchhat'), slug: 'witchhat' },
    'Santa Hat':      { value: 500, nft: true, img: frag('santahat'), slug: 'santahat' },
    'Precious Peach': { value: 900, nft: true, img: frag('preciouspeach'), slug: 'preciouspeach' },
    'Plush Pepe':     { value: 900, nft: true, img: frag('plushpepe'), slug: 'plushpepe' },
    "Durov's Cap":    { value: 1000,nft: true, img: frag('durovscap'), slug: 'durovscap' },
    'Perfume Bottle': { value: 710, nft: true, img: frag('perfumebottle'), slug: 'perfumebottle' },
    'Vintage Cigar':  { value: 700, nft: true, img: frag('vintagecigar'), slug: 'vintagecigar' },
    'Skull Flower':   { value: 600, nft: true, img: frag('skullflower'), slug: 'skullflower' },
    'Evil Eye':       { value: 550, nft: true, img: frag('evileye'), slug: 'evileye' },
    'Hex Pot':        { value: 550, nft: true, img: frag('hexpot'), slug: 'hexpot' },
    'Sharp Tongue':   { value: 600, nft: true, img: frag('sharptongue'), slug: 'sharptongue' },
    'Signet Ring':    { value: 700, nft: true, img: frag('signetring'), slug: 'signetring' },
    'Spiced Wine':    { value: 500, nft: true, img: frag('spicedwine'), slug: 'spicedwine' },
    'Bunny Muffin':   { value: 510, nft: true, img: frag('bunnymuffin'), slug: 'bunnymuffin' },
    'Astral Shard':   { value: 800, nft: true, img: frag('astralshard'), slug: 'astralshard' },
    'Hanging TON':   { value: 505, nft: true, img: frag('hangingstar'), slug: 'hangingstar' }
  };

  function giftIcon(name) {
    if (typeof CHEAP !== 'undefined' && CHEAP[name]) return CHEAP[name];
    var g = G[name];
    if (g && g.img) return g.img;
    return starSvg();
  }
  function giftInfo(name) {
    return G[name] || { value: 10, nft: false, img: starSvg() };
  }

  // Case cover images
  var CASE_IMG = {
    free: frag('bdaycandle'),
    dust: frag('deskcalendar'),
    cheap: frag('toybear'),
    selected: frag('icecream'),
    vip: frag('plushpepe')
  };

  // Game mode icons (SVG data-uri, not letters)
  function svgIcon(paths, bg) {
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="' + (bg||'#1a1a26') + '"/>' + paths + '</svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(s);
  }
  var GAME_IMG = {
    roulette: 'img/roulette.svg',
    crash: 'img/crash.svg',
    upgrade: 'img/craft.svg',
    plinko: 'img/plinko.svg',
    pickaxe: 'img/mines.svg'
  };


  var CHEAP = {
    'Мишка': svgIcon('<circle cx="32" cy="34" r="14" fill="#8d6a4a"/><circle cx="20" cy="18" r="7" fill="#8d6a4a"/><circle cx="44" cy="18" r="7" fill="#8d6a4a"/><circle cx="27" cy="32" r="2" fill="#111"/><circle cx="37" cy="32" r="2" fill="#111"/>', '#2a2118'),
    'Сердце': svgIcon('<path d="M32 50 L14 30 C8 22 14 12 24 16 C28 18 32 24 32 24 C32 24 36 18 40 16 C50 12 56 22 50 30 Z" fill="#ff5c7a"/>', '#2a1520'),
    'Крошка': svgIcon('<circle cx="32" cy="32" r="8" fill="#9aa4b8"/>', '#1c2230'),
    'Наклейка': svgIcon('<rect x="16" y="18" width="32" height="28" rx="6" fill="#f0c14b"/>', '#2a2410')
  };
  w.GIFTS = G;
  w.giftIcon = giftIcon;
  w.giftInfo = giftInfo;
  w.CASE_IMG = CASE_IMG;
  w.GAME_IMG = GAME_IMG;
})(window);
