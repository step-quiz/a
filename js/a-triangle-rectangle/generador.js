/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-triangle-rectangle/generador.js
 * ROL: La lògica pura de «Triangle rectangle» (teorema de Pitàgores), sense
 *      DOM: els paràmetres de la URL, els 20 problemes, les opcions de resposta
 *      (amb distractors que són errors típics), les mesures per dibuixar el
 *      triangle i l'ajuda amb la fórmula. Es prova des de Node
 *      (tests/activitats.test.js).
 * DEPENDÈNCIES: js/utils.js.
 *
 * CONVENCIÓ DEL TRIANGLE: l'angle recte és a baix a l'esquerra; a = hipotenusa,
 * b = catet vertical i c = catet horitzontal; Pitàgores: b² + c² = a².
 * ============================================================================
 */
import { getIntParam, shuffle } from '../utils.js';

export const NIVELL_MAXIM = 3;

/**
 * Llegeix els paràmetres propis de l'activitat:
 *   ?nivell=1|2|3   1 = trobar la hipotenusa amb nombres enters (per defecte); 2 = també un catet (enters);
 *                   3 = amb arrels quadrades (√2, 2√2…)
 */
export function llegeixParametres(params) {
    return { nivell: getIntParam(params, 'nivell', 1, 1, NIVELL_MAXIM) };
}

// ── Els problemes ────────────────────────────────────────────────────────────

/**
 * Cada problema: `find` (el costat que es busca: 'a', 'b' o 'c'), `given` (els costats que es coneixen, com a text),
 * `answer` (la resposta, com a text) i `distractors` (tres respostes equivocades de reserva).
 */
export const PROBLEMES = [
    {
        id: 0,
        find: 'a',
        given: { b: '3', c: '4' },
        answer: '5',
        distractors: ['7', '√7', '2√2'],
    },
    {
        id: 1,
        find: 'a',
        given: { b: '5', c: '12' },
        answer: '13',
        distractors: ['17', '11', '√119'],
    },
    {
        id: 2,
        find: 'a',
        given: { b: '6', c: '8' },
        answer: '10',
        distractors: ['14', '√28', '7'],
    },
    {
        id: 3,
        find: 'a',
        given: { b: '1', c: '1' },
        answer: '√2',
        distractors: ['2', '√3', '1'],
    },
    {
        id: 4,
        find: 'a',
        given: { b: '1', c: '2' },
        answer: '√5',
        distractors: ['3', '√3', '√7'],
    },
    {
        id: 5,
        find: 'a',
        given: { b: '2', c: '2' },
        answer: '2√2',
        distractors: ['4', '√6', '2√3'],
    },
    {
        id: 6,
        find: 'a',
        given: { b: '8', c: '15' },
        answer: '17',
        distractors: ['23', '16', '√161'],
    },
    {
        id: 7,
        find: 'a',
        given: { b: '3', c: '3' },
        answer: '3√2',
        distractors: ['6', '√15', '9'],
    },
    {
        id: 8,
        find: 'a',
        given: { b: '7', c: '24' },
        answer: '25',
        distractors: ['31', '√527', '√625'],
    },
    {
        id: 9,
        find: 'b',
        given: { a: '5', c: '4' },
        answer: '3',
        distractors: ['1', '√41', '6'],
    },
    {
        id: 10,
        find: 'b',
        given: { a: '13', c: '12' },
        answer: '5',
        distractors: ['1', '7', '√119'],
    },
    {
        id: 11,
        find: 'b',
        given: { a: '10', c: '6' },
        answer: '8',
        distractors: ['4', '√164', '√136'],
    },
    {
        id: 12,
        find: 'b',
        given: { a: '√2', c: '1' },
        answer: '1',
        distractors: ['√3', '2', '√5'],
    },
    {
        id: 13,
        find: 'b',
        given: { a: '√5', c: '1' },
        answer: '2',
        distractors: ['4', '√6', '√3'],
    },
    {
        id: 14,
        find: 'b',
        given: { a: '17', c: '8' },
        answer: '15',
        distractors: ['9', '7', '√353'],
    },
    {
        id: 15,
        find: 'c',
        given: { a: '5', b: '3' },
        answer: '4',
        distractors: ['2', '√34', '6'],
    },
    {
        id: 16,
        find: 'c',
        given: { a: '13', b: '5' },
        answer: '12',
        distractors: ['8', '√194', '10'],
    },
    {
        id: 17,
        find: 'c',
        given: { a: '15', b: '9' },
        answer: '12',
        distractors: ['6', '√306', '10'],
    },
    {
        id: 18,
        find: 'c',
        given: { a: '25', b: '7' },
        answer: '24',
        distractors: ['18', '26', '√576'],
    },
    {
        id: 19,
        find: 'c',
        given: { a: '√8', b: '2' },
        answer: '2',
        distractors: ['4', '√12', '√6'],
    },
];

