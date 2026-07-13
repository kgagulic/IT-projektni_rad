const score = localStorage.getItem("score");
const total = localStorage.getItem("total");
const answers = JSON.parse(localStorage.getItem("answers"));

const quizTitle = localStorage.getItem("quizTitle");

document.getElementById("result-title").innerHTML = `
    Rezultati kviza
    <div class="quiz-subtitle">${quizTitle}</div>
`;

document.getElementById("result").innerHTML = `
  <p class="result-title">Točni odgovori</p>
  <h2>${score} / ${total}</h2>
`;

const review = document.getElementById("review");

answers.forEach((a, i) => {
  const correct = Array.isArray(a.correct)
    ? a.correct.join(", ")
    : a.correct;

  const user = Array.isArray(a.userAnswer)
    ? a.userAnswer.join(", ")
    : a.userAnswer;

  const isCorrect =
    Array.isArray(a.correct) && Array.isArray(a.userAnswer)
      ? JSON.stringify(a.correct.map(x => x.toLowerCase()).sort()) ===
        JSON.stringify(a.userAnswer.map(x => x.toLowerCase()).sort())
      : a.correct.toString().toLowerCase() ===
        a.userAnswer.toString().toLowerCase();

  review.innerHTML += `
    <div class="question-review">
      <p>
        <b>${i + 1}. ${a.question}</b>
        <span class="${isCorrect ? "correct" : "incorrect"}">
          ${isCorrect ? "✅ Točno" : "❌ Netočno"}
        </span>
      </p>
      <p>Vaš odgovor: ${user}</p>
      <p><strong>Točan odgovor: ${correct}</strong></p>
      <hr>
    </div>
  `;
});

const retryBtn = document.getElementById("retryBtn");

if (retryBtn) {
  retryBtn.addEventListener("click", () => {
    const set = localStorage.getItem("set") || "1";
    window.location.href = `../kviz/kviz.html?set=${set}`;
  });
}