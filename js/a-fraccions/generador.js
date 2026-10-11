/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-fraccions/generador.js
 * ROL: La lògica pura de «Fraccions» (sense DOM): els paràmetres de la URL, els
 *      problemes de cada nivell (suma i resta, producte i divisió de dues
 *      fraccions) i la comprovació de cada pas de la resolució.
 *      Es prova des de Node (tests/activitats.test.js).
 * DEPENDÈNCIES: js/utils.js.
 *
 * Els passos d'una resolució (cada un és una casella o dues que l'alumne omple):
 *   suma/resta:  'den' (un denominador comú) → 'equiv' (els numeradors equivalents) → 'resultat' → 'simplifica'
 *   producte:    'resultat' → 'simplifica'
 *   divisió:     'inversa' (la segona fracció girada) → 'resultat' → 'simplifica'
 * Si els denominadors ja són iguals es comença a 'resultat'; si el resultat ja és irreductible no hi ha 'simplifica'.
 * ============================================================================
 */
import { getIntParam, gcd, randInt } from '../utils.js';

export const NIVELL_MAXIM = 4;

/**
 * Llegeix els paràmetres propis de l'activitat:
 *   ?nivell=1|2|3|4   1 = suma i resta amb el mateix denominador (per defecte); 2 = un denominador és múltiple de l'altre;
 *                     3 = denominadors diferents; 4 = producte i divisió
 */
export function llegeixParametres(params) {
    return { nivell: getIntParam(params, 'nivell', 1, 1, NIVELL_MAXIM) };
}

// ── Les fraccions ────────────────────────────────────────────────────────────

export const mcd = (a, b) => gcd(a, b);
export const mcm = (a, b) => (a / gcd(a, b)) * b;

/** La fracció irreductible equivalent: { n, d }. */
export function reduccio(n, d) {
    const g = gcd(n, d) || 1;
    return { n: n / g, d: d / g };
}

export const esIrreductible = (n, d) => gcd(n, d) === 1;

/** Si n/d i N/D són la mateixa fracció (amb denominadors positius). */
export const esEquivalent = (n, d, N, D) => d > 0 && D > 0 && n * D === N * d;

/** Si D és un denominador comú positiu (múltiple dels dos denominadors) i d'una mida raonable. */
export const esMultipleComu = (D, d1, d2) => D > 0 && D <= 999 && D % d1 === 0 && D % d2 === 0;

/** El numerador d'una fracció n/d escrita amb el denominador D (D múltiple de d). */
export const numeradorEquivalent = (n, d, D) => n * (D / d);

/** Una fracció irreductible amb numerador de l'1 al 9 i denominador del 2 al 9. */
function irreductible() {
    for (;;) {
        const n = randInt(1, 9);
        const d = randInt(2, 9);
        if (gcd(n, d) === 1) return { n, d };
    }
}

// ── Els problemes ────────────────────────────────────────────────────────────

/**
 * El resultat sense simplificar de la resolució en curs: { n, d }.
 *   suma i resta: amb el denominador comú D i els numeradors equivalents de `estat` ({ D, num1, num2 })
 *   producte i divisió: directament
 */
export function senseSimplificar(p, estat = {}) {
    if (p.op === '+') return { n: estat.num1 + estat.num2, d: estat.D };
    if (p.op === '-') return { n: estat.num1 - estat.num2, d: estat.D };
    if (p.op === '·') return { n: p.n1 * p.n2, d: p.d1 * p.d2 };
    return { n: p.n1 * p.d2, d: p.d1 * p.n2 };
}

/**
 * Un problema del nivell: { nivell, n1, d1, n2, d2, op, final }
 *   op: '+', '−' ('-' al codi), '·' o ':'; final és el resultat irreductible { n, d } (mai 0 ni 1 en producte i divisió).
 *   Les fraccions són irreductibles, diferents entre elles i, a la resta, la primera és més gran que la segona.
 */
export function generaProblema(nivell) {
    for (;;) {
        const f1 = irreductible();
        const f2 = irreductible();
        let { n: n1, d: d1 } = f1;
        let { n: n2, d: d2 } = f2;
        let op;
        if (nivell === 4) {
            op = Math.random() < 0.5 ? '·' : ':';
        } else {
            op = Math.random() < 0.5 ? '+' : '-';
            if (nivell === 1) {
                d2 = d1;
            } else if (nivell === 2) {
                const m = randInt(2, 4);
                if (Math.random() < 0.5) d2 = d1 * m;
                else d1 = d2 * m;
                if (d1 > 30 || d2 > 30 || d1 === d2) continue;
            } else if (d1 === d2 || mcm(d1, d2) === d1 || mcm(d1, d2) === d2) {
                continue;
            }
        }
        if (n1 * d2 === n2 * d1) continue; // dues fraccions iguals: la resta seria 0 i el quocient 1
        if (op === '-' && n1 * d2 < n2 * d1) [n1, d1, n2, d2] = [n2, d2, n1, d1];
        const p = { nivell, n1, d1, n2, d2, op };
        const D = mcm(d1, d2);
        const sense = senseSimplificar(p, {
            D,
            num1: numeradorEquivalent(n1, d1, D),
            num2: numeradorEquivalent(n2, d2, D),
        });
        return { ...p, final: reduccio(sense.n, sense.d) };
    }
}

