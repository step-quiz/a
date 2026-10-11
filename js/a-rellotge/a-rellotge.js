/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-rellotge/a-rellotge.js
 * ROL: Controlador de l'activitat «Rellotge» (a-rellotge.html): el rellotge
 *      d'agulles (SVG), els camps d'hores i minuts, l'ajuda, els intents i els
 *      punts. La lògica pura és a generador.js i l'HTML de l'ajuda, a vista.js.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa config.js, game-core.js,
 *      generador.js, vista.js i textos.js. Vegeu la capçalera d'a-rellotge.html.
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
import { anglesAgulles, formatHora, generaHora, llegeixParametres, llegeixResposta } from './generador.js';
import { TEXTOS } from './textos.js';
import { htmlAjuda } from './vista.js';

// Mòdul ES: exposem a window només el que es crida des de fora (game-core.js i els onclick de l'HTML).
Object.assign(window, { checkAnswer, toggleHelp, toggleNombres, buildLevel, checkCurrentCell });

const { nivell: NIVELL, numeros: NUMEROS_INICIALS } = llegeixParametres(new URLSearchParams(window.location.search));

// ── ELEMENTS DOM ─────────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);
const els = {
    body: document.body,
    gameScreen: $('game-screen'),
    sessionDisplay: $('session-display'),
    lvlDisplay: $('lvl-display'),
    attemptsDisplay: $('attempts-display'),
    resolutionPanel: $('resolution-panel'),
    helpText: $('help-text'),
    btnNivells: $('btn-nivells'),
    inputHores: $('input-hores'),
    inputMinuts: $('input-minuts'),
    btnSubmit: $('btn-submit-val'),
};

// ── ESTAT LOCAL ──────────────────────────────────────────────────────────────

let isPenalizing = false;
let currentHours = 3;
let currentMinutes = 0;
let mostraNumeros = NUMEROS_INICIALS;
let _helpVisible = false;

// ── LA CARA DEL RELLOTGE ─────────────────────────────────────────────────────

const punt = (r, graus) => {
    const a = (graus * Math.PI) / 180;
    return [(100 + r * Math.sin(a)).toFixed(2), (100 - r * Math.cos(a)).toFixed(2)];
};

function dibuixaNumeros() {
    let h = '';
    if (mostraNumeros) {
        for (let i = 1; i <= 12; i++) {
            const [x, y] = punt(62, i * 30);
            h += `<text x="${x}" y="${(Number(y) + 5).toFixed(2)}" text-anchor="middle" font-family="'Segoe UI',sans-serif" font-size="13" font-weight="700" fill="#334155">${i}</text>`;
        }
    }
    $('clock-numbers').innerHTML = h;
}

function toggleNombres() {
    mostraNumeros = !mostraNumeros;
    dibuixaNumeros();
    marcaBotoNombres();
}

function marcaBotoNombres() {
    const btn = $('btn-toggle-nombres');
    btn.classList.toggle('active', mostraNumeros);
    btn.setAttribute('aria-pressed', String(mostraNumeros));
}

/** Les ratlletes del rellotge: les 12 de les hores i, al nivell 3, les dels 48 minuts que queden. */
function iniciaCara() {
    let ratlles = '';
    const linia = (r1, r2, graus, color, gruix) => {
        const [x1, y1] = punt(r1, graus);
        const [x2, y2] = punt(r2, graus);
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${gruix}" stroke-linecap="round"/>`;
    };
    if (NIVELL === 3) for (let i = 0; i < 60; i++) if (i % 5 !== 0) ratlles += linia(81, 86, i * 6, '#94a3b8', 1);
    for (let i = 1; i <= 12; i++) {
        const principal = i % 3 === 0;
        ratlles += linia(principal ? 73 : 80, 86, i * 30, '#475569', principal ? 2.5 : 1.5);
    }
    $('clock-ticks').innerHTML = ratlles;
    dibuixaNumeros();
    marcaBotoNombres();
}

/** Les agulles, amb una animació de 0,6 s: primer a les 12:00 sense transició i després cap a l'hora nova. */
function dibuixaAgulles(hores, minuts) {
    const { hora, minut } = anglesAgulles(hores, minuts);
    const hHand = $('hour-hand');
    const mHand = $('min-hand');
    for (const a of [hHand, mHand]) {
        a.style.transition = 'none';
        a.style.transform = 'rotate(0deg)';
    }
    requestAnimationFrame(() =>
        requestAnimationFrame(() => {
            hHand.style.transition = 'transform 0.6s ease';
            mHand.style.transition = 'transform 0.6s ease';
            hHand.style.transform = `rotate(${hora}deg)`;
            mHand.style.transform = `rotate(${minut}deg)`;
        })
    );
}

// ── AJUDA ────────────────────────────────────────────────────────────────────

