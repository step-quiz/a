/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/album/logica.js
 * ROL: La lògica pura de l'«Àlbum de paraules» (sense DOM): quines paraules hi
 *      ha (els noms concrets amb imatge del lèxic), agrupades per temes amb la
 *      seva icona, quantes n'ha vist l'alumne i els enllaços per practicar-les
 *      a «Vocabulari». Es prova des de Node (tests/activitats.test.js).
 * DEPENDÈNCIES: el lèxic (js/lexicon/).
 * ============================================================================
 */
import { TEMES, paraulesDelBanc, textBanc } from '../lexicon/lexicon.js';

/** La icona de cada tema (només dibuixos: l'àlbum no té text als encapçalaments). Un tema nou al lèxic n'ha de tenir una. */
export const ICONES_TEMES = {
    'edifici': '🏢',
    'nombres': '🔢',
    'botiga': '🛒',
    'hora': '🕐',
    'escola': '🏫',
    'animals': '🐾',
    'natura': '🌳',
    'menjar': '🍽️',
    'transport': '🚌',
    'casa': '🏠',
    'mat-nombres': '🔟',
    'mat-operacions': '➗',
    'mat-fraccions': '🍕',
    'mat-algebra': '🔣',
    'mat-linies': '📐',
    'mat-figures': '🔷',
    'mat-elements': '📏',
    'mat-cossos': '🧊',
    'mat-mesura': '⚖️',
    'mat-funcions': '📈',
    'mat-estadistica': '📊',
};

/** Les paraules de l'àlbum: les del banc de paraules del lèxic (vegeu paraulesDelBanc). */
export const paraulesDelAlbum = paraulesDelBanc;

/**
 * Les paraules agrupades per temes (en l'ordre de TEMES; només els temes que en tenen):
 * [{ tema, icona, paraules: [{ id, text, vista }] }]. `vistes` és un Set d'ids (o res).
 */
export function agrupaPerTemes(vistes = new Set()) {
    const totes = paraulesDelAlbum();
    return Object.keys(TEMES)
        .map(tema => ({
            tema,
            icona: ICONES_TEMES[tema] ?? '📚',
            paraules: totes
                .filter(e => e.tema === tema)
                .map(e => ({ id: e.id, text: textBanc(e.id), vista: vistes.has(e.id) })),
        }))
        .filter(g => g.paraules.length > 0);
}

/** Quantes paraules de l'àlbum ha vist l'alumne: { vistes, total } (els ids que no són de l'àlbum no compten). */
export function resum(vistes = new Set()) {
    const totes = paraulesDelAlbum();
    return { vistes: totes.filter(e => vistes.has(e.id)).length, total: totes.length };
}

/** L'enllaç per practicar a «Vocabulari»: les paraules d'un tema, o les que ja s'han vist. */
export function enllacPractica({ tema = '', vistes = false } = {}) {
    const params = new URLSearchParams();
    if (tema) params.set('tema', tema);
    if (vistes) params.set('vistes', '1');
    const text = params.toString();
    return `a-vocabulari.html${text ? `?${text}` : ''}`;
}
