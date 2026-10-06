const CASES = [
  { id: "dust", name: "Пыль", price: 0.2, image: "icons/case.jpg", chance: "мишка 18% · NFT 0.05%", note: "сомнительный дроп" },
  { id: "bear", name: "Мишка", price: 0.8, image: "icons/bear.jpg", chance: "мишка 55% · NFT 0.08%", note: "в основном мишки" },
  { id: "heart", name: "Сердца", price: 2.4, image: "icons/heart.jpg", chance: "сердце 30% · NFT 0.15%", note: "мишки и сердца" },
  { id: "crown", name: "Корона", price: 8, image: "icons/crown.jpg", chance: "корона 12% · NFT 0.25%", note: "подарки, не NFT" },
  { id: "relic", name: "Реликт", price: 24, image: "icons/gem.jpg", chance: "редкое 8% · NFT 0.40%", note: "NFT почти не падает" }
];
const OWNER = 8920532333;
const ADMINS = [7064801154, 8866989412];
let qty = 1;
let me = { id: 0, name: "Игрок" };
let db = { users: {}, feed: [], orders: [] };

function load() {
  try { db = JSON.parse(localStorage.nexvenDb || "") || db; } catch (e) { db = { users: {}, feed: [], orders: [] }; }
  db.users = db.users || {};
  db.feed = db.feed || [];
  db.orders = db.orders || [];
}
function save() { localStorage.nexvenDb = JSON.stringify(db); }
function user() {
  return db.users[me.id] || (db.users[me.id] = { name: me.name, ton: 0, won: 0, items: [] });
}
function role() {
  if (me.id === OWNER) return "owner";
  if (ADMINS.includes(me.id)) return "admin";
  return "user";
}
const money = (n) => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

function roll(id, demo) {
  const nft = id === "relic" ? 0.4 : id === "crown" ? 0.25 : id === "heart" ? 0.15 : id === "bear" ? 0.08 : 0.05;
  const pool = demo
    ? [["Редкая мишка", 1.6, "icons/bear.jpg", 40], ["Сердце", 2.4, "icons/heart.jpg", 30], ["Корона", 5, "icons/crown.jpg", 20], ["Камень", 8, "icons/gem.jpg", 10]]
    : [["Наклейка", 0.02, "icons/case.jpg", 42], ["Крошка", 0.05, "icons/logo.jpg", 24], ["Мишка", 0.18, "icons/bear.jpg", 26], ["Сердце", 0.45, "icons/heart.jpg", 6], ["Корона", 1.2, "icons/crown.jpg", 1.5], ["NFT камень", 9, "icons/gem.jpg", nft]];
  let hit = Math.random() * pool.reduce((s, row) => s + row[3], 0);
  for (const row of pool) {
    hit -= row[3];
    if (hit <= 0) return { name: row[0], ton: row[1], image: row[2] };
  }
  return { name: "Мишка", ton: 0.18, image: "icons/bear.jpg" };
}

function paint() {
  document.querySelectorAll("[data-bal]").forEach((el) => { el.textContent = money(user().ton); });
  document.getElementById("who").textContent = role() === "owner" ? "владелец" : role() === "admin" ? "админ" : "игрок";
  document.getElementById("ownerBox").classList.toggle("hidden", role() !== "owner");
  const rows = db.orders.filter((o) => role() !== "user" || o.user_id === me.id).slice(-20).reverse();
  document.getElementById("orders").innerHTML = rows.map((o) => `<div class="line">${o.name}: ${o.text} · ${o.status} ${role() !== "user" && o.status === "new" ? `<button onclick="setOrder('${o.id}','accepted')">Принять</button> <button onclick="setOrder('${o.id}','rejected')">Отклонить</button>` : ""}</div>`).join("") || "<div class='line'>Заказов нет</div>";
  const board = Object.entries(db.users).map(([id, rec]) => ({ id, name: rec.name, won: rec.won || 0 })).sort((a, b) => b.won - a.won).slice(0, 15);
  document.getElementById("board").innerHTML = board.map((row, i) => `<div class="line">${i + 1}. ${row.name} · ${money(row.won)} TON</div>`).join("") || "<div class='line'>Пока пусто</div>";
  document.getElementById("feed").innerHTML = db.feed.slice(0, 20).map((row) => `<div class="line">${row.name} · ${row.item} · ${money(row.ton)} TON</div>`).join("") || "<div class='line'>Пока тихо</div>";
}

