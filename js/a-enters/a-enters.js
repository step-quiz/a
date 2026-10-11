/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-enters/a-enters.js
 * ROL: Controlador de l'activitat «Nombres enters» (a-enters.html): pantalla,
 *      camp de resposta, ajuda, intents i punts. Abans era a dins de l'HTML.
 *      La lògica pura (generació de l'operació, textos d'ajuda) és a generador.js.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa config.js, game-core.js
 *      i generador.js. Vegeu la capçalera d'a-enters.html per als paràmetres de la URL.
 * ============================================================================
 */
import { MAX_INTENTS, TOTAL_OPERATIONS, TOTAL_SESSIONS } from '../config.js';
import {
    state,
    bgColors,
    endSession,
    hideCustomKeyboard,
    hideMiniOverlay,
    initCustomKeyboard,
    injectSharedHTML,
    isTouchDevice,
    kbMarkForOverwrite,
    puntsPregunta,
    recordAnswerToHistory,
    registraProva,
    showCustomKeyboard,
    showMiniOverlay,
    startGame,
    validateConfig,
} from '../game-core.js';
import { TEXTOS_COMUNS, format } from '../textos.js';
import { calculaResposta, generaProblema, htmlAjuda, llegeixParametres, textPistaSigne } from './generador.js';
import { TEXTOS } from './textos.js';

// Aquest fitxer és un mòdul ES: les seves funcions no són globals. Exposem a
// window només les que es criden des de fora: game-core.js (buildLevel,
// checkCurrentCell) i els onclick dels botons que crea activateOperation().
Object.assign(window, { checkValue, toggleHelp, buildLevel, checkCurrentCell });

const {
    rang: RANG,
    nivell: NIVELL,
    operadors: OPERADORS,
} = llegeixParametres(new URLSearchParams(window.location.search));

// ── ELEMENTS DOM ─────────────────────────────────────────────────────────────

const els = {
    body: document.body,
    gameScreen: document.getElementById('game-screen'),
    sessionDisplay: document.getElementById('session-display'),
    lvlDisplay: document.getElementById('lvl-display'),
    nivellDisplay: document.getElementById('nivell-display'),
    scoreDisplay: document.getElementById('score-display'),
    attemptsDisplay: document.getElementById('attempts-display'),
    resolutionPanel: document.getElementById('resolution-panel'),
    answerRow: document.getElementById('answer-row'),
    helpText: document.getElementById('help-text'),
    answerReveal: document.getElementById('answer-reveal'),
    answerCorrectVal: document.getElementById('answer-correct-val'),
    // valueInput i btnSubmitVal s'injecten via activateOperation()
    get valueInput() {
        return document.getElementById('value-input');
    },
    get btnSubmitVal() {
        return document.getElementById('btn-submit-val');
    },
};

// ── ESTAT LOCAL ──────────────────────────────────────────────────────────────

let isPenalizing = false;
let currentA = 0;
let currentB = 1;
let currentOp = '+';
let expectedAnswer = 0;
let _helpVisible = false;

// ── HELPERS VISUALS ──────────────────────────────────────────────────────────

function signClass(n) {
    if (n < 0) return 'neg';
    if (n > 0) return 'pos';
    return 'zero';
}

function fmtN(n) {
    return String(n);
}

function numSpan(n) {
    return `<span class="token-num ${signClass(n)}">${fmtN(n)}</span>`;
}

// ── AJUDA CONTEXTUAL (metàfora de l'ascensor) ────────────────────────────────

function toggleHelp() {
    _helpVisible = !_helpVisible;
    const signHint = document.getElementById('sign-hint');
    if (_helpVisible) {
        els.helpText.innerHTML = htmlAjuda(currentA, currentOp, currentB);
        els.helpText.classList.add('visible');
        // ~50% de vegades mostrem també la pista del signe
        if (signHint) {
            if (Math.random() < 0.5) {
                signHint.textContent = textPistaSigne(expectedAnswer);
                signHint.classList.add('visible');
            } else {
                signHint.classList.remove('visible');
            }
        }
    } else {
        els.helpText.classList.remove('visible');
        if (signHint) signHint.classList.remove('visible');
    }
}

function resetHelp() {
    _helpVisible = false;
    els.helpText.classList.remove('visible');
    els.helpText.textContent = '';
    const signHint = document.getElementById('sign-hint');
    if (signHint) signHint.classList.remove('visible');
}

// ── UPDATE CAPÇALERA ─────────────────────────────────────────────────────────

function updateHeader() {
    els.sessionDisplay.innerText = format(TEXTOS_COMUNS.sessio, { n: state.currentSession + 1, total: TOTAL_SESSIONS });
    els.lvlDisplay.innerText = format(TEXTOS.operacio, { n: state.currentOperation + 1, total: TOTAL_OPERATIONS });
    els.nivellDisplay.innerText = format(TEXTOS_COMUNS.nivell, { n: NIVELL });
    els.scoreDisplay.innerText = format(TEXTOS_COMUNS.punts, { n: state.sessionScore });
    els.attemptsDisplay.innerText = format(TEXTOS_COMUNS.intents, { n: state.attemptsLeft });
    els.attemptsDisplay.className = 'attempts-counter' + (state.attemptsLeft <= 2 ? ' danger' : '');
}

// ── LÒGICA PRINCIPAL ─────────────────────────────────────────────────────────

