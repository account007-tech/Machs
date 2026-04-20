/* Speech-ToDo: Web Speech API + localStorage + PWA Service Worker */

const STORAGE_KEY = "speech_todo_items_v1";

const enterCatcher = document.getElementById("enterCatcher");
const micBtn = document.getElementById("micBtn");
const clearBtn = document.getElementById("clearBtn");
const todoContainer = document.getElementById("todoContainer");
const emptyState = document.getElementById("emptyState");
const statusEl = document.getElementById("status");
const refreshBtn = document.getElementById("refreshBtn");

let todos = loadTodos();
render();

// ---- Spracherkennung (Web Speech API) ----
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const supported = !!SpeechRecognition;

let recognition = null;
let isRecording = false;

if (supported) {
  recognition = new SpeechRecognition();
  recognition.lang = "de-CH";            // du kannst auch "de-DE" oder "de-AT" nehmen
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.continuous = false;

  recognition.onstart = () => setRecording(true, "Sprich jetzt…");
  recognition.onend = () => setRecording(false, "Bereit.");
  recognition.onerror = (e) => {
    setRecording(false, `Fehler: ${e.error}`);
  };
  recognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript?.trim() || "";
    if (transcript) addTodo(transcript);
  };
} else {
  setStatus("Dein Browser unterstützt keine Spracherkennung. Nutze z.B. Chrome/Edge.");
}

// Enter → Start Aufnahme
enterCatcher.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    startListening();
  }
});


refreshBtn.addEventListener("click", async () => {
  setStatus("Aktualisiere vom Server…");

  // 1) Falls Service Worker existiert: Update anstoßen
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) await reg.update();
    } catch {}
  }

  // 2) Einmal "hart" vom Server holen (Cache umgehen), dann reload
  //    (Funktioniert nur, wenn online – sonst bleibt Offline-Version.)
  try {
    const url = new URL("./", window.location.href).toString();
    await fetch(url, { cache: "reload" });
    setStatus("Neu geladen.");
    window.location.reload();
  } catch {
    setStatus("Offline oder Server nicht erreichbar – lade lokale Version.");
    window.location.reload();
  }
});



// Button → Start Aufnahme
micBtn.addEventListener("click", () => startListening());

// Alles löschen
clearBtn.addEventListener("click", () => {
  todos = [];
  saveTodos();
  render();
});

// Auf Mobile: Fokus freundlich halten
window.addEventListener("load", () => {
  // Versuche den Fokus zu setzen (kann je nach Browser/Policy eingeschränkt sein)
  enterCatcher.focus();
});

// ---- Funktionen ----
function startListening() {
  if (!supported) return;

  // Browser verlangen oft eine User-Geste: Enter oder Button ist ok.
  // Wenn schon aktiv: stoppen
  if (isRecording) {
    recognition.stop();
    return;
  }

  try {
    recognition.start();
  } catch (err) {
    // manche Browser werfen, wenn start() zu schnell hintereinander kommt
    setStatus("Konnte nicht starten. Versuch’s nochmal.");
  }
}

function addTodo(text) {
  const item = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(),
    text,
    createdAt: Date.now()
  };
  todos.unshift(item);
  saveTodos();
  render();
}

function removeTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  render();
}

function render() {
  todoContainer.innerHTML = "";

  if (todos.length === 0) {
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";

  for (const t of todos) {
    const btn = document.createElement("button");
    btn.className = "todoBtn";
    btn.type = "button";
    btn.title = "Tippen = erledigt";

    const dot = document.createElement("span");
    dot.className = "dot";

    const label = document.createElement("span");
    label.textContent = t.text;

    btn.appendChild(dot);
    btn.appendChild(label);

    btn.addEventListener("click", () => removeTodo(t.id));
    todoContainer.appendChild(btn);
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setRecording(on, msg) {
  isRecording = on;
  micBtn.classList.toggle("recording", on);
  micBtn.textContent = on ? "⏺️ Aufnahme…" : "🎙️ Sprechen";
  setStatus(msg);
}

function setStatus(msg) {
  statusEl.textContent = msg;
}

// ---- Service Worker für PWA Offline ----
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./sw.js");
    } catch (e) {
      // optional: status anzeigen
    }
  });
}
