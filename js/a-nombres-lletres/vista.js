/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-nombres-lletres/vista.js
 * ROL: L'HTML de la pantalla de «Escriure nombres»: el nombre en xifres, en
 *      gran. Les opcions són botons de text que munta el controlador. No toca el
 *      DOM: només construeix text (es prova des de Node).
 * DEPENDÈNCIES: cap.
 * ============================================================================
 */

/** El nombre en xifres, en gran: «52». */
export function htmlNombre(n) {
    return `<span class="nombre-gran">${n}</span>`;
}
