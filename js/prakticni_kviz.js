const params = new URLSearchParams(window.location.search);
const set = params.get("set") || 1;

fetch(`../data/vjezba${set}.json`)
  .then(res => res.json())
  .then(data => {

    document.getElementById("quiz").innerHTML = `

      <h2>${data.title}</h2>

      <p>${data.description}</p>

      <img
        src="${data.image}"
        style="max-width:400px; margin-bottom:20px;"
      >

      <div class="row">

        <div class="col-md-6">

          <h4>HTML</h4>

          <textarea
            id="html"
            class="form-control"
            rows="12"
          >${data.starterHTML}</textarea>

        </div>

        <div class="col-md-6">

          <h4>CSS</h4>

          <textarea
            id="css"
            class="form-control"
            rows="12"
          >${data.starterCSS}</textarea>

        </div>

      </div>

      <br>

      <button
        class="btn btn-success"
        onclick="pokreni()"
      >
        Pokreni
      </button>

      <hr>

      <h3>Rezultat</h3>

      <iframe
        id="preview"
        style="
          width:100%;
          height:400px;
          border:1px solid #ccc;
          background:white;
        "
      ></iframe>
    `;

  });

function pokreni() {

  const html =
    document.getElementById("html").value;

  const css =
    document.getElementById("css").value;

  document.getElementById("preview").srcdoc = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        ${css}
      </style>
    </head>
    <body>
      ${html}
    </body>
    </html>
  `;
}