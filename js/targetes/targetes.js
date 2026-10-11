/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/targetes/targetes.js
 * ROL: «Targetes de vocabulari» (targetes.html): una eina del professorat per
 *      imprimir les paraules del banc del lèxic (imatge + paraula) com a
 *      targetes, per penjar a l'aula, per fer jocs d'aparellar o per fer
 *      targetes de doble cara (la imatge al davant i la paraula al darrere). Es
 *      tria què s'imprimeix (els temes, quantes targetes per pàgina, què porten
 *      i si va en blanc i negre o en color) i es veu a l'instant com quedarà; el
 *      que es tria queda a la URL, perquè el professorat se'n pugui desar o
 *      passar l'enllaç. No es guarda res ni s'envia res enlloc.
 *      No és una activitat: no fa servir el motor (game-core.js).
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa generador.js
 *      (la lògica) i vista.js (l'HTML); els estils són a css/targetes.css.
 * ============================================================================
 */
import { llegeixParametres, pagines, queryDe, resum, targetesDe, temesDelBanc } from './generador.js';
import { htmlPagina, htmlTema, textResum } from './vista.js';

const $ = id => document.getElementById(id);

/** El que s'ha triat: els temes, les targetes per pàgina, el contingut i el color (comença amb el que diu la URL). */
const estat = llegeixParametres(new URLSearchParams(window.location.search));

/** Les opcions que hi ha al formulari, passades a `estat`. */
function llegeix() {
    estat.temes = [...document.querySelectorAll('input[name="tema"]:checked')].map(i => i.value);
    for (const nom of ['mida', 'contingut', 'color']) {
        estat[nom] = document.querySelector(`input[name="${nom}"]:checked`).value;
    }
    estat.mida = Number(estat.mida);
}

// ── L'AJUST DE LA PARAULA ────────────────────────────────────────────────────
// Una paraula llarga («proporcionalitat») no cap amb la lletra de les curtes. Es mesura quant ocupa, en «em», el seu tros
// més llarg (amb la lletra que té de debò el navegador) i el CSS en treu la mida que hi cap (css/targetes.css, --w). Així
// no depèn de la lletra de cada ordinador i no es parteix cap paraula; i el mínim de 14 pt del paper es compleix (el prova
// tests/navegador/targetes.test.js).

const mesura = document.createElement('canvas').getContext('2d');
const mesurats = new Map();

/** L'amplada, en «em», del tros més llarg d'un text (les paraules se separen per espais). */
function ampleEm(text) {
    if (!mesurats.has(text)) {
        mesurats.set(text, Math.max(...text.split(/\s+/).map(tros => mesura.measureText(tros).width)) / 100);
    }
    return mesurats.get(text);
}

/** Posa a cada paraula de les targetes l'amplada del seu tros més llarg (la variable --w del CSS). */
function ajustaParaules() {
    const primera = document.querySelector('.targeta-mot');
    if (!primera) return;
    const estil = getComputedStyle(primera);
    mesura.font = `${estil.fontWeight} 100px ${estil.fontFamily}`;
    mesurats.clear();
    document
        .querySelectorAll('.targeta-mot')
        .forEach(el => el.style.setProperty('--w', ampleEm(el.textContent).toFixed(3)));
}

// ── PINTAR ───────────────────────────────────────────────────────────────────

/** Pinta les pàgines, el resum i el botó d'imprimir, i deixa el que s'ha triat a la URL. */
function pinta() {
    const targetes = targetesDe(estat.temes);
    const fulls = pagines(targetes, estat.mida, estat.contingut);
    $('targetes-pagines').dataset.color = estat.color;
    $('targetes-pagines').innerHTML = fulls.map((f, i) => htmlPagina(f, estat.mida, i + 1, fulls.length)).join('');
    ajustaParaules();
    const r = resum(targetes.length, estat.mida, estat.contingut);
    $('targetes-resum').textContent = textResum(r.targetes, r.pagines);
    $('btn-imprimir').disabled = targetes.length === 0;
    const q = queryDe(estat);
    try {
        window.history.replaceState(null, '', window.location.pathname + (q ? `?${q}` : ''));
    } catch {
        // Sense historial (p. ex. una pàgina incrustada): res no es perd, només que la URL no s'actualitza
    }
}

function canvia() {
    llegeix();
    pinta();
}

/** Marca o desmarca tots els temes. */
function marcaTemes(marcats) {
    document.querySelectorAll('input[name="tema"]').forEach(i => (i.checked = marcats));
    canvia();
}

// ── INICI ────────────────────────────────────────────────────────────────────

$('targetes-temes').innerHTML = temesDelBanc()
    .map(t => htmlTema(t, estat.temes.includes(t.tema)))
    .join('');
for (const nom of ['mida', 'contingut', 'color']) {
    document.querySelector(`input[name="${nom}"][value="${estat[nom]}"]`).checked = true;
}

$('targetes-opcions').addEventListener('change', canvia);
$('targetes-opcions').addEventListener('submit', e => e.preventDefault());
$('temes-tots').addEventListener('click', () => marcaTemes(true));
$('temes-cap').addEventListener('click', () => marcaTemes(false));
$('btn-imprimir').addEventListener('click', () => window.print());
pinta();
