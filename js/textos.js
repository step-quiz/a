/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/textos.js
 * ROL: Els textos del MOTOR COMÚ que veu l'alumne (puntuació, fi de sessió,
 *      pantalla final, revisió…), tots junts i no escampats pel codi. Cada
 *      activitat té els seus a js/<activitat>/textos.js.
 *      Només dades i `format`, sense cap import ni DOM.
 *      Cada paraula d'aquests textos ha de ser al lèxic (js/lexicon/dades.js):
 *      ho comprova tests/check-lexicon.js. Els textos no porten «<», «>», «&»
 *      ni cometes dobles, perquè es posen tal qual a l'HTML.
 *      Els `{noms}` entre claus són les parts que canvien: format() les omple.
 * ============================================================================
 */

export const TEXTOS_COMUNS = {
    // Capçalera de les activitats
    sessio: 'Sessió {n} de {total}',
    nivell: '· Nivell {n}',
    punts: 'Punts: {n}',
    intents: 'Intents: {n}',

    // Missatge després de cada pregunta
    moltBe: 'Molt bé!',
    intentsEsgotats: 'Intents esgotats',

    // Fi de sessió
    sessioCompletada: 'Sessió {n} completada',
    preparantSessio: 'Preparant sessió següent…',
    comencarSessio: 'Començar sessió següent',

    // Pantalla final
    sessioN: 'Sessió {n}',
    total: 'Total',
    puntsDeMaxim: '{n} / {max} punts',
    estrelles: '{n} de {max} estrelles',
    revisa: '📋 Revisa',
    tornaAJugar: '🔄 Torna a jugar',

    // Revisió de les respostes
    revisio: 'Revisió',
    correcte: 'Correcte',
    incorrecte: 'Incorrecte',
    enrere: '⬅ Enrere',

    // Distintiu de les sessions fixes (js/fixed-sessions.js)
    sessioFixa: 'Sessió fixa {lletra}',

    // Targeta «Aprèn la paraula» (js/targeta-paraula.js)
    targetaOk: 'OK',
};

/**
 * Omple els `{noms}` d'un text amb els valors donats: format('Sessió {n} de {total}', { n: 1, total: 3 }).
 * Si falta algun valor, falla (així una errada de lletra no arriba a l'alumne com a «{totl}»).
 */
export function format(text, valors = {}) {
    return text.replace(/\{(\w+)\}/g, (_, nom) => {
        if (!(nom in valors)) throw new Error(`Falta el valor «${nom}» per a «${text}»`);
        return String(valors[nom]);
    });
}
