/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-enters-ordenar/generador.js
 * ROL: Lògica PURA de l'activitat «Ordenar enters» (a-enters-ordenar.html): els
 *      tres tipus de repte (que van rotant: 1, 2, 3, 1, 2, 3…), com es generen,
 *      com es comproven i com es descriuen a la revisió.
 *        1. Signe: entre dos enters diferents, triar < o >.
 *        2. Entre: escriure un enter que sigui entre dos (p < ? < q).
 *        3. Menors: entre 8 enters, triar-ne tots els que són menors que r.
 *      No toca el DOM: es pot provar des de Node (tests/activitats.test.js).
 * DEPENDÈNCIES: utils.js (randInt, shuffle).
 * ============================================================================
 */
import { randInt, shuffle } from '../utils.js';

/** Quants nombres hi ha al repte 3. */
export const NOMBRES_REPTE3 = 8;

/** Quin tipus de repte (1, 2 o 3) toca a la pregunta `n` (la primera és la 0). */
export const tipusDeRepte = n => (n % 3) + 1;

/**
 * Genera el repte d'un tipus:
 *   1: { p, q, signe }          p ≠ q, de −9 a 9; `signe` és '<' o '>' (p signe q)
 *   2: { p, q }                 q − p ≥ 2, de −9 a 9: hi ha almenys un enter entre els dos
 *   3: { r, nums }              8 nombres diferents de −9 a 9 (2–4 menors que r, de −5 a 4) i barrejats
 */
export function generaRepte(tipus) {
    if (tipus === 1) {
        const p = randInt(-9, 9);
        let q = randInt(-9, 9);
        while (p === q) q = randInt(-9, 9);
        return { p, q, signe: p < q ? '<' : '>' };
    }
    if (tipus === 2) {
        const p = randInt(-9, 7);
        return { p, q: randInt(p + 2, 9) };
    }
    const r = randInt(-5, 4);
    const menors = randInt(2, 4);
    const nums = [];
    while (nums.length < menors) {
        const n = randInt(-9, r - 1);
        if (!nums.includes(n)) nums.push(n);
    }
    while (nums.length < NOMBRES_REPTE3) {
        const n = randInt(r, 9);
        if (!nums.includes(n)) nums.push(n);
    }
    return { r, nums: shuffle(nums) };
}

/** Repte 2: si `x` és un enter entre p i q (sense ser-ne cap dels dos). */
export const esEntre = (repte, x) => x > repte.p && x < repte.q;

/**
 * Repte 3: compara la tria de l'alumne (els índexs dels nombres triats) amb la solució.
 * Torna { correcte, bons, dolents }: `bons` són els triats que sí són menors que r (queden bloquejats en verd) i
 * `dolents`, els triats que no ho són.
 */
export function avaluaMenors(repte, triats) {
    const menor = i => repte.nums[i] < repte.r;
    const bons = triats.filter(menor);
    const dolents = triats.filter(i => !menor(i));
    const total = repte.nums.filter(n => n < repte.r).length;
    return { correcte: dolents.length === 0 && bons.length === total, bons, dolents };
}

/** Un enter com s'escriu entre els signes: (−3) amb parèntesis si és negatiu. */
export const formatNum = n => (n < 0 ? `(${n})` : String(n));

/** La pregunta d'un repte, en símbols, per a la revisió final. */
export function textPregunta(tipus, repte) {
    if (tipus === 1) return `${formatNum(repte.p)} ? ${formatNum(repte.q)}`;
    if (tipus === 2) return `${formatNum(repte.p)} < ? < ${formatNum(repte.q)}`;
    return `? < ${formatNum(repte.r)}`;
}

/** Els textos que l'activitat posa a la pantalla a partir del lèxic: cap (només nombres i símbols). */
export function exemplesDeText() {
    return [];
}
