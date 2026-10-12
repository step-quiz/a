/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-enters-ordenar/textos.js
 * ROL: Els textos de l'activitat «Ordenar enters» que veu l'alumne, tots junts.
 *      (Els del motor comú són a js/textos.js; els textos que no canvien mai, com
 *      el títol, són a a-enters-ordenar.html.) Cada paraula ha de ser al lèxic
 *      (js/lexicon/dades.js): ho comprova tests/check-lexicon.js. Només dades.
 *      L'única frase és la instrucció de cada pregunta; per a la resta, els tres reptes es llegeixen amb nombres i símbols.
 * ============================================================================
 */

export const TEXTOS = {
    // Capçalera
    repte: 'Repte {n} de {total}',

    // La instrucció de cada tipus de repte (a sota de la capçalera). {signes} i {r} són valors que canvien (vegeu mostraRepte)
    triaSigne: 'Tria el signe: {signes}.',
    escriuEntre: 'Escriu un nombre entre els dos.',
    toca: 'Toca els nombres menors que {r}.',
};
