// Login-Funktion
const users = [
  { username: "Amelie", password: "05.07.2025" },
  { username: "Yannick", password: "05.07.2025" }
];

// ➤ Login-Formular auswerten
document.getElementById("loginForm")?.addEventListener("submit", function (e) {
  e.preventDefault();

  const user = document.getElementById("username").value;
  const pw = document.getElementById("password").value;

  // Benutzer aus Liste suchen
  const valid = users.find(u => u.username === user && u.password === pw);

  if (valid) {
    localStorage.setItem("user", user); // Nutzer merken (für später)
    location.href = "dashboard.html";   // weiterleiten ins Dashboard
  } else {
    document.getElementById("errorMsg").textContent = "Falsche Anmeldedaten.";
  }
});

// Quizzes Laden
const params = new URLSearchParams(location.search);
const quizName = params.get("quiz");
const user = localStorage.getItem("user");

let quizzes = {}; // wird befüllt mit den Quizfragen

// ➤ Zuerst die zentrale Fragen-Datei laden
fetch('/data/quizzes.json')
  .then(res => res.json())
  .then(data => {
    quizzes = data;
    initQuiz(); // wenn geladen, geht's los
  })
  .catch(err => {
    console.error("Fehler beim Laden der Quizdaten:", err);
  });

// Quizseite
function initQuiz() {
  if (location.pathname.endsWith("quiz.html") && quizName && user) {
    const quizData = quizzes[quizName];
    let index = 0;
    let answers = [];

    const questionEl = document.getElementById("question");
    const img1 = document.getElementById("img1");
    const img2 = document.getElementById("img2");

    // ➤ Aktuelle Frage anzeigen
    function loadQuestion() {
      const q = quizData[index];
      questionEl.textContent = q.question;
      img1.src = q.img1;
      img2.src = q.img2;
    }

    // ➤ Antwort speichern und nächste Frage laden
    function select(choice) {
      answers[index] = choice;
      index++;
      if (index < quizData.length) {
        loadQuestion();
      } else {
        // ➤ Wenn alle Fragen beantwortet: auf GitHub speichern
        fetch(`/api/save`, {
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
}

// Resultatseite
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
          const img = choice === "left" ? q.img1 : q.img2;
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

// Chatfunktion
const chatBox = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");

function sendMessage() {
  const msg = chatInput.value.trim();
  if (!msg) return;

  const chatData = { quiz: quizName, user, text: msg };

  // ➤ Chatnachricht speichern
  fetch("/api/save?quiz=chat_" + quizName + "&user=" + user, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(chatData)
  }).then(() => location.reload());
}

// ➤ Chat laden (wenn Chatbox vorhanden)
if (chatBox) {
  fetch(`/api/load?quiz=chat_${quizName}`)
    .then(res => res.json())
    .then(chat => {
      const messages = Object.values(chat || {});
      chatBox.innerHTML = messages.map(m => `<p><strong>${m.user}:</strong> ${m.text}</p>`).join("");
    });
}
