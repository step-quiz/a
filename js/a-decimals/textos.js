/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-decimals/textos.js
 * ROL: Els textos de l'activitat «Diners i canvi» que veu l'alumne, tots junts.
 *      (Els del motor comú són a js/textos.js; els textos que no canvien mai, com
 *      el títol o el botó «Ajuda», són a a-decimals.html.) Cada paraula ha de ser
 *      al lèxic (js/lexicon/dades.js): ho comprova tests/check-lexicon.js. Només dades.
 *      Els `{noms}` són les parts que canvien (vegeu format() a js/textos.js).
 *      L'activitat té molt pocs textos a propòsit: la botiga, el bitllet i el canvi
 *      es llegeixen amb imatges i xifres; les úniques paraules són les del lèxic.
 * ============================================================================
 */

export const TEXTOS = {
    // Capçalera
    compra: 'Compra {n} de {total}',

    // Botó per pujar de nivell
    nivellSeguent: 'Nivell {n} ›',

    // Després d'una resposta equivocada: cada part de la resposta (els euros i els cèntims) diu si és bona o no
    partCorrecta: '{part}: correcte',
    partIncorrecta: '{part}: incorrecte',

    // La instrucció de cada pas (a sota de la capçalera): al nivell 3 primer el total i després el canvi
    escriuTotal: 'Escriu el total.',
    escriuCanvi: 'Escriu el canvi.',
};