function toggleHelp() {
    _helpVisible = !_helpVisible;
    if (_helpVisible) {
        els.helpText.innerHTML = htmlAjuda(NIVELL);
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
    els.attemptsDisplay.innerText = format(TEXTOS_COMUNS.intents, { n: state.attemptsLeft });
    els.attemptsDisplay.className = 'attempts-counter' + (state.attemptsLeft <= 2 ? ' danger' : '');
}

// ── LÒGICA PRINCIPAL ─────────────────────────────────────────────────────────

/** Cridat per game-core.js via startSession(). */
function buildLevel() {
    state.attemptsLeft = MAX_INTENTS;
    isPenalizing = false;
    state.isTransitioning = false;

    const { hores, minuts } = generaHora({ nivell: NIVELL });
    currentHours = hores;
    currentMinutes = minuts;

    els.body.style.backgroundColor =
        bgColors[(state.currentSession * TOTAL_OPERATIONS + state.currentOperation) % bgColors.length];

    resetHelp();
    for (const input of [els.inputHores, els.inputMinuts]) {
        input.value = '';
        input.classList.remove('reveal', 'kb-selected');
    }
    updateHeader();
    dibuixaAgulles(currentHours, currentMinutes);
    els.resolutionPanel.style.display = 'flex';
    if (isTouchDevice()) showCustomKeyboard(els.inputHores);
    else els.inputHores.focus();
}

function checkAnswer() {
    if (state.isTransitioning || isPenalizing) return;
    const hRaw = els.inputHores.value.trim();
    const mRaw = els.inputMinuts.value.trim();
    if (hRaw === '' || mRaw === '') return; // no s'envia si algun camp és buit

    const llegit = llegeixResposta(hRaw, mRaw);
    if (!llegit) {
        shakeBtn();
        penalize();
        return;
    }

    const question = formatHora(currentHours, currentMinutes);
    const answer = formatHora(llegit.hores, llegit.minuts);
    if (llegit.hores !== currentHours || llegit.minuts !== currentMinutes) {
        shakeBtn();
        recordAnswerToHistory(question, answer, false);
        penalize();
        if (isTouchDevice()) {
            kbMarkForOverwrite(els.inputHores);
            kbMarkForOverwrite(els.inputMinuts);
        } else {
            els.inputHores.value = '';
            els.inputMinuts.value = '';
            els.inputHores.focus();
        }
        return;
    }

    recordAnswerToHistory(question, answer, true);
    hideCustomKeyboard();
    finishOperation(true);
}

function shakeBtn() {
    els.btnSubmit.classList.add('error-shake');
    setTimeout(() => els.btnSubmit.classList.remove('error-shake'), 250);
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
            // L'hora correcta, dins dels mateixos camps i en verd
            els.inputHores.value = currentHours;
            els.inputMinuts.value = String(currentMinutes).padStart(2, '0');
            for (const input of [els.inputHores, els.inputMinuts]) {
                input.classList.remove('kb-selected');
                input.classList.add('reveal');
            }
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

// ── Camps i teclat ───────────────────────────────────────────────────────────

// «:» o Tab a les hores passen als minuts; Intro envia
els.inputHores.addEventListener('keydown', e => {
    if (e.key === ':' || e.key === 'Tab') {
        e.preventDefault();
        if (isTouchDevice()) showCustomKeyboard(els.inputMinuts);
        else els.inputMinuts.focus();
    }
});
// En tàctil, tocar un camp hi porta el teclat de la pantalla
for (const input of [els.inputHores, els.inputMinuts])
    input.addEventListener('pointerdown', e => {
        if (!isTouchDevice()) return;
        e.preventDefault();
        showCustomKeyboard(input);
    });

document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    if (els.gameScreen.style.display === 'none') return;
    if (els.resolutionPanel.style.display === 'none') return;
    e.preventDefault();
    if (!state.isTransitioning) checkAnswer();
});

function checkCurrentCell() {
    checkAnswer();
}

// ── BOTONS DE NIVELL ─────────────────────────────────────────────────────────

/** «Nivell 1/2/3»: recarrega l'activitat amb el nivell triat (conservant la resta de paràmetres). */
function iniciaBotonsNivell() {
    [1, 2, 3].forEach(n => {
        const btn = document.createElement('button');
        btn.className = 'btn-nivell' + (n === NIVELL ? ' active' : '');
        btn.textContent = format(TEXTOS_COMUNS.nivell, { n }).replace(/^·\s*/, '');
        btn.setAttribute('aria-pressed', String(n === NIVELL));
        btn.addEventListener('click', () => {
            const params = new URLSearchParams(window.location.search);
            params.set('nivell', n);
            window.location.search = params.toString();
        });
        els.btnNivells.appendChild(btn);
    });
}

// ── INICI ────────────────────────────────────────────────────────────────────

// Per als tests de navegador (vegeu registraProva a game-core.js)
registraProva(() => ({
    ocupat: isPenalizing,
    hores: currentHours,
    minuts: currentMinutes,
    nivell: NIVELL,
}));

injectSharedHTML();
iniciaBotonsNivell();
iniciaCara();
validateConfig();
initCustomKeyboard({ allowNegative: false });
startGame();
