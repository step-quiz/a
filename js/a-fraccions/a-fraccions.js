/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-fraccions/a-fraccions.js
 * ROL: Controlador de l'activitat «Fraccions» (a-fraccions.html): l'expressió
 *      que va creixent, les caselles de cada pas, l'ajuda, els intents i els
 *      punts. Abans (a operacions) era a dins de l'HTML, amb un menú.
 *      La lògica pura (els problemes i l'avaluació de cada pas) és a
 *      generador.js i l'HTML de cada peça és a vista.js.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa config.js, game-core.js,
 *      generador.js, vista.js i textos.js. Vegeu la capçalera d'a-fraccions.html
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
    avalua,
    filesJaFetes,
    generaProblema,
    llegeixParametres,
    primerPas,
    solucioDelPas,
} from './generador.js';
import { TEXTOS } from './textos.js';
import {
    htmlAjuda,
    htmlLiniaDelPas,
    htmlMarques,
    htmlPas,
    htmlProblema,
    htmlRepeteix,
    textPregunta,
    textResposta,
} from './vista.js';

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
    exprBox: $('expression-box'),
    resolutionPanel: $('resolution-panel'),
    stepArea: $('step-area'),
    btnSubmit: $('btn-step-submit'),
    partFeedback: $('part-feedback'),
    helpText: $('help-text'),
};

// ── ESTAT LOCAL ──────────────────────────────────────────────────────────────

let isPenalizing = false;
let isAdvancing = false; // entre un pas i el següent
let problema = null; // el problema (vegeu generaProblema)
let estat = {}; // el que se sap de la resolució: el denominador comú i els numeradors equivalents
let pas = null; // el pas actual: 'den', 'equiv', 'inversa', 'resultat' o 'simplifica'
let _helpVisible = false;

/** Les caselles del pas actual, en ordre. */
const caselles = () => [...els.stepArea.querySelectorAll('input.math-cell')];

// ── AJUDA ────────────────────────────────────────────────────────────────────

