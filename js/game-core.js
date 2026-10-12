/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/game-core.js
 * ROL: Motor comú de les activitats (mòdul ES): sessions, puntuació, pantalles de
 *      fi de sessió i final, teclat numèric propi i revisió de les respostes.
 *
 * ── SENSE CODIS DE RETORN ───────────────────────────────────────────────────
 *   Aquest projecte (aula d'acollida) NO genera cap codi de verificació ni cap
 *   nota sobre 10 per al professorat. En acabar, l'alumne veu estrelles i punts
 *   i pot revisar les seves respostes (decisió D3 de docs/PLA.md).
 *
 * ── PUNTUACIÓ ───────────────────────────────────────────────────────────────
 *   Cada pregunta val com a màxim MAX_PUNTS_PREGUNTA punts. Les activitats
 *   sumen els punts a state.sessionScore i, en acabar l'última pregunta, criden
 *   endSession(). La pantalla final converteix els punts en 0–5 estrelles.
 *
 * ── COM S'USA (mòdul ES) ────────────────────────────────────────────────────
 *   import { state, startGame, puntsPregunta } from '../game-core.js';
 *   - L'estat de la partida és a `state` (state.attemptsLeft, state.sessionScore…).
 *   - L'activitat ha d'exposar a window les funcions que aquest mòdul crida:
 *       Object.assign(window, { buildLevel });            // obligatòria
 *       Object.assign(window, { checkCurrentCell });      // si fa servir el teclat
 *     i cridar sempre window.buildLevel() per començar cada pregunta: les sessions
 *     fixes (?fixed=A/B/C, js/fixed-sessions.js) l'embolcallen perquè cada pregunta
 *     torni a sembrar l'atzar i sigui la mateixa per a tota la classe.
 *   - Cada resposta es registra amb recordAnswerToHistory(pregunta, resposta, ok)
 *     perquè la revisió final la pugui mostrar.
 *   - Per als tests de navegador, registraProva(() => ({ ocupat, resposta })).
 *   - Ha de cridar injectSharedHTML(), validateConfig(), initCustomKeyboard() i
 *     startGame(), per aquest ordre.
 *   - injectSharedHTML() també posa en marxa la targeta «Aprèn la paraula»
 *     (js/targeta-paraula.js): una paraula amb imatge, feta amb paraula() del
 *     lèxic, es pot tocar per veure'n la imatge gran. No cal fer res a l'activitat.
 * ============================================================================
 */

import { TOTAL_SESSIONS, TOTAL_OPERATIONS, MAX_INTENTS } from './config.js';
import { FixedSessions } from './fixed-sessions.js';
import { quantitat } from './lexicon/lexicon.js';
import { initTargetaParaula } from './targeta-paraula.js';
import { TEXTOS_COMUNS, format } from './textos.js';

// ── PALETA DE FONS ───────────────────────────────────────────────────────────
export const bgColors = [
    '#f8fafc',
    '#eff6ff',
    '#f0fdf4',
    '#fefce8',
    '#fff1f2',
    '#f5f3ff',
    '#ecfeff',
    '#fdf4ff',
    '#fffbeb',
    '#faf5ff',
];

// ── ESTAT COMPARTIT DEL JOC ──────────────────────────────────────────────────
// Tot l'estat en un sol objecte perquè les activitats el puguin modificar
// (state.attemptsLeft--, state.sessionScore += …): una variable importada d'un
// altre mòdul es pot llegir però no reassignar.
export const state = {
    sessionHistory: [],
    currentSession: 0,
    currentOperation: 0,
    sessionScore: 0,
    sessionScores: [],
    attemptsLeft: 0,
    isTransitioning: false,
};

// ── VALIDACIO DE CONFIGURACIO ────────────────────────────────────────────────
export function validateConfig() {
    const errors = [];
    const isPosInt = n => Number.isInteger(n) && n > 0;
    if (!isPosInt(TOTAL_SESSIONS)) errors.push('TOTAL_SESSIONS ha de ser un enter positiu.');
    if (!isPosInt(TOTAL_OPERATIONS)) errors.push('TOTAL_OPERATIONS ha de ser un enter positiu.');
    if (!isPosInt(MAX_INTENTS)) errors.push('MAX_INTENTS ha de ser un enter positiu.');
    if (errors.length) {
        const msg = 'Configuració invàlida:\n- ' + errors.join('\n- ');
        console.error(msg);
        alert(msg);
        throw new Error(msg);
    }
}

// ── GESTIO DE PANTALLES ──────────────────────────────────────────────────────
let _allScreenIds = ['game-screen', 'session-end-screen', 'final-screen'];
export function registerScreens(ids) {
    _allScreenIds = ids;
}
export function showScreen(id) {
    _allScreenIds.forEach(s => {
        const el = document.getElementById(s);
        if (el) el.style.display = 'none';
    });
    const target = document.getElementById(id);
    if (target) target.style.display = 'block';
}

// ── INICI I FI DEL JOC ──────────────────────────────────────────────────────
export function startGame() {
    // Sessions fixes (?fixed=A/B/C): cada crida a buildLevel() torna a sembrar l'atzar amb
    // (sessió, pregunta). Així una pregunta no depèn del que l'alumne hagi fet a les anteriors
    // i és la mateixa per a tothom (js/fixed-sessions.js).
    if (FixedSessions) FixedSessions.wrap('buildLevel', () => `s${state.currentSession}-q${state.currentOperation}`);
    state.currentSession = 0;
    state.sessionScores = [];
    state.sessionHistory = [];
    showScreen('game-screen');
    startSession();
}

export function startSession() {
    state.currentOperation = 0;
    state.sessionScore = 0;
    if (typeof window.buildLevel === 'function') window.buildLevel();
}

export function endSession() {
    state.sessionScores.push(state.sessionScore);
    if (state.currentSession + 1 >= TOTAL_SESSIONS) {
        renderFinalSummary();
        showScreen('final-screen');
    } else {
        // Mentre es veu «Sessió completada» el joc és amagat: cap resposta (un Intro, per exemple) no el pot tocar.
        // isTransitioning torna a false a buildLevel() de cada activitat, quan comença la sessió següent.
        state.isTransitioning = true;
        showScreen('session-end-screen');
        const titleEl = document.getElementById('session-end-title');
        if (titleEl) titleEl.innerText = format(TEXTOS_COMUNS.sessioCompletada, { n: state.currentSession + 1 });
        const btnEl = document.getElementById('btn-next-session');
        if (btnEl) {
            // [FIX M7] Text temporal durant l'espera d'1s
            btnEl.style.display = 'none';
            const waitMsg = document.createElement('div');
            waitMsg.id = 'session-wait-msg';
            waitMsg.style.cssText = 'color:var(--text-muted);font-size:0.95em;margin-top:10px;text-align:center;';
            waitMsg.innerText = TEXTOS_COMUNS.preparantSessio;
            btnEl.parentNode.insertBefore(waitMsg, btnEl.nextSibling);
            setTimeout(() => {
                btnEl.style.display = 'inline-block';
                const msg = document.getElementById('session-wait-msg');
                if (msg) msg.remove();
            }, 1000);
        }
    }
}

export function startNextSession() {
    // Només si queda alguna sessió: un toc de més (o un Intro) no pot passar del total de sessions.
    if (state.currentSession + 1 >= TOTAL_SESSIONS) return;
    state.currentSession++;
    showScreen('game-screen');
    startSession();
}

// ── PUNTS I ESTRELLES ────────────────────────────────────────────────────────
// Cada pregunta val com a màxim MAX_PUNTS_PREGUNTA punts (cada error en resta 2).
// La puntuació màxima d'una sessió és, doncs, TOTAL_OPERATIONS * MAX_PUNTS_PREGUNTA.
export const MAX_PUNTS_PREGUNTA = 10;
export const MAX_ESTRELLES = 5;

/**
 * Punts d'una pregunta: 0 si no s'ha encertat; si s'ha encertat, 10 menys 2 per
 * error però mai menys d'1 (un encert tardà també compta i no es confon amb
 * «intents esgotats»).
 */
export function puntsPregunta(encertat, errors) {
    return encertat ? Math.max(1, MAX_PUNTS_PREGUNTA - errors * 2) : 0;
}

/** «0 punts», «1 punt», «+5 punts» (singular/plural; `ambMes` afegeix el «+»). */
export function textPunts(n, ambMes = false) {
    return `${ambMes ? '+' : ''}${quantitat(n, 'punt')}`;
}

/** Converteix punts en estrelles (0–5). Qualsevol punt dona almenys 1 estrella. */
export function calculaEstrelles(punts, maxPunts) {
    if (!(maxPunts > 0) || !(punts > 0)) return 0;
    return Math.max(1, Math.min(MAX_ESTRELLES, Math.round((MAX_ESTRELLES * punts) / maxPunts)));
}

/** HTML de les 5 estrelles (les guanyades en color, les altres atenuades). */
export function htmlEstrelles(n) {
    let s = '';
    for (let i = 1; i <= MAX_ESTRELLES; i++) {
        s += `<span class="star ${i <= n ? 'on' : 'off'}" aria-hidden="true">⭐</span>`;
    }
    return `<span class="stars" role="img" aria-label="${format(TEXTOS_COMUNS.estrelles, { n, max: MAX_ESTRELLES })}">${s}</span>`;
}

export function renderFinalSummary() {
    const maxSessio = TOTAL_OPERATIONS * MAX_PUNTS_PREGUNTA; // punts màxims d'1 sessió
    const total = state.sessionScores.reduce((a, s) => a + s, 0);
    const maxTotal = maxSessio * state.sessionScores.length;
    let html = '';
    if (state.sessionScores.length <= 1) {
        const punts = format(TEXTOS_COMUNS.puntsDeMaxim, { n: `<strong>${total}</strong>`, max: maxTotal });
        html = `<div class="final-score">${htmlEstrelles(calculaEstrelles(total, maxTotal))}<div class="final-points">${punts}</div></div>`;
    } else {
        state.sessionScores.forEach((s, i) => {
            html += `<div class="session-line"><span>${format(TEXTOS_COMUNS.sessioN, { n: i + 1 })}</span>${htmlEstrelles(calculaEstrelles(s, maxSessio))}<span>${s} / ${maxSessio}</span></div>`;
        });
        html += `<div class="session-line session-line--total"><span>${TEXTOS_COMUNS.total}</span>${htmlEstrelles(calculaEstrelles(total, maxTotal))}<span>${total} / ${maxTotal}</span></div>`;
    }
    const summaryEl = document.getElementById('final-summary');
    if (summaryEl) summaryEl.innerHTML = html;
}

/** «Torna a jugar»: torna a començar amb els mateixos paràmetres de la URL. */
export function finalitzar() {
    window.location.reload();
}

// ── MINI OVERLAY ─────────────────────────────────────────────────────────────
export function showMiniOverlay(levelPoints, options = {}) {
    const successColor = options.successColor || '#047857';
    const pointsColor = options.pointsColor || '#047857';
    const vicText = document.getElementById('mini-vic-text');
    const vicIcon = document.getElementById('mini-vic-icon');
    const vicPoints = document.getElementById('mini-vic-points');
    const overlay = document.getElementById('mini-victory-overlay');
    let waitTime;
    if (levelPoints > 0) {
        // puntsPregunta() dona ≥ 1 punt a tot encert
        if (vicText) {
            vicText.innerText = TEXTOS_COMUNS.moltBe;
            vicText.style.color = successColor;
        }
        if (vicIcon) {
            vicIcon.innerText = '⭐';
        }
        if (vicPoints) {
            vicPoints.innerText = textPunts(levelPoints, true);
            vicPoints.style.color = pointsColor;
        }
        waitTime = 1500;
    } else {
        if (vicText) {
            vicText.innerText = TEXTOS_COMUNS.intentsEsgotats;
            vicText.style.color = 'var(--danger)';
        }
        if (vicIcon) {
            vicIcon.innerText = '❌';
        }
        if (vicPoints) {
            vicPoints.innerText = textPunts(0);
            vicPoints.style.color = 'var(--danger)';
        }
        waitTime = 3000;
    }
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.setAttribute('aria-hidden', 'false');
    }
    return waitTime;
}

