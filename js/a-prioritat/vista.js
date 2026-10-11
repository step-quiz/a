/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-prioritat/vista.js
 * ROL: L'HTML de la pantalla de «Prioritat d'operacions»: la resolució en una
 *      taula «centrada» (una columna per a cada nombre, signe, potència i
 *      parèntesi de l'enunciat; el resultat d'una operació queda centrat sota
 *      el que substitueix), amb els signes i les potències de la línia de treball
 *      com a botons, i les comprovacions d'un error amb xifres i marques, sense
 *      frases. No toca el DOM: només construeix text (es prova des de Node);
 *      el controlador és a-prioritat.js.
 *
 *       2 + 3 · ( 5 − 2 ) =
 *       2 + 3 ·     3     =
 *       2 +     9         =
 *          11
 *
 *      A cada línia, l'operació que es fa a la línia següent va en blau fosc i
 *      subratllada (classe dest).
 * DEPENDÈNCIES: generador.js (opRange, OP_SHOW, textOperacio).
 * ============================================================================
 */
import { OP_SHOW, opRange, textOperacio } from './generador.js';

const CLS = { num: 'tok-num', op: 'tok-op', pow: 'tok-pow', lp: 'tok-paren tok-lp', rp: 'tok-paren tok-rp' };

/** El contingut d'un token: 12, −, 3<sup>2</sup>, ( */
export function tokText(t) {
    if (t.k === 'num') return String(t.v);
    if (t.k === 'op') return OP_SHOW[t.v];
    if (t.k === 'pow') return `${t.b}<sup>${t.e}</sup>`;
    return t.k === 'lp' ? '(' : ')';
}

/** El que llegeix un lector de pantalla en un botó: el signe o la potència («+», «3²»), sense paraules. */
const etiquetaBoto = t => (t.k === 'pow' ? `${t.b}${{ 2: '²', 3: '³' }[t.e]}` : OP_SHOW[t.v]);

/**
 * La resolució en una taula «centrada».
 * @param {Array}  rows  [{ line, op, auto }]: les línies, de l'enunciat cap avall. op: posició de l'operació que es fa per
 *                       passar a la línia següent (-1: cap); es destaca. auto: línia que no ha fet l'alumne (en gris).
 * @param {object} o     { active: l'última línia és la de treball (signes i potències, botons),
 *                         red, green: Set de posicions de la línia de treball a marcar en vermell / verd }
 */
export function htmlTaula(rows, o = {}) {
    const last = rows.length - 1;
    const trs = rows.map((row, k) => {
        const { line, op } = row;
        const [p, q] = op >= 0 ? opRange(line, op) : [-1, -2];
        const active = !!o.active && k === last;
        const tds = line.map((t, i) => {
            let inner = tokText(t);
            if (active && (t.k === 'op' || t.k === 'pow')) {
                let mark = '';
                if (o.red && o.red.has(i)) mark = ' hl-red';
                else if (o.green && o.green.has(i)) mark = ' hl-green';
                inner = `<button type="button" class="tok-btn${mark}" data-i="${i}" aria-label="${etiquetaBoto(t)}">${inner}</button>`;
            }
            const cls = CLS[t.k] + (i >= p && i <= q ? ' dest' : '');
            const span = t.c1 - t.c0;
            return `<td class="${cls}"${span > 1 ? ` colspan="${span}"` : ''}>${inner}</td>`;
        });
        const eq = k < last ? '<td class="igual">=</td>' : '';
        return `<tr${row.auto ? ' class="auto"' : ''}>${tds.join('')}${eq}</tr>`;
    });
    return `<table class="centrat">${trs.join('')}</table>`;
}

/** La pregunta del resultat: «4 · 5 = ?» (o «3² = ?»). */
export const htmlPregunta = (line, i) => `<span class="pregunta-op">${textOperacio(line, i)} = ?</span>`;

const xip = (text, ok) => `<span class="part ${ok ? 'bo' : 'mal'}">${text} ${ok ? '✔' : '✖'}</span>`;

/**
 * Una operació triada que encara no es pot fer: les que calia fer abans (✔) i, després de «›», la triada (✖):
 * «3 · 4 ✔  ›  + ✖». `bl` ve de blockers().
 */
export function htmlBloqueig(line, i, bl) {
    const abans = bl.green.map(g => xip(textOperacio(line, g), true)).join('');
    return `${abans}<span class="fletxa">›</span>${xip(OP_SHOW[bl.op], false)}`;
}

/** Un resultat equivocat comprovat amb xifres: «4 · 5 = 9 ✖». */
export const htmlResultatEquivocat = (line, i, val) => xip(`${textOperacio(line, i)} = ${val}`, false);
