// main.js – zentral für Quiz, Resultate, Chat

const params = new URLSearchParams(location.search);
const quizName = params.get("quiz");
const user = localStorage.getItem("user");

let quizzes = {}; // wird später mit fetch gefüllt

// 🟡 1. Quizdaten laden (zentral!)
fetch('/data/quizzes.json')
  .then(res => res.json())
  .then(data => {
    quizzes = data;
    initQuizPage();
    initResultsPage();
    initChat();
  })
  .catch(err => {
    console.error("Fehler beim Laden der Quizdaten:", err);
  });

// 🟢 2. QUIZ-SEITE (Fragen & Antworten)
function initQuizPage() {
  if (!location.pathname.endsWith("quiz.html") || !quizName || !user) return;

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
      fetch(`/api/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quiz: quizName,
          user: user,
          answers: answers
        })
      }).then(() => {
        location.href = `results.html?quiz=${quizName}`;
      });
    }
  }

  img1?.addEventListener("click", () => select("left"));
  img2?.addEventListener("click", () => select("right"));

  loadQuestion();
}

// 🟢 3. RESULTS-SEITE (Antwort-Vergleich)
function initResultsPage() {
  if (!location.pathname.includes("results.html") || !quizName) return;

  const resultDiv = document.getElementById("results");

  fetch(`/api/load?quiz=${quizName}`)
    .then(res => res.json())
    .then(data => {
      const quizData = quizzes[quizName];
      if (!quizData || !data || Object.keys(data).length === 0) {
        resultDiv.innerHTML = "<p>Keine Ergebnisse gefunden.</p>";
        return;
      }

      let html = "";
      Object.entries(data).forEach(([user, answers]) => {
        html += `<h3>${user}</h3>`;
        answers.forEach((choice, i) => {
          const q = quizData[i];
          if (!q) return;

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
      console.error("Fehler beim Laden der Antworten:", err);
    });
}

// 🟢 4. CHAT (optional bei Bedarf)
function initChat() {
  const chatBox = document.getElementById("chatMessages");
  const chatInput = document.getElementById("chatInput");

  if (!chatBox || !chatInput || !quizName || !user) return;

  function sendMessage() {
    const msg = chatInput.value.trim();
    if (!msg) return;

    const chatData = { quiz: "chat_" + quizName, user, text: msg };

    fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chatData)
    }).then(() => location.reload());
  }

  document.getElementById("sendButton")?.addEventListener("click", sendMessage);

  fetch(`/api/load?quiz=chat_${quizName}`)
    .then(res => res.json())
    .then(chat => {
      const messages = Object.values(chat || {});
      chatBox.innerHTML = messages
        .map(m => `<p><strong>${m.user}:</strong> ${m.text}</p>`)
        .join("");
    });
}
