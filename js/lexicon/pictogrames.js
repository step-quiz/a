/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/lexicon/pictogrames.js
 * ROL: Els PICTOGRAMES SVG PROPIS de les paraules que no tenen cap emoji que
 *      les representi bé (decisió D7: emojis del sistema i, a la mínima
 *      sospita, un pictograma propi). De moment, els de l'edifici de
 *      «Nombres enters»: un pis (de dalt), la planta baixa i el soterrani, amb
 *      el mateix edifici i el nivell del qual parla la paraula destacat; i la
 *      moneda de «Diners i canvi» (cap emoji de moneda no es veu igual ni
 *      existeix a tots els dispositius).
 *      Cada pictograma és un text SVG petit, sense res extern. Els colors són
 *      a css/shared.css (.pict-*), perquè canviïn amb la pàgina i es vegin bé en
 *      mode d'alt contrast. Una entrada del lèxic en tria un amb
 *      `imatge: { pictograma: 'id' }` (js/lexicon/dades.js).
 *      Només dades i text, sense DOM: es prova des de Node.
 * ============================================================================
 */

/**
 * L'edifici: 4 pisos sobre el terra (y = 20) i un soterrani a sota. `destac` diu quin nivell
 * s'omple de color: 'pis' (el segon des de dalt), 'planta-baixa' (el de sota de tot, amb una porta)
 * o 'soterrani' (l'edifici de dalt s'apaga perquè es vegi que és a sota).
 */
function edifici(destac) {
    const pisos = [4, 8, 12, 16]
        .map((y, i) => {
            const marcat = (destac === 'pis' && i === 1) || (destac === 'planta-baixa' && i === 3);
            const classe = marcat ? 'pict-destac' : destac === 'soterrani' ? 'pict-fons pict-apagat' : 'pict-fons';
            return `<rect class="${classe}" x="9" y="${y}" width="14" height="4"/>`;
        })
        .join('');
    const porta = destac === 'planta-baixa' ? '<rect class="pict-negre" x="14.5" y="17" width="3" height="3"/>' : '';
    const soterrani = `<rect class="${destac === 'soterrani' ? 'pict-destac' : 'pict-fons'}" x="9" y="20" width="14" height="8"/>`;
    const terra = '<line class="pict-terra" x1="3" y1="20" x2="29" y2="20"/>';
    return `<svg class="pict" viewBox="0 0 32 32" aria-hidden="true" focusable="false">${pisos}${soterrani}${porta}${terra}</svg>`;
}

/**
 * Una moneda d'euro: el disc de color, un anell i un «€» fet amb traços (un arc i dues barres), de manera que no depèn
 * de cap tipus de lletra.
 */
function moneda() {
    return (
        '<svg class="pict" viewBox="0 0 32 32" aria-hidden="true" focusable="false">' +
        '<circle class="pict-destac" cx="16" cy="16" r="13"/>' +
        '<circle class="pict-linia" cx="16" cy="16" r="10"/>' +
        '<path class="pict-linia" d="M20.2 12.2 A5 5 0 1 0 20.2 19.8"/>' +
        '<line x1="11" y1="14.3" x2="18.5" y2="14.3"/>' +
        '<line x1="11" y1="17.7" x2="18.5" y2="17.7"/>' +
        '</svg>'
    );
}

/** Els pictogrames, per nom (el que porta `imatge.pictograma` a js/lexicon/dades.js). */
export const PICTOGRAMES = {
    'pis': edifici('pis'),
    'planta-baixa': edifici('planta-baixa'),
    'soterrani': edifici('soterrani'),
    'moneda': moneda(),
};