function toggleHelp() {
    _helpVisible = !_helpVisible;
    if (_helpVisible && pas) {
        els.helpText.innerHTML = htmlAjuda(problema, estat, pas);
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
    els.lvlDisplay.innerText = format(TEXTOS.repte, { n: state.currentOperation + 1, total: TOTAL_OPERATIONS });
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

    problema = generaProblema(NIVELL);
    const inici = primerPas(problema);
    estat = inici.estat;

    els.body.style.backgroundColor =
        bgColors[(state.currentSession * TOTAL_OPERATIONS + state.currentOperation) % bgColors.length];

    els.exprBox.innerHTML = htmlProblema(problema);
    updateHeader();
    mostraPas(inici.pas);
}

/** Posa a la pantalla les caselles d'un pas. */
function mostraPas(nouPas) {
    pas = nouPas;
    resetHelp();
    els.partFeedback.innerHTML = '';
    els.stepArea.innerHTML = htmlPas(problema, estat, pas);
    els.resolutionPanel.style.display = 'flex';
    // Cada casella, tocada en tàctil, hi porta el teclat de la pantalla
    for (const inp of caselles()) inp.addEventListener('focus', () => isTouchDevice() && showCustomKeyboard(inp));
    focusInicial();
}

function focusInicial() {
    const [primera] = caselles();
    if (!primera) return;
    if (isTouchDevice()) showCustomKeyboard(primera);
    else primera.focus();
}

/** El nombre d'una casella (null si és buida o no és un enter). */
function valorDe(id) {
    const inp = $(id);
    if (!inp || inp.value.trim() === '') return null;
    const n = parseStrictInt(inp.value);
    return Number.isNaN(n) ? null : n;
}

/** Les respostes del pas actual amb el seu nom, o null si en falta alguna d'obligatòria (el denominador és opcional: val 1). */
function llegeixResposta() {
    if (pas === 'den') {
        const D = valorDe('in-den');
        return D === null ? null : { D };
    }
    if (pas === 'equiv') {
        const { f1, f2 } = filesJaFetes(problema, estat.D);
        const n1 = f1 ? null : valorDe('in-n1');
        const n2 = f2 ? null : valorDe('in-n2');
        return (!f1 && n1 === null) || (!f2 && n2 === null) ? null : { n1, n2 };
    }
    const n = valorDe('in-n');
    const d = valorDe('in-d');
    if (n === null || (pas === 'inversa' && d === null)) return null;
    if ($('in-d').value.trim() !== '' && d === null) return null; // un denominador que no és un nombre
    return { n, d };
}

function checkValue() {
    if (state.isTransitioning || isPenalizing || isAdvancing || !pas) return;
    const r = llegeixResposta();
    if (!r) {
        shakeInput();
        return;
    }

    const question = textPregunta(problema, estat, pas);
    const answer = textResposta(pas, r);
    const res = avalua(problema, estat, pas, r);

    if (!res.ok) {
        // Cada part del que ha escrit amb ✔ o ✖: sense frases
        els.partFeedback.innerHTML = htmlMarques(problema, estat, pas, r);
        shakeInput();
        recordAnswerToHistory(question, answer, false);
        penalize();
        preparaNovaResposta();
        return;
    }

    recordAnswerToHistory(question, answer, true);
    afegeixLinia(htmlLiniaDelPas(problema, estat, pas, r));
    estat = res.estat;
    hideCustomKeyboard();

    if (res.seguent === 'fi') {
        acaba();
    } else if (res.repeteix) {
        // La fracció és bona però encara es pot simplificar: es torna a provar al mateix pas
        isAdvancing = true;
        setTimeout(() => {
            isAdvancing = false;
            mostraPas(pas);
            els.partFeedback.innerHTML = htmlRepeteix();
        }, 400);
    } else {
        isAdvancing = true;
        setTimeout(() => {
            isAdvancing = false;
            mostraPas(res.seguent);
        }, 400);
    }
}

function afegeixLinia(html) {
    els.exprBox.insertAdjacentHTML('beforeend', html);
}

/** Deixa les caselles a punt per tornar-ho a provar: buides i amb el cursor a la primera (en tàctil, la tecla següent esborra). */
function preparaNovaResposta() {
    const cs = caselles();
    for (const inp of cs) inp.value = '';
    if (!cs.length) return;
    if (isTouchDevice()) kbMarkForOverwrite(cs[0]);
    else cs[0].focus();
}

/** La fracció és la final: es tanca la pregunta. */
function acaba() {
    els.resolutionPanel.style.display = 'none';
    state.isTransitioning = true;
    setTimeout(() => finishOperation(true), 1000);
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
            // La solució del pas, dins de les mateixes caselles i en verd
            els.partFeedback.innerHTML = '';
            const valors = solucioDelPas(problema, estat, pas);
            caselles().forEach((inp, i) => {
                inp.classList.remove('kb-selected');
                inp.classList.add('reveal');
                inp.value = String(valors[i]);
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

    els.resolutionPanel.style.display = 'none';
    const waitTime = showMiniOverlay(levelPoints);
    // La pàgina és alta: en pantalles petites el missatge quedaria sota la vora
    $('mini-victory-overlay').scrollIntoView({ block: 'nearest' });
    setTimeout(() => {
        hideMiniOverlay();
        pas = null;
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
        if (!state.isTransitioning) checkValue();
    } else if (e.key === 'Tab') {
        // Tab passa a la casella següent del pas (i de l'última, a la primera)
        const cs = caselles();
        const i = cs.indexOf(document.activeElement);
        if (cs.length <= 1 || i === -1) return;
        e.preventDefault();
        const seguent = cs[(i + (e.shiftKey ? cs.length - 1 : 1)) % cs.length];
        if (isTouchDevice()) showCustomKeyboard(seguent);
        else seguent.focus();
    }
});

/** El botó → del teclat de la pantalla: salta a la casella buida següent; si ja són totes plenes, comprova. */
function checkCurrentCell() {
    const cs = caselles();
    if (!cs.length) return checkValue();
    const actual = cs.indexOf(getKbActiveInput());
    for (let i = 1; i <= cs.length; i++) {
        const seguent = cs[(actual + i) % cs.length];
        if (seguent.value.trim() === '' && !(pas !== 'inversa' && seguent.id === 'in-d')) {
            showCustomKeyboard(seguent);
            return;
        }
    }
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
registraProva(() => ({
    ocupat: isPenalizing || isAdvancing,
    nivell: NIVELL,
    pas,
    problema,
    // Els valors correctes de les caselles del pas actual, en ordre (null si no n'hi ha cap)
    resposta: pas ? solucioDelPas(problema, estat, pas) : null,
}));

injectSharedHTML();
validateConfig();
initCustomKeyboard({ allowNegative: false, allowZero: true });
iniciaBotoNivellSeguent();
startGame();
