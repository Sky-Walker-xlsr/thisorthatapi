let quizzes = {};

fetch("/data/quizzes.json")
  .then(res => res.json())
  .then(data => {
    quizzes = data;
    loadResults(); // Weiter erst wenn Daten geladen sind
  })
  .catch(err => {
    document.getElementById("results").innerHTML = "<p>Quizdaten konnten nicht geladen werden.</p>";
    console.error("Fehler beim Laden der Quizdaten:", err);
  });

function loadResults() {
  const params = new URLSearchParams(location.search);
  const quizName = params.get("quiz");
  const resultDiv = document.getElementById("results");

  fetch(`/api/load?quiz=${quizName}`)
    .then(res => res.json())
    .then(data => {
      if (!quizName || !data || Object.keys(data).length === 0) {
        resultDiv.innerHTML = "<p>Keine Ergebnisse gefunden.</p>";
        return;
      }

      const quiz = quizzes[quizName];
      if (!quiz) {
        resultDiv.innerHTML = "<p>Unbekanntes Quiz.</p>";
        return;
      }

      let html = "";

      Object.entries(data).forEach(([user, answers]) => {
        html += `<h2>${user}</h2>`;
        answers.forEach((choice, i) => {
          const q = quiz[i];
          if (!q) return;

          let img = "";
          if (choice === "left") {
            img = q.img1;
          } else if (choice === "right") {
            img = q.img2;
          }

          html += `
            <div class="result-question">${q.question}</div>
            <div class="result-row">
              <div class="result-answer">
                <img src="${img}" alt="Antwort">
              </div>
            </div><hr>
          `;
        });
      });

      resultDiv.innerHTML = html;
    })
    .catch(err => {
      resultDiv.innerHTML = "<p>Fehler beim Laden der Ergebnisse.</p>";
      console.error("Fehler beim Laden der gespeicherten Antworten:", err);
    });
}
