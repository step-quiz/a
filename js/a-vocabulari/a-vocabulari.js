/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-vocabulari/a-vocabulari.js
 * ROL: Controlador de l'activitat «Vocabulari» (a-vocabulari.html): les paraules
 *      del lèxic que es poden dibuixar, treballades en tres nivells (imatge →
 *      triar la paraula; paraula → triar la imatge; imatge → escriure la
 *      paraula). Una resposta equivocada es marca ✖ (i, a l'escrita, lletra a
 *      lletra: ✔, ´ per a un accent, ✖, ⇄ per a dues lletres girades); si s'esgoten
 *      els intents, surt la bona. A l'escrita, una errada petita (un accent, una
 *      lletra, dues lletres girades, les paraules en un altre ordre…) no costa cap
 *      intent: surt on és i es pot corregir (avaluaEscrita, a generador.js).
 *      Adaptació, amb el lèxic d'a2, de js/vocabulari/ d'operacions.
 *      La lògica pura és a generador.js i l'HTML a vista.js.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa config.js, game-core.js,
 *      generador.js, vista.js, textos.js i el lèxic. Vegeu la capçalera
 *      d'a-vocabulari.html per als paràmetres de la URL.
 * ============================================================================
 */
import { MAX_INTENTS, TOTAL_OPERATIONS, TOTAL_SESSIONS } from '../config.js';
import {
    state,
    bgColors,
    endSession,
    hideMiniOverlay,
    injectSharedHTML,
    isTouchDevice,
    mostraInstruccio,
    puntsPregunta,
    recordAnswerToHistory,
    registraProva,
    showMiniOverlay,
    startGame,
    validateConfig,
} from '../game-core.js';
import { TEXTOS_COMUNS, format } from '../textos.js';
import { CLAU_VISTES, crearVistes } from '../lexicon/targeta.js';
import {
    NIVELL_MAXIM,
    avaluaEscrita,
    bancDeParaules,
    generaPregunta,
    llegeixParametres,
    textPregunta,
} from './generador.js';
import { TEXTOS } from './textos.js';
import { htmlAccents, htmlImatgeParaula, htmlLletres, htmlMesConcret } from './vista.js';

// Mòdul ES: exposem a window només el que es crida des de fora (game-core.js i els onclick de l'HTML).
Object.assign(window, { buildLevel, checkWritten, checkCurrentCell });

const {
    nivell: NIVELL,
    temes: TEMES_TRIATS,
    vistes: NOMES_VISTES,
} = llegeixParametres(new URLSearchParams(window.location.search));

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
    prompt: $('question-prompt'),
    options: $('options-container'),
    writeArea: $('write-area'),
    input: $('value-input'),
    accents: $('accents-bar'),
    partFeedback: $('part-feedback'),
};

// ── ESTAT LOCAL ──────────────────────────────────────────────────────────────

let isPenalizing = false;
let pregunta = null;
let fetes = new Set(); // les paraules ja preguntades en aquesta sessió (per no repetir)

