/* =======================
   📝 TODO LIST
======================= */

let todos = JSON.parse(localStorage.getItem("todos")) || [];

const todoInput = document.getElementById("todo-input");
const todoDate = document.getElementById("todo-date");
const todoTime = document.getElementById("todo-time");
const addBtn = document.getElementById("add-btn");
const todoList = document.getElementById("todo-list");

// Render todos
function renderTodos() {
  todoList.innerHTML = "";

  todos.forEach((todo, index) => {
    const li = document.createElement("li");
    li.textContent = `${todo.text} (Due: ${todo.date} ${todo.time})`;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.onclick = () => deleteTodo(index);

    li.appendChild(delBtn);
    todoList.appendChild(li);
  });
}

// Add todo
function addTodo() {
  const text = todoInput.value.trim();
  const date = todoDate.value;
  const time = todoTime.value;

  if (text === "" || date === "" || time === "") {
    alert("Fill all todo fields");
    return;
  }

  todos.push({ text, date, time });
  saveTodos();
  renderTodos();

  todoInput.value = "";
  todoDate.value = "";
  todoTime.value = "";
}

// Button click
addBtn.addEventListener("click", addTodo);

// Enter key support
todoInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTodo();
});

// Delete
function deleteTodo(index) {
  todos.splice(index, 1);
  saveTodos();
  renderTodos();
}

// Save
function saveTodos() {
  localStorage.setItem("todos", JSON.stringify(todos));
}

// Initial load
renderTodos();


/* =======================
   💰 EXPENSE TRACKER
======================= */

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

const expName = document.getElementById("expense-name");
const expAmount = document.getElementById("expense-amount");
const expDate = document.getElementById("expense-date");
const expComment = document.getElementById("expense-comment");

const addExpenseBtn = document.getElementById("add-expense-btn");
const calculateBtn = document.getElementById("calculate-btn");
const expenseList = document.getElementById("expense-list");
const totalAmount = document.getElementById("total-amount");

// Render expenses
function renderExpenses() {
  expenseList.innerHTML = "";

  expenses.forEach((exp, index) => {
    const li = document.createElement("li");

    let text = `${exp.name} - ₹${exp.amount} (Date: ${exp.date})`;

    // Show comment only if exists
    if (exp.comment && exp.comment.trim() !== "") {
      text += ` | Note: ${exp.comment}`;
    }

    li.textContent = text;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.onclick = () => deleteExpense(index);

    li.appendChild(delBtn);
    expenseList.appendChild(li);
  });
}

// Add expense
function addExpense() {
  const name = expName.value.trim();
  const amount = expAmount.value;
  const date = expDate.value;
  const comment = expComment.value.trim();

  if (name === "" || amount === "" || date === "" || amount <= 0) {
    alert("Enter valid expense details");
    return;
  }

  expenses.push({
    name: name,
    amount: Number(amount),
    date: date,
    comment: comment
  });

  saveExpenses();
  renderExpenses();
  updateTotal();

  expName.value = "";
  expAmount.value = "";
  expDate.value = "";
  expComment.value = "";
}

// Button click
addExpenseBtn.addEventListener("click", addExpense);

// Enter key support
expAmount.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addExpense();
});

// Delete
function deleteExpense(index) {
  expenses.splice(index, 1);
  saveExpenses();
  renderExpenses();
  updateTotal();
}

// Calculate total
function updateTotal() {
  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  totalAmount.textContent = total;
}

// Button
calculateBtn.addEventListener("click", updateTotal);

// Save
function saveExpenses() {
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

// Initial load
renderExpenses();
updateTotal();