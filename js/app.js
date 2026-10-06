const CASES = [
  { id: "dust", name: "Пыль", price: 0.2, image: "icons/case.jpg", note: "сомнительный дроп", nft: "0.05%" },
  { id: "bear", name: "Мишка", price: 0.8, image: "icons/bear.jpg", note: "в основном мишки", nft: "0.08%" },
  { id: "heart", name: "Сердца", price: 2.4, image: "icons/heart.jpg", note: "мишки и сердца", nft: "0.15%" },
  { id: "crown", name: "Корона", price: 8, image: "icons/crown.jpg", note: "подарки, не NFT", nft: "0.25%" },
  { id: "relic", name: "Реликт", price: 24, image: "icons/gem.jpg", note: "NFT почти не падает", nft: "0.40%" }
];
const API = location.origin;
let me = { id: 0, name: "Игрок" };
let qty = 1;
let state = { user: { ton: 0, items: [] }, feed: [], leaderboard: [], orders: [], role: "user" };

const money = (n) => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

function roll(demo, caseId) {
  const pool = demo
    ? [["Редкая мишка", 1.4, "icons/bear.jpg", 34], ["Сердце", 2.2, "icons/heart.jpg", 28], ["Корона", 4, "icons/crown.jpg", 22], ["Камень", 6, "icons/gem.jpg", 16]]
    : [["Наклейка", 0.02, "icons/case.jpg", 46], ["Крошка", 0.05, "icons/logo.jpg", 28], ["Мишка", 0.16, "icons/bear.jpg", 20], ["Сердце", 0.4, "icons/heart.jpg", 5], ["Корона", 1.1, "icons/crown.jpg", 0.9], ["NFT камень", 8, "icons/gem.jpg", caseId === "relic" ? 0.4 : 0.05]];
  const total = pool.reduce((s, row) => s + row[3], 0);
  let hit = Math.random() * total;
  for (const row of pool) {
    hit -= row[3];
    if (hit <= 0) return { name: row[0], ton: row[1], image: row[2] };
  }
  return { name: pool[0][0], ton: pool[0][1], image: pool[0][2] };
}

async function api(path, extra) {
  const res = await fetch(API + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: me.id, name: me.name, ...extra })
  });
  return res.json();
}

async function refresh() {
  const data = await api("/api/state");
  if (!data.ok) return;
  state = data;
  document.querySelectorAll("[data-bal]").forEach((el) => { el.textContent = money(state.user.ton); });
  document.getElementById("feed").innerHTML = (state.feed || []).map((row) => `<div class="row"><b>${row.name}</b> выбил ${row.item} · ${money(row.ton)} TON</div>`).join("") || "<div class='row'>Пока тихо</div>";
  document.getElementById("board").innerHTML = (state.leaderboard || []).map((row, i) => `<div class="row">${i + 1}. ${row.name} · ${money(row.won)} TON</div>`).join("") || "<div class='row'>Пусто</div>";
  const staff = state.role === "owner" || state.role === "admin";
  document.getElementById("admin").classList.toggle("hidden", !staff);
  document.getElementById("ownerBox").classList.toggle("hidden", state.role !== "owner");
  document.getElementById("orders").innerHTML = (state.orders || []).map((o) => `<div class="row">${o.name}: ${o.text} · ${o.status} ${staff && o.status === "new" ? `<button onclick="setOrder('${o.id}','accepted')">Принять</button> <button onclick="setOrder('${o.id}','rejected')">Отклонить</button>` : ""}</div>`).join("") || "<div class='row'>Заказов нет</div>";
}

function renderCases() {
  document.getElementById("cases").innerHTML = CASES.map((c) => `
    <article class="case">
      <img src="${c.image}" alt="" />
      <div>
        <h3>${c.name}</h3>
        <div class="muted">${c.note}<br>NFT на витрине ${c.nft}, почти не падает</div>
        <div class="ton">${money(c.price)} TON</div>
        <div class="qty">${[1,2,3,4,5].map((n) => `<button class="${qty === n ? "on" : ""}" onclick="setQty(${n})">${n}</button>`).join("")}</div>
        <button class="open" onclick="openCase('${c.id}', false)">Открыть x${qty}</button>
        <button class="demo" onclick="openCase('${c.id}', true)">Демо версия</button>
      </div>
    </article>`).join("");
}

function setQty(n) { qty = n; renderCases(); }

async function openCase(id, demo) {
  const found = CASES.find((c) => c.id === id);
  const count = demo ? 1 : qty;
  const cost = found.price * count;
  if (!demo && Number(state.user.ton) < cost) { openSheet(); return; }
  const drops = Array.from({ length: count }, () => roll(demo, id));
  if (!demo) {
    state.user.ton = Number(state.user.ton) - cost;
    state.user.items = state.user.items || [];
    drops.forEach((d) => state.user.items.push(d));
    state.user.won = Number(state.user.won || 0) + drops.reduce((s, d) => s + d.ton, 0);
    state.user.opens = Number(state.user.opens || 0) + count;
    await api("/api/drop", { item: drops.map((d) => d.name).join(", "), ton: drops.reduce((s, d) => s + d.ton, 0), spent: cost });
  }
  document.getElementById("winImg").src = drops[0].image;
  document.getElementById("winName").textContent = demo ? "Демо, награда не даётся" : drops.map((d) => d.name).join(", ");
  document.getElementById("winPrice").textContent = drops.map((d) => `${d.name} ${money(d.ton)} TON`).join(" · ");
  document.getElementById("win").classList.add("on");
  refresh();
}

function tab(name, btn) {
  document.querySelectorAll(".dock button").forEach((b) => b.classList.remove("on"));
  btn.classList.add("on");
  ["cases", "live", "admin"].forEach((id) => document.getElementById(id).classList.toggle("hidden", id !== name));
}
function openSheet() { document.getElementById("sheet").classList.add("on"); }
function closeSheet() { document.getElementById("sheet").classList.remove("on"); }
function closeWin() { document.getElementById("win").classList.remove("on"); }
async function makeOrder() {
  const text = document.getElementById("orderText").value || "Пополнить TON";
  await api("/api/order", { text });
  closeSheet();
  refresh();
}
async function setOrder(orderId, status) { await api("/api/order/status", { order_id: orderId, status }); refresh(); }
async function adminAct(action) {
  await api("/api/admin", { action, target: Number(document.getElementById("target").value), amount: Number(document.getElementById("amount").value), item: document.getElementById("itemName").value });
  refresh();
}
function boot() {
  const tg = window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user;
  me.id = tg ? tg.id : Number(localStorage.nexvenId || 0);
  me.name = tg ? tg.first_name : (localStorage.nexvenName || "Игрок");
  if (!me.id) {
    me.id = Number(prompt("Твой Telegram ID", "8920532333") || 0);
    me.name = prompt("Имя", "Игрок") || "Игрок";
    localStorage.nexvenId = me.id;
    localStorage.nexvenName = me.name;
  }
  renderCases();
  refresh();
  setInterval(refresh, 4000);
}
boot();
