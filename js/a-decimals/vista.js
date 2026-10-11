/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-decimals/vista.js
 * ROL: L'HTML i els textos plans de la pantalla de «Diners i canvi» a partir
 *      d'una compra (vegeu crearGenerador a generador.js): la botiga, l'etiqueta
 *      del pas, els passos fets, l'ajuda amb símbols, les parts de la resposta
 *      i la pregunta de la revisió. L'alumne llegeix poques paraules: cada
 *      producte, «el bitllet», «total» i «canvi» surten com a paraules del
 *      lèxic amb la seva imatge (js/lexicon/paraula.js), i la resta són
 *      xifres i símbols.
 *      No toca el DOM: només construeix text. Es prova des de Node
 *      (tests/a-decimals.test.js); el controlador és a-decimals.js.
 * DEPENDÈNCIES: el lèxic (js/lexicon/), textos.js, generador.js i textos.js d'aquesta carpeta.
 * ============================================================================
 */
import { entrada } from '../lexicon/lexicon.js';
import { htmlImatge, paraula, textParaula } from '../lexicon/paraula.js';
import { format } from '../textos.js';
import { comparaParts, formatImport, llegeixImport } from './generador.js';
import { TEXTOS } from './textos.js';

// ── Peces ────────────────────────────────────────────────────────────────────

/** La paraula del pas: «total» o «canvi» (sense article), amb la seva imatge. */
export function htmlEtiquetaPas(pas) {
    return paraula(pas === 'total' ? 'total' : 'canvi', { article: false });
}

/** La imatge d'una paraula com a símbol decoratiu (l'emoji o el pictograma). */
const simbol = id => `<span class="ajuda-img" aria-hidden="true">${htmlImatge(entrada(id))}</span>`;

/** La imatge d'una paraula en text pla (l'emoji); si no en té, la mateixa paraula. */
const imatgePlana = id => entrada(id).imatge?.emoji ?? textParaula(id, { article: false });

/**
 * Què es resta del bitllet en una compra: el producte (si és un de sol) o el total (si són dos, perquè ja no hi ha
 * un sol preu a la vista).
 */
const idDelGastat = compra => (compra.productes.length === 1 ? compra.productes[0].id : 'total');

// ── La botiga ────────────────────────────────────────────────────────────────

/**
 * La botiga: els productes (cada un amb la seva paraula i el seu preu, separats per «+») i el bitllet amb què es paga.
 * `mostraBitllet: false` amaga el bitllet: al nivell 3 no surt mentre es demana el total.
 */
export function htmlBotiga(compra, mostraBitllet = true) {
    const productes = compra.productes
        .map(
            p =>
                `<div class="product-card">${paraula(p.id, { plural: p.plural })}` +
                `<span class="product-price">${formatImport(p.preu)}</span></div>`
        )
        .join('<span class="products-plus">+</span>');
    const bitllet = mostraBitllet
        ? `<div class="bill-display">${paraula('bitllet')}<span class="bill-amount">${formatImport(compra.bitllet)}</span></div>`
        : '';
    return `<div class="products-row">${productes}</div>${bitllet}`;
}

/** Un pas ja fet: «✅ total 5,30 €». */
export function htmlPasFet(pas, centims) {
    return `<div class="step-done"><span aria-hidden="true">✅</span> ${htmlEtiquetaPas(pas)} <span class="step-done-val">${formatImport(centims)}</span></div>`;
}

// ── L'ajuda ──────────────────────────────────────────────────────────────────

const terme = (id, centims) => `<span class="ajuda-terme">${simbol(id)} ${formatImport(centims)}</span>`;
const operador = signe => `<span class="ajuda-op">${signe}</span>`;
const IGUAL_INTERROGANT = `${operador('=')} <span class="ajuda-interrogant">?</span>`;

/**
 * L'ajuda, només amb símbols: el que s'ha de calcular en aquest pas.
 *   total: «🍎 1,20 € + 🥛 0,90 € = ?»     canvi: «💶 5 € − 🥛 3,40 € = ?»
 */
export function htmlAjuda(compra, pas) {
    if (pas === 'total') {
        return `${compra.productes.map(p => terme(p.id, p.preu)).join(` ${operador('+')} `)} ${IGUAL_INTERROGANT}`;
    }
    return `${terme('bitllet', compra.bitllet)} ${operador('−')} ${terme(idDelGastat(compra), compra.total)} ${IGUAL_INTERROGANT}`;
}

/** La pregunta d'un pas, en text pla, per a la revisió final (la mateixa operació que l'ajuda, sense «= ?»). */
export function textPregunta(compra, pas) {
    if (pas === 'total') return compra.productes.map(p => `${imatgePlana(p.id)} ${formatImport(p.preu)}`).join(' + ');
    return `${imatgePlana('bitllet')} ${formatImport(compra.bitllet)} − ${imatgePlana(idDelGastat(compra))} ${formatImport(compra.total)}`;
}

// ── Les parts de la resposta ─────────────────────────────────────────────────

/**
 * Després d'una resposta equivocada: la resposta partida en els euros i els cèntims, cada part amb ✔ si és bona i ✖ si no.
 * Es veu sense llegir res: «3 ✔  ,06 ✖». Els cèntims s'escriuen sempre amb la coma i com a mínim amb dos xifres (3,6 → ,60;
 * 3 → ,00); si l'alumne n'ha escrit més de dos, es veuen tots (3,605 → ,605). Torna '' si el text no és un import.
 */
export function htmlParts(correcteCentims, text) {
    const llegit = llegeixImport(text);
    if (!llegit) return '';
    const bones = comparaParts(correcteCentims, llegit.valor);
    const net = String(text)
        .trim()
        .replace(/^€\s*|\s*€$/g, '');
    const [enters, decimals = ''] = net.split(/[.,]/);
    const euros = String(parseInt(enters, 10));
    const centims = `,${decimals.padEnd(2, '0')}`;
    const part = (valor, bona) =>
        `<span class="part ${bona ? 'bo' : 'mal'}" role="img" aria-label="${format(bona ? TEXTOS.partCorrecta : TEXTOS.partIncorrecta, { part: valor })}">${valor} ${bona ? '✔' : '✖'}</span>`;
    return part(euros, bones.euros) + part(centims, bones.centims);
}
