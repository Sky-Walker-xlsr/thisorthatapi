const quizzes = {
    fruits: [
        { question: "Apfel oder Banane?", img1: "https://source.unsplash.com/600x900/?apple", img2: "https://source.unsplash.com/600x900/?banana" },
        { question: "Erdbeere oder Kirsche?", img1: "https://source.unsplash.com/600x900/?strawberry", img2: "https://source.unsplash.com/600x900/?cherry" }
    ]
};

const params = new URLSearchParams(location.search);
const quizName = params.get("quiz");
const user = localStorage.getItem("user");

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
            fetch(`/api/save?quiz=${quizName}&user=${user}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(answers)
            }).then(() => {
                location.href = `results.html?quiz=${quizName}`;
            });
        }
    }

    img1?.addEventListener("click", () => select(1));
    img2?.addEventListener("click", () => select(2));
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
                    const img = choice === 1 ? q.img1 : q.img2;
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
