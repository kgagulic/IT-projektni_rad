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

if (set === "kolokvij1") {

  Promise.all([
    fetch("../data/predavanje1.json").then(r => r.json()),
    fetch("../data/predavanje2.json").then(r => r.json()),
    fetch("../data/predavanje3.json").then(r => r.json()),
    fetch("../data/predavanje4.json").then(r => r.json()),
    fetch("../data/predavanje5.json").then(r => r.json())
  ])
  .then(data => {
    questions = shuffle(data.flat()).slice(0, 10);
    showQuestion();
  });

}

else if (set === "kolokvij2") {

  Promise.all([
    fetch("../data/predavanje7.json").then(r => r.json()),
    fetch("../data/predavanje8.json").then(r => r.json()),
    fetch("../data/predavanje9.json").then(r => r.json()),
    fetch("../data/predavanje10.json").then(r => r.json()),
    fetch("../data/predavanje11.json").then(r => r.json())
  ])
  .then(data => {
    questions = shuffle(data.flat()).slice(0, 10);
    showQuestion();
  });

}

else {

  fetch(`../data/predavanje${set}.json`)
    .then(res => res.json())
    .then(data => {
      questions = shuffle(data).slice(0, 5);
      showQuestion();
    });

}

function showQuestion() {
  const q = questions[currentIndex];
  const container = document.getElementById("quiz");

container.innerHTML = `
  <h2>Pitanje ${currentIndex + 1} / ${questions.length}</h2>
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

else if (q.type === "number") {
  a.innerHTML = `
    <input
      type="text"
      id="text"
      inputmode="numeric"
      maxlength="4"
      oninput="this.value=this.value.replace(/[^0-9]/g,'')"
    >
  `;
  }

  else if (q.type === "double" || q.type === "doubleOrdered") {
    a.innerHTML = `
      <input type="text" id="text1"><br><br>
      <input type="text" id="text2">
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

  else if (q.type === "double" || q.type === "doubleOrdered") {
    answer = [
      document.getElementById("text1").value.trim(),
      document.getElementById("text2").value.trim()
    ];
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

  // DOUBLE ORDERED
  if (q.type === "doubleOrdered") {
    return normalize(ans[0]) === normalize(c[0]) &&
          normalize(ans[1]) === normalize(c[1]);
}

  // DOUBLE
  if (q.type === "double") {
    return JSON.stringify(ans.map(normalize).sort()) ===
           JSON.stringify(c.map(normalize).sort());
  }

  // MULTIPLE
  if (q.type === "multiple") {
    return JSON.stringify(c.map(normalize).sort()) ===
           JSON.stringify(ans.map(normalize).sort());
  }

  // SHORT s više mogućih odgovora
  if (Array.isArray(c)) {
    return c.some(el => normalize(el) === normalize(ans));
  }

  return normalize(c.toString()) === normalize(ans.toString());
}

function finish() {
  localStorage.setItem("score", score);
  localStorage.setItem("total", questions.length);
  localStorage.setItem("answers", JSON.stringify(userAnswers));

  window.location.href = "../kviz/rezultati.html";
}