const params = new URLSearchParams(window.location.search);
const set = params.get("set") || "1";

let pitanja = [];
const progressKey = `trenutnoPitanjePrakticni_${set}`;
let trenutno = Number(localStorage.getItem(progressKey)) || 0;

function shuffle(array) {
    const kopija = [...array];

    for (let i = kopija.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [kopija[i], kopija[j]] = [kopija[j], kopija[i]];
    }

    return kopija;
}

async function ucitajVjezbu(broj) {
    try {
        const odgovor = await fetch(`../data/vjezba${broj}.json`);

        if (!odgovor.ok) {
            throw new Error(`Datoteka vjezba${broj}.json nije dostupna.`);
        }

        const tekst = await odgovor.text();

        if (!tekst.trim()) {
            return [];
        }

        const data = JSON.parse(tekst);
        const pitanjaVjezbe = Array.isArray(data) ? data : data.questions;

        if (!Array.isArray(pitanjaVjezbe)) {
            return [];
        }

        return pitanjaVjezbe.map(pitanje => ({
            ...pitanje,
            sourceSet: broj
        }));
    } catch (greska) {
        console.warn(greska.message);
        return [];
    }
}

async function pokreniKviz() {
    try {
        if (set === "kolokvij1") {
            const grupe = await Promise.all([1, 2, 3, 4].map(ucitajVjezbu));
            pitanja = shuffle(grupe.flat()).slice(0, 10);
        } else if (set === "kolokvij2") {
            const grupe = await Promise.all([5, 6, 7, 8].map(ucitajVjezbu));
            pitanja = shuffle(grupe.flat()).slice(0, 10);
        } else {
            pitanja = await ucitajVjezbu(Number(set));
        }

        if (pitanja.length === 0) {
            throw new Error("Nema dostupnih pitanja za odabranu vježbu.");
        }

        if (trenutno >= pitanja.length) {
            trenutno = 0;
            localStorage.setItem(progressKey, "0");
        }

        prikaziPitanje();
    } catch (greska) {
        document.getElementById("quiz").innerHTML = `
            <div class="alert alert-danger">
                Greška pri učitavanju vježbe.
            </div>
        `;

        console.error(greska);
    }
}

pokreniKviz();

function prikaziPitanje() {
    const p = pitanja[trenutno];
    const jeJQueryZadatak = Number(p.sourceSet) === 7;
    const naslovPitanja = `Pitanje ${trenutno + 1}/${pitanja.length}`;

    if (jeJQueryZadatak) {
        document.getElementById("quiz").innerHTML = `
            <h2>Pitanje ${trenutno + 1}/${pitanja.length}</h2>
            <p>${p.text}</p>

            <h5>Preview</h5>

            <iframe id="previewFrame"
                style="width:100%;height:250px;border:1px solid #ccc;">
            </iframe>

            <div class="row mt-3">
                <div class="col-md-6">
                    <h5>HTML</h5>
                    <textarea id="htmlCode" class="form-control" rows="12">${p.starterCode || ""}</textarea>
                </div>

                <div class="col-md-6">
                    <h5>JS (jQuery / query)</h5>
                    <textarea id="jsCode" class="form-control" rows="12">${p.starterPreviewJS || ""}</textarea>
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

    document.getElementById("quiz").innerHTML = `
        <h2>Pitanje ${trenutno + 1}/${pitanja.length}</h2>
        <p>${p.text}</p>

        ${p.image ? `
            <img
                src="${p.image}"
                alt="Prikaz zadatka"
                class="mb-3 ${p.largeImage ? "large-image" : "normal-image"}">
        ` : ""}

        ${p.showCSS ? `
            <div class="row">
                <div class="col-md-6">
                    <h5>HTML</h5>
                    <textarea id="odgovor" class="form-control" rows="15">${p.starterCode || ""}</textarea>
                </div>

                <div class="col-md-6">
                    <h5>CSS</h5>
                    <textarea id="css" class="form-control" rows="15">${p.starterCSS || ""}</textarea>
                </div>
            </div>
        ` : `
            <textarea id="odgovor" class="form-control" rows="15">${p.starterCode || ""}</textarea>
        `}

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

function runPreview() {
    const html = document.getElementById("htmlCode").value;
    const js = document.getElementById("jsCode").value;
    const iframe = document.getElementById("previewFrame");

    iframe.srcdoc = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"><\/script>
</head>
<body>
${html}
<script>
try {
    ${js}
} catch (e) {
    document.body.innerHTML += "<pre style='color:red'>" + e + "</pre>";
}
<\/script>
</body>
</html>`;
}

function provjeri() {
    const poruka = (tip, tekst) => {
        document.getElementById("poruka").innerHTML = `
            <div class="alert alert-${tip}">
                ${tekst}
            </div>
        `;
    };

    poruka("info", "Odgovor je spremljen. Možeš nastaviti na sljedeći zadatak.");
}

function sljedece() {
    trenutno++;
    localStorage.setItem(progressKey, trenutno);

    if (trenutno < pitanja.length) {
        prikaziPitanje();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
    }

    localStorage.removeItem(progressKey);

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
