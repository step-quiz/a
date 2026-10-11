/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/targetes/generador.js
 * ROL: La lògica pura de les «Targetes de vocabulari» per imprimir (sense DOM):
 *      els paràmetres de la URL, quines paraules hi ha (les del banc del lèxic,
 *      per temes), com es reparteixen en fulls (també a doble cara: la imatge
 *      al davant i la paraula al darrere, amb les files emmirallades perquè
 *      coincideixin en girar el full per la vora llarga) i el resum. Es prova
 *      des de Node (tests/activitats.test.js).
 *      És una eina del professorat, no una activitat de l'alumnat: no passa pel
 *      control del lèxic (tests/check-lexicon.js).
 * DEPENDÈNCIES: el lèxic (js/lexicon/) i la lògica de l'àlbum (les icones dels temes).
 * ============================================================================
 */
import { TEMES } from '../lexicon/lexicon.js';
import { agrupaPerTemes } from '../album/logica.js';

/**
 * Les targetes que caben en un full A4 vertical i la quadrícula que fan: { targetes: [columnes, files] }.
 * No n'hi ha més de 9: amb 16 per full, una paraula llarga no cabria amb la lletra de 14 pt (el mínim del paper).
 */
export const QUADRICULES = { 1: [1, 1], 4: [2, 2], 9: [3, 3] };

/** Els nombres de targetes per full que es poden triar. */
export const MIDES = Object.keys(QUADRICULES).map(Number);

/** Per defecte: 9 per full (de 63 × 92 mm: per jugar o per penjar-les en una paret). */
export const MIDA_PER_DEFECTE = 9;

/**
 * Què porta cada targeta: la imatge i la paraula; només la imatge; només la paraula (per fer jocs d'aparellar); o
 * «doblecara»: la imatge al davant i la paraula al darrere, per imprimir a dues cares, retallar i plastificar.
 */
export const CONTINGUTS = ['tot', 'imatge', 'paraula', 'doblecara'];

/** Com surt al paper: en blanc i negre (només grisos, com s'imprimeix al centre) o en color. */
export const COLORS = ['bn', 'color'];

/** Els temes que tenen paraules al banc, en l'ordre del lèxic: [{ tema, icona, nom, n }]. */
export const temesDelBanc = () =>
    agrupaPerTemes().map(g => ({ tema: g.tema, icona: g.icona, nom: TEMES[g.tema], n: g.paraules.length }));

/**
 * Llegeix els paràmetres de la URL:
 *   ?temes=mat-figures,mat-algebra        només aquests temes (en blanc, cap); un tema que no existeix s'ignora; per defecte, tots
 *   ?mida=1|4|9                           targetes per full (per defecte, 9)
 *   ?contingut=tot|imatge|paraula|doblecara   què porta cada targeta (per defecte, tot)
 *   ?color=bn|color                       en blanc i negre o en color (per defecte, bn)
 * Torna { temes (en l'ordre del lèxic), mida, contingut, color }.
 */
export function llegeixParametres(params) {
    const tots = temesDelBanc().map(t => t.tema);
    const llista = params.get('temes');
    const triats = llista === null ? null : llista.split(',');
    const mida = Number(params.get('mida'));
    const contingut = params.get('contingut');
    const color = params.get('color');
    return {
        temes: triats === null ? tots : tots.filter(t => triats.includes(t)),
        mida: MIDES.includes(mida) ? mida : MIDA_PER_DEFECTE,
        contingut: CONTINGUTS.includes(contingut) ? contingut : 'tot',
        color: COLORS.includes(color) ? color : 'bn',
    };
}

/** El revers de llegeixParametres: el text de la URL («temes=…&mida=4»), sense el que és per defecte. */
export function queryDe({ temes, mida, contingut, color }) {
    const parts = [];
    if (temes.length !== temesDelBanc().length) parts.push(`temes=${temes.join(',')}`);
    if (mida !== MIDA_PER_DEFECTE) parts.push(`mida=${mida}`);
    if (contingut !== 'tot') parts.push(`contingut=${contingut}`);
    if (color !== 'bn') parts.push(`color=${color}`);
    return parts.join('&');
}

/** Les targetes dels temes triats, en l'ordre del lèxic: [{ id, tema, text }] (el text, amb article: «la poma»). */
export function targetesDe(temes) {
    const triats = new Set(temes);
    return agrupaPerTemes()
        .filter(g => triats.has(g.tema))
        .flatMap(g => g.paraules.map(p => ({ id: p.id, tema: g.tema, text: p.text })));
}

/** Les targetes repartides en grups de `mida` targetes (l'últim pot ser més curt). */
export function grups(targetes, mida) {
    const r = [];
    for (let i = 0; i < targetes.length; i += mida) r.push(targetes.slice(i, i + mida));
    return r;
}

/** Un grup de targetes omplert amb `null` fins a `mida` caselles, i amb cada fila girada d'esquerra a dreta (com es veu per darrere). */
export function emmirallat(grup, mida) {
    const [columnes] = QUADRICULES[mida];
    const caselles = Array.from({ length: mida }, (_, i) => grup[i] ?? null);
    const files = [];
    for (let i = 0; i < mida; i += columnes) files.push(caselles.slice(i, i + columnes).reverse());
    return files.flat();
}

/**
 * Les pàgines que s'imprimeixen: [{ caselles, contingut, cara }]. `caselles` són les `mida` caselles de la pàgina (una
 * targeta o `null`, una casella buida); `contingut` és el de les targetes d'aquesta pàgina; `cara` és 0 (una pàgina
 * d'una cara), 1 (el davant d'un full a doble cara) o 2 (el darrere). A doble cara, cada grup fa dues pàgines seguides:
 * el davant amb les imatges i el darrere amb les paraules, amb les files emmirallades: en imprimir a dues cares girant
 * pel costat llarg, la paraula de cada targeta queda just darrere de la seva imatge.
 */
export function pagines(targetes, mida, contingut) {
    const davant = g => Array.from({ length: mida }, (_, i) => g[i] ?? null);
    const r = grups(targetes, mida);
    if (contingut !== 'doblecara') return r.map(g => ({ caselles: davant(g), contingut, cara: 0 }));
    return r.flatMap(g => [
        { caselles: davant(g), contingut: 'imatge', cara: 1 },
        { caselles: emmirallat(g, mida), contingut: 'paraula', cara: 2 },
    ]);
}

/** Quantes targetes i quantes pàgines (a doble cara, dues per grup): { targetes, pagines }. */
export const resum = (n, mida, contingut = 'tot') => ({
    targetes: n,
    pagines: Math.ceil(n / mida) * (contingut === 'doblecara' ? 2 : 1),
});
