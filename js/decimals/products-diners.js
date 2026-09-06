/**
 * products-diners.js
 * Catàleg de productes per a diners.html i a-diners.html.
 *
 * Cada entrada:
 *   emoji  — icona visual
 *   nom    — nom del producte (ca)
 *   preu   — [mínim, màxim] en euros (rang versemblant de supermercat/quiosc)
 *
 * Els preus corresponen a unitats individuals raonables a Espanya (2025):
 * poma = 1 unitat, llet = 1 L, ous = 6 unitats, formatge = aprox. 200 g, etc.
 *
 * Aquest fitxer és compartit entre diners.html i a-diners.html.
 * S'inclou com a <script> per compatibilitat amb el protocol file://.
 */

/* global */ var PRODUCTS_DINERS = [
    { emoji: '🍞', nom: 'Pa',           preu: [0.80, 2.50] },
    { emoji: '🥛', nom: 'Llet',         preu: [0.85, 1.50] },
    { emoji: '🍎', nom: 'Poma',         preu: [0.25, 0.80] },
    { emoji: '✏️', nom: 'Llapis',       preu: [0.30, 1.20] },
    { emoji: '📓', nom: 'Llibreta',     preu: [1.00, 3.50] },
    { emoji: '🍫', nom: 'Xocolata',     preu: [0.90, 2.50] },
    { emoji: '💧', nom: 'Aigua',        preu: [0.40, 1.20] },
    { emoji: '🧃', nom: 'Suc',          preu: [1.20, 2.50] },
    { emoji: '🥐', nom: 'Croissant',    preu: [0.80, 1.80] },
    { emoji: '🍌', nom: 'Plàtan',       preu: [0.20, 0.70] },
    { emoji: '🍪', nom: 'Galetes',      preu: [1.00, 2.50] },
    { emoji: '🥪', nom: 'Entrepà',      preu: [1.50, 3.50] },
    { emoji: '🍕', nom: 'Pizza',        preu: [2.00, 4.50] },
    { emoji: '🥤', nom: 'Refresc',      preu: [0.80, 2.00] },
    { emoji: '🖊️', nom: 'Boli',         preu: [0.50, 1.80] },
    { emoji: '🧁', nom: 'Magdalena',    preu: [0.60, 1.50] },
    { emoji: '🥜', nom: 'Fruits secs',  preu: [1.50, 3.50] },
    { emoji: '🍇', nom: 'Raïm',         preu: [0.80, 2.50] },
    { emoji: '🧀', nom: 'Formatge',     preu: [1.50, 4.50] },
    { emoji: '🥚', nom: 'Ous',          preu: [1.80, 3.50] }
];
