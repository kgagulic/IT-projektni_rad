const params = new URLSearchParams(window.location.search);
const set = params.get("set") || "1";

let pitanja = [];

const progressKey = `trenutnoPitanjePrakticni_${set}`;
const answerKey = `odgovoriPrakticni_${set}`;

let trenutno = Number(localStorage.getItem(progressKey)) || 0;
let spremljeniOdgovori = {};

try {
    spremljeniOdgovori =
        JSON.parse(localStorage.getItem(answerKey)) || {};
} catch (greska) {
    spremljeniOdgovori = {};
}


/* =========================================================
   POMOĆNE FUNKCIJE ZA UČITAVANJE PITANJA
========================================================= */

function shuffle(array) {
    const kopija = [...array];

    for (let i = kopija.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [kopija[i], kopija[j]] = [
            kopija[j],
            kopija[i]
        ];
    }

    return kopija;
}

async function ucitajVjezbu(broj) {
    try {
        const odgovor = await fetch(
            `../data/vjezba${broj}.json`
        );

        if (!odgovor.ok) {
            throw new Error(
                `Datoteka vjezba${broj}.json nije dostupna.`
            );
        }

        const tekst = await odgovor.text();

        if (!tekst.trim()) {
            return [];
        }

        const data = JSON.parse(tekst);

        const pitanjaVjezbe = Array.isArray(data)
            ? data
            : data.questions;

        if (!Array.isArray(pitanjaVjezbe)) {
            return [];
        }

        return pitanjaVjezbe.map((pitanje, indeks) => ({
            ...pitanje,
            sourceSet: broj,
            sourceIndex: indeks
        }));
    } catch (greska) {
        console.warn(greska.message);
        return [];
    }
}

