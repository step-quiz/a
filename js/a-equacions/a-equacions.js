/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-equacions/a-equacions.js
 * ROL: Controlador de l'activitat «Equacions» (a-equacions.html): l'equació, el
 *      camp de la x, l'ajuda, els intents i els punts. Abans era a dins de
 *      l'HTML i anava amb el motor antic (ja retirat).
 *      La lògica pura és a generador.js i l'HTML de cada peça és a vista.js.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa config.js, game-core.js,
 *      generador.js, vista.js i textos.js. Vegeu la capçalera d'a-equacions.html
 *      per als paràmetres de la URL.
 * ============================================================================
 */
import { MAX_INTENTS, TOTAL_OPERATIONS, TOTAL_SESSIONS } from '../config.js';
import { parseStrictInt } from '../utils.js';
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
    mostraInstruccio,
    puntsPregunta,
    recordAnswerToHistory,
    registraProva,
    showCustomKeyboard,
    showMiniOverlay,
    startGame,
    validateConfig,
} from '../game-core.js';
import { TEXTOS_COMUNS, format } from '../textos.js';
import { NIVELL_MAXIM, esSolucio, generaEquacio, llegeixParametres, textEquacio } from './generador.js';
import { TEXTOS } from './textos.js';
import { htmlAjuda, htmlEquacio, htmlSubstitucio } from './vista.js';

// Aquest fitxer és un mòdul ES: les seves funcions no són globals. Exposem a
// window només les que es criden des de fora: game-core.js (buildLevel,
// checkCurrentCell) i els onclick dels botons de l'HTML.
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
    btnNextLevel: $('btn-next-level'),
    equationDisplay: $('equation-display'),
    resolutionPanel: $('resolution-panel'),
    valueInput: $('value-input'),
    btnSubmitVal: $('btn-submit-val'),
    partFeedback: $('part-feedback'),
    helpText: $('help-text'),
};

// ── ESTAT LOCAL ──────────────────────────────────────────────────────────────

let isPenalizing = false;
let equacio = null; // l'equació (vegeu generaEquacio)
let ajuda = 0; // 0 = res, 1 = caixes i caramels, 2 = i l'operació

// ── AJUDA ────────────────────────────────────────────────────────────────────

/** El 💡 va passant: el dibuix de caixes i caramels → el dibuix i l'operació → res. */
function toggleHelp() {
    ajuda = (ajuda + 1) % 3;
    els.helpText.innerHTML = htmlAjuda(equacio, ajuda);
    els.helpText.classList.toggle('visible', ajuda > 0);
}

// ── CAPÇALERA ────────────────────────────────────────────────────────────────

function updateHeader() {
    els.sessionDisplay.innerText = format(TEXTOS_COMUNS.sessio, { n: state.currentSession + 1, total: TOTAL_SESSIONS });
    els.lvlDisplay.innerText = format(TEXTOS.equacio, { n: state.currentOperation + 1, total: TOTAL_OPERATIONS });
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
    ajuda = 0;

    equacio = generaEquacio(NIVELL);

    els.body.style.backgroundColor =
        bgColors[(state.currentSession * TOTAL_OPERATIONS + state.currentOperation) % bgColors.length];

    els.helpText.innerHTML = '';
    els.helpText.classList.remove('visible');
    els.partFeedback.innerHTML = '';
    els.valueInput.value = '';
    els.valueInput.classList.remove('reveal', 'kb-selected');

    updateHeader();
    mostraInstruccio(format(TEXTOS.instruccio, { x: 'x' }));
    els.equationDisplay.innerHTML = htmlEquacio(equacio);
    els.resolutionPanel.style.display = 'flex';

    if (isTouchDevice()) showCustomKeyboard(els.valueInput);
    else els.valueInput.focus();
}

function checkValue() {
    if (state.isTransitioning || isPenalizing) return;
    const raw = els.valueInput.value.trim();
    if (raw === '') return;
    const x = parseStrictInt(raw);
    const question = textEquacio(equacio);

    if (Number.isNaN(x)) {
        // No és un nombre: res a comprovar per substitució
        shakeInput();
        recordAnswerToHistory(question, `x = ${raw}`, false);
        penalize();
        preparaNovaResposta();
        return;
    }
    if (!esSolucio(equacio, x)) {
        // La resposta substituïda a l'equació: «4 + 3 = 7 ≠ 8 ✖», sense frases
        els.partFeedback.innerHTML = htmlSubstitucio(equacio, x);
        shakeInput();
        recordAnswerToHistory(question, `x = ${raw}`, false);
        penalize();
        preparaNovaResposta();
        return;
    }

    recordAnswerToHistory(question, `x = ${raw}`, true);
    hideCustomKeyboard();
    finishEquation(true);
}

/** Deixa el camp a punt per tornar-ho a provar: buit i amb el focus (en tàctil, la propera tecla esborra el que hi ha). */
function preparaNovaResposta() {
    if (isTouchDevice()) {
        kbMarkForOverwrite(els.valueInput);
    } else {
        els.valueInput.value = '';
        els.valueInput.focus();
    }
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
            // La solució, dins del mateix camp i en verd
            els.partFeedback.innerHTML = '';
            els.valueInput.classList.remove('kb-selected');
            els.valueInput.classList.add('reveal');
            els.valueInput.value = String(equacio.xSol);
            setTimeout(() => finishEquation(false), 2400);
        }

        isPenalizing = false;
    }, 700);
}

function finishEquation(success) {
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

// ── BOTÓ PER PUJAR DE NIVELL ─────────────────────────────────────────────────

/** «Nivell 2 ›»: recarrega l'activitat amb el nivell següent (només es puja, mai es baixa; el 4 és el màxim). */
function iniciaBotoNivellSeguent() {
    if (NIVELL >= NIVELL_MAXIM) return;
    els.btnNextLevel.textContent = format(TEXTOS.nivellSeguent, { n: NIVELL + 1 });
    els.btnNextLevel.classList.add('visible');
    els.btnNextLevel.addEventListener('click', () => {
        const params = new URLSearchParams(window.location.search);
        params.set('nivell', NIVELL + 1);
        window.location.search = params.toString();
    });
}

// ── INICI ────────────────────────────────────────────────────────────────────

// Per als tests de navegador (vegeu registraProva a game-core.js)
registraProva(() => ({ ocupat: isPenalizing, resposta: equacio ? equacio.xSol : 0, nivell: NIVELL, equacio }));

injectSharedHTML();
validateConfig();
initCustomKeyboard({ allowNegative: false }); // la x sempre és positiva
// L'etiqueta «x =» davant del camp
$('answer-x-label').textContent = 'x';
iniciaBotoNivellSeguent();
startGame();

// ── Botó Tutorial: fade-out i navega ─────────────────────────────────────────
$('btn-tutorial').addEventListener('click', () => {
    const overlay = $('fade-overlay');
    overlay.style.pointerEvents = 'all';
    overlay.style.opacity = '1';
    setTimeout(() => {
        window.location.href = 'a-equacions-tutorial.html' + window.location.search;
    }, 800);
});
