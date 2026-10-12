/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-triangle-rectangle/textos.js
 * ROL: Els textos de l'activitat «Triangle rectangle» que veu l'alumne, tots
 *      junts. (Els del motor comú són a js/textos.js; el títol és a
 *      a-triangle-rectangle.html.) Cada paraula ha de ser al lèxic
 *      (js/lexicon/dades.js): ho comprova tests/check-lexicon.js.
 *      L'única frase és la instrucció de cada pregunta; per a la resta, es llegeix amb el triangle, nombres i símbols.
 * ============================================================================
 */

export const TEXTOS = {
    // Capçalera
    repte: 'Repte {n} de {total}',

    // Botó per pujar de nivell
    nivellSeguent: 'Nivell {n} ›',

    // La instrucció de la pregunta (a sota de la capçalera); {costat}: la lletra del costat que falta (a, b o c)
    instruccio: 'Tria la mesura del costat {costat}.',
};
