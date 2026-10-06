const gift = (slug) => "https://fragment.com/file/gifts/" + slug + "/thumb.webp";
const CASES = [
  { id: "dust", name: "Пыль", price: 0.2, img: gift("toybear"), desc: "сомнительный дроп", items: [["Мишка", 0.15, 70], ["Крошка", 0.04, 29.95], ["NFT Pepe", 4.5, 0.05]] },
  { id: "bear", name: "Мишка", price: 0.8, img: gift("toybear"), desc: "в основном мишки", items: [["Toy Bear", 0.3, 80], ["Cookie Heart", 0.5, 19.92], ["NFT Heart", 6, 0.08]] },
  { id: "pepe", name: "Pepe", price: 2.4, img: gift("plushpepe"), desc: "редкие мишки", items: [["Plush Pepe", 1.2, 40], ["Toy Bear", 0.4, 59.6], ["NFT Pepe", 9, 0.4]] },
  { id: "ice", name: "Ice Cream", price: 8, img: gift("icecream"), desc: "NFT почти не падает", items: [["Ice Cream", 1.5, 35], ["Berry Box", 0.6, 64.6], ["NFT Cap", 12, 0.4]] }
];
const OWNER = 8920532333;
const ADMINS = [7064801154, 8866989412];
let bal = 0.03;
let qty = 1;
let me = { id: OWNER, name: "Nexven" };
let inv = [];
let mines = [];
if (window.Telegram && Telegram.WebApp) {
  Telegram.WebApp.ready();
  Telegram.WebApp.expand();
  const u = Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user;
  if (u) me = { id: u.id, name: u.first_name || "Игрок" };
}
const money = (n) => Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });
function paintBal() { document.getElementById("bal").textContent = money(bal); }
function tab(name, btn) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("on"));
  document.getElementById(name).classList.add("on");
  document.querySelectorAll(".dock button").forEach((b) => b.classList.remove("on"));
  if (btn) btn.classList.add("on");
  if (name === "home") renderHome();
  if (name === "cases") renderCases();
  if (name === "top") renderTop();
  if (name === "profile") renderProfile();
}
function renderHome() {
  document.getElementById("home").innerHTML = `
    <div class="banner" onclick="openGame('plinko')"><img src="img/slots.jpg" alt="" /><b>ИГРЫ</b></div>
    <div class="banner" onclick="openGame('plinko')"><img src="img/plinko.jpg" alt="" /><b>ПЛИНКО</b></div>
    <div class="card" onclick="openGame('crash')"><b>КРАШ</b><div class="muted">Раунд в TON</div></div>
    <div class="card" onclick="openGame('mines')"><b>МИНЫ</b><div class="muted">5 на 5, шаги x1.09–x2.98</div></div>`;
}
function renderCases() {
  document.getElementById("cases").innerHTML = `<div class="grid">${CASES.map((c) => `
    <article class="case" onclick="openCase('${c.id}')">
      <img src="${c.img}" alt="${c.name}" />
      <h3>${c.name}</h3>
      <div class="muted">${c.desc}</div>
      <div class="price">${money(c.price)} TON</div>
    </article>`).join("")}</div>`;
}
function openCase(id) {
  const c = CASES.find((x) => x.id === id);
  document.getElementById("modal").innerHTML = `
    <img src="${c.img}" alt="" style="width:160px;height:160px;object-fit:contain;display:block;margin:0 auto" />
    <h2>${c.name}</h2>
    <div class="muted">${c.desc}. NFT шанс настоящий и маленький.</div>
    ${c.items.map((it) => `<div class="row"><span>${it[0]}</span><b>${it[2]}%</b></div>`).join("")}
    <div class="qty">${[1,2,3,4,5].map((n) => `<button class="${n===qty?"on":""}" onclick="setQty(${n},'${id}')">${n}</button>`).join("")}</div>
    <button class="go" onclick="spin('${id}', false)">Открыть x${qty} · ${money(c.price*qty)} TON</button>
    <button class="demo" onclick="spin('${id}', true)">Демо версия</button>`;
  document.getElementById("sheet").classList.add("on");
}
function setQty(n, id) { qty = n; openCase(id); }
function spin(id, demo) {
  const c = CASES.find((x) => x.id === id);
  const count = demo ? 1 : qty;
  if (!demo && bal < c.price * count) return;
  if (!demo) bal -= c.price * count;
  const drops = Array.from({ length: count }, () => {
    let hit = Math.random() * c.items.reduce((s, it) => s + it[2], 0);
    for (const it of c.items) { hit -= it[2]; if (hit <= 0) return it; }
    return c.items[0];
  });
  if (!demo) drops.forEach((d) => inv.push(d[0]));
  paintBal();
  document.getElementById("modal").innerHTML = `<h2>${demo ? "Демо, награда не даётся" : "Дроп"}</h2><p>${drops.map((d) => d[0] + " · " + d[1] + " TON").join("<br>")}</p><button class="go" onclick="closePay()">Ок</button>`;
}
function openGame(name) {
  tab("game");
  const box = document.getElementById("game");
  if (name === "plinko") {
    const rows = [1,2,3,4,5,6,7,8].map((n) => `<div>${"<i class='peg'></i>".repeat(n)}</div>`).join("");
    box.innerHTML = `<h2>Плинко</h2><div class="pegs">${rows}</div><div class="mults"><span>13x</span><span class="o">3x</span><span class="y">1.3x</span><span class="y">0.7x</span><span class="o">1.3x</span><span>13x</span></div><div class="risks"><button class="go" onclick="playPlinko()">Бросить 0.10 TON</button></div><p id="plog" class="muted"></p>`;
  }
  if (name === "mines") {
    mines = Array.from({ length: 25 }, () => Math.random() < 0.2);
    box.innerHTML = `<h2>Мины</h2><div class="mine">${mines.map((_, i) => `<button onclick="hitMine(${i}, this)"></button>`).join("")}</div><div class="steps"><button>x1.09</button><button>x1.37</button><button>x1.76</button><button>x2.27</button><button>x2.98</button></div>`;
  }
  if (name === "crash") {
    box.innerHTML = `<h2>Краш</h2><div class="crash"><b id="ct">0.00s</b><div class="muted">Раунд через</div></div><input id="bet" placeholder="Сумма TON" /><button class="go" onclick="playCrash()">Поставить</button><p id="cres" class="muted"></p>`;
  }
  if (name === "craft") {
    box.innerHTML = `<h2>Крафт</h2><div class="card">Выберите предметы</div><div class="card">${inv.length ? inv.map((x) => `<div class="row">${x}</div>`).join("") : "Инвентарь пуст. Откройте кейсы."}</div><button class="go" onclick="craft()">Скрафтить выбранное</button>`;
  }
}
function playPlinko() {
  if (bal < 0.1) return;
  bal -= 0.1;
  const m = [0.7,1.3,3,13][Math.floor(Math.random()*4)];
  bal += 0.1 * m;
  paintBal();
  document.getElementById("plog").textContent = "Выпало x" + m;
}
function hitMine(i, el) {
  if (mines[i]) { el.classList.add("bad"); el.textContent = "x"; }
  else { el.classList.add("ok"); el.textContent = "•"; bal += 0.02; paintBal(); }
}
function playCrash() {
  const bet = Number(document.getElementById("bet").value || 0);
  if (bet <= 0 || bet > bal) return;
  bal -= bet;
  const x = (1 + Math.random() * 3).toFixed(2);
  bal += bet * Number(x) * 0.5;
  paintBal();
  document.getElementById("cres").textContent = "Коэффициент " + x;
}
function craft() {
  if (inv.length < 2) return;
  inv.splice(0, 2);
  inv.push("Скрафченный мишка");
  openGame("craft");
}
function renderTop() {
  const rows = [["stone_islonde", 311.58], ["chipppsss", 281.73], ["saikokiro", 195.53], ["dmsiy", 150.36], [me.name, bal]];
  document.getElementById("top").innerHTML = `<h2>Лидерборд</h2>` + rows.sort((a,b)=>b[1]-a[1]).map((r,i)=>`<div class="lb"><b>${i+1}</b><span>${r[0]}</span><b>${money(r[1])} TON</b></div>`).join("");
}
function renderProfile() {
  const staff = me.id === OWNER || ADMINS.includes(me.id);
  document.getElementById("profile").innerHTML = `
    <div class="grid"><div class="card">Инвентарь</div><div class="card">Промокод</div><div class="card">История</div><div class="card" onclick="openGame('craft')">Крафт</div></div>
    <div class="ref"><b>Приглашай друзей — зарабатывай TON</b><div class="muted">10% от пополнения приглашённых</div></div>
    <div class="card">${inv.length ? inv.join(", ") : "Инвентарь пуст. Откройте кейсы."}</div>
    ${staff ? `<button class="go" onclick="admin()">Админ-панель</button>` : ""}`;
}
function admin() {
  const owner = me.id === OWNER;
  document.getElementById("modal").innerHTML = `<h2>Админ</h2><p class="muted">${owner ? "Владелец может выдавать и забирать." : "Админ принимает заказ, но не выдаёт."}</p><div class="row"><span>Заказ на 1.50 TON</span><button onclick="this.textContent='Принят'">Принять</button></div>${owner ? `<button class="go" onclick="bal+=1;paintBal();closePay()">Выдать 1 TON себе</button>` : ""}`;
  document.getElementById("sheet").classList.add("on");
}
function openPay() {
  document.getElementById("modal").innerHTML = `<h2>Пополнение</h2><p>Баланс ${money(bal)} TON</p><div class="qty">${[1,5,10,25].map((n)=>`<button onclick="add(${n})">${n}</button>`).join("")}</div>`;
  document.getElementById("sheet").classList.add("on");
}
function add(n) { bal += n; paintBal(); closePay(); }
function closePay() { document.getElementById("sheet").classList.remove("on"); }
renderHome();
paintBal();
