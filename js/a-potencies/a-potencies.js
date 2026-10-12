/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-potencies/a-potencies.js
 * ROL: Controlador de l'activitat «Potències» (a-potencies.html): la pregunta,
 *      el camp de la resposta (l'exponent o el valor), l'ajuda, els intents i
 *      els punts. Adaptació de js/potencies/potencies.js d'operacions: sense
 *      frases ni menús, amb un sol camp i el motor nou.
 *      La lògica pura és a generador.js i l'HTML de cada peça és a vista.js.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa config.js, game-core.js,
 *      generador.js, vista.js i textos.js. Vegeu la capçalera d'a-potencies.html
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
import { NIVELL_MAXIM, comprovacio, esCorrecta, generaPregunta, llegeixParametres, textPregunta } from './generador.js';
import { TEXTOS } from './textos.js';
import { etiquetaResposta, htmlAjuda, htmlComprovacio, htmlPregunta } from './vista.js';

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
    preguntaDisplay: $('equation-display'),
    answerRow: $('answer-row'),
    etiqueta: $('answer-x-label'),
    resolutionPanel: $('resolution-panel'),
    valueInput: $('value-input'),
    btnSubmitVal: $('btn-submit-val'),
    partFeedback: $('part-feedback'),
    helpText: $('help-text'),
};

// ── ESTAT LOCAL ──────────────────────────────────────────────────────────────

let isPenalizing = false;
let pregunta = null; // la pregunta (vegeu generaPregunta)
let ajuda = 0; // 0 = res, 1 = la pregunta com a productes, 2 = el pas següent
let usades = new Set(); // les preguntes ja fetes en aquesta sessió (per no repetir)

// ── AJUDA ────────────────────────────────────────────────────────────────────

/** El 💡 va passant: la pregunta escrita com a productes → el pas següent → res. */
function toggleHelp() {
    ajuda = (ajuda + 1) % 3;
    els.helpText.innerHTML = htmlAjuda(pregunta, ajuda);
    els.helpText.classList.toggle('visible', ajuda > 0);
}

// ── CAPÇALERA ────────────────────────────────────────────────────────────────

function updateHeader() {
    els.sessionDisplay.innerText = format(TEXTOS_COMUNS.sessio, { n: state.currentSession + 1, total: TOTAL_SESSIONS });
    els.lvlDisplay.innerText = format(TEXTOS.potencia, { n: state.currentOperation + 1, total: TOTAL_OPERATIONS });
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

    if (state.currentOperation === 0) usades = new Set();
    let intents = 0;
    do {
        pregunta = generaPregunta(NIVELL);
        intents++;
    } while (usades.has(textPregunta(pregunta)) && intents < 30);
    usades.add(textPregunta(pregunta));

    els.body.style.backgroundColor =
        bgColors[(state.currentSession * TOTAL_OPERATIONS + state.currentOperation) % bgColors.length];

    els.helpText.innerHTML = '';
    els.helpText.classList.remove('visible');
    els.partFeedback.innerHTML = '';
    els.valueInput.value = '';
    els.valueInput.classList.remove('reveal', 'kb-selected');

    updateHeader();
    mostraInstruccio(pregunta.kind === 'exp' ? TEXTOS.escriuExponent : TEXTOS.escriuResultat);
    els.preguntaDisplay.innerHTML = htmlPregunta(pregunta);
    els.etiqueta.innerHTML = etiquetaResposta(pregunta);
    els.answerRow.classList.toggle('exponent', pregunta.kind === 'exp');
    els.resolutionPanel.style.display = 'flex';

    if (isTouchDevice()) showCustomKeyboard(els.valueInput);
    else els.valueInput.focus();
}

function checkValue() {
    if (state.isTransitioning || isPenalizing) return;
    const raw = els.valueInput.value.trim();
    if (raw === '') return;
    const r = parseStrictInt(raw);
    const question = textPregunta(pregunta);

    if (Number.isNaN(r)) {
        // No és un nombre: res a comprovar amb xifres
        shakeInput();
        recordAnswerToHistory(question, raw, false);
        penalize();
        preparaNovaResposta();
        return;
    }
    if (!esCorrecta(pregunta, r)) {
        // La resposta comprovada amb xifres: «3⁵ = 243 ≠ 729 ✖», sense frases
        els.partFeedback.innerHTML = htmlComprovacio(comprovacio(pregunta, r));
        shakeInput();
        recordAnswerToHistory(question, raw, false);
        penalize();
        preparaNovaResposta();
        return;
    }

    recordAnswerToHistory(question, raw, true);
    hideCustomKeyboard();
    finishPregunta(true);
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
            els.valueInput.value = String(pregunta.solucio);
            setTimeout(() => finishPregunta(false), 2400);
        }

        isPenalizing = false;
    }, 700);
}

function finishPregunta(success) {
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
registraProva(() => ({ ocupat: isPenalizing, resposta: pregunta ? pregunta.solucio : 0, nivell: NIVELL, pregunta }));

injectSharedHTML();
validateConfig();
initCustomKeyboard({ allowNegative: true }); // la resposta pot ser negativa (base negativa, exponent negatiu)
iniciaBotoNivellSeguent();
startGame();