async function pokreniKviz() {
    try {
        if (set === "kolokvij1") {
            const grupe = await Promise.all(
                [1, 2, 3, 4].map(ucitajVjezbu)
            );

            pitanja = shuffle(grupe.flat()).slice(0, 10);
        } else if (set === "kolokvij2") {
            const grupe = await Promise.all(
                [5, 6, 7, 8].map(ucitajVjezbu)
            );

            pitanja = shuffle(grupe.flat()).slice(0, 10);
        } else {
            pitanja = await ucitajVjezbu(Number(set));
        }

        if (pitanja.length === 0) {
            throw new Error(
                "Nema dostupnih pitanja za odabranu vježbu."
            );
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


/* =========================================================
   SPREMANJE ODGOVORA
========================================================= */

function dohvatiKljucPitanja(pitanje) {
    const izvor = pitanje.sourceSet ?? set;
    const indeks = pitanje.sourceIndex ?? trenutno;

    return `${izvor}_${indeks}`;
}

function dohvatiSpremljeniOdgovor(pitanje) {
    const kljuc = dohvatiKljucPitanja(pitanje);

    return spremljeniOdgovori[kljuc] || {};
}

function postaviAutomatskoSpremanje() {
    const pitanje = pitanja[trenutno];
    const kljuc = dohvatiKljucPitanja(pitanje);

    const htmlPolje =
        document.getElementById("odgovor") ||
        document.getElementById("htmlCode");

    const cssPolje =
        document.getElementById("css");

    const jsPolje =
        document.getElementById("jsCode");

    function spremiOdgovor() {
        spremljeniOdgovori[kljuc] = {
            html: htmlPolje ? htmlPolje.value : "",
            css: cssPolje ? cssPolje.value : "",
            js: jsPolje ? jsPolje.value : ""
        };

        localStorage.setItem(
            answerKey,
            JSON.stringify(spremljeniOdgovori)
        );
    }

    htmlPolje?.addEventListener("input", spremiOdgovor);
    cssPolje?.addEventListener("input", spremiOdgovor);
    jsPolje?.addEventListener("input", spremiOdgovor);
}


/* =========================================================
   PRIKAZ PITANJA
========================================================= */

function prikaziPitanje() {
    const p = pitanja[trenutno];

    const jeJQueryZadatak =
        Number(p.sourceSet) === 7;

    const spremljeno =
        dohvatiSpremljeniOdgovor(p);

    if (jeJQueryZadatak) {
        document.getElementById("quiz").innerHTML = `
            <h2>
                Pitanje ${trenutno + 1}/${pitanja.length}
            </h2>

            <p>${p.text}</p>

            <h5>Pregled</h5>

            <iframe
                id="previewFrame"
                title="Pregled JavaScript rješenja"
                style="
                    width: 100%;
                    height: 250px;
                    border: 1px solid #ccc;
                ">
            </iframe>

            <div class="row mt-3">
                <div class="col-md-6">
                    <h5>HTML</h5>

                    <textarea
                        id="htmlCode"
                        class="form-control"
                        rows="12"
                    >${spremljeno.html ?? p.starterCode ?? ""}</textarea>
                </div>

                <div class="col-md-6">
                    <h5>JS (jQuery)</h5>

                    <textarea
                        id="jsCode"
                        class="form-control"
                        rows="12"
                    >${spremljeno.js ?? p.starterPreviewJS ?? ""}</textarea>
                </div>
            </div>

            <button
                class="btn btn-primary mt-2"
                onclick="runPreview()">
                Pokreni pregled
            </button>

            <button
                class="btn btn-primary mt-2 ms-2"
                onclick="provjeriJQuery()">
                Provjeri
            </button>

            <button
                class="btn btn-secondary mt-2 ms-2"
                onclick="sljedece()">
                Preskoči
            </button>

            <button
                id="btnDalje"
                class="btn btn-success mt-2 ms-2"
                onclick="sljedece()"
                style="display: none;">
                Dalje
            </button>

            <div id="poruka" class="mt-3"></div>
        `;

        postaviAutomatskoSpremanje();
        return;
    }

    document.getElementById("quiz").innerHTML = `
        <h2>
            Pitanje ${trenutno + 1}/${pitanja.length}
        </h2>

        <p>${p.text}</p>

        ${
            p.image
                ? `
                    <img
                        src="${p.image}"
                        alt="Prikaz zadatka"
                        class="mb-3 ${
                            p.largeImage
                                ? "large-image"
                                : "normal-image"
                        }">
                `
                : ""
        }

        ${
            p.showCSS
                ? `
                    <div class="row">
                        <div class="col-md-6">
                            <h5>HTML</h5>

                            <textarea
                                id="odgovor"
                                class="form-control"
                                rows="15"
                            >${spremljeno.html ?? p.starterCode ?? ""}</textarea>
                        </div>

                        <div class="col-md-6">
                            <h5>CSS</h5>

                            <textarea
                                id="css"
                                class="form-control"
                                rows="15"
                            >${spremljeno.css ?? p.starterCSS ?? ""}</textarea>
                        </div>
                    </div>
                `
                : `
                    <textarea
                        id="odgovor"
                        class="form-control"
                        rows="15"
                    >${spremljeno.html ?? p.starterCode ?? ""}</textarea>
                `
        }

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

        <button
            id="btnDalje"
            class="btn btn-success ms-2"
            onclick="sljedece()"
            style="display: none;">
            Dalje
        </button>

        <div id="poruka" class="mt-3"></div>

        <div
            id="previewContainer"
            class="mt-4">
        </div>
    `;

    postaviAutomatskoSpremanje();
}


/* =========================================================
   PORUKE
========================================================= */

function prikaziPoruku(tip, tekst) {
    const elementPoruke =
        document.getElementById("poruka");

    if (!elementPoruke) {
        return;
    }

    elementPoruke.innerHTML = `
        <div class="alert alert-${tip}">
            ${tekst}
        </div>
    `;
}


/* =========================================================
   JQUERY / JAVASCRIPT PREGLED I PROVJERA
========================================================= */

function runPreview(onLoadCallback = null) {
    const htmlPolje =
        document.getElementById("htmlCode");

    const jsPolje =
        document.getElementById("jsCode");

    const iframe =
        document.getElementById("previewFrame");

    if (!htmlPolje || !jsPolje || !iframe) {
        return;
    }

    const html = htmlPolje.value;
    const js = jsPolje.value;

    if (typeof onLoadCallback === "function") {
        iframe.onload = () => {
            onLoadCallback(iframe);
        };
    } else {
        iframe.onload = null;
    }

    const jsKaoTekst = JSON.stringify(js);

    iframe.srcdoc = `
        <!DOCTYPE html>
        <html lang="hr">
        <head>
            <meta charset="UTF-8">

            <style>
                ${pitanja[trenutno].starterPreviewCSS || ""}
            </style>

            <script
                src="https://code.jquery.com/jquery-3.7.1.min.js">
            <\/script>
        </head>

        <body>
            ${html}

            <script>
                try {
                    const korisnickiKod = ${jsKaoTekst};
                    new Function(korisnickiKod)();
                } catch (greska) {
                    document.body.innerHTML +=
                        "<pre id='jsError' style='color:red'>" +
                        greska.message +
                        "</pre>";
                }
            <\/script>
        </body>
        </html>
    `;
}

function provjeriJQuery() {
    const pitanje = pitanja[trenutno];

    const htmlPolje =
        document.getElementById("htmlCode");

    const jsPolje =
        document.getElementById("jsCode");

    const btnDalje =
        document.getElementById("btnDalje");

    if (!htmlPolje || !jsPolje) {
        prikaziPoruku(
            "danger",
            "Nije moguće provjeriti zadatak."
        );

        return;
    }

    const html = htmlPolje.value.trim();
    const js = jsPolje.value.trim();

    if (btnDalje) {
        btnDalje.style.display = "none";
    }

    if (!html) {
        prikaziPoruku(
            "danger",
            "Nedostaje HTML kod."
        );

        return;
    }

    if (!js) {
        prikaziPoruku(
            "danger",
            "Nisi napisao/la jQuery kod."
        );

        return;
    }

    const pocetniJS =
        (pitanje.starterPreviewJS || "").trim();

    if (js === pocetniJS) {
        prikaziPoruku(
            "danger",
            "Nisi napravio/la nikakvu izmjenu u JavaScript kodu."
        );

        return;
    }

    const pravila = pitanje.requiredJSON;

    if (!pravila || !pravila.selector) {
        prikaziPoruku(
            "danger",
            "Za ovo pitanje nisu definirana pravila provjere."
        );

        return;
    }

    prikaziPoruku(
        "info",
        "Provjera rješenja je u tijeku..."
    );

    runPreview((iframe) => {
        setTimeout(() => {
            try {
                const iframeDocument =
                    iframe.contentDocument;

                const iframeWindow =
                    iframe.contentWindow;

                const jsGreska =
                    iframeDocument.getElementById("jsError");

                if (jsGreska) {
                    prikaziPoruku(
                        "danger",
                        `JavaScript pogreška: ${jsGreska.textContent}`
                    );

                    return;
                }

                const ciljniElement =
                    iframeDocument.querySelector(
                        pravila.selector
                    );

                if (!ciljniElement) {
                    prikaziPoruku(
                        "danger",
                        `Nije pronađen element ${pravila.selector}.`
                    );

                    return;
                }

                const selektorPokretaca =
                    pravila.triggerSelector || null;

                if (selektorPokretaca) {

                    const pokretac =
                        iframeDocument.querySelector(
                            selektorPokretaca
                        );

                    if (!pokretac) {
                        prikaziPoruku(
                            "danger",
                            `Nije pronađen element ${selektorPokretaca} koji pokreće promjenu.`
                        );

                        return;
                    }

                    pokretac.click();
}

                setTimeout(() => {
                    const stil =
                        iframeWindow.getComputedStyle(
                            ciljniElement
                        );

                    const rezultat =
                        provjeriRequiredJSON(
                            iframeDocument,
                            ciljniElement,
                            stil,
                            pravila
                        );

                    if (!rezultat.tocno) {
                        prikaziPoruku(
                            "danger",
                            rezultat.poruka
                        );

                        return;
                    }

                    prikaziPoruku(
                        "success",
                        "Točno! Rješenje radi kako je zadano."
                    );

                    if (btnDalje) {
                        btnDalje.style.display =
                            "inline-block";
                    }
                }, 250);
            } catch (greska) {
                console.error(greska);

                prikaziPoruku(
                    "danger",
                    "Kod nije moguće ispravno izvršiti. Provjeri JavaScript sintaksu."
                );
            }
        }, 300);
    });
}

function provjeriRequiredJSON(
    dokument,
    element,
    stil,
    pravila
) {
    const preskoci = [
        "selector",
        "triggerSelector",
        "event"
    ];

    for (const [svojstvo, ocekivanaVrijednost] of
        Object.entries(pravila)) {

        if (preskoci.includes(svojstvo)) {
            continue;
        }

        if (svojstvo === "backgroundColor") {
            const stvarnaBoja =
                normalizirajBoju(
                    dokument,
                    stil.backgroundColor
                );

            const ocekivanaBoja =
                normalizirajBoju(
                    dokument,
                    ocekivanaVrijednost
                );

            if (stvarnaBoja !== ocekivanaBoja) {
                return {
                    tocno: false,
                    poruka:
                        `Netočno. Element ${pravila.selector} nema očekivanu boju pozadine.`
                };
            }

            continue;
        }

        if (svojstvo === "color") {
            const stvarnaBoja =
                normalizirajBoju(
                    dokument,
                    stil.color
                );

            const ocekivanaBoja =
                normalizirajBoju(
                    dokument,
                    ocekivanaVrijednost
                );

            if (stvarnaBoja !== ocekivanaBoja) {
                return {
                    tocno: false,
                    poruka:
                        `Netočno. Element ${pravila.selector} nema očekivanu boju teksta.`
                };
            }

            continue;
        }

        if (svojstvo === "text") {
            if (
                element.textContent.trim() !==
                String(ocekivanaVrijednost).trim()
            ) {
                return {
                    tocno: false,
                    poruka:
                        `Netočno. Element ${pravila.selector} nema očekivani tekst.`
                };
            }

            continue;
        }

        if (svojstvo === "class") {
            if (
                !element.classList.contains(
                    String(ocekivanaVrijednost)
                )
            ) {
                return {
                    tocno: false,
                    poruka:
                        `Netočno. Elementu ${pravila.selector} nedostaje očekivana klasa.`
                };
            }

            continue;
        }

        if (svojstvo === "display") {
            if (
                stil.display !==
                String(ocekivanaVrijednost)
            ) {
                return {
                    tocno: false,
                    poruka:
                        `Netočno. Element ${pravila.selector} nema očekivani prikaz.`
                };
            }

            continue;
        }

        const stvarnaVrijednost =
            stil[svojstvo] ??
            element[svojstvo];

        if (
            String(stvarnaVrijednost).trim() !==
            String(ocekivanaVrijednost).trim()
        ) {
            return {
                tocno: false,
                poruka:
                    `Netočno. Svojstvo "${svojstvo}" nema očekivanu vrijednost.`
            };
        }
    }

    return {
        tocno: true
    };
}

function normalizirajBoju(dokument, boja) {
    const element =
        dokument.createElement("span");

    element.style.color = boja;
    element.style.display = "none";

    dokument.body.appendChild(element);

    const normalizirana =
        dokument.defaultView
            .getComputedStyle(element)
            .color;

    element.remove();

    return normalizirana;
}


/* =========================================================
   HTML PROVJERE
========================================================= */

function pronadiBodySadrzaj(html) {
    const bodyMatch = html.match(
        /<body\b[^>]*>([\s\S]*?)<\/body>/i
    );

    return bodyMatch
        ? bodyMatch[1]
        : null;
}

function napraviDokument(html) {
    const parser = new DOMParser();

    return parser.parseFromString(
        `<body>${html}</body>`,
        "text/html"
    );
}

function provjeriBodyElement(html) {
    const otvaranjeBody =
        html.search(/<body\b[^>]*>/i);

    const zatvaranjeBody =
        html.search(/<\/body\s*>/i);

    const otvaranjeHtml =
        html.search(/<html\b[^>]*>/i);

    const zatvaranjeHead =
        html.search(/<\/head\s*>/i);

    const zatvaranjeHtml =
        html.search(/<\/html\s*>/i);

    if (
        otvaranjeBody === -1 ||
        zatvaranjeBody === -1
    ) {
        return {
            tocno: false,
            poruka:
                "Netočno. Nedostaje ispravno otvoren i zatvoren element."
        };
    }

    if (
        otvaranjeHtml !== -1 &&
        otvaranjeBody < otvaranjeHtml
    ) {
        return {
            tocno: false,
            poruka:
                "Element postoji, ali nije na ispravnom mjestu."
        };
    }

    if (
        zatvaranjeHead !== -1 &&
        otvaranjeBody < zatvaranjeHead
    ) {
        return {
            tocno: false,
            poruka:
                "Element nije na ispravnom mjestu."
        };
    }

    if (zatvaranjeBody < otvaranjeBody) {
        return {
            tocno: false,
            poruka:
                "Završna oznaka nije na ispravnom mjestu."
        };
    }

    if (
        zatvaranjeHtml !== -1 &&
        zatvaranjeBody > zatvaranjeHtml
    ) {
        return {
            tocno: false,
            poruka:
                "Element nije na ispravnom mjestu."
        };
    }

    return {
        tocno: true
    };
}

function provjeriZatvaranjeTagova(html) {
    const voidTagovi = [
        "area",
        "base",
        "br",
        "col",
        "embed",
        "hr",
        "img",
        "input",
        "link",
        "meta",
        "param",
        "source",
        "track",
        "wbr"
    ];

    const regex =
        /<\/?([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*>/g;

    const stack = [];
    let match;

    while ((match = regex.exec(html)) !== null) {
        const cijeliTag = match[0];
        const naziv = match[1].toLowerCase();

        if (cijeliTag.startsWith("<!")) {
            continue;
        }

        if (voidTagovi.includes(naziv)) {
            continue;
        }

        if (cijeliTag.endsWith("/>")) {
            continue;
        }

        if (cijeliTag.startsWith("</")) {
            if (stack.length === 0) {
                return {
                    tocno: false,
                    poruka:
                        `Element nije ispravno napisan.`
                };
            }

            const zadnjiOtvoreni =
                stack[stack.length - 1];

            if (zadnjiOtvoreni !== naziv) {
                return {
                    tocno: false,
                    poruka:
                        `Element nije ispravno zatvoren.`
                };
            }

            stack.pop();
        } else {
            stack.push(naziv);
        }
    }

    if (stack.length > 0) {
        const nezatvoreniTag =
            stack[stack.length - 1];

        return {
            tocno: false,
            poruka:
                `Element nije zatvoren.`
        };
    }

    return {
        tocno: true
    };
}

function provjeriHTML(pitanje, html) {
    if (!html.trim()) {
        return {
            tocno: false,
            poruka:
                "Nisi upisao/la nikakav HTML kod."
        };
    }

    const rezultatTagova =
        provjeriZatvaranjeTagova(html);

    if (!rezultatTagova.tocno) {
        return rezultatTagova;
    }

    const trazeniTagovi = [
        ...(pitanje.requiredTag
            ? [pitanje.requiredTag]
            : []),

        ...(pitanje.requiredTags || [])
    ];

    const starterCode =
        pitanje.starterCode || "";

    const jeCijeliDokument =
        /<html\b/i.test(starterCode) ||
        /<body\b/i.test(starterCode);

    if (trazeniTagovi.includes("body")) {
        const rezultatBodyja =
            provjeriBodyElement(html);

        if (!rezultatBodyja.tocno) {
            return rezultatBodyja;
        }
    }

    let kodZaProvjeru = html;

    if (jeCijeliDokument) {
        const bodySadrzaj =
            pronadiBodySadrzaj(html);

        if (bodySadrzaj === null) {
            return {
                tocno: false,
                poruka:
                    "U HTML dokumentu nedostaje ispravan element."
            };
        }

        kodZaProvjeru = bodySadrzaj;
    }

    const dokument =
        napraviDokument(kodZaProvjeru);

    for (const tag of trazeniTagovi) {
        if (tag === "body") {
            continue;
        }

        const element =
            dokument.body.querySelector(tag);

        if (!element) {
            const postojiNegdjeUKodu =
                new RegExp(
                    `<${tag}\\b`,
                    "i"
                ).test(html);

            if (
                jeCijeliDokument &&
                postojiNegdjeUKodu
            ) {
                return {
                    tocno: false,
                    poruka:
                        `Element postoji, ali nije na ispravnom mjestu.`
                };
            }

            return {
                tocno: false,
                poruka:
                    `Netočno. Koristi ispravan element.`
            };
        }
    }

    const neprazniTagovi =
        pitanje.requiredNonEmptyTags ||
        trazeniTagovi.filter(
            tag => tag !== "body"
        );

    for (const tag of neprazniTagovi) {
        const elementi = [
            ...dokument.body.querySelectorAll(tag)
        ];

        const postojiNeprazanElement =
            elementi.some(
                element =>
                    element.textContent.trim() !== ""
            );

        if (!postojiNeprazanElement) {
            return {
                tocno: false,
                poruka:
                    `Element postoji, ali nema sadržaja.`
            };
        }
    }

    const trazeneKlase =
        pitanje.requiredClasses || [];

    for (const nazivKlase of trazeneKlase) {
        const postojiKlasa = [
            ...dokument.body.querySelectorAll("*")
        ].some(element =>
            element.classList.contains(nazivKlase)
        );

        if (!postojiKlasa) {
            const postojiNegdjeUKodu =
                new RegExp(
                    `class\\s*=\\s*["'][^"']*\\b${nazivKlase}\\b`,
                    "i"
                ).test(html);

            if (
                jeCijeliDokument &&
                postojiNegdjeUKodu
            ) {
                return {
                    tocno: false,
                    poruka:
                        `Klasa postoji, ali element nije na ispravnom mjestu.`
                };
            }

            return {
                tocno: false,
                poruka:
                    `Netočno. Nedostaje obavezna klasa.`
            };
        }
    }

    return {
        tocno: true
    };
}


/* =========================================================
   CSS PROVJERA
========================================================= */

function normalizirajCSS(tekst) {
    return String(tekst)
        .toLowerCase()
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\s+/g, "")
        .replace(/;}/g, "}")
        .replace(/;/g, "");
}

function provjeriCSS(pitanje, css) {
    if (!pitanje.showCSS) {
        return {
            tocno: true
        };
    }

    if (!css.trim()) {
        return {
            tocno: false,
            poruka:
                "Nisi upisao/la CSS kod."
        };
    }

    const trazenaPravila =
        pitanje.requiredCSS || [];

    if (
        Array.isArray(trazenaPravila) &&
        trazenaPravila.length === 0
    ) {
        return {
            tocno: true
        };
    }

    const normaliziraniCSS =
        normalizirajCSS(css);

    if (Array.isArray(trazenaPravila)) {
        for (const pravilo of trazenaPravila) {
            const normaliziranoPravilo =
                normalizirajCSS(pravilo);

            if (
                !normaliziraniCSS.includes(
                    normaliziranoPravilo
                )
            ) {
                return {
                    tocno: false,
                    poruka:
                        `Netočno. U CSS-u nedostaje traženo.`
                };
            }
        }

        return {
            tocno: true
        };
    }

    if (
        typeof trazenaPravila === "object" &&
        trazenaPravila !== null
    ) {
        for (const [selektor, pravila] of
            Object.entries(trazenaPravila)) {

            if (
                typeof pravila !== "object" ||
                pravila === null
            ) {
                continue;
            }

            const selektorRegex =
                new RegExp(
                    `${escapeRegex(selektor)}\\s*\\{([^}]*)\\}`,
                    "i"
                );

            const podudaranje =
                css.match(selektorRegex);

            if (!podudaranje) {
                return {
                    tocno: false,
                    poruka:
                        `Netočno. U CSS-u nedostaje selektor.`
                };
            }

            const sadrzajPravila =
                normalizirajCSS(podudaranje[1]);

            for (const [svojstvo, vrijednost] of
                Object.entries(pravila)) {

                const trazeno =
                    normalizirajCSS(
                        `${svojstvo}:${vrijednost}`
                    );

                if (!sadrzajPravila.includes(trazeno)) {
                    return {
                        tocno: false,
                        poruka:
                            `Netočno.`
                    };
                }
            }
        }
    }

    return {
        tocno: true
    };
}

function escapeRegex(tekst) {
    return String(tekst).replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
}


/* =========================================================
   HTML I CSS PREGLED
========================================================= */

function prikaziPreview(html, css = "") {
    const previewContainer =
        document.getElementById(
            "previewContainer"
        );

    if (!previewContainer) {
        return;
    }

    previewContainer.innerHTML = `
        <h5>Pregled rješenja</h5>

        <iframe
            id="htmlPreview"
            title="Pregled HTML i CSS rješenja"
            style="
                width: 100%;
                height: 300px;
                border: 1px solid #ccc;
            ">
        </iframe>
    `;

    const iframe =
        document.getElementById("htmlPreview");

    const jeCijeliDokument =
        /<html\b/i.test(html);

    if (
        jeCijeliDokument &&
        /<\/head>/i.test(html)
    ) {
        iframe.srcdoc = html.replace(
            /<\/head>/i,
            `<style>${css}</style></head>`
        );
    } else {
        iframe.srcdoc = `
            <!DOCTYPE html>
            <html lang="hr">
            <head>
                <meta charset="UTF-8">
                <style>${css}</style>
            </head>

            <body>
                ${html}
            </body>
            </html>
        `;
    }
}


/* =========================================================
   GLAVNA PROVJERA HTML/CSS ZADATAKA
========================================================= */

function provjeri() {
    const pitanje = pitanja[trenutno];

    const htmlElement =
        document.getElementById("odgovor");

    const cssElement =
        document.getElementById("css");

    const btnDalje =
        document.getElementById("btnDalje");

    const html = htmlElement
        ? htmlElement.value
        : "";

    const css = cssElement
        ? cssElement.value
        : "";

    if (btnDalje) {
        btnDalje.style.display = "none";
    }

    const pocetniHTML =
        pitanje.starterCode || "";

    const pocetniCSS =
        pitanje.starterCSS || "";

    const htmlNijePromijenjen =
        html.trim() === pocetniHTML.trim();

    const cssNijePromijenjen =
        css.trim() === pocetniCSS.trim();

    if (
        htmlNijePromijenjen &&
        (!pitanje.showCSS || cssNijePromijenjen)
    ) {
        prikaziPoruku(
            "danger",
            "Nisi napravio/la nikakvu izmjenu."
        );

        return;
    }

    const rezultatHTML =
        provjeriHTML(pitanje, html);

    if (!rezultatHTML.tocno) {
        prikaziPoruku(
            "danger",
            rezultatHTML.poruka
        );

        return;
    }

    const rezultatCSS =
        provjeriCSS(pitanje, css);

    if (!rezultatCSS.tocno) {
        prikaziPoruku(
            "danger",
            rezultatCSS.poruka
        );

        return;
    }

    if (pitanje.showCSS) {
        prikaziPreview(html, css);
    }

    prikaziPoruku(
        "success",
        "Točno! Rješenje je ispravno."
    );

    if (btnDalje) {
        btnDalje.style.display =
            "inline-block";
    }
}


/* =========================================================
   IZLAZAK I SLJEDEĆE PITANJE
========================================================= */

function napustiVjezbu() {
    localStorage.removeItem(progressKey);
    localStorage.removeItem(answerKey);

    spremljeniOdgovori = {};
}

function sljedece() {
    trenutno++;

    localStorage.setItem(
        progressKey,
        trenutno
    );

    if (trenutno < pitanja.length) {
        prikaziPitanje();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

        return;
    }

    localStorage.removeItem(progressKey);
    localStorage.removeItem(answerKey);

    spremljeniOdgovori = {};

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
