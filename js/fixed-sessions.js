/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/fixed-sessions.js
 * ROL: Sessions fixes per al professorat. Quan la URL conté ?fixed=A (o B, C),
 *      TOTS els alumnes que obrin el mateix enllaç obtindran exactament les
 *      mateixes preguntes, amb els mateixos nombres.
 *
 * COM FUNCIONA:
 *   1. Substitueix Math.random() per un generador pseudoaleatori determinista
 *      (Mulberry32). La llavor NO és una sola per a tota la sessió: cada
 *      pregunta en té una de pròpia, calculada a partir de la lletra (A/B/C),
 *      l'activitat i el número de pregunta. Així, el que faci un alumne en una
 *      pregunta (errors, ajudes, reintents…) no pot canviar les preguntes
 *      següents: la pregunta 3 és la mateixa per a tothom.
 *        - Activitats amb game-core.js: automàtic. startGame() crida
 *          FixedSessions.wrap('buildLevel', …) i cada crida a buildLevel()
 *          torna a sembrar amb (sessió, pregunta).
 *        - Pàgines amb flux propi: criden FixedSessions?.seed(etiqueta)
 *          o FixedSessions?.next(tipus) quan generen un exercici nou.
 *          (FixedSessions val null si la URL no porta ?fixed=A/B/C.)
 *   2. Afegeix a la URL 5 preguntes i 1 sessió (si l'enllaç no en porta) amb
 *      history.replaceState, ABANS que config.js els llegeixi.
 *   3. Mostra un distintiu «Sessió fixa A/B/C» perquè professorat i alumnat
 *      sàpiguen que estan en mode determinista.
 *
 * ÚS PER AL PROFESSORAT (generador d'enllaços de la portada, camp «Sessió fixa»):
 *   a-enters.html?fixed=A        → Sessió A (tots fan el mateix)
 *   a-enters.html?fixed=B        → Sessió B (preguntes diferents de les d'A)
 *   a-enters.html?fixed=A&maxintents=5   → es pot combinar amb altres paràmetres
 *
 * ORDRE D'EXECUCIÓ:
 *   ⚠️ CRÍTIC: s'ha d'executar ABANS que ningú llegeixi la URL o faci servir
 *   Math.random. És un mòdul ES: config.js l'importa en primer lloc, així que
 *   s'executa abans que el cos de config.js (que és qui llegeix els paràmetres)
 *   i abans de tot el que importa config.js (game-core.js, les activitats).
 *   tests/check-repo.js vigila que continuï així.
 *
 * SENSE CODIS DE RETORN: a diferència d'`operacions`, aquí no cal restaurar
 * Math.random en acabar (no hi ha cap codi amb un «salt» aleatori de veritat).
 *
 * DEPENDÈNCIES: textos.js (el text del distintiu).
 * ============================================================================
 */
import { TEXTOS_COMUNS, format } from './textos.js';

export const FixedSessions = (() => {
    'use strict';

    const params = new URLSearchParams(window.location.search);
    const fixedRaw = params.get('fixed');
    if (!fixedRaw) return null; // mode aleatori normal — no fem res

    const fixedKey = fixedRaw.toUpperCase();
    if (!['A', 'B', 'C'].includes(fixedKey)) return null;

    const exercici = window.location.pathname.split('/').pop().replace('.html', '');

    // ── 1. PRNG DETERMINISTA (Mulberry32) AMB UNA LLAVOR PER PREGUNTA ────
    //    Mateixa etiqueta de pregunta → mateixa seqüència → mateixa pregunta.

    // Hash FNV-1a de 32 bits: converteix "A|a-enters|s0-q3" en un enter.
    function hash32(str) {
        let h = 0x811c9dc5;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
        }
        return h >>> 0;
    }

    let _state = 0;
    function _seed(label) {
        _state = hash32(fixedKey + '|' + exercici + '|' + label);
    }

    Math.random = function mulberry32() {
        _state |= 0;
        _state = (_state + 0x6d2b79f5) | 0;
        let t = Math.imul(_state ^ (_state >>> 15), 1 | _state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    _seed('inici'); // el que es generi en carregar la pàgina, abans de la 1a pregunta

    const _counters = {};
    const api = {
        key: fixedKey,

        /** Torna a sembrar l'atzar per a la pregunta identificada per `label`. */
        seed(label) {
            _seed(String(label));
        },

        /**
         * Per a pàgines sense comptador de preguntes: la n-èsima crida amb el
         * mateix `tipus` rep sempre la mateixa llavor (p. ex. 'SR', 'SR', …).
         */
        next(tipus = 'q') {
            const n = (_counters[tipus] = (_counters[tipus] ?? -1) + 1);
            _seed(tipus + '#' + n);
        },

        /**
         * Embolcalla window[name] (p. ex. 'buildLevel') perquè cada crida torni
         * a sembrar amb l'etiqueta que retorna labelFn(). L'activitat l'ha
         * d'haver exposat (Object.assign(window, { buildLevel })) i cridar-la
         * sempre com a window.buildLevel(): una crida directa no passaria per aquí.
         */
        wrap(name, labelFn) {
            const fn = window[name];
            if (typeof fn !== 'function' || fn._fixedWrapped) return false;
            const wrapped = function () {
                _seed(String(labelFn()));
                return fn.apply(this, arguments);
            };
            wrapped._fixedWrapped = true;
            window[name] = wrapped;
            return window[name] === wrapped;
        },
    };

    // ── 2. PARÀMETRES PER DEFECTE A LA URL ───────────────────────────────
    //    Els afegim sense recarregar la pàgina. config.js els trobarà quan es
    //    carregui (perquè aquest mòdul va PRIMER). Un paràmetre que ja hi és
    //    (p. ex. ?totaloperations=3) no es toca.

    let changed = false;
    if (!params.has('totaloperations')) {
        params.set('totaloperations', '5');
        changed = true;
    }
    if (!params.has('totalsessions')) {
        params.set('totalsessions', '1');
        changed = true;
    }
    if (changed) {
        history.replaceState(null, '', '?' + params.toString());
    }

    // ── 3. DISTINTIU VISUAL ──────────────────────────────────────────────
    //    Una etiqueta centrada a dalt de tot, dins del flux de la pàgina: no tapa
    //    cap botó ni cap títol (en un mòbil de 320 px un distintiu flotant a la
    //    cantonada es posaria a sobre del botó «Tutorial»).

    function ensenyaDistintiu() {
        const badge = document.createElement('div');
        badge.id = 'badge-sessio-fixa';
        badge.textContent = format(TEXTOS_COMUNS.sessioFixa, { lletra: fixedKey });
        badge.style.cssText = [
            'align-self:center',
            'margin:0 0 6px',
            'background:#1e293b',
            'color:#fbbf24',
            'padding:3px 12px',
            'border-radius:6px',
            'font-size:12px',
            'font-weight:700',
            'letter-spacing:0.5px',
            'pointer-events:none',
        ].join(';');
        document.body.insertBefore(badge, document.body.firstChild);
    }
    if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', ensenyaDistintiu);
    else ensenyaDistintiu();

    return api;
})();
