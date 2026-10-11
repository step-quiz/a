/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-mcd-mcm/generador.js
 * ROL: La lògica pura de «MCD i MCM» (sense DOM): els paràmetres de la URL, la
 *      factorització, el MCD i el MCM, els parells de nombres de cada nivell,
 *      els divisors i els múltiples de l'ajuda i la lectura de la resposta.
 *      Es prova des de Node (tests/activitats.test.js).
 * DEPENDÈNCIES: js/utils.js.
 *
 * Cada pregunta és un parell de nombres i dos passos: primer el MCD, després el MCM.
 * ============================================================================
 */
import { getIntParam, gcd, parseStrictInt, randInt } from '../utils.js';

export const NIVELL_MAXIM = 3;

/** Els dos passos d'una pregunta, en ordre. */
export const PASSOS = ['mcd', 'mcm'];

/**
 * Llegeix els paràmetres propis de l'activitat:
 *   ?nivell=1|2|3   1 = nombres amb factors 2, 3 i 5 i la factorització a la vista (per defecte);
 *                   2 = també el 7 i la factorització només a l'ajuda; 3 = també l'11
 */
export function llegeixParametres(params) {
    return { nivell: getIntParam(params, 'nivell', 1, 1, NIVELL_MAXIM) };
}

// ── Les matemàtiques ─────────────────────────────────────────────────────────

/** Els factors primers d'un nombre: { primer: exponent }, p. ex. 12 → { 2: 2, 3: 1 }. */
export function factoritza(n) {
    const factors = {};
    let d = 2;
    while (d * d <= n) {
        while (n % d === 0) {
            factors[d] = (factors[d] || 0) + 1;
            n /= d;
        }
        d++;
    }
    if (n > 1) factors[n] = (factors[n] || 0) + 1;
    return factors;
}

export const mcd = (a, b) => gcd(a, b);
export const mcm = (a, b) => (a / gcd(a, b)) * b;

/** Els divisors d'un nombre, de més petit a més gran. */
export function divisors(n) {
    const d = [];
    for (let i = 1; i <= n; i++) if (n % i === 0) d.push(i);
    return d;
}

/** Els primers múltiples d'un nombre: n, 2n, 3n… fins a `fins` (inclòs). */
export function multiples(n, fins) {
    const m = [];
    for (let k = n; k <= fins; k += n) m.push(k);
    return m;
}

// ── Els parells de cada nivell ───────────────────────────────────────────────

const BASSINS = [
    [2, 3, 5],
    [2, 3, 5, 7],
    [2, 3, 5, 7, 11],
];

/** Un nombre de 6 a 150 que és producte de 2 a `maxFactors` primers del bassí. */
function nombre(bassi, dificultat, maxFactors) {
    for (;;) {
        let n = 1;
        for (let i = randInt(2, maxFactors); i > 0; i--)
            n *= bassi[randInt(0, Math.min(bassi.length - 1, dificultat + 2))];
        if (n < 6) n *= bassi[randInt(0, 1)];
        if (n <= 150) return n;
    }
}

/**
 * Un parell de nombres diferents (a, b): el MCM no passa de 300 i, de tant en tant (un 15 %), no tenen cap factor en comú
 * (MCD = 1, MCM fins a 500); si no, sempre en tenen.
 */
export function generaParell(nivell) {
    const dificultat = nivell - 1;
    const bassi = BASSINS[dificultat];
    const maxFactors = 3 + Math.min(dificultat, 1);
    const senseComu = Math.random() < 0.15;
    const maxMcm = senseComu ? 500 : 300;
    for (let intents = 0; intents < 200; intents++) {
        const a = nombre(bassi, dificultat, maxFactors);
        const b = nombre(bassi, dificultat, maxFactors);
        const d = mcd(a, b);
        if (a !== b && mcm(a, b) <= maxMcm && (senseComu ? d === 1 : d !== 1)) return [a, b];
    }
    return [12, 18]; // no passa mai a la pràctica, però el joc no es pot quedar sense pregunta
}

/** Una pregunta del nivell: el parell, els seus factors i les dues respostes. */
export function generaPregunta(nivell) {
    const [a, b] = generaParell(nivell);
    return { a, b, factorsA: factoritza(a), factorsB: factoritza(b), mcd: mcd(a, b), mcm: mcm(a, b), passos: PASSOS };
}

/** La resposta d'un pas: 'mcd' o 'mcm'. */
export const respostaDelPas = (pregunta, pas) => pregunta[pas];

/** Si la factorització és a la vista sempre (nivell 1) o només a l'ajuda (nivells 2 i 3). */
export const factorsALaVista = nivell => nivell === 1;

// ── La resposta de l'alumne ──────────────────────────────────────────────────

/** El nombre que ha escrit l'alumne (enter positiu), o null si no ho és. */
export function llegeixResposta(text) {
    const n = parseStrictInt(text);
    return Number.isNaN(n) || n < 1 ? null : n;
}

/**
 * Les dues divisions que diuen si la resposta és divisor (MCD) o múltiple (MCM) dels dos nombres: [{ dividend, divisor, ok }].
 *   MCD (a, b) = x → «a ÷ x» i «b ÷ x»      MCM (a, b) = x → «x ÷ a» i «x ÷ b»      ok = la divisió és exacta
 */
export function comprovacions(pregunta, pas, resposta) {
    const divisio = (dividend, divisor) => ({ dividend, divisor, ok: dividend % divisor === 0 });
    return pas === 'mcd'
        ? [divisio(pregunta.a, resposta), divisio(pregunta.b, resposta)]
        : [divisio(resposta, pregunta.a), divisio(resposta, pregunta.b)];
}

/** Els textos que l'activitat genera i que han de ser al lèxic: les sigles dels dos passos. */
export function exemplesDeText() {
    return ['MCD', 'MCM'];
}
