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

  // === RESULTS-SEITE ===
  if (location.pathname.includes("results.html") && quizName) {
    const resultDiv = document.getElementById("results");

    fetch(`/api/load?quiz=${quizName}`)
      .then(res => res.json())
      .then(data => {
        const quizData = quizzes[quizName];
        if (!quizData || !data || Object.keys(data).length < 1) {
          resultDiv.innerHTML = "<p>Keine Ergebnisse gefunden.</p>";
          return;
        }

        let html = "";
        Object.entries(data).forEach(([user, answers]) => {
          html += `<h3>${user}</h3>`;
          answers.forEach((choice, i) => {
            const q = quizData[i];
            let img = "";
            if (choice === "left") img = q.img1;
            else if (choice === "right") img = q.img2;

            html += `
              <p>${q.question}</p>
              <img src="${img}" style="width:150px;height:150px;border-radius:15px;"><hr>
            `;
          });
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
      start.textContent = `This or That: ${quizName.charAt(0).toUpperCase() + quizName.slice(1)}`;
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
            done.textContent = `Abgeschlossen: ${quizName.charAt(0).toUpperCase() + quizName.slice(1)}`;
            done.style.backgroundColor = bgColors[index % bgColors.length];
            completedContainer?.appendChild(done);
          }
        });
    });
  }

  // === CHAT (nur auf results.html) ===
  const chatBox = document.getElementById("chatMessages");
  const chatInput = document.getElementById("chatInput");

  window.sendMessage = function () {
    const msg = chatInput.value.trim();
    if (!msg) return;

    const chatData = { quiz: quizName, user, text: msg };
    fetch("/api/save?quiz=chat_" + quizName + "&user=" + user, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chatData)
    }).then(() => location.reload());
  };

  if (chatBox) {
    fetch(`/api/load?quiz=chat_${quizName}`)
      .then(res => res.json())
      .then(chat => {
        const messages = Object.values(chat || {});
        chatBox.innerHTML = messages.map(m => `<p><strong>${m.user}:</strong> ${m.text}</p>`).join("");
      });
  }
}
