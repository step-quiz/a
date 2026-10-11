/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-equacions/vista.js
 * ROL: L'HTML de la pantalla de «Equacions» a partir d'una equació (vegeu
 *      generaEquacio a generador.js): l'equació en gran, la mateixa equació
 *      dibuixada amb caixes i caramels (l'ajuda) i la comprovació per
 *      substitució d'una resposta equivocada. Només hi ha nombres, la lletra x,
 *      símbols i dibuixos.
 *      No toca el DOM: només construeix text. Es prova des de Node
 *      (tests/activitats.test.js); el controlador és a-equacions.js.
 * DEPENDÈNCIES: generador.js.
 * ============================================================================
 */
import { dreta, esquerra, operacioInversa } from './generador.js';

// ── L'equació ────────────────────────────────────────────────────────────────

/** La x (amb el coeficient si n'hi ha): «x» o «3 · x». */
function xToken(coeff = 1) {
    if (coeff === 1) return '<span class="eq-var-token"><span class="eq-x">x</span></span>';
    return `<span class="eq-var-token"><span class="eq-coeff">${coeff}</span><span class="eq-dot">·</span><span class="eq-x">x</span></span>`;
}

const numToken = n => `<span class="eq-num-token">${n}</span>`;
const opToken = op => `<span class="eq-op">${op}</span>`;
const SIGNE_IGUAL = '<span class="eq-sign">=</span>';

/** L'equació en gran, amb cada terme en la seva casella. */
export function htmlEquacio(eq) {
    if (eq.tipus === 'ax_b') return xToken(eq.a) + SIGNE_IGUAL + numToken(eq.b);
    if (eq.tipus === 'xpb_c') return xToken() + opToken('+') + numToken(eq.b) + SIGNE_IGUAL + numToken(eq.c);
    if (eq.tipus === 'xmb_c') return xToken() + opToken('−') + numToken(eq.b) + SIGNE_IGUAL + numToken(eq.c);
    return numToken(eq.b) + opToken('+') + xToken() + SIGNE_IGUAL + numToken(eq.c);
}

// ── L'ajuda: caixes i caramels ───────────────────────────────────────────────

/** Una caixa amb els caramels que no se sap quants són (la x). */
const caixa = '<span class="ajuda-caixa" aria-hidden="true">🎁<i>x</i></span>';
/** Un nombre de caramels. */
const caramels = n => `<span class="ajuda-caramels" aria-hidden="true">${n}<span>🍬</span></span>`;
const op = s => `<span class="ajuda-op" aria-hidden="true">${s}</span>`;

/** L'equació dibuixada: «🎁x + 3🍬 = 8🍬» (a·x = b, amb a caixes iguals). */
export function htmlCaixes(eq) {
    if (eq.tipus === 'ax_b')
        return `<span class="ajuda-grup">${Array(eq.a).fill(caixa).join('')}</span>${op('=')}${caramels(eq.b)}`;
    if (eq.tipus === 'xpb_c') return `${caixa}${op('+')}${caramels(eq.b)}${op('=')}${caramels(eq.c)}`;
    if (eq.tipus === 'xmb_c') return `${caixa}${op('−')}${caramels(eq.b)}${op('=')}${caramels(eq.c)}`;
    return `${caramels(eq.b)}${op('+')}${caixa}${op('=')}${caramels(eq.c)}`;
}

/**
 * L'ajuda 💡, per tocs: 0 = res, 1 = l'equació dibuixada amb caixes i caramels, 2 = el dibuix i, a sota, l'operació que
 * dona la x («8 − 3 = ?»).
 */
export function htmlAjuda(eq, pas) {
    if (pas === 0) return '';
    const dibuix = `<div class="ajuda-dibuix">${htmlCaixes(eq)}</div>`;
    return pas === 1 ? dibuix : `${dibuix}<div class="ajuda-operacio">${operacioInversa(eq)}</div>`;
}

// ── La resposta equivocada ───────────────────────────────────────────────────

/** Una resposta equivocada comprovada per substitució: «4 + 3 = 7 ≠ 8 ✖». */
export function htmlSubstitucio(eq, x) {
    const e = esquerra(eq, x);
    return `<span class="part mal">${e.text} = ${e.valor} ≠ ${dreta(eq)} ✖</span>`;
}
