/* Nexven Drop — vector art (banners, chests, rocket, icons). No external assets. */
(function (w) {
  var uid = 0;
  function id(p) { return p + (++uid); }

  /* ---------- small icons ---------- */
  function ton(size) {
    var g = id('tg');
    return '<svg class="ton" width="' + (size || 18) + '" height="' + (size || 18) + '" viewBox="0 0 24 24" aria-hidden="true">' +
      '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4fc3ff"/><stop offset="1" stop-color="#1a6dff"/></linearGradient></defs>' +
      '<path d="M5.2 3.5h13.6c.9 0 1.5 1 1 1.8l-6.9 13.1c-.4.8-1.6.8-2 0L4.2 5.3c-.5-.8.1-1.8 1-1.8z" fill="url(#' + g + ')"/>' +
      '<path d="M12 6.2v13" stroke="#fff" stroke-opacity=".9" stroke-width="1.4" stroke-linecap="round"/>' +
      '<path d="M7.2 6.2h9.6" stroke="#fff" stroke-opacity=".55" stroke-width="1.2" stroke-linecap="round"/></svg>';
  }

  function logo(size) {
    var g = id('lg');
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 64 64">' +
      '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7cc4ff"/><stop offset=".55" stop-color="#2f7bff"/><stop offset="1" stop-color="#6a4dff"/></linearGradient></defs>' +
      '<path d="M32 4l24 14v28L32 60 8 46V18z" fill="url(#' + g + ')"/>' +
      '<path d="M32 4l24 14-24 14L8 18z" fill="#fff" fill-opacity=".28"/>' +
      '<path d="M20 44V22l24 20V20" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  /* ---------- game banners (viewBox 360x150, slice) ---------- */
  function svgOpen(cls) { return '<svg class="bn ' + cls + '" viewBox="0 0 360 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'; }

  function wheelWedges(cx, cy, r, n) {
    var out = '', i, a0, a1, x0, y0, x1, y1, col;
    for (i = 0; i < n; i++) {
      a0 = (i / n) * Math.PI * 2; a1 = ((i + 1) / n) * Math.PI * 2;
      x0 = cx + Math.cos(a0) * r; y0 = cy + Math.sin(a0) * r;
      x1 = cx + Math.cos(a1) * r; y1 = cy + Math.sin(a1) * r;
      col = i === 0 ? '#16a34a' : (i % 2 ? '#1b1b24' : '#d62839');
      out += '<path d="M' + cx + ' ' + cy + 'L' + x0.toFixed(1) + ' ' + y0.toFixed(1) + 'A' + r + ' ' + r + ' 0 0 1 ' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'Z" fill="' + col + '"/>';
    }
    return out;
  }

  function bannerRoulette() {
    var g = id('rb'), gl = id('rg');
    return svgOpen('b-roul') +
      '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a0b22"/><stop offset="1" stop-color="#0d0a1c"/></linearGradient>' +
      '<radialGradient id="' + gl + '"><stop offset="0" stop-color="#ff3b6b" stop-opacity=".55"/><stop offset="1" stop-color="#ff3b6b" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="360" height="150" fill="url(#' + g + ')"/>' +
      '<circle cx="270" cy="78" r="120" fill="url(#' + gl + ')"/>' +
      '<g class="spin-slow" style="transform-origin:270px 78px">' +
      '<circle cx="270" cy="78" r="76" fill="#c99a2e"/>' +
      '<circle cx="270" cy="78" r="70" fill="#101018"/>' + wheelWedges(270, 78, 66, 13) +
      '<circle cx="270" cy="78" r="30" fill="#14141c" stroke="#e8b84a" stroke-width="3"/>' +
      '<circle cx="270" cy="78" r="10" fill="#e8b84a"/></g>' +
      '<path d="M270 -2 l8 14 h-16z" fill="#ffd36b" transform="translate(0 4)"/>' +
      '<g class="float" style="animation-delay:-.8s"><circle cx="196" cy="34" r="11" fill="#e8b84a"/><circle cx="196" cy="34" r="7" fill="none" stroke="#7a5a10" stroke-width="1.5" stroke-dasharray="3 2"/></g>' +
      '<g class="float" style="animation-delay:-1.6s"><circle cx="212" cy="124" r="9" fill="#d62839"/><circle cx="212" cy="124" r="5.5" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.5" stroke-dasharray="3 2"/></g>' +
      '</svg>';
  }

  function bannerPlinko() {
    var g = id('pb'), s = '', r, c, n, x, y, i;
    for (r = 0; r < 5; r++) { n = r + 3; for (c = 0; c < n; c++) { x = 250 + (c - (n - 1) / 2) * 26; y = 22 + r * 22; s += '<circle cx="' + x + '" cy="' + y + '" r="3.2" fill="#fff" fill-opacity=".92"/>'; } }
    var chips = [['13x', '#d9264a'], ['3x', '#e0562a'], ['1.2x', '#e08a2a'], ['.6x', '#e0b02a'], ['.4x', '#e0b02a']], cs = '';
    for (i = 0; i < 5; i++) { cs += '<g transform="translate(' + (172 + i * 40) + ' 124)"><rect width="34" height="18" rx="5" fill="' + chips[i][1] + '" fill-opacity=".9"/><text x="17" y="13" text-anchor="middle" font-size="10" font-weight="800" fill="#fff" font-family="inherit">' + chips[i][0] + '</text></g>'; }
    return svgOpen('b-plinko') +
      '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b1633"/><stop offset="1" stop-color="#0a0f1f"/></linearGradient></defs>' +
      '<rect width="360" height="150" fill="url(#' + g + ')"/>' + s + cs +
      '<g class="plink-ball"><circle r="14" fill="#2f7bff" fill-opacity=".25"/><circle r="8" fill="#5aa2ff"/><circle r="3" cx="-2" cy="-2" fill="#fff" fill-opacity=".8"/></g>' +
      '</svg>';
  }

  function rocketBody(gid) {
    return '<defs>' +
      '<linearGradient id="' + gid + 'b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9fb3d6"/><stop offset=".45" stop-color="#f4f8ff"/><stop offset="1" stop-color="#8aa0c8"/></linearGradient>' +
      '<linearGradient id="' + gid + 'f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6a3d"/><stop offset="1" stop-color="#c81e3a"/></linearGradient>' +
      '<linearGradient id="' + gid + 'n" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e03a52"/><stop offset="1" stop-color="#9b1030"/></linearGradient>' +
      '<radialGradient id="' + gid + 'w"><stop offset="0" stop-color="#8ee0ff"/><stop offset="1" stop-color="#1f6fd8"/></radialGradient></defs>' +
      '<path d="M26 118 L6 150 L6 120 Q6 104 20 96z" fill="url(#' + gid + 'f)"/>' +
      '<path d="M94 118 L114 150 L114 120 Q114 104 100 96z" fill="url(#' + gid + 'f)"/>' +
      '<path d="M60 4 Q96 40 96 96 L96 140 L24 140 L24 96 Q24 40 60 4z" fill="url(#' + gid + 'b)"/>' +
      '<path d="M60 4 Q80 24 88 50 L32 50 Q40 24 60 4z" fill="url(#' + gid + 'n)"/>' +
      '<circle cx="60" cy="80" r="17" fill="#1b2a4a"/><circle cx="60" cy="80" r="13" fill="url(#' + gid + 'w)"/><path d="M50 74 q6-8 14-6" stroke="#fff" stroke-opacity=".7" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<rect x="24" y="112" width="72" height="8" fill="#6f86b3" fill-opacity=".55"/>' +
      '<path d="M34 140 h52 l-8 12 h-36z" fill="#59688a"/>';
  }
  function rocket(cls) {
    var gid = id('rk');
    return '<svg class="rocket ' + (cls || '') + '" viewBox="0 0 120 230" aria-hidden="true">' + rocketBody(gid) +
      '<g class="flame"><path d="M42 152 Q60 232 78 152 Q60 164 42 152z" fill="#ff9d2e"/><path d="M50 152 Q60 205 70 152 Q60 160 50 152z" fill="#fff3a0"/></g></svg>';
  }

  function bannerCrash() {
    var g = id('cb'), stars = '', i;
    for (i = 0; i < 18; i++) stars += '<circle class="tw" style="animation-delay:' + ((i * 0.37) % 3).toFixed(2) + 's" cx="' + ((i * 53) % 360) + '" cy="' + ((i * 37 + 11) % 150) + '" r="' + (i % 3 ? 1 : 1.6) + '" fill="#fff"/>';
    var gid = id('rk');
    return svgOpen('b-crash') +
      '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1230"/><stop offset="1" stop-color="#101a44"/></linearGradient></defs>' +
      '<rect width="360" height="150" fill="url(#' + g + ')"/>' + stars +
      '<path d="M20 140 C120 130 200 100 270 40" stroke="#4aa3ff" stroke-opacity=".5" stroke-width="3" stroke-dasharray="3 7" fill="none" stroke-linecap="round"/>' +
      '<g class="rocket-fly" style="transform-origin:270px 70px"><g transform="translate(240 8) scale(.52) rotate(0)">' + rocketBody(gid) +
      '<g class="flame"><path d="M42 152 Q60 232 78 152 Q60 164 42 152z" fill="#ff9d2e"/><path d="M50 152 Q60 205 70 152 Q60 160 50 152z" fill="#fff3a0"/></g></g></g></svg>';
  }

  function bannerMines() {
    var g = id('mb'), s = '', r, c, k = 0, x, y, tile;
    for (r = 0; r < 3; r++) for (c = 0; c < 3; c++) {
      x = 190 + c * 50; y = 18 + r * 40; k++;
      tile = '<rect x="' + x + '" y="' + y + '" width="44" height="34" rx="9" fill="#243553" stroke="#3a5382" stroke-opacity=".6"/>';
      if (k === 2 || k === 5 || k === 7) tile = '<g class="pop" style="animation-delay:' + (k * 0.35) + 's;transform-origin:' + (x + 22) + 'px ' + (y + 17) + 'px"><rect x="' + x + '" y="' + y + '" width="44" height="34" rx="9" fill="#12463f" stroke="#2bd9a0" stroke-opacity=".7"/><path d="M' + (x + 22) + ' ' + (y + 7) + 'l10 8-10 13-10-13z" fill="#37f0b0"/><path d="M' + (x + 12) + ' ' + (y + 15) + 'h20' + 'l-10 13z" fill="#fff" fill-opacity=".25"/></g>';
      if (k === 9) tile = '<g class="pop" style="animation-delay:2.1s;transform-origin:' + (x + 22) + 'px ' + (y + 17) + 'px"><rect x="' + x + '" y="' + y + '" width="44" height="34" rx="9" fill="#4a1520" stroke="#ff4d5e" stroke-opacity=".7"/><circle cx="' + (x + 22) + '" cy="' + (y + 19) + '" r="9" fill="#14141c"/><path d="M' + (x + 28) + ' ' + (y + 11) + 'l5-5" stroke="#ffb347" stroke-width="2.5" stroke-linecap="round"/><circle cx="' + (x + 34) + '" cy="' + (y + 5) + '" r="2.4" fill="#ffd36b"/></g>';
      s += tile;
    }
    return svgOpen('b-mines') +
      '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0c2230"/><stop offset="1" stop-color="#0b1220"/></linearGradient></defs>' +
      '<rect width="360" height="150" fill="url(#' + g + ')"/>' + s + '</svg>';
  }

  function bannerCraft() {
    var g = id('ub'), gl = id('ug');
    return svgOpen('b-craft') +
      '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b0f3a"/><stop offset="1" stop-color="#0b0f24"/></linearGradient>' +
      '<radialGradient id="' + gl + '"><stop offset="0" stop-color="#8b5cff" stop-opacity=".5"/><stop offset="1" stop-color="#8b5cff" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="360" height="150" fill="url(#' + g + ')"/><circle cx="270" cy="75" r="110" fill="url(#' + gl + ')"/>' +
      '<circle cx="270" cy="75" r="52" fill="none" stroke="#2a2f55" stroke-width="10"/>' +
      '<g class="spin-slow" style="transform-origin:270px 75px"><circle cx="270" cy="75" r="52" fill="none" stroke="#39e6a0" stroke-width="10" stroke-dasharray="110 217" stroke-linecap="round"/></g>' +
      '<g class="float"><path d="M270 50 l16 22 h-10 v22 h-12 v-22 h-10z" fill="#fff"/></g>' +
      '<g class="tw" style="animation-delay:.4s"><path d="M200 30 l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#c9b3ff"/></g>' +
      '<g class="tw" style="animation-delay:1.2s"><path d="M340 112 l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#9fe8ff"/></g></svg>';
  }

  /* ---------- case chest (viewBox 200x170) ---------- */
  var CHEST = {
    free:     { a: '#7ad0ff', b: '#2a7de0', c: '#163a78', glow: '#4aa3ff' },
    dust:     { a: '#c9a46a', b: '#8a6230', c: '#3d2a12', glow: '#d4a35c' },
    selected: { a: '#c9a0ff', b: '#7b4ad6', c: '#3a1f78', glow: '#a971ff' },
    half:     { a: '#ffb36b', b: '#e07020', c: '#6e3010', glow: '#ff9a3c' },
    cake:     { a: '#ff7eb6', b: '#d23a82', c: '#6e1442', glow: '#ff6aa8' },
    neon:     { a: '#5ef0c8', b: '#12a88a', c: '#0a3d34', glow: '#2be3a0' },
    legend:   { a: '#ffe08a', b: '#e0a21c', c: '#6e4a08', glow: '#ffc857' },
    titan:    { a: '#9ab6ff', b: '#3d5fd8', c: '#1a2758', glow: '#5aa2ff' },
    void:     { a: '#d0a0ff', b: '#6b2fd6', c: '#2a0f55', glow: '#a971ff' }
  };
  function chest(key) {
    var k = CHEST[key] || CHEST.dust, g = id('ch');
    return '<svg class="chest" viewBox="0 0 200 170" aria-hidden="true"><defs>' +
      '<linearGradient id="' + g + 'l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + k.a + '"/><stop offset="1" stop-color="' + k.b + '"/></linearGradient>' +
      '<linearGradient id="' + g + 'd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + k.b + '"/><stop offset="1" stop-color="' + k.c + '"/></linearGradient>' +
      '<linearGradient id="' + g + 'g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b0"/><stop offset=".5" stop-color="#f1bf4b"/><stop offset="1" stop-color="#b9801c"/></linearGradient></defs>' +
      '<ellipse cx="100" cy="158" rx="76" ry="9" fill="#000" fill-opacity=".45"/>' +
      '<rect x="28" y="82" width="144" height="72" rx="12" fill="url(#' + g + 'd)"/>' +
      '<rect x="28" y="82" width="144" height="10" fill="#000" fill-opacity=".25"/>' +
      '<rect x="28" y="82" width="26" height="72" rx="8" fill="url(#' + g + 'g)"/><rect x="146" y="82" width="26" height="72" rx="8" fill="url(#' + g + 'g)"/>' +
      '<path d="M28 90 V64 Q28 26 100 26 Q172 26 172 64 V90 Z" fill="url(#' + g + 'l)"/>' +
      '<path d="M28 90 V64 Q28 26 100 26 Q172 26 172 64 V90 Z" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2"/>' +
      '<path d="M28 64 Q28 26 54 29 L54 90 L28 90z" fill="url(#' + g + 'g)"/><path d="M172 64 Q172 26 146 29 L146 90 L172 90z" fill="url(#' + g + 'g)"/>' +
      '<path d="M60 40 Q100 22 140 40" stroke="#fff" stroke-opacity=".35" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '<rect x="26" y="84" width="148" height="8" rx="4" fill="url(#' + g + 'g)"/>' +
      '<rect x="86" y="74" width="28" height="32" rx="7" fill="url(#' + g + 'g)" stroke="#8a5d10" stroke-opacity=".6"/>' +
      '<circle cx="100" cy="88" r="5" fill="#5a3a06"/><rect x="98" y="88" width="4" height="10" rx="2" fill="#5a3a06"/>' +
      '</svg>';
  }

  function sparkles() {
    var s = '', i, pos = [[16, 24], [84, 12], [90, 60], [8, 70], [50, 6]];
    for (i = 0; i < pos.length; i++) s += '<span class="sp" style="left:' + pos[i][0] + '%;top:' + pos[i][1] + '%;animation-delay:' + (i * 0.55) + 's"></span>';
    return s;
  }

  /* case art block: glow + gift on top peeking from chest */
  function caseArt(key, giftHtml) {
    var k = CHEST[key] || CHEST.dust;
    return '<div class="cart" style="--glow:' + k.glow + '"><div class="cglow"></div>' + sparkles() +
      '<div class="cgift">' + (giftHtml || '') + '</div>' + chest(key) + '</div>';
  }

  /* gift placeholder (used when remote image fails) */
  function giftFallback(label, hue) {
    var h = hue == null ? 220 : hue;
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(' + h + ',80%,62%)"/><stop offset="1" stop-color="hsl(' + ((h + 40) % 360) + ',75%,42%)"/></linearGradient></defs><rect x="14" y="40" width="68" height="42" rx="8" fill="url(#a)"/><rect x="10" y="30" width="76" height="16" rx="6" fill="url(#a)"/><rect x="44" y="30" width="8" height="52" fill="#fff" fill-opacity=".85"/><path d="M48 30c-12-18-26-8-18 0 4 4 14 2 18 0zM48 30c12-18 26-8 18 0-4 4-14 2-18 0z" fill="#fff" fill-opacity=".9"/></svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(s);
  }

  w.ART = {
    ton: ton, logo: logo, rocket: rocket, chest: chest, caseArt: caseArt, giftFallback: giftFallback,
    banners: { roulette: bannerRoulette, plinko: bannerPlinko, crash: bannerCrash, mines: bannerMines, craft: bannerCraft }
  };
})(window);
