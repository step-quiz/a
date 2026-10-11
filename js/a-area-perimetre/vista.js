/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-area-perimetre/vista.js
 * ROL: L'HTML i els textos plans de la pantalla de «Àrea i perímetre» a
 *      partir d'una figura (vegeu variant a generador.js): el dibuix SVG amb
 *      les cotes d'1 cm i l'ajuda que numera els quadrats o els costats, les
 *      etiquetes amb la seva icona i les marques ✔/✖. Només hi ha la figura,
 *      nombres i símbols.
 *      No toca el DOM: només construeix text. Es prova des de Node
 *      (tests/activitats.test.js); el controlador és a-area-perimetre.js.
 * DEPENDÈNCIES: generador.js, el lèxic (js/lexicon/paraula.js).
 * ============================================================================
 */
import { textParaula } from '../lexicon/paraula.js';
import { contorn, costatsExteriors } from './generador.js';

const CELL = 54; // mida d'un quadrat al dibuix, en píxels
const PAD = 48; // marge del dibuix (hi caben les cotes)

// ── Les etiquetes i les marques ──────────────────────────────────────────────

/** Les icones: l'àrea és l'interior (quadrats plens) i el perímetre és la vora (el quadrat només amb contorn). */
const ICONES = {
    area: '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><rect x="3" y="3" width="8" height="8" fill="#0d9488"/><rect x="13" y="3" width="8" height="8" fill="#0d9488"/><rect x="3" y="13" width="8" height="8" fill="#0d9488"/><rect x="13" y="13" width="8" height="8" fill="#0d9488"/></svg>',
    perimetre:
        '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><rect x="3" y="3" width="18" height="18" fill="none" stroke="#134e4a" stroke-width="4"/></svg>',
};

/** L'etiqueta d'una mesura: la icona, la paraula i la unitat: «▦ àrea (cm²)». */
export function htmlEtiqueta(mesura) {
    const unitat = mesura === 'area' ? 'cm²' : 'cm';
    return `<span class="etiqueta-icona">${ICONES[mesura]}</span><span class="etiqueta-text">${textParaula(mesura, { article: false })}</span> <span class="unitat">(${unitat})</span>`;
}

/** La marca d'una casella: ✔ si és bona i ✖ si no. */
export const htmlMarca = bo => `<span class="marca ${bo ? 'bo' : 'mal'}">${bo ? '✔' : '✖'}</span>`;

/** Les dues respostes intercanviades: ⇄ entre les dues caselles. */
export const htmlCanviats = () => '<span class="marca canvi">⇄</span>';

// ── El dibuix ────────────────────────────────────────────────────────────────

const clauCella = (r, c) => `${r},${c}`;

/** Les cotes d'1 cm d'un costat d'un quadrat: dues línies de pas i una de cota, amb el text («1 cm»). */
function htmlCota(r, c, costat) {
    const x0 = PAD + c * CELL;
    const y0 = PAD + r * CELL;
    // Cada costat: els dos extrems, la normal cap enfora i si el text va girat
    const costats = {
        T: {
            p: [
                [x0, y0],
                [x0 + CELL, y0],
            ],
            n: [0, -1],
            gir: 0,
        },
        B: {
            p: [
                [x0, y0 + CELL],
                [x0 + CELL, y0 + CELL],
            ],
            n: [0, 1],
            gir: 0,
        },
        L: {
            p: [
                [x0, y0],
                [x0, y0 + CELL],
            ],
            n: [-1, 0],
            gir: -90,
        },
        R: {
            p: [
                [x0 + CELL, y0],
                [x0 + CELL, y0 + CELL],
            ],
            n: [1, 0],
            gir: 90,
        },
    }[costat];
    const [nx, ny] = costats.n;
    const EXT = 18;
    const OFF = 14;
    const GAP = 8;
    const linia = (xa, ya, xb, yb) =>
        `<line x1="${xa}" y1="${ya}" x2="${xb}" y2="${yb}" stroke="#475569" stroke-width="1.5" stroke-linecap="round"/>`;
    const [[xa, ya], [xb, yb]] = costats.p;
    const mx = (xa + xb) / 2 + nx * (OFF + GAP + (costat === 'B' ? 7 : 0));
    const my = (ya + yb) / 2 + ny * (OFF + GAP + (costat === 'B' ? 7 : 0));
    const transform = costats.gir ? ` transform="rotate(${costats.gir},${mx},${my})"` : '';
    return (
        linia(xa, ya, xa + nx * EXT, ya + ny * EXT) +
        linia(xb, yb, xb + nx * EXT, yb + ny * EXT) +
        linia(xa + nx * OFF, ya + ny * OFF, xb + nx * OFF, yb + ny * OFF) +
        `<text x="${mx}" y="${my}" font-family="'Segoe UI',Tahoma,sans-serif" font-size="15" font-weight="700" fill="#1e293b" text-anchor="middle" dominant-baseline="middle"${transform}>1 cm</text>`
    );
}

