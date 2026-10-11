/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-decimals/generador.js
 * ROL: Lògica PURA de l'activitat «Diners i canvi» (a-decimals): paràmetres de
 *      la URL, els imports (com s'escriuen i com es llegeixen), la comparació
 *      de la resposta i la generació de les compres dels tres nivells.
 *      No toca el DOM: es pot provar des de Node (tests/a-decimals.test.js).
 *      Tots els diners són ENTERS, en cèntims (3,60 € = 360): així no hi ha
 *      errors de coma flotant en sumar, restar ni comparar.
 * DEPENDÈNCIES: utils.js (getIntParam, pick, randInt), productes.js i el lèxic (només per a exemplesDeText).
 * ============================================================================
 */
import { textParaula } from '../lexicon/paraula.js';
import { getIntParam, pick, randInt } from '../utils.js';
import { PRODUCTES } from './productes.js';

/** El nivell més alt (el 3: dos productes i dos passos). */
export const NIVELL_MAXIM = 3;

const BITLLET_CINC = 500;
const BITLLET_DEU = 1000;
/** Les monedes «grans» que fan el preu del nivell 1: un enter més 0,10, 0,20 o 0,50. */
const MONEDES_GRANS = [10, 20, 50];

/**
 * Llegeix els paràmetres propis de l'activitat:
 *   ?nivell=1|2|3   1 = un producte, preu enter + moneda gran, es paga amb 5 € (per defecte)
 *                   2 = un producte, preu en passos de 0,10 €, es paga amb 5 € o, un de cada tres cops, amb 10 €
 *                   3 = dos productes, primer el total i després el canvi, es paga amb 10 €
 */
export function llegeixParametres(params) {
    return { nivell: getIntParam(params, 'nivell', 1, 1, NIVELL_MAXIM) };
}

// ── Imports ──────────────────────────────────────────────────────────────────

/** Euros (3.6) → cèntims enters (360). */
export const aCentims = euros => Math.round(euros * 100);

/** Un import com s'escriu a Catalunya: «5 €» (si és exacte) o «3,60 €» (amb coma i dos decimals). */
export function formatImport(centims) {
    const euros = Math.floor(centims / 100);
    const cents = centims % 100;
    return cents === 0 ? `${euros} €` : `${euros},${String(cents).padStart(2, '0')} €`;
}

/**
 * Llegeix el que ha escrit l'alumne. S'accepta la coma (la convenció catalana) i també el punt, amb un «€» davant o
 * darrere o sense, i amb qualsevol nombre de decimals; no s'accepten espais enmig («3 60»). Torna null si no és un
 * import; si ho és:
 *   · `valor`: els euros (3.6);
 *   · `ambPunt`: ha escrit un punt en lloc d'una coma (no es penalitza: s'ensenya la coma sense dir res);
 *   · `decimalsExtra`: més de dos decimals («3,600»).
 */
export function llegeixImport(text) {
    const t = String(text)
        .trim()
        .replace(/^€\s*|\s*€$/g, '');
    if (!/^\d+(?:[.,]\d+)?$/.test(t)) return null;
    const decimals = t.split(/[.,]/)[1] || '';
    return { valor: parseFloat(t.replace(',', '.')), ambPunt: t.includes('.'), decimalsExtra: decimals.length > 2 };
}

/** Si el que ha escrit l'alumne (en euros) és exactament l'import correcte (en cèntims). */
export function esCorrecte(correcteCentims, valor) {
    return Math.abs(valor * 100 - correcteCentims) < 1e-6;
}

/**
 * Quines parts de la resposta són bones: els euros (3 de 3,60) i els cèntims (,60). Serveix per marcar-los de
 * colors sense escriure cap frase: «3» en verd i «,06» en vermell.
 */
export function comparaParts(correcteCentims, valor) {
    const r = Math.round(valor * 100);
    const exacte = Math.abs(valor * 100 - r) < 1e-6;
    return {
        euros: Math.floor(r / 100) === Math.floor(correcteCentims / 100),
        centims: exacte && r % 100 === correcteCentims % 100,
    };
}

// ── Les compres ──────────────────────────────────────────────────────────────

/**
 * Els preus (cèntims) que un producte pot tenir al nivell 1: un enter de l'1 al 4 més una moneda gran (0,10, 0,20 o
 * 0,50), dins del rang del producte. Els productes barats (la poma, el plàtan) no en tenen cap: només surten als altres nivells.
 */
export function preusNivell1(producte) {
    const [min, max] = producte.preu.map(aCentims);
    const preus = [];
    for (let euros = 1; euros <= 4; euros++)
        for (const moneda of MONEDES_GRANS) {
            const preu = euros * 100 + moneda;
            if (preu >= min && preu <= max) preus.push(preu);
        }
    return preus;
}

/** Un producte del catàleg amb el preu que ara té a la compra. */
const ambPreu = (producte, preu) => ({ id: producte.id, plural: !!producte.plural, preu });

/**
 * Crea el generador de compres d'un nivell. Cada compra és
 *   { productes: [{ id, plural, preu }], bitllet, total, canvi, passos }
 * (tot en cèntims; `passos` és ['canvi'] o, al nivell 3, ['total', 'canvi']).
 *
 * Perquè no es repeteixi el mateix canvi, el generador se'n recorda: al nivell 1 evita repetir els últims 3 canvis; als
 * altres, els últims 10. Cada sessió ha de començar amb reinicia().
 */
export function crearGenerador(nivell) {
    const maxDiferents = nivell === 1 ? 3 : 10;
    let usats = new Set();

    /** Torna la primera compra que no repeteix canvi (fins a `maxIntents` intents; l'última, sigui com sigui). */
    function senseRepetir(fesCompra, maxIntents = 15) {
        let compra;
        for (let i = 0; i < maxIntents; i++) {
            compra = fesCompra();
            if (!usats.has(compra.canvi)) break;
        }
        return compra;
    }

    function nivell1() {
        const candidats = PRODUCTES.map(p => ({ p, preus: preusNivell1(p) })).filter(c => c.preus.length > 0);
        // Productes amb algun preu que doni un canvi que no s'hagi vist; si no n'hi ha, qualsevol
        let disponibles = candidats
            .map(c => ({ p: c.p, preus: c.preus.filter(preu => !usats.has(BITLLET_CINC - preu)) }))
            .filter(c => c.preus.length > 0);
        if (disponibles.length === 0) disponibles = candidats;
        const triat = pick(disponibles);
        const preu = pick(triat.preus);
        return { productes: [ambPreu(triat.p, preu)], bitllet: BITLLET_CINC, total: preu, canvi: BITLLET_CINC - preu };
    }

    function nivell2() {
        const p = pick(PRODUCTES);
        // Un preu múltiple de 0,10 € dins del rang del producte, com a màxim 4,90 €
        const min = Math.ceil(aCentims(p.preu[0]) / 10);
        const max = Math.min(Math.floor(aCentims(p.preu[1]) / 10), 49);
        const preu = randInt(min, max) * 10;
        // Un de cada tres cops es paga amb 10 € (el canvi va de 5,50 € a 9,80 €); amb 5 € només si el preu no passa de 4,50 €
        const bitllet = preu > 450 || Math.random() < 1 / 3 ? BITLLET_DEU : BITLLET_CINC;
        return { productes: [ambPreu(p, preu)], bitllet, total: preu, canvi: bitllet - preu };
    }

    function nivell3() {
        const a = pick(PRODUCTES);
        let b = pick(PRODUCTES);
        while (b.id === a.id) b = pick(PRODUCTES);
        // Dos preus múltiples de 0,10 € de l'1,10 € als 4,00 €: el total sempre és inferior a 10 €
        const preuA = randInt(11, 40) * 10;
        const preuB = randInt(11, 40) * 10;
        const total = preuA + preuB;
        return {
            productes: [ambPreu(a, preuA), ambPreu(b, preuB)],
            bitllet: BITLLET_DEU,
            total,
            canvi: BITLLET_DEU - total,
        };
    }

    return {
        /** Comença una sessió nova: s'oblida dels canvis ja vists. */
        reinicia() {
            usats = new Set();
        },
        /** La compra següent. */
        genera() {
            if (usats.size >= maxDiferents) usats = new Set();
            const compra = nivell === 1 ? nivell1() : senseRepetir(nivell === 2 ? nivell2 : nivell3);
            usats.add(compra.canvi);
            return { ...compra, passos: nivell === 3 ? ['total', 'canvi'] : ['canvi'] };
        },
    };
}

/**
 * Els textos que l'activitat posa a la pantalla a partir del lèxic —el nom de cada producte (en plural si es compra en
 * plural), les etiquetes «total» i «canvi» i «el bitllet»—, perquè el control de vocabulari (tests/check-lexicon.js) els comprovi.
 */
export function exemplesDeText() {
    return [
        ...PRODUCTES.map(p => textParaula(p.id, { plural: !!p.plural })),
        textParaula('total', { article: false }),
        textParaula('canvi', { article: false }),
        textParaula('bitllet'),
    ];
}

/** La resposta correcta (cèntims) d'un pas d'una compra: 'total' o 'canvi'. */
export function respostaDelPas(compra, pas) {
    return pas === 'total' ? compra.total : compra.canvi;
}
