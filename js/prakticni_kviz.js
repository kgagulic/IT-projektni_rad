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

        // ako netko dođe preko zadnjeg indexa
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






function prikaziPitanje() {

    const p = pitanja[trenutno];

    document.getElementById("quiz").innerHTML = `

        <h2>${p.title}</h2>

        <p>${p.text}</p>

        ${p.image ? `
            <img
                src="${p.image}"
                style="max-width:400px;"
                class="img-fluid mb-3">
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

        <button
            class="btn btn-primary"
            onclick="provjeri()">
            Provjeri
        </button>

        <button
            class="btn btn-secondary ms-2"
            onclick="sljedece()">
            Preskoči
        </button>

        <div id="poruka" class="mt-3"></div>

        <div id="previewContainer" class="mt-4"></div>

    `;
}









function provjeri() {

    const p = pitanja[trenutno];
    const unos = document.getElementById("odgovor").value;
    const css =
    document.getElementById("css")?.value || "";

    let tocno = false;

    const poruka = (tip, tekst) => {
        document.getElementById("poruka").innerHTML = `
            <div class="alert alert-${tip}">
                ${tekst}
            </div>
        `;
    };







    // =====================================================
    // PREVIEW - UVIJEK
    // =====================================================

    const preview = document.getElementById("previewContainer");

    if (p.showPreview) {

       const previewHTML = `
<style>${css}</style>
${unos}
`;

preview.innerHTML = `
    <h5 class="mt-4">
        Pregled rezultata
    </h5>

    <iframe
        style="width:100%;height:250px;border:1px solid #ccc;background:white;"
        srcdoc='${previewHTML.replace(/'/g, "&apos;")}'
    ></iframe>
`;

    } else {
        preview.innerHTML = "";
    }



if (p.requiredCSS) {

    const cssLower = css.toLowerCase();

    let nedostajeCSS = [];

    p.requiredCSS.forEach(selector => {

        if (!cssLower.includes(selector.toLowerCase())) {
            nedostajeCSS.push(selector);
        }

    });

    if (nedostajeCSS.length > 0) {

        poruka(
            "danger",
            "❌ Nedostaje dio CSS-a."
        );

        return;
    }
}




    // =====================================================
    // VIŠE ELEMENATA
    // =====================================================

    if (p.requiredTags) {

        let nedostaje = [];
        let prazno = [];
        let krivo = [];
        let neispravno = [];



        const bodyStart = unos.toLowerCase().indexOf("<body");
        const bodyEnd = unos.toLowerCase().indexOf("</body>");

        if (
            bodyStart === -1 ||
            bodyEnd === -1 ||
            bodyEnd < bodyStart
        ) {
            poruka("danger", "❌ Nedostaje ili je neispravan body.");
            return;
        }

        const bodyContent = unos.substring(bodyStart, bodyEnd + 7);







        p.requiredTags.forEach(tag => {

            const openTag = new RegExp(`<${tag}\\b`, "i");
            const closeTag = new RegExp(`<\\/${tag}>`, "i");



            // HR i BR
            if (tag === "hr" || tag === "br") {

                if (!openTag.test(unos)) {
                    nedostaje.push(tag);
                }

                return;
            }







            if (!openTag.test(unos) || !closeTag.test(unos)) {
                nedostaje.push(tag);
                return;
            }







            if (!openTag.test(bodyContent) || !closeTag.test(bodyContent)) {
                krivo.push(tag);
                return;
            }







            const doc = new DOMParser().parseFromString(unos, "text/html");
            const el = doc.querySelector(tag);

            if (el && el.textContent.trim() === "") {
                prazno.push(tag);
            }







            // LI mora u OL ili UL
            if (tag === "li") {

                const listCheck =
                    /<(ol|ul)[\s\S]*?<li[\s\S]*?<\/li>[\s\S]*?<\/(ol|ul)>/i;

                if (!listCheck.test(unos)) {
                    krivo.push("li");
                }
            }







            // FIGURE
            if (tag === "figcaption") {

                const doc = new DOMParser().parseFromString(unos, "text/html");

                const figure = doc.querySelector("figure");
                const figcaption = doc.querySelector("figcaption");
                const img = figure ? figure.querySelector("img") : null;

                if (!figure || !figcaption || !img) {
                    krivo.push("figure");
                }
            }







            // A mora imati href
            if (tag === "a") {

                const linkCheck =
                    /<a\s+[^>]*href\s*=\s*["'][^"']+["'][^>]*>[\s\S]*?<\/a>/i;

                if (!linkCheck.test(bodyContent)) {
                    neispravno.push("a");
                }
            }

        });







        if (nedostaje.length > 0) {
            poruka("danger", "❌ Netočno. Nedostaju elementi.");
            return;
        }

        if (neispravno.length > 0) {
            poruka("danger", "❌ Element postoji, ali nije ispravno napisan.");
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

        const regex =
            /<html[\s\S]*?<head[\s\S]*?<\/head>[\s\S]*?<body[\s\S]*>[\s\S]*<\/body>[\s\S]*<\/html>/i;

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

        const closing = new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, "i");

        if (!closing.test(unos)) {
            poruka("danger", `❌ Neispravan ili nedostaje </${tag}>`);
            return;
        }

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

        const doc = new DOMParser().parseFromString(unos, "text/html");
        const el = doc.querySelector(tag);

        if (!el || el.textContent.trim() === "") {
            poruka("warning", "⚠ Element nema sadržaj.");
            return;
        }

        tocno = true;
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

    localStorage.setItem("trenutnoPitanje", trenutno);

    if (trenutno < pitanja.length) {
        prikaziPitanje();
    }

    else {

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