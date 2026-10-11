/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-potencies/vista.js
 * ROL: L'HTML de la pantalla de «Potències» a partir d'una pregunta (vegeu
 *      generaPregunta a generador.js): la pregunta en gran, el que va davant
 *      del camp de resposta, l'ajuda (les potències escrites com a productes)
 *      i la comprovació d'una resposta equivocada amb xifres. Només hi ha
 *      nombres i símbols.
 *      No toca el DOM: només construeix text. Es prova des de Node
 *      (tests/activitats.test.js); el controlador és a-potencies.js.
 * DEPENDÈNCIES: cap.
 * ============================================================================
 */

const pot = (base, e) => `${base}<sup>${e}</sup>`;
const menys = n => String(n).replace('-', '−');
const unZeros = k => '1' + '0'.repeat(k);
const token = html => `<span class="pt">${html}</span>`;
const op = s => `<span class="po">${s}</span>`;

// ── La pregunta ──────────────────────────────────────────────────────────────

/** La pregunta en gran (sense el signe igual: aquest va al costat del camp de resposta). */
export function htmlPregunta(p) {
    if (p.tipus === 'prod') return token(pot(p.base, p.m)) + op('·') + token(pot(p.base, p.n));
    if (p.tipus === 'quot') return token(pot(p.base, p.m)) + op('÷') + token(pot(p.base, p.n));
    if (p.tipus === 'powpow') return token(`(${pot(p.base, p.m)})<sup>${p.n}</sup>`);
    if (p.tipus === 'baseneg') return token(p.parentesi ? `(−${p.base})<sup>${p.exp}</sup>` : `−${pot(p.base, p.exp)}`);
    if (p.sentit === 'a_cient') return token(p.nombre);
    return token(`${p.mant} · ${pot(10, p.exp)}`);
}

/** El que va entre el signe igual i el camp: la base (el camp és l'exponent) o la mantissa i el 10; res si s'escriu el valor. */
export function etiquetaResposta(p) {
    if (p.kind !== 'exp') return '';
    return p.tipus === 'cientifica' ? `${p.mant} · 10` : String(p.base);
}

// ── L'ajuda: les potències escrites com a productes ──────────────────────────

/** `k` factors iguals: «3·3·3». */
const factors = (base, k) => Array(k).fill(base).join('·');
const grup = html => `<span class="fac">(${html})</span>`;
const tatxat = html => `<s class="fac-tatxat">${html}</s>`;
const dibuix = html => `<div class="ajuda-dibuix">${html}</div>`;
const operacio = text => `<div class="ajuda-operacio">${text}</div>`;

/** Els productes parcials d'una potència amb base negativa: (−2)¹, (−2)², … fins a l'exponent anterior a l'últim. */
function parcials(p) {
    const llista = [];
    for (let k = 1; k < p.exp; k++) llista.push((-p.base) ** k);
    return llista.map(menys).concat('?').join(' → ');
}

/**
 * L'ajuda 💡, per tocs: 0 = res, 1 = la pregunta escrita com a productes (o la potència de 10 com a nombre),
 * 2 = el segon pas (els factors tatxats o comptats, els productes parcials o els 10 un a un) i, si escau,
 * l'operació dels exponents («2 + 4 = ?»).
 */
export function htmlAjuda(p, pas) {
    if (pas === 0) return '';
    const dos = pas === 2;
    if (p.tipus === 'prod') {
        const cos = grup(factors(p.base, p.m)) + op('·') + grup(factors(p.base, p.n));
        return dibuix(cos) + (dos ? operacio(`${p.m} + ${p.n} = ?`) : '');
    }
    if (p.tipus === 'quot') {
        const dalt = dos ? tatxat(factors(p.base, p.n)) + '·' + factors(p.base, p.m - p.n) : factors(p.base, p.m);
        const baix = dos ? tatxat(factors(p.base, p.n)) : factors(p.base, p.n);
        return dibuix(grup(dalt) + op('÷') + grup(baix)) + (dos ? operacio(`${p.m} − ${p.n} = ?`) : '');
    }
    if (p.tipus === 'powpow') {
        const copies = Array(p.n).fill(dos ? grup(factors(p.base, p.m)) : token(pot(p.base, p.m)));
        return dibuix(copies.join(op('·'))) + (dos ? operacio(`${p.m} · ${p.n} = ?`) : '');
    }
    if (p.tipus === 'baseneg') {
        if (p.parentesi) {
            const cos = dos ? parcials(p) : Array(p.exp).fill(`(−${p.base})`).join(op('·'));
            return dibuix(cos);
        }
        if (!dos) return dibuix(`−${grup(factors(p.base, p.exp))}`);
        const creixent = [...Array(p.exp)].map((_, i) => p.base ** (i + 1)).join(' → ');
        return dibuix(creixent) + operacio(`−(${p.base ** p.exp}) = ?`);
    }
    // Notació científica: el nombre, la mantissa i la potència de 10 escrita com a nombre; després, els 10 un a un
    const k = Math.abs(p.exp);
    const signe = p.exp < 0 ? '÷' : '·';
    const potDeu = dos ? Array(k).fill(`${signe} 10`).join(' ') : `${signe} ${unZeros(k)}`;
    const cos = `${p.mant} ${potDeu}`;
    return dibuix(p.sentit === 'a_cient' ? `${p.nombre} = ${cos}` : cos);
}

// ── La resposta equivocada ───────────────────────────────────────────────────

const xip = (html, ok) => `<span class="part ${ok ? 'bo' : 'mal'}"><span>${html}</span></span>`;

/** Una resposta equivocada comprovada amb xifres: «3⁵ = 243 ≠ 729 ✖», «+ ✖ 8 ✔» o «3400 = 3,4 · 10³ ✖». */
export function htmlComprovacio(c) {
    if (c.tipus === 'signe')
        return xip(`${c.signe} ${c.signeOk ? '✔' : '✖'}`, c.signeOk) + xip(`${c.abs} ${c.absOk ? '✔' : '✖'}`, c.absOk);
    if (c.tipus === 'exp') {
        const potencia = pot(c.base, menys(c.r));
        return xip(c.valorR === null ? `${potencia} ✖` : `${potencia} = ${c.valorR} ≠ ${c.valorP} ✖`, false);
    }
    if (c.tipus === 'cient-exp') {
        const potencia = `${c.mant} · ${pot(10, menys(c.r))}`;
        return xip(c.valorR === null ? `${potencia} ✖` : `${potencia} = ${c.valorR} ≠ ${c.valorP} ✖`, false);
    }
    const eq = c.equivalent;
    return xip(eq ? `${c.r} = ${eq.mant} · ${pot(10, eq.exp)} ✖` : `${menys(c.r)} ✖`, false);
}
