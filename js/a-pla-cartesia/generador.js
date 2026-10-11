/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-pla-cartesia/generador.js
 * ROL: La lògica pura de «Coordenades» (el pla cartesià), sense DOM: els
 *      paràmetres de la URL, els punts i les preguntes de cada nivell i la
 *      comprovació de cada resposta. Es prova des de Node
 *      (tests/activitats.test.js).
 * DEPENDÈNCIES: js/utils.js.
 *
 * El pla va de x = −5 a 5 i de y = −4 a 4. Quatre tipus de pregunta:
 *   'situa'       es dona A(3, −2) i s'ha de tocar el punt al pla
 *   'coordenades' es veu el punt A i s'han d'escriure les seves coordenades
 *   'quadrant'    es veu el punt A i s'ha de triar a quin quadrant (o eix) és
 *   'al-quadrant' es dona un quadrant (o eix) i s'ha d'escriure un punt que hi sigui
 * ============================================================================
 */
import { getIntParam, pick, randInt } from '../utils.js';

export const NIVELL_MAXIM = 3;
export const X_MIN = -5;
export const X_MAX = 5;
export const Y_MIN = -4;
export const Y_MAX = 4;
export const ETIQUETES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const TIPUS = ['situa', 'coordenades', 'quadrant', 'al-quadrant'];

/**
 * Llegeix els paràmetres propis de l'activitat:
 *   ?nivell=1|2|3   1 = primer i segon quadrant (y positiva; per defecte); 2 = els quatre quadrants;
 *                   3 = també els eixos i l'origen
 */
export function llegeixParametres(params) {
    return { nivell: getIntParam(params, 'nivell', 1, 1, NIVELL_MAXIM) };
}

// ── Quadrants ────────────────────────────────────────────────────────────────

/** On és un punt: 'Q1'…'Q4', 'eixX', 'eixY' o 'origen'. */
export function quadrantDe(x, y) {
    if (x === 0 && y === 0) return 'origen';
    if (x === 0) return 'eixY';
    if (y === 0) return 'eixX';
    if (x > 0) return y > 0 ? 'Q1' : 'Q4';
    return y > 0 ? 'Q2' : 'Q3';
}

/** Els llocs que surten a cada nivell. */
export const LLOCS_DEL_NIVELL = {
    1: ['Q1', 'Q2'],
    2: ['Q1', 'Q2', 'Q3', 'Q4'],
    3: ['Q1', 'Q2', 'Q3', 'Q4', 'eixX', 'eixY', 'origen'],
};

/** Si el punt és dins del pla. */
export const dinsDelPla = (x, y) =>
    Number.isInteger(x) && Number.isInteger(y) && x >= X_MIN && x <= X_MAX && y >= Y_MIN && y <= Y_MAX;

/** Un punt del nivell: a 1, y positiva i x diferent de 0; a 2, cap coordenada 0; a 3, qualsevol. */
export function generaPunt(nivell) {
    for (;;) {
        const x = randInt(X_MIN, X_MAX);
        const y = nivell === 1 ? randInt(1, Y_MAX) : randInt(Y_MIN, Y_MAX);
        if (nivell < 3 && (x === 0 || y === 0)) continue;
        return { x, y };
    }
}

/** Un punt qualsevol d'un quadrant o eix (per mostrar-lo quan s'esgoten els intents). */
export function exemplePunt(lloc) {
    const x = { Q1: 2, Q4: 2, Q2: -2, Q3: -2, eixX: 3, eixY: 0, origen: 0 }[lloc];
    const y = { Q1: 2, Q2: 2, Q3: -2, Q4: -2, eixX: 0, eixY: 3, origen: 0 }[lloc];
    return { x, y };
}

// ── Les preguntes ────────────────────────────────────────────────────────────

/**
 * Una pregunta del nivell: { tipus, punt: { x, y }, etiqueta, lloc }
 *   `punt` és el punt que es mostra o es demana (a 'al-quadrant' no hi ha punt: només `lloc`);
 *   `lloc` és el quadrant o eix correcte (a 'quadrant', el del punt; a 'al-quadrant', el que es demana).
 */
export function generaPregunta(nivell, index = 0) {
    const tipus = pick(TIPUS);
    const etiqueta = ETIQUETES[index % ETIQUETES.length];
    if (tipus === 'al-quadrant') return { tipus, etiqueta, punt: null, lloc: pick(LLOCS_DEL_NIVELL[nivell]) };
    const punt = generaPunt(nivell);
    return { tipus, etiqueta, punt, lloc: quadrantDe(punt.x, punt.y) };
}

// ── Les respostes ────────────────────────────────────────────────────────────

/** 'situa': el punt tocat és el que es demana. */
export const comprovaSitua = (pregunta, x, y) => pregunta.punt.x === x && pregunta.punt.y === y;

/** 'coordenades': cada coordenada, bona o no: { xOk, yOk }. */
export const comprovaCoordenades = (pregunta, x, y) => ({ xOk: x === pregunta.punt.x, yOk: y === pregunta.punt.y });

/** 'al-quadrant': el punt escrit és dins del pla i és al quadrant o eix demanat. */
export const comprovaAlQuadrant = (pregunta, x, y) => dinsDelPla(x, y) && quadrantDe(x, y) === pregunta.lloc;

/** Els textos que l'activitat genera i que han de ser al lèxic: cap (només punts, nombres i icones). */
export function exemplesDeText() {
    return [];
}
