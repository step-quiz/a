/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/targeta-paraula.js
 * ROL: «Aprèn la paraula» (PR 7): un toc (o Intro o Espai) a una paraula amb
 *      imatge —la «píndola» de paraula(), js/lexicon/paraula.js— obre una
 *      targeta amb la imatge gran i la paraula, sense àudio (D8: la professora
 *      és qui la pronuncia).
 *      · Funciona amb qualsevol píndola de la pàgina, també les que hi surtin
 *        més tard: els esdeveniments són a document, no a cada píndola.
 *      · La targeta és un <dialog> natiu i modal: es tanca amb OK, amb Esc o
 *        tocant fora, i el focus hi entra i en torna.
 *      · Mentre és oberta, cap tecla no arriba al joc: Intro a «OK» no ha
 *        d'enviar la resposta que hi ha escrita.
 *      · Distintiu de «paraula nova»: la píndola d'una paraula que l'alumne
 *        encara no ha obert porta la classe .paraula-nova (vora d'un altre color
 *        i un punt). En obrir-ne la targeta, desapareix, i es recorda al
 *        navegador (localStorage) per a les visites següents.
 *      Els estils són a css/shared.css (.targeta-paraula, .paraula-nova).
 *      El contingut de la targeta i les paraules vistes són a
 *      js/lexicon/targeta.js (sense DOM, es prova des de Node).
 * DEPENDÈNCIES: lexicon/targeta.js, textos.js. Es posa en marxa des de
 *      injectSharedHTML() (game-core.js), per a totes les activitats del motor nou.
 * ============================================================================
 */
import { contingutTargeta, crearVistes } from './lexicon/targeta.js';
import { TEXTOS_COMUNS } from './textos.js';

/** Una píndola de paraula que es pot tocar: les que tenen imatge (vegeu paraula()). */
const PINDOLA = '.paraula[role="button"][data-paraula]';

let engegat = false;

/** localStorage, o null si el navegador no el deixa fer servir (mode privat, dades bloquejades). */
function emmagatzematge() {
    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

/** Crea la targeta i posa en marxa els esdeveniments i el distintiu. Només s'executa una vegada. */
export function initTargetaParaula() {
    if (engegat || !document.body) return;
    engegat = true;
    const vistes = crearVistes(emmagatzematge());

    const targeta = document.createElement('dialog');
    targeta.className = 'targeta-paraula';
    targeta.setAttribute('aria-labelledby', 'targeta-paraula-nom');
    targeta.innerHTML =
        '<div class="targeta-img" aria-hidden="true"></div>' +
        '<p class="targeta-nom" id="targeta-paraula-nom"></p>' +
        '<p class="targeta-plural"></p>' +
        `<button type="button" class="btn-submit targeta-ok">${TEXTOS_COMUNS.targetaOk}</button>`;
    document.body.appendChild(targeta);
    const imatge = targeta.querySelector('.targeta-img');
    const nom = targeta.querySelector('.targeta-nom');
    const plural = targeta.querySelector('.targeta-plural');

    // El camp on l'alumne escrivia abans de tocar la paraula: en tancar la targeta, hi torna
    let campAnterior = null;

    const marcaNoves = () => {
        for (const p of document.querySelectorAll(PINDOLA))
            p.classList.toggle('paraula-nova', vistes.esNova(p.dataset.paraula));
    };

    function obre(id) {
        if (targeta.open) return;
        const c = contingutTargeta(id);
        imatge.innerHTML = c.imatge;
        nom.textContent = c.nom;
        plural.textContent = c.plural;
        plural.hidden = !c.plural;
        vistes.marca(id);
        marcaNoves();
        if (typeof targeta.showModal === 'function') targeta.showModal();
        else targeta.setAttribute('open', ''); // navegador molt antic: sense mode modal, però es veu
    }

    // Toc o clic a una píndola. Abans que el focus se'n vagi a la píndola, es recorda el camp on s'escrivia
    // (només amb un toc a una píndola: els tocs a dins de la targeta no l'han d'esborrar)
    document.addEventListener(
        'pointerdown',
        e => {
            if (!(e.target.closest && e.target.closest(PINDOLA))) return;
            const actiu = document.activeElement;
            campAnterior = actiu && actiu.matches('input, textarea, select') ? actiu : null;
        },
        true
    );
    document.addEventListener('click', e => {
        const p = e.target.closest && e.target.closest(PINDOLA);
        if (p) obre(p.dataset.paraula);
    });

    // Teclat: Intro o Espai a una píndola l'obre. Es mira en la fase de captura perquè el joc no vegi la tecla:
    // el seu Intro (a document) enviaria la resposta. El mateix a dins de la targeta.
    document.addEventListener(
        'keydown',
        e => {
            if (targeta.contains(e.target)) {
                e.stopPropagation();
                return;
            }
            const p = e.target.closest && e.target.closest(PINDOLA);
            if (p && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                e.stopPropagation();
                campAnterior = null;
                obre(p.dataset.paraula);
            }
        },
        true
    );

    // Tancar: el botó OK, tocar fora de la targeta (Esc ho fa el navegador)
    targeta.querySelector('.targeta-ok').addEventListener('click', () => targeta.close());
    targeta.addEventListener('click', e => {
        if (e.target !== targeta) return;
        const r = targeta.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) targeta.close();
    });
    targeta.addEventListener('close', () => {
        imatge.innerHTML = '';
        if (campAnterior && campAnterior.isConnected) campAnterior.focus();
        campAnterior = null;
    });

    // Distintiu «paraula nova»: a les píndoles que hi ha i a les que surtin (l'ajuda, una pregunta nova…)
    new MutationObserver(marcaNoves).observe(document.body, { childList: true, subtree: true });
    marcaNoves();
}
