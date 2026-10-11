/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-factoritzar/a-factoritzar.js
 * ROL: Controlador de l'activitat «Factoritzar» (a-factoritzar.html): l'arbre
 *      de factors, els dos camps de la parella, l'ajuda, els intents i els
 *      punts. Abans (a operacions) era a dins de l'HTML.
 *      La lògica pura és a generador.js i l'HTML de cada peça és a vista.js.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa config.js, game-core.js,
 *      generador.js, vista.js i textos.js. Vegeu la capçalera d'a-factoritzar.html
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
    comprova,
    creaNode,
    generaNombre,
    llegeixFactor,
    llegeixParametres,
    parteix,
    pendents,
    solucio,
} from './generador.js';
import { TEXTOS } from './textos.js';
import { htmlAjuda, htmlArbreActual, htmlProva, htmlResultat, textPregunta, textResposta } from './vista.js';

// Aquest fitxer és un mòdul ES: les seves funcions no són globals. Exposem a
// window només les que es criden des de fora: game-core.js (buildLevel,
// checkCurrentCell) i els onclick dels botons de l'HTML.
Object.assign(window, { checkFactors, toggleHelp, buildLevel, checkCurrentCell });

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
    treeContainer: $('tree-container'),
    factResult: $('factorization-result'),
    resolutionPanel: $('resolution-panel'),
    stepTarget: $('step-target'),
    inpA: $('factor-a-input'),
    inpB: $('factor-b-input'),
    btnSubmit: $('btn-factor-submit'),
    partFeedback: $('part-feedback'),
    helpText: $('help-text'),
};

// ── ESTAT LOCAL ──────────────────────────────────────────────────────────────

let isPenalizing = false;
let isAdvancing = false; // entre un pas i el següent (l'arbre es dibuixa i surt el camp nou)
let nombre = 0; // el nombre a factoritzar
let arbre = null; // l'arbre de factors (vegeu creaNode)
let pendent = null; // el node que toca partir ara
let _helpVisible = false;

// ── AJUDA ────────────────────────────────────────────────────────────────────

