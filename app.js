const gift = (slug) => "https://fragment.com/file/gifts/" + slug + "/thumb.webp";
const CASES = [
  { id: "dust", name: "Пыль", price: 0.2, img: gift("toybear"), items: [["Мишка", 0.15, gift("toybear"), 70], ["Крошка", 0.04, gift("cookieheart"), 29.95], ["NFT Pepe", 4.5, gift("plushpepe"), 0.05]] },
  { id: "bear", name: "Мишка", price: 0.8, img: gift("toybear"), items: [["Toy Bear", 0.3, gift("toybear"), 80], ["Heart", 0.5, gift("cookieheart"), 19.92], ["NFT", 6, gift("trappedheart"), 0.08]] },
  { id: "pepe", name: "Pepe", price: 2.4, img: gift("plushpepe"), items: [["Plush Pepe", 1.2, gift("plushpepe"), 40], ["Bear", 0.4, gift("toybear"), 59.6], ["NFT Pepe", 9, gift("plushpepe"), 0.4]] },
  { id: "ice", name: "Ice Cream", price: 8, img: gift("icecream"), items: [["Ice Cream", 1.5, gift("icecream"), 35], ["Berry", 0.6, gift("berrybox"), 64.6], ["NFT Cap", 12, gift("durovscap"), 0.4]] }
];
const OWNER = 8920532333;
const ADMINS = [7064801154, 8866989412];
const API = location.origin;
let bal = 0.03;
let qty = 1;
let inv = [];
let board = [];
let me = { id: 0, name: "Игрок", photo: "" };
let mines = [];

function money(n) { return Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 }); }
function $(id) { return document.getElementById(id); }
function paint() { $("bal").textContent = money(bal); }

async function api(path, extra) {
  try {
    const res = await fetch(API + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: me.id, name: me.name, ...extra }) });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) { return null; }
}

function roll(items) {
  let hit = Math.random() * items.reduce((s, it) => s + it[3], 0);
  for (const it of items) { hit -= it[3]; if (hit <= 0) return it; }
  return items[0];
}

function tab(name) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("on"));
  $(name).classList.add("on");
  document.querySelectorAll("#dock button").forEach((b) => b.classList.toggle("on", b.dataset.tab === name));
  if (name === "home") renderHome();
  if (name === "cases") renderCases();
  if (name === "top") renderTop();
  if (name === "profile") renderProfile();
}

function renderHome() {
  $("home").innerHTML = `<div class="cards">
    <button class="banner" data-game="plinko"><img src="img/plinko.jpg" alt="Плинко" /><span>ПЛИНКО</span></button>
    <button class="banner" data-game="crash"><img src="img/crash.svg" alt="Краш" /><span>КРАШ</span></button>
    <button class="banner" data-game="mines"><img src="img/mines.svg" alt="Мины" /><span>МИНЫ</span></button>
  </div>`;
}

function renderCases() {
  $("cases").innerHTML = `<div class="grid">${CASES.map((c) => `<button class="case" data-case="${c.id}"><img src="${c.img}" alt="" /><div>${c.name}</div><div class="price">${money(c.price)} TON</div></button>`).join("")}</div>`;
}

function openCase(id) {
  const c = CASES.find((x) => x.id === id);
  $("modal").innerHTML = `<img src="${c.img}" width="88" height="88" alt="" /><h2>${c.name}</h2>
    <div class="muted">Шанс NFT настоящий и маленький.</div>
    ${c.items.map((it) => `<div class="row"><span>${it[0]}</span><b>${it[3]}%</b></div>`).join("")}
    <div class="qty">${[1,2,3,4,5].map((n) => `<button data-qty="${n}" class="${n === qty ? "on" : ""}">${n}</button>`).join("")}</div>
    <div class="reel"><i></i><div class="track" id="track"></div></div>
    <button class="go" id="spinBtn" data-spin="${id}">Открыть x${qty} · ${money(c.price * qty)} TON</button>
    <button class="ghost" data-demo="${id}">Демо версия</button>`;
  $("sheet").classList.add("on");
}

function spin(id, demo) {
  const c = CASES.find((x) => x.id === id);
  const count = demo ? 1 : qty;
  if (!demo && bal < c.price * count) { openPay(); return; }
  const prize = roll(c.items);
  const track = $("track");
  if (!track) return;
  const cells = Array.from({ length: 24 }, (_, i) => i === 18 ? prize : c.items[i % c.items.length]);
  track.style.transition = "none";
  track.style.transform = "translateX(0)";
  track.innerHTML = cells.map((it) => `<div class="cell"><img src="${it[2]}" alt="" /><span>${it[0]}</span></div>`).join("");
  requestAnimationFrame(() => {
    track.style.transition = "transform 2.6s cubic-bezier(.12,.75,.12,1)";
    track.style.transform = "translateX(-1420px)";
  });
  setTimeout(async () => {
    if (!demo) {
      bal = Math.round((bal - c.price * count) * 100) / 100;
      inv.push(prize[0]);
      board.push({ name: me.name, item: prize[0], ton: prize[1] });
      await api("/api/drop", { item: prize[0], ton: prize[1], spent: c.price * count });
    }
    paint();
    $("modal").insertAdjacentHTML("beforeend", `<p>${demo ? "Демо, награда не даётся" : "Выпало"}: ${prize[0]} · ${prize[1]} TON</p>`);
  }, 2700);
}

