/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-prioritat/a-prioritat.js
 * ROL: Controlador de l'activitat «Prioritat d'operacions» (a-prioritat.html).
 *      L'alumne resol l'expressió operació a operació: toca el signe (o la
 *      potència) de l'operació que es pot fer ara i en tria el resultat entre
 *      quatre; cada pas s'escriu sota l'anterior, amb el resultat centrat sota
 *      l'operació d'on surt. Si toca una operació que encara no es pot fer,
 *      surt amb ✖ i les que calia fer abans amb ✔ (sense frases). Quan acaba
 *      (o s'esgoten els intents) es veu tota la resolució i el botó «Següent».
 *      Adaptació de js/prioritat/prioritat.js d'operacions (només la modalitat
 *      «Pas a pas»). La lògica pura és a generador.js i l'HTML a vista.js.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa config.js, game-core.js,
 *      utils.js, generador.js, vista.js i textos.js. Vegeu la capçalera
 *      d'a-prioritat.html per als paràmetres de la URL.
 * ============================================================================
 */
import { MAX_INTENTS, TOTAL_OPERATIONS, TOTAL_SESSIONS } from '../config.js';
import { shuffle } from '../utils.js';
import {
    state,
    bgColors,
    endSession,
    hideMiniOverlay,
    injectSharedHTML,
    isTouchDevice,
    puntsPregunta,
    recordAnswerToHistory,
    registraProva,
    showMiniOverlay,
    startGame,
    validateConfig,
} from '../game-core.js';
import { TEXTOS_COMUNS, format } from '../textos.js';
import {
    NIVELL_MAXIM,
    OP_SHOW,
    applyAt,
    blockers,
    generaExpressio,
    isDone,
    llegeixParametres,
    opValue,
    readyOps,
    solve,
    startLine,
    stepDistractors,
    textExpressio,
    textOperacio,
} from './generador.js';
import { TEXTOS } from './textos.js';
import { htmlBloqueig, htmlPregunta, htmlResultatEquivocat, htmlTaula } from './vista.js';

// Mòdul ES: exposem a window només el que es crida des de fora (game-core.js).
Object.assign(window, { buildLevel });

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
    stepsBox: $('steps-box'),
    stepInstruction: $('step-instruction'),
    feedback: $('feedback'),
    chipPool: $('chip-pool'),
    solutionBox: $('solution-box'),
};

// ── ESTAT LOCAL ──────────────────────────────────────────────────────────────

let finished = false; // la pregunta actual ja s'ha tancat
let tokens = []; // l'expressió de l'enunciat
let correctAnswer = null;
let rows = []; // les línies fetes [{ line, op, auto }]; l'última és la de treball
let phase = 'op'; // 'op': cal tocar l'operació · 'result': cal triar-ne el resultat

function updateHeader() {
    els.sessionDisplay.innerText = format(TEXTOS_COMUNS.sessio, { n: state.currentSession + 1, total: TOTAL_SESSIONS });
    els.lvlDisplay.innerText = format(TEXTOS.repte, { n: state.currentOperation + 1, total: TOTAL_OPERATIONS });
    els.nivellDisplay.innerText = format(TEXTOS_COMUNS.nivell, { n: NIVELL });
    els.scoreDisplay.innerText = format(TEXTOS_COMUNS.punts, { n: state.sessionScore });
    els.attemptsDisplay.innerText = format(TEXTOS_COMUNS.intents, { n: state.attemptsLeft });
    els.attemptsDisplay.className = 'attempts-counter' + (state.attemptsLeft < 2 ? ' danger' : '');
}

// ── LÒGICA PRINCIPAL ─────────────────────────────────────────────────────────

/** Cridat per game-core.js via startSession(): una expressió nova. */
function buildLevel() {
    state.attemptsLeft = MAX_INTENTS;
    state.isTransitioning = false;
    finished = false;

    const ex = generaExpressio(NIVELL, state.currentOperation, TOTAL_OPERATIONS);
    tokens = ex.toks;
    correctAnswer = ex.val;

    els.body.style.backgroundColor =
        bgColors[(state.currentSession * TOTAL_OPERATIONS + state.currentOperation) % bgColors.length];
    els.feedback.innerHTML = '';
    els.solutionBox.style.display = 'none';
    els.solutionBox.innerHTML = '';
    els.chipPool.style.display = 'flex';

    rows = [{ line: startLine(tokens), op: -1 }];
    askOp(); // abans de pintar: la línia de treball només té botons quan cal tocar una operació
    renderSteps();
    updateHeader();
}

/** marks (opcional): { red, green } amb Set de posicions de la línia de treball. */
function renderSteps(marks = {}) {
    const active = !finished && phase === 'op';
    const table = htmlTaula(rows, { active, red: marks.red, green: marks.green });
    // Si el focus era en un botó de la taula (teclat), torna al mateix botó de la taula nova
    const focused = els.stepsBox.contains(document.activeElement) ? document.activeElement.dataset.i : undefined;
    els.stepsBox.innerHTML = `<div class="taula-wrap">${table}</div>`;
    if (focused !== undefined) {
        const btn = els.stepsBox.querySelector(`.tok-btn[data-i="${focused}"]`);
        if (btn) btn.focus({ preventScroll: true });
    }
}

/** Fase 1: tocar l'operació que es pot fer ara (👆). */
function askOp() {
    phase = 'op';
    els.stepInstruction.textContent = '👆';
    els.chipPool.innerHTML = '';
}