const ENTERS = id =>
    !PROBLEMES[id].answer.includes('√') && !Object.values(PROBLEMES[id].given).some(v => v.includes('√'));

/** Els problemes de cada nivell (índexs a PROBLEMES). */
export const PROBLEMES_DEL_NIVELL = {
    1: PROBLEMES.filter(p => p.find === 'a' && ENTERS(p.id)).map(p => p.id),
    2: PROBLEMES.filter(p => ENTERS(p.id)).map(p => p.id),
    3: PROBLEMES.filter(p => !ENTERS(p.id)).map(p => p.id),
};

// ── Els valors (nombres i arrels) ────────────────────────────────────────────

/** El valor numèric d'un text com «5», «√2» o «2√3». */
export function evalVal(s) {
    if (s == null || s === '') return 0;
    const m = String(s).match(/^(\d*\.?\d*)√(\d+)$/);
    if (m) return (m[1] !== '' ? parseFloat(m[1]) : 1) * Math.sqrt(parseInt(m[2], 10));
    return parseFloat(s);
}

/** Un nombre positiu, escrit com «5», «√2», «3√2» o, si no és cap d'aquests, amb un decimal. Torna null si no és positiu. */
export function formatVal(n) {
    if (!isFinite(n) || n <= 0) return null;
    const enter = Math.round(n);
    if (Math.abs(enter - n) < 0.001 && enter > 0) return String(enter);
    for (let k = 20; k >= 1; k--) {
        // De l'arrel més simplificada (k més gran) a la menys: √8 és «2√2»
        const m = Math.round((n * n) / (k * k));
        if (m >= 2 && m <= 300 && Math.abs(k * Math.sqrt(m) - n) < 0.001) return k === 1 ? `√${m}` : `${k}√${m}`;
    }
    return n.toFixed(1);
}

// ── Les opcions de resposta ──────────────────────────────────────────────────

/**
 * Tres respostes equivocades, diferents entre elles i de la bona, que són errors típics:
 *   sempre: la fórmula amb el signe girat (a la hipotenusa, la resta dels quadrats; als catets, la suma);
 *   de vegades (40 %): la resposta al quadrat; i la suma dels catets (hipotenusa) o la resta hipotenusa − catet (catets);
 *   i, per omplir, els distractors del problema i valors propers.
 */