export function hideMiniOverlay() {
    const overlay = document.getElementById('mini-victory-overlay');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
    }
}

// ── INJECCIO HTML COMPARTIT ──────────────────────────────────────────────────
export function injectSharedHTML() {
    const gameScreen = document.getElementById('game-screen');
    const panel = document.querySelector('.panel');
    if (!gameScreen || !panel) return;

    // 1. Mini overlay
    const overlay = document.createElement('div');
    overlay.id = 'mini-victory-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `<div class="vic-message-row"><div class="mini-vic-text" id="mini-vic-text">${TEXTOS_COMUNS.moltBe}</div><div class="star-icon" id="mini-vic-icon">⭐</div></div><div class="mini-vic-points" id="mini-vic-points"></div>`;
    gameScreen.appendChild(overlay);

    // 2. Teclat numeric
    const kb = document.createElement('div');
    kb.id = 'customKeyboard';
    kb.innerHTML = `<div class="kb-grid"><button class="kb-btn" data-key="7">7</button><button class="kb-btn" data-key="8">8</button><button class="kb-btn" data-key="9">9</button><button class="kb-btn kb-del" data-key="del">⌫</button><button class="kb-btn" data-key="4">4</button><button class="kb-btn" data-key="5">5</button><button class="kb-btn" data-key="6">6</button><button class="kb-btn kb-minus" data-key="-">−</button><button class="kb-btn" data-key="1">1</button><button class="kb-btn" data-key="2">2</button><button class="kb-btn" data-key="3">3</button><button class="kb-btn kb-enter" data-key="enter">→</button><button class="kb-btn kb-zero" data-key="0">0</button></div>`;
    panel.appendChild(kb);

    // 3. Fi de sessio
    const sessionEnd = document.createElement('div');
    sessionEnd.id = 'session-end-screen';
    sessionEnd.innerHTML = `<div class="trophy-icon">👍</div><h2 id="session-end-title"></h2><button class="btn-green" id="btn-next-session" onclick="startNextSession()">${TEXTOS_COMUNS.comencarSessio}</button>`;
    panel.appendChild(sessionEnd);

    // 4. Pantalla final: estrelles i punts, revisió i tornar a jugar
    const finalScreen = document.createElement('div');
    finalScreen.id = 'final-screen';
    finalScreen.style.display = 'none';
    finalScreen.innerHTML = `<div id="final-results"><div class="final-layout"><div id="final-summary" class="final-summary"></div><div class="trophy-icon">🏆</div></div><div class="final-actions final-actions--row"><button class="btn-submit" onclick="showHistorySummary()">${TEXTOS_COMUNS.revisa}</button><button class="btn-submit" onclick="finalitzar()">${TEXTOS_COMUNS.tornaAJugar}</button></div></div>`;
    panel.appendChild(finalScreen);

    // 5. Targeta «Aprèn la paraula»: un toc a una paraula amb imatge n'obre la targeta (js/targeta-paraula.js)
    initTargetaParaula();
}

