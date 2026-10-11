/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-proporciodirecta/a-proporciodirecta.js
 * ROL: Controlador de l'activitat «Proporcionalitat» (a-proporciodirecta.html):
 *      el problema, el camp de resposta, l'ajuda, els passos, els intents i els
 *      punts. Abans era a dins de l'HTML.
 *      La lògica pura és a generador.js i l'HTML de cada peça, a vista.js.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa config.js, game-core.js,
 *      generador.js, vista.js i textos.js. Vegeu la capçalera d'a-proporciodirecta.html
 *      per als paràmetres de la URL.
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
import { generaProblema, llegeixParametres } from './generador.js';
import { TEXTOS } from './textos.js';
import { htmlAjuda, htmlPasFet, htmlProblema, textPregunta } from './vista.js';

// Mòdul ES: exposem a window només el que es crida des de fora (game-core.js i els onclick de l'HTML).
Object.assign(window, { checkValue, toggleHelp, buildLevel, checkCurrentCell });

const { nivell: NIVELL } = llegeixParametres(new URLSearchParams(window.location.search));

// ── ELEMENTS DOM ─────────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);
const els = {
    body: document.body,
    gameScreen: $('game-screen'),
    sessionDisplay: $('session-display'),
    lvlDisplay: $('lvl-display'),
    nivellDisplay: $('nivell-display'),
    scoreDisplay: $('score-display'),
    attemptsDisplay: $('attempts-display'),
    problemDisplay: $('problem-display'),
    resolutionPanel: $('resolution-panel'),
    stepDone: $('step-done'),
    valueInput: $('value-input'),
    btnSubmitVal: $('btn-submit-val'),
    helpText: $('help-text'),
};

// ── ESTAT LOCAL ──────────────────────────────────────────────────────────────

let isPenalizing = false;
let problema = null;
let numPas = 0; // 0 o 1 (els nivells 2 i 3 en tenen dos)
let expectedAnswer = 0;
let _helpVisible = false;

// ── AJUDA ────────────────────────────────────────────────────────────────────

function toggleHelp() {
    _helpVisible = !_helpVisible;
    if (_helpVisible) {
        els.helpText.innerHTML = htmlAjuda(problema, numPas);
        els.helpText.classList.add('visible');
    } else {
        els.helpText.classList.remove('visible');
    }
}

function resetHelp() {
    _helpVisible = false;
    els.helpText.classList.remove('visible');
    els.helpText.textContent = '';
}

// ── CAPÇALERA ────────────────────────────────────────────────────────────────

function updateHeader() {
    els.sessionDisplay.innerText = format(TEXTOS_COMUNS.sessio, { n: state.currentSession + 1, total: TOTAL_SESSIONS });
    els.lvlDisplay.innerText = format(TEXTOS.problema, { n: state.currentOperation + 1, total: TOTAL_OPERATIONS });
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
    problema = generaProblema({ nivell: NIVELL });
    numPas = 0;

    els.body.style.backgroundColor =
        bgColors[(state.currentSession * TOTAL_OPERATIONS + state.currentOperation) % bgColors.length];

    resetHelp();
    els.stepDone.style.display = 'none';
    els.valueInput.classList.remove('reveal', 'kb-selected');
    updateHeader();
    mostraPas();
}

/** Posa a la pantalla el pas actual: les files del problema i el camp de resposta. */
function mostraPas() {
    expectedAnswer = problema.passos[numPas].resposta;
    els.problemDisplay.innerHTML = htmlProblema(problema, numPas);
    els.resolutionPanel.style.display = 'flex';
    els.valueInput.value = '';
    if (isTouchDevice()) showCustomKeyboard(els.valueInput);
    else els.valueInput.focus();
}

function checkValue() {
    if (state.isTransitioning || isPenalizing) return;
    const raw = els.valueInput.value.trim();
    if (raw === '') return;
    if (!/^\d+$/.test(raw)) {
        shakeInput();
        penalize();
        return;
    }

    const question = textPregunta(problema, numPas);
    if (parseInt(raw, 10) !== expectedAnswer) {
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
    if (numPas + 1 < problema.passos.length) {
        els.stepDone.innerHTML = htmlPasFet(problema, numPas);
        els.stepDone.style.display = 'block';
        numPas++;
        resetHelp();
        mostraPas();
        return;
    }
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
            // La resposta correcta, dins del mateix camp i en verd
            els.valueInput.classList.remove('kb-selected');
            els.valueInput.classList.add('reveal');
            els.valueInput.value = expectedAnswer;
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

    const waitTime = showMiniOverlay(levelPoints, {
        successColor: 'var(--primary-dark)',
        pointsColor: 'var(--primary)',
    });
    // La pàgina és alta: en pantalles petites el missatge quedaria sota la vora
    $('mini-victory-overlay').scrollIntoView({ block: 'nearest' });
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
    pas: numPas,
    problema,
}));

injectSharedHTML();
validateConfig();
initCustomKeyboard({ allowNegative: false });
startGame();

// ── Botó Tutorial: fade-out i navega ─────────────────────────────────────────
$('btn-tutorial').addEventListener('click', () => {
    const overlay = $('fade-overlay');
    overlay.style.pointerEvents = 'all';
    overlay.style.opacity = '1';
    setTimeout(() => {
        window.location.href = 'a-proporciodirecta-tutorial.html' + window.location.search;
    }, 800);
});
