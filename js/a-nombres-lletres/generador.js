/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-nombres-lletres/generador.js
 * ROL: La lògica pura de «Escriure nombres» (sense DOM): els paràmetres de la
 *      URL, el nom en català de cada nombre del 0 al 100, els distractors
 *      versemblants (faltes d'ortografia castellanitzades, el guionet que no hi
 *      és, només la desena, els dígits dits un a un, un altre nombre que se li
 *      sembla) i la pregunta de 5 opcions. Es prova des de Node
 *      (tests/activitats.test.js).
 * DEPENDÈNCIES: js/utils.js.
 *
 * Els distractors són errors a propòsit: no són al lèxic ni han de ser-hi.
 * Només els noms correctes ho són (vegeu exemplesDeText).
 * ============================================================================
 */
import { getIntParam, pick, randInt, shuffle } from '../utils.js';

export const NIVELL_MAXIM = 4;

/** Les oportunitats de cada pregunta: un error i una segona oportunitat, i prou. */
export const INTENTS = 2;

/** Els nombres de cada nivell (inclosos els dos extrems). */
export const RANGS = { 1: [0, 20], 2: [21, 69], 3: [70, 100], 4: [0, 100] };

/**
 * Llegeix els paràmetres propis de l'activitat:
 *   ?nivell=1|2|3|4   1 = del 0 al 20 (per defecte); 2 = del 21 al 69; 3 = del 70 al 100; 4 = tots, del 0 al 100
 */
export function llegeixParametres(params) {
    return { nivell: getIntParam(params, 'nivell', 1, 1, NIVELL_MAXIM) };
}

// ── El nom de cada nombre ────────────────────────────────────────────────────

const UNITATS = ['zero', 'un', 'dos', 'tres', 'quatre', 'cinc', 'sis', 'set', 'vuit', 'nou'];
const DEUS = ['deu', 'onze', 'dotze', 'tretze', 'catorze', 'quinze', 'setze', 'disset', 'divuit', 'dinou'];
const DESENES = {
    2: 'vint',
    3: 'trenta',
    4: 'quaranta',
    5: 'cinquanta',
    6: 'seixanta',
    7: 'setanta',
    8: 'vuitanta',
    9: 'noranta',
};

/** El nom d'un nombre del 0 al 100: 7 → «set», 21 → «vint-i-un», 52 → «cinquanta-dos», 100 → «cent». */
export function nomNombre(n) {
    if (!Number.isInteger(n) || n < 0 || n > 100) throw new Error(`nomNombre: ${n} no és del 0 al 100`);
    if (n === 100) return 'cent';
    if (n < 10) return UNITATS[n];
    if (n < 20) return DEUS[n - 10];
    const t = Math.floor(n / 10);
    const u = n % 10;
    if (u === 0) return DESENES[t];
    return t === 2 ? `vint-i-${UNITATS[u]}` : `${DESENES[t]}-${UNITATS[u]}`;
}

// ── Els errors típics ────────────────────────────────────────────────────────

/** Cada paraula de nombre amb dues maneres equivocades i versemblants d'escriure-la (castellanitzades o mal escrites). */
const ERRORS = {
    zero: ['cero', 'zer'],
    un: ['uno', 'u'],
    dos: ['doss', 'dós'],
    tres: ['tress', 'trés'],
    quatre: ['cuatre', 'quatro'],
    cinc: ['cinco', 'sinc'],
    sis: ['seis', 'sies'],
    set: ['siete', 'sete'],
    vuit: ['ocho', 'huit'],
    nou: ['nueve', 'nov'],
    deu: ['diez', 'dau'],
    onze: ['once', 'honze'],
    dotze: ['doce', 'dodze'],
    tretze: ['trece', 'tredze'],
    catorze: ['catorce', 'cattorze'],
    quinze: ['quince', 'quinse'],
    setze: ['dieciséis', 'sedze'],
    disset: ['diecisiete', 'dissete'],
    divuit: ['dieciocho', 'divuitt'],
    dinou: ['diecinueve', 'dinau'],
    vint: ['veinte', 'vin'],
    trenta: ['treinta', 'trinta'],
    quaranta: ['cuaranta', 'quarenta'],
    cinquanta: ['cincuanta', 'cinquenta'],
    seixanta: ['sesenta', 'seixenta'],
    setanta: ['setenta', 'sétanta'],
    vuitanta: ['ochenta', 'vuitenta'],
    noranta: ['noventa', 'norenta'],
    cent: ['cien', 'cents'],
};

