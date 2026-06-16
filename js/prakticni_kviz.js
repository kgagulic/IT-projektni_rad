const params = new URLSearchParams(window.location.search);
const set = params.get("set") || 1;

let pitanja = [];
let trenutno = 0;

fetch(`../data/vjezba${set}.json`)
  .then(res => res.json())
  .then(data => {
    pitanja = data.questions;
    prikaziPitanje();
  })
  .catch(err => {
    document.getElementById("quiz").innerHTML = `
      <div class="alert alert-danger">
        Greška pri učitavanju vježbe.
      </div>
    `;
    console.error(err);
  });

function prikaziPitanje() {

    const p = pitanja[trenutno];

    document.getElementById("quiz").innerHTML = `

        <h2>${p.title}</h2>

        <p>${p.text}</p>

        ${p.image ? `
            <img
                src="${p.image}"
                class="img-fluid mb-3"
                style="max-width:400px;">
        ` : ""}

        <textarea
            id="odgovor"
            class="form-control"
            rows="15"
        >${p.starterCode || ""}</textarea>

        <br>

        <button
            class="btn btn-primary"
            onclick="provjeri()">
            Provjeri
        </button>

        <div id="poruka" class="mt-3"></div>

        <div id="previewContainer"></div>
    `;
}

function provjeri() {

    const p = pitanja[trenutno];

    const unosOriginal =
        document.getElementById("odgovor").value;

    const unos =
        unosOriginal.toLowerCase();

    let tocno = false;

    if (p.requiredTag === "body") {

       if (p.requiredTag === "body") {

    const bodyPattern =
        /<html[\s\S]*?<head[\s\S]*?<\/head>[\s\S]*?<body[\s\S]*?<\/body>[\s\S]*?<\/html>/i;

    if (bodyPattern.test(unosOriginal)) {

        tocno = true;
    }

    else if (
        unos.includes("<body>") &&
        unos.includes("</body>")
    ) {

        const poruka =
            document.getElementById("poruka");

        poruka.innerHTML = `
            <div class="alert alert-warning">
                ⚠ Uneseni element je ispravan, ali nije na ispravnom mjestu.
                
            </div>
        `;

        return;
    }

    else {

        const poruka =
            document.getElementById("poruka");

        poruka.innerHTML = `
            <div class="alert alert-danger">
                ❌ Nedostaje odgovarajući element.
            </div>
        `;

        return;
    }
}
    }

    else if (p.requiredTag === "p") {

    const ispravnoMjesto =
        /<body[\s\S]*?<p>\s*.+\s*<\/p>[\s\S]*?<\/body>/is;

    const postojiTag =
        /<p>[\s\S]*<\/p>/i;

    const prazanTag =
        /<p>\s*<\/p>/i;

    if (ispravnoMjesto.test(unosOriginal)) {

        tocno = true;
    }

    else if (prazanTag.test(unosOriginal)) {

        document.getElementById("poruka").innerHTML = `
            <div class="alert alert-warning">
                ⚠ Unesi tekst sa slike.
            </div>
        `;

        return;
    }

    else if (postojiTag.test(unosOriginal)) {

        document.getElementById("poruka").innerHTML = `
            <div class="alert alert-warning">
                ⚠ Uneseni element je ispravan, ali nije na ispravnom mjestu.
            </div>
        `;

        return;
    }

}

    else if (p.requiredTag === "h1") {

    const ispravnoMjesto =
        /<body[\s\S]*?<h1>\s*.+\s*<\/h1>[\s\S]*?<\/body>/is;

    const postojiTag =
        /<h1>[\s\S]*<\/h1>/i;

    const prazanTag =
        /<h1>\s*<\/h1>/i;

    if (ispravnoMjesto.test(unosOriginal)) {

        tocno = true;
    }

    else if (prazanTag.test(unosOriginal)) {

        document.getElementById("poruka").innerHTML = `
            <div class="alert alert-warning">
                ⚠ Unesi tekst sa slike.
            </div>
        `;

        return;
    }

    else if (postojiTag.test(unosOriginal)) {

        document.getElementById("poruka").innerHTML = `
            <div class="alert alert-warning">
                ⚠ Uneseni element je ispravan, ali nije na ispravnom mjestu.
            </div>
        `;

        return;
    }

}

    else {

        tocno =
            unos.includes(`<${p.requiredTag}>`) &&
            unos.includes(`</${p.requiredTag}>`);
    }

    const poruka =
        document.getElementById("poruka");

    const preview =
        document.getElementById("previewContainer");

    if (p.showPreview) {

        preview.innerHTML = `
            <h5 class="mt-4">
                Pregled rezultata
            </h5>

            <iframe
                style="
                    width:100%;
                    height:250px;
                    border:1px solid #ccc;
                    background:white;
                "
                srcdoc="${unosOriginal.replace(/"/g,'&quot;')}">
            </iframe>
        `;
    }

    else {

        preview.innerHTML = "";
    }

    if (tocno) {

        poruka.innerHTML = `
            <div class="alert alert-success">
                ✔ Točan odgovor!
            </div>

            <button
                class="btn btn-success"
                onclick="sljedece()">
                Dalje
            </button>
        `;
    }

    else {

        poruka.innerHTML = `
            <div class="alert alert-danger">
                ❌ Netočno. Provjeri koristiš li traženi HTML element.
            </div>
        `;
    }
}

function sljedece() {

    trenutno++;

    if (trenutno < pitanja.length) {

        prikaziPitanje();
    }

    else {

        document.getElementById("quiz").innerHTML = `
            <div class="alert alert-success text-center">
                <h2>Bravo!</h2>

                <p>
                    Uspješno si riješio/la sve zadatke.
                </p>

                <a
                    href="../zadaci/izbor_vjezbe.html"
                    class="btn btn-primary">
                    Povratak na odabir vježbi
                </a>
            </div>
        `;
    }
}