function toggleHelp() {
    _helpVisible = !_helpVisible;
    if (_helpVisible && pendent) {
        els.helpText.innerHTML = htmlAjuda(pendent.valor, NIVELL);
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
    els.lvlDisplay.innerText = format(TEXTOS.nombre, { n: state.currentOperation + 1, total: TOTAL_OPERATIONS });
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
    isAdvancing = false;
    state.isTransitioning = false;

    nombre = generaNombre(NIVELL);
    arbre = creaNode(nombre);

    els.body.style.backgroundColor =
        bgColors[(state.currentSession * TOTAL_OPERATIONS + state.currentOperation) % bgColors.length];

    els.factResult.style.display = 'none';
    els.factResult.innerHTML = '';
    resetHelp();
    netejaResposta();
    updateHeader();
    dibuixaArbre();
    mostraPas();
}

function dibuixaArbre() {
    els.treeContainer.innerHTML = htmlArbreActual(arbre);
}

/** Posa a la pantalla el pas actual (el primer node pendent) o, si l'arbre és complet, el resultat. */
function mostraPas() {
    pendent = pendents(arbre)[0] ?? null;
    if (!pendent) {
        mostraResultat();
        return;
    }
    els.stepTarget.textContent = String(pendent.valor);
    els.resolutionPanel.style.display = 'flex';
    els.inpA.value = '';
    els.inpB.value = '';
    focusInicial();
}

/** El cursor a la primera casella (en tàctil, amb el teclat de la pantalla). */
function focusInicial() {
    if (isTouchDevice()) showCustomKeyboard(els.inpA);
    else els.inpA.focus();
}

/** Treu de la pantalla el que quedava de la resposta anterior: la parella equivocada i la resposta revelada. */
function netejaResposta() {
    els.partFeedback.innerHTML = '';
    for (const inp of [els.inpA, els.inpB]) inp.classList.remove('reveal', 'kb-selected');
}

function checkFactors() {
    if (state.isTransitioning || isPenalizing || isAdvancing || !pendent) return;
    const a = llegeixFactor(els.inpA.value);
    const b = llegeixFactor(els.inpB.value);

    // Falta algun nombre: res a comprovar (ni es penalitza)
    if (a === null || b === null) {
        shakeInput();
        return;
    }

    const question = textPregunta(pendent.valor);
    const answer = textResposta(a, b);
    if (!comprova(pendent.valor, a, b).ok) {
        // La parella amb el seu producte i ✖ (o el factor que no és més gran que 1): sense frases
        els.partFeedback.innerHTML = htmlProva(pendent.valor, a, b);
        shakeInput();
        recordAnswerToHistory(question, answer, false);
        penalize();
        preparaNovaResposta();
        return;
    }

    recordAnswerToHistory(question, answer, true);
    els.partFeedback.innerHTML = '';
    resetHelp();
    hideCustomKeyboard();
    parteix(pendent, a, b);
    dibuixaArbre();
    isAdvancing = true;
    setTimeout(() => {
        isAdvancing = false;
        mostraPas();
    }, 400);
}

/** Deixa els camps a punt per tornar-ho a provar: buits i amb el cursor a la primera casella. */
function preparaNovaResposta() {
    els.inpA.value = '';
    els.inpB.value = '';
    if (isTouchDevice()) showCustomKeyboard(els.inpA);
    else els.inpA.focus();
}

/** L'arbre és complet: surt «✅ 12 = 2² · 3» i es tanca la pregunta. */
function mostraResultat() {
    hideCustomKeyboard();
    els.resolutionPanel.style.display = 'none';
    els.factResult.innerHTML = `<div class="factorization-display">${htmlResultat(nombre)}</div>`;
    els.factResult.style.display = 'block';
    state.isTransitioning = true;
    setTimeout(() => finishOperation(true), 1200);
}

function shakeInput() {
    els.btnSubmit.classList.add('error-shake');
    setTimeout(() => els.btnSubmit.classList.remove('error-shake'), 200);
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
            // Una parella correcta, dins dels mateixos camps i en verd
            const [p, q] = solucio(pendent.valor);
            els.partFeedback.innerHTML = '';
            for (const inp of [els.inpA, els.inpB]) {
                inp.classList.remove('kb-selected');
                inp.classList.add('reveal');
            }
            els.inpA.value = String(p);
            els.inpB.value = String(q);
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

    els.resolutionPanel.style.display = 'none';
    const waitTime = showMiniOverlay(levelPoints);
    // La pàgina és alta: en pantalles petites el missatge quedaria sota la vora
    $('mini-victory-overlay').scrollIntoView({ block: 'nearest' });
    setTimeout(() => {
        hideMiniOverlay();
        els.treeContainer.innerHTML = '';
        els.factResult.style.display = 'none';
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
    if (els.gameScreen.style.display === 'none') return;
    if (e.key === 'Enter') {
        if (els.resolutionPanel.style.display === 'none') return;
        e.preventDefault();
        if (!state.isTransitioning) checkFactors();
    } else if (e.key === 'Tab' && document.activeElement === els.inpA) {
        // Tab salta de la primera casella a la segona (i d'allà, al botó OK)
        e.preventDefault();
        els.inpB.focus();
    }
});

/** El botó → del teclat de la pantalla: si només hi ha un camp ple, salta a l'altre; si no, comprova. */
function checkCurrentCell() {
    const aPle = els.inpA.value.trim() !== '';
    const bPle = els.inpB.value.trim() !== '';
    if (aPle && !bPle) showCustomKeyboard(els.inpB);
    else if (!aPle && bPle) showCustomKeyboard(els.inpA);
    else checkFactors();
}

// Tocar un camp, en tàctil, hi porta el teclat de la pantalla
for (const inp of [els.inpA, els.inpB]) inp.addEventListener('focus', () => isTouchDevice() && showCustomKeyboard(inp));

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
    ocupat: isPenalizing || isAdvancing,
    nivell: NIVELL,
    nombre,
    valor: pendent ? pendent.valor : null,
    // La parella correcta del pas actual (null si no n'hi ha cap de pendent)
    resposta: pendent ? solucio(pendent.valor) : null,
}));

injectSharedHTML();
validateConfig();
initCustomKeyboard({ allowNegative: false, allowZero: true });
iniciaBotoNivellSeguent();
startGame();