export function distractors(p) {
    const resposta = evalVal(p.answer);
    const triats = [];
    const afegeix = valor => {
        if (valor == null) return false;
        const text = String(valor);
        if (text.includes('.')) return false; // sense decimals: les opcions són enters o arrels
        const n = evalVal(text);
        if (!isFinite(n) || n <= 0 || Math.abs(n - resposta) < 0.001) return false;
        if (triats.some(t => Math.abs(evalVal(t) - n) < 0.001)) return false;
        triats.push(text);
        return true;
    };

    let girat = null;
    if (p.find === 'a') {
        const b = evalVal(p.given.b);
        const c = evalVal(p.given.c);
        const dif = Math.abs(b * b - c * c);
        if (dif > 0.001) girat = formatVal(Math.sqrt(dif));
    } else {
        const a = evalVal(p.given.a);
        const x = evalVal(p.find === 'b' ? p.given.c : p.given.b);
        girat = formatVal(Math.sqrt(a * a + x * x));
    }
    if (!afegeix(girat)) afegeix(p.distractors[0]);

    if (Math.random() < 0.4) afegeix(formatVal(resposta * resposta));
    if (Math.random() < 0.4) {
        if (p.find === 'a') afegeix(formatVal(evalVal(p.given.b) + evalVal(p.given.c)));
        else afegeix(formatVal(evalVal(p.given.a) - evalVal(p.find === 'b' ? p.given.c : p.given.b)));
    }
    for (const d of p.distractors) if (triats.length < 3) afegeix(d);
    for (const e of [
        resposta + 2,
        resposta + 4,
        resposta - 2,
        resposta * 2,
        resposta + 6,
        resposta + 1,
        Math.round(resposta) + 1,
        Math.round(resposta) + 3,
        Math.round(resposta) + 5,
    ])
        if (triats.length < 3) afegeix(formatVal(e));
    return triats.slice(0, 3);
}

/** Les quatre opcions d'un problema, barrejades: [{ valor, correcta }]. */
export function opcions(p) {
    return shuffle([p.answer, ...distractors(p)].map(valor => ({ valor, correcta: valor === p.answer })));
}

/**
 * El generador d'un nivell: { reinicia(), genera() }. Reparteix els problemes del nivell barrejats, sense repetir-ne
 * cap fins que s'han fet tots; genera() torna { problema, opcions }.
 */
export function crearGenerador(nivell) {
    let baralla = [];
    const omple = () => (baralla = shuffle([...PROBLEMES_DEL_NIVELL[nivell]]));
    return {
        reinicia: omple,
        genera() {
            if (!baralla.length) omple();
            const problema = PROBLEMES[baralla.pop()];
            return { problema, opcions: opcions(problema) };
        },
    };
}

// ── El dibuix i l'ajuda ──────────────────────────────────────────────────────

/** Les longituds, per dibuixar: { vertical, horitzontal } (el catet b i el catet c, en unitats; el desconegut es calcula). */
export function mesures(p) {
    let b;
    let c;
    if (p.find === 'a') {
        b = evalVal(p.given.b);
        c = evalVal(p.given.c);
    } else if (p.find === 'b') {
        c = evalVal(p.given.c);
        b = Math.sqrt(Math.max(0, evalVal(p.given.a) ** 2 - c * c));
    } else {
        b = evalVal(p.given.b);
        c = Math.sqrt(Math.max(0, evalVal(p.given.a) ** 2 - b * b));
    }
    return { vertical: b || 1, horitzontal: c || 1 };
}

/** La fórmula del costat que es busca, amb lletres: 'a² = b² + c²', 'b² = a² − c²' o 'c² = a² − b²'. */
export function formula(p) {
    if (p.find === 'a') return 'a² = b² + c²';
    return p.find === 'b' ? 'b² = a² − c²' : 'c² = a² − b²';
}

/** La mateixa fórmula amb els valors coneguts: 'a² = 3² + 4²' (una arrel va entre parèntesis: '(√2)²'). */
export function formulaAmbValors(p) {
    const q = v => (String(v).includes('√') ? `(${v})²` : `${v}²`);
    const g = p.given;
    if (p.find === 'a') return `a² = ${q(g.b)} + ${q(g.c)}`;
    return p.find === 'b' ? `b² = ${q(g.a)} − ${q(g.c)}` : `c² = ${q(g.a)} − ${q(g.b)}`;
}

/** Els textos que l'activitat genera i que han de ser al lèxic: cap (només nombres, lletres i símbols). */
export function exemplesDeText() {
    return [];
}
