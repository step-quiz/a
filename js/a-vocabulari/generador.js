/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-vocabulari/generador.js
 * ROL: La lògica pura de «Vocabulari» (sense DOM): els paràmetres de la URL,
 *      el banc de paraules (els noms concrets amb imatge del lèxic), les
 *      preguntes de cada nivell amb distractors del mateix tema, i la
 *      comprovació d'una paraula escrita lletra a lletra (✔, accent, ✖).
 *      Es prova des de Node (tests/activitats.test.js).
 * DEPENDÈNCIES: js/utils.js i el lèxic (js/lexicon/).
 *
 * Nivells:
 *   1  una imatge → triar la paraula (4 opcions, amb article: «la poma»)
 *   2  una paraula («la poma») → triar la imatge (4 opcions)
 *   3  una imatge → escriure la paraula («poma»; s'accepta també amb l'article)
 * ============================================================================
 */
import { getIntParam, pick, shuffle } from '../utils.js';
import { LEXIC, TEMES, paraulesDelBanc, solucioBanc, textBanc } from '../lexicon/lexicon.js';
import { tambeEs, temesVeins } from '../lexicon/relacions.js';

export const NIVELL_MAXIM = 3;

/** Les opcions de les preguntes de triar. */
export const N_OPCIONS = 4;

/**
 * Llegeix els paràmetres propis de l'activitat:
 *   ?nivell=1|2|3   1 = imatge → paraula (per defecte); 2 = paraula → imatge; 3 = imatge → escriure la paraula
 *   ?tema=botiga    només les paraules d'un tema (vegeu TEMES del lèxic); un tema que no existeix s'ignora
 *   ?vistes=1       només les paraules que l'alumne ja ha obert amb «Aprèn la paraula»
 */
export function llegeixParametres(params) {
    const tema = params.get('tema');
    return {
        nivell: getIntParam(params, 'nivell', 1, 1, NIVELL_MAXIM),
        tema: tema && tema in TEMES ? tema : '',
        vistes: params.get('vistes') === '1',
    };
}

// ── El banc de paraules ──────────────────────────────────────────────────────

/** Totes les paraules del banc: els noms concrets amb imatge i les expressions marcades amb `banc` (vegeu paraulesDelBanc). */
export const totesLesParaules = paraulesDelBanc;

/**
 * El banc d'una sessió: { ids, totes }. `ids` són les paraules que es poden preguntar (les del tema i, si es demana, només
 * les vistes); `totes`, totes les del lèxic (per als distractors). Si el filtre no deixa cap paraula, es pregunten totes.
 * `vistes` és un Set d'ids (o null per no filtrar).
 */
export function bancDeParaules({ tema = '', vistes = null } = {}) {
    const totes = totesLesParaules();
    let ids = totes.filter(e => (!tema || e.tema === tema) && (!vistes || vistes.has(e.id))).map(e => e.id);
    if (ids.length === 0) ids = totes.map(e => e.id);
    return { ids, totes: totes.map(e => e.id) };
}

const emojiDe = id => LEXIC.find(e => e.id === id)?.imatge ?? null;
const temaDe = id => LEXIC.find(e => e.id === id).tema;

/**
 * Si `altra` no pot sortir com a opció equivocada d'una pregunta sobre `id`, perquè seria també una resposta certa
 * (vegeu js/lexicon/relacions.js):
 *   · nivell 1 (una imatge → triar la paraula): la imatge d'`id` també és un exemple d'`altra`
 *     (a la d'un triangle rectangle, «el polígon» també és cert);
 *   · nivell 2 (una paraula → triar la imatge): la imatge d'`altra` també és un exemple d'`id`
 *     (a «el polígon», la imatge d'un triangle també és certa).
 */
export const esAmbigua = (id, altra, nivell = 1) => (nivell === 2 ? tambeEs(altra).has(id) : tambeEs(id).has(altra));

/**
 * Els distractors d'una paraula: primer del mateix tema, després dels temes de la seva família (geometria, nombres…) i, si no n'hi ha prou, d'altres; mai una imatge repetida ni una
 * opció que també seria certa (vegeu esAmbigua).
 */
