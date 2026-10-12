/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-enters/textos.js
 * ROL: Els textos de l'activitat «Nombres enters» que veu l'alumne, tots junts.
 *      (Els del motor comú són a js/textos.js; els textos que no canvien mai, com
 *      el títol, són a a-enters.html.) Cada paraula ha de ser al lèxic
 *      (js/lexicon/dades.js): ho comprova tests/check-lexicon.js. Només dades.
 *      Els `{noms}` són les parts que canvien (vegeu format() a js/textos.js).
 * ============================================================================
 */

export const TEXTOS = {
    // Capçalera i camp de resposta
    operacio: 'Operació {n} de {total}',
    // La instruccio de cada pregunta (mostraInstruccio) i el nom del camp per als lectors de pantalla
    escriuResultat: 'Escriu el resultat.',
    ok: 'OK',
    ajuda: '💡 Ajuda',

    // Frase d'ajuda (metàfora de l'ascensor). {lloc}: «al pis 5»; {accio}: «pujo 2 pisos»; {pis}: «pis»
    ajudaFrase: 'Si estic {lloc} i {accio}, en quin {pis} acabo?',

    // Pista del signe del resultat
    signeZero: '🔵 El signe del resultat és zero',
    signePositiu: '🟢 El signe del resultat és positiu',
    signeNegatiu: '🔴 El signe del resultat és negatiu',
};