/** Fase 2: triar el resultat de l'operació tocada («4 · 5 = ?») entre 4 opcions. */
function askResult() {
    phase = 'result';
    const { line, op } = rows[rows.length - 1];
    const values = shuffle([opValue(line, op), ...stepDistractors(line, op)]);
    els.stepInstruction.innerHTML = htmlPregunta(line, op);
    els.chipPool.innerHTML = '';
    values.forEach(val => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'num-chip';
        chip.textContent = val;
        chip.dataset.val = val;
        chip.addEventListener('click', () => handleStepResult(val, chip));
        els.chipPool.appendChild(chip);
    });
    // Amb teclat, el focus no es perd quan la taula es torna a pintar: va al primer resultat
    if (!isTouchDevice()) els.chipPool.querySelector('.num-chip').focus({ preventScroll: true });
}

/** L'alumne ha tocat l'operació de la posició i de la línia de treball. */
function handleStepOp(i) {
    if (state.isTransitioning || finished || phase !== 'op') return;
    const row = rows[rows.length - 1];
    const line = row.line;
    if (readyOps(line).includes(i)) {
        row.op = i;
        els.feedback.innerHTML = '';
        askResult();
        renderSteps();
        return;
    }
    const bl = blockers(line, i);
    if (!bl) return;
    renderSteps({ red: new Set([i]), green: new Set(bl.green) });
    els.feedback.innerHTML = htmlBloqueig(line, i, bl);
    recordAnswerToHistory(`${textExpressio(line)} (👆)`, OP_SHOW[bl.op], false);
    penalize();
}

/** L'alumne ha triat el resultat `val` de l'operació escollida. */
function handleStepResult(val, chip) {
    if (state.isTransitioning || finished || phase !== 'result') return;
    if (chip.classList.contains('chip-wrong')) return;
    const row = rows[rows.length - 1];
    if (val !== opValue(row.line, row.op)) {
        chip.classList.add('chip-wrong');
        els.feedback.innerHTML = htmlResultatEquivocat(row.line, row.op, val);
        recordAnswerToHistory(`${textOperacio(row.line, row.op)} = ?`, String(val), false);
        penalize();
        return;
    }
    const next = applyAt(row.line, row.op);
    rows.push({ line: next, op: -1 });
    els.feedback.innerHTML = '';
    if (isDone(next)) {
        recordAnswerToHistory(`${textExpressio(tokens)} = ?`, String(correctAnswer), true);
        finishOperation(true);
    } else {
        askOp();
        renderSteps();
        if (!isTouchDevice()) els.stepsBox.querySelector('.tok-btn').focus({ preventScroll: true });
    }
}

els.stepsBox.addEventListener('click', e => {
    const btn = e.target.closest('.tok-btn');
    if (btn) handleStepOp(Number(btn.dataset.i));
});

/** Sense intents: la resolució s'acaba sola (les línies que falten, en gris). */
function completeSteps() {
    const row = rows[rows.length - 1];
    if (phase === 'result') rows.push({ line: applyAt(row.line, row.op), op: -1, auto: true });
    const rest = solve(rows[rows.length - 1].line);
    rows[rows.length - 1].op = rest[0].op;
    rest.slice(1).forEach(r => rows.push({ line: r.line, op: r.op, auto: true }));
}

// ── INTENTS ──────────────────────────────────────────────────────────────────
// L'intent es descompta a l'instant; el parpelleig del comptador és només visual i no bloqueja l'entrada.

function penalize() {
    state.attemptsLeft--;
    updateHeader();
    const ad = els.attemptsDisplay;
    ad.classList.remove('blink-error');
    void ad.offsetWidth; // reinicia l'animació si ja estava activa
    ad.classList.add('blink-error');
    setTimeout(() => ad.classList.remove('blink-error'), 800);
    if (state.attemptsLeft <= 0) {
        state.isTransitioning = true; // ja no s'accepten més respostes
        setTimeout(() => finishOperation(false), 700); // temps per veure l'error abans de la solució
    }
}

// ── FI DE LA PREGUNTA: la resolució + el missatge + el botó «Següent» ────────
// (sense temporitzador: l'alumne decideix quan ha entès la resolució)

function finishOperation(ok) {
    if (finished) return;
    finished = true;
    state.isTransitioning = true;

    const fails = MAX_INTENTS - state.attemptsLeft;
    const levelPoints = puntsPregunta(ok, fails);
    state.sessionScore += levelPoints;
    updateHeader();

    els.chipPool.style.display = 'none';
    els.feedback.innerHTML = ''; // la taula ja no porta les marques
    if (!ok) completeSteps();
    renderSteps();
    els.stepInstruction.textContent = '';
    els.solutionBox.innerHTML = '';
    els.solutionBox.style.display = 'block';
    showMiniOverlay(levelPoints, { successColor: 'var(--primary-dark)' });

    const btn = document.createElement('button');
    btn.className = 'btn-next';
    btn.id = 'btn-next';
    btn.textContent = TEXTOS.seguent;
    btn.addEventListener('click', goNext);
    els.solutionBox.appendChild(btn);
    if (isTouchDevice()) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    else btn.focus({ preventScroll: true });
}

function goNext() {
    const btn = $('btn-next');
    if (!btn || btn.disabled) return;
    btn.disabled = true;
    hideMiniOverlay();
    if (state.currentOperation + 1 >= TOTAL_OPERATIONS) {
        endSession();
    } else {
        state.currentOperation++;
        window.buildLevel();
    }
}

// Enter = «Següent» (escriptori)
document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const btn = $('btn-next');
    if (btn && !btn.disabled && els.gameScreen.style.display !== 'none') {
        e.preventDefault();
        goNext();
    }
});

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
registraProva(() => ({
    ocupat: state.isTransitioning && !finished ? true : false,
    nivell: NIVELL,
    fase: phase,
    acabada: finished,
    tokens,
    resposta: correctAnswer,
    linia: rows.length ? rows[rows.length - 1] : null,
}));

injectSharedHTML();
validateConfig();
iniciaBotoNivellSeguent();
startGame();
