/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/lexicon/mates.js
 * ROL: Les imatges dels termes de matemàtiques del lèxic (`imatge: { mates: 'id' }`
 *      a js/lexicon/dades.js). Un terme com «equació» o «angle agut» no es pot
 *      dibuixar amb un emoji: la seva imatge és un MINI-EXEMPLE fet amb HTML
 *      (x + 3 = 8; 2³ amb el 2 destacat) o amb un dibuix SVG propi (un triangle
 *      isòsceles amb les marques de costats iguals). L'exemple sempre ensenya el
 *      que vol dir el terme: «base» és el 2 de 2³, i l'«exponent», el 3.
 *      Només HTML i SVG propis, sense res extern ni scripts; la prova de coherència
 *      (tests/lexicon.test.js) ho comprova, i que cada imatge sigui única.
 *      Els estils (.mat*, .mat-svg) són a css/shared.css.
 *      Dades i petites funcions que construeixen text, sense DOM: es prova des de Node.
 * ============================================================================
 */

// ── Peces de text ────────────────────────────────────────────────────────────

const fr = (a, b) => `<span class="mat-frac"><span>${a}</span><span>${b}</span></span>`;
/** Una part destacada (la que el terme anomena). */
const D = t => `<span class="mat-dest">${t}</span>`;
const POS = t => `<span class="mat-pos">${t}</span>`;
const NEG = t => `<span class="mat-neg">${t}</span>`;
const lin = (...t) => `<span class="mat-linia">${t.join('')}</span>`;
const mat = (...linies) => `<span class="mat">${linies.join('')}</span>`;
/** El mateix, més petit: per a les expressions llargues (que han de cabre en una carta). */
const matp = (...linies) => `<span class="mat mat-p">${linies.join('')}</span>`;
/** Una potència dins d'una línia: la base i l'exponent, junts. */
const pw = (b, e, destE = false) => `<span>${b}<sup${destE ? ' class="mat-dest"' : ''}>${e}</sup></span>`;
/** Un emoji gran dins d'un mini-exemple. */
const emo = e => `<span class="mat-emoji">${e}</span>`;

// ── Peces de dibuix (SVG) ────────────────────────────────────────────────────

const r1 = n => Math.round(n * 10) / 10;
const pts = a => a.map(p => p.join(',')).join(' ');
const rad = d => (d * Math.PI) / 180;
/** El punt a distància `r` del centre i amb l'angle `deg` (contra el rellotge, des de la dreta; l'eix y del dibuix va cap avall). */
const polar = (cx, cy, r, deg) => [r1(cx + r * Math.cos(rad(deg))), r1(cy - r * Math.sin(rad(deg)))];
const regular = (n, cx, cy, r, rot = 90) => Array.from({ length: n }, (_, i) => polar(cx, cy, r, rot + (i * 360) / n));

/** classes: l = línia, t = línia fina, f = farcit gris, f2/f3 = farcits més foscos (cares d'un cos), d = línia destacada, df = farcit destacat, g = guia discontínua, p = punt */
const svg = (cos, vb = '0 0 60 44') =>
    `<span class="mat"><svg class="mat-svg" viewBox="${vb}" aria-hidden="true" focusable="false">${cos}</svg></span>`;
