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
            <img src="${p.image}" style="max-width:400px;" class="img-fluid mb-3">
        ` : ""}

        <textarea id="odgovor" class="form-control" rows="15">${p.starterCode || ""}</textarea>

        <br>

        <button class="btn btn-primary" onclick="provjeri()">Provjeri</button>

        <div id="poruka" class="mt-3"></div>

        <div id="previewContainer"></div>
    `;
}







function provjeri() {

    const p = pitanja[trenutno];
    const unos = document.getElementById("odgovor").value;

    let tocno = false;

    const poruka = (tip, tekst) => {
        document.getElementById("poruka").innerHTML = `
            <div class="alert alert-${tip}">
                ${tekst}
            </div>
        `;
    };





    // =====================================================
    // VIŠE ELEMENATA (requiredTags)
    // =====================================================

    if (p.requiredTags) {

        let nedostaje = [];
        let prazno = [];
        let krivo = [];



        // BODY granice (RAW STRING)
        const bodyStart = unos.toLowerCase().indexOf("<body");
        const bodyEnd = unos.toLowerCase().indexOf("</body>");

        if (bodyStart === -1 || bodyEnd === -1 || bodyEnd < bodyStart) {
            poruka("danger", "❌ Nedostaje ili je neispravan body.");
            return;
        }

        const bodyContent = unos.substring(bodyStart, bodyEnd + 7);




        p.requiredTags.forEach(tag => {

            const openTag = new RegExp(`<${tag}\\b`, "i");
            const closeTag = new RegExp(`<\\/${tag}>`, "i");



            // 1. mora postojati i opening i closing tag
            if (!openTag.test(unos) || !closeTag.test(unos)) {
                nedostaje.push(tag);
                return;
            }



            // 2. mora biti unutar body STRINGA
            if (!openTag.test(bodyContent) || !closeTag.test(bodyContent)) {
                krivo.push(tag);
                return;
            }



            // 3. provjera praznog sadržaja (DOM safe)
            const doc = new DOMParser().parseFromString(unos, "text/html");
            const el = doc.querySelector(tag);

            if (el && el.textContent.trim() === "") {
                prazno.push(tag);
            }



            // 4. LI mora biti unutar OL
            if (tag === "li") {

                const olCheck = /<ol[\s\S]*?<li[\s\S]*?<\/li>[\s\S]*?<\/ol>/i;

                if (!olCheck.test(unos)) {
                    krivo.push("li");
                }
            }

        });




        if (nedostaje.length > 0) {
            poruka("danger", "❌ Netočno. Provjeri koristiš li sve potrebne elemente.");
            return;
        }

        if (prazno.length > 0) {
            poruka("warning", "⚠ Element postoji, ali nema sadržaj.");
            return;
        }

        if (krivo.length > 0) {
            poruka("warning", "⚠ Element nije na ispravnom mjestu.");
            return;
        }

        tocno = true;
    }







    // =====================================================
    // BODY
    // =====================================================

    else if (p.requiredTag === "body") {

        const regex = /<html[\s\S]*?<head[\s\S]*?<\/head>[\s\S]*?<body[\s\S]*>[\s\S]*<\/body>[\s\S]*<\/html>/i;

        if (regex.test(unos)) {
            tocno = true;
        } else {
            poruka("danger", "❌ Netočno.");
            return;
        }
    }







    // =====================================================
    // P / H1 / PRE
    // =====================================================

    else if (
        p.requiredTag === "p" ||
        p.requiredTag === "h1" ||
        p.requiredTag === "pre"
    ) {

        const tag = p.requiredTag;



        // mora postojati ispravan closing tag
        const closing = new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, "i");

        if (!closing.test(unos)) {
            poruka("danger", `❌ Neispravan ili nedostaje </${tag}>`);
            return;
        }



        // mora biti unutar body (RAW STRING provjera)
        const bodyStart = unos.toLowerCase().indexOf("<body");
        const bodyEnd = unos.toLowerCase().indexOf("</body>");

        if (bodyStart === -1 || bodyEnd === -1) {
            poruka("danger", "❌ Nedostaje body.");
            return;
        }

        const bodyContent = unos.substring(bodyStart, bodyEnd + 7);

        if (!new RegExp(`<${tag}\\b`, "i").test(bodyContent)) {
            poruka("warning", "⚠ Element nije unutar body.");
            return;
        }



        // prazno?
        const doc = new DOMParser().parseFromString(unos, "text/html");
        const el = doc.querySelector(tag);

        if (!el || el.textContent.trim() === "") {
            poruka("warning", "⚠ Element nema sadržaj.");
            return;
        }



        tocno = true;
    }







    // =====================================================
    // PREVIEW
    // =====================================================

    const preview = document.getElementById("previewContainer");

    if (p.showPreview) {

        preview.innerHTML = `
            <h5 class="mt-4">Pregled rezultata</h5>

            <iframe
                style="width:100%;height:250px;border:1px solid #ccc;background:white;"
                srcdoc="${unos.replace(/"/g,'&quot;')}">
            </iframe>
        `;

    } else {
        preview.innerHTML = "";
    }







    // =====================================================
    // REZULTAT
    // =====================================================

    if (tocno) {

        document.getElementById("poruka").innerHTML = `
            <div class="alert alert-success">
                ✔ Točan odgovor!
            </div>

            <button class="btn btn-success" onclick="sljedece()">
                Dalje
            </button>
        `;

    } else {

        poruka("danger", "❌ Netočno.");
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
                <p>Uspješno si riješio/la sve zadatke.</p>

                <a href="../zadaci/izbor_vjezbe.html" class="btn btn-primary">
                    Povratak na odabir vježbi
                </a>
            </div>
        `;
    }
}