/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-vocabulari/generador.js
 * ROL: La lògica pura de «Vocabulari» (sense DOM): els paràmetres de la URL,
 *      el banc de paraules (els noms concrets amb imatge del lèxic), les
 *      preguntes de cada nivell amb distractors del mateix tema, i l'avaluació
 *      d'una paraula escrita, amb tolerància davant de les errades petites i
 *      lletra a lletra (✔, accent, ✖, ⇄).
 *      Es prova des de Node (tests/activitats.test.js).
 * DEPENDÈNCIES: js/utils.js i el lèxic (js/lexicon/).
 *
 * Nivells:
 *   1  una imatge → triar la paraula (4 opcions, amb article: «la poma»)
 *   2  una paraula («la poma») → triar la imatge (4 opcions)
 *   3  una imatge → escriure la paraula («poma»; s'accepta també amb l'article).
 *      No es demana escriure cap solució llarga («propietat commutativa»): vegeu LLARGADA_MAXIMA_ESCRITA.
 *
 * La paraula escrita (nivell 3) té la mateixa tolerància que «Vocabulari» d'operacions (js/vocabulari/vocabulari-engine.js):
 * una errada petita no és un error ni costa cap intent, sinó que surt on és i es pot corregir (vegeu avaluaEscrita).
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
 * La solució més llarga que es demana escriure (nivell 3), en caràcters (els espais compten): no es demana escriure cap terme
 * com «propietat commutativa» (21), «triangle rectangle» (18) o «simplificar una fracció» (23). Als nivells de triar (1 i 2) hi
 * surten tots els termes. Amb 14 s'escriuen 188 de les 208 paraules del banc, i «circumferència» és de les més llargues.
 */
export const LLARGADA_MAXIMA_ESCRITA = 14;

/** Si la paraula es pot demanar escrivint: la solució no passa de LLARGADA_MAXIMA_ESCRITA caràcters. */
export const esEscrivible = id => [...solucioBanc(id)].length <= LLARGADA_MAXIMA_ESCRITA;

/**
 * Una pregunta del nivell: { id, text (amb article: «la poma»; sense, a les expressions), solucio (sense article: «poma»), opcions? }.
 * Als nivells 1 i 2, `opcions` són 4 { id, text, correcta } barrejades. `excloure` és un Set d'ids que ja han sortit.
 * Al nivell 3 només surten paraules que es poden escriure (esEscrivible): si s'han acabat les que no s'han fet, es repeteixen;
 * i només si el banc no en té cap (un banc d'una sola paraula llarga), es pregunta una de llarga.
 */
