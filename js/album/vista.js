/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/album/vista.js
 * ROL: L'HTML de l'«Àlbum de paraules» (vegeu logica.js): les cartes, els
 *      grups per temes amb la seva icona i el progrés. Una carta d'una paraula
 *      que l'alumne encara no ha vist porta «?» en lloc de la paraula; tocar-la
 *      n'obre la targeta («Aprèn la paraula», js/targeta-paraula.js) i la
 *      desbloqueja. No toca el DOM: només construeix text (es prova des de Node).
 * DEPENDÈNCIES: logica.js, el lèxic (js/lexicon/).
 * ============================================================================
 */
import { entrada } from '../lexicon/lexicon.js';
import { htmlImatge } from '../lexicon/paraula.js';
import { enllacPractica } from './logica.js';

const escapa = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** El que es veu a una carta: la paraula amb article, o «?» si encara no s'ha vist. */
export const textCarta = p => (p.vista ? p.text : '?');

/** Una carta: la imatge i la paraula (o «?»). Fa de «píndola» de paraula: tocar-la obre la targeta de js/targeta-paraula.js. */
export function htmlCarta(p) {
    const imatge = htmlImatge(entrada(p.id));
    return (
        `<span class="paraula album-carta${p.vista ? '' : ' album-bloquejada'}" data-paraula="${p.id}" role="button" tabindex="0">` +
        `<span class="paraula-img" aria-hidden="true">${imatge}</span>` +
        `<span class="paraula-text">${escapa(textCarta(p))}</span></span>`
    );
}

/** Un tema: la seva icona, un botó per practicar-lo (▶) i les cartes. `jugar` és el nom accessible del botó. */
export function htmlGrup(g, jugar) {
    return (
        `<section class="album-grup" data-tema="${g.tema}">` +
        `<h2 class="album-tema"><span class="album-icona" aria-hidden="true">${g.icona}</span>` +
        `<a class="album-tema-jugar" href="${enllacPractica({ tema: g.tema })}" aria-label="${escapa(jugar)}">▶</a></h2>` +
        `<div class="album-cartes">${g.paraules.map(htmlCarta).join('')}</div></section>`
    );
}

/** El progrés: «12 / 65» i una barra. `nom` és el nom accessible de la barra. */
export function htmlProgres(r, nom) {
    const pct = r.total ? Math.round((100 * r.vistes) / r.total) : 0;
    return (
        `<span class="album-num">${r.vistes} / ${r.total}</span>` +
        `<span class="album-barra" role="progressbar" aria-label="${escapa(nom)}" aria-valuemin="0" aria-valuemax="${r.total}" aria-valuenow="${r.vistes}">` +
        `<span class="album-barra-or" style="width: ${pct}%"></span></span>`
    );
}
