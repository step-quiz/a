/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-fraccions/textos.js
 * ROL: Els textos de l'activitat «Fraccions» que veu l'alumne, tots junts.
 *      (Els del motor comú són a js/textos.js; el títol és a a-fraccions.html.)
 *      Cada paraula ha de ser al lèxic (js/lexicon/dades.js): ho comprova
 *      tests/check-lexicon.js. L'única frase és la instrucció de cada pregunta; per a la resta, es llegeix amb
 *      fraccions, nombres i símbols.
 * ============================================================================
 */

export const TEXTOS = {
    // Capçalera
    repte: 'Repte {n} de {total}',

    // Botó per pujar de nivell
    nivellSeguent: 'Nivell {n} ›',

    // La instrucció de cada pas de la resolució (a sota de la capçalera)
    escriuDenominador: 'Escriu un denominador comú.',
    escriuEquivalents: 'Escriu les fraccions equivalents.',
    escriuInversa: 'Escriu la fracció inversa.',
    escriuResultat: 'Escriu el resultat.',
    simplifica: 'Simplifica la fracció.',
};