export function generaPregunta(nivell, banc, excloure = new Set()) {
    let candidats = banc.ids;
    if (nivell === 3) {
        const curtes = banc.ids.filter(esEscrivible);
        if (curtes.length) candidats = curtes;
    }
    const lliures = candidats.filter(id => !excloure.has(id));
    const id = pick(lliures.length ? lliures : candidats);
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
        .normalize('NFC')
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

/** Sense el punt volat («paral·lelogram») ni el punt: costen de teclejar i no compten (com a «Vocabulari» d'operacions). */
const sensePunts = t => t.replace(/[·.•⋅]/g, '');

/** Si la paraula escrita és la bona (amb els accents; l'article del davant és opcional i el punt volat no compta). */
export function esCorrecta(p, escrit) {
    return sensePunts(senseArticle(escrit)) === sensePunts(normalitza(p.solucio));
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

/** Si el que s'ha escrit és, tal com és, una altra paraula del banc: «quadrant» per a un quadrat no és una errada de teclat. */
function esAltraParaula(p, escrit) {
    const net = [...sensePunts(senseArticle(escrit))].map(baseLletra).join('');
    return paraulesDelBanc().some(
        e => e.id !== p.id && [...sensePunts(normalitza(solucioBanc(e.id)))].map(baseLletra).join('') === net
    );
}

/**
 * L'alineació de la paraula escrita amb la bona, amb el mínim d'errades (una distància d'edició com la d'operacions, amb una
 * errada més: dues lletres seguides canviades de lloc). Torna { distancia, marques }:
 *   `distancia`  les errades: una lletra equivocada, de més o que falta, o dues lletres girades. Un accent equivocat
 *                no compta (només es marca).
 *   `marques`    [{ lletra, estat }] amb estat 'ok' (la mateixa), 'accent' (la mateixa lletra però amb un altre accent),
 *                'mal' (una altra), 'falta' (no l'ha escrita; `lletra` és «_»), 'sobra' (n'ha escrit de més) o 'creuada'
 *                (dues lletres seguides que van al revés: «trinagle»).
 * Entre dues alineacions igual de bones tria la que posa les lletres de més al final i les errades més amunt: «pomes» per
 * a «poma» és una lletra equivocada (e) i una de més (s).
 */
function alinea(escrit, bona) {
    const a = escrit.map(baseLletra);
    const b = bona.map(baseLletra);
    const m = a.length;
    const n = b.length;
    const d = Array.from({ length: m + 1 }, (_, i) =>
        Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    const girades = (i, j) => i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1] && a[i - 1] !== a[i - 2];
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++) {
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
            if (girades(i, j)) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
    const marques = [];
    let i = m;
    let j = n;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && a[i - 1] === b[j - 1] && d[i][j] === d[i - 1][j - 1]) {
            marques.push({ lletra: escrit[i - 1], estat: escrit[i - 1] === bona[j - 1] ? 'ok' : 'accent' });
            i--;
            j--;
        } else if (girades(i, j) && d[i][j] === d[i - 2][j - 2] + 1) {
            marques.push({ lletra: escrit[i - 1], estat: 'creuada' }, { lletra: escrit[i - 2], estat: 'creuada' });
            i -= 2;
            j -= 2;
        } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
            marques.push({ lletra: escrit[i - 1], estat: 'sobra' });
            i--;
        } else if (j > 0 && d[i][j] === d[i][j - 1] + 1) {
            marques.push({ lletra: '_', estat: 'falta' });
            j--;
        } else {
            marques.push({ lletra: escrit[i - 1], estat: 'mal' });
            i--;
            j--;
        }
    }
    return { distancia: d[m][n], marques: marques.reverse() };
}

/** Les lletres del que s'ha escrit i de la bona que es comparen: sense l'article del davant ni el punt volat. */
const lletresEscrites = escrit => [...sensePunts(senseArticle(escrit))];
const lletresBones = p => [...sensePunts(normalitza(p.solucio))];

/**
 * La paraula escrita comparada lletra a lletra amb la bona: [{ lletra, estat }] amb estat
 *   'ok' (la mateixa), 'accent' (la mateixa lletra però amb un altre accent), 'mal' (una altra),
 *   'falta' (no l'ha escrita; `lletra` és «_»), 'sobra' (n'ha escrit de més) o 'creuada' (dues lletres girades).
 * Una lletra que falta o que sobra al mig no desplaça les altres: «tomquet» només marca la «a» que falta.
 */
export function comparaLletres(p, escrit) {
    return alinea(lletresEscrites(escrit), lletresBones(p)).marques;
}

const base = paraula => [...paraula].map(baseLletra).join('');

/**
 * Les mateixes paraules d'un terme en un altre ordre («enter nombre» per «nombre enter»): les marques (cada lletra ✔ i un ⇄ a
 * cada espai) o, si no és el cas, null.
 */
function ordreCanviat(escrit, bona) {
    const e = escrit.split(' ');
    const s = bona.split(' ');
    if (s.length < 2 || e.length !== s.length) return null;
    const usades = new Set();
    const parelles = e.map(w => {
        const k = s.findIndex((x, i) => !usades.has(i) && base(x) === base(w));
        if (k >= 0) usades.add(k);
        return k;
    });
    if (parelles.includes(-1) || parelles.every((k, i) => k === i)) return null;
    return e.flatMap((w, i) => [
        ...(i ? [{ lletra: ' ', estat: 'creuada' }] : []),
        ...[...w].map((l, k) => ({ lletra: l, estat: l === [...s[parelles[i]]][k] ? 'ok' : 'accent' })),
    ]);
}