/** Les maneres equivocades d'escriure un nombre (la classe «A» dels distractors). */
function errorsDeForma(n) {
    if (n < 20 || n === 100) return [...ERRORS[nomNombre(n)]];
    const t = Math.floor(n / 10);
    const u = n % 10;
    const T = DESENES[t];
    if (u === 0) return [...ERRORS[T], UNITATS[t]];
    const U = UNITATS[u];
    if (t === 2) {
        return [
            `vint-${U}`,
            `vint i ${U}`,
            `${ERRORS.vint[0]}-i-${U}`,
            `vint ${U}`,
            `vint-i-${ERRORS[U][0]}`,
            `${UNITATS[2]} ${U}`,
        ];
    }
    return [
        `${ERRORS[T][0]}-${U}`,
        `${ERRORS[T][1]}-${U}`,
        `${T} ${U}`,
        `${ERRORS[T][0]} ${U}`,
        `${T}-i-${U}`,
        T,
        `${UNITATS[t]} ${U}`,
        `${U}-${T}`,
    ];
}

/** Els noms d'altres nombres que se li poden confondre (la classe «B»): el del revés (13/31), ±10 (16/6, 16/26), ±1. */
function altresNombres(n) {
    const del = n < 10 ? n * 10 : n === 100 ? 1 : (n % 10) * 10 + Math.floor(n / 10);
    return [del, n + 10, n - 10, n + 1, n - 1]
        .filter((m, i, v) => m >= 0 && m <= 100 && m !== n && v.indexOf(m) === i)
        .map(nomNombre);
}

/**
 * Els 4 distractors d'un nombre, tots diferents entre ells i del nom correcte. Dels nombres de dues paraules, 3
 * són errors d'escriptura i 1 és un altre nombre; dels altres, 2 i 2 (si en falten d'una classe, es tapen amb l'altra).
 */
export function distractors(n) {
    const correcte = nomNombre(n);
    const compost = n > 20 && n < 100 && n % 10 !== 0;
    const a = shuffle(errorsDeForma(n));
    const b = shuffle(altresNombres(n));
    const triats = [];
    const afegeix = t => {
        if (t !== correcte && !triats.includes(t)) triats.push(t);
    };
    const [nA, nB] = compost ? [3, 1] : [2, 2];
    a.slice(0, nA).forEach(afegeix);
    b.slice(0, nB).forEach(afegeix);
    for (const t of [...a, ...b]) {
        if (triats.length >= 4) break;
        afegeix(t);
    }
    return triats.slice(0, 4);
}

// ── La pregunta ──────────────────────────────────────────────────────────────

/**
 * Una pregunta del nivell: { n, text, opcions: [{ text, correcta }] × 5 } amb les opcions barrejades. Si es dona
 * `excloure` (un Set de nombres), se'n fa un de fora si en queda cap al nivell.
 */
export function generaPregunta(nivell, excloure = new Set()) {
    const [min, max] = RANGS[nivell];
    const lliures = [];
    for (let n = min; n <= max; n++) if (!excloure.has(n)) lliures.push(n);
    const n = lliures.length ? pick(lliures) : randInt(min, max);
    const text = nomNombre(n);
    const opcions = shuffle([{ text, correcta: true }, ...distractors(n).map(t => ({ text: t, correcta: false }))]);
    return { n, text, opcions };
}

/** La pregunta en text pla (per a la revisió final): «52». */
export const textPregunta = p => String(p.n);

/** Una opció en text pla. */
export const textOpcio = o => o.text;

/** Els textos que l'activitat genera i que han de ser al lèxic: els noms correctes dels 101 nombres (els distractors són errors a propòsit). */
export function exemplesDeText() {
    return Array.from({ length: 101 }, (_, n) => nomNombre(n));
}
