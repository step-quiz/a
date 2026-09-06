/**
 * diners-feedback.js
 * ─────────────────────────────────────────────────────────────
 * ROL: Detecció d'errors pedagògics i missatges de feedback per
 *      al pas de "canvi" (i de "total" al nivell 3).
 *
 * Compartit entre diners.html i a-diners.html.
 * S'inclou com a <script> (compatible amb protocol file://).
 *
 * API pública (window.DinersFeedback):
 *   detectChangeError(correct, userVal, price)
 *     → string: codi d'error (vegeu ERRORS més avall)
 *   getChangeMsg(errorCode, correct, userVal, price)
 *     → string: missatge curt per a l'alumne
 *
 * CODIS D'ERROR (pas de canvi):
 *   SWAP_DIGITS       — 3,06 en lloc de 3,60 (inversió de dígits als cèntims)
 *   SMALL_SWAP        — 0,20 en lloc de 0,02 (×10 en un sol dígit)
 *   EURO_FOR_CENTS    — "2" en lloc de "0,02" (confon euros amb cèntims)
 *   SUBTRACTION_ERROR — 3,40 en lloc de 3,60 (copia el ,xx del preu en comptes de restar-lo)
 *   WRONG_INT         — bon decimal, mal enter  (x,60 amb x≠3)
 *   WRONG_CENTS       — bon enter, mals decimals (3,xx amb xx≠60)
 *   GENERIC           — cap patró reconegut
 * ─────────────────────────────────────────────────────────────
 */