const poly = (a, cls = 'f') => `<polygon class="${cls}" points="${pts(a)}"/>`;
const ln = (x1, y1, x2, y2, cls = 'l') => `<line class="${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
const pa = (d, cls = 'l') => `<path class="${cls}" d="${d}"/>`;
const ci = (cx, cy, r, cls = 'f') => `<circle class="${cls}" cx="${cx}" cy="${cy}" r="${r}"/>`;
const pt = (x, y, r = 2.8) => ci(x, y, r, 'p');
const re = (x, y, w, h, cls = 'f') => `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}"/>`;
const el = (cx, cy, rx, ry, cls = 'f') => `<ellipse class="${cls}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`;
const tx = (x, y, t, anchor = 'middle') => `<text x="${x}" y="${y}" text-anchor="${anchor}">${t}</text>`;
/** El xurret d'una fletxa a (x2, y2) cap a on va el segment (x1, y1) → (x2, y2). */
function fletxa(x1, y1, x2, y2) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const p = k => [r1(x2 - 6 * Math.cos(a + k)), r1(y2 - 6 * Math.sin(a + k))];
    return `<polyline class="l" points="${pts([p(-0.5), [x2, y2], p(0.5)])}"/>`;
}
/** `n` marques petites, perpendiculars, al mig d'un costat (les de «costats iguals»). */
function marques(x1, y1, x2, y2, n) {
    const L = Math.hypot(x2 - x1, y2 - y1);
    const u = [(x2 - x1) / L, (y2 - y1) / L];
    const nor = [-u[1], u[0]];
    const m = [(x1 + x2) / 2, (y1 + y2) / 2];
    return Array.from({ length: n }, (_, i) => {
        const o = (i - (n - 1) / 2) * 3.2;
        const c = [m[0] + o * u[0], m[1] + o * u[1]];
        return ln(r1(c[0] - 3.4 * nor[0]), r1(c[1] - 3.4 * nor[1]), r1(c[0] + 3.4 * nor[0]), r1(c[1] + 3.4 * nor[1]));
    }).join('');
}
/** Un sector d'un cercle (de l'angle a0 a l'a1, contra el rellotge). */
function sector(cx, cy, r, a0, a1, cls) {
    const [x0, y0] = polar(cx, cy, r, a0);
    const [x1, y1] = polar(cx, cy, r, a1);
    return pa(`M${cx} ${cy} L${x0} ${y0} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 0 ${x1} ${y1} Z`, cls);
}
/** Un cercle partit en sectors (parts del total); el que té l'índex `dest` surt destacat. */
function pastis(parts, dest, cx = 30, cy = 22, r = 19) {
    let a = 90;
    return parts
        .map((p, i) => {
            const s = sector(cx, cy, r, a, a + p * 360, i === dest ? 'df' : 'f');
            a += p * 360;
            return s;
        })
        .join('');
}
/** Els dos eixos (cap a la dreta i cap amunt) amb l'origen a (x0, y0). */
const eixos = (x0 = 14, y0 = 34) =>
    ln(4, y0, 56, y0) + fletxa(4, y0, 56, y0) + ln(x0, 40, x0, 4) + fletxa(x0, 40, x0, 4);

/** Una graella de punts (files × columnes) centrada al dibuix: la desena (2 × 5) i la centena (10 × 10). */
const dots = (files, cols, dx, dy, r = 2.6) =>
    Array.from({ length: files * cols }, (_, i) =>
        pt(r1(30 + ((i % cols) - (cols - 1) / 2) * dx), r1(22 + (Math.floor(i / cols) - (files - 1) / 2) * dy), r)
    ).join('');

// ── Cossos: cares d'un cub, etc. ─────────────────────────────────────────────

const cub = (cls = ['f', 'f2', 'f3']) =>
    poly(
        [
            [30, 4],
            [52, 14],
            [30, 24],
            [8, 14],
        ],
        cls[0]
    ) +
    poly(
        [
            [8, 14],
            [30, 24],
            [30, 44],
            [8, 34],
        ],
        cls[1]
    ) +
    poly(
        [
            [52, 14],
            [30, 24],
            [30, 44],
            [52, 34],
        ],
        cls[2]
    );

// ── Les imatges ──────────────────────────────────────────────────────────────

