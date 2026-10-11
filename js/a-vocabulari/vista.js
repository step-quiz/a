/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-vocabulari/vista.js
 * ROL: L'HTML de la pantalla de «Vocabulari»: la imatge d'una paraula, la
 *      paraula escrita lletra a lletra amb les seves marques (✔, accent, ✖) i
 *      la barra de lletres amb accent. No toca el DOM: només construeix text
 *      (es prova des de Node); el controlador és a-vocabulari.js.
 * DEPENDÈNCIES: generador.js i el lèxic (js/lexicon/).
 * ============================================================================
 */
import { entrada } from '../lexicon/lexicon.js';
import { htmlImatge } from '../lexicon/paraula.js';
import { LLETRES_CATALANES } from './generador.js';

/** La imatge d'una paraula (decorativa: el nom no s'ha de dir al lector de pantalla del nivell que el pregunta). */
export const htmlImatgeParaula = id => `<span class="img-paraula" aria-hidden="true">${htmlImatge(entrada(id))}</span>`;

const escapa = t =>
    String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const MARCA = { ok: '✔', accent: '´', mal: '✖', falta: '✖', sobra: '✖' };
const CLASSE = { ok: 'bo', accent: 'accent', mal: 'mal', falta: 'mal', sobra: 'mal' };

/** La paraula escrita lletra a lletra: cada lletra amb la seva marca (✔ bona, ´ accent equivocat, ✖ equivocada o que falta). */
export function htmlLletres(marques) {
    return marques
        .map(
            m =>
                `<span class="lletra ${CLASSE[m.estat]}">${escapa(m.lletra)}<i aria-hidden="true">${MARCA[m.estat]}</i></span>`
        )
        .join('');
}

/** Una paraula certa però no la que es busca (més general): ✔ 🔍, que vol dir «n'hi ha una de més concreta». */
export const htmlMesConcret = text => `<span class="lletra bo">${escapa(text)}<i aria-hidden="true">✔ 🔍</i></span>`;

/** La barra de lletres amb accent: un botó per lletra. */
export const htmlAccents = () =>
    LLETRES_CATALANES.map(l => `<button type="button" class="btn-accent" data-lletra="${l}">${l}</button>`).join('');
