/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-fraccions/vista.js
 * ROL: L'HTML i els textos plans de la pantalla de «Fraccions» a partir d'un
 *      problema (vegeu generaProblema a generador.js): l'expressió, les
 *      caselles de cada pas, les marques ✔/✖ d'una resposta equivocada i
 *      l'ajuda. Només hi ha fraccions, nombres i símbols.
 *      No toca el DOM: només construeix text. Es prova des de Node
 *      (tests/activitats.test.js); el controlador és a-fraccions.js.
 * DEPENDÈNCIES: generador.js.
 * ============================================================================
 */
import { filesJaFetes, mcm, numeradorEquivalent, senseSimplificar } from './generador.js';

const SIGNE = { '+': '+', '-': '−', '·': '·', ':': ':' };

// ── Peces ────────────────────────────────────────────────────────────────────

/** Una fracció escrita (o el nombre sol si el denominador és 1). */
export function htmlFraccio(n, d) {
    if (d === 1) return `<span class="math-cell integer-val">${n}</span>`;
    return `<div class="fraction"><span class="math-cell">${n}</span><hr><span class="math-cell">${d}</span></div>`;
}

const operador = signe => `<span class="operator">${signe}</span>`;

/** L'expressió inicial: «3/4 + 2/6 =». */
export function htmlProblema(p) {
    return `<div class="expr-line">${htmlFraccio(p.n1, p.d1)}${operador(SIGNE[p.op])}${htmlFraccio(p.n2, p.d2)}${operador('=')}</div>`;
}

/** Una línia nova de la resolució: «= 9/12 + 4/12». */
export const htmlLinia = contingut => `<div class="expr-line">${operador('=')}${contingut}</div>`;

/** La línia que s'afegeix quan un pas és bo (cap, al pas del denominador comú). */
export function htmlLiniaDelPas(p, estat, pas, r) {
    if (pas === 'den') return ''; // triar el denominador comú no escriu res a l'expressió
    if (pas === 'equiv')
        return htmlLinia(
            `${htmlFraccio(estat.num1, estat.D)}${operador(SIGNE[p.op])}${htmlFraccio(estat.num2, estat.D)}`
        );
    if (pas === 'inversa') return htmlLinia(`${htmlFraccio(p.n1, p.d1)}${operador('·')}${htmlFraccio(p.d2, p.n2)}`);
    if (pas === 'resultat') {
        // Si l'alumne ja ha escrit el resultat simplificat, és el que es mostra
        const s = senseSimplificar(p, estat);
        const ok = r.n === s.n && (r.d ?? 1) === s.d;
        return htmlLinia(htmlFraccio(ok ? s.n : p.final.n, ok ? s.d : p.final.d));
    }
    return htmlLinia(htmlFraccio(r.n, r.d ?? 1));
}

// ── Les caselles de cada pas ─────────────────────────────────────────────────

const casella = (id, extra = '') =>
    `<input type="text" id="${id}" class="math-cell ${extra}" autocomplete="off" inputmode="none" aria-label="Escriu la resposta">`;

const fraccioAmbCaselles = (idN, idD) => `<div class="fraction">${casella(idN)}<hr>${idD ? casella(idD) : ''}</div>`;

/**
 * Les caselles d'un pas (cada pas té els seus ids):
 *   den: «4 → [ ] ← 6»   equiv: «3/4 = [ ]/12» (una fila per fracció)   inversa: «[ ]/[ ]»
 *   resultat: «= [ ]/[ ]»   simplifica: «✂️ = [ ]/[ ]»
 */
export function htmlPas(p, estat, pas) {
    if (pas === 'den') {
        return `<div class="step-row"><span class="math-cell">${p.d1}</span>${operador('→')}${casella('in-den')}${operador('←')}<span class="math-cell">${p.d2}</span></div>`;
    }
    if (pas === 'equiv') {
        const { f1, f2 } = filesJaFetes(p, estat.D);
        const fila = (n, d, id, feta) =>
            feta
                ? ''
                : `<div class="step-row">${htmlFraccio(n, d)}${operador('=')}<div class="fraction">${casella(id)}<hr><span class="math-cell">${estat.D}</span></div></div>`;
        return fila(p.n1, p.d1, 'in-n1', f1) + fila(p.n2, p.d2, 'in-n2', f2);
    }
    if (pas === 'inversa') {
        return `<div class="step-row">${htmlFraccio(p.n1, p.d1)}${operador('·')}${fraccioAmbCaselles('in-n', 'in-d')}</div>`;
    }
    const marca = pas === 'simplifica' ? '<span class="operator" aria-hidden="true">✂️</span>' : '';
    return `<div class="step-row">${marca}${operador('=')}${fraccioAmbCaselles('in-n', 'in-d')}</div>`;
}

// ── La resposta equivocada, sense frases ─────────────────────────────────────

const xip = (text, bo) => `<span class="part ${bo ? 'bo' : 'mal'}">${text} ${bo ? '✔' : '✖'}</span>`;

/**
 * Després d'una resposta equivocada, el que ha escrit amb ✔ o ✖:
 *   den: les dues divisions «12 ÷ 4 ✔  12 ÷ 6 ✖» (és múltiple dels dos denominadors?)
 *   equiv: cada numerador escrit amb ✔ o ✖    inversa i resultat: el numerador i el denominador amb ✔ o ✖
 *   simplifica: la fracció escrita amb ✖ (no és equivalent)
 */
