/* ==========================================
   FinTrack — Todo & Expense Tracker v3
   IndexedDB persistence (survives cache clear)
   ========================================== */

let todos = [];
let expenses = [];
let currentTab = "todo";
let dbReady = false;

/* ─── IndexedDB Setup ─── */
const DB_NAME = "fintrack_db";
const DB_VERSION = 1;
let db;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains("todos"))    d.createObjectStore("todos",    { keyPath: "id" });
      if (!d.objectStoreNames.contains("expenses")) d.createObjectStore("expenses", { keyPath: "id" });
    };
    req.onsuccess = e => { db = e.target.result; resolve(db); };
    req.onerror   = e => reject(e.target.error);
  });
}

function dbGetAll(store) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function dbPut(store, item) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(store, "readwrite");
    const req = tx.objectStore(store).put(item);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

function dbDelete(store, id) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(store, "readwrite");
    const req = tx.objectStore(store).delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

async function saveTodos()    { for (const t of todos)    await dbPut("todos", t); }
async function saveExpenses() { for (const e of expenses) await dbPut("expenses", e); }

/* ─── Tab Switch ─── */
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll(".tab-view").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".nav-tab").forEach(el => el.classList.remove("active"));
  document.getElementById("tab-" + tab).classList.add("active");
  document.querySelectorAll(".nav-tab")[tab === "todo" ? 0 : 1].classList.add("active");
  document.getElementById("side-todo").style.display = tab === "todo" ? "block" : "none";
  document.getElementById("side-expense-stats").style.display = tab === "expense" ? "block" : "none";
  renderSidePanel();
}

/* ─── Toast ─── */
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}

/* ========================================
   📝 TODO
   ======================================== */
async function addTodo() {
  const text  = document.getElementById("todo-input").value.trim();
  const date  = document.getElementById("todo-date").value;
  const time  = document.getElementById("todo-time").value;
  const notes = document.getElementById("todo-notes").value.trim();

  if (!text || !date || !time) { showToast("⚠️ Fill task name, date and time"); return; }

  const item = { id: Date.now(), text, date, time, notes, done: false };
  todos.push(item);
  await dbPut("todos", item);
  renderTodos();
  showToast("✅ Task added");

  document.getElementById("todo-input").value  = "";
  document.getElementById("todo-date").value   = "";
  document.getElementById("todo-time").value   = "";
  document.getElementById("todo-notes").value  = "";
  renderSidePanel();
}

document.getElementById("todo-input").addEventListener("keydown", e => { if (e.key === "Enter") addTodo(); });

async function toggleDone(id) {
  todos = todos.map(t => t.id === id ? { ...t, done: !t.done } : t);
  const updated = todos.find(t => t.id === id);
  await dbPut("todos", updated);
  renderTodos();
  renderSidePanel();
}

async function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  await dbDelete("todos", id);
  renderTodos();
  renderSidePanel();
  showToast("🗑️ Task removed");
}

function toggleTodoExpand(id) {
  document.getElementById("todo-item-" + id).classList.toggle("expanded");
}

function formatDate(d) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${day} ${months[parseInt(m)-1]} ${y}`;
}
function formatTime(t) {
  if (!t) return "";
  const [h, min] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(min).padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`;
}

