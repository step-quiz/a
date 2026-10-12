/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/navegador/helpers.js
 * ROL: Eines comunes dels tests de navegador (Chromium amb Playwright):
 *      servidor local, obrir pàgines recollint errors, temporitzadors
 *      accelerats i «jugar» una activitat fins al final.
 *      TOT el que els tests saben del funcionament intern de les activitats és
 *      aquí: com es llegeix l'estat (script ESTAT: window.__prova(), que cada
 *      activitat publica amb registraProva a js/game-core.js) i com es respon.
 * ============================================================================
 */
'use strict';
const path = require('path');
const { ROOT } = require('../harness');
const { crea } = require('../../tools/servidor');

/** Carrega Playwright de tools/proves (npm ci --prefix tools/proves) o, si no, d'on estigui instal·lat. */
function carregaPlaywright() {
    try {
        return require(require.resolve('playwright', { paths: [path.join(ROOT, 'tools/proves'), ROOT] }));
    } catch {
        try {
            return require('playwright');
        } catch {
            return null;
        }
    }
}

/** Carrega axe-core per a Playwright (tools/proves). Retorna null si no hi és. */
function carregaAxe() {
    try {
        return require(require.resolve('@axe-core/playwright', { paths: [path.join(ROOT, 'tools/proves'), ROOT] }))
            .default;
    } catch {
        return null;
    }
}

/** Engega el servidor del repositori en un port lliure. */
function engegaServidor() {
    return new Promise(resolve => {
        const servidor = crea();
        servidor.listen(0, '127.0.0.1', () =>
            resolve({ servidor, base: `http://127.0.0.1:${servidor.address().port}` })
        );
    });
}

/** Les cinc activitats i com es respon cadascuna: 'int' (enter), 'money' (decimal amb coma) o 'rellotge'. */
const ACTIVITATS = [
    ['a-enters', 'int'],
    ['a-decimals', 'money'],
    ['a-equacions', 'int'],
    ['a-proporciodirecta', 'int'],
    ['a-rellotge', 'rellotge'],
];

/** Script que s'executa abans de cada pàgina: comprimeix els temporitzadors ×20 (manté l'ordre relatiu). */
const ACCELERA = () => {
    const st = window.setTimeout.bind(window);
    window.setTimeout = (fn, ms, ...a) => st(fn, ms > 0 ? Math.max(1, Math.round(ms / 20)) : ms, ...a);
    window.alert = () => {};
    window.confirm = () => true;
};

/**
 * Script que «congela» la pàgina en l'estat que acaba de mostrar: els temporitzadors d'`llindar` ms o més no
 * s'executen mai (per exemple, el que retira el missatge «Molt bé!»). S'ha de posar DESPRÉS d'ACCELERA.
 */
const CONGELA = llindar => {
    const st = window.setTimeout.bind(window);
    window.setTimeout = (fn, ms, ...a) => (ms >= llindar ? 0 : st(fn, ms, ...a));
};

/**
 * Script que s'executa abans de cada pàgina i hi defineix window.__estatProves(): l'estat intern de l'activitat en
 * aquell moment. L'activitat el publica ella mateixa a window.__prova() (vegeu registraProva a js/game-core.js).
 * Claus: sessions, preguntes, intents (la configuració); sessionScore, sessionScores, sessionHistory, currentSession,
 * currentOperation, attemptsLeft, isTransitioning (el motor); ocupat (no admet resposta ara), resposta (la correcta, en
 * activitats d'un sol valor), hores/minuts (a-rellotge), nivell.
 */
const ESTAT = () => {
    window.__estatProves = () => window.__prova();
};

/**
 * Obre una pàgina en un context nou. `opcions`: mobil (360×700 tàctil), w/h (mida), rapid (temporitzadors
 * ×20, per defecte sí), reduit (moviment reduït, com si l'usuari l'hagués demanat al sistema), congela (ms:
 * congela els temporitzadors d'aquesta durada o més), init (script addicional). La pàgina rep: errors[] (errors JS i de consola),
 * fallades[] (peticions que fallen o amb HTTP ≥ 400) i externes[] (peticions fora del servidor local).
 */
