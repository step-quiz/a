/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-triangle-rectangle/a-triangle-rectangle.js
 * ROL: Controlador de l'activitat «Triangle rectangle» (a-triangle-rectangle.html):
 *      el triangle, les quatre opcions de resposta, l'ajuda, els intents i els
 *      punts. Abans (a operacions) era a dins de l'HTML.
 *      La lògica pura és a generador.js i l'HTML de cada peça és a vista.js.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa config.js, game-core.js,
 *      generador.js, vista.js i textos.js. Vegeu la capçalera de
 *      a-triangle-rectangle.html per als paràmetres de la URL.
 * ============================================================================
 */
import { MAX_INTENTS, TOTAL_OPERATIONS, TOTAL_SESSIONS } from '../config.js';
import {
    state,
    bgColors,
    endSession,
    hideMiniOverlay,
    injectSharedHTML,
    puntsPregunta,
    recordAnswerToHistory,
    registraProva,
    showMiniOverlay,
    startGame,
    validateConfig,
} from '../game-core.js';
import { TEXTOS_COMUNS, format } from '../textos.js';
import { NIVELL_MAXIM, crearGenerador, llegeixParametres } from './generador.js';
import { TEXTOS } from './textos.js';
import { htmlAjuda, htmlTriangle, textPregunta } from './vista.js';

// Aquest fitxer és un mòdul ES: les seves funcions no són globals. Exposem a
// window només les que es criden des de fora: game-core.js (buildLevel) i els onclick de l'HTML.
Object.assign(window, { buildLevel, toggleHelp });

const { nivell: NIVELL } = llegeixParametres(new URLSearchParams(window.location.search));
const generador = crearGenerador(NIVELL);

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
    triangle: $('triangle-container'),
    options: $('options-container'),
    helpText: $('help-text'),
};

// ── ESTAT LOCAL ──────────────────────────────────────────────────────────────

let isPenalizing = false;
let problema = null; // el problema (vegeu PROBLEMES)
let opcions = []; // [{ valor, correcta }]
let ajuda = 0; // 0 = res, 1 = la fórmula, 2 = la fórmula amb els valors

// ── AJUDA ────────────────────────────────────────────────────────────────────

/** El 💡 va passant: la fórmula → la fórmula amb els valors → res. */
function toggleHelp() {
    ajuda = (ajuda + 1) % 3;
    els.helpText.innerHTML = htmlAjuda(problema, ajuda);
    els.helpText.classList.toggle('visible', ajuda > 0);
}

// ── CAPÇALERA ────────────────────────────────────────────────────────────────

function updateHeader() {
    els.sessionDisplay.innerText = format(TEXTOS_COMUNS.sessio, { n: state.currentSession + 1, total: TOTAL_SESSIONS });
    els.lvlDisplay.innerText = format(TEXTOS.repte, { n: state.currentOperation + 1, total: TOTAL_OPERATIONS });
    els.nivellDisplay.innerText = format(TEXTOS_COMUNS.nivell, { n: NIVELL });
    els.scoreDisplay.innerText = format(TEXTOS_COMUNS.punts, { n: state.sessionScore });
    els.attemptsDisplay.innerText = format(TEXTOS_COMUNS.intents, { n: state.attemptsLeft });
    els.attemptsDisplay.className = 'attempts-counter' + (state.attemptsLeft <= 1 ? ' danger' : '');
}

// ── LÒGICA PRINCIPAL ─────────────────────────────────────────────────────────

/** Cridat per game-core.js via startSession(). */
function buildLevel() {
    state.attemptsLeft = MAX_INTENTS;
    state.isTransitioning = false;
    isPenalizing = false;
    ajuda = 0;

    // Cada sessió comença sense recordar els problemes que ja han sortit
    if (state.currentOperation === 0) generador.reinicia();
    ({ problema, opcions } = generador.genera());

    els.body.style.backgroundColor =
        bgColors[(state.currentSession * TOTAL_OPERATIONS + state.currentOperation) % bgColors.length];
    updateHeader();

    els.triangle.innerHTML = htmlTriangle(problema);
    els.helpText.innerHTML = '';
    els.helpText.classList.remove('visible');

    els.options.innerHTML = '';
    opcions.forEach((opcio, i) => {
        const btn = document.createElement('button');
        btn.className = 'btn-option';
        btn.textContent = opcio.valor;
        btn.addEventListener('click', () => checkAnswer(i, btn));
        els.options.appendChild(btn);
    });
}

const botons = () => [...els.options.querySelectorAll('.btn-option')];

function checkAnswer(i, btn) {
    if (state.isTransitioning || isPenalizing || btn.disabled) return;
    const opcio = opcions[i];
    const question = textPregunta(problema);

    if (opcio.correcta) {
        recordAnswerToHistory(question, opcio.valor, true);
        btn.classList.add('correct');
        botons().forEach(b => (b.disabled = true));
        finishOperation(true);
        return;
    }

    // Una opció equivocada es marca amb ✖ i ja no es pot tornar a triar
    recordAnswerToHistory(question, opcio.valor, false);
    btn.classList.add('wrong');
    btn.textContent = `${opcio.valor} ✖`;
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
                if (opcions[k].correcta) b.classList.add('reveal-answer');
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
registraProva(() => ({ ocupat: isPenalizing, nivell: NIVELL, problema, opcions }));

injectSharedHTML();
validateConfig();
iniciaBotoNivellSeguent();
startGame();
