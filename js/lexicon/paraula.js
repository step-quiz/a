/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/lexicon/paraula.js
 * ROL: paraula(): una paraula del lèxic amb la seva imatge, com a HTML per
 *      posar dins d'un text: «[imatge] al pis». La imatge és el pictograma o
 *      l'emoji de l'entrada (`imatge` a js/lexicon/dades.js).
 *      · La imatge és decorativa (aria-hidden): el text ja diu la paraula i
 *        és el que llegeixen els lectors de pantalla.
 *      · `data-paraula` porta l'id. Si la paraula té imatge, la píndola és un
 *        botó (role="button", tabindex="0"): un toc, Intro o Espai n'obre la
 *        targeta «Aprèn la paraula» (js/targeta-paraula.js, PR 7). Una paraula
 *        sense imatge no és un botó: la targeta només tindria el text.
 *      · Els estils són a css/shared.css (.paraula, .pict-*).
 *      Només text, sense DOM: es prova des de Node.
 * DEPENDÈNCIES: lexicon.js, pictogrames.js.
 * ============================================================================
 */
import { ambArticle, entrada, forma, preposicio } from './lexicon.js';
import { MATES } from './mates.js';
import { PICTOGRAMES } from './pictogrames.js';

const escapa = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * El text d'una paraula, tal com s'escriu (sense imatge). Opcions:
 *   · noms: `plural`; `article: false` (només «pis»); `prep: 'a' | 'de' | 'per'` (preposició + article: «al pis»).
 *     Per defecte, amb l'article: «el pis».
 *   · verbs, adjectius i altres: `forma` (una de les seves formes; per defecte, la primera: «pujar»).
 */
export function textParaula(id, { plural = false, article = true, prep, forma: formaTriada } = {}) {
    const e = entrada(id);
    if (e.tipus === 'nom') {
        if (prep) return preposicio(prep, id, { plural });
        return article ? ambArticle(id, { plural }) : forma(id, { plural });
    }
    if (plural || prep) throw new Error(`«${id}» és un ${e.tipus}: no té plural ni preposició`);
    const f = formaTriada ?? e.formes[0];
    if (!e.formes.includes(f)) throw new Error(`«${f}» no és cap forma de «${id}» (${e.formes.join(', ')})`);
    return f;
}

/**
 * L'HTML de la imatge d'una entrada ('' si no en té): l'emoji (escapat), el pictograma (SVG propi) o un mini-exemple
 * matemàtic o un dibuix de geometria (`mates`: la d'aquest id a js/lexicon/mates.js, per als termes que no es poden dibuixar).
 */
export function htmlImatge(e) {
    if (!e.imatge) return '';
    if (e.imatge.emoji) return escapa(e.imatge.emoji);
    if (e.imatge.mates) {
        const html = MATES[e.imatge.mates];
        if (!html) throw new Error(`«${e.id}»: la imatge «${e.imatge.mates}» no existeix (js/lexicon/mates.js)`);
        return html;
    }
    const svg = PICTOGRAMES[e.imatge.pictograma];
    if (!svg)
        throw new Error(`«${e.id}»: el pictograma «${e.imatge.pictograma}» no existeix (js/lexicon/pictogrames.js)`);
    return svg;
}

/**
 * De quina mena és la imatge d'una entrada: 'emoji', 'pictograma' o 'mates'. Cada mena es dibuixa amb la seva mida
 * (els emojis i els pictogrames són peces quadrades; els termes de matemàtiques, mini-exemples més amples): les targetes i
 * les fitxes de la portada en fan una classe CSS. L'entrada ha de portar imatge.
 */
export const menaImatge = e => (e.imatge.emoji ? 'emoji' : e.imatge.pictograma ? 'pictograma' : 'mates');

/**
 * La paraula amb la seva imatge, com a HTML: paraula('pis', { prep: 'a' }) →
 * <span class="paraula" data-paraula="pis" role="button" tabindex="0"><span class="paraula-img" aria-hidden="true">…</span><span class="paraula-text">al pis</span></span>
 * Les opcions són les de textParaula().
 */
export function paraula(id, opcions = {}) {
    const e = entrada(id);
    const text = escapa(textParaula(id, opcions));
    const imatge = htmlImatge(e);
    const html = imatge ? `<span class="paraula-img" aria-hidden="true">${imatge}</span>` : '';
    const toc = imatge ? ' role="button" tabindex="0"' : '';
    return `<span class="paraula" data-paraula="${id}"${toc}>${html}<span class="paraula-text">${text}</span></span>`;
}
