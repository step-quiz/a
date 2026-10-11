/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/lexicon/lexicon.js
 * ROL: L'API del lèxic (js/lexicon/dades.js): busca una paraula pel seu `id` i
 *      la posa en català correcte: singular o plural, amb article («el pis»,
 *      «l'inici», «les estrelles»), amb preposició i contracció («al pis»,
 *      «a la planta baixa», «del soterrani», «pels pisos») i amb quantitat
 *      («1 pis», «2 pisos»). Només text, sense DOM: es prova des de Node.
 *      La imatge de cada paraula la posa paraula() (paraula.js).
 * DEPENDÈNCIES: dades.js.
 * ============================================================================
 */
import { LEXIC } from './dades.js';

export { LEXIC, FUNCIONALS, TEMES } from './dades.js';

const PER_ID = new Map(LEXIC.map(e => [e.id, e]));

/** L'entrada d'una paraula. Si no és al lèxic, falla amb un missatge que ho diu (així un error de lletra es veu de seguida). */
export function entrada(id) {
    const e = PER_ID.get(id);
    if (!e) throw new Error(`«${id}» no és al lèxic (js/lexicon/dades.js)`);
    return e;
}

function nom(id) {
    const e = entrada(id);
    if (e.tipus !== 'nom') throw new Error(`«${id}» és un ${e.tipus}, no un nom`);
    return e;
}

/** La paraula en singular o en plural: forma('pis') → «pis»; forma('pis', { plural: true }) → «pisos». */
export function forma(id, { plural = false } = {}) {
    const e = nom(id);
    return plural ? e.plural : e.singular;
}

/** L'article definit: «el», «la» o «l'» (singular), «els» o «les» (plural). */
export function article(id, { plural = false } = {}) {
    const e = nom(id);
    if (plural) return e.genere === 'm' ? 'els' : 'les';
    return e.article;
}

/** La paraula amb l'article: «el pis», «l'inici», «la planta baixa», «els pisos». */
export function ambArticle(id, opcions = {}) {
    const a = article(id, opcions);
    const f = forma(id, opcions);
    return a.endsWith("'") ? a + f : `${a} ${f}`;
}

// Preposició + article: a + el = al, a + els = als, de + el = del, de + els = dels, per + el = pel, per + els = pels.
// Amb «la», «les» i «l'» no hi ha contracció: «a la», «de les», «per l'».
const CONTRACCIONS = {
    a: { el: 'al', els: 'als' },
    de: { el: 'del', els: 'dels' },
    per: { el: 'pel', els: 'pels' },
};

/** Preposició + article + paraula: preposicio('a', 'pis') → «al pis»; preposicio('de', 'inici') → «de l'inici». */
export function preposicio(prep, id, opcions = {}) {
    if (!(prep in CONTRACCIONS))
        throw new Error(`Preposició desconeguda: «${prep}» (només ${Object.keys(CONTRACCIONS).join(', ')})`);
    const a = article(id, opcions);
    const f = forma(id, opcions);
    const contret = CONTRACCIONS[prep][a];
    if (contret) return `${contret} ${f}`;
    return a.endsWith("'") ? `${prep} ${a}${f}` : `${prep} ${a} ${f}`;
}

/** Un nombre i la paraula en la forma que toca: quantitat(1, 'pis') → «1 pis»; quantitat(2, 'pis') → «2 pisos» (el 0 va en plural). */
export function quantitat(n, id) {
    return `${n} ${forma(id, { plural: n !== 1 })}`;
}

/** Totes les formes escrites d'una entrada (per saber si una paraula d'un text hi és). */
export function formesDe(e) {
    return e.tipus === 'nom' ? [e.singular, e.plural] : e.formes;
}

// ── El banc de paraules (Vocabulari i Àlbum de paraules) ─────────────────────

/**
 * Les paraules del banc, les que es poden preguntar i col·leccionar: els noms concrets amb imatge i les entrades marcades
 * amb `banc: true` (expressions com «resoldre una equació», amb una imatge feta d'un mini-exemple matemàtic).
 */
export const paraulesDelBanc = () => LEXIC.filter(e => e.imatge && (e.concret || e.banc));

/** El text d'una paraula del banc, tal com es veu: el nom amb article («la poma») o la primera forma de la resta. */
export function textBanc(id) {
    const e = entrada(id);
    return e.tipus === 'nom' ? ambArticle(id) : e.formes[0];
}

/** La paraula del banc sense article (la que s'escriu): «poma», «nombre enter», «resoldre una equació». */
export function solucioBanc(id) {
    const e = entrada(id);
    return e.tipus === 'nom' ? e.singular : e.formes[0];
}