/**
 * Un terme de més d'una paraula al qual en falta alguna («nombre» per «nombre enter»): si les paraules escrites són, en ordre,
 * de les bones, les marques (cada paraula escrita ✔ i, de cada paraula que falta, una «_» per lletra); si no, null.
 */
function senseParaules(escrit, bona) {
    const e = escrit.split(' ');
    const s = bona.split(' ');
    if (s.length < 2 || e.length >= s.length) return null;
    const marques = [];
    let k = 0;
    let anterior = true;
    s.forEach((w, i) => {
        const trobada = k < e.length && base(e[k]) === base(w) ? e[k++] : null;
        if (i) marques.push(anterior && trobada ? { lletra: ' ', estat: 'ok' } : { lletra: '_', estat: 'falta' });
        marques.push(
            ...[...w].map((l, j) =>
                trobada
                    ? { lletra: trobada[j], estat: trobada[j] === l ? 'ok' : 'accent' }
                    : { lletra: '_', estat: 'falta' }
            )
        );
        anterior = trobada !== null;
    });
    return k === e.length ? marques : null;
}

/** Les errades que es toleren: una lletra en una paraula de 5 lletres o menys, i dues en una de més llarga (com a operacions). */
const erradesTolerades = lletres => (lletres <= 5 ? 1 : 2);

/**
 * Avalua la paraula escrita (nivell 3). Torna { veredicte, marques }:
 *   'correcta'  la bona: amb o sense l'article, en majúscula o minúscula, i sense el punt volat («paral·lelogram» o
 *               «parallelogram»); `marques` és la paraula bona, tota ✔
 *   'general'   una paraula més general que també és certa de la imatge («triangle»): no és un error (✔ 🔍); sense `marques`
 *   'propera'   una errada petita: un accent, una lletra equivocada, de més o que falta (dues en una paraula llarga), dues
 *               lletres girades, les paraules d'un terme en un altre ordre o una paraula que falta. No és un error ni costa
 *               cap intent: `marques` diu on és (✖, ´, ⇄) perquè es pugui corregir
 *   'mal'       un error de debò (també una altra paraula del banc, tot i ser molt semblant: «quadrant» per a un quadrat);
 *               `marques` compara lletra a lletra, com a 'propera'
 */
export function avaluaEscrita(p, escrit) {
    if (esCorrecta(p, escrit)) {
        return { veredicte: 'correcta', marques: [...normalitza(p.solucio)].map(lletra => ({ lletra, estat: 'ok' })) };
    }
    if (esMesGeneral(p, escrit)) return { veredicte: 'general', marques: [] };
    const bona = lletresBones(p).join('');
    const escrita = lletresEscrites(escrit).join('');
    const { distancia, marques } = alinea([...escrita], [...bona]);
    if (esAltraParaula(p, escrit)) return { veredicte: 'mal', marques };
    const ordre = ordreCanviat(escrita, bona);
    if (ordre) return { veredicte: 'propera', marques: ordre };
    const incompleta = senseParaules(escrita, bona);
    if (incompleta) return { veredicte: 'propera', marques: incompleta };
    const lletres = [...bona.replace(/ /g, '')].length;
    return { veredicte: distancia <= erradesTolerades(lletres) ? 'propera' : 'mal', marques };
}

/** Les lletres amb accent del català, per a la barra que ajuda a escriure-les. */
export const LLETRES_CATALANES = ['à', 'è', 'é', 'í', 'ï', 'ò', 'ó', 'ú', 'ü', 'ç'];

/** Els textos que l'activitat genera i que han de ser al lèxic: cap (les paraules són del lèxic mateix). */
export function exemplesDeText() {
    return [];
}
