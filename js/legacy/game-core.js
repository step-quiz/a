/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/game-core.js
 * ROL: Motor comú de les activitats: sessions, puntuació, pantalles de fi de
 *      sessió i final, teclat numèric propi i revisió de les respostes.
 *
 * ── SENSE CODIS DE RETORN ───────────────────────────────────────────────────
 *   Aquest projecte (aula d'acollida) NO genera cap codi de verificació ni cap
 *   nota sobre 10 per al professorat. En acabar, l'alumne veu estrelles i punts
 *   i pot revisar les seves respostes (decisió D3 de docs/PLA.md).
 *
 * ── PUNTUACIÓ ───────────────────────────────────────────────────────────────
 *   Cada pregunta val com a màxim MAX_PUNTS_PREGUNTA punts. Les activitats
 *   sumen els punts a sessionScore i, en acabar l'última pregunta, criden
 *   endSession(). La pantalla final converteix els punts en 0–5 estrelles.
 *
 * ── COM S'USA ───────────────────────────────────────────────────────────────
 *   Cada activitat defineix buildLevel() i, si fa servir el teclat propi,
 *   checkCurrentCell(); i crida injectSharedHTML(), validateConfig(),
 *   initCustomKeyboard() i startGame().
 *   Cada resposta es registra amb recordAnswerToHistory(pregunta, resposta, ok)
 *   perquè la revisió final la pugui mostrar.
 * ============================================================================
 */

// ── PALETA DE FONS ───────────────────────────────────────────────────────────
const bgColors = [
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
let sessionHistory = [];
let currentSession = 0;
let currentOperation = 0;
let sessionScore = 0;
let sessionScores = [];
let attemptsLeft = 0;
let isTransitioning = false;

// ── VALIDACIO DE CONFIGURACIO ────────────────────────────────────────────────
function validateConfig() {
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
function registerScreens(ids) {
    _allScreenIds = ids;
}
function showScreen(id) {
    _allScreenIds.forEach(s => {
        const el = document.getElementById(s);
        if (el) el.style.display = 'none';
    });
    const target = document.getElementById(id);
    if (target) target.style.display = 'block';
}

// ── INICI I FI DEL JOC ──────────────────────────────────────────────────────
function startGame() {
    currentSession = 0;
    sessionScores = [];
    sessionHistory = [];
    showScreen('game-screen');
    startSession();
}

function startSession() {
    currentOperation = 0;
    sessionScore = 0;
    if (typeof buildLevel === 'function') buildLevel();
}

function endSession() {
    sessionScores.push(sessionScore);
    if (currentSession + 1 >= TOTAL_SESSIONS) {
        renderFinalSummary();
        showScreen('final-screen');
    } else {
        showScreen('session-end-screen');
        const titleEl = document.getElementById('session-end-title');
        if (titleEl) titleEl.innerText = `Sessió ${currentSession + 1} completada`;
        const btnEl = document.getElementById('btn-next-session');
        if (btnEl) {
            // [FIX M7] Text temporal durant l'espera d'1s
            btnEl.style.display = 'none';
            const waitMsg = document.createElement('div');
            waitMsg.id = 'session-wait-msg';
            waitMsg.style.cssText = 'color:var(--text-muted);font-size:0.95em;margin-top:10px;text-align:center;';
            waitMsg.innerText = 'Preparant sessió següent…';
            btnEl.parentNode.insertBefore(waitMsg, btnEl.nextSibling);
            setTimeout(() => {
                btnEl.style.display = 'inline-block';
                isTransitioning = false;
                const msg = document.getElementById('session-wait-msg');
                if (msg) msg.remove();
            }, 1000);
        }
    }
}

function startNextSession() {
    currentSession++;
    showScreen('game-screen');
    startSession();
}

// ── PUNTS I ESTRELLES ────────────────────────────────────────────────────────
// Cada pregunta val com a màxim MAX_PUNTS_PREGUNTA punts (cada error en resta 2).
// La puntuació màxima d'una sessió és, doncs, TOTAL_OPERATIONS * MAX_PUNTS_PREGUNTA.
const MAX_PUNTS_PREGUNTA = 10;
const MAX_ESTRELLES = 5;

/**
 * Punts d'una pregunta: 0 si no s'ha encertat; si s'ha encertat, 10 menys 2 per
 * error però mai menys d'1 (un encert tardà també compta i no es confon amb
 * «intents esgotats»).
 */
function puntsPregunta(encertat, errors) {
    return encertat ? Math.max(1, MAX_PUNTS_PREGUNTA - errors * 2) : 0;
}

/** «0 punts», «1 punt», «+5 punts» (singular/plural; `ambMes` afegeix el «+»). */
function textPunts(n, ambMes = false) {
    return `${ambMes ? '+' : ''}${n} ${n === 1 ? 'punt' : 'punts'}`;
}

/** Converteix punts en estrelles (0–5). Qualsevol punt dona almenys 1 estrella. */
function calculaEstrelles(punts, maxPunts) {
    if (!(maxPunts > 0) || !(punts > 0)) return 0;
    return Math.max(1, Math.min(MAX_ESTRELLES, Math.round((MAX_ESTRELLES * punts) / maxPunts)));
}

/** HTML de les 5 estrelles (les guanyades en color, les altres atenuades). */
function htmlEstrelles(n) {
    let s = '';
    for (let i = 1; i <= MAX_ESTRELLES; i++) {
        s += `<span class="star ${i <= n ? 'on' : 'off'}" aria-hidden="true">⭐</span>`;
    }
    return `<span class="stars" role="img" aria-label="${n} de ${MAX_ESTRELLES} estrelles">${s}</span>`;
}

function renderFinalSummary() {
    const maxSessio = TOTAL_OPERATIONS * MAX_PUNTS_PREGUNTA; // punts màxims d'1 sessió
    const total = sessionScores.reduce((a, s) => a + s, 0);
    const maxTotal = maxSessio * sessionScores.length;
    let html = '';
    if (sessionScores.length <= 1) {
        html = `<div class="final-score">${htmlEstrelles(calculaEstrelles(total, maxTotal))}<div class="final-points"><strong>${total}</strong> / ${maxTotal} punts</div></div>`;
    } else {
        sessionScores.forEach((s, i) => {
            html += `<div class="session-line"><span>Sessió ${i + 1}</span>${htmlEstrelles(calculaEstrelles(s, maxSessio))}<span>${s} / ${maxSessio}</span></div>`;
        });
        html += `<div class="session-line session-line--total"><span>Total</span>${htmlEstrelles(calculaEstrelles(total, maxTotal))}<span>${total} / ${maxTotal}</span></div>`;
    }
    const summaryEl = document.getElementById('final-summary');
    if (summaryEl) summaryEl.innerHTML = html;
}

/** «Torna a jugar»: torna a començar amb els mateixos paràmetres de la URL. */
function finalitzar() {
    window.location.reload();
}

// ── MINI OVERLAY ─────────────────────────────────────────────────────────────
function showMiniOverlay(levelPoints, options = {}) {
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
            vicText.innerText = 'Molt bé!';
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
            vicText.innerText = 'Intents esgotats';
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

function hideMiniOverlay() {
    const overlay = document.getElementById('mini-victory-overlay');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
    }
}

// ── INJECCIO HTML COMPARTIT ──────────────────────────────────────────────────
function injectSharedHTML() {
    const gameScreen = document.getElementById('game-screen');
    const panel = document.querySelector('.panel');
    if (!gameScreen || !panel) return;

    // 1. Mini overlay
    const overlay = document.createElement('div');
    overlay.id = 'mini-victory-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `<div class="vic-message-row"><div class="mini-vic-text" id="mini-vic-text">Molt bé!</div><div class="star-icon" id="mini-vic-icon">⭐</div></div><div class="mini-vic-points" id="mini-vic-points">+10 punts</div>`;
    gameScreen.appendChild(overlay);

    // 2. Teclat numeric
    const kb = document.createElement('div');
    kb.id = 'customKeyboard';
    kb.innerHTML = `<div class="kb-grid"><button class="kb-btn" data-key="7">7</button><button class="kb-btn" data-key="8">8</button><button class="kb-btn" data-key="9">9</button><button class="kb-btn kb-del" data-key="del">⌫</button><button class="kb-btn" data-key="4">4</button><button class="kb-btn" data-key="5">5</button><button class="kb-btn" data-key="6">6</button><button class="kb-btn kb-minus" data-key="-">−</button><button class="kb-btn" data-key="1">1</button><button class="kb-btn" data-key="2">2</button><button class="kb-btn" data-key="3">3</button><button class="kb-btn kb-enter" data-key="enter">→</button><button class="kb-btn kb-zero" data-key="0">0</button></div>`;
    panel.appendChild(kb);

    // 3. Fi de sessio
    const sessionEnd = document.createElement('div');
    sessionEnd.id = 'session-end-screen';
    sessionEnd.innerHTML = `<div class="trophy-icon">👍</div><h2 id="session-end-title">Sessió completada</h2><button class="btn-green" id="btn-next-session" onclick="startNextSession()">Començar sessió següent</button>`;
    panel.appendChild(sessionEnd);

    // 4. Pantalla final: estrelles i punts, revisió i tornar a jugar
    const finalScreen = document.createElement('div');
    finalScreen.id = 'final-screen';
    finalScreen.style.display = 'none';
    finalScreen.innerHTML = `<div id="final-results"><div class="final-layout"><div id="final-summary" class="final-summary"></div><div class="trophy-icon">🏆</div></div><div class="final-actions final-actions--row"><button class="btn-submit" onclick="showHistorySummary()">📋 Revisa</button><button class="btn-submit" onclick="finalitzar()">🔄 Torna a jugar</button></div></div>`;
    panel.appendChild(finalScreen);
}

// ── TECLAT NUMERIC CUSTOM ────────────────────────────────────────────────────
function isTouchDevice() {
    return window.matchMedia('(pointer: coarse) and (hover: none)').matches;
}
let _kbActiveInput = null;
let _kbClearOnNext = false;

function initCustomKeyboard(options = {}) {
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
                if (typeof checkCurrentCell === 'function') checkCurrentCell();
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

function showCustomKeyboard(inp) {
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

function hideCustomKeyboard() {
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

function kbMarkForOverwrite(inp) {
    _kbClearOnNext = true;
    inp.classList.add('kb-selected');
}

// ── HISTORIAL (revisió visual de les respostes) ──────────────────────────────
function escapeHtml(unsafe) {
    if (unsafe == null) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Converteix \frac{num}{den} → num/den per a la visualització en text pla (revisió)
function plainFrac(str) {
    if (!str) return '';
    return String(str).replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2');
}

function recordAnswerToHistory(question, answer, isCorrect) {
    sessionHistory.push({ question, answer, isCorrect });
}

/**
 * Revisió visual: una targeta per cada resposta, en l'ordre en què s'han fet.
 * Cada targeta mostra l'operació i la resposta amb ✔ (correcta) o ✖ (incorrecta).
 * La icona és diferent per a cada cas, de manera que no depèn només del color.
 */
function showHistorySummary() {
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
    const items = sessionHistory
        .map(h => {
            const ok = h.isCorrect;
            return (
                `<li class="history-item history-item--${ok ? 'ok' : 'bad'}">` +
                `<div class="history-q history-mono">${escapeHtml(h.question)}</div>` +
                `<div class="history-a"><span class="history-icon" role="img" aria-label="${ok ? 'Correcte' : 'Incorrecte'}">${ok ? '✔' : '✖'}</span>` +
                `<span class="history-mono">${escapeHtml(plainFrac(h.answer))}</span></div>` +
                `</li>`
            );
        })
        .join('');

    sc.innerHTML = `<div class="history-summary">
        <h2 class="history-heading" aria-label="Revisió">📋</h2>
        <ul class="history-list">${items}</ul>
        <div class="history-actions">
            <button class="btn-submit" onclick="tornaAlResum()">⬅ Enrere</button>
            <button class="btn-submit" onclick="finalitzar()">🔄 Torna a jugar</button>
        </div>
    </div>`;
    sc.style.display = 'block';
}

/** Torna de la revisió a la pantalla final (estrelles i punts). */
function tornaAlResum() {
    const sc = document.getElementById('history-summary-screen');
    if (sc) sc.style.display = 'none';
    showScreen('final-screen');
}
