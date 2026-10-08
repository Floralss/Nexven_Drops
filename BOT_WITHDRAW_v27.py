# -*- coding: utf-8 -*-
"""
Nexven Drop — модуль бота v27 (aiogram 3): вывод подарков + пополнение Stars.

ЧТО ДЕЛАЕТ
 1) Курс: 1 Star = 0.0091 TON. Пополнение: минимум 10 Stars. Меню пополнения — кнопки в STARS (а не «TON» 1:1, как было).
 2) Одно пополнение от 100 Stars открывает ВЫВОД подарков от 1 TON на 7 дней.
 3) Заявка на вывод (из мини-аппа приходит как /start wd_<сотые доли TON>_<id>_<название подарка в base64url>):
      - проверяется НА СЕРВЕРЕ: подарок >= 1 TON и у игрока есть активный доступ;
      - получает номер #1, #2, #3 ... (сквозной, не повторяется, повторный клик не создаёт новый номер);
      - всем админам уходит сообщение НА РУССКОМ: кто, что выводит, на какой аккаунт, номер заявки;
      - у админов кнопки «Выполнено» / «Отклонить»; игроку приходит ответ и кнопка возврата в игру.

КАК ПОДКЛЮЧИТЬ
 - Положи файл рядом с ботом, в главном файле:  from BOT_WITHDRAW_v27 import router as wd_router ; dp.include_router(wd_router)
   (подключай ПЕРЕД своим старым роутером с /start, а старые обработчики /start pay_ и /start wd_ удали).
 - Заполни 3 функции-«переходника» ниже (db_add_balance, db_get_balance, REFERRAL) под твою базу и поменяй WEBAPP_URL.
"""
import sqlite3, time, html, base64
from aiogram import Router, F, Bot
from aiogram.filters import CommandStart, CommandObject
from aiogram.types import (Message, LabeledPrice, PreCheckoutQuery, CallbackQuery,
                           InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo)

# ===================== НАСТРОЙКИ =====================
WEBAPP_URL      = "https://YOUR-SITE.example/"    # <-- адрес твоего мини-аппа (index.html)
ADMIN_IDS       = [8920532333, 7064801154, 8866989412]   # владелец + админы
TON_PER_STAR    = 0.0091  # 1 Star = 0.0091 TON  (везде в боте: ton = round(stars * TON_PER_STAR, 4))
BACK_CB         = "back"  # callback_data твоей кнопки «Назад» в главное меню (поменяй под свой бот)
TOPUP_PRESETS   = [10, 50, 100, 250, 500]
DEP_MIN_STARS   = 10      # минимум пополнения
WD_MIN_TON      = 1.0     # выводить можно подарки от 1 TON
WD_ACCESS_STARS = 100     # одно пополнение от 100 Stars ...
WD_ACCESS_DAYS  = 7       # ... открывает вывод на 7 дней
DB_FILE         = "nexven_wd.db"

# ===================== ПЕРЕХОДНИКИ К ТВОЕЙ БАЗЕ =====================
def db_add_balance(user_id: int, ton: float):
    """Прибавить TON к балансу игрока (как у тебя уже сделано, только ton = stars / 100)."""
    raise NotImplementedError("подключи свою функцию пополнения баланса")

def db_get_balance(user_id: int) -> float:
    raise NotImplementedError("подключи свою функцию чтения баланса")

# ===================== БАЗА: доступ к выводу и заявки =====================
def _db():
    c = sqlite3.connect(DB_FILE)
    c.execute("CREATE TABLE IF NOT EXISTS wd_access(uid INTEGER PRIMARY KEY, until INTEGER NOT NULL)")
    c.execute("""CREATE TABLE IF NOT EXISTS wd_requests(
        num INTEGER PRIMARY KEY AUTOINCREMENT,          -- номер заявки: 1, 2, 3 ...
        uid INTEGER NOT NULL, username TEXT, first_name TEXT,
        gift TEXT, ton REAL, wd_id TEXT, status TEXT DEFAULT 'pending', ts INTEGER,
        UNIQUE(uid, wd_id))""")
    return c

