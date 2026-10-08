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
    build: function () {
      var root = $('v-games');
      root.innerHTML = '<div class="lb-online sm" id="gmOnline"><i class="dot"></i>Онлайн: <b id="gmOnN">1</b></div><div class="banners">' + GAMES.map(function (g, i) {
        return '<button type="button" class="banner" data-game="' + g.id + '" style="animation-delay:' + (i * 90) + 'ms">' + ART.banners[g.art]() +
          '<span class="bn-tag">' + g.tag + '</span><span class="bn-label"><div class="bn-t">' + g.title + '</div><div class="bn-d">' + g.desc + '</div></span></button>';
      }).join('') + '</div>';
      root.onclick = function (e) { var b = e.target.closest('[data-game]'); if (b) { NX.sfx('click'); NX.haptic('light'); NX.go(b.getAttribute('data-game')); } };
    },
    enter: function () {
      /* rebuild every enter — fixes broken banners after leaving mini-games */
      NX.pages.games.build();
      clearInterval(onT);
      var upd = function () {
        if (NX.net && NX.net.enabled()) {
          NX.net.fetchOnline().then(function (n) {
            var e = $('gmOnN'); if (e) e.textContent = Math.max(n, 1);
          }, function () { var e = $('gmOnN'); if (e) e.textContent = '1'; });
        } else {
          var e = $('gmOnN'); if (e) e.textContent = '1';
        }
      };
      upd();
      onT = setInterval(upd, 20000);
      try { window.scrollTo(0, 0); } catch (e) {}
    },
    leave: function () { clearInterval(onT); }
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
        '<div class="lname"><b>' + NX.esc(r.name) + '</b><small>' + (me ? 'Это вы' : r.online ? '<span class="onl">в сети</span>' : '') + '</small></div><div class="lval">' + NX.fmt(r.spent) + ' ' + NX.tonI(18) + '</div>' +
        '<div class="lgift">' + (r.best && r.best.name ? window.giftImg(r.best.name) : '') + '</div></div>';
    }).join('');
  }
  function localRows() {
    NX.save(); var rows = []; try { rows = JSON.parse(localStorage.getItem('nv_top') || '[]'); } catch (e) {}
    rows.sort(function (a, b) { return b.spent - a.spent; }); return rows;
  }
  function loadBoard(first) {
    var u = NX.user(), box = $('lbRows'), head = $('lbOnline');
    if (!NX.net || !NX.net.enabled()) {
      head.innerHTML = '<i class="dot"></i>Онлайн: —';
      box.innerHTML = '<div class="empty">Firebase не настроен в config.js</div>';
      return;
    }
    if (first) box.innerHTML = '<div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div>';
    NX.net.push(true);
    NX.net.fetchBoard().then(function (res) {
      if (NX.cur() !== 'top') return;
      var rows = res.rows || [], mine = rows.some(function (r) { return String(r.id) === String(u.id); });
      if (!mine) rows.push({ id: u.id, name: u.first_name || 'Игрок', photo: u.photo_url || null, spent: NX.r2(u.total_spent || 0), best: (u.stats && u.stats.best) || null, online: true });
      rows.sort(function (a, b) { return b.spent - a.spent; });
      head.innerHTML = '<i class="dot"></i>Онлайн: <b>' + Math.max(res.online, 1) + '</b><span class="tot">Игроков: ' + rows.length + '</span>';
      box.innerHTML = rowsHtml(rows, u);
    }).catch(function () {
      if (NX.cur() !== 'top') return;
      head.innerHTML = '<i class="dot"></i>Онлайн: —';
      box.innerHTML = '<div class="empty" style="line-height:1.5;padding:16px">' +
        '<b style="color:#fff">Firestore: база Firestore не создана</b><br><br>' +
        '1. Открой ссылку ниже<br>' +
        '2. Create database → <b>test mode</b> → Enable<br>' +
        '3. Rules → allow read, write: if true → Publish<br>' +
        '4. Нажми «Повторить»<br><br>' +
        '<a href="https://console.firebase.google.com/project/custom-graphics-36c50/firestore" target="_blank" rel="noopener" style="color:#5aa2ff">Открыть Firebase Console</a><br><br>' +
        '<button type="button" class="btn sm" id="lbRetry" style="margin-top:8px;max-width:200px">Повторить</button></div>';
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
  function wdCardHtml() {
    var open = NX.wdOpen(), u = NX.user();
    return '<div class="card wdcard' + (open ? ' on' : '') + '"><div class="wd-t"><i></i>Вывод подарков: ' + (open ? 'открыт' : 'закрыт') + '</div>' +
      '<div class="hint">' + (open
        ? 'Действует до ' + NX.fmtDate(u.wd_until) + '. Подарки от ' + NX.WD_MIN + ' TON выводятся бесплатно.'
        : 'Пополни баланс на ' + NX.WD_STARS + ' ⭐ одним платежом — ' + NX.WD_DAYS + ' дней можно бесплатно выводить подарки от ' + NX.WD_MIN + ' TON.') + '</div>' +
      (open ? '' : '<button type="button" class="btn sm" id="btnWdTopup">Пополнить ' + NX.WD_STARS + ' ⭐</button>') + '</div>';
  }
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
        wdCardHtml() +
        '<div class="sec" style="display:flex;justify-content:space-between;align-items:baseline">Инвентарь<span class="hint">' + (invCount ? NX.fmt(invSum) + ' TON' : '') + '</span></div><div id="profInv"></div>' +
        '<div class="refbox"><b style="font-size:16px">Приглашай друзей — 2% с пополнения</b><div class="lnk">' + link + '</div>' +
        (rl.length ? rl.map(function (r) { return '<div class="rrow"><span>' + NX.esc(r.name) + '</span><b>' + NX.fmt(r.earned) + ' TON · 2%</b></div>'; }).join('') + '<div style="height:10px"></div>' : '<div class="hint" style="margin-bottom:12px">Пока никого нет</div>') +
        '<button type="button" class="btn green" id="btnRef">Пригласить</button><a class="btn ghost" id="btnSupport" href="https://t.me/nexvendropmananger" target="_blank" rel="noopener" style="margin-top:10px">Поддержка</a></div>' +
        '<div class="card" style="margin-top:12px"><div class="sw-row"><span>Звуки</span><label class="sw"><input type="checkbox" id="sndOn"' + (NX.isMuted() ? '' : ' checked') + '><i></i></label></div></div>' +
        (staff ? '<button type="button" class="btn gold" id="btnOpenAdmin" style="margin-top:12px">Админ-панель</button>' : '');
      NX.invGrid($('profInv'), u.inventory || [], { onTap: NX.showItem });
      var wt = $('btnWdTopup'); if (wt) wt.onclick = function () { NX.sfx('click'); NX.openBot('pay_' + NX.WD_STARS); };
      $('btnRef').onclick = function () { try { if (NX.tg && NX.tg.openTelegramLink) NX.tg.openTelegramLink('https://t.me/share/url?url=' + encodeURIComponent(link)); else if (navigator.clipboard) { navigator.clipboard.writeText(link); NX.toast('Ссылка скопирована', 'success'); } } catch (e) {} };
      $('sndOn').onchange = function () { NX.setMuted(!this.checked); NX.haptic('select'); };
      var ba = $('btnOpenAdmin');
      if (ba) ba.onclick = function () {
        $('admRole').textContent = NX.isOwner() ? 'Владелец: выдача себе и через бота' : 'Админ: выдача себе и через бота';
        NX.open('modAdmin');
      };
    }
  };

  /* ===== deposit ===== */
  function payBox(kind) {
    var box = $('payBox');
    if (kind === 'stars') {
      box.innerHTML = '<div class="paynote">Оплата проходит через Telegram Stars в боте.</div><div class="qty" style="grid-template-columns:repeat(4,1fr)" id="payPre">' + [50, 100, 250, 500].map(function (v, i) { return '<button type="button" data-a="' + v + '"' + (i === 0 ? ' class="on"' : '') + '>' + v + '</button>'; }).join('') + '</div><input id="payAmt" class="inp" inputmode="numeric" value="50" /><button type="button" class="btn" id="btnPayGo">Оплатить Stars</button>';
      $('payPre').onclick = function (e) { var b = e.target.closest('[data-a]'); if (!b) return; $('payAmt').value = b.getAttribute('data-a'); NX.qa('button', $('payPre')).forEach(function (x) { x.classList.toggle('on', x === b); }); NX.haptic('select'); };
      $('btnPayGo').onclick = function () {
        var a = parseInt($('payAmt').value, 10) || 50, url = 'https://t.me/' + NX.BOT + '?start=pay_' + a;
        try { if (NX.tg && NX.tg.openTelegramLink) NX.tg.openTelegramLink(url); else window.open(url, '_blank'); } catch (e) {}
        NX.close('modPay');
      };
    } else box.innerHTML = '<div class="paynote" style="background:rgba(255,255,255,.05);border-color:var(--line2);color:var(--m)">Этот способ пополнения скоро появится.</div>';
  }
  function bindModals() {
    $('btnDeposit').onclick = function () { NX.sfx('click'); NX.haptic('light'); payBox('stars'); NX.qa('#pays button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-pay') === 'stars'); }); NX.open('modPay'); };
    NX.qa('#pays button').forEach(function (b) {
      var k = b.getAttribute('data-pay'); if (k !== 'stars') b.classList.add('dim');
      b.onclick = function () { NX.qa('#pays button').forEach(function (x) { x.classList.toggle('on', x === b); }); payBox(k); NX.haptic('select'); };
    });

    /* admin */
    var u = function () { return NX.user(); };
    $('btnAdmGive').onclick = function () {
      if (!NX.isStaff()) { NX.toast('Нет доступа', 'error'); return; }
      var tid = parseInt($('admId').value, 10), amt = parseFloat(String($('admAmt').value).replace(',', '.'));
      if (!tid || isNaN(amt) || amt === 0) { NX.toast('Нужны ID и сумма', 'error'); return; }
      if (Number(tid) === Number(u().id)) {
        NX.credit(amt);
        NX.save(true);
        try { if (NX.net && NX.net.push) NX.net.push(true); } catch (e) {}
        $('admRes').textContent = 'Готово. Баланс ' + NX.fmt(u().balance) + ' TON';
        NX.sfx('win'); NX.toast('Баланс обновлён', 'success');
        return;
      }
      function openBotGive() {
        var url = 'https://t.me/' + NX.BOT + '?start=give_' + tid + '_' + encodeURIComponent(String(amt));
        $('admRes').textContent = 'Открываю бота: выдача ' + NX.fmt(amt) + ' TON → ' + tid;
        try {
          if (NX.tg && NX.tg.openTelegramLink) NX.tg.openTelegramLink(url);
          else window.open(url, '_blank');
        } catch (e) {}
        NX.toast('Подтверди выдачу в боте', 'success');
      }
      if (NX.net && NX.net.enabled() && NX.net.grant) {
        $('admRes').textContent = 'Отправляем…';
        NX.net.grant(tid, amt, function (err) {
          if (err) openBotGive();
          else {
            $('admRes').textContent = 'Выдано ' + NX.fmt(amt) + ' TON → ' + tid + '. Игрок получит при входе.';
            NX.sfx('win'); NX.toast('Выдано', 'success');
          }
        });
      } else openBotGive();
    };
    $('btnAdmTake').onclick = function () {
      if (!NX.isStaff()) { NX.toast('Нет доступа', 'error'); return; }
      var amt = parseFloat(String($('admAmt').value).replace(',', '.')) || 0;
      var tid = parseInt($('admId').value, 10);
      if (Number(tid) === Number(u().id)) {
        NX.credit(-Math.min(Math.abs(amt), u().balance));
        NX.save(true);
        $('admRes').textContent = 'Забрано. Баланс ' + NX.fmt(u().balance) + ' TON';
        NX.toast('Забрано', 'success');
      } else {
        NX.toast('Забирать можно только у себя в мини-аппе', 'error');
      }
    };
    $('btnAdmPromo').onclick = function () {
      if (!NX.isStaff()) { NX.toast('Нет доступа', 'error'); return; }
      NX.close('modAdmin'); NX.openBot('adm_promo');
    };
    $('btnAdmFree').onclick = function () {
      if (!NX.isStaff()) return;
      var tid = parseInt($('admId').value, 10);
      if (Number(tid) === Number(u().id)) {
        u().last_free = 0; NX.save(true);
        $('admRes').textContent = 'Бесплатный кейс сброшен';
        NX.toast('Бесплатный кейс готов', 'success');
      } else NX.toast('Сброс free только для себя', 'error');
    };
  }
  NX.bindModals = bindModals;
})(window.NX);
