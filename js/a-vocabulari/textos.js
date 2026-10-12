/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-vocabulari/textos.js
 * ROL: Els textos de l'activitat «Vocabulari» que veu l'alumne, tots junts.
 *      (Els del motor comú són a js/textos.js; el títol és a a-vocabulari.html
 *      i les paraules que es pregunten surten del lèxic.) Cada paraula ha de ser
 *      al lèxic (js/lexicon/dades.js): ho comprova tests/check-lexicon.js.
 *      L'única frase és la instrucció de cada pregunta; per a la resta, es llegeix amb imatges, paraules i marques.
 * ============================================================================
 */

export const TEXTOS = {
    // Capçalera
    repte: 'Repte {n} de {total}',

    // Botó per pujar de nivell
    nivellSeguent: 'Nivell {n} ›',

    // La instrucció de la pregunta (a sota de la capçalera), segons el nivell: 1 imatge → paraula, 2 paraula → imatge, 3 escriure
    triaParaula: 'Tria la paraula.',
    triaImatge: 'Tria la imatge.',
    escriuParaula: 'Escriu la paraula.',
};
