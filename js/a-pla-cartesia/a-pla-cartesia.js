/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-pla-cartesia/a-pla-cartesia.js
 * ROL: Controlador de l'activitat «Coordenades» (a-pla-cartesia.html): el pla,
 *      el que es demana (tocar un punt, escriure'n les coordenades, triar el
 *      quadrant o escriure un punt d'un quadrant), els intents i els punts.
 *      Abans (a operacions) era a dins de l'HTML, amb dues seccions.
 *      La lògica pura és a generador.js, el dibuix a dibuix.js i l'HTML de
 *      cada peça a vista.js.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa config.js, game-core.js,
 *      generador.js, dibuix.js, vista.js i textos.js. Vegeu la capçalera
 *      d'a-pla-cartesia.html per als paràmetres de la URL.
 * ============================================================================
 */
import { MAX_INTENTS, TOTAL_OPERATIONS, TOTAL_SESSIONS } from '../config.js';
import { parseStrictInt } from '../utils.js';
import {
    state,
    bgColors,
    endSession,
    getKbActiveInput,
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
import { crearTauler } from './dibuix.js';
import {
    LLOCS_DEL_NIVELL,
    NIVELL_MAXIM,
    comprovaAlQuadrant,
    comprovaCoordenades,
    comprovaSitua,
    dinsDelPla,
    exemplePunt,
    formaInstruccio,
    generaPregunta,
    llegeixParametres,
} from './generador.js';
import { TEXTOS } from './textos.js';
import { ambCaselles, htmlDemana, htmlOpcioLloc, textPregunta, textPunt } from './vista.js';

// Aquest fitxer és un mòdul ES: les seves funcions no són globals. Exposem a
// window només les que es criden des de fora: game-core.js (buildLevel,
// checkCurrentCell) i els onclick dels botons de l'HTML.
Object.assign(window, { checkCoords, buildLevel, checkCurrentCell });

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
    demana: $('demana'),
    canvas: $('canvas-pla'),
    llocs: $('llocs'),
    coordArea: $('coord-area'),
    inputX: $('input-x'),
    inputY: $('input-y'),
    btnOk: $('btn-ok'),
    marca: $('marca'),
};
const tauler = crearTauler(els.canvas);

const BLAU = '#4f46e5';
const VERD = '#047857';
const VERMELL = '#dc2626';

// ── ESTAT LOCAL ──────────────────────────────────────────────────────────────

let isPenalizing = false;
let pregunta = null; // la pregunta (vegeu generaPregunta)
let xEncertada = false; // una casella encertada es queda bloquejada en verd
let yEncertada = false;

const punt = (p, color, etiqueta = '') => ({ x: p.x, y: p.y, color, etiqueta });

// ── CAPÇALERA ────────────────────────────────────────────────────────────────

function updateHeader() {
    els.sessionDisplay.innerText = format(TEXTOS_COMUNS.sessio, { n: state.currentSession + 1, total: TOTAL_SESSIONS });
    els.lvlDisplay.innerText = format(TEXTOS.repte, { n: state.currentOperation + 1, total: TOTAL_OPERATIONS });
    els.nivellDisplay.innerText = format(TEXTOS_COMUNS.nivell, { n: NIVELL });
    els.scoreDisplay.innerText = format(TEXTOS_COMUNS.punts, { n: state.sessionScore });
    els.attemptsDisplay.innerText = format(TEXTOS_COMUNS.intents, { n: state.attemptsLeft });
    els.attemptsDisplay.className = 'attempts-counter' + (state.attemptsLeft <= 2 ? ' danger' : '');
}

// ── LA INSTRUCCIÓ ────────────────────────────────────────────────────────────

/** El text de la instrucció d'una pregunta (formaInstruccio diu quina toca). */
function textInstruccio(p) {
    const punt = p.etiqueta;
    const textos = {
        'situa': format(TEXTOS.situa, { punt }),
        'coordenades': format(TEXTOS.coordenades, { punt }),
        'quadrant': format(TEXTOS.quadrant, { punt }),
        'on': format(TEXTOS.on, { punt }),
        'al-quadrant': TEXTOS.alQuadrant,
        'al-eix': TEXTOS.alEix,
        'a-lorigen': TEXTOS.origen,
    };
    return textos[formaInstruccio(p, NIVELL)];
}

// ── LÒGICA PRINCIPAL ─────────────────────────────────────────────────────────

/** Cridat per game-core.js via startSession(). */
function buildLevel() {
    state.attemptsLeft = MAX_INTENTS;
    isPenalizing = false;
    state.isTransitioning = false;
    xEncertada = false;
    yEncertada = false;

    pregunta = generaPregunta(NIVELL, state.currentOperation);

    els.body.style.backgroundColor =
        bgColors[(state.currentSession * TOTAL_OPERATIONS + state.currentOperation) % bgColors.length];

    // El pla, de l'amplada de la pantalla; es veu el punt si la pregunta el mostra
    tauler.ajusta(els.canvas.parentElement.clientWidth || 320);
    dibuixa(
        pregunta.tipus === 'coordenades' || pregunta.tipus === 'quadrant'
            ? [punt(pregunta.punt, BLAU, pregunta.etiqueta)]
            : []
    );
    els.canvas.classList.toggle('tocable', pregunta.tipus === 'situa');

    els.demana.innerHTML = htmlDemana(pregunta);
    els.marca.innerHTML = '';

    // Les opcions de quadrant (només a 'quadrant') i les caselles (a 'coordenades' i 'al-quadrant')
    els.llocs.innerHTML = '';
    els.llocs.hidden = pregunta.tipus !== 'quadrant';
    if (pregunta.tipus === 'quadrant') {
        for (const lloc of LLOCS_DEL_NIVELL[NIVELL]) {
            const btn = document.createElement('button');
            btn.className = 'btn-lloc';
            btn.dataset.lloc = lloc;
            btn.innerHTML = htmlOpcioLloc(lloc);
            btn.addEventListener('click', () => checkLloc(lloc, btn));
            els.llocs.appendChild(btn);
        }
    }
    els.coordArea.hidden = !ambCaselles(pregunta);
    for (const inp of [els.inputX, els.inputY]) {
        inp.value = '';
        inp.dataset.locked = '';
        inp.classList.remove('input-locked', 'reveal', 'kb-selected', 'kb-active-input', 'error-shake');
        inp.removeAttribute('readonly');
        inp.removeAttribute('inputmode');
    }
    updateHeader();
    mostraInstruccio(textInstruccio(pregunta));
    if (ambCaselles(pregunta)) focusa(els.inputX);
    else hideCustomKeyboard();
}

function dibuixa(punts) {
    tauler.dibuixa(punts);
}

function focusa(inp) {
    if (isTouchDevice()) showCustomKeyboard(inp);
    else inp.focus();
}

function bloqueja(inp) {
    inp.dataset.locked = 'true';
    inp.setAttribute('readonly', 'readonly');
    inp.classList.remove('kb-active-input', 'kb-selected', 'error-shake');
    inp.classList.add('input-locked');
}

function shake(inp) {
    inp.classList.remove('error-shake');
    void inp.offsetWidth;
    inp.classList.add('error-shake');
    setTimeout(() => inp.classList.remove('error-shake'), 400);
}

const caselles = () => [els.inputX, els.inputY].filter(i => i.dataset.locked !== 'true');

// ── RESPOSTES ────────────────────────────────────────────────────────────────

/** 'situa': un toc al pla. */
els.canvas.addEventListener('click', e => {
    if (pregunta?.tipus !== 'situa' || state.isTransitioning || isPenalizing) return;
    const c = tauler.aCoordenades(e.clientX, e.clientY);
    if (!c) return;
    if (comprovaSitua(pregunta, c.x, c.y)) {
        dibuixa([punt(pregunta.punt, VERD, pregunta.etiqueta)]);
        recordAnswerToHistory(textPregunta(pregunta), textPunt(c.x, c.y), true);
        finishOperation(true);
        return;
    }
    // El punt tocat, en vermell, amb les seves coordenades i ✖
    dibuixa([punt(c, VERMELL)]);
    els.marca.innerHTML = `<span class="part mal">${textPunt(c.x, c.y)} ✖</span>`;
    recordAnswerToHistory(textPregunta(pregunta), textPunt(c.x, c.y), false);
    penalize();
});

/** 'quadrant': una icona. */
function checkLloc(lloc, btn) {
    if (state.isTransitioning || isPenalizing || btn.disabled) return;
    const correcte = lloc === pregunta.lloc;
    recordAnswerToHistory(textPregunta(pregunta), lloc, correcte);
    if (correcte) {
        btn.classList.add('correct');
        for (const b of els.llocs.querySelectorAll('.btn-lloc')) b.disabled = true;
        finishOperation(true);
        return;
    }
    btn.classList.add('wrong');
    btn.insertAdjacentHTML('beforeend', '<span class="x-lloc" aria-hidden="true">✖</span>');
    btn.disabled = true;
    penalize();
}

/** 'coordenades' i 'al-quadrant': les dues caselles. */
function checkCoords() {
    if (state.isTransitioning || isPenalizing) return;
    const buides = caselles().filter(i => i.value.trim() === '');
    if (buides.length) {
        // Falta una casella: res a comprovar (ni es penalitza)
        buides.forEach(shake);
        focusa(buides[0]);
        return;
    }
    const x = xEncertada ? pregunta.punt.x : parseStrictInt(els.inputX.value);
    const y = yEncertada ? pregunta.punt.y : parseStrictInt(els.inputY.value);
    if (Number.isNaN(x) || Number.isNaN(y)) {
        const dolenta = Number.isNaN(x) ? els.inputX : els.inputY;
        dolenta.value = '';
        shake(dolenta);
        return;
    }
    const question = textPregunta(pregunta);
    const answer = textPunt(x, y);

    if (pregunta.tipus === 'coordenades') {
        const r = comprovaCoordenades(pregunta, x, y);
        els.marca.innerHTML = `<span class="part ${r.xOk ? 'bo' : 'mal'}">x ${r.xOk ? '✔' : '✖'}</span><span class="part ${r.yOk ? 'bo' : 'mal'}">y ${r.yOk ? '✔' : '✖'}</span>`;
        if (r.xOk && !xEncertada) {
            xEncertada = true;
            bloqueja(els.inputX);
        }
        if (r.yOk && !yEncertada) {
            yEncertada = true;
            bloqueja(els.inputY);
        }
        if (r.xOk && r.yOk) {
            recordAnswerToHistory(question, answer, true);
            hideCustomKeyboard();
            finishOperation(true);
            return;
        }
        recordAnswerToHistory(question, answer, false);
        for (const [ok, inp] of [
            [r.xOk, els.inputX],
            [r.yOk, els.inputY],
        ])
            if (!ok) {
                shake(inp);
                inp.value = '';
            }
        penalize();
        return;
    }

    // 'al-quadrant': el punt escrit es dibuixa (en verd si és bo, en vermell si no) amb les seves coordenades
    const bo = comprovaAlQuadrant(pregunta, x, y);
    recordAnswerToHistory(question, answer, bo);
    if (dinsDelPla(x, y)) dibuixa([punt({ x, y }, bo ? VERD : VERMELL)]);
    if (bo) {
        hideCustomKeyboard();
        finishOperation(true);
        return;
    }
    els.marca.innerHTML = `<span class="part mal">${answer} ✖</span>`;
    for (const inp of [els.inputX, els.inputY]) {
        shake(inp);
        inp.value = '';
    }
    penalize();
}

// ── INTENTS, PUNTS I TRANSICIONS ─────────────────────────────────────────────

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
            revela();
            setTimeout(() => finishOperation(false), 2600);
        } else if (ambCaselles(pregunta)) {
            const [primera] = caselles();
            if (primera) focusa(primera);
            if (primera && isTouchDevice()) kbMarkForOverwrite(primera);
        }
        isPenalizing = false;
    }, 700);
}

