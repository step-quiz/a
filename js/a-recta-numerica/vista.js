/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-recta-numerica/vista.js
 * ROL: L'HTML de la pantalla de «Temperatura»: el gràfic SVG (els dies a l'eix
 *      horitzontal i la temperatura a la vertical) i la pregunta, només amb
 *      xifres i símbols: «☀️ avui → 🌡️ ? ºC», «🌡️ 3 ºC → 📅 ?», «📅 ? → 🥵».
 *      No toca el DOM: només construeix text (es prova des de Node).
 * DEPENDÈNCIES: generador.js.
 * ============================================================================
 */
import { X_MAX, X_MIN, etiquetaTemp } from './generador.js';

const W = 560;
const H = 420;
const ML = 20;
const MR = 20;
const MT = 30;
const MB = 20;
const PW = W - ML - MR;
const PH = H - MT - MB;
const FONT = 'font-family="\'Segoe UI\',system-ui,sans-serif"';

/**
 * El gràfic: la quadrícula, els eixos amb les seves xifres, una franja suau a «avui» (☀️) i, si es dona `destacaX`, a
 * aquest dia; i els punts. `yRange` és { min, max, majorStep, minorStep }.
 */
export function htmlGrafic(cloud, yRange, destacaX = null) {
    const tx = x => ML + ((x - X_MIN) / (X_MAX - X_MIN)) * PW;
    const ty = y => MT + PH - ((y - yRange.min) / (yRange.max - yRange.min)) * PH;
    const px0 = tx(0);
    const py0 = yRange.min <= 0 && yRange.max >= 0 ? ty(0) : MT + PH;
    const f = n => n.toFixed(1);
    const s = [];

    s.push(`<rect x="${ML}" y="${MT}" width="${PW}" height="${PH}" fill="#ffffff"/>`);
    const franja = (x, color) =>
        `<rect x="${f(tx(x) - PW / (X_MAX - X_MIN) / 2)}" y="${MT}" width="${f(PW / (X_MAX - X_MIN))}" height="${PH}" fill="${color}"/>`;
    s.push(franja(0, '#fef9c3'));
    if (destacaX !== null && destacaX !== 0) s.push(franja(destacaX, '#dbeafe'));
    s.push(`<text x="${f(px0)}" y="${MT - 8}" text-anchor="middle" font-size="16" aria-hidden="true">☀️</text>`);

    if (yRange.minorStep < yRange.majorStep)
        for (let y = yRange.min; y <= yRange.max; y += yRange.minorStep)
            s.push(
                `<line x1="${ML}" y1="${f(ty(y))}" x2="${ML + PW}" y2="${f(ty(y))}" stroke="#b8c4ce" stroke-width="0.7"/>`
            );
    for (let x = X_MIN; x <= X_MAX; x++)
        s.push(
            `<line x1="${f(tx(x))}" y1="${MT}" x2="${f(tx(x))}" y2="${MT + PH}" stroke="#b8c4ce" stroke-width="0.7"/>`
        );
    for (let y = yRange.min; y <= yRange.max; y += yRange.majorStep)
        s.push(
            `<line x1="${ML}" y1="${f(ty(y))}" x2="${ML + PW}" y2="${f(ty(y))}" stroke="#9aaab8" stroke-width="1"/>`
        );

    // Els eixos (y = 0 i x = 0) i les seves xifres
    s.push(`<line x1="${ML}" y1="${f(py0)}" x2="${ML + PW}" y2="${f(py0)}" stroke="#000000" stroke-width="2"/>`);
    s.push(`<line x1="${f(px0)}" y1="${MT}" x2="${f(px0)}" y2="${MT + PH}" stroke="#000000" stroke-width="2"/>`);
    const text = (x, y, anchor, contingut) =>
        `<text x="${f(x)}" y="${f(y)}" text-anchor="${anchor}" ${FONT} font-size="14" font-weight="600" fill="#000000">${contingut}</text>`;
    for (let y = yRange.min; y <= yRange.max; y += yRange.majorStep) {
        if (y === 0) continue;
        s.push(
            `<line x1="${f(px0 - 4)}" y1="${f(ty(y))}" x2="${f(px0 + 4)}" y2="${f(ty(y))}" stroke="#000000" stroke-width="1.5"/>`
        );
        s.push(text(px0 - 8, ty(y) + 5, 'end', y < 0 ? `−${-y}` : y));
    }
    for (let x = X_MIN; x <= X_MAX; x++) {
        if (x === 0) continue;
        s.push(
            `<line x1="${f(tx(x))}" y1="${f(py0 - 4)}" x2="${f(tx(x))}" y2="${f(py0 + 4)}" stroke="#000000" stroke-width="1.5"/>`
        );
        s.push(text(tx(x), py0 + 20, 'middle', x < 0 ? `−${-x}` : x));
    }
    s.push(text(px0 - 8, py0 + 20, 'end', 0));
    s.push(`<text x="${f(px0 + 6)}" y="16" ${FONT} font-size="13" font-weight="700" fill="#000000">ºC</text>`);

    for (const p of cloud)
        s.push(
            `<circle cx="${f(tx(p.x))}" cy="${f(ty(p.y))}" r="7" fill="#0077b6" stroke="white" stroke-width="2.5"/>`
        );

    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="ºC" style="width:100%;height:100%;display:block">${s.join('')}</svg>`;
}

const xip = (classe, contingut) => `<span class="xip ${classe}">${contingut}</span>`;
const fletxa = '<span class="fletxa" aria-hidden="true">→</span>';
const termometre = (valor = '?') => xip('xip-temp', `<span aria-hidden="true">🌡️</span> ${valor}`);

/**
 * La pregunta, només amb símbols: temperatura → dies o dia → més calent / més fred. Quan es demana la temperatura d'un dia
 * només hi ha el termòmetre «? ºC»: el dia (avui, ahir, «Fa 3 dies»…) ja el diu la frase d'instrucció.
 */
export function htmlPregunta(pregunta) {
    if (pregunta.tipus === 'Q3')
        return (
            xip('xip-temp', `<span aria-hidden="true">🌡️</span> ${etiquetaTemp(pregunta.y)}`) +
            fletxa +
            xip('xip-dia', '<span aria-hidden="true">📅</span> ?')
        );
    if (pregunta.tipus === 'Q4')
        return (
            xip('xip-dia', '<span aria-hidden="true">📅</span> ?') +
            fletxa +
            xip('xip-temp', pregunta.extrem === 'calent' ? '🥵' : '🥶')
        );
    return termometre('? ºC');
}