function renderTodos() {
  const list = document.getElementById("todo-list");
  if (!todos.length) {
    list.innerHTML = `<div class="empty-state"><div class="icon">📋</div><p>No tasks yet. Add one above!</p></div>`;
    return;
  }
  const sorted = [...todos].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return new Date(a.date + "T" + a.time) - new Date(b.date + "T" + b.time);
  });
  list.innerHTML = sorted.map(todo => {
    const overdue = !todo.done && new Date(todo.date + "T" + todo.time) < new Date();
    return `
    <div class="todo-item" id="todo-item-${todo.id}">
      <div class="todo-header" onclick="toggleTodoExpand(${todo.id})">
        <div class="todo-check ${todo.done ? 'done' : ''}" onclick="event.stopPropagation(); toggleDone(${todo.id})"></div>
        <div class="todo-title ${todo.done ? 'done' : ''}">${todo.text}</div>
        ${overdue ? `<span class="todo-badge" style="color:#f87171;background:rgba(248,113,113,.1)">Overdue</span>` : ""}
        <span class="todo-badge">${formatDate(todo.date)}</span>
        <span class="todo-expand-icon">▼</span>
      </div>
      <div class="todo-details">
        <div class="detail-row">
          <div class="detail-chip">📅 Date <span>${formatDate(todo.date)}</span></div>
          <div class="detail-chip">🕐 Time <span>${formatTime(todo.time)}</span></div>
          <div class="detail-chip">Status <span style="color:${todo.done ? 'var(--accent)' : 'var(--warn)'}">${todo.done ? "Done ✓" : "Pending"}</span></div>
        </div>
        ${todo.notes ? `<div class="detail-chip" style="margin-bottom:10px">📝 Note: <span>${todo.notes}</span></div>` : ""}
        <div style="display:flex;gap:8px;margin-top:4px">
          <button class="btn btn-secondary btn-sm" onclick="toggleDone(${todo.id})">${todo.done ? "↩ Undo" : "✓ Mark Done"}</button>
          <button class="btn btn-danger btn-sm" onclick="deleteTodo(${todo.id})">🗑 Delete</button>
        </div>
      </div>
    </div>`;
  }).join("");
}

/* ========================================
   💰 EXPENSES — current month only, folders
   ======================================== */
function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
}

async function addExpense() {
  const name    = document.getElementById("expense-name").value.trim();
  const amount  = parseFloat(document.getElementById("expense-amount").value);
  const date    = document.getElementById("expense-date").value;
  const comment = document.getElementById("expense-comment").value.trim();

  if (!name || !date || isNaN(amount) || amount <= 0) { showToast("⚠️ Enter valid expense details"); return; }

  const item = { id: Date.now(), name, amount, date, comment };
  expenses.push(item);
  await dbPut("expenses", item);
  renderExpenses();
  showToast("💸 Expense added");

  document.getElementById("expense-name").value    = "";
  document.getElementById("expense-amount").value  = "";
  document.getElementById("expense-date").value    = "";
  document.getElementById("expense-comment").value = "";
  renderSidePanel();
}

document.getElementById("expense-amount").addEventListener("keydown", e => { if (e.key === "Enter") addExpense(); });

async function deleteExpense(id) {
  expenses = expenses.filter(e => e.id !== id);
  await dbDelete("expenses", id);
  renderExpenses();
  renderSidePanel();
  showToast("🗑️ Expense removed");
}

function toggleFolder(key) {
  const el   = document.getElementById("folder-" + key);
  el.classList.toggle("open");
  const icon = el.querySelector(".folder-icon");
  icon.textContent = el.classList.contains("open") ? "📂" : "📁";
}

function groupExpenses(expList) {
  const groups = {};
  expList.forEach(exp => {
    const key = exp.name.toLowerCase().trim();
    if (!groups[key]) groups[key] = { displayName: exp.name, entries: [], total: 0 };
    groups[key].entries.push(exp);
    groups[key].total += exp.amount;
  });
  return groups;
}

/* Main expense list: shows ONLY the selected month's expenses */
function renderExpenses() {
  const list = document.getElementById("expense-list");

  // Get the month currently selected in the side-panel dropdown
  const selVal   = document.getElementById("month-select").value;
  const [yr, mo] = selVal ? selVal.split("-").map(Number) : [new Date().getFullYear(), new Date().getMonth()+1];

  const monthExp = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === yr && d.getMonth()+1 === mo;
  });

  // Update the month label above the list
  const labelEl = document.getElementById("expense-month-label");
  if (labelEl) {
    const d = new Date(yr, mo-1, 1);
    labelEl.textContent = d.toLocaleString("default", { month: "long", year: "numeric" });
  }

  if (!monthExp.length) {
    list.innerHTML = `<div class="empty-state"><div class="icon">💸</div><p>No expenses for this month.</p></div>`;
    return;
  }

  const groups     = groupExpenses(monthExp);
  const sortedKeys = Object.keys(groups).sort((a, b) => groups[b].total - groups[a].total);

  list.innerHTML = sortedKeys.map(key => {
    const g       = groups[key];
    const safeKey = key.replace(/[^a-z0-9]/g, "_");
    const entries = [...g.entries].sort((a, b) => new Date(b.date) - new Date(a.date));
    return `
    <div class="expense-folder" id="folder-${safeKey}">
      <div class="folder-header" onclick="toggleFolder('${safeKey}')">
        <span class="folder-icon closed">📁</span>
        <span class="folder-name">${g.displayName}</span>
        <span class="folder-count">${entries.length}x</span>
        <span class="folder-total">₹${g.total.toLocaleString('en-IN')}</span>
        <span class="folder-chevron">▼</span>
      </div>
      <div class="folder-body">
        ${entries.map(exp => `
        <div class="expense-entry">
          <div class="entry-info">
            <div class="entry-date">${formatDate(exp.date)}</div>
            ${exp.comment ? `<div class="entry-comment">${exp.comment}</div>` : ""}
          </div>
          <div class="entry-amount">₹${exp.amount.toLocaleString('en-IN')}</div>
          <button class="btn btn-danger btn-sm" onclick="deleteExpense(${exp.id})" style="margin-left:8px">✕</button>
        </div>`).join("")}
      </div>
    </div>`;
  }).join("");
}

