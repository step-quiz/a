/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/utils.js
 * ROL: Llibreria de funcions utilitàries pures i genèriques.
 * ARQUITECTURA:
 * - Conté mètodes segurs de generació aleatòria (randInt, pick) i
 * parseig estricte per evitar errors de tipus i d'entrada d'usuari.
 * - Funcions pures: no depenen de cap estat global ni modifiquen el DOM.
 * - Mòdul ES: qui necessiti una funció l'importa, p. ex.
 *     import { randInt, shuffle } from '../utils.js';
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */
/**
 * Llegeix un paràmetre enter de la URL i el valida.
 * Si és absent, invàlid o fora de rang, retorna el valor per defecte.
 */
export function getIntParam(params, key, fallback, min, max) {
    const raw = params.get(key);
    if (raw === null) return fallback;
    const n = Number(raw);
    if (!Number.isInteger(n)) return fallback;
    if (n < min || n > max) return fallback;
    return n;
}

/**
 * Retorna un enter aleatori entre min i max (tots dos inclosos).
 * Equivalent a la funció "rand" o "randInt" que apareix en cada joc.
 */
export function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Retorna un enter aleatori entre min i max que no sigui zero.
 */
export function randIntNonZero(min, max) {
    let n = 0;
    while (n === 0) n = randInt(min, max);
    return n;
}

/**
 * Retorna un element aleatori d'un array.
 */
export function pick(arr) {
    return arr[randInt(0, arr.length - 1)];
}

/**
 * Barreja un array in-place usant l'algorisme Fisher-Yates (Durstenfeld).
 * Retorna el mateix array barrejat (permet encadenar).
 */
export function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Màxim comú divisor (sempre ≥ 0) per l'algorisme d'Euclides. gcd(0, 0) = 0.
 */
export function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
        const t = b;
        b = a % b;
        a = t;
    }
    return a;
}

/**
 * Parseja un string com a enter estricte (només dígits, opcionalment amb signe negatiu).
 * Rebutja notació científica (1e2), hexadecimal (0x10), decimals (1.5) i text barrejat (12abc).
 * Retorna NaN si l'entrada no és un enter vàlid.
 */
export function parseStrictInt(str) {
    str = String(str).trim();
    if (!/^-?\d+$/.test(str)) return NaN;
    return parseInt(str, 10);
}
