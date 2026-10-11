/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-proporciodirecta/vista.js
 * ROL: L'HTML i els textos plans de la pantalla de «Proporcionalitat» a partir
 *      d'un problema (vegeu generaProblema a generador.js): les files del
 *      problema, l'ajuda (l'operació i els productes dibuixats) i la pregunta
 *      de la revisió. Cada producte és una paraula del lèxic amb la seva
 *      imatge; la resta són xifres i símbols («2 🍎 → 6 €»).
 *      No toca el DOM: només construeix text. Es prova des de Node
 *      (tests/activitats.test.js); el controlador és a-proporciodirecta.js.
 * DEPENDÈNCIES: el lèxic (js/lexicon/).
 * ============================================================================
 */
import { entrada } from '../lexicon/lexicon.js';
import { htmlImatge, paraula, textParaula } from '../lexicon/paraula.js';

const emoji = id => entrada(id).imatge?.emoji ?? textParaula(id, { article: false });

/** Una fila: «2 [🍎 pomes] → 6 €» (o «→ ? €» si és el que es demana, o «→ 2 € ✓» si ja està fet). */
function fila(problema, qty, preu, tipus) {
    const valor = preu === null ? '?' : preu;
    const classe = tipus === 'pregunta' ? 'problem-unknown' : 'problem-price';
    return (
        `<div class="problem-row${tipus === 'fet' ? ' done-row' : ''}">` +
        `<span class="problem-qty">${qty} ${paraula(problema.producte, { plural: qty !== 1, article: false })}</span>` +
        `<span class="problem-arrow" aria-hidden="true">→</span>` +
        `<span class="${classe}">${valor} €</span></div>`
    );
}

/**
 * Les files del problema al pas `numPas`: la dada i el que es demana; al segon pas, entre les dues, el preu d'un
 * producte (ja resolt al primer).
 */
export function htmlProblema(problema, numPas) {
    const pas = problema.passos[numPas];
    let h = fila(problema, problema.qtyDada, problema.preuDada, 'dada');
    if (numPas > 0) h += fila(problema, 1, problema.passos[0].resposta, 'fet');
    return h + fila(problema, pas.qty, null, 'pregunta');
}

/** Un pas ja fet, com a símbol: «✅ 1 🍎 → 2 €». */
export function htmlPasFet(problema, numPas) {
    const pas = problema.passos[numPas];
    return `<span aria-hidden="true">✅</span> ${pas.qty} ${paraula(problema.producte, { plural: pas.qty !== 1, article: false })} → ${pas.resposta} €`;
}

/** Els productes dibuixats en fila, cadascun amb `a dalt` (el preu o «?»). */
function productes(problema, qty, adalt) {
    const e = htmlImatge(entrada(problema.producte));
    return `<span class="items-row" aria-hidden="true">${Array.from({ length: qty }, () => `<span class="item"><span class="item-top">${adalt}</span><span class="item-img">${e}</span></span>`).join('')}</span>`;
}

/**
 * L'ajuda d'un pas: l'operació (sense la resposta) i, quan es pot dibuixar, els productes: un preu a sobre de cada un
 * (si es demana el preu de diversos i el d'un és conegut) o un «?» a sobre de cada un (si es reparteix un preu).
 */
export function htmlAjuda(problema, numPas) {
    const pas = problema.passos[numPas];
    const operacio = `<span class="ajuda-terme">${pas.a} € ${pas.op} ${pas.b} = ?</span>`;
    let dibuix = '';
    // × amb el preu d'UN producte (1→N i el segon pas): un preu a sobre de cada producte
    if (pas.op === '×' && (numPas > 0 || problema.qtyDada === 1)) dibuix = productes(problema, pas.qty, `${pas.a} €`);
    // ÷ entre els productes de la dada (N→1 i el primer pas): un «?» a sobre de cada producte
    else if (pas.op === '÷' && pas.b === problema.qtyDada) dibuix = productes(problema, pas.b, '?');
    return `${operacio}${dibuix}`;
}

/** La pregunta d'un pas, en text pla, per a la revisió final: «🍎 2→6 €, 5→?». */
export function textPregunta(problema, numPas) {
    const e = emoji(problema.producte);
    const pas = problema.passos[numPas];
    if (numPas === 0) return `${e} ${problema.qtyDada}→${problema.preuDada} €, ${pas.qty}→?`;
    return `${e} 1→${problema.passos[0].resposta} €, ${pas.qty}→?`;
}
