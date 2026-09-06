/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/game-core.js
 *
 * ── FORMAT DE CODI v2 ───────────────────────────────────────────────────────
 *
 *   Lsss-DDMM-HHMM-EE-D-S-QQ-NNN-RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR  (59 chars)
 *
 *   L     1   Lletra de control antifrau
 *   sss   3   Salt aleatori (3 lletres minúscules)
 *   DDMM  4   Data
 *   HHMM  4   Hora i minuts
 *   EE    2   Codi d'exercici (taula EXERCISE_CODES)
 *   D     1   Dificultat: 0=sense nivells, 1-3=nivell triat
 *   S     1   Sessions completades (1-5)
 *   QQ    2   Preguntes per sessió (01-10)
 *   NNN   3   Nota x10 arrodonida (000-100). Ex: 7,5 -> 075
 *   RRR  30   Resultats per pregunta:
 *               1=encertada al 1r intent
 *               2=encertada al 2n intent
 *               3=encertada al 3r intent o posterior
 *               4=fallada (intents esgotats)
 *               0=posicio buida
 *
 * ── CHECKSUM ────────────────────────────────────────────────────────────────
 *   suma = NNN_int + DD + MM + HH + mm + ASCII(salt[0])
 *   lletra = "TRWAGMYFPDXBNJZSQVHLCKE"[ suma % 23 ]
 *
 * ── COM REGISTRAR RESULTATS PER PREGUNTA ────────────────────────────────────
 *   Cridar recordResult(codi) en finalitzar cada pregunta:
 *
 *   // Resposta CORRECTA (attemptsLeft sense decrementar per aquest intent):
 *   recordResult(Math.min(MAX_INTENTS - attemptsLeft + 1, 3));
 *
 *   // Fallo definitiu:
 *   recordResult(4);
 *
 * ── DIFICULTAT ──────────────────────────────────────────────────────────────
 *   Es llegeix automaticament del parametre URL ?nivell=N.
 *   Jocs sense nivells no han de fer res (D=0 per defecte).
 * ============================================================================
 */

// ── TAULA DE CODIS D'EXERCICI ────────────────────────────────────────────────
const EXERCISE_CODES = {
    // ESO
    'enters':             'EN',
    'enters-ordenar':     'EO',
    'fraccions':          'FR',
    'equacions':          'EQ',
    'sistemes-equacions': 'SE',
    'mcd-mcm':            'MC',
    'potencies':          'PT',
    'factoritzar':        'FA',
    'radicals':           'RA',
    'recta-numerica':     'RN',
    'area-perimetre':     'AP',
    'pla-cartesia':       'PC',
    'proporciodirecta':   'PR',
    'decimals':             'DI',
    'vocabulari':         'VO',
    'probabilitat':       'PB',
    'estadistica':        'ED',
    'mitjana':            'MJ',
    'estadistica-inversa':'EI',
    'gots-fitxes':        'GC',
    // Batxillerat
    'complexos':                 'CX',
    'derivades':                 'DV',
    'integrals':                 'IT',
    'asimptotes':                'AS',
    'ruffini':                   'RU',
    'grafica-i-funcio':          'GF',
    'grafica-funcio-i-derivada': 'GD',
    'rectes-plans':              'RP',
    'esglaonar-matriu':          'EM',
    'inversa-matriu':            'IM',
    'raons-trigonometria':       'RT',
    'teorema-sin-cos':           'TC',
    // Adaptades (a/)
    'a-enters':           'AE',
    'a-decimals':         'AD',
    'a-diners':           'AN',
    'a-equacions':        'AQ',
    'a-proporciodirecta': 'AO',
    'llenguatge-algebraic': 'LA',
};

// Lookup invers: codi 2 lletres -> nom exercici
const EXERCISE_NAMES = Object.fromEntries(
    Object.entries(EXERCISE_CODES).map(([nom, codi]) => [codi, nom])
);

// ── DIFICULTAT (llegida automaticament de l'URL) ─────────────────────────────
const _urlNivell = new URLSearchParams(window.location.search).get('nivell');
let currentDifficulty = _urlNivell ? Math.min(Math.max(parseInt(_urlNivell, 10) || 0, 0), 3) : 0;

// ── PALETA DE FONS ───────────────────────────────────────────────────────────
const bgColors = [
    '#f8fafc','#eff6ff','#f0fdf4','#fefce8','#fff1f2',
    '#f5f3ff','#ecfeff','#fdf4ff','#fffbeb','#faf5ff'
];

