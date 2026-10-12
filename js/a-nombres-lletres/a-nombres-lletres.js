/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-nombres-lletres/a-nombres-lletres.js
 * ROL: Controlador de l'activitat «Escriure nombres» (a-nombres-lletres.html):
 *      surt un nombre en xifres (52) i l'alumne tria, d'entre 5 opcions, com
 *      s'escriu en català («cinquanta-dos»). Té dues oportunitats i prou: si
 *      falla la primera, en té una altra; si falla també la segona, surt la bona.
 *      La lògica pura és a generador.js.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa config.js, game-core.js,
 *      generador.js, vista.js i textos.js. Vegeu la capçalera d'a-nombres-lletres.html
 *      per als paràmetres de la URL.
 * ============================================================================
 */
import { TOTAL_OPERATIONS, TOTAL_SESSIONS } from '../config.js';
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
import { INTENTS, NIVELL_MAXIM, generaPregunta, llegeixParametres, textOpcio, textPregunta } from './generador.js';
import { TEXTOS } from './textos.js';
import { htmlNombre } from './vista.js';

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
    btnNextLevel: $('btn-next-level'),
    prompt: $('question-prompt'),
    options: $('options-container'),
};

// ── ESTAT LOCAL ──────────────────────────────────────────────────────────────

let isPenalizing = false;
let pregunta = null;
let fetes = new Set(); // els nombres ja preguntats en aquesta sessió (per no repetir)

function updateHeader() {
    els.sessionDisplay.innerText = format(TEXTOS_COMUNS.sessio, { n: state.currentSession + 1, total: TOTAL_SESSIONS });
    els.lvlDisplay.innerText = format(TEXTOS.nombre, { n: state.currentOperation + 1, total: TOTAL_OPERATIONS });
    els.nivellDisplay.innerText = format(TEXTOS_COMUNS.nivell, { n: NIVELL });
    els.scoreDisplay.innerText = format(TEXTOS_COMUNS.punts, { n: state.sessionScore });
    els.attemptsDisplay.innerText = format(TEXTOS_COMUNS.intents, { n: state.attemptsLeft });
    els.attemptsDisplay.className = 'attempts-counter' + (state.attemptsLeft <= 1 ? ' danger' : '');
}

// ── LÒGICA PRINCIPAL ─────────────────────────────────────────────────────────

/** Cridat per game-core.js via startSession(): un nombre nou amb les seves 5 opcions. */
function buildLevel() {
    state.attemptsLeft = INTENTS; // dues oportunitats i prou, passi el que passi amb ?maxintents=
    state.isTransitioning = false;
    isPenalizing = false;
    if (state.currentOperation === 0) fetes = new Set();

    pregunta = generaPregunta(NIVELL, fetes);
    fetes.add(pregunta.n);

    els.body.style.backgroundColor =
        bgColors[(state.currentSession * TOTAL_OPERATIONS + state.currentOperation) % bgColors.length];
    updateHeader();
    mostraInstruccio(TEXTOS.instruccio);
    els.prompt.innerHTML = htmlNombre(pregunta.n);

    els.options.innerHTML = '';
    pregunta.opcions.forEach((opcio, i) => {
        const btn = document.createElement('button');
        btn.className = 'btn-option';
        btn.textContent = textOpcio(opcio);
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
            // La bona surt en verd
            state.isTransitioning = true;
            botons().forEach((b, k) => {
                b.disabled = true;
                if (pregunta.opcions[k].correcta) b.classList.add('reveal-answer');
            });
            setTimeout(() => finishOperation(false), 2600);
        }
        isPenalizing = false;
    }, 700);
}

function finishOperation(success) {
    state.isTransitioning = true; // evita el doble enviament durant l'overlay (R1)
    const fails = INTENTS - state.attemptsLeft;
    const levelPoints = puntsPregunta(success, fails);
    state.sessionScore += levelPoints;

    const waitTime = showMiniOverlay(levelPoints);
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
registraProva(() => ({ ocupat: isPenalizing, nivell: NIVELL, pregunta, resposta: pregunta ? pregunta.text : '' }));

injectSharedHTML();
validateConfig();
iniciaBotoNivellSeguent();
startGame();