window.DinersFeedback = (() => {
    'use strict';

    // ─────────────────────────────────────────────────────────
    // DETECCIÓ
    // ─────────────────────────────────────────────────────────

    /**
     * Detecta quin tipus d'error ha comès l'alumne en el pas de canvi.
     *
     * @param {number} correct  - resposta correcta (ex: 3.60)
     * @param {number} userVal  - resposta de l'alumne (ex: 3.06)
     * @param {number} price    - preu total pagat (ex: 1.40)
     *                            Necessari per detectar SUBTRACTION_ERROR.
     * @returns {string} codi d'error
     */
    function detectChangeError(correct, userVal, price) {
        const c100  = Math.round(correct  * 100);
        const u100  = Math.round(userVal  * 100);
        const cInt  = Math.floor(c100 / 100);
        const cCent = c100 % 100;
        const uInt  = Math.floor(u100 / 100);
        const uCent = u100 % 100;

        // ── SWAP_DIGITS ──────────────────────────────────────
        // L'alumne ha invertit les dues xifres dels cèntims.
        // Ex: correcte=3,60 → l'alumne escriu 3,06
        // Condició: cèntims correctes ≥ 10, enter igual, cèntims usuari = inversió.
        const cTens = Math.floor(cCent / 10);
        const cUnit = cCent % 10;
        if (cCent >= 10 && uInt === cInt && uCent === cUnit * 10 + cTens) {
            return 'SWAP_DIGITS';
        }

        // ── SMALL_SWAP ───────────────────────────────────────
        // El correcte té un sol dígit als cèntims (< 10) i l'alumne l'ha
        // multiplicat per 10. Ex: correcte=0,02 → l'alumne escriu 0,20.
        if (cCent > 0 && cCent < 10 && uInt === cInt && uCent === cCent * 10) {
            return 'SMALL_SWAP';
        }

        // ── EURO_FOR_CENTS ───────────────────────────────────
        // El canvi correcte és < 1 € (enter=0) però l'alumne ha escrit
        // els cèntims com si fossin euros. Ex: correcte=0,02 → escriu "2".
        if (cInt === 0 && cCent > 0 && uInt === cCent && uCent === 0) {
            return 'EURO_FOR_CENTS';
        }

        // ── Casos amb enter correcte ─────────────────────────
        if (uInt === cInt && uCent !== cCent) {

            // ── SUBTRACTION_ERROR ────────────────────────────
            // L'alumne ha posat la part decimal del PREU en lloc de restar-la.
            // Ex: preu=1,40 → canvi correcte=3,60 → l'alumne escriu 3,40.
            // Atenció: no aplica quan el preu acaba en ,50 ni en ,00,
            // perquè "5 − 1,50 → 3,50" és aritmèticament correcte i no és
            // un error de còpia, és un error diferent no reconegut com a tal.
            const pCent = Math.round(price * 100) % 100;
            if (pCent !== 50 && pCent !== 0 && uCent === pCent) {
                return 'SUBTRACTION_ERROR';
            }

            // ── WRONG_CENTS ──────────────────────────────────
            return 'WRONG_CENTS';
        }

        // ── WRONG_INT ────────────────────────────────────────
        // L'alumne ha encertat els cèntims però s'ha equivocat amb l'enter.
        if (uCent === cCent && uInt !== cInt) {
            return 'WRONG_INT';
        }

        // ── GENERIC ──────────────────────────────────────────
        return 'GENERIC';
    }

    // ─────────────────────────────────────────────────────────
    // MISSATGES
    // Normes de redacció:
    //   · Frases curtes (màx. ~12 paraules).
    //   · Tuteja l'alumne, to neutre i constructiu.
    //   · No repeteixis la resposta correcta (ja la dóna el sistema
    //     si s'esgoten els intents).
    // ─────────────────────────────────────────────────────────

    /**
     * Retorna el missatge de feedback per a l'alumne.
     *
     * @param {string} errorCode - codi retornat per detectChangeError()
     * @param {number} correct   - resposta correcta
     * @param {number} userVal   - resposta de l'alumne
     * @param {number} price     - preu total (per construir missatges contextuals)
     * @returns {string}
     */
    function getChangeMsg(errorCode, correct, userVal, price) {
        const c100  = Math.round(correct * 100);
        const cInt  = Math.floor(c100 / 100);
        const cCent = c100 % 100;

        const u100  = Math.round(userVal * 100);
        const uCent = u100 % 100;

        // Format helpers (sense importar fmtMoney, que és local a cada HTML)
        const fmtCent = (n) => n + ' cèntims';
        const fmtEur  = (n) => n + ' €';

        switch (errorCode) {

            case 'SWAP_DIGITS':
                // Ex: correcte=3,60 / usuari=3,06
                return `Error: no és el mateix ${fmtCent(uCent)} que ${fmtCent(cCent)}.`;

            case 'SMALL_SWAP':
                // Ex: correcte=0,02 / usuari=0,20
                return `Error: no és el mateix ${fmtCent(uCent)} que ${fmtCent(cCent)}.`;

            case 'EURO_FOR_CENTS':
                // Ex: correcte=0,02 / usuari=2
                return `Atenció: no t'han de tornar ${fmtEur(cCent)}, sinó ${fmtCent(cCent)}.`;

            case 'SUBTRACTION_ERROR': {
                // Ex: preu=1,40 / correcte=3,60 / usuari=3,40
                const pCent = Math.round(price * 100) % 100;
                return `Repassa quan restes 0,${String(pCent).padStart(2,'0')} d'un nombre enter.`;
            }

            case 'WRONG_CENTS':
                // Ex: correcte=3,60 / usuari=3,20 — l'enter és bo
                if (cInt > 0) {
                    return `És cert que la part entera és ${fmtEur(cInt)}, però t'has equivocat en els cèntims.`;
                }
                return `T'has equivocat en els cèntims.`;

            case 'WRONG_INT':
                // Ex: correcte=3,60 / usuari=2,60 — els cèntims són bons
                if (cCent > 0) {
                    return `Has encertat els ${fmtCent(cCent)}, però t'has equivocat en la part entera.`;
                }
                return `T'has equivocat en la part entera.`;

            default: // GENERIC
                return '';   // sense missatge específic: el sistema mostra l'error estàndard
        }
    }

    // ─────────────────────────────────────────────────────────
    // API PÚBLICA
    // ─────────────────────────────────────────────────────────
    return { detectChangeError, getChangeMsg };

})();
