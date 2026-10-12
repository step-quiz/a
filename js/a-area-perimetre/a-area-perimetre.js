/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-area-perimetre/a-area-perimetre.js
 * ROL: Controlador de l'activitat «Àrea i perímetre» (a-area-perimetre.html):
 *      la figura, les dues caselles (àrea i perímetre), l'ajuda, els intents i
 *      els punts. Abans (a operacions) era a dins de l'HTML.
 *      La lògica pura és a generador.js i l'HTML de cada peça és a vista.js.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa config.js, game-core.js,
 *      generador.js, vista.js i textos.js. Vegeu la capçalera d'a-area-perimetre.html
 *      per als paràmetres de la URL.
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
import { NIVELL_MAXIM, comprovaResposta, crearGenerador, llegeixParametres } from './generador.js';
import { TEXTOS } from './textos.js';
import { htmlCanviats, htmlEtiqueta, htmlFigura, htmlMarca, textPregunta, textResposta } from './vista.js';

// Aquest fitxer és un mòdul ES: les seves funcions no són globals. Exposem a
// window només les que es criden des de fora: game-core.js (buildLevel,
// checkCurrentCell) i els onclick dels botons de l'HTML.
Object.assign(window, { checkAnswers, toggleHelp, buildLevel, checkCurrentCell });

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
    figura: $('figura-container'),
    areaInput: $('area-input'),
    perimInput: $('perim-input'),
    areaMarca: $('area-marca'),
    perimMarca: $('perim-marca'),
    canviats: $('canviats'),
    btnOk: $('btn-ok'),
};

// ── ESTAT LOCAL ──────────────────────────────────────────────────────────────

let isPenalizing = false;
let figura = null; // la figura de la pregunta (vegeu variant)
let areaEncertada = false; // una casella encertada es queda bloquejada en verd
let perimEncertat = false;
let ajuda = 0; // 0 = cap, 1 = els quadrats numerats, 2 = els costats numerats

const caselles = () => [els.areaInput, els.perimInput].filter(i => i.dataset.locked !== 'true');

// ── AJUDA ────────────────────────────────────────────────────────────────────

/** El 💡 va passant: quadrats numerats (àrea) → costats numerats (perímetre) → cap. */
function toggleHelp() {
    ajuda = (ajuda + 1) % 3;
    mostraFigura();
}

function mostraFigura() {
    els.figura.innerHTML = htmlFigura(figura, [null, 'area', 'perimetre'][ajuda]);
}

// ── CAPÇALERA ────────────────────────────────────────────────────────────────

function updateHeader() {
    els.sessionDisplay.innerText = format(TEXTOS_COMUNS.sessio, { n: state.currentSession + 1, total: TOTAL_SESSIONS });
    els.lvlDisplay.innerText = format(TEXTOS.figura, { n: state.currentOperation + 1, total: TOTAL_OPERATIONS });
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
    areaEncertada = false;
    perimEncertat = false;
    ajuda = 0;

    // Cada sessió comença sense recordar les figures que ja han sortit
    if (state.currentOperation === 0) generador.reinicia();
    figura = generador.genera();

    els.body.style.backgroundColor =
        bgColors[(state.currentSession * TOTAL_OPERATIONS + state.currentOperation) % bgColors.length];

    for (const inp of [els.areaInput, els.perimInput]) {
        inp.value = '';
        inp.dataset.locked = '';
        inp.classList.remove('input-locked', 'reveal', 'kb-selected', 'kb-active-input', 'error-shake');
        inp.removeAttribute('readonly');
        inp.removeAttribute('inputmode');
    }
    els.areaMarca.innerHTML = '';
    els.perimMarca.innerHTML = '';
    els.canviats.innerHTML = '';
    mostraFigura();
    updateHeader();
    mostraInstruccio(TEXTOS.instruccio);
    focusa(els.areaInput);
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

function checkAnswers() {
    if (state.isTransitioning || isPenalizing) return;
    const buides = caselles().filter(i => i.value.trim() === '');
    if (buides.length) {
        // Falta una casella: res a comprovar (ni es penalitza)
        buides.forEach(shake);
        focusa(buides[0]);
        return;
    }
    const area = areaEncertada ? figura.area : parseStrictInt(els.areaInput.value);
    const perim = perimEncertat ? figura.perimetre : parseStrictInt(els.perimInput.value);
    if (Number.isNaN(area) || Number.isNaN(perim)) {
        (Number.isNaN(area) ? els.areaInput : els.perimInput).value = '';
        shake(Number.isNaN(area) ? els.areaInput : els.perimInput);
        return;
    }

    const r = comprovaResposta(figura, area, perim);
    const question = textPregunta(figura);
    const answer = textResposta(area, perim);

    // Cada casella amb la seva marca; la que és bona es queda bloquejada
    els.canviats.innerHTML = r.canviats ? htmlCanviats() : '';
    if (!areaEncertada) els.areaMarca.innerHTML = htmlMarca(r.areaOk);
    if (!perimEncertat) els.perimMarca.innerHTML = htmlMarca(r.perimOk);
    if (r.areaOk && !areaEncertada) {
        areaEncertada = true;
        bloqueja(els.areaInput);
    }
    if (r.perimOk && !perimEncertat) {
        perimEncertat = true;
        bloqueja(els.perimInput);
    }

    if (r.areaOk && r.perimOk) {
        recordAnswerToHistory(question, answer, true);
        hideCustomKeyboard();
        finishOperation(true);
        return;
    }

    recordAnswerToHistory(question, answer, false);
    for (const [ok, inp] of [
        [r.areaOk, els.areaInput],
        [r.perimOk, els.perimInput],
    ])
        if (!ok) {
            shake(inp);
            inp.value = '';
        }
    penalize();
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
            // Les respostes correctes, dins de les mateixes caselles i en verd
            els.canviats.innerHTML = '';
            for (const [inp, valor] of [
                [els.areaInput, figura.area],
                [els.perimInput, figura.perimetre],
            ]) {
                inp.classList.remove('kb-selected');
                inp.classList.add('reveal');
                inp.value = String(valor);
            }
            setTimeout(() => finishOperation(false), 2600);
        } else {
            const [primera] = caselles();
            if (primera) focusa(primera);
            if (primera && isTouchDevice()) kbMarkForOverwrite(primera);
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
    e.preventDefault();
    if (!state.isTransitioning) checkAnswers();
});

/** El botó → del teclat de la pantalla: si l'altra casella és buida hi salta; si no, comprova. */
function checkCurrentCell() {
    const actual = getKbActiveInput();
    const buida = caselles().find(i => i !== actual && i.value.trim() === '');
    if (actual && actual.value.trim() !== '' && buida) showCustomKeyboard(buida);
    else checkAnswers();
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
    figura,
    area: figura ? figura.area : null,
    perimetre: figura ? figura.perimetre : null,
}));

injectSharedHTML();
validateConfig();
initCustomKeyboard({ allowNegative: false, allowZero: true });
// Les etiquetes de les caselles surten del lèxic (àrea i perímetre) amb la seva icona
$('area-etiqueta').innerHTML = htmlEtiqueta('area');
$('perim-etiqueta').innerHTML = htmlEtiqueta('perimetre');
iniciaBotoNivellSeguent();
startGame();
