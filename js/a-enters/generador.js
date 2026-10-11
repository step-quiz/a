/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-enters/generador.js
 * ROL: Lògica PURA de l'activitat «Nombres enters» (a-enters.html): paràmetres
 *      de la URL, generació de l'operació, resposta correcta i textos d'ajuda.
 *      No toca el DOM: per això es pot provar des de Node (tests/activitats.test.js).
 *      El controlador (pantalla, teclat, punts) és a a-enters.js.
 * DEPENDÈNCIES: utils.js (getIntParam, randInt), el lèxic (js/lexicon/), textos.js i textos.js d'aquesta carpeta.
 * ============================================================================
 */
import { paraula, textParaula } from '../lexicon/paraula.js';
import { format } from '../textos.js';
import { getIntParam, randInt } from '../utils.js';
import { TEXTOS } from './textos.js';

/**
 * Llegeix els paràmetres propis de l'activitat:
 *   ?rang=N       a ∈ [−N..+N], b ∈ [1..N]   (per defecte i màxim: 12)
 *   ?nivell=1|2   1 = només sumes amb a ≥ 0; 2 = sumes i restes (per defecte)
 *   ?operadors=   suma | resta | tots (per defecte)
 */
export function llegeixParametres(params) {
    const operadors = (params.get('operadors') || '').toLowerCase();
    return {
        rang: getIntParam(params, 'rang', 12, 1, 12),
        nivell: getIntParam(params, 'nivell', 2, 1, 2),
        operadors: ['suma', 'resta', 'tots'].includes(operadors) ? operadors : 'tots',
    };
}

/** Operadors que poden sortir: forçats per ?operadors=, o només «+» al nivell 1. */
export function operadorsDisponibles(nivell, operadors) {
    if (operadors === 'suma') return ['+'];
    if (operadors === 'resta') return ['-'];
    if (nivell === 1) return ['+'];
    return ['+', '-'];
}

/**
 * Genera { a, op, b } (b sempre positiu: mai no apareix una operació com 4−(−5)).
 *
 *   b ∈ [1..rang]
 *   nivell 1: a ∈ [0..rang]
 *   nivell 2: a ∈ [−rang..rang], amb a < b el 70 % de les vegades
 *   operador: 40 % «+» i 60 % «−» (o el forçat per ?operadors= / nivell 1)
 */
export function generaProblema({ nivell, rang, operadors }) {
    const ops = operadorsDisponibles(nivell, operadors);
    const op = ops.length === 1 ? ops[0] : Math.random() < 0.4 ? '+' : '-';
    const b = randInt(1, rang);
    let a;
    if (nivell === 1) a = randInt(0, rang);
    else if (Math.random() < 0.7) a = randInt(-rang, b - 1);
    else a = randInt(b, rang);
    return { a, op, b };
}

/** Resultat de a OP b. */
export function calculaResposta(a, op, b) {
    return op === '+' ? a + b : a - b;
}

/**
 * La frase de suport amb la metàfora de l'ascensor. `p(id, opcions)` escriu una paraula del lèxic:
 * textParaula (només text) o paraula (text amb imatge, en HTML).
 */
function fraseAjuda(a, op, b, p) {
    let lloc;
    if (a === 0) lloc = p('planta-baixa', { prep: 'a' });
    else if (a > 0) lloc = `${p('pis', { prep: 'a' })} ${a}`;
    else lloc = `${p('soterrani', { prep: 'a' })} ${Math.abs(a)}`; // «soterrani» ja implica negatiu
    const verb = op === '+' ? p('pujar', { forma: 'pujo' }) : p('baixar', { forma: 'baixo' });
    const accio = `${verb} ${b} ${p('pis', { plural: b !== 1, article: false })}`;
    return format(TEXTOS.ajudaFrase, { lloc, accio, pis: p('pis', { article: false }) });
}

/** La frase d'ajuda en text: «Si estic al pis 3 i pujo 2 pisos, en quin pis acabo?» */
export function textAjuda(a, op, b) {
    return fraseAjuda(a, op, b, textParaula);
}

/** La mateixa frase en HTML, amb la imatge de cada paraula que en té (pis, planta baixa, soterrani, pujar, baixar). */
export function htmlAjuda(a, op, b) {
    return fraseAjuda(a, op, b, paraula);
}

/** Pista del signe del resultat (a l'ajuda surt aproximadament la meitat de les vegades). */
export function textPistaSigne(resultat) {
    if (resultat === 0) return TEXTOS.signeZero;
    return resultat > 0 ? TEXTOS.signePositiu : TEXTOS.signeNegatiu;
}

/** Exemples de tots els textos que aquest generador pot produir (tests/check-lexicon.js en comprova el vocabulari). */
export function exemplesDeText() {
    const exemples = [];
    for (const a of [-12, -1, 0, 1, 12])
        for (const op of ['+', '-']) for (const b of [1, 2, 12]) exemples.push(textAjuda(a, op, b));
    for (const resultat of [-3, 0, 3]) exemples.push(textPistaSigne(resultat));
    return exemples;
}