/** El quadrat i els dos costats exteriors on es dibuixen les cotes: un cantó de la figura (o, si no n'hi ha, un quadrat amb dos costats). */
function ubicacioCotes(cells) {
    const vores = costatsExteriors(cells);
    const perQuadrat = new Map();
    for (const { r, c, costat } of vores) {
        const k = clauCella(r, c);
        perQuadrat.set(k, [...(perQuadrat.get(k) || []), costat]);
    }
    for (const parell of [
        ['T', 'L'],
        ['T', 'R'],
        ['B', 'L'],
        ['B', 'R'],
    ])
        for (const [k, costats] of perQuadrat)
            if (parell.every(s => costats.includes(s))) {
                const [r, c] = k.split(',').map(Number);
                return { r, c, costats: parell };
            }
    for (const [k, costats] of perQuadrat)
        if (costats.length >= 2) {
            const [r, c] = k.split(',').map(Number);
            return { r, c, costats: costats.slice(0, 2) };
        }
    return null;
}

/** Un número dins d'un cercle blanc: l'ajuda. */
const numero = (x, y, n, color) =>
    `<circle cx="${x}" cy="${y}" r="9" fill="#ffffff" stroke="${color}" stroke-width="2"/><text x="${x}" y="${y}" font-family="'Segoe UI',Tahoma,sans-serif" font-size="13" font-weight="800" fill="${color}" text-anchor="middle" dominant-baseline="central">${n}</text>`;

/**
 * El dibuix de la figura (SVG). `ajuda` pot ser null, 'area' (cada quadrat numerat) o 'perimetre' (cada costat de la vora,
 * donant la volta, numerat).
 */
export function htmlFigura(figura, ajuda = null) {
    const { cells } = figura;
    const files = Math.max(...cells.map(([r]) => r)) + 1;
    const columnes = Math.max(...cells.map(([, c]) => c)) + 1;
    const W = columnes * CELL + 2 * PAD;
    const H = files * CELL + 2 * PAD;
    let fons = '';
    let quadrats = '';
    for (const [r, c] of cells) {
        const x = PAD + c * CELL;
        const y = PAD + r * CELL;
        fons += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>`;
        quadrats += `<rect x="${x + 2}" y="${y + 2}" width="${CELL - 4}" height="${CELL - 4}" rx="4" fill="#0d9488" stroke="#0f766e" stroke-width="2"/>`;
    }
    const vora = contorn(cells)
        .map(
            s =>
                `<line x1="${PAD + s.x1 * CELL}" y1="${PAD + s.y1 * CELL}" x2="${PAD + s.x2 * CELL}" y2="${PAD + s.y2 * CELL}" stroke="#134e4a" stroke-width="4" stroke-linecap="square"/>`
        )
        .join('');
    const ubicacio = ubicacioCotes(cells);
    const cotes = ubicacio ? ubicacio.costats.map(s => htmlCota(ubicacio.r, ubicacio.c, s)).join('') : '';

    let numeros = '';
    if (ajuda === 'area') {
        const ordenats = [...cells].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        numeros = ordenats
            .map(([r, c], i) => numero(PAD + c * CELL + CELL / 2, PAD + r * CELL + CELL / 2, i + 1, '#0f766e'))
            .join('');
    } else if (ajuda === 'perimetre') {
        // El número va dins del quadrat, a prop del costat (la normal cap a dins és la de la dreta del sentit de la volta)
        numeros = contorn(cells)
            .map((s, i) => {
                const dx = s.x2 - s.x1;
                const dy = s.y2 - s.y1;
                const x = PAD + ((s.x1 + s.x2) / 2) * CELL - dy * 12;
                const y = PAD + ((s.y1 + s.y2) / 2) * CELL + dx * 12;
                return numero(x, y, i + 1, '#7c2d12');
            })
            .join('');
    }
    return `<svg class="figura-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${textParaula('figura', { article: false })}">${fons}${quadrats}${vora}${cotes}${numeros}</svg>`;
}

// ── Textos plans per a la revisió ────────────────────────────────────────────

/** La pregunta, en text pla: el nom de la figura i el que se'n demana. */
export const textPregunta = figura => `${figura.nom}: ? cm² · ? cm`;

/** La resposta de l'alumne, en text pla: «5 cm² · 10 cm». */
export const textResposta = (area, perim) => `${area} cm² · ${perim} cm`;
