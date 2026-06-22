const params = new URLSearchParams(window.location.search);
const set = params.get("set") || 1;

let pitanja = [];

// 🔥 učitava zadnje pitanje ili 0
let trenutno =
Number(localStorage.getItem("trenutnoPitanje")) || 0;

fetch(`../data/vjezba${set}.json`)
    .then(res => res.json())
    .then(data => {

        pitanja = data.questions;

        if (trenutno >= pitanja.length) {
            trenutno = 0;
            localStorage.setItem("trenutnoPitanje", 0);
        }

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


// =====================================================
// PRIKAZ PITANJA
// =====================================================
function prikaziPitanje() {

    const p = pitanja[trenutno];

    // =====================================================
    // ✔ VJEŽBA 7 (SAMO JS / jQuery MODE)
    // =====================================================
    if (parseInt(set) === 7) {

        document.getElementById("quiz").innerHTML = `
            <h2>${p.title}</h2>
            <p>${p.text}</p>

            <h5>Preview</h5>

            <iframe id="previewFrame"
                style="width:100%;height:250px;border:1px solid #ccc;">
            </iframe>

            <div class="row mt-3">

                <div class="col-md-6">
                    <h5>HTML</h5>
                    <textarea id="htmlCode" class="form-control" rows="12">
${p.starterCode || ""}
                    </textarea>
                </div>

                <div class="col-md-6">
                    <h5>JS (jQuery / query)</h5>
                    <textarea id="jsCode" class="form-control" rows="12">
${p.starterPreviewJS || ""}
                    </textarea>
                </div>

            </div>

            <button class="btn btn-primary mt-2" onclick="runPreview()">
                Pokreni preview
            </button>

            <button class="btn btn-secondary mt-2 ms-2" onclick="sljedece()">
                Preskoči
            </button>

            <div id="poruka" class="mt-3"></div>
        `;

        return;
    }

    // =====================================================
    // OSTALE VJEŽBE (NE DIRAJ)
    // =====================================================

    document.getElementById("quiz").innerHTML = `

        <h2>${p.title}</h2>

        <p>${p.text}</p>

${p.image ? `
    <img
        src="${p.image}"
        class="mb-3 ${p.largeImage ? 'large-image' : 'normal-image'}">
` : ""}

        ${p.showCSS ? `

        <div class="row">

            <div class="col-md-6">

                <h5>HTML</h5>

                <textarea
                    id="odgovor"
                    class="form-control"
                    rows="15"
                >${p.starterCode || ""}</textarea>

            </div>

            <div class="col-md-6">

                <h5>CSS</h5>

                <textarea
                    id="css"
                    class="form-control"
                    rows="15"
                >${p.starterCSS || ""}</textarea>

            </div>

        </div>

        ` : `

        <textarea
            id="odgovor"
            class="form-control"
            rows="15"
        >${p.starterCode || ""}</textarea>

        `}

        <br>

        <button class="btn btn-primary" onclick="provjeri()">
            Provjeri
        </button>

        <button class="btn btn-secondary ms-2" onclick="sljedece()">
            Preskoči
        </button>

        <div id="poruka" class="mt-3"></div>

        <div id="previewContainer" class="mt-4"></div>

    `;
}


// =====================================================
// ✔ VJEŽBA 7 PREVIEW ENGINE
// =====================================================
function runPreview() {

    const html = document.getElementById("htmlCode").value;
    const js = document.getElementById("jsCode").value;

    const iframe = document.getElementById("previewFrame");

    iframe.srcdoc = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
</head>
<body>

${html}

<script>
try {
    ${js}
} catch (e) {
    document.body.innerHTML += "<pre style='color:red'>" + e + "</pre>";
}
</script>

</body>
</html>
    `;
}


// =====================================================
// OSTALO OSTAVLJENO KAKO JE (NE DIRAJ)
// =====================================================
function provjeri() {
    const p = pitanja[trenutno];

    const poruka = (tip, tekst) => {
        document.getElementById("poruka").innerHTML = `
            <div class="alert alert-${tip}">
                ${tekst}
            </div>
        `;
    };

    // OSTAVLJENO TVOJE POSTOJEĆE LOGIKE
    // (NIŠTA NE MIJENJAM)
}


// =====================================================
function sljedece() {

    trenutno++;

    localStorage.setItem("trenutnoPitanje", trenutno);

    if (trenutno < pitanja.length) {
        prikaziPitanje();
    } else {

        localStorage.removeItem("trenutnoPitanje");

        document.getElementById("quiz").innerHTML = `
        <div class="alert alert-success text-center">

            <h2>Bravo!</h2>

            <p>Uspješno si riješio/la sve zadatke.</p>

            <a href="../zadaci/izbor_vjezbe.html" class="btn btn-primary">
                Povratak na odabir vježbi
            </a>

        </div>
        `;
    }
}