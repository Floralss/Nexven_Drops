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
    sticker: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#f0a21c"/></linearGradient></defs><path d="M16 16h50l14 14v50H16z" fill="url(#a)"/><path d="M66 16v14h14z" fill="#fff" fill-opacity=".55"/><path d="M48 32l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="#fff" fill-opacity=".92"/></svg>',
    ring: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe9a0"/><stop offset="1" stop-color="#d49a1c"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8fbff"/><stop offset="1" stop-color="#4fb4ff"/></linearGradient></defs><ellipse cx="48" cy="62" rx="26" ry="24" fill="none" stroke="url(#a)" stroke-width="9"/><path d="M36 26l7-10h10l7 10-12 14z" fill="url(#b)" stroke="#fff" stroke-opacity=".7" stroke-width="1.5"/><path d="M36 26h24M43 16l5 24 5-24" stroke="#fff" stroke-opacity=".7" stroke-width="1.2" fill="none"/></svg>',
    bottle: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2c8a4f"/><stop offset=".5" stop-color="#4cc07a"/><stop offset="1" stop-color="#1d6b3b"/></linearGradient><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe9a0"/><stop offset="1" stop-color="#d49a1c"/></linearGradient></defs><path d="M41 8h14v6l-2 4v10c0 6 12 10 12 24v28c0 4-3 8-8 8H39c-5 0-8-4-8-8V52c0-14 12-18 12-24V18l-2-4z" fill="url(#a)"/><path d="M41 8h14v10H41z" fill="url(#g)"/><rect x="34" y="52" width="28" height="22" rx="3" fill="#fff4cf"/><path d="M40 60h16M40 66h10" stroke="#b9801c" stroke-width="3" stroke-linecap="round"/><path d="M38 40c0 4-2 6-2 10" stroke="#fff" stroke-opacity=".5" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',
    gift: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7a8c"/><stop offset="1" stop-color="#d11a3c"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe9a0"/><stop offset="1" stop-color="#e0a21c"/></linearGradient></defs><rect x="14" y="38" width="68" height="46" rx="6" fill="url(#a)"/><rect x="10" y="28" width="76" height="16" rx="5" fill="#ff93a2"/><rect x="42" y="28" width="12" height="56" fill="url(#b)"/><path d="M48 28C36 28 26 24 30 16s16-2 18 12c2-14 14-20 18-12s-6 12-18 12z" fill="url(#b)"/></svg>',
    rose: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><radialGradient id="a" cx=".4" cy=".35"><stop offset="0" stop-color="#ff7a8c"/><stop offset="1" stop-color="#b3122f"/></radialGradient></defs><path d="M48 50v38" stroke="#2f9a4a" stroke-width="5" stroke-linecap="round"/><path d="M48 72c10-2 16-8 18-14-10 0-16 4-18 14zM48 78c-8-1-14-6-16-11 9 0 14 4 16 11z" fill="#3cb85a"/><circle cx="48" cy="34" r="22" fill="url(#a)"/><path d="M36 30c4-10 22-10 24 2-3 8-16 12-22 4M44 34c2-5 10-4 10 2" stroke="#fff" stroke-opacity=".45" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',
    cake: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd1e3"/><stop offset="1" stop-color="#ff7eb6"/></linearGradient></defs><rect x="16" y="52" width="64" height="30" rx="8" fill="#c9783c"/><rect x="16" y="40" width="64" height="20" rx="8" fill="url(#a)"/><path d="M16 52c6 8 10-2 16 6s10-4 16 6 10-4 16 6 10-2 16-4v-10H16z" fill="#fff4f8"/><rect x="45" y="22" width="6" height="18" rx="2" fill="#4aa3ff"/><path d="M48 8c5 6 5 10 0 13-5-3-5-7 0-13z" fill="#ffb629"/></svg>',
    bouquet: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe3ef"/><stop offset="1" stop-color="#e68ab0"/></linearGradient></defs><circle cx="32" cy="30" r="12" fill="#ff5d8f"/><circle cx="52" cy="22" r="12" fill="#ffb629"/><circle cx="68" cy="34" r="12" fill="#a971ff"/><circle cx="46" cy="40" r="12" fill="#ff7a8c"/><circle cx="32" cy="30" r="4" fill="#fff" fill-opacity=".6"/><circle cx="52" cy="22" r="4" fill="#fff" fill-opacity=".6"/><circle cx="68" cy="34" r="4" fill="#fff" fill-opacity=".6"/><path d="M20 48h56l-14 40H34z" fill="url(#a)"/><path d="M34 88l10-40M62 88L52 48" stroke="#fff" stroke-opacity=".6" stroke-width="2"/></svg>',
    rocket: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9fb3d6"/><stop offset=".5" stop-color="#f4f8ff"/><stop offset="1" stop-color="#8aa0c8"/></linearGradient></defs><path d="M30 62L14 80l4 2 16-6zM66 62l16 18-4 2-16-6z" fill="#d9264a"/><path d="M48 6c14 12 18 30 16 56H32C30 36 34 18 48 6z" fill="url(#a)"/><path d="M48 6c8 7 12 14 14 22H34c2-8 6-15 14-22z" fill="#e03a52"/><circle cx="48" cy="40" r="8" fill="#1b2a4a"/><circle cx="48" cy="40" r="5.5" fill="#6fd0ff"/><path d="M40 66h16l-4 18h-8z" fill="#ff9d2e"/><path d="M44 66h8l-2 12h-4z" fill="#fff3a0"/></svg>',
    trophy: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b0"/><stop offset="1" stop-color="#d49a1c"/></linearGradient></defs><path d="M26 14h44v22c0 14-10 24-22 24S26 50 26 36z" fill="url(#a)"/><path d="M26 22H12c0 14 6 22 16 24M70 22h14c0 14-6 22-16 24" stroke="url(#a)" stroke-width="6" fill="none" stroke-linecap="round"/><rect x="42" y="58" width="12" height="14" fill="#c98a14"/><rect x="30" y="72" width="36" height="12" rx="4" fill="url(#a)"/><path d="M36 22v14" stroke="#fff" stroke-opacity=".6" stroke-width="4" stroke-linecap="round"/></svg>',
    tree: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fdc7a"/><stop offset="1" stop-color="#1c7a3c"/></linearGradient></defs><rect x="42" y="74" width="12" height="14" rx="2" fill="#8a5a2c"/><path d="M48 8l20 24H56l16 22H58l18 22H20l18-22H24l16-22H28z" fill="url(#a)"/><path d="M48 8l3 6-3 3-3-3z" fill="#ffd34d"/><circle cx="40" cy="44" r="3" fill="#ff5d6e"/><circle cx="56" cy="58" r="3" fill="#ffd34d"/><circle cx="42" cy="68" r="3" fill="#6fd0ff"/><circle cx="52" cy="32" r="2.6" fill="#ffd34d"/></svg>',
    santa: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5d6e"/><stop offset="1" stop-color="#c4162e"/></linearGradient></defs><path d="M22 34c2-18 14-26 28-26 8 0 14 4 16 10l14 20H22z" fill="url(#a)"/><circle cx="76" cy="38" r="8" fill="#fff"/><rect x="18" y="32" width="60" height="12" rx="6" fill="#fff"/><circle cx="48" cy="58" r="20" fill="#ffd9b8"/><path d="M26 58c0 22 10 30 22 30s22-8 22-30c-6 8-14 10-22 10s-16-2-22-10z" fill="#fff"/><circle cx="40" cy="54" r="2.8" fill="#2a1a10"/><circle cx="56" cy="54" r="2.8" fill="#2a1a10"/><circle cx="48" cy="62" r="4" fill="#f0a0a0"/></svg>',
    pumpkin: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><radialGradient id="a" cx=".4" cy=".35"><stop offset="0" stop-color="#ffb347"/><stop offset="1" stop-color="#e0640c"/></radialGradient></defs><path d="M46 20c0-6 4-10 10-12" stroke="#3a8a3a" stroke-width="6" fill="none" stroke-linecap="round"/><ellipse cx="30" cy="54" rx="22" ry="28" fill="url(#a)"/><ellipse cx="66" cy="54" rx="22" ry="28" fill="url(#a)"/><ellipse cx="48" cy="54" rx="22" ry="30" fill="url(#a)"/><path d="M34 44l8 8-12 0zM62 44l-8 8h12zM34 66c6 8 22 8 28 0-4 2-8 4-14 4s-10-2-14-4z" fill="#3a1a00"/></svg>',
    diamond: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bff3ff"/><stop offset="1" stop-color="#2f8cff"/></linearGradient></defs><path d="M26 24h44l14 18-36 42L12 42z" fill="url(#a)"/><path d="M12 42h72M26 24l22 60M70 24L48 84M36 24l-6 18M60 24l6 18M48 24v18" stroke="#fff" stroke-opacity=".7" stroke-width="1.8" fill="none"/></svg>'
  };
  function ico(k) { return enc(SVG[k]); }

  /* ================= PRICES (all in TON) =================
     ONE RATE FOR EVERYTHING: config.js -> starsPerTon (100 Stars = 1 TON). The Telegram bot must use the same number.
     1) Regular gifts are priced in STARS (their real Telegram price) and converted automatically:  value = stars / starsPerTon.
        Bear 15 Stars -> 0.15 TON, Rose 25 -> 0.25, Cake 50 -> 0.5, Diamond 100 -> 1 TON. Change a number below (or the rate in config.js) and every gift re-prices.
     2) Cash prizes are plain TON amounts.
     3) NFT gifts are in TON = approximate marketplace floor (Getgems / Portals / Tonnel). Floors move: edit the numbers below.
        NFTs marked "est." were added later and their floor is an estimate: check it against the market before launch.
     The case contents and chances live in cases.js (generated so every paid case returns ~90% and pays back its price in ~30-37% of openings). */
  var RATE = Number((w.NEXVEN_CFG || {}).starsPerTon) || 109.89;
  function st(stars) { return Math.round(stars / RATE * 100) / 100; }
  var G = {
    /* cash prizes */
    '0.05 TON': { value: 0.05, nft: false, img: ico('ton'), local: true },
    '0.1 TON': { value: 0.1, nft: false, img: ico('ton'), local: true },
    '0.25 TON': { value: 0.25, nft: false, img: ico('ton'), local: true },
    '0.5 TON': { value: 0.5, nft: false, img: ico('ton'), local: true },
    '1 TON': { value: 1, nft: false, img: ico('ton'), local: true },
    '2 TON': { value: 2, nft: false, img: ico('ton'), local: true },
    '5 TON': { value: 5, nft: false, img: ico('ton'), local: true },
    '10 TON': { value: 10, nft: false, img: ico('ton'), local: true },
    '25 TON': { value: 25, nft: false, img: ico('ton'), local: true },

    /* regular (non-NFT) gifts: price in Telegram Stars */
    'Сердце': { stars: 15, value: st(15), nft: false, img: ico('heart'), local: true },
    'Мишка': { stars: 15, value: st(15), nft: false, img: ico('bear'), local: true },
    'Подарок': { stars: 25, value: st(25), nft: false, img: ico('gift'), local: true },
    'Роза': { stars: 25, value: st(25), nft: false, img: ico('rose'), local: true },
    'Торт': { stars: 50, value: st(50), nft: false, img: ico('cake'), local: true },
    'Букет': { stars: 50, value: st(50), nft: false, img: ico('bouquet'), local: true },
    'Ракета': { stars: 50, value: st(50), nft: false, img: ico('rocket'), local: true },
    'Бутылка': { stars: 50, value: st(50), nft: false, img: ico('bottle'), local: true },
    'Ёлка': { stars: 50, value: st(50), nft: false, img: ico('tree'), local: true },
    'Санта': { stars: 50, value: st(50), nft: false, img: ico('santa'), local: true },
    'Тыква': { stars: 50, value: st(50), nft: false, img: ico('pumpkin'), local: true },
    'Кубок': { stars: 100, value: st(100), nft: false, img: ico('trophy'), local: true },
    'Кольцо': { stars: 100, value: st(100), nft: false, img: ico('ring'), local: true },
    'Алмаз': { stars: 100, value: st(100), nft: false, img: ico('diamond'), local: true },
    'Крошка': { stars: 5, value: st(5), nft: false, img: ico('crumb'), local: true },
    'Наклейка': { stars: 5, value: st(5), nft: false, img: ico('sticker'), local: true },

    /* NFT gifts (TON) */
    'Easter Egg': { value: 4, nft: true, slug: 'easteregg' },
    'Ginger Cookie': { value: 4, nft: true, slug: 'gingercookie' },
    'Lol Pop': { value: 4.5, nft: true, slug: 'lolpop' },
    'B-Day Candle': { value: 4, nft: true, slug: 'bdaycandle' },
    'Desk Calendar': { value: 4, nft: true, slug: 'deskcalendar' },
    'Ice Cream': { value: 3, nft: true, slug: 'icecream' },
    'Santa Hat': { value: 3, nft: true, slug: 'santahat' },
    'Candy Cane': { value: 3.5, nft: true, slug: 'candycane' },
    'Snow Mittens': { value: 3.5, nft: true, slug: 'snowmittens' },
    'Jingle Bells': { value: 4, nft: true, slug: 'jinglebells' },
    'Spiced Wine': { value: 4, nft: true, slug: 'spicedwine' },
    'Hanging Star': { value: 5, nft: true, slug: 'hangingstar' },
    'Bunny Muffin': { value: 5, nft: true, slug: 'bunnymuffin' },
    'Homemade Cake': { value: 5, nft: true, slug: 'homemadecake' },
    'Love Candle': { value: 5, nft: true, slug: 'lovecandle' },
    'Winter Wreath': { value: 5, nft: true, slug: 'winterwreath' },
    'Xmas Stocking': { value: 5, nft: true, slug: 'xmasstocking' },
    'Star Notepad': { value: 5, nft: true, slug: 'starnotepad' },
    'Toy Bear': { value: 6, nft: true, slug: 'toybear' },
    'Cookie Heart': { value: 6, nft: true, slug: 'cookieheart' },
    'Berry Box': { value: 6, nft: true, slug: 'berrybox' },
    'Hypno Lollipop': { value: 6, nft: true, slug: 'hypnolollipop' },
    'Party Sparkler': { value: 6, nft: true, slug: 'partysparkler' },
    'Lunar Snake': { value: 6, nft: true, slug: 'lunarsnake' },
    'Whip Cupcake': { value: 6, nft: true, slug: 'whipcupcake' },
    'Holiday Drink': { value: 6, nft: true, slug: 'holidaydrink' },
    'Jack-in-the-Box': { value: 6.5, nft: true, slug: 'jackinthebox' },
    'Pet Snake': { value: 7, nft: true, slug: 'petsnake' },
    'Sakura Flower': { value: 7, nft: true, slug: 'sakuraflower' },
    'Big Year': { value: 7, nft: true, slug: 'bigyear' },
    'Sleigh Bell': { value: 8, nft: true, slug: 'sleighbell' },
    'Snake Box': { value: 8, nft: true, slug: 'snakebox' },
    'Light Sword': { value: 8, nft: true, slug: 'lightsword' },
    'Witch Hat': { value: 8, nft: true, slug: 'witchhat' },
    'Jester Hat': { value: 9, nft: true, slug: 'jesterhat' },
    'Instant Ramen': { value: 9, nft: true, slug: 'instantramen' },
    'Restless Jar': { value: 10, nft: true, slug: 'restlessjar' },
    'Jelly Bunny': { value: 10, nft: true, slug: 'jellybunny' },
    'Input Key': { value: 10, nft: true, slug: 'inputkey' },
    'Top Hat': { value: 11, nft: true, slug: 'tophat' },
    'Spy Agaric': { value: 12, nft: true, slug: 'spyagaric' },
    'Evil Eye': { value: 12, nft: true, slug: 'evileye' },
    'Hex Pot': { value: 12, nft: true, slug: 'hexpot' },
    'Kissed Frog': { value: 14, nft: true, slug: 'kissedfrog' },
    'Scared Cat': { value: 14, nft: true, slug: 'scaredcat' },
    'Trapped Heart': { value: 18, nft: true, slug: 'trappedheart' },
    'Vice Cream': { value: 18, nft: true, slug: 'vicecream' },
    'Astral Shard': { value: 20, nft: true, slug: 'astralshard' },
    'Skull Flower': { value: 22, nft: true, slug: 'skullflower' },
    'Record Player': { value: 25, nft: true, slug: 'recordplayer' },
    'Flying Broom': { value: 26, nft: true, slug: 'flyingbroom' },
    'Eternal Rose': { value: 27, nft: true, slug: 'eternalrose' },
    'Vintage Cigar': { value: 28, nft: true, slug: 'vintagecigar' },
    'Love Potion': { value: 28, nft: true, slug: 'lovepotion' },
    'Magic Potion': { value: 30, nft: true, slug: 'magicpotion' },
    'Bow Tie': { value: 30, nft: true, slug: 'bowtie' },
    'Voodoo Doll': { value: 32, nft: true, slug: 'voodoodoll' },
    'Crystal Ball': { value: 36, nft: true, slug: 'crystalball' },
    'Bonded Ring': { value: 38, nft: true, slug: 'bondedring' },
    'Sharp Tongue': { value: 40, nft: true, slug: 'sharptongue' },
    'Electric Skull': { value: 40, nft: true, slug: 'electricskull' },
    'Genie Lamp': { value: 45, nft: true, slug: 'genielamp' },
    'Mad Pumpkin': { value: 45, nft: true, slug: 'madpumpkin' },
    'Signet Ring': { value: 55, nft: true, slug: 'signetring' },
    'Ion Gem': { value: 68, nft: true, slug: 'iongem' },
    'Perfume Bottle': { value: 70, nft: true, slug: 'perfumebottle' },
    'Diamond Ring': { value: 90, nft: true, slug: 'diamondring' },
    'Swiss Watch': { value: 110, nft: true, slug: 'swisswatch' },
    'Neko Helmet': { value: 120, nft: true, slug: 'nekohelmet' },
    'Mini Oscar': { value: 150, nft: true, slug: 'minioscar' },
    'Loot Bag': { value: 190, nft: true, slug: 'lootbag' },
    'Precious Peach': { value: 330, nft: true, slug: 'preciouspeach' },
    "Durov's Cap": { value: 600, nft: true, slug: 'durovscap' },
    'Heart Locket': { value: 2000, nft: true, slug: 'heartlocket' },
    'Plush Pepe': { value: 5100, nft: true, slug: 'plushpepe' },

    /* NFT gifts added in v25 (est. floors) */
    'Pool Float': { value: 4, nft: true, slug: 'poolfloat' },  /* est. */
    'Spring Basket': { value: 5, nft: true, slug: 'springbasket' },  /* est. */
    'Happy Brownie': { value: 5, nft: true, slug: 'happybrownie' },  /* est. */
    'Eternal Candle': { value: 5, nft: true, slug: 'eternalcandle' },  /* est. */
    'Fresh Socks': { value: 6, nft: true, slug: 'freshsocks' },  /* est. */
    'Lush Bouquet': { value: 6, nft: true, slug: 'lushbouquet' },  /* est. */
    'Joyful Bundle': { value: 6, nft: true, slug: 'joyfulbundle' },  /* est. */
    'Money Pot': { value: 6, nft: true, slug: 'moneypot' },  /* est. */
    'Snow Globe': { value: 6, nft: true, slug: 'snowglobe' },  /* est. */
    'Tama Gadget': { value: 6, nft: true, slug: 'tamagadget' },  /* est. */
    'Swag Bag': { value: 7, nft: true, slug: 'swagbag' },  /* est. */
    'Victory Medal': { value: 7, nft: true, slug: 'victorymedal' },  /* est. */
    'Snoop Dogg': { value: 8, nft: true, slug: 'snoopdogg' },  /* est. */
    'Moon Pendant': { value: 8, nft: true, slug: 'moonpendant' },  /* est. */
    'Ionic Dryer': { value: 10, nft: true, slug: 'ionicdryer' },  /* est. */
    'Snoop Cigar': { value: 12, nft: true, slug: 'snoopcigar' },  /* est. */
    'Low Rider': { value: 16, nft: true, slug: 'lowrider' },  /* est. */
    'Cupid Charm': { value: 20, nft: true, slug: 'cupidcharm' },  /* est. */
    'Westside Sign': { value: 24, nft: true, slug: 'westsidesign' },  /* est. */
    'Bling Binky': { value: 28, nft: true, slug: 'blingbinky' },  /* est. */
    'Gem Signet': { value: 42, nft: true, slug: 'gemsignet' },  /* est. */
    'Mighty Arm': { value: 55, nft: true, slug: 'mightyarm' },  /* est. */
    'Nail Bracelet': { value: 85, nft: true, slug: 'nailbracelet' },  /* est. */
    'Heroic Helmet': { value: 280, nft: true, slug: 'heroichelmet' }  /* est. */
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
  var CASE_GIFT = { free: 'B-Day Candle', dust: 'Ice Cream', selected: 'Eternal Rose', half: 'Plush Pepe', candy: 'Hypno Lollipop', cake: 'Homemade Cake', royal: "Durov's Cap", diamond: 'Precious Peach' };

  w.GIFTS = G; w.giftImg = giftImg; w.giftSrc = giftSrc; w.giftInfo = giftInfo; w.CASE_GIFT = CASE_GIFT;
})(window);
