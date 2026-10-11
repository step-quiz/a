/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-mcd-mcm/a-mcd-mcm.js
 * ROL: Controlador de l'activitat «MCD i MCM» (a-mcd-mcm.html): els dos nombres,
 *      el camp de resposta, l'ajuda, els dos passos (MCD i MCM), els intents i
 *      els punts. Abans (a operacions) era a dins de l'HTML.
 *      La lògica pura és a generador.js i l'HTML de cada peça és a vista.js.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa config.js, game-core.js,
 *      generador.js, vista.js i textos.js. Vegeu la capçalera d'a-mcd-mcm.html per
 *      als paràmetres de la URL.
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
import {
    NIVELL_MAXIM,
    factorsALaVista,
    generaPregunta,
    llegeixParametres,
    llegeixResposta,
    respostaDelPas,
} from './generador.js';
import { TEXTOS } from './textos.js';
import { htmlAjuda, htmlEtiquetaPas, htmlNombres, htmlPasFet, htmlResposta, textPregunta } from './vista.js';

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
    numbersDisplay: $('numbers-display'),
    resolutionPanel: $('resolution-panel'),
    stepsDone: $('steps-done'),
    stepPrompt: $('step-prompt'),
    valueInput: $('value-input'),
    btnSubmitVal: $('btn-submit-val'),
    partFeedback: $('part-feedback'),
    helpText: $('help-text'),
};

// ── ESTAT LOCAL ──────────────────────────────────────────────────────────────

let isPenalizing = false;
let pregunta = null; // la pregunta (vegeu generaPregunta)
let numPas = 0; // quin pas toca: 0 (MCD) o 1 (MCM)
let pasosFets = []; // l'HTML dels passos ja resolts
let expectedAnswer = 0;
let _helpVisible = false;

/** El pas actual: 'mcd' o 'mcm'. */
const pasActual = () => pregunta.passos[numPas];

// ── AJUDA ────────────────────────────────────────────────────────────────────

function toggleHelp() {
    _helpVisible = !_helpVisible;
    if (_helpVisible) {
        // Als nivells 2 i 3 la factorització no és a la vista: surt amb l'ajuda
        els.helpText.innerHTML = htmlAjuda(pregunta, pasActual(), !factorsALaVista(NIVELL));
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
    els.lvlDisplay.innerText = format(TEXTOS.parell, { n: state.currentOperation + 1, total: TOTAL_OPERATIONS });
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

    pregunta = generaPregunta(NIVELL);
    numPas = 0;
    pasosFets = [];

    els.body.style.backgroundColor =
        bgColors[(state.currentSession * TOTAL_OPERATIONS + state.currentOperation) % bgColors.length];

    els.numbersDisplay.innerHTML = htmlNombres(pregunta, factorsALaVista(NIVELL));
    resetHelp();
    netejaResposta();
    updateHeader();
    mostraPas();
}

/** Posa a la pantalla el pas actual: la sigla amb els nombres, els passos fets i el camp de resposta. */
function mostraPas() {
    expectedAnswer = respostaDelPas(pregunta, pasActual());
    els.stepPrompt.innerHTML = htmlEtiquetaPas(pasActual(), pregunta);
    els.stepsDone.innerHTML = pasosFets.join('');
    els.resolutionPanel.style.display = 'flex';

    els.valueInput.value = '';
    if (isTouchDevice()) showCustomKeyboard(els.valueInput);
    else els.valueInput.focus();
}

/** Treu de la pantalla el que quedava de la resposta anterior: el nombre equivocat i la resposta revelada. */
function netejaResposta() {
    els.partFeedback.innerHTML = '';
    els.valueInput.classList.remove('reveal', 'kb-selected');
}

function checkValue() {
    if (state.isTransitioning || isPenalizing) return;
    const raw = els.valueInput.value.trim();
    if (raw === '') return;

    const pas = pasActual();
    const correcta = respostaDelPas(pregunta, pas);
    const resposta = llegeixResposta(raw);
    const question = textPregunta(pas, pregunta);

    if (resposta === correcta) {
        recordAnswerToHistory(question, raw, true);
        avancaPas(correcta);
        return;
    }

    // Una resposta equivocada: dues divisions amb ✔ o ✖ (és divisor o múltiple dels dos nombres?), sense frases (si no és un nombre, només s'espolsa el botó)
    els.partFeedback.innerHTML = resposta === null ? '' : htmlResposta(pregunta, pas, resposta);
    shakeInput();
    recordAnswerToHistory(question, raw, false);
    penalize();
    preparaNovaResposta();
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

/** El pas és bo: es passa al pas següent o es tanca la pregunta. */
function avancaPas(valor) {
    pasosFets.push(htmlPasFet(pasActual(), pregunta, valor));
    els.partFeedback.innerHTML = '';
    resetHelp();

    if (numPas + 1 >= pregunta.passos.length) {
        hideCustomKeyboard();
        els.stepsDone.innerHTML = pasosFets.join('');
        els.resolutionPanel.style.display = 'flex';
        els.stepPrompt.innerHTML = '';
        finishOperation(true);
    } else {
        numPas++;
        mostraPas();
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
            // La resposta correcta, dins del mateix camp i en verd
            els.partFeedback.innerHTML = '';
            els.valueInput.classList.remove('kb-selected');
            els.valueInput.classList.add('reveal');
            els.valueInput.value = String(respostaDelPas(pregunta, pasActual()));
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

/** «Nivell 2 ›»: recarrega l'activitat amb el nivell següent (només es puja, mai es baixa; el 3 és el màxim). */
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
registraProva(() => ({
    ocupat: isPenalizing,
    resposta: expectedAnswer,
    nivell: NIVELL,
    pas: pregunta ? pasActual() : null,
    pregunta,
}));

injectSharedHTML();
validateConfig();
initCustomKeyboard({ allowNegative: false });
iniciaBotoNivellSeguent();
startGame();
