/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-factoritzar/textos.js
 * ROL: Els textos de l'activitat «Factoritzar» que veu l'alumne, tots junts.
 *      (Els del motor comú són a js/textos.js; el títol és a a-factoritzar.html.)
 *      Cada paraula ha de ser al lèxic (js/lexicon/dades.js): ho comprova
 *      tests/check-lexicon.js. L'única frase és la instrucció de cada pregunta; per a la resta, es llegeix amb
 *      l'arbre, nombres i símbols.
 * ============================================================================
 */

export const TEXTOS = {
    // Capçalera
    nombre: 'Repte {n} de {total}',

    // Botó per pujar de nivell
    nivellSeguent: 'Nivell {n} ›',

    // La instrucció de la pregunta (a sota de la capçalera) i la nota de sota: l'arbre acaba quan tots són primers
    instruccio: 'Escriu dos factors.',
    nota: 'Acaba amb nombres primers.',
};