/** Quan s'esgoten els intents, la resposta correcta: el punt en verd, l'opció bona o les caselles plenes. */
function revela() {
    els.marca.innerHTML = '';
    if (pregunta.tipus === 'situa') dibuixa([punt(pregunta.punt, VERD, pregunta.etiqueta)]);
    else if (pregunta.tipus === 'quadrant') {
        for (const b of els.llocs.querySelectorAll('.btn-lloc')) {
            b.disabled = true;
            if (b.dataset.lloc === pregunta.lloc) b.classList.add('reveal-answer');
        }
    } else {
        // 'coordenades': el seu punt; 'al-quadrant': un punt d'exemple del lloc
        const p = pregunta.tipus === 'coordenades' ? pregunta.punt : exemplePunt(pregunta.lloc);
        dibuixa([punt(p, VERD, pregunta.tipus === 'coordenades' ? pregunta.etiqueta : '')]);
        for (const [inp, valor] of [
            [els.inputX, p.x],
            [els.inputY, p.y],
        ]) {
            inp.classList.remove('kb-selected');
            inp.classList.add('reveal');
            inp.value = String(valor);
        }
    }
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
    if (els.gameScreen.style.display === 'none' || els.coordArea.hidden) return;
    e.preventDefault();
    if (!state.isTransitioning) checkCoords();
});

/** El botó → del teclat de la pantalla: si l'altra casella és buida hi salta; si no, comprova. */
function checkCurrentCell() {
    const actual = getKbActiveInput();
    const buida = caselles().find(i => i !== actual && i.value.trim() === '');
    if (actual && actual.value.trim() !== '' && buida) showCustomKeyboard(buida);
    else checkCoords();
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
registraProva(() => ({ ocupat: isPenalizing, nivell: NIVELL, pregunta, aPixels: (x, y) => tauler.aPixels(x, y) }));

injectSharedHTML();
validateConfig();
initCustomKeyboard({ allowNegative: true, allowZero: true });
iniciaBotoNivellSeguent();
startGame();