// ── ESTAT COMPARTIT DEL JOC ──────────────────────────────────────────────────
let sessionHistory   = [];
let sessionResults   = [];   // codis per pregunta [1,2,3,4,…] (max 30)
let currentSession   = 0;
let currentOperation = 0;
let sessionScore     = 0;
let sessionScores    = [];
let attemptsLeft     = 0;
let isTransitioning  = false;

// ── VALIDACIO DE CONFIGURACIO ────────────────────────────────────────────────
function validateConfig() {
    const errors = [];
    const isPosInt = n => Number.isInteger(n) && n > 0;
    if (!isPosInt(TOTAL_SESSIONS))            errors.push('TOTAL_SESSIONS ha de ser un enter positiu.');
    if (!isPosInt(TOTAL_OPERATIONS))          errors.push('TOTAL_OPERATIONS ha de ser un enter positiu.');
    if (!isPosInt(MAX_INTENTS))               errors.push('MAX_INTENTS ha de ser un enter positiu.');
    if (![0,1].includes(MAX_ENLLOC_MITJANA))  errors.push('MAX_ENLLOC_MITJANA ha de ser 0 o 1.');
    if (errors.length) {
        const msg = 'Configuracio invalida:\n- ' + errors.join('\n- ');
        console.error(msg); alert(msg); throw new Error(msg);
    }
}

// ── GESTIO DE PANTALLES ──────────────────────────────────────────────────────
let _allScreenIds = ['game-screen','session-end-screen','final-screen'];
function registerScreens(ids) { _allScreenIds = ids; }
function showScreen(id) {
    _allScreenIds.forEach(s => { const el = document.getElementById(s); if (el) el.style.display = 'none'; });
    const target = document.getElementById(id);
    if (target) target.style.display = 'block';
}

// ── INICI I FI DEL JOC ──────────────────────────────────────────────────────
function startGame() {
    currentSession = 0;
    sessionScores  = [];
    sessionHistory = [];
    sessionResults = [];
    showScreen('game-screen');
    startSession();
}

function startSession() {
    currentOperation = 0;
    sessionScore     = 0;
    if (typeof buildLevel === 'function') buildLevel();
}

function endSession() {
    sessionScores.push(sessionScore);
    if (currentSession + 1 >= TOTAL_SESSIONS) {
        renderFinalSummary();
        showScreen('final-screen');
    } else {
        showScreen('session-end-screen');
        const titleEl = document.getElementById('session-end-title');
        if (titleEl) titleEl.innerText = `Sessio ${currentSession + 1} completada`;
        const btnEl = document.getElementById('btn-next-session');
        if (btnEl) {
            // [FIX M7] Text temporal durant l'espera d'1s
            btnEl.style.display = 'none';
            const waitMsg = document.createElement('div');
            waitMsg.id = 'session-wait-msg';
            waitMsg.style.cssText = 'color:var(--text-muted);font-size:0.95em;margin-top:10px;text-align:center;';
            waitMsg.innerText = 'Preparant sessió següent…';
            btnEl.parentNode.insertBefore(waitMsg, btnEl.nextSibling);
            setTimeout(() => {
                btnEl.style.display = 'inline-block';
                isTransitioning = false;
                const msg = document.getElementById('session-wait-msg');
                if (msg) msg.remove();
            }, 1000);
        }
    }
}

function startNextSession() {
    currentSession++;
    showScreen('game-screen');
    startSession();
}

// ── NOTA FINAL ───────────────────────────────────────────────────────────────
// Cada pregunta val com a màxim MAX_PUNTS_PREGUNTA punts (totes les activitats
// usen levelPoints/pts = Math.max(0, 10 - ...), és a dir un màxim de 10).
// La puntuació màxima d'una sessió és, doncs, TOTAL_OPERATIONS * MAX_PUNTS_PREGUNTA.
const MAX_PUNTS_PREGUNTA = 10;
function calculaNotaSobre10() {
    if (!sessionScores.length) return 0;
    const maxSessio = TOTAL_OPERATIONS * MAX_PUNTS_PREGUNTA;  // punts màxims d'1 sessió
    if (MAX_ENLLOC_MITJANA === 1) {
        // Nota = millor sessió, normalitzada sobre 10
        return Number((Math.max(...sessionScores) / maxSessio * 10).toFixed(1));
    } else {
        // Nota = mitjana de totes les sessions, normalitzada sobre 10
        return Number((sessionScores.reduce((a,s) => a+s, 0) / (TOTAL_SESSIONS * maxSessio) * 10).toFixed(1));
    }
}

