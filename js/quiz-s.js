// ========= Data =========
const QUESTIONS = {
  soft: [
    "Was war euer erstes gemeinsames Lachen heute?",
    "Welche kleine Geste lässt dich dich sofort wohl fühlen?",
    "Welches Kompliment hörst du gerne – und warum?",
    "Dein perfekter 10-Minuten-Date-Moment?",
    "Welche Berührung wirkt für dich beruhigend?",
    "Was hat dich zuletzt positiv überrascht an mir?",
    "Welcher Song erzeugt bei dir sofort Cozy-Vibes?",
    "Kaffee im Bett oder Spaziergang bei Nacht?",
    "Welche Farbe fühlst du heute – und weshalb?",
    "Beschreibe unseren Vibe in drei Wörtern."
  ],
  hot: [
    "Welcher Kussstil macht dich schwach auf den Knien?",
    "Was ist für dich der perfekte Tease (ohne es auszuführen)?",
    "Welche Stelle magst du, wenn sie langsam erkundet wird?",
    "Sanft & langsam oder frech & spielerisch?",
    "Was wäre ein spannender Ort für einen Kuss?",
    "Welches Outfit triggert deinen Flirt-Modus?",
    "Was ist deine Lieblings-Art, „Ich will dich“ nonverbal zu zeigen?",
    "Was macht dich emotional „heiss“ an mir?",
    "Zu welcher Uhrzeit bist du am flirtesten?",
    "Flüstern am Ohr oder Blickkontakt aus 5 cm?"
  ],
  hard: [
    "Sag mir ein geheimes Turn-On (ohne zu explizit zu werden).",
    "Was war dein schönstes Vorspiel-Element bisher?",
    "Welche 3-Minuten-Routine pusht dich in die richtige Stimmung?",
    "Welche Grenzen sind dir wichtig – klar & kurz?",
    "Was ist deine Lieblings-Dynamik: führen oder geführt werden?",
    "Wie lange darf ein Tease gehen, bis du schwach wirst?",
    "Was ist ein „No-Go“, das wir nie überschreiten?",
    "Welcher Duft killt / steigert sofort die Stimmung bei dir?",
    "Was würdest du heute ausprobieren (PG-13-Beschreibung)?",
    "Beschreibe deinen perfekten Rhythmus mit einem Vergleich."
  ],
  extreem: [
    "Nenne ein Fantasie-Setting in 2 Sätzen (ohne Details, PG-13).",
    "Was ist für dich „zu schnell“ – und was „genau richtig“?",
    "Welche klare Safeword-Regel willst du setzen?",
    "Ein Tabu, das absolut tabu bleibt (klar formulieren).",
    "Was macht dich mental am meisten an (metaphorisch beschreiben)?",
    "Gib mir eine Challenge für später (nur Andeutung, kein Detail).",
    "Was ist dein „Power-Move“ beim Flirten?",
    "Wie signalisierst du „mehr“ vs. „langsamer“ – nonverbal?",
    "Ein Song/Tempo, das die Spannung perfekt hält?",
    "Worauf freust du dich nach dem Quiz am meisten?"
  ]
};

// ========= State =========
let state = {
  level: "soft",
  a: { name: "A", i: 0, order: [] },
  b: { name: "B", i: 0, order: [] },
  turn: "a",         // 'a' or 'b'
  totalPerPlayer: 10
};

// ========= Helpers =========
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