export const MATES = {
    // ── Els nombres ──────────────────────────────────────────────────────────
    'nombre-natural': mat(lin('0 1 2 3 …')),
    'nombre-enter': matp(lin('… −2 −1 0 1 2 …')),
    'nombre-positiu': mat(lin(POS('+5'))),
    'nombre-negatiu': mat(lin(NEG('−5'))),
    'nombre-decimal': mat(lin('3,14')),
    'nombre-parell': mat(lin('2 4 6 8')),
    'nombre-senar': mat(lin('1 3 5 7 9')),
    'nombre-primer': mat(lin('2 3 5 7 11')),
    'multiple': mat(lin('3 6 9 12 …')),
    'xifra': mat(lin(D('3'), ' 4 7')),
    'desena': svg(dots(2, 5, 12, 16)),
    'centena': svg(
        re(10, 2, 40, 40, 'df') +
            [14, 18, 22, 26, 30, 34, 38, 42, 46].map(x => ln(x, 2, x, 42, 't')).join('') +
            [6, 10, 14, 18, 22, 26, 30, 34, 38].map(y => ln(10, y, 50, y, 't')).join('') +
            re(10, 2, 40, 40, 'l')
    ),
    'valor-absolut': matp(lin('|−3| = ', D('3'))),
    'nombre-oposat': mat(lin(POS('+3'), ' ↔ ', NEG('−3'))),
    'recta-numerica': svg(
        ln(4, 24, 56, 24) +
            fletxa(4, 24, 56, 24) +
            [10, 20, 30, 40, 50].map(x => ln(x, 20, x, 28)).join('') +
            pt(30, 24, 3.4) +
            tx(10, 39, '−2') +
            tx(30, 39, '0') +
            tx(50, 39, '2')
    ),
    'zero': mat(lin('0')),
    'signe': mat(lin('+  −')),

    // ── Les operacions ───────────────────────────────────────────────────────
    'suma': mat(lin('3 + 4')),
    'resta': mat(lin('7 − 4')),
    'multiplicacio': mat(lin('3 · 4')),
    'divisio': mat(lin('12 ÷ 3')),
    'potencia': mat(lin(pw('2', '3'))),
    'arrel-quadrada': mat(lin('√9 = 3')),
    'parentesi': mat(lin('2 · ', D('(3 + 4)'))),
    'prioritat': mat(lin('2 + ', D('3 · 4'))),
    'resultat': mat(lin('3 + 4 = ', D('7'))),
    'sumand': mat(lin(D('3'), ' + ', D('4'), ' = 7')),
    'factor': mat(lin(D('3'), ' · ', D('4'), ' = 12')),
    'producte': mat(lin('3 · 4 = ', D('12'))),
    'dividend': mat(lin(D('12'), ' ÷ 3 = 4')),
    'divisor': mat(lin('12 ÷ ', D('3'), ' = 4')),
    'quocient': mat(lin('12 ÷ 3 = ', D('4'))),
    'residu': matp(lin('13 = 4 · 3 + ', D('1'))),
    'base': mat(lin(pw(D('2'), '3'))),
    'exponent': mat(lin(pw('2', '3', true))),
    'propietat-commutativa': matp(lin('3 + 4 = 4 + 3')),
    'propietat-associativa': matp(lin('(2 + 3) + 4'), lin('= 2 + (3 + 4)')),
    'propietat-distributiva': matp(lin('2 · (3 + 4)'), lin('= 2 · 3 + 2 · 4')),

    // ── Fraccions i proporcionalitat ─────────────────────────────────────────
    'fraccio': svg(pastis([0.25, 0.75], 1) + ci(30, 22, 19, 'l'), '0 0 60 44'),
    'numerador': mat(lin(`<span class="mat-frac"><span class="mat-dest">3</span><span>4</span></span>`)),
    'denominador': mat(lin(`<span class="mat-frac"><span>3</span><span class="mat-dest">4</span></span>`)),
    'fraccio-equivalent': mat(lin(fr(1, 2), ' = ', fr(2, 4))),
    'simplificar-fraccio': mat(lin(fr(4, 8), ' → ', fr(1, 2))),
    'fraccio-irreductible': matp(lin(fr(6, 8), ' ✖  ', fr(3, 4), ' ✔')),
    'mcd': matp(lin('MCD(12, 18) = ', D('6'))),
    'mcm': matp(lin('MCM(4, 6) = ', D('12'))),
    'percentatge': mat(lin('25 % = ', fr(25, 100))),
    'rao': mat(lin('3 : 4')),
    'proporcio': matp(lin('2 : 3 = 4 : 6')),
    'constant-proporcionalitat': matp(lin('1 → 3'), lin('2 → 6'), lin('×', D('3'))),
    'regla-de-tres': mat(lin('2 → 6'), lin('5 → ', D('?'))),
    'proporcionalitat-directa': svg(eixos() + ln(14, 34, 52, 10, 'd')),

    // ── Àlgebra ──────────────────────────────────────────────────────────────
    'expressio-algebraica': mat(lin('3x + 2')),
    'variable': matp(lin('x = 1, 2, 3 …')),
    'incognita': mat(`<span class="mat-caixa">x</span>`),
    'coeficient': mat(lin(D('3'), 'x')),
    'terme': mat(lin(D('3x'), ' + ', D('5'))),
    'monomi': mat(lin(pw('4x', '2'))),
    'polinomi': mat(lin(pw('x', '2'), ' + 3x − 2')),
    'igualtat': mat(lin('2 + 3 ', D('='), ' 5')),
    'equacio': mat(lin('x + 3 = 8')),
    'membre': mat(lin(D('x + 3'), ' = ', D('8'))),
    'solucio': mat(lin('x = ', D('5'), ' ✔')),
    'resoldre-equacio': mat(lin('x + 3 = 8'), lin('⇒ ', D('x = 5'))),
    'sistema-equacions': matp(lin('{ x + y = 5'), lin('{ x − y = 1')),
    'factoritzar': mat(lin('12 = ', pw('2', '2'), ' · 3')),

    // ── Punts, rectes i angles ───────────────────────────────────────────────
    'punt': svg(pt(30, 22, 4) + tx(40, 16, 'A')),
    'recta': svg(ln(4, 36, 56, 8) + fletxa(4, 36, 56, 8) + fletxa(56, 8, 4, 36)),
    'semirecta': svg(ln(10, 34, 56, 10) + fletxa(10, 34, 56, 10) + pt(10, 34, 3.4)),
    'segment': svg(ln(8, 32, 52, 12) + pt(8, 32, 3.4) + pt(52, 12, 3.4)),
    'angle': svg(ln(12, 36, 54, 36) + ln(12, 36, 30, 3) + pa('M26 36 A14 14 0 0 0 19 23.7', 'd')),
    'angle-recte': svg(ln(14, 38, 54, 38) + ln(14, 38, 14, 4) + pa('M24 38 V28 H14', 'l') + tx(36, 28, '90°')),
    'angle-agut': svg(
        ln(8, 38, 54, 38) + ln(8, 38, 48, 14) + pa('M28 38 A20 20 0 0 0 25 26.6', 'd') + tx(36, 33, '&lt;90°', 'start')
    ),
    'angle-obtus': svg(
        ln(26, 38, 56, 38) +
            ln(26, 38, 8.8, 13.4) +
            pa('M38 38 A12 12 0 0 0 19.1 28.2', 'd') +
            tx(40, 31, '&gt;90°', 'start')
    ),
    'recta-paral-lela': svg(ln(6, 32, 52, 12) + ln(12, 42, 58, 22) + fletxa(6, 32, 52, 12) + fletxa(12, 42, 58, 22)),
    'recta-perpendicular': svg(ln(6, 26, 54, 26) + ln(30, 4, 30, 42) + pa('M38 26 V18 H30')),

    // ── Figures planes ───────────────────────────────────────────────────────
    'poligon': svg(
        poly([
            [5, 28],
            [10, 10],
            [26, 3],
            [44, 6],
            [56, 22],
            [48, 40],
            [18, 41],
        ])
    ),
    'triangle': svg(
        poly([
            [6, 40],
            [36, 5],
            [54, 40],
        ])
    ),
    'triangle-equilater': svg(
        poly([
            [8, 40],
            [52, 40],
            [30, 2],
        ]) +
            marques(8, 40, 52, 40, 1) +
            marques(52, 40, 30, 2, 1) +
            marques(30, 2, 8, 40, 1)
    ),
    'triangle-isosceles': svg(
        poly([
            [16, 40],
            [44, 40],
            [30, 3],
        ]) +
            marques(16, 40, 30, 3, 1) +
            marques(44, 40, 30, 3, 1)
    ),
    'triangle-escale': svg(
        poly([
            [6, 40],
            [54, 40],
            [40, 6],
        ]) +
            marques(6, 40, 54, 40, 3) +
            marques(54, 40, 40, 6, 2) +
            marques(40, 6, 6, 40, 1)
    ),
    'triangle-rectangle': svg(
        poly([
            [10, 6],
            [10, 40],
            [54, 40],
        ]) + pa('M10 32 H18 V40')
    ),
    'quadrat': svg(re(14, 6, 32, 32)),
    'rectangle-figura': svg(re(6, 10, 48, 26)),
    'rombe': svg(
        poly([
            [30, 2],
            [54, 22],
            [30, 42],
            [6, 22],
        ])
    ),
    'parallelogram': svg(
        poly([
            [2, 38],
            [46, 38],
            [58, 8],
            [14, 8],
        ])
    ),
    'trapezi': svg(
        poly([
            [4, 38],
            [56, 38],
            [44, 8],
            [16, 8],
        ])
    ),
    'pentagon': svg(poly(regular(5, 30, 23, 19))),
    'hexagon': svg(poly(regular(6, 30, 22, 19, 0))),
    'circumferencia': svg(ci(30, 22, 19, 'l')),

    // ── Parts i mesures de les figures ───────────────────────────────────────
    'figura': svg(
        ci(17, 26, 11) +
            poly([
                [28, 40],
                [44, 8],
                [58, 40],
            ]) +
            re(22, 6, 18, 18)
    ),
    'vertex': svg(
        poly([
            [6, 40],
            [36, 5],
            [54, 40],
        ]) + ci(36, 5, 5, 'df')
    ),
    'costat': svg(
        poly([
            [8, 38],
            [52, 38],
            [46, 8],
            [14, 8],
        ]) + ln(8, 38, 52, 38, 'd')
    ),
    'diagonal': svg(re(10, 6, 40, 32) + ln(10, 6, 50, 38, 'd')),
    'altura': svg(
        poly([
            [6, 40],
            [54, 40],
            [22, 5],
        ]) +
            ln(22, 5, 22, 40, 'g') +
            pa('M22 33 H29 V40')
    ),
    'radi': svg(ci(30, 22, 19) + ln(30, 22, 49, 22, 'd') + pt(30, 22) + tx(40, 17, 'r')),
    'diametre': svg(ci(30, 22, 19) + ln(11, 22, 49, 22, 'd') + tx(30, 16, 'd')),
    'hipotenusa': svg(
        poly([
            [10, 6],
            [10, 40],
            [54, 40],
        ]) +
            ln(10, 6, 54, 40, 'd') +
            pa('M10 32 H18 V40')
    ),
    'catet': svg(
        poly([
            [10, 6],
            [10, 40],
            [54, 40],
        ]) +
            ln(10, 6, 10, 40, 'd') +
            pa('M10 32 H18 V40')
    ),
    'perimetre': svg(re(8, 8, 44, 28, 'f') + re(8, 8, 44, 28, 'd')),
    'area': svg(
        re(10, 6, 40, 32, 'df') +
            [20, 30, 40].map(x => ln(x, 6, x, 38, 'g')).join('') +
            ln(10, 22, 50, 22, 'g') +
            re(10, 6, 40, 32, 'l')
    ),
    'simetria': svg(
        poly([
            [8, 10],
            [28, 22],
            [8, 34],
        ]) +
            poly([
                [52, 10],
                [32, 22],
                [52, 34],
            ]) +
            ln(30, 2, 30, 42, 'g')
    ),

    // ── Cossos geomètrics ────────────────────────────────────────────────────
    'cub': svg(cub(), '0 0 60 48'),
    'prisma': svg(
        poly(
            [
                [8, 38],
                [30, 28],
                [42, 4],
                [20, 14],
            ],
            'f3'
        ) +
            poly(
                [
                    [32, 38],
                    [54, 28],
                    [42, 4],
                    [20, 14],
                ],
                'f2'
            ) +
            poly([
                [8, 38],
                [32, 38],
                [20, 14],
            ]),
        '0 0 60 48'
    ),
    'piramide': svg(
        ln(26, 24, 30, 4, 'g') +
            ln(26, 24, 6, 34, 'g') +
            ln(26, 24, 54, 32, 'g') +
            poly(
                [
                    [6, 34],
                    [34, 44],
                    [30, 4],
                ],
                'f'
            ) +
            poly(
                [
                    [34, 44],
                    [54, 32],
                    [30, 4],
                ],
                'f2'
            ),
        '0 0 60 48'
    ),
    'cilindre': svg(
        pa('M12 10 V36 A18 6 0 0 0 48 36 V10', 'f') + el(30, 10, 18, 6, 'f2') + pa('M12 36 A18 6 0 0 0 48 36', 'l'),
        '0 0 60 48'
    ),
    'con': svg(pa('M30 4 L12 36 A18 6 0 0 0 48 36 Z', 'f') + pa('M12 36 A18 6 0 0 1 48 36', 'g'), '0 0 60 48'),
    'esfera': svg(
        ci(30, 24, 20) + pa('M10 24 A20 6 0 0 0 50 24', 'l') + pa('M10 24 A20 6 0 0 1 50 24', 'g'),
        '0 0 60 48'
    ),
    'volum': mat(svg(cub(['df', 'f2', 'f3']), '0 0 60 48'), lin(pw('cm', '3'))),

    // ── Mesura ───────────────────────────────────────────────────────────────
    'longitud': svg(
        re(4, 12, 52, 16, 'f') + [10, 16, 22, 28, 34, 40, 46, 52].map((x, i) => ln(x, 12, x, i % 2 ? 19 : 23)).join('')
    ),
    'massa': mat(emo('⚖️')),
    'capacitat': svg(pa('M16 6 H44 L40 40 H20 Z', 'f') + pa('M18 20 H42 L40 40 H20 Z', 'df') + ln(14, 6, 46, 6)),
    'temps': mat(emo('⏳')),
    'metre': mat(lin('1 m')),
    'centimetre': mat(lin('1 cm')),
    'quilometre': mat(lin('1 km')),
    'gram': mat(lin('1 g')),
    'quilogram': mat(lin('1 kg')),
    'litre': mat(lin('1 L')),
    'segon': mat(lin('1 s')),
    'grau': mat(lin('90°')),

    // ── Funcions i gràfiques ─────────────────────────────────────────────────
    'eix': svg(ln(4, 30, 56, 30) + fletxa(4, 30, 56, 30) + [14, 24, 34, 44].map(x => ln(x, 26, x, 34)).join('')),
    'origen': svg(eixos() + pt(14, 34, 4) + tx(24, 30, '(0, 0)', 'start')),
    'coordenada': mat(lin('(3, 2)')),
    'abscissa': mat(lin('(', D('3'), ', 2)')),
    'ordenada': mat(lin('(3, ', D('2'), ')')),
    'quadrant': svg(
        re(30, 4, 26, 18, 'df') + ln(4, 22, 56, 22) + ln(30, 4, 30, 42) + fletxa(4, 22, 56, 22) + fletxa(30, 42, 30, 4)
    ),
    'pla-cartesia': svg(
        [14, 22, 30, 38, 46].map(x => ln(x, 6, x, 38, 'g')).join('') +
            [14, 22, 30].map(y => ln(6, y, 54, y, 'g')).join('') +
            eixos(6, 38) +
            pt(38, 14, 3.4)
    ),
    'funcio': mat(lin('y = 2x')),
    'grafica': svg(eixos() + pa('M16 32 C26 30 32 12 52 8', 'd')),
    'taula-de-valors': matp(lin('x  1  2  3'), lin('y  2  4  6')),
    'pendent': svg(eixos() + ln(14, 34, 54, 10, 'l') + pa('M30 24.4 H46 V16.4', 'd')),

    // ── Estadística i probabilitat ───────────────────────────────────────────
    'dada': mat(`<span class="mat-caixa">8</span>`),
    'frequencia': mat(lin('5 5 5'), lin('⇒ ', D('3'))),
    'mitjana': matp(lin('(2 + 4 + 6) ÷ 3'), lin('= ', D('4'))),
    'mediana': mat(lin('2 4 ', D('6'), ' 8 9')),
    'moda': mat(lin('3 ', D('5 5 5'), ' 7')),
    'rang': mat(lin('9 − 2 = ', D('7'))),
    'grafic-de-barres': svg(ln(6, 38, 56, 38) + re(10, 22, 10, 16) + re(25, 8, 10, 30, 'df') + re(40, 16, 10, 22)),
    'diagrama-de-sectors': svg(pastis([0.4, 0.3, 0.2, 0.1], 0) + ci(30, 22, 19, 'l')),
    'probabilitat': mat(lin('P = ', fr(1, 2))),
    'esdeveniment': mat(lin('{ 2, 4, 6 }')),
};
