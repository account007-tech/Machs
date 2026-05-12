const STORAGE_KEY = "todos_v4";

const input = document.getElementById("enterCatcher");
const micBtn = document.getElementById("micBtn");
const refreshBtn = document.getElementById("refreshBtn");
const clearBtn = document.getElementById("clearBtn");
const container = document.getElementById("todoContainer");
const empty = document.getElementById("emptyState");
const status = document.getElementById("status");

let todos = loadTodos();
render();

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

if (isIOS) {
  micBtn.style.display = "none";
  setStatus("iPhone: Tastatur-Mikrofon verwenden.");
}

input.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;

  e.preventDefault();

  const text = input.value.trim();

  if (!text) return;

  addTodo(text);
  input.value = "";
});

refreshBtn.addEventListener("click", async () => {
  setStatus("Aktualisiere...");

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) await reg.update();
    }
  } catch {}

  location.reload();
});

clearBtn.addEventListener("click", () => {
  todos = [];
  saveTodos();
  render();
});

function addTodo(text) {
  todos.unshift({
    id: Date.now(),
    text
  });

  saveTodos();
  render();
}

function removeTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  render();
}

function render() {
  container.innerHTML = "";

  if (!todos.length) {
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  todos.forEach(todo => {
    const btn = document.createElement("button");
    btn.className = "todoBtn";
    btn.textContent = todo.text;

    btn.onclick = () => removeTodo(todo.id);

    container.appendChild(btn);
  });
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function loadTodos() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function setStatus(text) {
  status.textContent = text;
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}
