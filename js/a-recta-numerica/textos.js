/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-recta-numerica/textos.js
 * ROL: Els textos de l'activitat «Temperatura» (recta numèrica doble) que veu
 *      l'alumne, tots junts. (Els del motor comú són a js/textos.js; els textos
 *      que no canvien mai, com el títol, són a a-recta-numerica.html i les
 *      paraules «avui», «ahir» i «demà» surten de generador.js.) Cada paraula ha
 *      de ser al lèxic (js/lexicon/dades.js): ho comprova tests/check-lexicon.js.
 *      L'única frase és la instrucció de cada pregunta; per a la resta, es llegeix amb el gràfic, xifres i símbols.
 * ============================================================================
 */

export const TEXTOS = {
    // Capçalera
    repte: 'Repte {n} de {total}',

    // La instrucció de cada pregunta (a sota de la capçalera); el verb va segons el dia: fa (avui), feia (passat), farà (futur)
    tempAvui: 'Quina temperatura fa avui?',
    tempAhir: 'Quina temperatura feia ahir?',
    tempDema: 'Quina temperatura farà demà?',
    tempPassat: 'Quina temperatura feia aquest dia?',
    tempFutur: 'Quina temperatura farà aquest dia?',
    recompte: 'Quants dies fa {temp}?',
    diaCalor: 'Quin dia fa més calor?',
    diaFred: 'Quin dia fa més fred?',
};