// ── Els passos ───────────────────────────────────────────────────────────────

/** El primer pas i l'estat inicial de la resolució: { pas, estat }. */
export function primerPas(p) {
    if (p.op === ':') return { pas: 'inversa', estat: {} };
    if (p.op === '·') return { pas: 'resultat', estat: {} };
    if (p.d1 === p.d2) return { pas: 'resultat', estat: { D: p.d1, num1: p.n1, num2: p.n2 } };
    return { pas: 'den', estat: {} };
}

/** Quines files de 'equiv' ja són bones tal com són (el seu denominador és ja D): { f1, f2 }. */
export const filesJaFetes = (p, D) => ({ f1: D === p.d1, f2: D === p.d2 });

/**
 * La solució d'un pas, com la llista de valors de les caselles en ordre:
 *   den: [mcm]   equiv: [numerador 1, numerador 2] (només les files que falten)   inversa: [d2, n2]
 *   resultat i simplifica: [numerador, denominador]
 */
export function solucioDelPas(p, estat, pas) {
    if (pas === 'den') return [mcm(p.d1, p.d2)];
    if (pas === 'equiv') {
        const { f1, f2 } = filesJaFetes(p, estat.D);
        const v = [];
        if (!f1) v.push(numeradorEquivalent(p.n1, p.d1, estat.D));
        if (!f2) v.push(numeradorEquivalent(p.n2, p.d2, estat.D));
        return v;
    }
    if (pas === 'inversa') return [p.d2, p.n2];
    if (pas === 'resultat') {
        const s = senseSimplificar(p, estat);
        return [s.n, s.d];
    }
    return [p.final.n, p.final.d];
}

/**
 * Avalua la resposta de l'alumne a un pas. `r` són els valors de les caselles amb el seu nom (els que falten, null):
 *   den: { D }   equiv: { n1, n2 } (null en una fila ja feta)   inversa i simplifica: { n, d }   resultat: { n, d }
 * Torna { ok, seguent, estat, repeteix }: seguent és el pas que toca després o 'fi'; repeteix és que la fracció escrita és
 * bona però encara es pot simplificar (cal tornar-ho a provar al mateix pas).
 */
export function avalua(p, estat, pas, r) {
    const mal = { ok: false, seguent: pas, estat, repeteix: false };
    if (pas === 'den') {
        return esMultipleComu(r.D, p.d1, p.d2) ? { ok: true, seguent: 'equiv', estat: { ...estat, D: r.D } } : mal;
    }
    if (pas === 'equiv') {
        const { f1, f2 } = filesJaFetes(p, estat.D);
        const num1 = f1 ? p.n1 : r.n1;
        const num2 = f2 ? p.n2 : r.n2;
        const bo =
            num1 === numeradorEquivalent(p.n1, p.d1, estat.D) && num2 === numeradorEquivalent(p.n2, p.d2, estat.D);
        return bo ? { ok: true, seguent: 'resultat', estat: { ...estat, num1, num2 } } : mal;
    }
    if (pas === 'inversa') {
        return r.n === p.d2 && r.d === p.n2 ? { ok: true, seguent: 'resultat', estat } : mal;
    }
    const d = r.d ?? 1;
    if (pas === 'resultat') {
        const s = senseSimplificar(p, estat);
        if (r.n === s.n && d === s.d)
            return { ok: true, seguent: esIrreductible(s.n, s.d) ? 'fi' : 'simplifica', estat };
        if (r.n === p.final.n && d === p.final.d) return { ok: true, seguent: 'fi', estat };
        return mal;
    }
    // simplifica
    if (!esEquivalent(p.final.n, p.final.d, r.n, d)) return mal;
    if (r.n === p.final.n && d === p.final.d) return { ok: true, seguent: 'fi', estat };
    return { ok: true, seguent: 'simplifica', estat, repeteix: true };
}

/** Els textos que l'activitat genera i que han de ser al lèxic: cap (només nombres i símbols). */
export function exemplesDeText() {
    return [];
}