export function htmlMarques(p, estat, pas, r) {
    if (pas === 'den') {
        const d = (D, divisor) => xip(`${D} ÷ ${divisor}`, D % divisor === 0);
        return d(r.D, p.d1) + d(r.D, p.d2);
    }
    if (pas === 'equiv') {
        const { f1, f2 } = filesJaFetes(p, estat.D);
        const marca = (valor, n, d, feta) =>
            feta ? '' : xip(`${valor}`, valor === numeradorEquivalent(n, d, estat.D));
        return marca(r.n1, p.n1, p.d1, f1) + marca(r.n2, p.n2, p.d2, f2);
    }
    const esperat =
        pas === 'inversa'
            ? { n: p.d2, d: p.n2 }
            : pas === 'resultat'
              ? senseSimplificar(p, estat)
              : { n: p.final.n, d: p.final.d };
    const d = r.d ?? 1;
    if (pas === 'simplifica') return xip(`${r.n}/${d}`, false);
    // El resultat també es dona per bo si és la fracció ja simplificada: es marca cada part respecte del que toca
    return xip(`${r.n}`, r.n === esperat.n) + xip(`${d}`, d === esperat.d);
}

/** Una fracció bona, però encara simplificable: una marca de «torna-ho a provar» (⟳). */
export const htmlRepeteix = () => '<span class="part pista">⟳</span>';

// ── L'ajuda ──────────────────────────────────────────────────────────────────

const PRIMERS = [2, 3, 5, 7];

/** Una fila de l'ajuda. */
const fila = contingut => `<div class="ajuda-fila">${contingut}</div>`;

/** Els múltiples d'un denominador fins a `fins`, amb `destacat` en destacat. */
function multiples(d, fins, destacat) {
    const m = [];
    for (let k = d; k <= fins; k += d) m.push(k === destacat ? `<b class="comu">${k}</b>` : `${k}`);
    return m.join(' ');
}

/** Un primer amb ✔ si divideix el numerador i el denominador del resultat que toca simplificar. */
function htmlPrimer(primer, sense) {
    const divideix = sense.n % primer === 0 && sense.d % primer === 0;
    return `<span class="ajuda-primer ${divideix ? 'divideix' : 'no-divideix'}">${primer} ${divideix ? '✔' : '✖'}</span>`;
}

/**
 * L'ajuda 💡, només amb nombres i símbols:
 *   den: els múltiples dels dos denominadors (el primer comú, en destacat)
 *   equiv: cada fracció amb el seu factor «3/4 ×3→ 9/12»
 *   inversa: la segona fracció girada «2/5 ⇄ 5/2»
 *   resultat: l'operació amb els numeradors i, al producte i la divisió, també amb els denominadors
 *   simplifica: els primers que divideixen el numerador i el denominador «2 ✔ 3 ✖»
 */
export function htmlAjuda(p, estat, pas) {
    if (pas === 'den') {
        const comu = mcm(p.d1, p.d2);
        const fins = Math.max(p.d1, p.d2, comu);
        const una = d => fila(`<span class="ajuda-nombre">${d}</span> ${multiples(d, fins, comu)}`);
        return una(p.d1) + una(p.d2);
    }
    if (pas === 'equiv') {
        const { f1, f2 } = filesJaFetes(p, estat.D);
        const una = (n, d, feta) =>
            feta
                ? ''
                : fila(
                      `${htmlFraccio(n, d)}<span class="ajuda-factor">×${estat.D / d}</span>${operador('→')}${htmlFraccio(numeradorEquivalent(n, d, estat.D), estat.D)}`
                  );
        return una(p.n1, p.d1, f1) + una(p.n2, p.d2, f2);
    }
    if (pas === 'inversa') return fila(`${htmlFraccio(p.n2, p.d2)}${operador('⇄')}${htmlFraccio(p.d2, p.n2)}`);
    const terme = text => `<span class="ajuda-terme">${text}</span>`;
    if (pas === 'resultat') {
        if (p.op === '+' || p.op === '-') return fila(terme(`${estat.num1} ${SIGNE[p.op]} ${estat.num2} = ?`));
        const [n, d] =
            p.op === '·'
                ? [
                      [p.n1, p.n2],
                      [p.d1, p.d2],
                  ]
                : [
                      [p.n1, p.d2],
                      [p.d1, p.n2],
                  ];
        return fila(terme(`${n[0]} · ${n[1]} = ?`)) + fila(terme(`${d[0]} · ${d[1]} = ?`));
    }
    return fila(PRIMERS.map(q => htmlPrimer(q, senseSimplificar(p, estat))).join(' '));
}

// ── Textos plans per a la revisió ────────────────────────────────────────────

/** El problema, en text pla: «3/4 + 2/6». */
export const textProblema = p => `${p.n1}/${p.d1} ${SIGNE[p.op]} ${p.n2}/${p.d2}`;

/** La pregunta d'un pas, en text pla. */
export function textPregunta(p, estat, pas) {
    if (pas === 'den') return `${p.d1} → ? ← ${p.d2}`;
    if (pas === 'equiv') return `${p.n1}/${p.d1} = ?/${estat.D} · ${p.n2}/${p.d2} = ?/${estat.D}`;
    if (pas === 'inversa') return `${p.n1}/${p.d1} · ?/?`;
    return `${textProblema(p)} = ?/?`;
}

/** La resposta de l'alumne a un pas, en text pla. */
export function textResposta(pas, r) {
    if (pas === 'den') return `${r.D}`;
    if (pas === 'equiv') return [r.n1, r.n2].filter(v => v !== null).join(' · ');
    return `${r.n}/${r.d ?? 1}`;
}