// ── TECLAT NUMERIC CUSTOM ────────────────────────────────────────────────────
export function isTouchDevice() {
    return window.matchMedia('(pointer: coarse) and (hover: none)').matches;
}
let _kbActiveInput = null;
let _kbClearOnNext = false;

export function initCustomKeyboard(options = {}) {
    const allowNeg = options.allowNegative ?? false;
    const allowZero = options.allowZero ?? true;
    const grid = document.querySelector('#customKeyboard .kb-grid');
    if (grid) {
        if (!allowNeg) grid.classList.add('kb-no-minus');
        else grid.classList.remove('kb-no-minus');
        if (!allowZero) grid.classList.add('kb-no-zero');
        else grid.classList.remove('kb-no-zero');
    }
    document.querySelectorAll('#customKeyboard .kb-btn').forEach(btn => {
        btn.addEventListener('pointerdown', e => {
            e.preventDefault();
            if (!_kbActiveInput) return;
            const key = btn.dataset.key;
            if (key === 'del') {
                if (_kbClearOnNext) {
                    _kbActiveInput.value = '';
                    _kbClearOnNext = false;
                    _kbActiveInput.classList.remove('kb-selected');
                } else _kbActiveInput.value = _kbActiveInput.value.slice(0, -1);
            } else if (key === 'enter') {
                if (typeof window.checkCurrentCell === 'function') window.checkCurrentCell();
            } else if (key === '-') {
                if (_kbClearOnNext) {
                    _kbActiveInput.value = '-';
                    _kbClearOnNext = false;
                    _kbActiveInput.classList.remove('kb-selected');
                } else {
                    const v = _kbActiveInput.value;
                    if (v === '') _kbActiveInput.value = '-';
                    else if (v === '-') _kbActiveInput.value = '';
                }
            } else {
                if (_kbClearOnNext) {
                    _kbActiveInput.value = '';
                    _kbClearOnNext = false;
                    _kbActiveInput.classList.remove('kb-selected');
                }
                if (_kbActiveInput.value === '-0') _kbActiveInput.value = '-';
                _kbActiveInput.value += key;
            }
        });
    });
    window.addEventListener('orientationchange', () => {
        const kb = document.getElementById('customKeyboard');
        if (!_kbActiveInput || !kb || !kb.classList.contains('kb-visible')) return;
        setTimeout(() => kb.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300);
    });
    // [FIX C3] En tàctils, pre-establir inputmode="none" a tots els inputs
    if (isTouchDevice()) {
        document.querySelectorAll('#game-screen input[type="text"], #game-screen input[type="number"]').forEach(inp => {
            inp.setAttribute('inputmode', 'none');
        });
    }
}

