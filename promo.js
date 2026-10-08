/* Nexven Drop — вкладка «Промо»: ввод промокода.
   Промокод проверяет и выдаёт бот (лимиты, один раз на игрока); награда приходит в приложение сама. */
(function (NX) {
  'use strict';
  var $ = NX.$, pollT = null;

  function clean(v) { return String(v || '').replace(/[^A-Za-z0-9_-]/g, '').toUpperCase().slice(0, 24); }

  function logHtml() {
    var log = (NX.user().promo_log || []);
    if (!log.length) return '<div class="empty">Здесь появятся активированные промокоды</div>';
    return log.map(function (r) {
      return '<div class="pr-row"><div class="pr-l"><b>' + NX.esc(r.code || 'PROMO') + '</b><small>' + NX.esc(r.text || '') + '</small></div><span>' + NX.fmtDate(r.ts) + '</span></div>';
    }).join('');
  }

  function stopPoll() { clearInterval(pollT); pollT = null; }
  /* после активации в боте награда появляется в Firestore — быстро проверяем, пока игрок рядом */
  function pollRewards() {
    stopPoll(); var n = 0;
    pollT = setInterval(function () {
      if (++n > 12 || NX.cur() !== 'promo') { stopPoll(); return; }
      if (NX.net && NX.net.enabled()) NX.net.claimGrants(function () { refreshLog(); });
    }, 4000);
  }

  function refreshLog() { var el = $('prLog'); if (el) el.innerHTML = logHtml(); }

  NX.pages.promo = {
    build: function () {
      $('v-promo').innerHTML =
        '<div class="sec">Промокоды</div>' +
        '<div class="card pr-card">' +
          '<div class="pr-ic"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2.2a1.8 1.8 0 0 0 0 3.6V16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2.2a1.8 1.8 0 0 0 0-3.6z"/><path d="M14.5 7v10" stroke-dasharray="1.8 2.4"/></svg></div>' +
          '<div class="pr-t">Есть промокод?</div>' +
          '<div class="hint" style="margin-bottom:12px">Введи код — награда придёт на баланс или в инвентарь. Один код — один раз на игрока.</div>' +
          '<input id="prCode" class="inp" placeholder="Например NX4K9TQ2" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="24" />' +
          '<button type="button" class="btn green" id="btnPromoGo">Активировать</button>' +
          '<div class="hint" id="prHint" style="margin-top:10px"></div>' +
        '</div>' +
        '<button type="button" class="btn ghost" id="btnPromoWhere" style="margin-top:12px">Где взять промокоды</button>' +
        '<div class="sec" style="font-size:17px">Мои промокоды</div><div id="prLog"></div>';

      var inp = $('prCode');
      inp.addEventListener('input', function () { var c = clean(inp.value); if (c !== inp.value) inp.value = c; });
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); $('btnPromoGo').click(); } });
      $('btnPromoGo').onclick = function () {
        var code = clean(inp.value);
        if (code.length < 3) { NX.toast('Введите промокод', 'error'); NX.haptic('error'); return; }
        NX.sfx('click'); NX.haptic('light');
        $('prHint').textContent = 'Открываю бота. После активации вернись сюда — награда придёт сама.';
        NX.openBot('promo_' + code);
        inp.value = '';
        pollRewards();
      };
      $('btnPromoWhere').onclick = function () {
        try { if (NX.tg && NX.tg.openTelegramLink) NX.tg.openTelegramLink(NX.CHANNEL); else window.open(NX.CHANNEL, '_blank'); } catch (e) {}
      };
    },
    enter: function () {
      refreshLog();
      if (NX.net && NX.net.enabled()) NX.net.claimGrants(function () { refreshLog(); });
    },
    leave: stopPoll
  };
})(window.NX);
