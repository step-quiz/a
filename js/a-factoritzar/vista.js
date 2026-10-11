/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-factoritzar/vista.js
 * ROL: L'HTML i els textos plans de la pantalla de «Factoritzar»: l'arbre de
 *      factors, el resultat, la parella equivocada amb ✖ i l'ajuda. Només hi
 *      ha nombres i símbols; l'activitat no té frases.
 *      No toca el DOM: només construeix text. Es prova des de Node
 *      (tests/activitats.test.js); el controlador és a-factoritzar.js.
 * DEPENDÈNCIES: generador.js.
 * ============================================================================
 */
import { comprova, factoritza, pendents, primersQueDivideixen } from './generador.js';

/** La factorització d'un nombre: «12 = 2² · 3». */
export function htmlFactoritzacio(n, factors) {
    const primers = Object.keys(factors)
        .map(Number)
        .sort((x, y) => x - y);
    const part = p => (factors[p] === 1 ? `${p}` : `${p}<sup>${factors[p]}</sup>`);
    return `<strong>${n}</strong> = ${primers.map(part).join(' · ')}`;
}

/** El resultat final: «✅ 12 = 2² · 3». */
export const htmlResultat = n => `✅ ${htmlFactoritzacio(n, factoritza(n))}`;

/**
 * L'arbre: cada node és un cercle amb el nombre; el que toca partir pulsa (actiu), els primers es posen en verd quan
 * l'arbre és complet. `actiu` és el node pendent actual (o null).
 */
export function htmlArbre(node, actiu, completat) {
    let classe = 'node-value';
    if (completat) {
        if (node.fills) classe += ' decomposed';
        else if (node.primer) classe += ' prime';
    } else if (node.primer && !node.fills) classe += ' prime-done';
    else if (node === actiu) classe += ' active';
    else if (node.fills) classe += ' decomposed';
    let html = `<div class="tree-node"><div class="${classe}">${node.valor}</div>`;
    if (node.fills)
        html += `<div class="node-children">${htmlArbre(node.fills[0], actiu, completat)}<div class="split-symbol">·</div>${htmlArbre(node.fills[1], actiu, completat)}</div>`;
    return `${html}</div>`;
}

/** L'arbre d'un node arrel tal com està ara: el primer node pendent és l'actiu. */
export function htmlArbreActual(arrel) {
    const pendent = pendents(arrel);
    return htmlArbre(arrel, pendent[0] ?? null, pendent.length === 0);
}

/**
 * Després d'una parella equivocada: «3 · 5 = 15 ✖» (el producte no és el nombre) o «1 ✖ · 12 = 12» (un factor és 0 o 1:
 * cal que siguin més grans que 1). Torna '' si falta algun nombre.
 */
export function htmlProva(valor, a, b) {
    if (a === null || b === null) return '';
    const r = comprova(valor, a, b);
    const factor = f => (f < 2 ? `${f} ✖` : `${f}`);
    const producte = r.unAlgun || r.producte === valor ? `${r.producte}` : `${r.producte} ✖`;
    return `<span class="part mal">${factor(a)} · ${factor(b)} = ${producte}</span>`;
}

/** L'ajuda 💡: els primers del nivell amb ✔ si divideixen el nombre i ✖ si no: «12: 2 ✔  3 ✔  5 ✖». */
export function htmlAjuda(valor, nivell) {
    const primers = primersQueDivideixen(valor, nivell)
        .map(
            p =>
                `<span class="ajuda-primer ${p.divideix ? 'divideix' : 'no-divideix'}">${p.primer} ${p.divideix ? '✔' : '✖'}</span>`
        )
        .join(' ');
    return `<div class="ajuda-fila"><span class="ajuda-nombre">${valor}</span> ${primers}</div>`;
}

/** La pregunta, en text pla, per a la revisió final: «12 = ? · ?». */
export const textPregunta = valor => `${valor} = ? · ?`;

/** La resposta de l'alumne, en text pla: «3 · 4». */
export const textResposta = (a, b) => `${a} · ${b}`;