function render() {
  document.getElementById("cases").innerHTML = CASES.map((c) => `
    <article class="case">
      <img src="${c.image}" alt="" />
      <div>
        <h3>${c.name}</h3>
        <div class="muted">${c.note}<br>${c.chance}</div>
        <div class="ton">${money(c.price)} TON</div>
        <div class="qty">${[1, 2, 3, 4, 5].map((n) => `<button class="${qty === n ? "on" : ""}" onclick="setQty(${n})">${n}</button>`).join("")}</div>
        <button class="open" onclick="openCase('${c.id}', false)">Открыть x${qty}</button>
        <button class="demo" onclick="openCase('${c.id}', true)">Демо версия</button>
      </div>
    </article>`).join("");
}

function setQty(n) { qty = n; render(); }
function openCase(id, demo) {
  const found = CASES.find((c) => c.id === id);
  const count = demo ? 1 : qty;
  const meUser = user();
  if (!demo && meUser.ton < found.price * count) { openSheet(); return; }
  const drops = Array.from({ length: count }, () => roll(id, demo));
  if (!demo) {
    meUser.ton = Math.round((meUser.ton - found.price * count) * 100) / 100;
    meUser.won = Math.round(((meUser.won || 0) + drops.reduce((s, d) => s + d.ton, 0)) * 100) / 100;
    meUser.items = meUser.items || [];
    drops.forEach((d) => meUser.items.push(d));
    db.feed.unshift({ name: me.name, item: drops.map((d) => d.name).join(", "), ton: drops.reduce((s, d) => s + d.ton, 0) });
    save();
  }
  document.getElementById("winImg").src = drops[0].image;
  document.getElementById("winName").textContent = demo ? "Демо, награда не даётся" : drops.map((d) => d.name).join(", ");
  document.getElementById("winPrice").textContent = drops.map((d) => `${d.name} · ${money(d.ton)} TON`).join(" · ");
  document.getElementById("win").classList.add("on");
  paint();
}
function tab(name, btn) {
  document.querySelectorAll(".dock button").forEach((b) => b.classList.remove("on"));
  btn.classList.add("on");
  ["cases", "live", "admin"].forEach((id) => document.getElementById(id).classList.toggle("hidden", id !== name));
  paint();
}
function openSheet() { document.getElementById("sheet").classList.add("on"); }
function closeSheet() { document.getElementById("sheet").classList.remove("on"); }
function closeWin() { document.getElementById("win").classList.remove("on"); }
function makeOrder() {
  db.orders.push({ id: "o" + Date.now(), user_id: me.id, name: me.name, text: document.getElementById("orderText").value || "Пополнить TON", status: "new" });
  save();
  closeSheet();
  paint();
}
function setOrder(id, status) {
  const order = db.orders.find((o) => o.id === id);
  if (order && role() !== "user") order.status = status;
  save();
  paint();
}
function adminAct(action) {
  if (role() !== "owner") return;
  const target = String(document.getElementById("target").value || "");
  const amount = Number(document.getElementById("amount").value || 0);
  const rec = db.users[target] || (db.users[target] = { name: target, ton: 0, won: 0, items: [] });
  if (action === "give_ton") rec.ton = Math.round((Number(rec.ton) + amount) * 100) / 100;
  if (action === "take_ton") rec.ton = Math.max(0, Math.round((Number(rec.ton) - amount) * 100) / 100);
  if (action === "give_item") rec.items.push({ name: document.getElementById("itemName").value || "Кейс", ton: amount });
  if (action === "clear_items") rec.items = [];
  save();
  paint();
}
load();
if (window.Telegram && Telegram.WebApp) {
  Telegram.WebApp.ready();
  Telegram.WebApp.expand();
  const tgUser = Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user;
  if (tgUser) { me = { id: tgUser.id, name: tgUser.first_name || "Игрок" }; }
}
if (!me.id) me = { id: OWNER, name: "Владелец" };
user().name = me.name;
save();
render();
paint();