function emmagatzematge() {
    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

/** El banc d'aquesta sessió (amb les paraules vistes si es demana ?vistes=1). */
const banc = bancDeParaules({
    temes: TEMES_TRIATS,
    vistes: NOMES_VISTES ? new Set(crearVistes(emmagatzematge()).llista()) : null,
});

function updateHeader() {
    els.sessionDisplay.innerText = format(TEXTOS_COMUNS.sessio, { n: state.currentSession + 1, total: TOTAL_SESSIONS });
    els.lvlDisplay.innerText = format(TEXTOS.repte, { n: state.currentOperation + 1, total: TOTAL_OPERATIONS });
    els.nivellDisplay.innerText = format(TEXTOS_COMUNS.nivell, { n: NIVELL });
    els.scoreDisplay.innerText = format(TEXTOS_COMUNS.punts, { n: state.sessionScore });
    els.attemptsDisplay.innerText = format(TEXTOS_COMUNS.intents, { n: state.attemptsLeft });
    els.attemptsDisplay.className = 'attempts-counter' + (state.attemptsLeft <= 1 ? ' danger' : '');
}

// ── LÒGICA PRINCIPAL ─────────────────────────────────────────────────────────

/** Cridat per game-core.js via startSession(): una paraula nova. */
function buildLevel() {
    state.attemptsLeft = MAX_INTENTS;
    state.isTransitioning = false;
    isPenalizing = false;
    if (state.currentOperation === 0) fetes = new Set();

    pregunta = generaPregunta(NIVELL, banc, fetes);
    fetes.add(pregunta.id);

    els.body.style.backgroundColor =
        bgColors[(state.currentSession * TOTAL_OPERATIONS + state.currentOperation) % bgColors.length];
    updateHeader();
    mostraInstruccio(NIVELL === 1 ? TEXTOS.triaParaula : NIVELL === 2 ? TEXTOS.triaImatge : TEXTOS.escriuParaula);
    els.options.innerHTML = '';
    els.partFeedback.innerHTML = '';
    els.input.value = '';
    els.input.classList.remove('reveal');
    els.writeArea.hidden = NIVELL !== 3;
    els.options.hidden = NIVELL === 3;
    els.options.classList.toggle('amb-imatges', NIVELL === 2);

    // Nivells 1 i 3: la imatge és la pregunta. Nivell 2: la pregunta és la paraula.
    els.prompt.innerHTML =
        NIVELL === 2 ? `<span class="paraula-gran">${pregunta.text}</span>` : htmlImatgeParaula(pregunta.id);

    if (NIVELL === 3) {
        if (isTouchDevice()) els.input.blur();
        else els.input.focus();
        return;
    }
    pregunta.opcions.forEach((opcio, i) => {
        const btn = document.createElement('button');
        btn.className = 'btn-option';
        if (NIVELL === 2) {
            btn.innerHTML = htmlImatgeParaula(opcio.id);
            btn.setAttribute('aria-label', opcio.text);
        } else {
            btn.textContent = opcio.text;
        }
        btn.addEventListener('click', () => checkAnswer(i, btn));
        els.options.appendChild(btn);
    });
}

const botons = () => [...els.options.querySelectorAll('.btn-option')];

/** Una opció (nivells 1 i 2). */
function checkAnswer(i, btn) {
    if (state.isTransitioning || isPenalizing || btn.disabled) return;
    const opcio = pregunta.opcions[i];
    const question = textPregunta(pregunta);

    if (opcio.correcta) {
        recordAnswerToHistory(question, opcio.text, true);
        btn.classList.add('correct');
        botons().forEach(b => (b.disabled = true));
        finishOperation(true);
        return;
    }
    recordAnswerToHistory(question, opcio.text, false);
    btn.classList.add('wrong');
    btn.disabled = true;
    penalize(() => {
        botons().forEach((b, k) => {
            b.disabled = true;
            if (pregunta.opcions[k].correcta) b.classList.add('reveal-answer');
        });
    });
}

/** La paraula escrita (nivell 3). */
function checkWritten() {
    if (state.isTransitioning || isPenalizing || NIVELL !== 3) return;
    const escrit = els.input.value.trim();
    if (escrit === '') return;
    const question = textPregunta(pregunta);
    const { veredicte, marques } = avaluaEscrita(pregunta, escrit);
    if (veredicte === 'correcta') {
        recordAnswerToHistory(question, escrit, true);
        els.partFeedback.innerHTML = htmlLletres(marques);
        els.input.classList.add('reveal');
        finishOperation(true);
        return;
    }
    if (veredicte === 'general') {
        // Una paraula més general, també certa («triangle» per a un triangle rectangle): no és un error ni costa cap intent
        els.partFeedback.innerHTML = htmlMesConcret(escrit);
        els.input.select();
        els.input.focus();
        return;
    }
    if (veredicte === 'propera') {
        // Una errada petita (un accent, una lletra, dues lletres girades, les paraules en un altre ordre, una paraula que
        // falta): no és un error ni costa cap intent. Surt on és i es pot corregir (com a «Vocabulari» d'operacions).
        els.partFeedback.innerHTML = htmlLletres(marques);
        els.input.select();
        els.input.focus();
        return;
    }
    recordAnswerToHistory(question, escrit, false);
    els.partFeedback.innerHTML = htmlLletres(marques);
    els.writeArea.classList.add('error-shake');
    setTimeout(() => els.writeArea.classList.remove('error-shake'), 200);
    penalize(() => {
        // La solució, dins del mateix camp i en verd
        els.input.classList.add('reveal');
        els.input.value = pregunta.solucio;
    });
}

/** Un intent menys; si no en queden, `revela` mostra la bona i la pregunta s'acaba. */
function penalize(revela) {
    isPenalizing = true;
    els.attemptsDisplay.classList.add('blink');
    setTimeout(() => {
        els.attemptsDisplay.classList.remove('blink');
        state.attemptsLeft--;
        updateHeader();
        if (state.attemptsLeft <= 0) {
            state.isTransitioning = true;
            revela();
            setTimeout(() => finishOperation(false), 2600);
        } else if (NIVELL === 3) {
            els.input.select();
            els.input.focus();
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

// ── La barra de lletres amb accent i el teclat ───────────────────────────────

els.accents.innerHTML = htmlAccents();
els.accents.addEventListener('click', e => {
    const b = e.target.closest('.btn-accent');
    if (!b || state.isTransitioning) return;
    const { selectionStart: a, selectionEnd: z, value } = els.input;
    els.input.value = value.slice(0, a) + b.dataset.lletra + value.slice(z);
    els.input.focus();
    els.input.setSelectionRange(a + 1, a + 1);
});

document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || NIVELL !== 3 || els.gameScreen.style.display === 'none') return;
    e.preventDefault();
    checkWritten();
});

function checkCurrentCell() {
    checkWritten();
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
    nivell: NIVELL,
    pregunta,
    banc,
    resposta: pregunta ? pregunta.solucio : '',
    clauVistes: CLAU_VISTES,
}));

injectSharedHTML();
validateConfig();
iniciaBotoNivellSeguent();
startGame();