function renderFinalSummary() {
    let html = '';
    for (let i = 0; i < sessionScores.length; i++) {
        html += `<div class="session-line"><span>Sessio ${i+1}</span><span>${(sessionScores[i]/(TOTAL_OPERATIONS*MAX_PUNTS_PREGUNTA)*10).toFixed(1).replace('.',',')}</span></div>`;
    }
    const nota10 = calculaNotaSobre10().toFixed(1).replace('.',',');
    const textFinal = MAX_ENLLOC_MITJANA === 1 ? 'La sessio amb nota mes alta obte:' : 'La nota mitjana es:';
    html += `<div style="margin-top:20px;text-align:left;"><div style="font-size:0.95em;color:var(--text-muted);margin-bottom:5px;">${textFinal}</div><div style="font-size:1.5em;font-weight:bold;color:var(--success);font-family:monospace;">${nota10} / 10</div></div>`;
    const summaryEl = document.getElementById('final-summary');
    if (summaryEl) summaryEl.innerHTML = html;
}

// [FIX A3] Confirmació abans de recarregar
function finalitzar() {
    if (confirm('Segur que vols tornar a començar? Perdràs el codi si no l\'has copiat.')) {
        window.location.reload();
    }
}

// ── MINI OVERLAY ─────────────────────────────────────────────────────────────
function showMiniOverlay(levelPoints, options = {}) {
    const successColor = options.successColor || '#047857';
    const pointsColor  = options.pointsColor  || '#059669';
    const vicText   = document.getElementById('mini-vic-text');
    const vicIcon   = document.getElementById('mini-vic-icon');
    const vicPoints = document.getElementById('mini-vic-points');
    const overlay   = document.getElementById('mini-victory-overlay');
    let waitTime;
    if (levelPoints > 0) {
        if (vicText)   { vicText.innerText   = 'Molt be!';             vicText.style.color   = successColor; }
        if (vicIcon)   { vicIcon.innerText   = '⭐'; }
        if (vicPoints) { vicPoints.innerText = `+${levelPoints} punts`; vicPoints.style.color = pointsColor; }
        waitTime = 1500;
    } else {
        if (vicText)   { vicText.innerText   = 'Intents esgotats'; vicText.style.color   = 'var(--danger)'; }
        if (vicIcon)   { vicIcon.innerText   = '❌'; }
        if (vicPoints) { vicPoints.innerText = '0 punts';           vicPoints.style.color = 'var(--danger)'; }
        waitTime = 3000;
    }
    if (overlay) { overlay.style.display = 'flex'; overlay.setAttribute('aria-hidden','false'); }
    return waitTime;
}

function hideMiniOverlay() {
    const overlay = document.getElementById('mini-victory-overlay');
    if (overlay) { overlay.style.display = 'none'; overlay.setAttribute('aria-hidden','true'); }
}