def grant_access(uid: int) -> int:
    until = int(time.time()) + WD_ACCESS_DAYS * 86400
    with _db() as c:
        c.execute("INSERT INTO wd_access(uid, until) VALUES(?,?) ON CONFLICT(uid) DO UPDATE SET until=excluded.until", (uid, until))
    return until

def access_until(uid: int) -> int:
    with _db() as c:
        r = c.execute("SELECT until FROM wd_access WHERE uid=?", (uid,)).fetchone()
    return r[0] if r and r[0] > time.time() else 0

def stars_to_ton(stars: int) -> float:
    return round(stars * TON_PER_STAR, 4)

def game_url(**q) -> str:
    qs = "&".join(f"{k}={v}" for k, v in q.items())
    return WEBAPP_URL + ("?" + qs if qs else "")

def open_game_kb(text="🎮 Открыть игру", **q):
    return InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text=text, web_app=WebAppInfo(url=game_url(**q)))]])

router = Router()

# ===================== МЕНЮ ПОПОЛНЕНИЯ (вместо старого «50 TON / 100 TON / 250 TON / 500 TON») =====================
# Кнопки — в STARS, рядом сколько TON получит игрок. Минимум 10 Stars. Есть «Своя сумма».
# Старое меню пополнения и его обработчики удали, а свою кнопку «Пополнить» в главном меню направь на callback_data="topup".
_await_amount = set()   # игроки, которые сейчас вводят свою сумму

def topup_text() -> str:
    return (f"💳 <b>Пополнение баланса</b>\n\nКурс: 1 ⭐ = {TON_PER_STAR:g} TON\nМинимум: {DEP_MIN_STARS} ⭐\n\n"
            f"🎁 Пополнение от {WD_ACCESS_STARS} ⭐ открывает вывод подарков от {WD_MIN_TON:g} TON на {WD_ACCESS_DAYS} дн.\n\nВыбери сумму:")

def topup_kb() -> InlineKeyboardMarkup:
    rows, row = [], []
    for st in TOPUP_PRESETS:
        row.append(InlineKeyboardButton(text=f"{st} ⭐ → {stars_to_ton(st):g} TON", callback_data=f"dep:{st}"))
        if len(row) == 2:
            rows.append(row); row = []
    if row: rows.append(row)
    rows.append([InlineKeyboardButton(text="✏️ Своя сумма", callback_data="dep:custom")])
    rows.append([InlineKeyboardButton(text="⬅️ Назад", callback_data=BACK_CB)])
    return InlineKeyboardMarkup(inline_keyboard=rows)

@router.message(F.text == "/deposit")
async def cmd_deposit(m: Message):
    await m.answer(topup_text(), parse_mode="HTML", reply_markup=topup_kb())

@router.callback_query(F.data == "topup")
async def cb_topup(cb: CallbackQuery):
    await cb.message.answer(topup_text(), parse_mode="HTML", reply_markup=topup_kb())
    await cb.answer()

@router.callback_query(F.data.startswith("dep:"))
async def cb_dep(cb: CallbackQuery):
    arg = cb.data.split(":", 1)[1]
    if arg == "custom":
        _await_amount.add(cb.from_user.id)
        await cb.message.answer(f"Напиши количество ⭐ числом (минимум {DEP_MIN_STARS}):")
    else:
        await _send_invoice(cb.message, arg, user_id=cb.from_user.id)
    await cb.answer()

@router.message(F.text.regexp(r"^\d{1,6}$"))
async def custom_amount(m: Message):
    if m.from_user.id not in _await_amount:
        return                                            # обычное число — не наше, пусть обрабатывают другие
    _await_amount.discard(m.from_user.id)
    await _send_invoice(m, m.text, user_id=m.from_user.id)