async function obre(browser, base, ruta, opcions = {}) {
    const { mobil = false, w, h, rapid = true, reduit = false, congela = 0, init = null } = opcions;
    const ctx = await browser.newContext({
        ...(mobil
            ? { viewport: { width: w || 360, height: h || 700 }, hasTouch: true, isMobile: true }
            : { viewport: { width: w || 1280, height: h || 800 } }),
        ...(reduit ? { reducedMotion: 'reduce' } : {}),
    });
    await ctx.addInitScript(ESTAT);
    const page = await ctx.newPage();
    page.errors = [];
    page.fallades = [];
    page.externes = [];
    page.on('pageerror', e => page.errors.push(e.message));
    page.on('console', m => m.type() === 'error' && page.errors.push(`consola: ${m.text()}`));
    page.on('requestfailed', r => page.fallades.push(`${r.failure() && r.failure().errorText} ${r.url()}`));
    page.on('response', r => r.status() >= 400 && page.fallades.push(`${r.status()} ${r.url()}`));
    page.on('request', r => !r.url().startsWith(base) && !r.url().startsWith('data:') && page.externes.push(r.url()));
    if (rapid) await page.addInitScript(ACCELERA);
    if (congela) await page.addInitScript(CONGELA, congela);
    if (init) await page.addInitScript(init);
    await page.goto(`${base}/${ruta}`, { waitUntil: 'load' });
    await page.waitForTimeout(200);
    return page;
}

/** Estat intern de l'activitat ara mateix (vegeu ESTAT). */
const estat = page => page.evaluate(() => window.__estatProves());

/** Espera que l'activitat deixi de processar la resposta anterior (animacions, penalització, transicions). */
const esperaLliure = page => page.waitForFunction(() => !window.__estatProves().ocupat, null, { timeout: 8000 });

/** Respon la pregunta actual, bé o malament, i l'envia. */
async function respon(page, tipus, correcte = true) {
    if (tipus === 'rellotge') {
        await page.evaluate(ok => {
            const { hores, minuts } = window.__estatProves();
            document.getElementById('input-hores').value = String(ok ? hores : (hores % 12) + 1);
            document.getElementById('input-minuts').value = String(minuts);
            window.checkAnswer();
        }, correcte);
    } else {
        await page.evaluate(ok => {
            const { resposta } = window.__estatProves();
            const fmt = n => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ','));
            document.getElementById('value-input').value = fmt(ok ? resposta : resposta + 1);
            window.checkValue();
        }, correcte);
    }
}

/** Respon (esperant que l'activitat estigui lliure). */
async function responLliure(page, tipus, correcte = true) {
    await esperaLliure(page);
    await respon(page, tipus, correcte);
}

/** Juga fins a la pantalla final (gestiona els canvis de sessió i els problemes de dos passos). */
async function jugaFinsAlFinal(page, tipus, { correcte = true, maxPassos = 400 } = {}) {
    for (let i = 0; i < maxPassos; i++) {
        const st = await page.evaluate(() => ({
            fin: getComputedStyle(document.getElementById('final-screen')).display !== 'none',
            sessio: getComputedStyle(document.getElementById('session-end-screen')).display !== 'none',
            ocupat: window.__estatProves().ocupat,
        }));
        if (st.fin) return true;
        if (st.sessio) {
            await page.waitForTimeout(90);
            await page.evaluate(() => window.startNextSession());
            await page.waitForTimeout(60);
            continue;
        }
        if (st.ocupat) {
            await page.waitForTimeout(30);
            continue;
        }
        await respon(page, tipus, correcte);
        await page.waitForTimeout(25);
    }
    return false;
}

const text = s =>
    String(s || '')
        .replace(/\s+/g, ' ')
        .trim();
const unics = errs => [...new Set(errs)].join(' | ');

module.exports = {
    carregaPlaywright,
    carregaAxe,
    engegaServidor,
    ACTIVITATS,
    ACCELERA,
    obre,
    estat,
    esperaLliure,
    respon,
    responLliure,
    jugaFinsAlFinal,
    text,
    unics,
};