function shuffle(arr){
  const a = [...arr];
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function setLevel(lvl){
  state.level = lvl;
  $("#levelBadge").textContent = displayLevel(lvl);
  $$(".chip").forEach(c=>{
    c.classList.toggle("active", c.dataset.level===lvl);
    c.setAttribute("aria-selected", c.dataset.level===lvl ? "true" : "false");
  });
}

function displayLevel(k){
  if(k==="soft") return "Soft";
  if(k==="hot") return "Hot";
  if(k==="hard") return "Hard";
  return "Extreem";
}

function updateProgress(){
  $("#pnameA").textContent = state.a.name;
  $("#pnameB").textContent = state.b.name;
  $("#pcountA").textContent = state.a.i;
  $("#pcountB").textContent = state.b.i;
  $("#pbarA").style.width = `${(state.a.i/state.totalPerPlayer)*100}%`;
  $("#pbarB").style.width = `${(state.b.i/state.totalPerPlayer)*100}%`;
}

// Get next question text for player key ('a'|'b')
function nextQ(forKey){
  const pool = QUESTIONS[state.level];
  const bundle = state[forKey];
  if(bundle.order.length === 0){
    // Pre-shuffle once, then slice only as needed
    bundle.order = shuffle(pool);
  }
  const idx = bundle.i % bundle.order.length;
  return bundle.order[idx];
}

function bothDone(){
  return state.a.i >= state.totalPerPlayer && state.b.i >= state.totalPerPlayer;
}

// ========= UI Flow =========
function showSetup(){
  $("#setup").classList.remove("hidden");
  $("#game").classList.add("hidden");
  $("#end").classList.add("hidden");
}

function showGame(){
  $("#setup").classList.add("hidden");
  $("#game").classList.remove("hidden");
  $("#end").classList.add("hidden");
}

function showEnd(){
  $("#setup").classList.add("hidden");
  $("#game").classList.add("hidden");
  $("#end").classList.remove("hidden");

  const summary = `Runde beendet – ${state.a.name} & ${state.b.name} sind durch. Nächster Schritt?`;
  $("#summary").textContent = summary;
}

function renderTurn(){
  const player = state[state.turn];
  $("#turnLabel").textContent = `${player.name} ist dran`;
  $("#questionText").textContent = nextQ(state.turn);
  updateProgress();
}

// Advance to next question / turn
function advance(consumed){
  if(consumed){
    // Count as answered for current player
    state[state.turn].i++;
  }
  updateProgress();

  if(bothDone()){
    showEnd();
    return;
  }

  // If current player finished, force other; else alternate
  if(state[state.turn].i >= state.totalPerPlayer){
    state.turn = state.turn === "a" ? "b" : "a";
  }else{
    // Alternate only if other isn't already finished
    const other = state.turn === "a" ? "b" : "a";
    if(state[other].i < state.totalPerPlayer){
      state.turn = other;
    }
  }

  renderTurn();
}

// ========= Event Wiring =========
document.addEventListener("DOMContentLoaded", () => {
  // Level pick
  $$(".chip").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      setLevel(btn.dataset.level);
    });
  });

  // Setup submit
  $("#setupForm").addEventListener("submit", (e)=>{
    e.preventDefault();
    const a = $("#nameA").value.trim() || "A";
    const b = $("#nameB").value.trim() || "B";
    state.a = { name:a, i:0, order:[] };
    state.b = { name:b, i:0, order:[] };

    // who starts
    const randomStart = $("#shuffleStart").checked;
    state.turn = randomStart ? (Math.random() < 0.5 ? "a" : "b") : "a";

    // Reset UI
    $("#levelBadge").textContent = displayLevel(state.level);
    updateProgress();
    showGame();
    renderTurn();
  });

  // Controls
  $("#nextBtn").addEventListener("click", ()=> advance(true));
  $("#skipBtn").addEventListener("click", ()=> advance(false));

  $("#againBtn").addEventListener("click", ()=>{
    // Same level, same names; reset counters
    state.a.i = 0; state.b.i = 0;
    state.a.order = []; state.b.order = [];
    state.turn = Math.random() < 0.5 ? "a" : "b";
    showGame(); renderTurn();
  });

  $("#levelUpBtn").addEventListener("click", ()=>{
    const order = ["soft","hot","hard","extreem"];
    const idx = order.indexOf(state.level);
    const next = order[Math.min(idx+1, order.length-1)];
    setLevel(next);
    state.a.i = 0; state.b.i = 0;
    state.a.order = []; state.b.order = [];
    state.turn = Math.random() < 0.5 ? "a" : "b";
    showGame(); renderTurn();
  });

  $("#restartBtn").addEventListener("click", ()=>{
    // back to setup
    showSetup();
  });

  // initial level
  setLevel("soft");
  showSetup();
});
