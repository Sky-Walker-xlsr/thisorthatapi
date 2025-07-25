// === main.js – Zentrale Logik für Login, Quiz, Ergebnisse & Chat ===

// 🟢 Benutzer-Login-Daten
const users = [
  { username: "Amelie", password: "05.07.2025" },
  { username: "Yannick", password: "05.07.2025" }
];

// 🟢 Nützliche URL- und User-Infos
const params = new URLSearchParams(location.search);
const quizName = params.get("quiz");
const user = localStorage.getItem("user");

// === LOGIN-FUNKTION (nur auf login.html aktiv) ===
document.getElementById("loginForm")?.addEventListener("submit", function (e) {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const pw = document.getElementById("password").value;
  const valid = users.find(u => u.username === username && u.password === pw);

  if (valid) {
    localStorage.setItem("user", username);
    location.href = "dashboard.html";
  } else {
    document.getElementById("errorMsg").textContent = "Falsche Anmeldedaten.";
  }
});

// === QUIZDATEN LADEN und App starten ===
let quizzes = {};
fetch("/data/quizzes.json")
  .then(res => res.json())
  .then(data => {
    quizzes = data;
    initApp(); // App starten wenn Daten da
  })
  .catch(err => console.error("Quizdaten konnten nicht geladen werden:", err));

// === HAUPTFUNKTION: Alles Weitere passiert hier ===
function initApp() {

  // === QUIZ-SEITE ===
  if (location.pathname.endsWith("quiz.html") && quizName && user) {
    const quizData = quizzes[quizName];
    let index = 0;
    let answers = [];

    const questionEl = document.getElementById("question");
    const img1 = document.getElementById("img1");
    const img2 = document.getElementById("img2");

    function loadQuestion() {
      const q = quizData[index];
      questionEl.textContent = q.question;
      img1.src = q.img1;
      img2.src = q.img2;
    }

    function select(choice) {
      answers[index] = choice;
      index++;
      if (index < quizData.length) {
        loadQuestion();
      } else {
        // Wenn alle beantwortet → speichern und weiterleiten
        fetch("/api/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quiz: quizName, user, answers })
        }).then(() => {
          location.href = `results.html?quiz=${quizName}`;
        });
      }
    }

    img1?.addEventListener("click", () => select("left"));
    img2?.addEventListener("click", () => select("right"));
    loadQuestion();
  }

// === RESULTS-SEITE mit zentrierten Namen & Frage ===
if (location.pathname.includes("results.html") && quizName) {
  const resultDiv = document.getElementById("results");

  fetch(`/api/load?quiz=${quizName}`)
    .then(res => res.json())
    .then(data => {
      const quizData = quizzes[quizName];
      if (!quizData || data === null || Object.keys(data).length < 2) {
        resultDiv.innerHTML = "<p>Mindestens zwei Ergebnisse nötig für den Vergleich.</p>";
        return;
      }

      const [user1, user2] = Object.keys(data); // z. B. Yannick & Amélie
      const answers1 = data[user1];
      const answers2 = data[user2];

      let html = `
        <div class="result-compare-header">
          <div class="user-label">${user1}</div>
          <div class="user-label">${user2}</div>
        </div>
      `;

      quizData.forEach((q, i) => {
        const choice1 = answers1[i] === "left" ? q.img1 : q.img2;
        const choice2 = answers2[i] === "left" ? q.img1 : q.img2;

        html += `
          <div class="result-question-center">${q.question}</div>
          <div class="result-row">
            <div class="result-answer">
              <img src="${choice1}" alt="Antwort von ${user1}">
            </div>
            <div class="result-answer">
              <img src="${choice2}" alt="Antwort von ${user2}">
            </div>
          </div>
        `;
      });

      resultDiv.innerHTML = html;
    })
    .catch(err => {
      resultDiv.innerHTML = "<p>Fehler beim Laden der Ergebnisse.</p>";
      console.error(err);
    });
}


  // === DASHBOARD-SEITE ===
  if (location.pathname.endsWith("dashboard.html")) {
    // Benutzername einblenden
    document.getElementById("userName").textContent = user || "Gast";

    const quizListContainer = document.getElementById("quizList");
    const completedContainer = document.getElementById("completedQuizzes");
    const bgColors = ["#FF6B6B", "#4ECDC4", "#FFD93D", "#B39CD0", "#F7A072"];
    const quizNames = Object.keys(quizzes);

    quizNames.forEach((quizName, index) => {
      // Quiz-Startkarte
      const start = document.createElement("a");
      start.className = "quiz-card";
      start.href = `quiz.html?quiz=${quizName}`;
      start.textContent = `${quizName.charAt(0).toUpperCase() + quizName.slice(1)}`;
      start.style.backgroundColor = bgColors[index % bgColors.length];
      quizListContainer?.appendChild(start);

      // Prüfen ob schon abgeschlossen
      fetch(`/api/load?quiz=${quizName}`)
        .then(res => res.json())
        .then(data => {
          if (data[user]) {
            const done = document.createElement("a");
            done.className = "quiz-card";
            done.href = `results.html?quiz=${quizName}`;
            done.textContent = `${quizName.charAt(0).toUpperCase() + quizName.slice(1)}`;
            done.style.backgroundColor = bgColors[index % bgColors.length];
            completedContainer?.appendChild(done);
          }
        });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
  const testBtn = document.getElementById("test-save-button");
  if (testBtn) {
    testBtn.addEventListener("click", async () => {
      const res = await fetch("/api/save.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "githubTestSave"
        })
      });

      const result = await res.json();
      alert(result.message || "Fertig.");
    });
  }
});


