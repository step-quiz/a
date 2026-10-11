/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-mcd-mcm/vista.js
 * ROL: L'HTML i els textos plans de la pantalla de «MCD i MCM» a partir d'una
 *      pregunta (vegeu generaPregunta a generador.js): els dos nombres, la
 *      factorització, la sigla del pas, els passos fets, la resposta equivocada
 *      amb les seves dues divisions i l'ajuda amb divisors i múltiples. Només hi ha
 *      nombres, símbols i les sigles MCD i MCM.
 *      No toca el DOM: només construeix text. Es prova des de Node
 *      (tests/activitats.test.js); el controlador és a-mcd-mcm.js.
 * DEPENDÈNCIES: generador.js.
 * ============================================================================
 */
import { comprovacions, divisors, multiples } from './generador.js';

const SIGLA = { mcd: 'MCD', mcm: 'MCM' };
const sigla = pas => `<span class="sigla sigla-${pas}">${SIGLA[pas]}</span>`;

/** La factorització d'un nombre: «12 = 2² · 3». */
export function htmlFactoritzacio(n, factors) {
    const primers = Object.keys(factors)
        .map(Number)
        .sort((x, y) => x - y);
    const part = p => (factors[p] === 1 ? `${p}` : `${p}<sup>${factors[p]}</sup>`);
    return `<strong>${n}</strong> = ${primers.map(part).join(' · ')}`;
}

/** Els dos nombres de la pregunta, cada un en la seva targeta (i amb la factorització si `ambFactors`). */
export function htmlNombres(pregunta, ambFactors) {
    const targeta = (lletra, n, factors) =>
        `<div class="nombre-card nombre-${lletra}"><span class="nombre-gran">${n}</span>` +
        (ambFactors ? `<span class="nombre-factors">${htmlFactoritzacio(n, factors)}</span>` : '') +
        '</div>';
    return targeta('a', pregunta.a, pregunta.factorsA) + targeta('b', pregunta.b, pregunta.factorsB);
}

/** El pas que es demana: «MCD (12, 18) =». */
export function htmlEtiquetaPas(pas, pregunta) {
    return `${sigla(pas)} <span class="pas-nombres">(${pregunta.a}, ${pregunta.b})</span> =`;
}

/** Un pas ja fet: «✅ MCD (12, 18) = 6». */
export function htmlPasFet(pas, pregunta, valor) {
    return `<div class="step-done"><span aria-hidden="true">✅</span> ${htmlEtiquetaPas(pas, pregunta)} <span class="step-done-val">${valor}</span></div>`;
}

/** La pregunta d'un pas, en text pla, per a la revisió final: «MCD (12, 18)». */
export const textPregunta = (pas, pregunta) => `${SIGLA[pas]} (${pregunta.a}, ${pregunta.b})`;

/**
 * Després d'una resposta equivocada: les dues divisions que diuen si és divisor (MCD) o múltiple (MCM) dels dos nombres,
 * cada una amb ✔ (exacta) o ✖ (no): «12 ÷ 4 ✔  27 ÷ 4 ✖». Si les dues són ✔ la resposta serveix però no és la millor, i una
 * fletxa ho diu: ⬆ n'hi ha una de més gran (MCD), ⬇ una de més petita (MCM).
 */
export function htmlResposta(pregunta, pas, resposta) {
    const divisions = comprovacions(pregunta, pas, resposta);
    const xip = d =>
        `<span class="part ${d.ok ? 'bo' : 'mal'}">${d.dividend} ÷ ${d.divisor} ${d.ok ? '✔' : '✖'}</span>`;
    const fletxa = divisions.every(d => d.ok) ? `<span class="part pista">${pas === 'mcd' ? '⬆' : '⬇'}</span>` : '';
    return divisions.map(xip).join('') + fletxa;
}

// ── L'ajuda ──────────────────────────────────────────────────────────────────

/** Una llista de nombres amb els que són a `comuns` en destacat; si passa de `talla`, s'amaga el mig amb «…» (l'últim sempre es veu). */
function llista(valors, comuns, talla) {
    const marca = v => (comuns.has(v) ? `<b class="comu">${v}</b>` : `${v}`);
    if (!talla || valors.length <= talla) return valors.map(marca).join(' ');
    return `${valors
        .slice(0, talla - 2)
        .map(marca)
        .join(' ')} … ${marca(valors[valors.length - 1])}`;
}

const fila = (n, contingut, lletra) =>
    `<div class="ajuda-fila ajuda-${lletra}"><span class="ajuda-nombre">${n}</span> <span class="ajuda-llista">${contingut}</span></div>`;

/**
 * L'ajuda 💡, només amb nombres: al MCD, els divisors de cada nombre amb els comuns en destacat; al MCM, els múltiples de
 * cada nombre fins al MCM (el primer comú, en destacat). Si `ambFactors`, també la factorització dels dos nombres.
 */
export function htmlAjuda(pregunta, pas, ambFactors) {
    const { a, b } = pregunta;
    let cos;
    if (pas === 'mcd') {
        const da = divisors(a);
        const db = divisors(b);
        const comuns = new Set(da.filter(d => db.includes(d)));
        cos = fila(a, llista(da, comuns), 'a') + fila(b, llista(db, comuns), 'b');
    } else {
        const comuns = new Set([pregunta.mcm]);
        cos =
            fila(a, llista(multiples(a, pregunta.mcm), comuns, 12), 'a') +
            fila(b, llista(multiples(b, pregunta.mcm), comuns, 12), 'b');
    }
    const factors = ambFactors
        ? `<div class="ajuda-factors">${htmlFactoritzacio(a, pregunta.factorsA)}</div><div class="ajuda-factors">${htmlFactoritzacio(b, pregunta.factorsB)}</div>`
        : '';
    return factors + cos;
}
