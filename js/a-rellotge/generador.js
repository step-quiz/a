/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-rellotge/generador.js
 * ROL: Lògica PURA de l'activitat «Rellotge» (a-rellotge.html): paràmetres de la
 *      URL, generació de l'hora segons el nivell, angles de les agulles i lectura
 *      i comprovació de la resposta (hores i minuts). No toca el DOM: es pot provar
 *      des de Node (tests/activitats.test.js).
 * DEPENDÈNCIES: utils.js (getIntParam, randInt).
 * ============================================================================
 */
import { getIntParam, randInt } from '../utils.js';

/**
 * Llegeix els paràmetres propis de l'activitat:
 *   ?nivell=1   quarts d'hora (els minuts són 0, 15, 30 o 45) (per defecte)
 *   ?nivell=2   intervals de 5 minuts
 *   ?nivell=3   qualsevol minut (0–59)
 *   ?numeros=1  el rellotge porta els números 1–12 (també es pot canviar amb el botó)
 */
export function llegeixParametres(params) {
    return {
        nivell: getIntParam(params, 'nivell', 1, 1, 3),
        numeros: parseInt(params.get('numeros') || '0', 10) === 1,
    };
}

/** Genera una hora { hores (1–12), minuts } segons el nivell. */
export function generaHora({ nivell }) {
    const hores = randInt(1, 12);
    if (nivell === 1) return { hores, minuts: [0, 15, 30, 45][randInt(0, 3)] };
    if (nivell === 2) return { hores, minuts: randInt(0, 11) * 5 };
    return { hores, minuts: randInt(0, 59) };
}

/** Els graus que giren les agulles des de les 12:00: l'agulla de les hores avança mig grau per minut. */
export function anglesAgulles(hores, minuts) {
    return { hora: (hores % 12) * 30 + minuts * 0.5, minut: minuts * 6 };
}

/** Una hora com s'escriu: «3:07». */
export const formatHora = (hores, minuts) => `${hores}:${String(minuts).padStart(2, '0')}`;

/**
 * Llegeix el que ha escrit l'alumne. Torna null si no és una hora (buits, no enters o fora de 1–12 i 0–59);
 * les hores 13–23 s'accepten (13 → 1, …, 23 → 11).
 */
export function llegeixResposta(textHores, textMinuts) {
    const h = String(textHores).trim();
    const m = String(textMinuts).trim();
    if (!/^\d{1,2}$/.test(h) || !/^\d{1,2}$/.test(m)) return null;
    let hores = parseInt(h, 10);
    const minuts = parseInt(m, 10);
    if (hores >= 13 && hores <= 23) hores -= 12;
    if (hores < 1 || hores > 12 || minuts > 59) return null;
    return { hores, minuts };
}

/** Els textos que l'activitat posa a la pantalla a partir del lèxic: cap (només el rellotge i xifres). */
export function exemplesDeText() {
    return [];
}
