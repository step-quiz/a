/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-triangle-rectangle/vista.js
 * ROL: L'HTML i els textos plans de la pantalla de «Triangle rectangle» a
 *      partir d'un problema (vegeu PROBLEMES a generador.js): el dibuix SVG
 *      del triangle amb «a = ?» (i els altres costats amb el seu valor) i
 *      l'ajuda amb la fórmula. Només hi ha el triangle, nombres, lletres i
 *      símbols.
 *      No toca el DOM: només construeix text. Es prova des de Node
 *      (tests/activitats.test.js); el controlador és a-triangle-rectangle.js.
 * DEPENDÈNCIES: generador.js, el lèxic (js/lexicon/paraula.js).
 * ============================================================================
 */
import { textParaula } from '../lexicon/paraula.js';
import { formula, formulaAmbValors, mesures } from './generador.js';

const COLOR_CONEGUT = '#334155';
const COLOR_DESCONEGUT = '#7c3aed';

/** Una etiqueta d'un costat: «b = 3» (o «b = ?» si és el que es busca). */
const text = (x, y, contingut, color, ancora = 'middle') =>
    `<text x="${x}" y="${y}" fill="${color}" font-size="15" font-weight="bold" font-family="Courier New, monospace" text-anchor="${ancora}">${contingut}</text>`;

/**
 * El dibuix del triangle rectangle (SVG): l'angle recte a baix a l'esquerra, el catet vertical b, el catet horitzontal c i
 * la hipotenusa a. Cada costat porta la seva lletra i el valor; el que es busca, «?», en lila i amb línia discontínua.
 */
export function htmlTriangle(p) {
    const { vertical, horitzontal } = mesures(p);
    const MAX_W = 150;
    const MAX_H = 118;
    const escala = Math.min(MAX_W / horitzontal, MAX_H / vertical);
    const AX = 64;
    const AY = 156;
    const BX = AX + horitzontal * escala;
    const CY = AY - vertical * escala;

    const valor = costat => (p.find === costat ? '?' : p.given[costat]);
    const color = costat => (p.find === costat ? COLOR_DESCONEGUT : COLOR_CONEGUT);
    const traç = costat =>
        `stroke="${color(costat)}" stroke-width="2.5"${p.find === costat ? ' stroke-dasharray="7,4"' : ''}`;

    // L'etiqueta de la hipotenusa: a la dreta del punt mig, per fora del triangle (per no tocar el costat)
    const hx = (BX + AX) / 2 + 12;
    const hy = (AY + CY) / 2 - 6;

    return `<svg class="triangle-svg" viewBox="0 0 270 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${textParaula('triangle', { article: false })}">
        <polygon points="${AX},${AY} ${BX},${AY} ${AX},${CY}" fill="#ede9fe" stroke="none" opacity="0.55"/>
        <line x1="${AX}" y1="${AY}" x2="${AX}" y2="${CY}" ${traç('b')}/>
        <line x1="${AX}" y1="${AY}" x2="${BX}" y2="${AY}" ${traç('c')}/>
        <line x1="${BX}" y1="${AY}" x2="${AX}" y2="${CY}" ${traç('a')}/>
        <path d="M ${AX},${AY - 10} L ${AX + 10},${AY - 10} L ${AX + 10},${AY}" fill="none" stroke="#64748b" stroke-width="1.5"/>
        ${text(AX - 8, (AY + CY) / 2 + 5, `b = ${valor('b')}`, color('b'), 'end')}
        ${text((AX + BX) / 2, AY + 22, `c = ${valor('c')}`, color('c'))}
        ${text(hx, hy, `a = ${valor('a')}`, color('a'), 'start')}
    </svg>`;
}

/**
 * L'ajuda 💡, només amb lletres, nombres i símbols; cada toc fa el següent pas: 0 = res, 1 = la fórmula («a² = b² + c²»),
 * 2 = la fórmula amb els valors («a² = 3² + 4²»).
 */
export function htmlAjuda(p, pas) {
    if (pas === 0) return '';
    const linies = [formula(p), ...(pas >= 2 ? [formulaAmbValors(p)] : [])];
    return linies.map(l => `<div class="ajuda-linia">${l}</div>`).join('');
}

/** La pregunta, en text pla, per a la revisió final: «a? (b = 3, c = 4)». */
export function textPregunta(p) {
    const dades = Object.entries(p.given)
        .map(([k, v]) => `${k} = ${v}`)
        .join(', ');
    return `${p.find}? (${dades})`;
}