// ── INJECCIO HTML COMPARTIT ──────────────────────────────────────────────────
function injectSharedHTML() {
    const gameScreen = document.getElementById('game-screen');
    const panel = document.querySelector('.panel');
    if (!gameScreen || !panel) return;

    // 1. Mini overlay
    const overlay = document.createElement('div');
    overlay.id = 'mini-victory-overlay';
    overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML = `<div class="vic-message-row"><div class="mini-vic-text" id="mini-vic-text">Molt be!</div><div class="star-icon" id="mini-vic-icon">⭐</div></div><div class="mini-vic-points" id="mini-vic-points">+10 punts</div>`;
    gameScreen.appendChild(overlay);

    // 2. Teclat numeric
    const kb = document.createElement('div');
    kb.id = 'customKeyboard';
    kb.innerHTML = `<div class="kb-grid"><button class="kb-btn" data-key="7">7</button><button class="kb-btn" data-key="8">8</button><button class="kb-btn" data-key="9">9</button><button class="kb-btn kb-del" data-key="del">⌫</button><button class="kb-btn" data-key="4">4</button><button class="kb-btn" data-key="5">5</button><button class="kb-btn" data-key="6">6</button><button class="kb-btn kb-minus" data-key="-">−</button><button class="kb-btn" data-key="1">1</button><button class="kb-btn" data-key="2">2</button><button class="kb-btn" data-key="3">3</button><button class="kb-btn kb-enter" data-key="enter">→</button><button class="kb-btn kb-zero" data-key="0">0</button></div>`;
    panel.appendChild(kb);

    // 3. Fi de sessio
    const sessionEnd = document.createElement('div');
    sessionEnd.id = 'session-end-screen';
    sessionEnd.innerHTML = `<div class="trophy-icon">👍</div><h2 id="session-end-title">Sessio completada</h2><button class="btn-green" id="btn-next-session" onclick="startNextSession()">Comencar sessio seguent</button>`;
    panel.appendChild(sessionEnd);

    // 4. Pantalla final
    const finalScreen = document.createElement('div');
    finalScreen.id = 'final-screen';
    finalScreen.style.display = 'none';
    finalScreen.innerHTML = `<div id="final-results"><h2>Resum</h2><div class="final-layout"><div id="final-summary" class="final-summary"></div><div class="trophy-icon">🏆</div></div><div style="display:flex;gap:15px;justify-content:center;flex-wrap:wrap;margin-top:25px;"><button class="btn-submit" onclick="if(typeof showHistorySummary==='function')showHistorySummary();" style="background-color:var(--primary);">📋 Informe</button><button id="btn-copiar" class="btn-submit" onclick="if(typeof copiarResultats==='function')copiarResultats();" style="background-color:#334155;">📝 Copiar codi</button><button class="btn-submit" onclick="finalitzar()" style="background-color:var(--text-muted);">🔄 Tornar a jugar</button></div></div>`;
    panel.appendChild(finalScreen);
    if (window._fixedSessionActive) finalScreen.querySelector('#btn-copiar').style.display = 'none';
}

// ── TECLAT NUMERIC CUSTOM ────────────────────────────────────────────────────
function isTouchDevice() { return window.matchMedia('(pointer: coarse) and (hover: none)').matches; }
let _kbActiveInput = null;
let _kbClearOnNext = false;

function initCustomKeyboard(options = {}) {
    const allowNeg  = options.allowNegative ?? false;
    const allowZero = options.allowZero     ?? true;
    const grid      = document.querySelector('#customKeyboard .kb-grid');
    if (grid) {
        if (!allowNeg)  grid.classList.add('kb-no-minus');    else grid.classList.remove('kb-no-minus');
        if (!allowZero) grid.classList.add('kb-no-zero');     else grid.classList.remove('kb-no-zero');
    }
    document.querySelectorAll('#customKeyboard .kb-btn').forEach(btn => {
        btn.addEventListener('pointerdown', e => {
            e.preventDefault();
            if (!_kbActiveInput) return;
            const key = btn.dataset.key;
            if (key === 'del') {
                if (_kbClearOnNext) { _kbActiveInput.value = ''; _kbClearOnNext = false; _kbActiveInput.classList.remove('kb-selected'); }
                else _kbActiveInput.value = _kbActiveInput.value.slice(0,-1);
            } else if (key === 'enter') {
                if (typeof checkCurrentCell === 'function') checkCurrentCell();
            } else if (key === '-') {
                if (_kbClearOnNext) { _kbActiveInput.value = '-'; _kbClearOnNext = false; _kbActiveInput.classList.remove('kb-selected'); }
                else { const v = _kbActiveInput.value; if (v==='') _kbActiveInput.value='-'; else if (v==='-') _kbActiveInput.value=''; }
            } else {
                if (_kbClearOnNext) { _kbActiveInput.value = ''; _kbClearOnNext = false; _kbActiveInput.classList.remove('kb-selected'); }
                if (_kbActiveInput.value === '-0') _kbActiveInput.value = '-';
                _kbActiveInput.value += key;
            }
        });
    });
    window.addEventListener('orientationchange', () => {
        const kb = document.getElementById('customKeyboard');
        if (!_kbActiveInput || !kb || !kb.classList.contains('kb-visible')) return;
        setTimeout(() => kb.scrollIntoView({ behavior:'smooth', block:'nearest' }), 300);
    });
    // [FIX C3] En tàctils, pre-establir inputmode="none" a tots els inputs
    if (isTouchDevice()) {
        document.querySelectorAll('#game-screen input[type="text"], #game-screen input[type="number"]').forEach(inp => {
            inp.setAttribute('inputmode', 'none');
        });
    }
}

