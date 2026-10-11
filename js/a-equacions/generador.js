/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-equacions/generador.js
 * ROL: La lògica pura de «Equacions» (sense DOM): els paràmetres de la URL, les
 *      equacions de cada nivell, la comprovació d'una solució (substituint la x)
 *      i l'operació inversa de l'ajuda. Es prova des de Node
 *      (tests/activitats.test.js).
 * DEPENDÈNCIES: js/utils.js.
 *
 * Quatre tipus d'equació d'un sol pas, sempre amb solució entera positiva:
 *   'ax_b'  a · x = b      'xpb_c'  x + b = c      'xmb_c'  x − b = c      'bpx_c'  b + x = c
 * ============================================================================
 */
import { getIntParam, pick, randInt } from '../utils.js';

export const NIVELL_MAXIM = 4;

/**
 * Llegeix els paràmetres propis de l'activitat:
 *   ?nivell=1|2|3|4   1 = a·x = b (per defecte); 2 = també x + b = c i x − b = c; 3 = els mateixos amb nombres més grans;
 *                     4 = també b + x = c
 */
export function llegeixParametres(params) {
    return { nivell: getIntParam(params, 'nivell', 1, 1, NIVELL_MAXIM) };
}

/** Els tipus d'equació que surten a un nivell. */
export function tipusDelNivell(nivell) {
    const tipus = ['ax_b'];
    if (nivell >= 2) tipus.push('xpb_c', 'xmb_c');
    if (nivell >= 4) tipus.push('bpx_c');
    return tipus;
}

/** Una equació del nivell: { tipus, a?, b, c?, xSol }. */
export function generaEquacio(nivell) {
    const tipus = pick(tipusDelNivell(nivell));
    if (tipus === 'ax_b') {
        const a = randInt(2, 5);
        const xSol = randInt(1, 9);
        return { tipus, a, b: a * xSol, xSol };
    }
    if (tipus === 'xpb_c') {
        const b = randInt(1, nivell >= 3 ? 8 : 5);
        const xSol = randInt(1, nivell >= 3 ? 12 : 9);
        return { tipus, b, c: xSol + b, xSol };
    }
    if (tipus === 'xmb_c') {
        const b = randInt(1, 8);
        const xSol = randInt(b + 1, 12); // x > b perquè el resultat sigui positiu
        return { tipus, b, c: xSol - b, xSol };
    }
    const b = randInt(1, 8);
    const xSol = randInt(1, 12);
    return { tipus, b, c: b + xSol, xSol };
}

// ── Comprovar una solució ────────────────────────────────────────────────────

/** El terme de la dreta de l'equació. */
export const dreta = eq => (eq.tipus === 'ax_b' ? eq.b : eq.c);

/** El costat de l'esquerra de l'equació amb un valor de x: { text: «4 + 3», valor: 7 }. */
export function esquerra(eq, x) {
    if (eq.tipus === 'ax_b') return { text: `${eq.a} · ${x}`, valor: eq.a * x };
    if (eq.tipus === 'xpb_c') return { text: `${x} + ${eq.b}`, valor: x + eq.b };
    if (eq.tipus === 'xmb_c') return { text: `${x} − ${eq.b}`, valor: x - eq.b };
    return { text: `${eq.b} + ${x}`, valor: eq.b + x };
}

/** Si x és la solució (és el mateix que comprovar que el costat esquerre val el dret). */
export const esSolucio = (eq, x) => esquerra(eq, x).valor === dreta(eq);

/** L'operació que dona la x, sense el resultat: «8 − 3 = ?», «8 + 3 = ?» o «12 ÷ 3 = ?». */
export function operacioInversa(eq) {
    if (eq.tipus === 'ax_b') return `${eq.b} ÷ ${eq.a} = ?`;
    if (eq.tipus === 'xmb_c') return `${eq.c} + ${eq.b} = ?`;
    return `${eq.c} − ${eq.b} = ?`;
}

/** L'equació en text pla: «x + 3 = 8» (per a la revisió final). */
export function textEquacio(eq) {
    if (eq.tipus === 'ax_b') return `${eq.a} · x = ${eq.b}`;
    if (eq.tipus === 'xpb_c') return `x + ${eq.b} = ${eq.c}`;
    if (eq.tipus === 'xmb_c') return `x − ${eq.b} = ${eq.c}`;
    return `${eq.b} + x = ${eq.c}`;
}

/** Els textos que l'activitat genera i que han de ser al lèxic: cap (només nombres, la lletra x i símbols). */
export function exemplesDeText() {
    return [];
}
