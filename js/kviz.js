console.log("KVIZ JS LOADED");

const params = new URLSearchParams(window.location.search);
const set = params.get("set") || 1;

let questions = [];
let currentIndex = 0;
let score = 0;
let userAnswers = [];

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

fetch(`../data/predavanje${set}.json`)
  .then(res => res.json())
  .then(data => {
    questions = shuffle(data).slice(0, 5);
    showQuestion();
  });

function showQuestion() {
  const q = questions[currentIndex];
  const container = document.getElementById("quiz");

container.innerHTML = `
  <h2>Pitanje ${currentIndex + 1} / 5</h2>
  <p>${q.question}</p>

  ${q.image ? `<img src="${q.image}" style="max-width:300px; display:block; margin:10px 0;">` : ""}

  <div id="answers"></div>
  <button onclick="nextQuestion()">Sljedeće</button>
`;

  const a = document.getElementById("answers");

  if (q.type === "single") {
    q.options.forEach(o => {
      a.innerHTML += `
        <label><input type="radio" name="ans" value="${o}">${o}</label><br>
      `;
    });
  }

else if (q.type === "multiple") {
  shuffle(q.options).forEach(o => {
    a.innerHTML += `
      <label>
        <input type="checkbox" value="${o}">
        ${o}
      </label><br>
    `;
  });
}

  else if (q.type === "truefalse") {
  a.innerHTML = `
    <label><input type="radio" name="tf" value="true"> Točno</label><br>
    <label><input type="radio" name="tf" value="false"> Netočno</label><br>
  `;
}

  else {
    a.innerHTML = `<input type="text" id="text">`;
  }

  
}

function nextQuestion() {
  const q = questions[currentIndex];
  let answer;

    if (q.type === "single") {
    answer = document.querySelector("input[name='ans']:checked")?.value || "";
    }

  else if (q.type === "multiple") {
    answer = [...document.querySelectorAll("input[type='checkbox']:checked")]
      .map(e => e.value);
  }

  else if (q.type === "truefalse") {
  answer = document.querySelector("input[name='tf']:checked")?.value || "";
  }

  else {
    answer = document.getElementById("text").value.trim();
  }

  userAnswers.push({
    question: q.question,
    userAnswer: answer,
    correct: q.correct
  });

  if (check(q, answer)) score++;

  currentIndex++;

  if (currentIndex < questions.length) {
    showQuestion();
  } else {
    finish();
  }
}


function normalize(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function check(q, ans) {
  const c = q.correct;

  // MULTIPLE
  if (Array.isArray(c)) {
    return JSON.stringify(c.map(normalize).sort()) ===
           JSON.stringify(ans.map(normalize).sort());
  }

  // TRUE / FALSE / SINGLE / TEXT
  return normalize(c) === normalize(ans);
}

function finish() {
  localStorage.setItem("score", score);
  localStorage.setItem("total", questions.length);
  localStorage.setItem("answers", JSON.stringify(userAnswers));

  window.location.href = "../kviz/rezultati.html";
}