/** Cridat per game-core.js via startSession(). */
function buildLevel() {
    state.attemptsLeft = MAX_INTENTS;
    isPenalizing = false;
    state.isTransitioning = false;

    const { a, op, b } = generaProblema({ nivell: NIVELL, rang: RANG, operadors: OPERADORS });
    currentA = a;
    currentOp = op;
    currentB = b;
    expectedAnswer = calculaResposta(a, op, b);

    els.body.style.backgroundColor =
        bgColors[(state.currentSession * TOTAL_OPERATIONS + state.currentOperation) % bgColors.length];

    resetHelp();
    els.answerReveal.classList.remove('visible');
    els.resolutionPanel.style.display = 'none';

    updateHeader();
    activateOperation();
}

/**
 * Construeix la fila única: a OP b = [input] OK Ajuda
 * i obre el camp de resposta.
 */
function activateOperation() {
    if (state.isTransitioning) return;

    // Fila 1: a OP b = [input] — l'input s'alinea amb els nombres
    els.answerRow.innerHTML =
        numSpan(currentA) +
        `<span class="token-op">${currentOp}</span>` +
        numSpan(currentB) +
        `<span class="eq-sign">=</span>` +
        `<input type="text" id="value-input" autocomplete="off" aria-label="${TEXTOS.escriuResultat}">`;

    // Fila 2: [OK] [Ajuda] — centrada just sota l'input
    let actionRow = document.getElementById('action-row');
    if (!actionRow) {
        actionRow = document.createElement('div');
        actionRow.id = 'action-row';
        actionRow.className = 'action-row';
        els.answerRow.insertAdjacentElement('afterend', actionRow);
    }
    actionRow.innerHTML =
        `<button class="btn-submit" id="btn-submit-val" onclick="checkValue()">${TEXTOS.ok}</button>` +
        `<button class="btn-ajuda" onclick="toggleHelp()">${TEXTOS.ajuda}</button>`;

    els.answerReveal.classList.remove('visible');
    els.resolutionPanel.style.display = 'flex';

    if (isTouchDevice()) showCustomKeyboard(els.valueInput);
    else els.valueInput.focus();
}

function checkValue() {
    if (state.isTransitioning || isPenalizing) return;
    const raw = els.valueInput.value.trim();
    if (raw === '') return;
    if (!/^-?\d+$/.test(raw)) {
        shakeInput();
        penalize();
        return;
    }

    const userAnswer = parseInt(raw, 10);
    const question = `${fmtN(currentA)} ${currentOp} ${fmtN(currentB)}`;

    if (userAnswer !== expectedAnswer) {
        shakeInput();
        recordAnswerToHistory(question, raw, false);
        penalize();
        if (isTouchDevice()) kbMarkForOverwrite(els.valueInput);
        else {
            els.valueInput.value = '';
            els.valueInput.focus();
        }
        return;
    }

    recordAnswerToHistory(question, raw, true);
    hideCustomKeyboard();
    finishOperation(true);
}

function shakeInput() {
    els.btnSubmitVal.classList.add('error-shake');
    setTimeout(() => els.btnSubmitVal.classList.remove('error-shake'), 200);
}

function penalize() {
    if (isPenalizing || state.isTransitioning) return;
    isPenalizing = true;
    els.attemptsDisplay.classList.add('blink');

    setTimeout(() => {
        els.attemptsDisplay.classList.remove('blink');
        state.attemptsLeft--;
        updateHeader();

        if (state.attemptsLeft <= 0) {
            state.isTransitioning = true;
            hideCustomKeyboard();
            const ans = expectedAnswer;
            els.answerCorrectVal.textContent = ans;
            els.answerCorrectVal.className = `ans-val ${signClass(ans)}`;
            els.answerReveal.classList.add('visible');
            setTimeout(() => finishOperation(false), 2400);
        }

        isPenalizing = false;
    }, 700);
}

function finishOperation(success) {
    state.isTransitioning = true; // evita el doble enviament durant l'overlay (R1)
    const fails = MAX_INTENTS - state.attemptsLeft;
    const levelPoints = puntsPregunta(success, fails);
    state.sessionScore += levelPoints;

    const waitTime = showMiniOverlay(levelPoints);
    setTimeout(() => {
        hideMiniOverlay();
        if (state.currentOperation + 1 >= TOTAL_OPERATIONS) {
            endSession();
        } else {
            state.currentOperation++;
            window.buildLevel();
        }
    }, waitTime);
}

// ── Teclat físic ─────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    if (els.gameScreen.style.display === 'none') return;
    if (els.resolutionPanel.style.display === 'none') return;
    e.preventDefault();
    if (!state.isTransitioning) checkValue();
});

function checkCurrentCell() {
    checkValue();
}

// ── INICI ────────────────────────────────────────────────────────────────────

// Per als tests de navegador (vegeu registraProva a game-core.js)
registraProva(() => ({
    ocupat: isPenalizing,
    resposta: expectedAnswer,
    nivell: NIVELL,
    rang: RANG,
    operacio: { a: currentA, op: currentOp, b: currentB },
}));

injectSharedHTML();
validateConfig();
initCustomKeyboard({ allowNegative: true });
startGame();

// ── Botó Tutorial: fade-out i navega ─────────────────────────────────────────
document.getElementById('btn-tutorial').addEventListener('click', () => {
    const overlay = document.getElementById('fade-overlay');
    overlay.style.pointerEvents = 'all';
    overlay.style.opacity = '1';
    setTimeout(() => {
        window.location.href = 'a-enters-tutorial.html' + window.location.search;
    }, 800);
});
