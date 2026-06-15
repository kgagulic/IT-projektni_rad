const score = localStorage.getItem("score");
const total = localStorage.getItem("total");

document.getElementById("result").innerHTML =
`<h2>${score} / ${total}</h2>`;