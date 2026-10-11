/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/navegador/prioritat.test.js
 * ROL: «Prioritat d'operacions» (a-prioritat, PR 12k) al navegador, amb el
 *      motor nou: la taula amb els botons de cada nivell, una operació que
 *      encara no es pot fer (✖ i les d'abans ✔), un resultat equivocat amb
 *      xifres, la resolució acabada quan s'esgoten els intents, el botó
 *      «Següent», la partida completa, el mòbil i les sessions fixes. La
 *      lògica pura té els seus tests a tests/activitats.test.js.
 * ============================================================================
 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { suite, ok } = require('../harness');
const { obre, estat, esperaLliure, unics } = require('./helpers');

const RUTA = (nivell, extra = '') => `a-prioritat.html?nivell=${nivell}&fixed=A&totaloperations=4&maxintents=3${extra}`;

module.exports = async function ({ browser, base }) {
    const G = await import(pathToFileURL(path.join(__dirname, '../../js/a-prioritat/generador.js')).href);
    const esperaFase = (page, fase) =>
        page.waitForFunction(f => window.__estatProves().fase === f, fase, { timeout: 4000 });
    /** Toca una operació de la línia de treball. */
    const toca = (page, i) => page.click(`#steps-box .tok-btn[data-i="${i}"]`);
    /** Fa una operació bona: la primera que es pot fer i el seu resultat. */
    const operaBe = async page => {
        const { linia } = await estat(page);
        const i = G.readyOps(linia.line)[0];
        await toca(page, i);
        await esperaFase(page, 'result');
        await page.click(`#chip-pool .num-chip[data-val="${G.opValue(linia.line, i)}"]`);
    };

    suite('Prioritat: la resolució en una taula amb botons a cada nivell');
    for (const nivell of [1, 2, 3, 4]) {
        const page = await obre(browser, base, RUTA(nivell), { rapid: false });
        await esperaLliure(page);
        const e = await estat(page);
        const v = await page.evaluate(() => ({
            botons: document.querySelectorAll('#steps-box .tok-btn').length,
            cols: document.querySelectorAll('#steps-box tr:first-child td:not(.igual)').length,
            cap: document.getElementById('lvl-display').textContent,
            ordre: document.getElementById('step-instruction').textContent,
        }));
        const esperats = e.tokens.filter(t => t.k === 'op' || t.k === 'pow').length;
        ok(
            v.botons === esperats && v.cols === e.tokens.length && v.cap === 'Repte 1 de 4' && v.ordre === '👆',
            `nivell ${nivell}: «${G.textExpressio(e.tokens)}» amb ${v.botons} botons (un per cada signe o potència), «${v.cap}» i 👆`
        );
        ok(
            page.errors.length === 0 && page.externes.length === 0,
            `sense errors JS ni peticions externes (${unics(page.errors) || 'cap'})`
        );
        await page.context().close();
    }

    suite('Prioritat: una operació que encara no es pot fer, un resultat equivocat i la resolució acabada');
    {
        const page = await obre(browser, base, RUTA(1, '&maxintents=3'), { congela: 2000 });
        await esperaLliure(page);
        const { linia } = await estat(page);
        const ready = G.readyOps(linia.line);
        const bloquejada = linia.line.findIndex((t, i) => t.k === 'op' && !ready.includes(i));
        await toca(page, bloquejada);
        const b = await page.evaluate(() => ({
            text: document.getElementById('feedback').textContent.replace(/\s+/g, ' ').trim(),
            vermell: document.querySelectorAll('#steps-box .tok-btn.hl-red').length,
            verd: document.querySelectorAll('#steps-box .tok-btn.hl-green').length,
            intents: document.getElementById('attempts-display').textContent,
        }));
        ok(
            /✔›.+ ✖$/.test(b.text) && b.vermell === 1 && b.verd >= 1 && /2$/.test(b.intents),
            `una operació que no toca: «${b.text}», marcada en vermell, les d'abans en verd, i un intent menys («${b.intents}»)`
        );
        await toca(page, ready[0]);
        await esperaFase(page, 'result');
        const bona = G.opValue(linia.line, ready[0]);
        const mala = await page.evaluate(
            v =>
                [...document.querySelectorAll('#chip-pool .num-chip')].find(c => Number(c.dataset.val) !== v).dataset
                    .val,
            bona
        );
        await page.click(`#chip-pool .num-chip[data-val="${mala}"]`);
        const r = await page.evaluate(() => ({
            text: document.getElementById('feedback').textContent.replace(/\s+/g, ' ').trim(),
            ratllats: document.querySelectorAll('#chip-pool .num-chip.chip-wrong').length,
        }));
        ok(
            /^.+ = \d+ ✖$/.test(r.text) && r.ratllats === 1,
            `un resultat equivocat es comprova amb xifres («${r.text}») i el botó queda ratllat`
        );
        // Un tercer error: s'esgoten els intents i la resolució s'acaba sola
        const altra = await page.evaluate(
            ({ v, m }) =>
                [...document.querySelectorAll('#chip-pool .num-chip')].find(
                    c => Number(c.dataset.val) !== v && Number(c.dataset.val) !== m
                ).dataset.val,
            { v: bona, m: Number(mala) }
        );
        await page.click(`#chip-pool .num-chip[data-val="${altra}"]`);
        await page.waitForSelector('#btn-next', { timeout: 5000 });
        const f = await page.evaluate(() => ({
            auto: document.querySelectorAll('#steps-box tr.auto').length,
            fila: document.querySelectorAll('#steps-box tr').length,
            botons: document.querySelectorAll('#steps-box .tok-btn').length,
            ultima: document.querySelector('#steps-box tr:last-child td')?.textContent,
            text: document.getElementById('btn-next').textContent,
        }));
        ok(
            f.auto >= 1 &&
                f.botons === 0 &&
                f.ultima === String((await estat(page)).resposta) &&
                f.text === 'Següent ›',
            `sense intents: la resolució s'acaba sola (${f.fila} línies, ${f.auto} en gris, resultat ${f.ultima}) i surt «${f.text}»`
        );
        await page.context().close();
    }

    suite('Prioritat: partida completa, mòbil i sessions fixes');
    {
        const p = await obre(browser, base, RUTA(4, '&totaloperations=3'));
        let final = false;
        for (let i = 0; i < 400 && !final; i++) {
            final = await p.evaluate(
                () => getComputedStyle(document.getElementById('final-screen')).display !== 'none'
            );
            if (final) break;
            const st = await p.evaluate(() => ({
                sessio: getComputedStyle(document.getElementById('session-end-screen')).display !== 'none',
                ...window.__estatProves(),
            }));
            if (st.sessio) await p.evaluate(() => window.startNextSession());
            else if (st.acabada) await p.click('#btn-next');
            else if (!st.ocupat) await operaBe(p);
            await p.waitForTimeout(30);
        }
        ok(
            final && p.errors.length === 0,
            `resolent bé totes les expressions s'arriba a la pantalla final (sense errors: ${unics(p.errors) || 'cap'})`
        );
        await p.context().close();

        const m = await obre(browser, base, RUTA(4), { mobil: true, w: 360, h: 700 });
        await esperaLliure(m);
        const d = await m.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
        await m.locator('#steps-box .tok-btn').first().tap();
        ok(d[0] <= d[1], `al mòbil (360 px) no desborda (${d[0]} ≤ ${d[1]})`);
        await m.context().close();

        const a = await obre(browser, base, RUTA(3), { rapid: false });
        const b = await obre(browser, base, RUTA(3), { rapid: false });
        const [ea, eb] = [await estat(a), await estat(b)];
        ok(JSON.stringify(ea.tokens) === JSON.stringify(eb.tokens), '?fixed=A dona sempre la mateixa expressió');
        await a.context().close();
        await b.context().close();
    }
};
