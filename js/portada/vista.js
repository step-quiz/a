/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/portada/vista.js
 * ROL: L'HTML de la portada de l'alumnat: una fitxa per activitat (la imatge,
 *      gran, i el nom). Tota la fitxa és l'enllaç a l'activitat. No toca el DOM:
 *      només construeix text (es prova des de Node); el controlador és
 *      portada.js i els estils, css/portada.css.
 * DEPENDÈNCIES: el lèxic (js/lexicon/): la imatge d'una fitxa és la d'una paraula
 *      del lèxic (així l'alumne veu a la fitxa la mateixa imatge que a la targeta
 *      «Aprèn la paraula») o un emoji.
 * ============================================================================
 */
import { entrada } from '../lexicon/lexicon.js';
import { htmlImatge, menaImatge } from '../lexicon/paraula.js';

const escapa = t =>
    String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** L'entrada que dibuixa la imatge d'una fitxa: la d'una paraula del lèxic ({ id }) o un emoji ({ emoji }). */
const entradaImatge = a => (a.imatge.id ? entrada(a.imatge.id) : { id: a.file, imatge: { emoji: a.imatge.emoji } });

/**
 * Una fitxa: un enllaç a la pàgina de l'activitat, amb la imatge (decorativa: el nom ja diu què és) i el nom. `a` és una
 * activitat del catàleg (activitats.js) o l'àlbum.
 */
export function htmlFitxa(a) {
    const e = entradaImatge(a);
    return (
        `<li><a class="fitxa" href="${a.file}">` +
        `<span class="fitxa-imatge fitxa-${menaImatge(e)}" aria-hidden="true">${htmlImatge(e)}</span>` +
        `<span class="fitxa-nom">${escapa(a.nom)}</span></a></li>`
    );
}

/** Les fitxes d'una llista d'activitats, una darrere l'altra. */
export const htmlFitxes = llista => llista.map(htmlFitxa).join('');
