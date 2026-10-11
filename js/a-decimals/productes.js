/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-decimals/productes.js
 * ROL: El CATÀLEG de productes de «Diners i canvi» (a-decimals). De cada un:
 *      · `id`: la paraula del lèxic (js/lexicon/dades.js), que en porta la
 *        imatge i el nom amb article;
 *      · `plural`: si es compra en plural («els ous», «les galetes»): un sol ou
 *        no val 3 €;
 *      · `preu`: [mínim, màxim] en euros, un rang versemblant per a una unitat
 *        d'un supermercat o d'un quiosc.
 *      Només dades, sense DOM.
 *      Contextos neutres (principi 8 del pla): respecte del catàleg d'operacions
 *      s'han tret la pizza (l'emoji porta embotit), la magdalena (una festa), l'entrepà
 *      (l'embotit) i els fruits secs (l'emoji és de cacauet: ambigu).
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */
export const PRODUCTES = [
    { id: 'pa', preu: [0.8, 2.5] },
    { id: 'llet', preu: [0.85, 1.5] },
    { id: 'poma', preu: [0.25, 0.8] },
    { id: 'llapis', preu: [0.3, 1.2] },
    { id: 'llibreta', preu: [1.0, 3.5] },
    { id: 'xocolata', preu: [0.9, 2.5] },
    { id: 'aigua', preu: [0.4, 1.2] },
    { id: 'suc', preu: [1.2, 2.5] },
    { id: 'croissant', preu: [0.8, 1.8] },
    { id: 'platan', preu: [0.2, 0.7] },
    { id: 'galeta', plural: true, preu: [1.0, 2.5] },
    { id: 'boli', preu: [0.5, 1.8] },
    { id: 'raim', preu: [0.8, 2.5] },
    { id: 'formatge', preu: [1.5, 4.5] },
    { id: 'ou', plural: true, preu: [1.8, 3.5] },
    { id: 'refresc', preu: [0.8, 2.0] },
];
