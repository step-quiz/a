/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-enters-ordenar/a-enters-ordenar.js
 * ROL: Controlador de l'activitat «Ordenar enters» (a-enters-ordenar.html): els
 *      tres tipus de repte (signe, enter entre dos i menors que r), els intents i
 *      els punts. La lògica pura és a generador.js.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa config.js, game-core.js,
 *      generador.js i textos.js. Vegeu la capçalera d'a-enters-ordenar.html.
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
import { avaluaMenors, esEntre, formatNum, generaRepte, textPregunta, tipusDeRepte } from './generador.js';
import { TEXTOS } from './textos.js';

// Mòdul ES: exposem a window només el que es crida des de fora (game-core.js i els onclick de l'HTML).
Object.assign(window, { checkSigne, checkEntre, checkMenors, buildLevel, checkCurrentCell });

// ── ELEMENTS DOM ─────────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);
const els = {
    body: document.body,
    gameScreen: $('game-screen'),
    sessionDisplay: $('session-display'),
    lvlDisplay: $('lvl-display'),
    scoreDisplay: $('score-display'),
    attemptsDisplay: $('attempts-display'),
    expressionBox: $('expression-box'),
    resolutionPanel: $('resolution-panel'),
    stepSigne: $('step-signe'),
    stepEntre: $('step-entre'),
    stepMenors: $('step-menors'),
    btnSubmitVal: $('btn-submit-val'),
    btnSubmitMenors: $('btn-submit-menors'),
    menorsTitle: $('menors-title'),
    menorsGrid: $('menors-grid'),
};

// ── ESTAT LOCAL ──────────────────────────────────────────────────────────────

let isPenalizing = false;
let tipus = 1;
let repte = {};
/** Repte 3: els índexs dels nombres ja encertats (queden bloquejats en verd). */
let bloquejats = new Set();

const input = () => $('value-input');

// Posicions dels 8 nombres del repte 3 (% de l'ample i de l'alt de la graella), escampats a propòsit
const POSICIONS = [
    { x: 10, y: 80 },
    { x: 20, y: 40 },
    { x: 40, y: 20 },
    { x: 50, y: 60 },
    { x: 70, y: 60 },
    { x: 90, y: 30 },
    { x: 100, y: 80 },
    { x: 60, y: 30 },
];

// ── PANTALLA ─────────────────────────────────────────────────────────────────

function updateHeader() {
    els.sessionDisplay.innerText = format(TEXTOS_COMUNS.sessio, { n: state.currentSession + 1, total: TOTAL_SESSIONS });
    els.lvlDisplay.innerText = format(TEXTOS.repte, { n: state.currentOperation + 1, total: TOTAL_OPERATIONS });
    els.scoreDisplay.innerText = format(TEXTOS_COMUNS.punts, { n: state.sessionScore });
    els.attemptsDisplay.innerText = format(TEXTOS_COMUNS.intents, { n: state.attemptsLeft });
    els.attemptsDisplay.className = 'attempts-counter' + (state.attemptsLeft <= 2 ? ' danger' : '');
}

const num = (n, classe = 'highlight') => `<span class="token-num ${classe}">${formatNum(n)}</span>`;

/** Posa a la pantalla el repte actual. */
function mostraRepte() {
    updateHeader();
    for (const s of [els.stepSigne, els.stepEntre, els.stepMenors]) s.classList.remove('active');
    els.expressionBox.style.display = 'flex';
    els.resolutionPanel.style.display = 'flex';

    if (tipus === 1) {
        els.expressionBox.innerHTML = `${num(repte.p)}<span class="token-op auto-selected">?</span>${num(repte.q)}`;
        els.stepSigne.classList.add('active');
    } else if (tipus === 2) {
        els.expressionBox.innerHTML =
            `${num(repte.p)}<span class="token-sym">&lt;</span>` +
            `<input type="text" id="value-input" class="inline-input" autocomplete="off" aria-label="Escriu la resposta">` +
            `<span class="token-sym">&lt;</span>${num(repte.q)}`;
        els.stepEntre.classList.add('active');
        if (isTouchDevice()) showCustomKeyboard(input());
        else input().focus();
    } else {
        els.expressionBox.style.display = 'none';
        els.menorsTitle.innerHTML = `<span class="token-sym">▢ &lt;</span> ${num(repte.r, 'resolved-num')}`;
        dibuixaGraella();
        els.btnSubmitMenors.style.display = '';
        els.stepMenors.classList.add('active');
    }
}

/** Repte 3: els 8 nombres escampats; els encertats surten en verd i ja no es poden tocar. */
function dibuixaGraella() {
    els.menorsGrid.innerHTML = '';
    repte.nums.forEach((n, i) => {
        const btn = document.createElement('button');
        btn.className = 'btn-sign btn-num';
        btn.textContent = n;
        btn.setAttribute('aria-pressed', 'false');
        btn.style.left = `${POSICIONS[i].x}%`;
        btn.style.top = `${POSICIONS[i].y}%`;
        if (bloquejats.has(i)) bloqueja(btn);
        else
            btn.addEventListener('click', () => {
                if (isPenalizing || state.isTransitioning) return;
                const triat = btn.classList.toggle('selected');
                btn.setAttribute('aria-pressed', String(triat));
            });
        els.menorsGrid.appendChild(btn);
    });
}

function bloqueja(btn) {
    btn.classList.add('selected', 'locked');
    btn.setAttribute('aria-pressed', 'true');
    btn.disabled = true;
}

// ── LÒGICA PRINCIPAL ─────────────────────────────────────────────────────────

