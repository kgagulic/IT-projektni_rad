const score = localStorage.getItem("score");
const total = localStorage.getItem("total");
const answers = JSON.parse(localStorage.getItem("answers"));

document.getElementById("result").innerHTML =
  `<h2>${score} / ${total}</h2>`;

const review = document.getElementById("review");

answers.forEach((a, i) => {

  const correct = Array.isArray(a.correct)
    ? a.correct.join(", ")
    : a.correct;

  const user = Array.isArray(a.userAnswer)
    ? a.userAnswer.join(", ")
    : a.userAnswer;

  const isCorrect = Array.isArray(a.correct)
    ? JSON.stringify(a.correct.map(x => x.toLowerCase()).sort()) ===
      JSON.stringify(a.userAnswer.map(x => x.toLowerCase()).sort())
    : a.correct.toString().toLowerCase() ===
      a.userAnswer.toString().toLowerCase();

  review.innerHTML += `
    <div class="question-review">
      <p>
        <b>${i + 1}. ${a.question}</b>
        <span class="${isCorrect ? 'correct' : 'incorrect'}">
           ${isCorrect ? "✔ Točno" : "❌ Netočno"}
        </span>
      </p>
      <p>Vaš odgovor: ${user}</p>
      <p>Točan odgovor: ${correct}</p>
      <hr>
    </div>
  `;
});
