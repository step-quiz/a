/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/lexicon/targeta.js
 * ROL: La part SENSE DOM de «Aprèn la paraula» (PR 7):
 *      · contingutTargeta(id): què mostra la targeta d'una paraula (la imatge
 *        gran, la paraula amb article i, als noms, el plural).
 *      · crearVistes(emmagatzematge): quines paraules l'alumne ja ha obert, per
 *        al distintiu de «paraula nova». Es recorda al navegador (localStorage);
 *        si no hi ha emmagatzematge (mode privat, dades bloquejades), només dura
 *        mentre la pàgina és oberta, però no falla mai.
 *      La targeta mateixa (el <dialog>, el toc, el teclat, el focus) és a
 *      js/targeta-paraula.js. Aquí només hi ha dades i text: es prova des de Node.
 * DEPENDÈNCIES: lexicon.js, paraula.js.
 * ============================================================================
 */
import { ambArticle, entrada } from './lexicon.js';
import { htmlImatge } from './paraula.js';

/** La clau on es recorden les paraules vistes (una llista d'ids en JSON). */
export const CLAU_VISTES = 'a2-paraules-vistes';

/**
 * El que mostra la targeta d'una paraula:
 *   · `nom`: la paraula amb l'article («el pis»); a un verb, un adjectiu o una altra paraula, la primera forma («pujar»).
 *   · `plural`: «els pisos» (només als noms; buit a la resta).
 *   · `imatge`: l'HTML de la imatge (pictograma o emoji; buit si no en té).
 */
export function contingutTargeta(id) {
    const e = entrada(id);
    const nom = e.tipus === 'nom';
    return {
        id,
        nom: nom ? ambArticle(id) : e.formes[0],
        plural: nom ? ambArticle(id, { plural: true }) : '',
        imatge: htmlImatge(e),
    };
}

/**
 * Les paraules que l'alumne ja ha vist (obert la targeta). `emmagatzematge` és qualsevol objecte amb
 * getItem/setItem (localStorage) o res (null). Torna:
 *   · esNova(id): si encara no s'ha vist;
 *   · marca(id): la dona per vista i la recorda;
 *   · llista(): els ids vistos.
 */
export function crearVistes(emmagatzematge) {
    const vistes = new Set();
    /** Suma al conjunt el que hi ha desat (si es pot llegir i té sentit). */
    const llegeix = () => {
        try {
            const text = emmagatzematge ? emmagatzematge.getItem(CLAU_VISTES) : null;
            const llista = text ? JSON.parse(text) : [];
            if (Array.isArray(llista)) for (const id of llista) if (typeof id === 'string') vistes.add(id);
        } catch {
            // emmagatzematge bloquejat o text trencat: com si no hi hagués res
        }
    };
    llegeix();
    return {
        esNova: id => !vistes.has(id),
        marca(id) {
            llegeix(); // una altra pestanya pot haver afegit paraules: no les esborrem
            vistes.add(id);
            try {
                if (emmagatzematge) emmagatzematge.setItem(CLAU_VISTES, JSON.stringify([...vistes]));
            } catch {
                // sense emmagatzematge, la paraula queda vista només mentre la pàgina és oberta
            }
        },
        llista: () => [...vistes],
    };
}
