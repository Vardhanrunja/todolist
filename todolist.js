
/* ==========================================
   FinTrack — Todo & Expense Tracker v2
   ========================================== */
 
let todos = JSON.parse(localStorage.getItem("todos")) || [];
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
 
let currentTab = "todo";
 
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
function addTodo() {
  const text = document.getElementById("todo-input").value.trim();
  const date = document.getElementById("todo-date").value;
  const time = document.getElementById("todo-time").value;
  const notes = document.getElementById("todo-notes").value.trim();
 
  if (!text || !date || !time) {
    showToast("⚠️ Fill task name, date and time");
    return;
  }
 
  todos.push({ id: Date.now(), text, date, time, notes, done: false });
  saveTodos();
  renderTodos();
  showToast("✅ Task added");
 
  document.getElementById("todo-input").value = "";
  document.getElementById("todo-date").value = "";
  document.getElementById("todo-time").value = "";
  document.getElementById("todo-notes").value = "";
 
  renderSidePanel();
}
 
document.getElementById("todo-input").addEventListener("keydown", e => { if (e.key === "Enter") addTodo(); });
 
function toggleDone(id) {
  todos = todos.map(t => t.id === id ? { ...t, done: !t.done } : t);
  saveTodos();
  renderTodos();
  renderSidePanel();
}
 
function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  renderTodos();
  renderSidePanel();
  showToast("🗑️ Task removed");
}
 
function toggleTodoExpand(id) {
  const el = document.getElementById("todo-item-" + id);
  el.classList.toggle("expanded");
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
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(min).padStart(2,"0")} ${ampm}`;
}
 
function renderTodos() {
  const list = document.getElementById("todo-list");
  if (!todos.length) {
    list.innerHTML = `<div class="empty-state"><div class="icon">📋</div><p>No tasks yet. Add one above!</p></div>`;
    return;
  }
 
  // Sort: undone first, then by date
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
 
function saveTodos() { localStorage.setItem("todos", JSON.stringify(todos)); }
 
/* ========================================
   💰 EXPENSES — Folder System
   ======================================== */
function addExpense() {
  const name = document.getElementById("expense-name").value.trim();
  const amount = parseFloat(document.getElementById("expense-amount").value);
  const date = document.getElementById("expense-date").value;
  const comment = document.getElementById("expense-comment").value.trim();
 
  if (!name || !date || isNaN(amount) || amount <= 0) {
    showToast("⚠️ Enter valid expense details");
    return;
  }
 
  expenses.push({ id: Date.now(), name, amount, date, comment });
  saveExpenses();
  renderExpenses();
  showToast("💸 Expense added");
 
  document.getElementById("expense-name").value = "";
  document.getElementById("expense-amount").value = "";
  document.getElementById("expense-date").value = "";
  document.getElementById("expense-comment").value = "";
 
  renderSidePanel();
}
 
document.getElementById("expense-amount").addEventListener("keydown", e => { if (e.key === "Enter") addExpense(); });
 
function deleteExpense(id) {
  expenses = expenses.filter(e => e.id !== id);
  saveExpenses();
  renderExpenses();
  renderSidePanel();
  showToast("🗑️ Expense removed");
}
 
function toggleFolder(key) {
  const el = document.getElementById("folder-" + key);
  el.classList.toggle("open");
  const icon = el.querySelector(".folder-icon");
  icon.textContent = el.classList.contains("open") ? "📂" : "📁";
}
 
/* Group expenses by merchant name */
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
 
function renderExpenses(expList) {
  const list = document.getElementById("expense-list");
  const src = expList || expenses;
 
  if (!src.length) {
    list.innerHTML = `<div class="empty-state"><div class="icon">💸</div><p>No expenses yet. Add one above!</p></div>`;
    return;
  }
 
  const groups = groupExpenses(src);
  const sortedKeys = Object.keys(groups).sort((a, b) => groups[b].total - groups[a].total);
 
  list.innerHTML = sortedKeys.map(key => {
    const g = groups[key];
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
 
function saveExpenses() { localStorage.setItem("expenses", JSON.stringify(expenses)); }
 
/* ========================================
   📊 SIDE PANEL — Monthly Summary
   ======================================== */
function buildMonthOptions() {
  const select = document.getElementById("month-select");
  const now = new Date();
  const options = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    const label = d.toLocaleString("default", { month: "long", year: "numeric" });
    options.push(`<option value="${val}">${label}</option>`);
  }
  select.innerHTML = options.join("");
}
 
function renderSidePanel() {
  const [year, month] = document.getElementById("month-select").value.split("-").map(Number);
 
  if (currentTab === "todo") {
    document.getElementById("side-todo").style.display = "block";
    document.getElementById("side-expense-stats").style.display = "none";
    const monthTodos = todos.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth()+1 === month;
    });
    document.getElementById("side-todo-count").textContent = monthTodos.length;
    document.getElementById("side-todo-done").textContent = monthTodos.filter(t => t.done).length;
  } else {
    document.getElementById("side-todo").style.display = "none";
    document.getElementById("side-expense-stats").style.display = "block";
 
    const monthExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth()+1 === month;
    });
 
    const total = monthExpenses.reduce((s, e) => s + e.amount, 0);
    document.getElementById("side-total").textContent = "₹" + total.toLocaleString("en-IN");
    document.getElementById("side-count").textContent = monthExpenses.length;
    const merchants = new Set(monthExpenses.map(e => e.name.toLowerCase().trim()));
    document.getElementById("side-merchants").textContent = merchants.size;
 
    // Side folder list (grouped by merchant for that month)
    const groups = groupExpenses(monthExpenses);
    const sortedKeys = Object.keys(groups).sort((a, b) => groups[b].total - groups[a].total);
    const folderList = document.getElementById("side-folder-list");
 
    if (!sortedKeys.length) {
      folderList.innerHTML = `<p style="color:var(--muted);font-size:12px;text-align:center;padding:16px 0">No expenses this month</p>`;
      return;
    }
 
    folderList.innerHTML = sortedKeys.map(key => {
      const g = groups[key];
      const safeKey = "side_" + key.replace(/[^a-z0-9]/g, "_");
      const entries = [...g.entries].sort((a, b) => new Date(b.date) - new Date(a.date));
      return `
      <div class="month-folder" id="${safeKey}">
        <div class="mfolder-header" onclick="document.getElementById('${safeKey}').classList.toggle('open')">
          <span style="font-size:14px">📁</span>
          <span class="mfolder-name">${g.displayName}</span>
          <span class="mfolder-total">₹${g.total.toLocaleString('en-IN')}</span>
          <span class="mfolder-chevron">▼</span>
        </div>
        <div class="mfolder-body">
          ${entries.map(e => `
          <div class="mfolder-entry">
            <span class="mfolder-entry-date">${formatDate(e.date)}</span>
            <span class="mfolder-entry-amt">₹${e.amount.toLocaleString('en-IN')}</span>
          </div>`).join("")}
        </div>
      </div>`;
    }).join("");
  }
}
 
/* ─── Init ─── */
buildMonthOptions();
renderTodos();
renderExpenses();
renderSidePanel();