/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-pla-cartesia/textos.js
 * ROL: Els textos de l'activitat «Coordenades» (el pla cartesià) que veu
 *      l'alumne, tots junts. (Els del motor comú són a js/textos.js; el títol
 *      és a a-pla-cartesia.html.) Cada paraula ha de ser al lèxic
 *      (js/lexicon/dades.js): ho comprova tests/check-lexicon.js. L'activitat
 *      no té frases: es llegeix amb el pla, punts, nombres i icones.
 * ============================================================================
 */

export const TEXTOS = {
    // Capçalera
    repte: 'Repte {n} de {total}',

    // Botó per pujar de nivell
    nivellSeguent: 'Nivell {n} ›',

    // La instrucció de cada tipus de pregunta (a sota de la capçalera); {punt} és la lletra del punt (A, B, C…)
    situa: 'Marca on és el punt {punt}.',
    coordenades: 'Escriu les coordenades del punt {punt}.',
    quadrant: 'En quin quadrant és el punt {punt}?',
    on: 'On és el punt {punt}?',
    alQuadrant: 'Escriu un punt que estigui en aquest quadrant.',
    alEix: 'Escriu un punt que estigui en aquest eix.',
    origen: "Escriu les coordenades de l'origen.",
};
