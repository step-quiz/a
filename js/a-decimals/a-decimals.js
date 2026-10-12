/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-decimals/a-decimals.js
 * ROL: Controlador de l'activitat «Diners i canvi» (a-decimals.html): la botiga,
 *      el camp de resposta, l'ajuda, els passos, els intents i els punts. Abans
 *      era a dins de l'HTML.
 *      La lògica pura és a generador.js (les compres, els imports) i l'HTML de
 *      cada peça és a vista.js.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa config.js, game-core.js,
 *      generador.js, vista.js i textos.js. Vegeu la capçalera d'a-decimals.html per
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
import {
    NIVELL_MAXIM,
    crearGenerador,
    esCorrecte,
    formatImport,
    llegeixImport,
    llegeixParametres,
    respostaDelPas,
} from './generador.js';
import { TEXTOS } from './textos.js';
import { htmlAjuda, htmlBotiga, htmlEtiquetaPas, htmlParts, htmlPasFet, textPregunta } from './vista.js';

// Aquest fitxer és un mòdul ES: les seves funcions no són globals. Exposem a
// window només les que es criden des de fora: game-core.js (buildLevel,
// checkCurrentCell) i els onclick dels botons de l'HTML.
Object.assign(window, { checkValue, toggleHelp, buildLevel, checkCurrentCell });

const { nivell: NIVELL } = llegeixParametres(new URLSearchParams(window.location.search));
const generador = crearGenerador(NIVELL);

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
    shopDisplay: $('shop-display'),
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
let compra = null; // la compra de la pregunta (vegeu crearGenerador)
let numPas = 0; // quin pas de la compra toca: 0 o 1 (el nivell 3 en té dos)
let pasosFets = []; // l'HTML dels passos ja resolts
let expectedAnswer = 0; // la resposta del pas actual, en euros
let _helpVisible = false;

/** El pas actual: 'total' o 'canvi'. */
const pasActual = () => compra.passos[numPas];

// ── AJUDA ────────────────────────────────────────────────────────────────────

function toggleHelp() {
    _helpVisible = !_helpVisible;
    if (_helpVisible) {
        els.helpText.innerHTML = htmlAjuda(compra, pasActual());
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
    els.lvlDisplay.innerText = format(TEXTOS.compra, { n: state.currentOperation + 1, total: TOTAL_OPERATIONS });
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

    // Cada sessió comença sense recordar els canvis que ja han sortit
    if (state.currentOperation === 0) generador.reinicia();
    compra = generador.genera();
    numPas = 0;
    pasosFets = [];

    els.body.style.backgroundColor =
        bgColors[(state.currentSession * TOTAL_OPERATIONS + state.currentOperation) % bgColors.length];

    resetHelp();
    netejaResposta();
    updateHeader();
    mostraPas();
}

/** Posa a la pantalla el pas actual: la botiga, l'etiqueta («total» o «canvi»), els passos fets i el camp de resposta. */
function mostraPas() {
    const pas = pasActual();
    expectedAnswer = respostaDelPas(compra, pas) / 100;
    mostraInstruccio(pas === 'total' ? TEXTOS.escriuTotal : TEXTOS.escriuCanvi);

    // Al nivell 3 el bitllet no es veu mentre es demana el total: surt en passar al canvi
    els.shopDisplay.innerHTML = htmlBotiga(compra, pas !== 'total');
    els.stepPrompt.innerHTML = htmlEtiquetaPas(pas);
    els.stepsDone.innerHTML = pasosFets.join('');
    els.resolutionPanel.style.display = 'flex';

    els.valueInput.value = '';
    if (isTouchDevice()) showCustomKeyboard(els.valueInput);
    else els.valueInput.focus();
}

/** Treu de la pantalla el que quedava de la resposta anterior: les parts i la resposta revelada. */
function netejaResposta() {
    els.partFeedback.innerHTML = '';
    els.valueInput.classList.remove('reveal', 'kb-selected');
}

function checkValue() {
    if (state.isTransitioning || isPenalizing) return;
    const raw = els.valueInput.value.trim();
    if (raw === '') return;

    const pas = pasActual();
    const correcte = respostaDelPas(compra, pas);
    const llegit = llegeixImport(raw);

    // No és un import («3,,5», «,5»…): no es pot comparar amb res
    if (!llegit) {
        els.partFeedback.innerHTML = '';
        shakeInput();
        penalize();
        preparaNovaResposta();
        return;
    }

    const question = textPregunta(compra, pas);
    if (!esCorrecte(correcte, llegit.valor)) {
        // Cada part de la resposta (euros i cèntims) diu si és bona: sense frases
        els.partFeedback.innerHTML = htmlParts(correcte, raw);
        shakeInput();
        recordAnswerToHistory(question, raw, false);
        penalize();
        preparaNovaResposta();
        return;
    }

    recordAnswerToHistory(question, raw, true);
    avancaPas(correcte);
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

/** El pas és bo: es mostra l'import amb la coma (3.6 → 3,60) i es passa al pas següent o es tanca la pregunta. */
function avancaPas(centims) {
    els.valueInput.value = formatImport(centims).replace(' €', '');
    pasosFets.push(htmlPasFet(pasActual(), centims));
    els.partFeedback.innerHTML = '';
    resetHelp();

    if (numPas + 1 >= compra.passos.length) {
        hideCustomKeyboard();
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
            els.valueInput.value = formatImport(respostaDelPas(compra, pasActual())).replace(' €', '');
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
    pas: compra ? pasActual() : null,
    compra,
}));

injectSharedHTML();
validateConfig();
initCustomKeyboard({ allowNegative: true });
// Teclat tàctil: la coma pren el lloc del «−» (no hi ha imports negatius)
const teclaComa = document.querySelector('.kb-btn.kb-minus');
if (teclaComa) {
    teclaComa.dataset.key = ',';
    teclaComa.textContent = ',';
    teclaComa.classList.remove('kb-minus');
}
iniciaBotoNivellSeguent();
startGame();

// ── Botó Tutorial: fade-out i navega ─────────────────────────────────────────
$('btn-tutorial').addEventListener('click', () => {
    const overlay = $('fade-overlay');
    overlay.style.pointerEvents = 'all';
    overlay.style.opacity = '1';
    setTimeout(() => {
        window.location.href = 'a-decimals-tutorial.html' + window.location.search;
    }, 800);
});