export function distractors(id, totes, n = N_OPCIONS - 1, nivell = 1) {
    const clau = JSON.stringify(emojiDe(id));
    const usades = new Set([clau]);
    const triats = [];
    const afegeix = altre => {
        const k = JSON.stringify(emojiDe(altre));
        if (altre === id || usades.has(k) || triats.length >= n || esAmbigua(id, altre, nivell)) return;
        usades.add(k);
        triats.push(altre);
    };
    const tema = temaDe(id);
    const veins = temesVeins(tema);
    const mateixTema = shuffle(totes.filter(a => temaDe(a) === tema));
    const mateixaFamilia = shuffle(totes.filter(a => veins.includes(temaDe(a))));
    const resta = shuffle(totes.filter(a => temaDe(a) !== tema && !veins.includes(temaDe(a))));
    [...mateixTema, ...mateixaFamilia, ...resta].forEach(afegeix);
    return triats;
}

// ── La pregunta ──────────────────────────────────────────────────────────────

/**
 * Una pregunta del nivell: { id, text (amb article: «la poma»; sense, a les expressions), solucio (sense article: «poma»), opcions? }.
 * Als nivells 1 i 2, `opcions` són 4 { id, text, correcta } barrejades. `excloure` és un Set d'ids que ja han sortit.
 */
export function generaPregunta(nivell, banc, excloure = new Set()) {
    const lliures = banc.ids.filter(id => !excloure.has(id));
    const id = pick(lliures.length ? lliures : banc.ids);
    const p = { nivell, id, text: textBanc(id), solucio: solucioBanc(id) };
    if (nivell <= 2) {
        const ids = shuffle([id, ...distractors(id, banc.totes, N_OPCIONS - 1, nivell)]);
        p.opcions = ids.map(o => ({ id: o, text: textBanc(o), correcta: o === id }));
    }
    return p;
}

/** La pregunta en text pla (per a la revisió final): «la poma». */
export const textPregunta = p => p.text;

// ── La paraula escrita ───────────────────────────────────────────────────────

/** Una lletra sense accent ni cedilla: «é» → «e», «ç» → «c». */
export const baseLletra = c => c.normalize('NFD').replace(/[̀-ͯ]/g, '');

/** El text escrit, net: sense espais de més, en minúscula i amb l'apòstrof recte. */
export const normalitza = t =>
    String(t)
        .trim()
        .toLocaleLowerCase('ca')
        .replace(/[’‘`´]/g, "'")
        .replace(/\s+/g, ' ');

const ARTICLE = /^(?:el|la|els|les)\s+|^l'\s*/;

/** El text escrit sense l'article del davant («la poma» → «poma»), si en porta i queda alguna cosa. */
export function senseArticle(escrit) {
    const t = normalitza(escrit);
    const net = t.replace(ARTICLE, '');
    return net && net !== t ? net : t;
}

/** Si la paraula escrita és la bona (amb els accents; l'article del davant és opcional). */
export function esCorrecta(p, escrit) {
    const t = normalitza(escrit);
    return t === normalitza(p.solucio) || t === normalitza(p.text);
}

/**
 * Si el que s'ha escrit no és la paraula que es busca, però també és cert de la imatge: una paraula més general
 * («triangle» per a un triangle rectangle). No és un error: es diu que hi ha una paraula més concreta (✔ 🔍) i no costa
 * cap intent.
 */
export function esMesGeneral(p, escrit) {
    if (esCorrecta(p, escrit)) return false;
    const t = normalitza(escrit);
    const net = senseArticle(escrit);
    return [...tambeEs(p.id)].some(b => net === normalitza(solucioBanc(b)) || t === normalitza(textBanc(b)));
}

/**
 * La paraula escrita comparada lletra a lletra amb la bona: [{ lletra, estat }] amb estat
 *   'ok' (la mateixa), 'accent' (la mateixa lletra però amb un altre accent), 'mal' (una altra),
 *   'falta' (no l'ha escrita; `lletra` és «_») o 'sobra' (n'ha escrit de més).
 */
export function comparaLletres(p, escrit) {
    const c = [...normalitza(p.solucio)];
    const e = [...senseArticle(escrit)];
    return Array.from({ length: Math.max(c.length, e.length) }, (_, i) => {
        if (i >= e.length) return { lletra: '_', estat: 'falta' };
        if (i >= c.length) return { lletra: e[i], estat: 'sobra' };
        if (e[i] === c[i]) return { lletra: e[i], estat: 'ok' };
        return { lletra: e[i], estat: baseLletra(e[i]) === baseLletra(c[i]) ? 'accent' : 'mal' };
    });
}

/** Les lletres amb accent del català, per a la barra que ajuda a escriure-les. */
export const LLETRES_CATALANES = ['à', 'è', 'é', 'í', 'ï', 'ò', 'ó', 'ú', 'ü', 'ç'];

/** Els textos que l'activitat genera i que han de ser al lèxic: cap (les paraules són del lèxic mateix). */
export function exemplesDeText() {
    return [];
}