# ===================== /start: pay_<stars> и wd_<...> =====================
@router.message(CommandStart(deep_link=True))
async def start_deeplink(m: Message, command: CommandObject, bot: Bot):
    arg = (command.args or "").strip()
    if arg.startswith("pay_"):
        return await _send_invoice(m, arg[4:])
    if arg.startswith("wd_"):
        return await _withdraw_request(m, arg, bot)
    # остальные ссылки (ref_, free_ok и т.д.) — пусть обрабатывает твой старый /start:
    # здесь можно просто вызвать твою старую функцию, например: await old_start(m, command)

async def _send_invoice(m: Message, raw: str, user_id: int = None):
    try:
        stars = int(raw)
    except ValueError:
        return await m.answer("Некорректная сумма.")
    if stars < DEP_MIN_STARS:
        return await m.answer(f"Минимальное пополнение — {DEP_MIN_STARS} ⭐.")
    ton = stars_to_ton(stars)
    bonus = (f"\n🎁 От {WD_ACCESS_STARS} ⭐ — бесплатный вывод подарков от {WD_MIN_TON:g} TON на {WD_ACCESS_DAYS} дн."
             if stars >= WD_ACCESS_STARS else "")
    await m.answer_invoice(
        title=f"Пополнение {ton:g} TON", description=f"{stars} ⭐ = {ton:g} TON (1 ⭐ = {TON_PER_STAR:g} TON){bonus}",
        payload=f"dep_{user_id or m.from_user.id}_{stars}", currency="XTR", prices=[LabeledPrice(label="Stars", amount=stars)])

@router.pre_checkout_query()
async def pre_checkout(q: PreCheckoutQuery):
    await q.answer(ok=True)

@router.message(F.successful_payment)
async def paid(m: Message):
    stars = m.successful_payment.total_amount            # для XTR это число звёзд
    ton = stars_to_ton(stars)
    uid = m.from_user.id
    db_add_balance(uid, ton)
    q = {"sync": round(db_get_balance(uid), 4)}
    text = f"✅ Баланс пополнен на {ton:g} TON."
    if stars >= WD_ACCESS_STARS:
        q["acc"] = grant_access(uid)                      # unix-время (сек), до которого открыт вывод
        text += f"\n🎁 Вывод подарков от {WD_MIN_TON:g} TON открыт на {WD_ACCESS_DAYS} дн."
    await m.answer(text, reply_markup=open_game_kb(**q))
    # реферальные 2% считай от ton (а не от stars) — как у тебя уже было

