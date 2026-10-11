/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-potencies/generador.js
 * ROL: La lògica pura de «Potències» (sense DOM): els paràmetres de la URL, les
 *      preguntes de cada nivell, la comprovació d'una resposta equivocada
 *      (perquè la pantalla la pugui mostrar amb xifres) i el text pla de la
 *      pregunta. Es prova des de Node (tests/activitats.test.js).
 * DEPENDÈNCIES: js/utils.js.
 *
 * Tipus de pregunta (la resposta sempre és un enter; «kind» diu on s'escriu):
 *   'prod'      a^m · a^n = a^[?]         kind 'exp'    solució m + n
 *   'quot'      a^m ÷ a^n = a^[?]         kind 'exp'    solució m − n
 *   'powpow'    (a^m)^n = a^[?]           kind 'exp'    solució m · n
 *   'baseneg'   (−a)^e = [?]  o  −a^e     kind 'valor' (pot ser negatiu)
 *   'cientifica' 34000 = 3,4 · 10^[?]     kind 'exp'    sentit 'a_cient'
 *                3,4 · 10^5 = [?]         kind 'valor'  sentit 'de_cient'
 * ============================================================================
 */
import { getIntParam, pick, randInt } from '../utils.js';

export const NIVELL_MAXIM = 4;

/** L'exponent més gran que es treballa amb cada base (perquè el nombre no creixi massa). */
export const EXPONENT_MAXIM = { 2: 10, 3: 6, 4: 5, 5: 4, 10: 6 };

/**
 * Llegeix els paràmetres propis de l'activitat:
 *   ?nivell=1|2|3|4   1 = producte i quocient de potències (per defecte); 2 = també potència d'una potència;
 *                     3 = també base negativa; 4 = també notació científica
 */
export function llegeixParametres(params) {
    return { nivell: getIntParam(params, 'nivell', 1, 1, NIVELL_MAXIM) };
}

/** Els tipus de pregunta que surten a un nivell (al nivell 4 la notació científica surt el doble). */
export function tipusDelNivell(nivell) {
    const tipus = ['prod', 'quot'];
    if (nivell >= 2) tipus.push('powpow');
    if (nivell >= 3) tipus.push('baseneg');
    if (nivell >= 4) tipus.push('cientifica', 'cientifica');
    return tipus;
}

// ── Nombres escrits ──────────────────────────────────────────────────────────

/** Un enter seguit de `shift` zeros, o amb la coma decimal si `shift` és negatiu: (34, 3) → «34000»; (34, −5) → «0,00034». */
export function textDecimal(digits, shift) {
    const s = String(digits);
    if (shift >= 0) return s + '0'.repeat(shift);
    const k = -shift;
    if (k < s.length) return `${s.slice(0, s.length - k)},${s.slice(s.length - k)}`;
    return `0,${'0'.repeat(k - s.length)}${s}`;
}

/** Un enter positiu ≥ 10 escrit en notació científica: 3400 → { mant: '3,4', exp: 3 }. Si és més petit, null. */
export function aCientifica(n) {
    if (!Number.isInteger(n) || n < 10) return null;
    const s = String(n);
    const digits = s.replace(/0+$/, '');
    return { mant: digits.length > 1 ? `${digits[0]},${digits.slice(1)}` : digits, exp: s.length - 1 };
}

// ── Les preguntes ────────────────────────────────────────────────────────────

/** Una pregunta del nivell: vegeu la capçalera per als camps de cada tipus. */
export function generaPregunta(nivell) {
    const tipus = pick(tipusDelNivell(nivell));
    if (tipus === 'prod') {
        const base = pick([2, 3, 4, 5, 10]);
        const cap = EXPONENT_MAXIM[base];
        const m = randInt(1, Math.min(5, cap - 1));
        const n = randInt(1, Math.min(5, cap - m));
        return { tipus, kind: 'exp', base, m, n, solucio: m + n };
    }
    if (tipus === 'quot') {
        const base = pick([2, 3, 4, 5, 10]);
        const cap = EXPONENT_MAXIM[base];
        const n = randInt(1, Math.min(4, cap - 1));
        const m = randInt(n + 1, Math.min(n + 4, cap));
        return { tipus, kind: 'exp', base, m, n, solucio: m - n };
    }
    if (tipus === 'powpow') {
        const parells = [];
        for (const base of [2, 3, 4, 5])
            for (let m = 2; m <= 4; m++)
                for (let n = 2; n <= 4; n++) if (m * n <= EXPONENT_MAXIM[base]) parells.push({ base, m, n });
        const { base, m, n } = pick(parells);
        return { tipus, kind: 'exp', base, m, n, solucio: m * n };
    }
    if (tipus === 'baseneg') {
        const base = randInt(2, 9);
        const maxExp = base <= 2 ? 6 : base <= 4 ? 4 : 3;
        const exp = randInt(2, maxExp);
        const parentesi = pick([true, false]);
        const valor = base ** exp;
        return { tipus, kind: 'valor', base, exp, parentesi, solucio: parentesi && exp % 2 === 0 ? valor : -valor };
    }
    // Notació científica: una mantissa d'un o dos dígits (3 o 3,4) i una potència de 10
    const dec = pick([0, 1]);
    const digits = dec ? randInt(1, 9) * 10 + randInt(1, 9) : randInt(1, 9);
    const mant = dec ? `${Math.floor(digits / 10)},${digits % 10}` : String(digits);
    if (pick([true, false])) {
        const exp = randInt(2, 6);
        return {
            tipus,
            sentit: 'de_cient',
            kind: 'valor',
            digits,
            dec,
            mant,
            exp,
            solucio: Number(textDecimal(digits, exp - dec)),
        };
    }
    const exp = pick([2, 3, 4, 5, 6, -2, -3, -4, -5]);
    return {
        tipus,
        sentit: 'a_cient',
        kind: 'exp',
        digits,
        dec,
        mant,
        exp,
        solucio: exp,
        nombre: textDecimal(digits, exp - dec),
    };
}

/** La potència de la pregunta, com a text pla (per a la revisió final): «3^2 · 3^4 = 3^?». */
export function textPregunta(p) {
    if (p.tipus === 'prod') return `${p.base}^${p.m} · ${p.base}^${p.n} = ${p.base}^?`;
    if (p.tipus === 'quot') return `${p.base}^${p.m} ÷ ${p.base}^${p.n} = ${p.base}^?`;
    if (p.tipus === 'powpow') return `(${p.base}^${p.m})^${p.n} = ${p.base}^?`;
    if (p.tipus === 'baseneg') return p.parentesi ? `(−${p.base})^${p.exp} = ?` : `−${p.base}^${p.exp} = ?`;
    if (p.sentit === 'a_cient') return `${p.nombre} = ${p.mant} · 10^?`;
    return `${p.mant} · 10^${p.exp} = ?`;
}

// ── Comprovar una resposta ───────────────────────────────────────────────────

/** Si la resposta és la bona. */
export const esCorrecta = (p, resposta) => resposta === p.solucio;

/** Un enter com a text si no és massa gran per mostrar-lo (|r| ≤ límit); si no, null. */
const potenciaText = (base, r, limit = 12) => (r >= 0 && r <= limit ? String(base ** r) : null);

/**
 * La comprovació d'una resposta equivocada, amb dades perquè la vista la mostri amb xifres:
 *   exp          { tipus: 'exp', base, r, valorR: «243»|null, valorP: «729» }   (a^r = valor ≠ valor de la pregunta)
 *   signe        { tipus: 'signe', signe: '+'|'−', signeOk, abs, absOk }          (el signe i el valor, per separat)
 *   cient-exp    { tipus: 'cient-exp', mant, r, valorR: «3400»|null, valorP }     (3,4 · 10^r = valor ≠ nombre)
 *   cient-valor  { tipus: 'cient-valor', r, equivalent: {mant, exp}|null }        (la resposta en notació científica)
 */
export function comprovacio(p, r) {
    if (p.tipus === 'baseneg') {
        const signe = r < 0 ? '−' : '+';
        const abs = Math.abs(r);
        return {
            tipus: 'signe',
            signe,
            signeOk: Math.sign(r) === Math.sign(p.solucio),
            abs,
            absOk: abs === Math.abs(p.solucio),
        };
    }
    if (p.tipus === 'cientifica') {
        if (p.sentit === 'a_cient') {
            const valorR = Math.abs(r) <= 9 ? textDecimal(p.digits, r - p.dec) : null;
            return { tipus: 'cient-exp', mant: p.mant, r, valorR, valorP: p.nombre };
        }
        return { tipus: 'cient-valor', r, equivalent: aCientifica(r) };
    }
    return { tipus: 'exp', base: p.base, r, valorR: potenciaText(p.base, r), valorP: String(p.base ** p.solucio) };
}

/** Els textos que l'activitat genera i que han de ser al lèxic: cap (només nombres i símbols). */
export function exemplesDeText() {
    return [];
}