function showCustomKeyboard(inp) {
    if (_kbActiveInput) _kbActiveInput.classList.remove('kb-active-input');
    _kbActiveInput = inp;
    _kbClearOnNext = false;
    inp.setAttribute('inputmode','none');
    inp.setAttribute('readonly','readonly');
    inp.classList.add('kb-active-input');
    if (!inp._kbDirectTapBound) {
        inp._kbDirectTapBound = true;
        inp.addEventListener('pointerdown', e => { if (!isTouchDevice()) return; e.preventDefault(); showCustomKeyboard(inp); });
    }
    const kb = document.getElementById('customKeyboard');
    if (kb) { kb.classList.add('kb-visible'); setTimeout(() => kb.scrollIntoView({ behavior:'smooth', block:'nearest' }), 50); }
    inp.focus();
}

function hideCustomKeyboard() {
    const kb = document.getElementById('customKeyboard');
    if (kb) kb.classList.remove('kb-visible');
    if (_kbActiveInput) {
        _kbActiveInput.classList.remove('kb-active-input');
        _kbActiveInput.removeAttribute('readonly');
        // [FIX C3] En tàctils, mantenim inputmode="none"
        if (!isTouchDevice()) _kbActiveInput.removeAttribute('inputmode');
    }
    _kbActiveInput = null;
    _kbClearOnNext = false;
}

function kbMarkForOverwrite(inp) { _kbClearOnNext = true; inp.classList.add('kb-selected'); }

