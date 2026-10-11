/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/navegador/mcdmcm.test.js
 * ROL: «MCD i MCM» (a-mcd-mcm, PR 12b) al navegador, amb el motor nou: els dos
 *      nombres i la factorització per nivell, els dos passos, la resposta
 *      equivocada amb les seves divisions ✔/✖, l'ajuda, la solució revelada, el teclat
 *      tàctil, que no desbordi en mòbil i les sessions fixes. La lògica pura
 *      té els seus tests a tests/activitats.test.js.
 * ============================================================================
 */
'use strict';
const { suite, ok } = require('../harness');
const { obre, estat, esperaLliure, unics } = require('./helpers');

const RUTA = (nivell, extra = '') => `a-mcd-mcm.html?nivell=${nivell}&fixed=A&totaloperations=3&maxintents=3${extra}`;

/** Escriu una resposta al camp i l'envia. */
const respon = (page, valor) =>
    page.evaluate(v => {
        document.getElementById('value-input').value = String(v);
        window.checkValue();
    }, valor);

module.exports = async function ({ browser, base }) {
    suite('MCD i MCM: els dos nombres i la factorització segons el nivell');
    for (const nivell of [1, 2, 3]) {
        const page = await obre(browser, base, RUTA(nivell), { rapid: false });
        await esperaLliure(page);
        const e = await estat(page);
        const v = await page.evaluate(() => ({
            nombres: [...document.querySelectorAll('.nombre-gran')].map(n => n.textContent),
            factors: document.querySelectorAll('.nombre-factors').length,
            pas: document.getElementById('step-prompt').textContent.replace(/\s+/g, ' ').trim(),
            cap: document.getElementById('lvl-display').textContent,
        }));
        ok(
            v.nombres.join() === `${e.pregunta.a},${e.pregunta.b}` &&
                v.factors === (nivell === 1 ? 2 : 0) &&
                v.pas === `MCD (${e.pregunta.a}, ${e.pregunta.b}) =` &&
                v.cap === 'Repte 1 de 3',
            `nivell ${nivell}: ${v.nombres.join(' i ')}, ${v.factors ? 'amb' : 'sense'} factorització, «${v.pas}»`
        );
        ok(
            page.errors.length === 0 && page.externes.length === 0,
            `sense errors JS ni peticions externes (${unics(page.errors) || 'cap'})`
        );
        await page.context().close();
    }

    suite('MCD i MCM: resposta equivocada, ajuda, passos i solució revelada');
    {
        const page = await obre(browser, base, RUTA(2), { congela: 2000 });
        await esperaLliure(page);
        const e = await estat(page);
        await respon(page, e.resposta + 1);
        const mal = await page.evaluate(() =>
            [...document.querySelectorAll('#part-feedback .part')].map(p => p.textContent.trim())
        );
        const x = e.resposta + 1;
        const { a, b } = e.pregunta;
        ok(
            mal[0] === `${a} ÷ ${x} ${a % x === 0 ? '✔' : '✖'}` && mal[1] === `${b} ÷ ${x} ${b % x === 0 ? '✔' : '✖'}`,
            `una resposta equivocada surt amb les dues divisions i ✔/✖ («${mal.join(' · ')}»)`
        );
        await page.click('.btn-ajuda');
        const aj = await page.evaluate(() => ({
            visible: document.getElementById('help-text').classList.contains('visible'),
            comuns: document.querySelectorAll('#help-text .comu').length,
            factors: document.querySelectorAll('#help-text .ajuda-factors').length,
        }));
        ok(
            aj.visible && aj.comuns >= 2 && aj.factors === 2,
            "l'ajuda mostra la factorització (nivell 2) i els divisors comuns en destacat"
        );
        await esperaLliure(page);
        await respon(page, e.resposta);
        await page.waitForFunction(() => window.__estatProves().pas === 'mcm', null, { timeout: 3000 });
        const pas2 = await page.evaluate(() => ({
            fet: document.getElementById('steps-done').textContent.replace(/\s+/g, ' ').trim(),
            pas: document.getElementById('step-prompt').textContent.replace(/\s+/g, ' ').trim(),
            ajuda: document.getElementById('help-text').classList.contains('visible'),
        }));
        ok(
            pas2.fet.startsWith('✅ MCD') &&
                pas2.fet.endsWith(String(e.resposta)) &&
                pas2.pas.startsWith('MCM') &&
                !pas2.ajuda,
            `encertar el MCD passa al MCM i es queda el pas fet («${pas2.fet}»)`
        );
        // Dues respostes més de les tres permeses (n'hi ha una de feta): s'esgoten els intents
        for (let i = 0; i < 2; i++) {
            await esperaLliure(page);
            await respon(page, 1);
        }
        await page.waitForFunction(() => document.getElementById('value-input').classList.contains('reveal'), null, {
            timeout: 3000,
        });
        const r = await page.evaluate(() => ({
            valor: document.getElementById('value-input').value,
            esperada: window.__estatProves().resposta,
        }));
        ok(
            r.valor === String(r.esperada),
            `amb els intents esgotats surt el MCM correcte al camp, en verd (${r.valor})`
        );
        await page.context().close();
    }

    suite('MCD i MCM: partida completa i teclat tàctil en mòbil');
    {
        const p = await obre(browser, base, RUTA(1, '&totaloperations=2'));
        let final = false;
        for (let i = 0; i < 300 && !final; i++) {
            const st = await p.evaluate(() => ({
                fi: getComputedStyle(document.getElementById('final-screen')).display !== 'none',
                sessio: getComputedStyle(document.getElementById('session-end-screen')).display !== 'none',
                ocupat: window.__estatProves().ocupat || window.__estatProves().isTransitioning,
            }));
            final = st.fi;
            if (st.sessio) await p.evaluate(() => window.startNextSession());
            else if (!st.ocupat && !final) await respon(p, (await estat(p)).resposta);
            await p.waitForTimeout(40);
        }
        ok(
            final && p.errors.length === 0,
            `responent bé s'arriba a la pantalla final (sense errors: ${unics(p.errors) || 'cap'})`
        );
        await p.context().close();

        const m = await obre(browser, base, RUTA(3), { mobil: true, w: 360, h: 700 });
        await esperaLliure(m);
        const { resposta } = await estat(m);
        for (const c of String(resposta)) await m.locator(`#customKeyboard .kb-btn[data-key="${c}"]`).tap();
        const v = await m.evaluate(() => document.getElementById('value-input').value);
        await m.locator('#customKeyboard .kb-enter').tap();
        await m.waitForFunction(() => window.__estatProves().pas === 'mcm', null, { timeout: 4000 });
        const d = await m.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
        ok(
            v === String(resposta) && d[0] <= d[1],
            `teclat tàctil: «${v}» dona per bo el MCD i no desborda (${d[0]} ≤ ${d[1]})`
        );
        await m.context().close();
    }

    suite('MCD i MCM: sessions fixes');
    {
        const a = await obre(browser, base, RUTA(2), { rapid: false });
        const b = await obre(browser, base, RUTA(2), { rapid: false });
        const [ea, eb] = [await estat(a), await estat(b)];
        ok(
            ea.pregunta.a === eb.pregunta.a && ea.pregunta.b === eb.pregunta.b,
            '?fixed=A dona sempre els mateixos nombres'
        );
        await a.context().close();
        await b.context().close();
    }
};
