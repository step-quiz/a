/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/targetes/vista.js
 * ROL: L'HTML de les «Targetes de vocabulari» (vegeu generador.js): una
 *      targeta, una pàgina de targetes, el botó d'un tema i els textos (el
 *      resum «36 targetes · 4 pàgines» i el peu de cada pàgina). No toca el DOM:
 *      només construeix text (es prova des de Node); el controlador és
 *      targetes.js i els estils, css/targetes.css.
 * DEPENDÈNCIES: generador.js i el lèxic (js/lexicon/).
 * ============================================================================
 */
import { entrada } from '../lexicon/lexicon.js';
import { htmlImatge, menaImatge } from '../lexicon/paraula.js';
import { QUADRICULES } from './generador.js';

const escapa = t =>
    String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** El títol que surt al peu de cada pàgina (per a qui les ordena: no és per a l'alumnat). */
export const TITOL = 'Targetes de vocabulari';

/**
 * Una targeta (la imatge, decorativa, i la paraula amb article), segons el `contingut`: 'tot' (imatge i paraula),
 * 'imatge' (només la imatge; porta el nom com a etiqueta accessible) o 'paraula' (només la paraula). Una casella buida
 * (`null`) fa lloc a la quadrícula però no es veu.
 */
export function htmlTargeta(t, contingut = 'tot') {
    if (t === null) return '<div class="targeta targeta-buida" aria-hidden="true"></div>';
    const e = entrada(t.id);
    const imatge =
        contingut === 'paraula'
            ? ''
            : `<div class="targeta-imatge targeta-${menaImatge(e)}" aria-hidden="true">${htmlImatge(e)}</div>`;
    const mot = contingut === 'imatge' ? '' : `<div class="targeta-mot">${escapa(t.text)}</div>`;
    const nom = contingut === 'imatge' ? ` role="img" aria-label="${escapa(t.text)}"` : '';
    return `<div class="targeta" data-paraula="${t.id}"${nom}><div class="targeta-cos">${imatge}${mot}</div></div>`;
}

/** El peu d'una pàgina: «Targetes de vocabulari · 3 / 12» (a doble cara, també «· davant» o «· darrere»). */
export const textPeu = (pagina, n, total) =>
    `${TITOL} · ${n} / ${total}${pagina.cara === 1 ? ' · davant' : pagina.cara === 2 ? ' · darrere' : ''}`;

/**
 * Una pàgina de targetes: un full A4 amb la quadrícula de la `mida` (1, 4 o 9 targetes) i el peu. `pagina` és un element de
 * pagines() (generador.js); `n` i `total`, el número de pàgina i les pàgines que hi ha.
 */
export function htmlPagina(pagina, mida, n, total) {
    const [columnes, files] = QUADRICULES[mida];
    const peu = escapa(textPeu(pagina, n, total));
    return (
        `<div class="targetes-full" role="group" aria-label="${n} / ${total}">` +
        `<div class="targetes-pagina" data-contingut="${pagina.contingut}" style="--columnes: ${columnes}; --files: ${files}">` +
        `${pagina.caselles.map(c => htmlTargeta(c, pagina.contingut)).join('')}</div>` +
        `<div class="targetes-peu" aria-hidden="true">${peu}</div></div>`
    );
}

/** El botó d'un tema (una casella que es marca o es desmarca): la icona, el nom i quantes paraules té. */
export function htmlTema(t, triat) {
    return (
        `<label class="opcio"><input type="checkbox" name="tema" value="${t.tema}"${triat ? ' checked' : ''}>` +
        `<span class="opcio-cos"><span class="opcio-icona" aria-hidden="true">${t.icona}</span>` +
        `<span class="opcio-nom">${escapa(t.nom)}</span><span class="opcio-n">${t.n}</span></span></label>`
    );
}

/** El resum: «36 targetes · 4 pàgines» (en singular, «1 targeta · 1 pàgina»). */
export const textResum = (targetes, pagines) =>
    `${targetes} ${targetes === 1 ? 'targeta' : 'targetes'} · ${pagines} ${pagines === 1 ? 'pàgina' : 'pàgines'}`;