/* ========================================
   📊 SIDE PANEL — Monthly Summary
   ======================================== */
function buildMonthOptions() {
  const select = document.getElementById("month-select");
  const now    = new Date();
  const opts   = [];
  for (let i = 0; i < 12; i++) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    const lbl = d.toLocaleString("default", { month: "long", year: "numeric" });
    opts.push(`<option value="${val}">${lbl}</option>`);
  }
  select.innerHTML = opts.join("");
}

function renderSidePanel() {
  const [year, month] = document.getElementById("month-select").value.split("-").map(Number);

  if (currentTab === "todo") {
    document.getElementById("side-todo").style.display          = "block";
    document.getElementById("side-expense-stats").style.display = "none";
    const mt = todos.filter(t => { const d = new Date(t.date); return d.getFullYear()===year && d.getMonth()+1===month; });
    document.getElementById("side-todo-count").textContent = mt.length;
    document.getElementById("side-todo-done").textContent  = mt.filter(t => t.done).length;
  } else {
    document.getElementById("side-todo").style.display          = "none";
    document.getElementById("side-expense-stats").style.display = "block";

    const me    = expenses.filter(e => { const d = new Date(e.date); return d.getFullYear()===year && d.getMonth()+1===month; });
    const total = me.reduce((s, e) => s + e.amount, 0);
    document.getElementById("side-total").textContent     = "₹" + total.toLocaleString("en-IN");
    document.getElementById("side-count").textContent     = me.length;
    const merchants = new Set(me.map(e => e.name.toLowerCase().trim()));
    document.getElementById("side-merchants").textContent = merchants.size;

    /* Side panel: flat merchant list — name + total only, no expand */
    const groups     = groupExpenses(me);
    const sortedKeys = Object.keys(groups).sort((a, b) => groups[b].total - groups[a].total);
    const folderList = document.getElementById("side-folder-list");

    if (!sortedKeys.length) {
      folderList.innerHTML = `<p style="color:var(--muted);font-size:12px;text-align:center;padding:16px 0">No expenses this month</p>`;
    } else {
      folderList.innerHTML = sortedKeys.map(key => {
        const g = groups[key];
        return `
        <div class="side-merchant-row">
          <span class="side-merchant-name">📁 ${g.displayName}</span>
          <span class="side-merchant-amt">₹${g.total.toLocaleString('en-IN')}</span>
        </div>`;
      }).join("");
    }

    // Also re-render main expense list when month changes
    renderExpenses();
  }
}

/* ─── Init ─── */
async function init() {
  await openDB();

  // Migrate old localStorage data if present (one-time)
  const oldTodos    = localStorage.getItem("todos");
  const oldExpenses = localStorage.getItem("expenses");
  if (oldTodos) {
    const parsed = JSON.parse(oldTodos);
    for (const t of parsed) await dbPut("todos", t);
    localStorage.removeItem("todos");
  }
  if (oldExpenses) {
    const parsed = JSON.parse(oldExpenses);
    for (const e of parsed) await dbPut("expenses", e);
    localStorage.removeItem("expenses");
  }

  todos    = await dbGetAll("todos");
  expenses = await dbGetAll("expenses");

  buildMonthOptions();
  renderTodos();
  renderExpenses();
  renderSidePanel();
}

init();
