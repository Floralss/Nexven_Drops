/* Nexven Drop — games menu, leaderboard, profile, deposit / admin / info modals */
(function (NX) {
  'use strict';
  var $ = NX.$, ART = window.ART;

  /* ===== main menu ===== */
  var GAMES = [
    { id: 'roulette', title: 'РУЛЕТКА', desc: 'Красное, чёрное, зелёное', tag: 'до x14', art: 'roulette' },
    { id: 'plinko', title: 'ПЛИНКО', desc: 'Шарик и множители', tag: 'до x26', art: 'plinko' },
    { id: 'crash', title: 'КРАШ', desc: 'Ракета и коэффициент', tag: 'до x10', art: 'crash' },
    { id: 'mines', title: 'МИНЫ', desc: 'Сетка и шаги', tag: 'до x24', art: 'mines' },
    { id: 'craft', title: 'КРАФТ', desc: 'Улучшение предмета', tag: 'x1.5 – x5', art: 'craft' }
  ];
  NX.pages.games = {
    enter: function () { clearInterval(onT); var upd = function () { if (NX.net.enabled()) NX.net.fetchOnline().then(function (n) { var e = $('gmOnN'); if (e) e.textContent = Math.max(n, 1); }, function () {}); }; upd(); onT = setInterval(upd, 20000); },
    leave: function () { clearInterval(onT); },
    build: function () {
      $('v-games').innerHTML = '<div class="lb-online sm" id="gmOnline"><i class="dot"></i>Онлайн: <b id="gmOnN">1</b></div><div class="banners">' + GAMES.map(function (g, i) {
        return '<button type="button" class="banner" data-game="' + g.id + '" style="animation-delay:' + (i * 90) + 'ms">' + ART.banners[g.art]() +
          '<span class="bn-tag">' + g.tag + '</span><span class="bn-label"><div class="bn-t">' + g.title + '</div><div class="bn-d">' + g.desc + '</div></span></button>';
      }).join('') + '</div>';
      $('v-games').onclick = function (e) { var b = e.target.closest('[data-game]'); if (b) { NX.sfx('click'); NX.haptic('light'); NX.go(b.getAttribute('data-game')); } };
    }
  };

  /* ===== leaderboard ===== */
  function avatarHtml(r) {
    var l = ((r.name || '?')[0] || '?').toUpperCase();
    return r.photo ? '<img src="' + NX.esc(r.photo) + '" alt="" onerror="this.parentNode.textContent=\'' + NX.esc(l) + '\'">' : NX.esc(l);
  }
  var MEDAL = { 1: ['#ffe08a', '#e0a21c'], 2: ['#e8edf7', '#9aa6c0'], 3: ['#f0b27a', '#b9692e'] };
  function medal(n) {
    var c = MEDAL[n];
    return '<svg width="30" height="34" viewBox="0 0 30 34"><defs><linearGradient id="md' + n + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/></linearGradient></defs><path d="M8 0h5l2 9H7zM22 0h-5l-2 9h8z" fill="' + (n === 1 ? '#e0432e' : n === 2 ? '#3d6fd8' : '#2f9a6a') + '"/><circle cx="15" cy="21" r="11.5" fill="url(#md' + n + ')" stroke="rgba(0,0,0,.25)"/><text x="15" y="26" text-anchor="middle" font-size="13" font-weight="900" fill="#3a2600" font-family="Inter,system-ui,sans-serif">' + n + '</text></svg>';
  }
  var topT = null, onT = null;
  function rowsHtml(rows, u) {
    return rows.slice(0, 100).map(function (r, i) {
      var n = i + 1, me = String(r.id) === String(u.id);
      return '<div class="lrow' + (n <= 3 ? ' p' + n : '') + (me ? ' me' : '') + '" style="animation-delay:' + Math.min(i, 12) * 45 + 'ms"><div class="rank">' + (n <= 3 ? medal(n) : n) + '</div><div class="lav' + (r.online ? ' on' : '') + '">' + avatarHtml(r) + '</div>' +
        '<div class="lname"><b>' + NX.esc(r.name) + '</b><small>' + (me ? 'Это вы' : r.online ? '<span class="onl">в сети</span>' : '') + '</small></div><div class="lval">' + NX.fmtShort(r.spent) + ' ' + NX.tonI(18) + '</div>' +
        '<div class="lgift">' + (r.best && r.best.name ? window.giftImg(r.best.name) : '') + '</div></div>';
    }).join('');
  }
  function localRows() {
    NX.save(); var rows = []; try { rows = JSON.parse(localStorage.getItem('nv_top') || '[]'); } catch (e) {}
    rows.sort(function (a, b) { return b.spent - a.spent; }); return rows;
  }
  function loadBoard(first) {
    var u = NX.user(), box = $('lbRows'), head = $('lbOnline');
    if (!NX.net.enabled()) {
      var rows = localRows(); rows.forEach(function (r) { r.online = String(r.id) === String(u.id); });
      head.innerHTML = '<i class="dot"></i>Онлайн: <b>1</b>';
      box.innerHTML = rowsHtml(rows, u) + (NX.isStaff() ? '<div class="empty">Общий топ выключен: впиши projectId и apiKey Firebase в config.js, и здесь появятся все игроки.</div>' : '');
      return;
    }
    if (first) box.innerHTML = '<div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div>';
    NX.net.push(true);
    NX.net.fetchBoard().then(function (res) {
      if (NX.cur() !== 'top') return;
      var rows = res.rows, mine = rows.some(function (r) { return String(r.id) === String(u.id); });
      if (!mine) rows.push({ id: u.id, name: u.first_name || 'Игрок', photo: u.photo_url || null, spent: NX.r2(u.total_spent || 0), best: (u.stats && u.stats.best) || null, online: true });
      rows.sort(function (a, b) { return b.spent - a.spent; });
      head.innerHTML = '<i class="dot"></i>Онлайн: <b>' + Math.max(res.online, 1) + '</b><span class="tot">Игроков: ' + rows.length + '</span>';
      box.innerHTML = rowsHtml(rows, u);
    }).catch(function (e) {
      if (NX.cur() !== 'top') return;
      var rows = localRows(); rows.forEach(function (r) { r.online = String(r.id) === String(u.id); });
      if (first) box.innerHTML = rowsHtml(rows, u) + '<div class="empty" style="font-size:12px">' + NX.esc((e && e.message) || 'Нет связи') + '<br><button type="button" class="btn sm ghost" id="lbRetry" style="margin-top:12px;max-width:200px">Повторить</button></div>';
      head.innerHTML = '<i class="dot off"></i>Онлайн: <b>—</b>';
      var rb = $('lbRetry'); if (rb) rb.onclick = function () { loadBoard(true); };
    });
  }
  NX.pages.top = {
    build: function () {
      $('v-top').innerHTML = '<div class="lb-online" id="lbOnline"><i class="dot"></i>Онлайн</div><button type="button" class="howto" id="howTo"><span class="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9.5"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.2 1-1.2 1.8M12 17v.2"/></svg></span><span><b>Как это работает</b><small>Призы, оборот, сроки сезона</small></span><span class="ch"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M9 5l7 7-7 7"/></svg></span></button><div id="lbRows"></div>';
      $('howTo').onclick = function () {
        $('modInfoBody').innerHTML = '<button type="button" class="mx" data-close="modInfo">✕</button><h3>Как работает топ</h3>' +
          '<p class="hint" style="font-size:14px;line-height:1.55;margin:8px 0 14px">Место в рейтинге зависит от <b style="color:#fff">оборота</b> — суммы всех ваших ставок и открытых кейсов в TON.<br><br>Справа показан лучший подарок, который вам выпал. Зелёная точка у аватара — игрок сейчас в сети. Призы и сроки сезона объявляет администрация Nexven Drop в официальном канале.</p><button type="button" class="btn" data-close="modInfo">Понятно</button>';
        NX.open('modInfo');
      };
    },
    enter: function () { loadBoard(true); clearInterval(topT); topT = setInterval(function () { loadBoard(false); }, 15000); },
    leave: function () { clearInterval(topT); }
  };

  /* ===== profile ===== */
  function refs() { try { return JSON.parse(localStorage.getItem('nv_refs_' + NX.user().id) || '[]'); } catch (e) { return []; } }
  NX.pages.profile = {
    build: function () { $('v-profile').innerHTML = '<div id="profBody"></div>'; },
    enter: function () {
      var u = NX.user(), staff = NX.isStaff(), role = NX.isOwner() ? 'Владелец' : staff ? 'Админ' : 'Игрок';
      var link = 'https://t.me/' + NX.BOT + '?start=ref_' + u.id, rl = refs();
      var av = u.photo_url ? '<img src="' + NX.esc(u.photo_url) + '" alt="">' : NX.esc(((u.first_name || '?')[0] || '?').toUpperCase());
      var invCount = (u.inventory || []).length, invSum = NX.r2((u.inventory || []).reduce(function (s, i) { return s + (i.value || 0); }, 0));
      $('profBody').innerHTML =
        '<div class="pcard"><div class="bav">' + av + '</div><div class="pn">' + NX.esc(u.first_name || 'Игрок') + '</div><div class="pid">' + (u.username ? '@' + NX.esc(u.username) + ' · ' : '') + 'ID ' + u.id + '</div><span class="role' + (staff ? '' : ' pl') + '">' + role + '</span></div>' +
        '<div class="pstats"><div class="pst"><small>Баланс</small><b>' + NX.tonI(20) + NX.fmt(u.balance) + '</b></div><div class="pst"><small>Оборот</small><b>' + NX.tonI(20) + NX.fmt(u.total_spent || 0) + '</b></div>' +
        '<div class="pst"><small>Открыто кейсов</small><b>' + ((u.stats && u.stats.opened) || 0) + '</b></div><div class="pst"><small>Предметов</small><b>' + invCount + '</b></div></div>' +
        '<div class="sec" style="display:flex;justify-content:space-between;align-items:baseline">Инвентарь<span class="hint">' + (invCount ? NX.fmt(invSum) + ' TON' : '') + '</span></div><div id="profInv"></div>' +
        '<div class="refbox"><b style="font-size:16px">Приглашай друзей — 2% с пополнения</b><div class="lnk">' + link + '</div>' +
        (rl.length ? rl.map(function (r) { return '<div class="rrow"><span>' + NX.esc(r.name) + '</span><b>' + NX.fmt(r.earned) + ' TON · 2%</b></div>'; }).join('') + '<div style="height:10px"></div>' : '<div class="hint" style="margin-bottom:12px">Пока никого нет</div>') +
        '<button type="button" class="btn green" id="btnRef">Пригласить</button><a class="btn ghost" id="btnSupport" href="https://t.me/nexvendropmananger" target="_blank" rel="noopener" style="margin-top:10px">Поддержка</a></div>' +
        '<div class="card" style="margin-top:12px"><div class="lab" style="margin:0 0 10px">Промокод</div><div id="profPromo"></div></div>' +
        '<div class="card" style="margin-top:12px"><div class="sw-row"><span>Звуки</span><label class="sw"><input type="checkbox" id="sndOn"' + (NX.isMuted() ? '' : ' checked') + '><i></i></label></div></div>' +
        (staff ? '<button type="button" class="btn gold" id="btnOpenAdmin" style="margin-top:12px">Админ-панель</button>' : '');
      NX.invGrid($('profInv'), u.inventory || [], { onTap: NX.showItem });
      promoBox($('profPromo'), 'pfPromo');
      $('btnRef').onclick = function () { try { if (NX.tg && NX.tg.openTelegramLink) NX.tg.openTelegramLink('https://t.me/share/url?url=' + encodeURIComponent(link)); else if (navigator.clipboard) { navigator.clipboard.writeText(link); NX.toast('Ссылка скопирована', 'success'); } } catch (e) {} };
      $('sndOn').onchange = function () { NX.setMuted(!this.checked); NX.haptic('select'); };
      var ba = $('btnOpenAdmin');
      if (ba) ba.onclick = function () {
        $('admRole').textContent = NX.isOwner() ? 'Владелец: можно выдавать, забирать и обнулять TON' : 'Админ: можно принять заказ, выдавать TON нельзя';
        NX.open('modAdmin'); NX.loadAdminPlayers(); NX.loadPromos();
      };
    }
  };

  /* ===== promo codes: player box (profile + deposit tab) ===== */
  function promoBox(box, pfx) {
    box.innerHTML = '<div class="paynote">Введите промокод и получите награду. Один код можно активировать один раз на игрока.</div>' +
      '<input id="' + pfx + 'In" class="inp" placeholder="ПРОМОКОД" maxlength="24" autocomplete="off" autocapitalize="characters" style="text-transform:uppercase;letter-spacing:1px" />' +
      '<button type="button" class="btn" id="' + pfx + 'Go">Активировать</button><div class="hint" id="' + pfx + 'Res" style="margin:10px 2px 0;min-height:18px"></div>';
    var inp = $(pfx + 'In'), go = $(pfx + 'Go'), res = $(pfx + 'Res'), busy = false;
    function run() {
      if (busy) return;
      var code = NX.net.promoNorm(inp.value);
      if (!code) { NX.toast('Введите промокод', 'error'); return; }
      busy = true; go.disabled = true; res.className = 'hint'; res.textContent = 'Проверяю…';
      NX.net.promoRedeem(code).then(function (r) {
        busy = false; go.disabled = false; inp.value = '';
        res.className = 'hint promo-ok'; res.textContent = r.msg;
        NX.toast(r.msg, 'success'); NX.sfx('win'); NX.haptic('success'); NX.confetti(.8);
        NX.renderUser();
        if (NX.cur() === 'profile' && NX.pages.profile.enter) NX.pages.profile.enter();
      }, function (e) {
        busy = false; go.disabled = false;
        res.className = 'hint promo-bad'; res.textContent = (e && e.message) || 'Не удалось активировать';
        NX.toast(res.textContent, 'error'); NX.haptic('error');
      });
    }
    go.onclick = run;
    inp.onkeydown = function (e) { if (e.key === 'Enter') run(); };
  }

  /* ===== deposit ===== */
  function payBox(kind) {
    var box = $('payBox');
    if (kind === 'stars') {
      var R = NX.STARS_PER_TON, pre = [100, 250, 500, 1000];
      box.innerHTML = '<div class="paynote">Оплата проходит через Telegram Stars в боте. Курс: <b>' + R + ' Stars = 1 TON</b>.</div><div class="qty" style="grid-template-columns:repeat(4,1fr)" id="payPre">' + pre.map(function (v, i) { return '<button type="button" data-a="' + v + '"' + (i === 0 ? ' class="on"' : '') + '>' + v + '</button>'; }).join('') + '</div><input id="payAmt" class="inp" inputmode="numeric" value="' + pre[0] + '" /><div class="hint" id="payGet" style="margin:8px 2px 12px"></div><button type="button" class="btn" id="btnPayGo">Оплатить Stars</button>';
      var upd = function () { var a = parseInt($('payAmt').value, 10) || 0; $('payGet').textContent = a >= R ? 'Вы получите ' + NX.fmt(a / R) + ' TON' : 'Минимум ' + R + ' Stars (' + 1 + ' TON)'; };
      $('payAmt').oninput = upd; upd();
      $('payPre').onclick = function (e) { var b = e.target.closest('[data-a]'); if (!b) return; $('payAmt').value = b.getAttribute('data-a'); upd(); NX.qa('button', $('payPre')).forEach(function (x) { x.classList.toggle('on', x === b); }); NX.haptic('select'); };
      $('btnPayGo').onclick = function () {
        var a = parseInt($('payAmt').value, 10) || 0;
        if (a < R) { NX.toast('Минимум ' + R + ' Stars', 'error'); return; }
        var url = 'https://t.me/' + NX.BOT + '?start=pay_' + a;
        try { if (NX.tg && NX.tg.openTelegramLink) NX.tg.openTelegramLink(url); else window.open(url, '_blank'); } catch (e) {}
        NX.close('modPay');
      };
    } else if (kind === 'gift') promoBox(box, 'dpPromo');
    else box.innerHTML = '<div class="paynote" style="background:rgba(255,255,255,.05);border-color:var(--line2);color:var(--m)">Этот способ пополнения скоро появится.</div>';
  }
  function bindModals() {
    $('btnDeposit').onclick = function () { NX.sfx('click'); NX.haptic('light'); payBox('stars'); NX.qa('#pays button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-pay') === 'stars'); }); NX.open('modPay'); };
    NX.qa('#pays button').forEach(function (b) {
      var k = b.getAttribute('data-pay'); if (k !== 'stars' && k !== 'gift') b.classList.add('dim');
      b.onclick = function () { NX.qa('#pays button').forEach(function (x) { x.classList.toggle('on', x === b); }); payBox(k); NX.haptic('select'); };
    });

    /* admin: owner can give/take TON, staff can reset the free case; other players get it via Firestore grants */
    var u = function () { return NX.user(); };
    function sent(ok, msg) { $('admRes').textContent = msg; if (ok) { NX.toast('Отправлено', 'success'); NX.sfx('win'); } else NX.toast(msg, 'error'); }
    function toOther(tid, amt, type, okMsg) {
      if (!NX.net.enabled()) { sent(false, 'Выдача другим игрокам работает через Firebase: впиши projectId и apiKey в config.js'); return; }
      $('admRes').textContent = 'Отправляю…';
      NX.net.sendGrant(tid, amt, type).then(function () { sent(true, okMsg + ' Игрок получит это при ближайшем заходе (до 20 сек, если он сейчас в игре).'); })
        .catch(function (e) { sent(false, (e && e.message) || 'Не удалось отправить'); });
    }
    $('btnAdmGive').onclick = function () {
      if (!NX.isOwner()) { NX.toast('Выдавать может только владелец', 'error'); return; }
      var tid = parseInt($('admId').value, 10), amt = parseFloat($('admAmt').value);
      if (!tid || isNaN(amt) || amt <= 0) { NX.toast('Нужны ID и сумма больше 0', 'error'); return; }
      if (NX.sameId(tid, u().id)) { NX.credit(amt); NX.save(true); $('admRes').textContent = 'Готово. Баланс ' + NX.fmt(u().balance) + ' TON'; NX.sfx('win'); NX.toast('Баланс обновлён', 'success'); }
      else toOther(tid, amt, 'ton', 'Выдача +' + NX.fmt(amt) + ' TON для ' + tid + ' отправлена.');
    };
    $('btnAdmTake').onclick = function () {
      if (!NX.isOwner()) { NX.toast('Забирать может только владелец', 'error'); return; }
      var tid = parseInt($('admId').value, 10), amt = parseFloat($('admAmt').value);
      if (!tid || isNaN(amt) || amt <= 0) { NX.toast('Нужны ID и сумма больше 0', 'error'); return; }
      if (NX.sameId(tid, u().id)) { NX.credit(-Math.min(amt, u().balance)); NX.save(true); $('admRes').textContent = 'Забрано. Баланс ' + NX.fmt(u().balance) + ' TON'; }
      else toOther(tid, -amt, 'ton', 'Списание ' + NX.fmt(amt) + ' TON у ' + tid + ' отправлено.');
    };
    $('btnAdmFree').onclick = function () {
      if (!NX.isStaff()) return;
      var tid = parseInt($('admId').value, 10); if (!tid) { NX.toast('Введи ID игрока', 'error'); return; }
      if (NX.sameId(tid, u().id)) { u().last_free = 0; NX.save(true); $('admRes').textContent = 'Бесплатный кейс сброшен'; NX.toast('Бесплатный кейс готов', 'success'); }
      else toOther(tid, 0, 'free', 'Сброс бесплатного кейса для ' + tid + ' отправлен.');
    };
    /* owner: wipe balance + turnover + stats for all time (self or another player). Second button also clears the inventory. */
    function doReset(withInv) {
      if (!NX.isOwner()) { NX.toast('Обнулять может только владелец', 'error'); return; }
      var tid = parseInt($('admId').value, 10);
      if (!tid) { NX.toast('Введи ID игрока (свой ID — для обнуления себя)', 'error'); return; }
      var self = NX.sameId(tid, u().id);
      var q = (self ? 'Обнулить СВОЙ баланс и оборот' : 'Обнулить баланс и оборот игрока ' + tid) + (withInv ? ' и очистить инвентарь' : '') + '? Это необратимо.';
      function run() {
        if (self) { NX.resetAccount(withInv); $('admRes').textContent = 'Готово: баланс 0, оборот 0, рекорд сброшен' + (withInv ? ', инвентарь пуст' : '') + '.'; NX.toast('Обнулено', 'success'); NX.sfx('win'); return; }
        if (!NX.net.enabled()) { sent(false, 'Для обнуления другого игрока нужен Firebase (config.js)'); return; }
        $('admRes').textContent = 'Отправляю…';
        NX.net.resetPlayer(tid, withInv).then(function () { sent(true, 'Обнуление для ' + tid + ' отправлено, строка в топе сброшена. Игрок получит сброс при ближайшем заходе (до 20 сек, если он в игре).'); })
          .catch(function (e) { sent(false, (e && e.message) || 'Не удалось отправить'); });
      }
      try { if (NX.tg && NX.tg.showConfirm) { NX.tg.showConfirm(q, function (ok) { if (ok) run(); }); return; } } catch (e) {}
      if (window.confirm(q)) run();
    }
    $('btnAdmReset').onclick = function () { doReset(false); };
    $('btnAdmResetAll').onclick = function () { doReset(true); };

    /* ---- promo codes (staff) ---- */
    var pmGifts = Object.keys(window.GIFTS).filter(function (n) { return !/ TON$/.test(n); }).sort(function (a, b) { return window.GIFTS[a].value - window.GIFTS[b].value; });
    $('pmItem').innerHTML = pmGifts.map(function (n) { return '<option value="' + NX.esc(n) + '">' + NX.esc(n) + ' — ' + NX.fmt(window.GIFTS[n].value) + ' TON' + (window.GIFTS[n].nft ? ' · NFT' : '') + '</option>'; }).join('');
    function pmSync() { var t = $('pmType').value; $('pmAmtBox').classList.toggle('hide', t !== 'ton'); $('pmItemBox').classList.toggle('hide', t !== 'item'); }
    $('pmType').onchange = pmSync; pmSync();
    function pmMsg(ok, m) { var el = $('pmRes'); el.className = 'hint ' + (ok ? 'promo-ok' : 'promo-bad'); el.textContent = m; }
    function randCode() { var a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', o = 'NX', i; for (i = 0; i < 6; i++) o += a[NX.randInt(a.length)]; return o; }
    $('btnPmCreate').onclick = function () {
      if (!NX.isStaff()) { NX.toast('Только для админов', 'error'); return; }
      var type = $('pmType').value, amt = parseFloat($('pmAmt').value), code = NX.net.promoNorm($('pmCode').value) || randCode();
      if (type === 'ton' && (!(amt > 0) || amt > 10000)) { pmMsg(false, 'Сумма TON: от 0.01 до 10000'); return; }
      if (type === 'ton' && !NX.isOwner() && !NX.PROMO_ADMINS_CAN_TON) { pmMsg(false, 'TON-промокоды может создавать только владелец'); return; }
      var o = { code: code, type: type, amount: type === 'ton' ? NX.r2(amt) : 0, item: type === 'item' ? $('pmItem').value : '', max: parseInt($('pmMax').value, 10) || 0, days: parseFloat($('pmDays').value) || 0 };
      pmMsg(true, 'Создаю…'); $('btnPmCreate').disabled = true;
      NX.net.promoCreate(o).then(function (c) {
        $('btnPmCreate').disabled = false; $('pmCode').value = '';
        pmMsg(true, 'Готово! Код: ' + c + ' · ' + NX.net.promoDescribe(o));
        NX.toast('Промокод создан', 'success'); NX.sfx('win');
        try { if (navigator.clipboard) navigator.clipboard.writeText(c); } catch (e) {}
        NX.loadPromos();
      }, function (e) { $('btnPmCreate').disabled = false; pmMsg(false, (e && e.message) || 'Не удалось создать'); });
    };
    $('pmList').onclick = function (e) {
      var b = e.target.closest('[data-pm]'); if (!b) return;
      var code = b.getAttribute('data-code'), act = b.getAttribute('data-pm');
      if (act === 'copy') { try { navigator.clipboard.writeText(code); NX.toast('Скопировано: ' + code, 'success'); } catch (er) {} return; }
      if (act === 'del') {
        var q = 'Удалить промокод ' + code + '?';
        var doDel = function () { NX.net.promoDelete(code).then(function () { NX.toast('Удалён', 'success'); NX.loadPromos(); }, function (er) { pmMsg(false, (er && er.message) || 'Не удалось удалить'); }); };
        try { if (NX.tg && NX.tg.showConfirm) { NX.tg.showConfirm(q, function (ok) { if (ok) doDel(); }); return; } } catch (er) {}
        if (window.confirm(q)) doDel(); return;
      }
      if (act === 'tg') { NX.net.promoToggle(code, b.getAttribute('data-on') === '1').then(function () { NX.loadPromos(); }, function (er) { pmMsg(false, (er && er.message) || 'Ошибка'); }); }
    };
    /* player picker (needs shared leaderboard) */
    $('admPick').onclick = function (e) { var r = e.target.closest('[data-pid]'); if (r) { $('admId').value = r.getAttribute('data-pid'); NX.haptic('select'); } };
  }
  NX.loadAdminPlayers = function () {
    var box = $('admPick'); if (!box) return;
    if (!NX.net.enabled()) { box.innerHTML = ''; return; }
    box.innerHTML = '<div class="hint">Загружаю игроков…</div>';
    NX.net.fetchBoard().then(function (res) {
      box.innerHTML = '<div class="lab" style="margin:10px 0 6px">Игроки (нажми, чтобы подставить ID)</div>' + res.rows.slice(0, 40).map(function (r) {
        return '<button type="button" class="prow" data-pid="' + NX.esc(r.id) + '"><span>' + (r.online ? '<i class="dot"></i>' : '<i class="dot off"></i>') + NX.esc(r.name) + '</span><small>' + NX.esc(r.id) + '</small></button>';
      }).join('');
    }).catch(function (e) { box.innerHTML = '<div class="hint">' + NX.esc((e && e.message) || 'Не удалось загрузить игроков') + '</div>'; });
  };
  NX.loadPromos = function () {
    var box = $('pmList'); if (!box) return;
    if (!NX.net.enabled()) { box.innerHTML = '<div class="hint">Нужен Firebase (config.js)</div>'; return; }
    box.innerHTML = '<div class="hint">Загружаю промокоды…</div>';
    NX.net.promoList().then(function (list) {
      if (!list.length) { box.innerHTML = '<div class="hint">Промокодов пока нет</div>'; return; }
      box.innerHTML = '<div class="lab" style="margin:12px 0 6px">Созданные промокоды (' + list.length + ')</div>' + list.map(function (p) {
        var exp = p.exp ? (Date.now() > p.exp ? 'истёк' : 'до ' + new Date(p.exp).toLocaleDateString('ru-RU')) : 'бессрочно';
        var dead = !p.active || (p.exp && Date.now() > p.exp) || (p.max && p.used >= p.max);
        return '<div class="promo-row' + (dead ? ' off' : '') + '"><div class="pc"><b>' + NX.esc(p.code) + '</b><small>' + NX.esc(NX.net.promoDescribe(p)) + ' · ' + p.used + '/' + (p.max || '∞') + ' · ' + exp + '</small></div>' +
          '<button type="button" data-pm="copy" data-code="' + NX.esc(p.code) + '">Копия</button>' +
          '<button type="button" data-pm="tg" data-on="' + (p.active ? 0 : 1) + '" data-code="' + NX.esc(p.code) + '">' + (p.active ? 'Выкл' : 'Вкл') + '</button>' +
          '<button type="button" class="del" data-pm="del" data-code="' + NX.esc(p.code) + '">✕</button></div>';
      }).join('');
    }, function (e) { box.innerHTML = '<div class="hint">' + NX.esc((e && e.message) || 'Не удалось загрузить') + '</div>'; });
  };
  NX.bindModals = bindModals;
})(window.NX);
