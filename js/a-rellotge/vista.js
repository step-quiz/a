/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-rellotge/vista.js
 * ROL: L'HTML de la pantalla de «Rellotge» que no és el dibuix del rellotge:
 *      l'ajuda de cada nivell, només amb xifres i les quatre expressions del
 *      lèxic («en punt», «i quart», «i mitja», «menys quart»).
 *      No toca el DOM: només construeix text (es prova des de Node).
 * DEPENDÈNCIES: textos.js d'aquesta carpeta.
 * ============================================================================
 */
import { TEXTOS } from './textos.js';

const parella = (a, b, classe = '') => `<span class="aj-par${classe}"><b>${a}</b> → ${b}</span>`;

/**
 * L'ajuda d'un nivell.
 *   Nivell 1: on apunta l'agulla llarga i com es diu: «12 → :00 en punt», «3 → :15 i quart»…
 *   Nivells 2 i 3: cada número del rellotge són 5 minuts («1 → 5, 2 → 10…»); al 3, a més, cada ratlleta és un minut («+ 1»).
 */
export function htmlAjuda(nivell) {
    if (nivell === 1) {
        const fila = (n, minuts, text) =>
            `<div class="aj-fila">${parella(n, `:${minuts}`)} <span class="aj-text">${text}</span></div>`;
        return (
            fila(12, '00', TEXTOS.enPunt) +
            fila(3, '15', TEXTOS.iQuart) +
            fila(6, '30', TEXTOS.iMitja) +
            fila(9, '45', TEXTOS.menysQuart)
        );
    }
    const taula = Array.from({ length: 11 }, (_, i) => parella(i + 1, (i + 1) * 5)).join(' ');
    return (
        `<div class="aj-taula">${taula}</div>` +
        (nivell === 3 ? '<div class="aj-fila"><span class="aj-par">+ 1 · + 1 · + 1 …</span></div>' : '')
    );
}