/** Cridat per game-core.js via startSession(). */
function buildLevel() {
    state.attemptsLeft = MAX_INTENTS;
    state.isTransitioning = false;
    isPenalizing = false;
    tipus = tipusDeRepte(state.currentOperation);
    repte = generaRepte(tipus);
    bloquejats = new Set();

    els.body.style.backgroundColor =
        bgColors[(state.currentSession * TOTAL_OPERATIONS + state.currentOperation) % bgColors.length];
    mostraRepte();
}

function shake(el) {
    el.classList.add('error-shake');
    setTimeout(() => el.classList.remove('error-shake'), 200);
}

function checkSigne(signe, boto) {
    if (state.isTransitioning || isPenalizing || tipus !== 1) return;
    const question = textPregunta(1, repte);
    if (signe !== repte.signe) {
        shake(boto);
        recordAnswerToHistory(question, signe, false);
        penalize();
        boto.blur();
        return;
    }
    recordAnswerToHistory(question, signe, true);
    mostraSolucioSigne(signe);
    finishOperation(true);
}

function mostraSolucioSigne(signe) {
    els.expressionBox.innerHTML = `${num(repte.p)}<span class="token-num resolved-num sign-big">${signe}</span>${num(repte.q)}`;
    els.stepSigne.classList.remove('active');
}

function checkEntre() {
    if (state.isTransitioning || isPenalizing || tipus !== 2) return;
    const raw = input().value.trim();
    if (raw === '') return;
    if (!/^-?\d+$/.test(raw)) {
        shake(input());
        shake(els.btnSubmitVal);
        penalize();
        return;
    }
    const question = textPregunta(2, repte);
    if (!esEntre(repte, parseInt(raw, 10))) {
        shake(input());
        shake(els.btnSubmitVal);
        recordAnswerToHistory(question, raw, false);
        penalize();
        if (isTouchDevice()) kbMarkForOverwrite(input());
        else {
            input().value = '';
            input().focus();
        }
        return;
    }
    recordAnswerToHistory(question, raw, true);
    input().classList.add('reveal');
    els.stepEntre.classList.remove('active');
    hideCustomKeyboard();
    finishOperation(true);
}

function checkMenors() {
    if (state.isTransitioning || isPenalizing || tipus !== 3) return;
    const botons = [...els.menorsGrid.querySelectorAll('.btn-sign')];
    const triats = botons.flatMap((b, i) => (b.classList.contains('selected') ? [i] : []));
    const { correcte, bons, dolents } = avaluaMenors(repte, triats);
    const question = textPregunta(3, repte);
    const resposta = triats.map(i => repte.nums[i]).join(', ') || '—';

    if (!correcte) {
        shake(els.btnSubmitMenors);
        recordAnswerToHistory(question, resposta, false);
        // Els encertats es queden en verd; els que no hi eren, es sacsegen i es deseleccionen
        for (const i of bons) {
            bloquejats.add(i);
            bloqueja(botons[i]);
        }
        for (const i of dolents) {
            const b = botons[i];
            shake(b);
            b.classList.remove('selected');
            b.setAttribute('aria-pressed', 'false');
        }
        penalize();
        return;
    }
    recordAnswerToHistory(question, resposta, true);
    botons.forEach(b => {
        if (b.classList.contains('selected')) bloqueja(b);
        b.disabled = true;
    });
    els.btnSubmitMenors.style.display = 'none';
    finishOperation(true);
}

function checkCurrentCell() {
    if (tipus === 2) checkEntre();
    if (tipus === 3) checkMenors();
}

/** Intents esgotats: es mostra la solució (el signe, un enter que serveix o els nombres menors). */
function revelaSolucio() {
    if (tipus === 1) mostraSolucioSigne(repte.signe);
    else if (tipus === 2) {
        input().value = repte.p + 1;
        input().classList.add('reveal');
    } else {
        [...els.menorsGrid.querySelectorAll('.btn-sign')].forEach((b, i) => {
            b.classList.remove('selected');
            b.disabled = true;
            if (repte.nums[i] < repte.r) bloqueja(b);
        });
        els.btnSubmitMenors.style.display = 'none';
    }
}

function penalize() {
    if (isPenalizing || state.isTransitioning) return;
    isPenalizing = true;
    els.attemptsDisplay.classList.add('blink');

    setTimeout(() => {
        els.attemptsDisplay.classList.remove('blink');
        state.attemptsLeft--;
        updateHeaderIntents();
        if (state.attemptsLeft <= 0) {
            state.isTransitioning = true;
            hideCustomKeyboard();
            revelaSolucio();
            setTimeout(() => finishOperation(false), 2400);
        }
        isPenalizing = false;
    }, 700);
}

function updateHeaderIntents() {
    els.attemptsDisplay.innerText = format(TEXTOS_COMUNS.intents, { n: state.attemptsLeft });
    els.attemptsDisplay.className = 'attempts-counter' + (state.attemptsLeft <= 2 ? ' danger' : '');
}

function finishOperation(success) {
    state.isTransitioning = true; // evita el doble enviament durant l'overlay (R1)
    const fails = MAX_INTENTS - state.attemptsLeft;
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

// ── Teclat físic ─────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    if (els.gameScreen.style.display === 'none') return;
    if (document.activeElement && document.activeElement.classList.contains('btn-sign')) return; // Intro prem el botó
    e.preventDefault();
    if (!state.isTransitioning) checkCurrentCell();
});

// ── INICI ────────────────────────────────────────────────────────────────────

// Per als tests de navegador (vegeu registraProva a game-core.js)
registraProva(() => ({ ocupat: isPenalizing, tipus, repte }));

injectSharedHTML();
validateConfig();
initCustomKeyboard({ allowNegative: true });
startGame();
