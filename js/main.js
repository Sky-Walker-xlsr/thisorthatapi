// main.js – Zentrale Logik für Login, Quiz, Resultate und Chat

const users = [
  { username: "Amelie", password: "05.07.2025" },
  { username: "Yannick", password: "05.07.2025" }
];

const params = new URLSearchParams(location.search);
const quizName = params.get("quiz");
const user = localStorage.getItem("user");

// 🟡 1. Login-Handling (nur auf login.html vorhanden)
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

// 🟢 2. Quizdaten laden und danach starten
let quizzes = {};
fetch("/data/quizzes.json")
  .then(res => res.json())
  .then(data => {
    quizzes = data;
    initApp();
  })
  .catch(err => console.error("Quizdaten konnten nicht geladen werden:", err));

// 🟢 3. Gesamte App-Logik in diese Funktion
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
        document.getElementById("results").innerHTML = "<p>Fehler beim Laden der Ergebnisse.</p>";
        console.error(err);
      });
  }

  // === DASHBOARD: Begrüssung + abgeschlossene Quizzes ===
  if (location.pathname.endsWith("dashboard.html")) {
    document.getElementById("userName").textContent = user || "Gast";

    const completedContainer = document.getElementById("completedQuizzes");
    const bgColors = ["#FF6B6B", "#4ECDC4", "#FFD93D", "#B39CD0"];
    const quizNames = Object.keys(quizzes);

    quizNames.forEach((quizName, index) => {
      fetch(`/api/load?quiz=${quizName}`)
        .then(res => res.json())
        .then(data => {
          if (data[user]) {
            const link = document.createElement("a");
            link.className = "quiz-card";
            link.href = `results.html?quiz=${quizName}`;
            link.textContent = `This or That: ${quizName.charAt(0).toUpperCase() + quizName.slice(1)}`;
            link.style.backgroundColor = bgColors[index % bgColors.length];
            completedContainer.appendChild(link);
          }
        });
    });
  }

  // === CHAT ===
  const chatBox = document.getElementById("chatMessages");
  const chatInput = document.getElementById("chatInput");

  function sendMessage() {
    const msg = chatInput.value.trim();
    if (!msg) return;

    const chatData = { quiz: quizName, user, text: msg };
    fetch("/api/save?quiz=chat_" + quizName + "&user=" + user, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chatData)
    }).then(() => location.reload());
  }

  if (chatBox) {
    fetch(`/api/load?quiz=chat_${quizName}`)
      .then(res => res.json())
      .then(chat => {
        const messages = Object.values(chat || {});
        chatBox.innerHTML = messages.map(m => `<p><strong>${m.user}:</strong> ${m.text}</p>`).join("");
      });
  }
}
