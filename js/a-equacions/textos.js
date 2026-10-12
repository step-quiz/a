/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-equacions/textos.js
 * ROL: Els textos de l'activitat «Equacions» que veu l'alumne, tots junts.
 *      (Els del motor comú són a js/textos.js; el títol és a a-equacions.html.)
 *      Cada paraula ha de ser al lèxic (js/lexicon/dades.js): ho comprova
 *      tests/check-lexicon.js. L'única frase és la instrucció de cada pregunta; per a la resta, es llegeix amb
 *      l'equació, caixes i caramels dibuixats, nombres i símbols.
 * ============================================================================
 */

export const TEXTOS = {
    // Capçalera
    equacio: 'Equació {n} de {total}',

    // Botó per pujar de nivell
    nivellSeguent: 'Nivell {n} ›',

    // La instrucció de la pregunta (a sota de la capçalera)
    instruccio: 'Escriu el valor de {x}.', // {x}: la lletra de la incògnita
};
