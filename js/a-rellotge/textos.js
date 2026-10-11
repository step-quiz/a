/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-rellotge/textos.js
 * ROL: Els textos de l'activitat «Rellotge» que veu l'alumne, tots junts.
 *      (Els del motor comú són a js/textos.js; els textos que no canvien mai, com
 *      el títol, són a a-rellotge.html.) Cada paraula ha de ser al lèxic
 *      (js/lexicon/dades.js): ho comprova tests/check-lexicon.js. Només dades.
 *      Els `{noms}` són les parts que canvien (vegeu format() a js/textos.js).
 *      L'activitat no té frases: el rellotge, les xifres i les quatre expressions
 *      de l'ajuda («en punt», «i quart», «i mitja», «menys quart») són tot el que es llegeix.
 * ============================================================================
 */

export const TEXTOS = {
    // Capçalera
    repte: 'Repte {n} de {total}',

    // L'ajuda del nivell 1: com es diu l'hora quan l'agulla llarga és al 12, al 3, al 6 i al 9
    enPunt: 'en punt',
    iQuart: 'i quart',
    iMitja: 'i mitja',
    menysQuart: 'menys quart',
};
