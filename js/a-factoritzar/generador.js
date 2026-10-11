/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-factoritzar/generador.js
 * ROL: La lògica pura de «Factoritzar» (sense DOM): els paràmetres de la URL,
 *      els nombres de cada nivell, l'arbre de factors (cada nombre es parteix
 *      en dos factors fins que tots són primers), la comprovació d'una
 *      parella de factors i l'ajuda amb els primers que divideixen el nombre.
 *      Es prova des de Node (tests/activitats.test.js).
 * DEPENDÈNCIES: js/utils.js i factoritza() d'a-mcd-mcm/generador.js.
 * ============================================================================
 */
import { getIntParam, parseStrictInt, randInt } from '../utils.js';
import { factoritza } from '../a-mcd-mcm/generador.js';

export { factoritza };
export const NIVELL_MAXIM = 3;

/**
 * Llegeix els paràmetres propis de l'activitat:
 *   ?nivell=1|2|3   1 = nombres amb factors 2, 3 i 5 (per defecte); 2 = també el 7; 3 = també l'11
 */
export function llegeixParametres(params) {
    return { nivell: getIntParam(params, 'nivell', 1, 1, NIVELL_MAXIM) };
}

/** Els primers que poden sortir a cada nivell (i els que l'ajuda prova). */
export const PRIMERS_DEL_NIVELL = [
    [2, 3, 5],
    [2, 3, 5, 7],
    [2, 3, 5, 7, 11],
];

export function esPrimer(n) {
    if (n < 2) return false;
    for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
    return true;
}

/** Un nombre de 6 a 150 que és producte de 2 o 3 (4 als nivells 2 i 3) primers del nivell: mai és primer. */
export function generaNombre(nivell) {
    const dificultat = nivell - 1;
    const primers = PRIMERS_DEL_NIVELL[dificultat];
    const maxFactors = 3 + Math.min(dificultat, 1);
    for (;;) {
        let n = 1;
        for (let i = randInt(2, maxFactors); i > 0; i--)
            n *= primers[randInt(0, Math.min(primers.length - 1, dificultat + 2))];
        if (n < 6) n *= primers[randInt(0, 1)];
        if (n <= 150) return n;
    }
}

// ── L'arbre de factors ───────────────────────────────────────────────────────

/** Un node de l'arbre: el nombre, si és primer i els seus dos fills (null mentre no s'ha partit). */
export const creaNode = valor => ({ valor, primer: esPrimer(valor), fills: null });

/** Els nodes que encara s'han de partir (no primers i sense fills), d'esquerra a dreta. */
export function pendents(node) {
    if (!node) return [];
    if (!node.fills) return node.primer ? [] : [node];
    return [...pendents(node.fills[0]), ...pendents(node.fills[1])];
}

/** Parteix un node en dos factors (crea els dos fills). */
export function parteix(node, a, b) {
    node.fills = [creaNode(a), creaNode(b)];
}

/** Els nodes primers de l'arbre (les fulles), d'esquerra a dreta. */
export function fulles(node) {
    if (!node.fills) return [node];
    return [...fulles(node.fills[0]), ...fulles(node.fills[1])];
}

// ── La parella de factors de l'alumne ────────────────────────────────────────

/** El nombre que ha escrit l'alumne (enter), o null si no ho és. */
export function llegeixFactor(text) {
    const n = parseStrictInt(text);
    return Number.isNaN(n) ? null : n;
}

/**
 * Comprova una parella de factors d'un nombre: { ok, producte, unAlgun }
 *   ok = tots dos són més grans que 1 i el producte és el nombre; unAlgun = algun factor és 0 o 1.
 */
export function comprova(valor, a, b) {
    const unAlgun = a < 2 || b < 2;
    return { ok: !unAlgun && a * b === valor, producte: a * b, unAlgun };
}

/** Una parella correcta per revelar quan s'esgoten els intents: el primer més petit que divideix el nombre i el que queda. */
export function solucio(valor) {
    let p = 2;
    while (valor % p !== 0) p++;
    return [p, valor / p];
}

/** L'ajuda: per a cada primer del nivell, si divideix el nombre: [{ primer, divideix }]. */
export function primersQueDivideixen(valor, nivell) {
    return PRIMERS_DEL_NIVELL[nivell - 1].map(primer => ({ primer, divideix: valor % primer === 0 }));
}