/** El camp que té ara el teclat de la pantalla (null si cap). */
export const getKbActiveInput = () => _kbActiveInput;

export function showCustomKeyboard(inp) {
    if (_kbActiveInput) _kbActiveInput.classList.remove('kb-active-input');
    _kbActiveInput = inp;
    _kbClearOnNext = false;
    inp.setAttribute('inputmode', 'none');
    inp.setAttribute('readonly', 'readonly');
    inp.classList.add('kb-active-input');
    if (!inp._kbDirectTapBound) {
        inp._kbDirectTapBound = true;
        inp.addEventListener('pointerdown', e => {
            if (!isTouchDevice()) return;
            e.preventDefault();
            if (inp.dataset.locked === 'true') return; // un camp ja encertat no torna a rebre el teclat
            showCustomKeyboard(inp);
        });
    }
    const kb = document.getElementById('customKeyboard');
    if (kb) {
        kb.classList.add('kb-visible');
        setTimeout(() => kb.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    }
    inp.focus();
}

export function hideCustomKeyboard() {
    const kb = document.getElementById('customKeyboard');
    if (kb) kb.classList.remove('kb-visible');
    if (_kbActiveInput) {
        _kbActiveInput.classList.remove('kb-active-input');
        _kbActiveInput.removeAttribute('readonly');
        // [FIX C3] En tàctils, mantenim inputmode="none"
        if (!isTouchDevice()) _kbActiveInput.removeAttribute('inputmode');
    }
    _kbActiveInput = null;
    _kbClearOnNext = false;
}

export function kbMarkForOverwrite(inp) {
    _kbClearOnNext = true;
    inp.classList.add('kb-selected');
}

// ── HISTORIAL (revisió visual de les respostes) ──────────────────────────────
export function escapeHtml(unsafe) {
    if (unsafe == null) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Converteix \frac{num}{den} → num/den per a la visualització en text pla (revisió)
export function plainFrac(str) {
    if (!str) return '';
    return String(str).replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2');
}

export function recordAnswerToHistory(question, answer, isCorrect) {
    state.sessionHistory.push({ question, answer, isCorrect });
}

/**
 * Revisió visual: una targeta per cada resposta, en l'ordre en què s'han fet.
 * Cada targeta mostra l'operació i la resposta amb ✔ (correcta) o ✖ (incorrecta).
 * La icona és diferent per a cada cas, de manera que no depèn només del color.
 */
export function showHistorySummary() {
    _allScreenIds.forEach(s => {
        const el = document.getElementById(s);
        if (el) el.style.display = 'none';
    });
    let sc = document.getElementById('history-summary-screen');
    if (!sc) {
        sc = document.createElement('div');
        sc.id = 'history-summary-screen';
        sc.className = 'panel-content';
        (document.querySelector('.panel') || document.body).appendChild(sc);
    }
    const items = state.sessionHistory
        .map(h => {
            const ok = h.isCorrect;
            return (
                `<li class="history-item history-item--${ok ? 'ok' : 'bad'}">` +
                `<div class="history-q history-mono">${escapeHtml(h.question)}</div>` +
                `<div class="history-a"><span class="history-icon" role="img" aria-label="${ok ? TEXTOS_COMUNS.correcte : TEXTOS_COMUNS.incorrecte}">${ok ? '✔' : '✖'}</span>` +
                `<span class="history-mono">${escapeHtml(plainFrac(h.answer))}</span></div>` +
                `</li>`
            );
        })
        .join('');

    sc.innerHTML = `<div class="history-summary">
        <h2 class="history-heading" aria-label="${TEXTOS_COMUNS.revisio}">📋</h2>
        <ul class="history-list">${items}</ul>
        <div class="history-actions">
            <button class="btn-submit" onclick="tornaAlResum()">${TEXTOS_COMUNS.enrere}</button>
            <button class="btn-submit" onclick="finalitzar()">${TEXTOS_COMUNS.tornaAJugar}</button>
        </div>
    </div>`;
    sc.style.display = 'block';
}

/** Torna de la revisió a la pantalla final (estrelles i punts). */
export function tornaAlResum() {
    const sc = document.getElementById('history-summary-screen');
    if (sc) sc.style.display = 'none';
    showScreen('final-screen');
}

// ── FUNCIONS CRIDADES DES DE L'HTML ─────────────────────────────────────────
// Els botons que crea injectSharedHTML() i la revisió les criden amb onclick="…",
// que només veu window.
Object.assign(window, { startNextSession, showHistorySummary, tornaAlResum, finalitzar });

// ── LECTURA DE L'ESTAT PER ALS TESTS DE NAVEGADOR ───────────────────────────
/**
 * Les variables d'un mòdul ES no són globals i els tests de navegador
 * (tests/navegador/helpers.js) no hi poden accedir. Cada activitat hi registra
 * una funció que torna el que el test ha de poder veure d'ella (p. ex.
 * `{ ocupat: isPenalizing, resposta: expectedAnswer }`) i el test ho llegeix amb
 * window.__prova(), juntament amb l'estat comú d'aquest motor. Només llegeix:
 * no canvia res del joc.
 */
export function registraProva(llegeixActivitat) {
    window.__prova = () => {
        const activitat = llegeixActivitat();
        return {
            sessions: TOTAL_SESSIONS,
            preguntes: TOTAL_OPERATIONS,
            intents: MAX_INTENTS,
            fixed: FixedSessions ? FixedSessions.key : null,
            ...state,
            ...activitat,
            ocupat: state.isTransitioning || !!activitat.ocupat,
        };
    };
}