// === CHAT (nur auf results.html) ===
const chatBox = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");

chatInput?.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

// 💡 Aktuell eingeloggter Benutzer
const currentUser = sessionStorage.getItem("username") || "Yannick";

// Funktion zum Senden einer Nachricht
window.sendMessage = function () {
  const msg = chatInput.value.trim();
  if (!msg) return;

  fetch("/api/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quiz: quizName,
      user,
      text: msg
    })
  }).then(() => {
    renderMessage(msg, user);
    chatInput.value = "";
  });
};



// Funktion zur Darstellung einer Nachricht
function renderMessage(text, fromUser) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `chat-message ${fromUser.toLowerCase()}`;
  msgDiv.textContent = text;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Nachrichten laden beim Start
if (chatBox) {
  fetch(`/api/load?quiz=${quizName}`)
    .then(res => res.json())
    .then(data => {
      const messages = data._chat || {};
      Object.values(messages).forEach(m => {
        renderMessage(m.text, m.user);
      });
    });
}
}




// === ADDQUIZ.html ===
if (location.pathname.endsWith("addquiz.html")) {
  const form = document.getElementById("quizForm");
  const statusEl = document.getElementById("status");
  const questionsContainer = document.getElementById("questionsContainer");
  const addQuestionBtn = document.getElementById("add-question-btn");

  // Frageblock generieren
  function createQuestionBlock() {
    const div = document.createElement("div");
    div.className = "question-block";
    div.innerHTML = `
      <label>Frage:</label>
      <input type="text" class="question" placeholder="Bsp. Apfel oder Orange? (keine Umlaute)" required />

      <label>Bild 1 Suche:</label>
      <input type="text" class="img1search" placeholder="apple (bitte in englisch und ohne Umlaute)" required />

      <label>Bild 2 Suche:</label>
      <input type="text" class="img2search" placeholder="orange (bitte in englisch und ohne Umlaute)" required />
    `;
    return div;
  }

  // Seite lädt → 1 Frage hinzufügen
  document.addEventListener("DOMContentLoaded", () => {
    questionsContainer.appendChild(createQuestionBlock());
  });

  // Weitere Frage hinzufügen
  addQuestionBtn.addEventListener("click", () => {
    questionsContainer.appendChild(createQuestionBlock());
  });

  // Pixabay Bild holen
  async function fetchPixabayImage(query) {
    const apiKey = '51478566-b3d3000cd1ad295edfef73647';
    try {
      const res = await fetch(`https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=photo&per_page=3`);
      const data = await res.json();
      return data.hits?.[0]?.webformatURL || 'https://via.placeholder.com/600x900?text=Kein+Bild';
    } catch (err) {
      console.error("❌ Pixabay-Fehler:", err);
      return 'https://via.placeholder.com/600x900?text=Fehler';
    }
  }

  // Speichern
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const quizName = document.getElementById("quizname").value.trim();

    if (!quizName) {
      statusEl.textContent = "⚠️ Bitte Quiznamen eingeben.";
      return;
    }

    const questionBlocks = document.querySelectorAll(".question-block");
    const questions = [];

    for (const block of questionBlocks) {
      const question = block.querySelector(".question").value.trim();
      const search1 = block.querySelector(".img1search").value.trim();
      const search2 = block.querySelector(".img2search").value.trim();

      if (!question || !search1 || !search2) {
        statusEl.textContent = "⚠️ Bitte alle Felder ausfüllen.";
        return;
      }

      const img1 = await fetchPixabayImage(search1);
      const img2 = await fetchPixabayImage(search2);

      questions.push({ question, img1, img2 });
    }

    const payload = {
      quiz: "quizzes",
      newQuestions: questions,
      targetCategory: quizName
    };

    try {
      const response = await fetch("/api/save.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (response.ok) {
        statusEl.innerHTML = `<span style="color: #00cc66;">✅ Erfolgreich gespeichert!</span>`;
        form.reset();
        questionsContainer.innerHTML = "";
        questionsContainer.appendChild(createQuestionBlock());
      } else {
        statusEl.innerHTML = `<span style="color: red;">❌ Fehler: ${result.error || "Unbekannt"}</span>`;
      }
    } catch (err) {
      console.error("❌ Netzwerkfehler:", err);
      statusEl.innerHTML = `<span style="color: red;">❌ Netzwerkfehler!</span>`;
    }
  });
}