# ===================== ЗАЯВКА НА ВЫВОД =====================
async def _withdraw_request(m: Message, arg: str, bot: Bot):
    # arg = wd_<сотые доли TON>_<id>_<название подарка base64url>;  кто игрок — берём из Telegram, а не из ссылки (ссылку можно подделать)
    try:
        _, cents, wd_id, b64 = (arg.split("_", 3) + [""])[:4]
        ton = int(cents) / 100
        try:
            gift = base64.urlsafe_b64decode(b64 + "=" * (-len(b64) % 4)).decode("utf-8", "ignore").strip() or "подарок"
        except Exception:
            gift = "подарок"
    except ValueError:
        return await m.answer("Некорректная заявка на вывод.")
    u = m.from_user

    if ton + 1e-9 < WD_MIN_TON:
        return await m.answer(f"❌ Вывод доступен только для подарков от {WD_MIN_TON:g} TON.",
                              reply_markup=open_game_kb(wd_cancel=wd_id))
    if not access_until(u.id):
        kb = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(
            text=f"⭐ Пополнить {WD_ACCESS_STARS} Stars", url=f"https://t.me/{(await bot.me()).username}?start=pay_{WD_ACCESS_STARS}")],
            [InlineKeyboardButton(text="🎮 В игру", web_app=WebAppInfo(url=game_url(wd_cancel=wd_id)))]])
        return await m.answer(
            f"❌ Для вывода нужен доступ.\nПополни баланс от {WD_ACCESS_STARS} ⭐ — вывод подарков от {WD_MIN_TON:g} TON "
            f"откроется на {WD_ACCESS_DAYS} дн.", reply_markup=kb)

    with _db() as c:
        row = c.execute("SELECT num, status FROM wd_requests WHERE uid=? AND wd_id=?", (u.id, wd_id)).fetchone()
        if row:                                           # повторный клик по той же заявке — тот же номер
            return await m.answer(f"Твоя заявка на вывод уже принята: <b>#{row[0]}</b>.", parse_mode="HTML")
        cur = c.execute("INSERT INTO wd_requests(uid,username,first_name,gift,ton,wd_id,ts) VALUES(?,?,?,?,?,?,?)",
                        (u.id, u.username or "", u.first_name or "", gift, ton, wd_id, int(time.time())))
        num = cur.lastrowid

    await m.answer(f"✅ Заявка на вывод <b>#{num}</b> принята: «{html.escape(gift)}» ({ton:g} TON). Подарок будет отправлен в течение {WD_ACCESS_DAYS} дней.",
                   parse_mode="HTML")

    name = html.escape(u.first_name or "Игрок")
    uname = f"@{u.username}" if u.username else "без username"
    text = (f"🎁 <b>Новая заявка на вывод #{num}</b>\n\n"
            f"👤 Игрок: <a href=\"tg://user?id={u.id}\">{name}</a> ({uname})\n"
            f"🆔 ID: <code>{u.id}</code>\n"
            f"💎 Что выводит: «{html.escape(gift)}» на <b>{ton:g} TON</b>\n"
            f"📤 Как: отправить подарок игроку в Telegram (на его аккаунт {uname})\n"
            f"🔑 Доступ к выводу активен до: {time.strftime('%d.%m.%Y %H:%M', time.localtime(access_until(u.id)))}\n"
            f"📌 Статус: ожидает выполнения")
    kb = InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(text="✅ Выполнено", callback_data=f"wd:ok:{num}"),
        InlineKeyboardButton(text="❌ Отклонить", callback_data=f"wd:no:{num}")]])
    for admin in ADMIN_IDS:
        try:
            await bot.send_message(admin, text, parse_mode="HTML", reply_markup=kb)
        except Exception:
            pass                                          # админ ещё не нажимал /start у бота

@router.callback_query(F.data.startswith("wd:"))
async def admin_decision(cb: CallbackQuery, bot: Bot):
    if cb.from_user.id not in ADMIN_IDS:
        return await cb.answer("Нет доступа", show_alert=True)
    _, act, num = cb.data.split(":")
    with _db() as c:
        r = c.execute("SELECT uid, wd_id, status, ton FROM wd_requests WHERE num=?", (int(num),)).fetchone()
        if not r:
            return await cb.answer("Заявка не найдена", show_alert=True)
        uid, wd_id, status, ton = r
        if status != "pending":
            return await cb.answer(f"Уже обработана ({status})", show_alert=True)
        c.execute("UPDATE wd_requests SET status=? WHERE num=?", ("done" if act == "ok" else "rejected", int(num)))
    if act == "ok":
        await bot.send_message(uid, f"🎉 Заявка #{num} выполнена — подарок отправлен!", reply_markup=open_game_kb(wd_ok=wd_id))
        mark = "✅ ВЫПОЛНЕНО"
    else:
        await bot.send_message(uid, f"❌ Заявка #{num} отклонена. Подарок возвращён в инвентарь.", reply_markup=open_game_kb(wd_cancel=wd_id))
        mark = "❌ ОТКЛОНЕНО"
    await cb.message.edit_text(cb.message.html_text + f"\n\n{mark} — {html.escape(cb.from_user.first_name or '')}", parse_mode="HTML")
    await cb.answer("Готово")
