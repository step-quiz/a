/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-recta-numerica/a-recta-numerica.js
 * ROL: Controlador de l'activitat «Temperatura» (a-recta-numerica.html): dibuixa
 *      el gràfic i la pregunta, crea els botons d'opcions i porta els intents i
 *      els punts. La lògica pura és a generador.js i l'HTML, a vista.js.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa config.js, game-core.js,
 *      generador.js, vista.js i textos.js. Vegeu la capçalera d'a-recta-numerica.html.
 * ============================================================================
 */
import { MAX_INTENTS, TOTAL_OPERATIONS, TOTAL_SESSIONS } from '../config.js';
import {
    state,
    bgColors,
    endSession,
    hideMiniOverlay,
    injectSharedHTML,
    mostraInstruccio,
    puntsPregunta,
    recordAnswerToHistory,
    registraProva,
    showMiniOverlay,
    startGame,
    validateConfig,
} from '../game-core.js';
import { TEXTOS_COMUNS, format } from '../textos.js';
import {
    chooseYRange,
    etiquetaTemp,
    formaInstruccio,
    generaPregunta,
    generateCloud,
    llegeixParametres,
    textOpcio,
    textPregunta,
} from './generador.js';
import { TEXTOS } from './textos.js';
import { htmlGrafic, htmlPregunta } from './vista.js';

// Mòdul ES: exposem a window només el que es crida des de fora (game-core.js).
Object.assign(window, { buildLevel });

const { nivell: NIVELL } = llegeixParametres(new URLSearchParams(window.location.search));

// ── ELEMENTS DOM ─────────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);
const els = {
    body: document.body,
    sessionDisplay: $('session-display'),
    lvlDisplay: $('lvl-display'),
    nivellDisplay: $('nivell-display'),
    scoreDisplay: $('score-display'),
    attemptsDisplay: $('attempts-display'),
    graph: $('graph-container'),
    prompt: $('question-prompt'),
    options: $('options-container'),
};

// ── ESTAT LOCAL ──────────────────────────────────────────────────────────────

let isPenalizing = false;
let cloud = [];
let pregunta = null;

function updateHeader() {
    els.sessionDisplay.innerText = format(TEXTOS_COMUNS.sessio, { n: state.currentSession + 1, total: TOTAL_SESSIONS });
    els.lvlDisplay.innerText = format(TEXTOS.repte, { n: state.currentOperation + 1, total: TOTAL_OPERATIONS });
    els.nivellDisplay.innerText = format(TEXTOS_COMUNS.nivell, { n: NIVELL });
    els.scoreDisplay.innerText = format(TEXTOS_COMUNS.punts, { n: state.sessionScore });
    els.attemptsDisplay.innerText = format(TEXTOS_COMUNS.intents, { n: state.attemptsLeft });
    els.attemptsDisplay.className = 'attempts-counter' + (state.attemptsLeft <= 1 ? ' danger' : '');
}

// ── LA INSTRUCCIÓ ────────────────────────────────────────────────────────────

/** El text de la instrucció d'una pregunta (formaInstruccio diu quina toca). */
function textInstruccio(p) {
    const textos = {
        avui: TEXTOS.tempAvui,
        ahir: TEXTOS.tempAhir,
        dema: TEXTOS.tempDema,
        abansdahir: TEXTOS.tempAbansDahir,
        demapassat: TEXTOS.tempDemaPassat,
        passat: format(TEXTOS.tempPassat, { n: Math.abs(p.x) }),
        futur: format(TEXTOS.tempFutur, { n: Math.abs(p.x) }),
        recompte: p.tipus === 'Q3' ? format(TEXTOS.recompte, { temp: etiquetaTemp(p.y) }) : '',
        calent: TEXTOS.diaCalor,
        fred: TEXTOS.diaFred,
    };
    return textos[formaInstruccio(p)];
}

// ── LÒGICA PRINCIPAL ─────────────────────────────────────────────────────────

/** Cridat per game-core.js via startSession(): un gràfic nou i una pregunta nova. */
function buildLevel() {
    state.attemptsLeft = MAX_INTENTS;
    state.isTransitioning = false;
    isPenalizing = false;

    const yRange = chooseYRange(NIVELL);
    cloud = generateCloud(yRange);
    pregunta = generaPregunta(cloud, yRange, NIVELL);

    els.body.style.backgroundColor =
        bgColors[(state.currentSession * TOTAL_OPERATIONS + state.currentOperation) % bgColors.length];
    updateHeader();
    mostraInstruccio(textInstruccio(pregunta));

    // Al nivell 1 el dia de la pregunta surt ressaltat al gràfic
    const destaca = NIVELL === 1 && (pregunta.tipus === 'Q1' || pregunta.tipus === 'Q2') ? pregunta.x : null;
    els.graph.innerHTML = htmlGrafic(cloud, yRange, destaca);
    els.prompt.innerHTML = htmlPregunta(pregunta);

    els.options.innerHTML = '';
    pregunta.opcions.forEach((opcio, i) => {
        const btn = document.createElement('button');
        btn.className = 'btn-option';
        btn.textContent = textOpcio(pregunta, opcio);
        btn.addEventListener('click', () => checkAnswer(i, btn));
        els.options.appendChild(btn);
    });
}

const botons = () => [...els.options.querySelectorAll('.btn-option')];

function checkAnswer(i, btn) {
    if (state.isTransitioning || isPenalizing || btn.disabled) return;
    const opcio = pregunta.opcions[i];
    const question = textPregunta(pregunta);

    if (opcio.correcta) {
        recordAnswerToHistory(question, btn.textContent, true);
        btn.classList.add('correct');
        botons().forEach(b => (b.disabled = true));
        finishOperation(true);
        return;
    }

    recordAnswerToHistory(question, btn.textContent, false);
    btn.classList.add('wrong');
    btn.disabled = true;
    isPenalizing = true;
    els.attemptsDisplay.classList.add('blink');
    setTimeout(() => {
        els.attemptsDisplay.classList.remove('blink');
        state.attemptsLeft--;
        updateHeader();
        if (state.attemptsLeft <= 0) {
            state.isTransitioning = true;
            botons().forEach((b, k) => {
                b.disabled = true;
                if (pregunta.opcions[k].correcta) b.classList.add('reveal-answer');
            });
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
    document.getElementById('mini-victory-overlay').scrollIntoView({ block: 'nearest' });
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

// ── INICI ────────────────────────────────────────────────────────────────────

// Per als tests de navegador (vegeu registraProva a game-core.js)
registraProva(() => ({ ocupat: isPenalizing, nivell: NIVELL, pregunta, cloud }));

injectSharedHTML();
validateConfig();
startGame();
