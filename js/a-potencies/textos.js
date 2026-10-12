/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-potencies/textos.js
 * ROL: Els textos de l'activitat «Potències» que veu l'alumne, tots junts.
 *      (Els del motor comú són a js/textos.js; el títol és a a-potencies.html.)
 *      Cada paraula ha de ser al lèxic (js/lexicon/dades.js): ho comprova
 *      tests/check-lexicon.js. L'única frase és la instrucció de cada pregunta; per a la resta, es llegeix amb
 *      potències, nombres i símbols.
 * ============================================================================
 */

export const TEXTOS = {
    // Capçalera
    potencia: 'Potència {n} de {total}',

    // Botó per pujar de nivell
    nivellSeguent: 'Nivell {n} ›',

    // La instrucció de la pregunta (a sota de la capçalera): l'exponent (kind «exp») o el valor (kind «valor»)
    escriuExponent: "Escriu l'exponent.",
    escriuResultat: 'Escriu el resultat.',
};
