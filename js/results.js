const params = new URLSearchParams(location.search);
const quizName = params.get("quiz");
const resultDiv = document.getElementById("results");

const quizzes = {
    fruits: [
        {
            question: "Beispielfrage 1: Apfel oder Banane?",
            img1: "https://source.unsplash.com/600x900/?apple",
            img2: "https://source.unsplash.com/600x900/?banana"
        },
        {
            question: "Beispielfrage 2: Erdbeere oder Kirsche?",
            img1: "https://source.unsplash.com/600x900/?strawberry",
            img2: "https://source.unsplash.com/600x900/?cherry"
        }
    ],
    food: [
        {
            question: "Beispielfrage 1: Pizza oder Sushi?",
            img1: "https://source.unsplash.com/600x900/?pizza",
            img2: "https://source.unsplash.com/600x900/?sushi"
        },
        {
            question: "Beispielfrage 2: Pasta oder Burger?",
            img1: "https://source.unsplash.com/600x900/?pasta",
            img2: "https://source.unsplash.com/600x900/?burger"
        }
    ],
    house: [
        {
            question: "Beispielfrage 1: Modern oder Cottage?",
            img1: "https://source.unsplash.com/600x900/?modern-house",
            img2: "https://source.unsplash.com/600x900/?cottage"
        },
        {
            question: "Beispielfrage 2: Villa oder Baumhaus?",
            img1: "https://source.unsplash.com/600x900/?villa",
            img2: "https://source.unsplash.com/600x900/?treehouse"
        }
    ]
};

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
                const img = parseInt(choice) === 1 ? q.img1 : q.img2;
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
        console.error(err);
    });
