/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/portada/portada.js
 * ROL: La portada de l'alumnat (index.html): una fitxa amb imatge i nom per
 *      cada activitat i per a l'àlbum de paraules. Sense menús ni frases: l'alumne
 *      toca la imatge que vol. (El generador d'enllaços és al panell del
 *      professorat: professorat.html.)
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa activitats.js
 *      (el catàleg) i vista.js (l'HTML).
 * ============================================================================
 */
import { fitxesAlumne } from './activitats.js';
import { htmlFitxes } from './vista.js';

document.getElementById('fitxes').innerHTML = htmlFitxes(fitxesAlumne());