// ── HISTORIAL (resum textual pantalla final) ─────────────────────────────────
function escapeHtml(unsafe) {
    if (unsafe == null) return '';
    return String(unsafe).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

// Converteix \frac{num}{den} → num/den per a la visualització en text pla (informe)
function plainFrac(str) {
    if (!str) return '';
    return String(str).replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2');
}

function recordAnswerToHistory(question, answer, isCorrect) {
    sessionHistory.push({ question, answer, isCorrect });
}

// ── REGISTRE DE RESULTATS PER PREGUNTA (format v2) ───────────────────────────
/**
 * Registra el resultat d'una pregunta al vector sessionResults.
 * @param {number} attemptCode  1=1r intent ok  2=2n  3=3r o mes  4=fallit
 *
 * Us recomanat:
 *   // Correcta (attemptsLeft sense decrementar per aquest intent):
 *   recordResult(Math.min(MAX_INTENTS - attemptsLeft + 1, 3));
 *   // Fallada definitiva:
 *   recordResult(4);
 */
function recordResult(attemptCode) {
    if (sessionResults.length < 30) sessionResults.push(attemptCode);
}

function showHistorySummary() {
    _allScreenIds.forEach(s => { const el = document.getElementById(s); if (el) el.style.display = 'none'; });
    let sc = document.getElementById('history-summary-screen');
    if (!sc) {
        sc = document.createElement('div');
        sc.id = 'history-summary-screen';
        sc.className = 'panel-content';
        (document.querySelector('.panel') || document.body).appendChild(sc);
    }
    const encerts = sessionHistory.filter(i =>  i.isCorrect);
    const errades = sessionHistory.filter(i => !i.isCorrect);

    // [FIX m8] Reescrit amb classes CSS de shared.css (responsive, mantenible)
    const liOk  = encerts.length
        ? encerts.map(e => `<li class="history-item history-item--ok"><div class="history-q"><strong>P:</strong> <span class="history-mono">${escapeHtml(e.question)}</span></div><div class="history-a--ok"><strong>R:</strong> <span class="history-mono">${escapeHtml(plainFrac(e.answer))}</span></div></li>`).join('')
        : '<li class="history-empty">Cap encert en aquesta partida.</li>';
    const liBad = errades.length
        ? errades.map(e => `<li class="history-item history-item--bad"><div class="history-q"><strong>P:</strong> <span class="history-mono">${escapeHtml(e.question)}</span></div><div class="history-a--bad"><strong>R:</strong> <span class="history-mono">${escapeHtml(plainFrac(e.answer))}</span></div></li>`).join('')
        : '<li class="history-empty">Cap errada! Partida perfecta 🎉</li>';

    sc.innerHTML = `<div class="history-summary">
        <h2>Resum de les teves respostes</h2>
        <h3 class="history-title history-title--ok">🟢 Encerts (${encerts.length})</h3>
        <ul class="history-list">${liOk}</ul>
        <h3 class="history-title history-title--bad">🔴 Errades (${errades.length})</h3>
        <ul class="history-list">${liBad}</ul>
        <div class="history-actions">
            <button class="btn-submit" id="btn-copiar-hist" onclick="copiarResultats()" style="background-color:#334155;">📝 Copiar codi</button>
            <button class="btn-submit" onclick="finalitzar()" style="background-color:var(--text-muted);margin-left:12px;">🔄 Tornar a jugar</button>
        </div>
    </div>`;
    // [FIX m9] El botó crida copiarResultats() que ja gestiona el feedback visual internament
    sc.style.display = 'block';
    if (window._fixedSessionActive) { const b = document.getElementById('btn-copiar-hist'); if (b) b.style.display = 'none'; }
}

// ── GENERADOR DE CODI v2 ─────────────────────────────────────────────────────
async function copiarResultats() {
    // Salt
    let salt = '';
    const ch = 'abcdefghijklmnopqrstuvwxyz';
    for (let i = 0; i < 3; i++) salt += ch.charAt(Math.floor(Math.random() * ch.length));

    // Data i hora
    const ara    = new Date();
    const dia    = String(ara.getDate()).padStart(2,'0');
    const mes    = String(ara.getMonth()+1).padStart(2,'0');
    const hora   = String(ara.getHours()).padStart(2,'0');
    const minuts = String(ara.getMinutes()).padStart(2,'0');

    // Exercici
    const nomFitxer = window.location.pathname.split('/').pop().replace('.html','');
    const exCode    = EXERCISE_CODES[nomFitxer] ?? 'XX';

    // Dificultat, sessions, preguntes
    const dif       = String(Math.min(Math.max(currentDifficulty || 0, 0), 3));
    const sessions  = String(Math.min(TOTAL_SESSIONS, 5));
    const questions = String(Math.min(TOTAL_OPERATIONS, 10)).padStart(2,'0');

    // Nota (NNN = nota x 10, 000-100)
    const notaSobre10 = calculaNotaSobre10();
    const notaInt     = Math.round(notaSobre10 * 10);
    const notaStr     = String(notaInt).padStart(3,'0');

    // Resultats per pregunta (30 chars)
    const resultsStr = sessionResults.slice(0,30).map(String).join('').padEnd(30,'0');

    // Checksum
    const valorAscii  = salt.charCodeAt(0);
    const sumaControl = notaInt + parseInt(dia,10) + parseInt(mes,10) + parseInt(hora,10) + parseInt(minuts,10) + valorAscii;
    const lletresCtrl = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const lletra      = lletresCtrl.charAt(sumaControl % 23);

    // Codi final: Lsss-DDMM-HHMM-EE-D-S-QQ-NNN-RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
    const output = `${lletra}${salt}-${dia}${mes}-${hora}${minuts}-${exCode}-${dif}-${sessions}-${questions}-${notaStr}-${resultsStr}`;
    console.log('Codi v2:', output, '(', output.length, 'chars)');

    function mostrarExit() {
        const btn = document.getElementById('btn-copiar');
        if (btn) { btn.innerText = 'Copiat! ✅'; btn.style.backgroundColor = 'var(--success)'; setTimeout(() => { btn.style.display = 'none'; }, 3000); }
    }

    try {
        await navigator.clipboard.writeText(output);
        mostrarExit();
    } catch (err) {
        let fb = document.getElementById('fallback-code-box');
        if (!fb) {
            fb = document.createElement('div');
            fb.id = 'fallback-code-box';
            fb.style.cssText = 'margin:15px auto;padding:14px 18px;background:#f1f5f9;border:2px solid #cbd5e1;border-radius:8px;text-align:center;max-width:520px;';
            fb.innerHTML = `<div style="font-size:0.9em;color:#64748b;margin-bottom:8px;">Selecciona i copia aquest codi:</div><div id="fallback-code-text" style="font-family:monospace;font-size:0.9em;font-weight:bold;color:#1e293b;user-select:all;-webkit-user-select:all;cursor:text;padding:8px;background:white;border-radius:4px;border:1px solid #e2e8f0;word-break:break-all;letter-spacing:0.5px;"></div>`;
            (document.querySelector('.panel') || document.body).appendChild(fb);
        }
        document.getElementById('fallback-code-text').textContent = output;
        fb.style.display = 'block';
        fb.scrollIntoView({ behavior:'smooth', block:'nearest' });
    }
}