function openGame(name) {
  tab("game");
  const box = $("game");
  if (name === "plinko") {
    box.innerHTML = `<h2>Плинко</h2><img src="img/plinko.jpg" alt="Плинко" style="width:100%;height:150px;object-fit:cover;border-radius:16px" /><div class="pegs">${[1,2,3,4,5,6,7,8].map((n) => `<div>${"<i class='dot'></i>".repeat(n)}</div>`).join("")}</div><button class="go" id="plink">Бросить 0.10 TON</button><p id="plog" class="muted"></p>`;
  }
  if (name === "crash") {
    box.innerHTML = `<h2>Краш</h2><img src="img/crash.svg" alt="Краш" style="width:100%;height:150px;object-fit:cover;border-radius:16px" /><div class="card"><b id="ct">1.00x</b></div><input id="bet" placeholder="Сумма TON" /><button class="go" id="crashGo">Поставить</button><p id="cres" class="muted"></p>`;
  }
  if (name === "mines") {
    mines = Array.from({ length: 25 }, () => Math.random() < 0.2);
    box.innerHTML = `<h2>Мины</h2><img src="img/mines.svg" alt="Мины" style="width:100%;height:110px;object-fit:cover;border-radius:16px" /><div class="mine">${mines.map((_, i) => `<button data-mine="${i}"></button>`).join("")}</div>`;
  }
}

function renderTop() {
  const rows = board.slice().reverse();
  $("top").innerHTML = `<h2>Лидерборд</h2>` + (rows.length ? rows.map((r, i) => `<div class="row"><span>${i + 1}. ${r.name}</span><b>${r.item} · ${money(r.ton)} TON</b></div>`).join("") : `<div class="card">Пока пусто. Здесь только реальные открытия, без выдуманных ников.</div>`);
}

function renderProfile() {
  const staff = me.id === OWNER || ADMINS.includes(me.id);
  $("profile").innerHTML = `<div class="card"><img class="avatar" src="${me.photo}" alt="" /> <b>${me.name}</b><div class="muted">ID ${me.id}</div></div>
    <div class="card">Инвентарь: ${inv.length ? inv.join(", ") : "пусто"}</div>
    <button class="go" data-game="craft">Крафт</button>
    ${staff ? `<button class="ghost" id="adm">Админ-панель</button>` : ""}`;
}

function openPay() {
  $("modal").innerHTML = `<h2>Пополнение</h2><p>Баланс ${money(bal)} TON</p><div class="qty">${[1,5,10,25].map((n) => `<button data-add="${n}">${n}</button>`).join("")}</div>`;
  $("sheet").classList.add("on");
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("button");
  if (e.target.id === "sheet") $("sheet").classList.remove("on");
  if (!t) return;
  if (t.dataset.tab) tab(t.dataset.tab);
  if (t.dataset.game === "craft") {
    tab("game");
    $("game").innerHTML = `<h2>Крафт</h2><div class="card">${inv.length ? inv.join(", ") : "Инвентарь пуст. Откройте кейсы."}</div>`;
  } else if (t.dataset.game) openGame(t.dataset.game);
  if (t.dataset.case) openCase(t.dataset.case);
  if (t.dataset.qty) { qty = Number(t.dataset.qty); openCase($("spinBtn") ? $("spinBtn").dataset.spin : CASES[0].id); }
  if (t.dataset.spin) spin(t.dataset.spin, false);
  if (t.dataset.demo) spin(t.dataset.demo, true);
  if (t.dataset.add) { bal += Number(t.dataset.add); paint(); $("sheet").classList.remove("on"); }
  if (t.id === "payBtn") openPay();
  if (t.id === "plink") {
    if (bal < 0.1) return;
    bal -= 0.1; const m = [0.7, 1.3, 3, 13][Math.floor(Math.random() * 4)]; bal += 0.1 * m; paint();
    $("plog").textContent = "Выпало x" + m;
  }
  if (t.id === "crashGo") {
    const bet = Number($("bet").value || 0);
    if (bet <= 0 || bet > bal) return;
    bal -= bet; const x = 1 + Math.random() * 2; bal += bet * x * 0.4; paint();
    $("ct").textContent = x.toFixed(2) + "x";
  }
  if (t.dataset.mine != null) {
    const i = Number(t.dataset.mine);
    t.classList.add(mines[i] ? "bad" : "ok");
    t.textContent = mines[i] ? "мина" : "ок";
    if (!mines[i]) { bal += 0.02; paint(); }
  }
  if (t.id === "adm") {
    $("modal").innerHTML = `<h2>Админ</h2><p class="muted">${me.id === OWNER ? "Владелец может выдавать." : "Админ принимает заказ, но не выдаёт."}</p><div class="row"><span>Новых заказов нет</span></div>${me.id === OWNER ? `<button class="go" data-add="1">Выдать 1 TON</button>` : ""}`;
    $("sheet").classList.add("on");
  }
});

async function boot() {
  if (window.Telegram && Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
    const u = Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user;
    if (u) me = { id: u.id, name: u.first_name || u.username || "Игрок", photo: u.photo_url || "" };
  }
  $("nick").textContent = me.name;
  $("role").textContent = me.id === OWNER ? "владелец" : ADMINS.includes(me.id) ? "админ" : "игрок";
  $("ava").src = me.photo || "img/ton.svg";
  const state = await api("/api/state");
  if (state && state.feed) board = state.feed;
  if (state && state.user) bal = Number(state.user.ton || bal);
  renderHome();
  paint();
}
boot();
