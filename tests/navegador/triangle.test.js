/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/navegador/triangle.test.js
 * ROL: «Triangle rectangle» (a-triangle-rectangle, PR 12f) al navegador, amb
 *      el motor nou: el triangle amb «a = ?», les quatre opcions, les marques
 *      ✖, l'ajuda per tocs, la solució revelada, la partida completa, que no
 *      desbordi en mòbil i les sessions fixes. La lògica pura té els seus
 *      tests a tests/activitats.test.js.
 * ============================================================================
 */
'use strict';
const { suite, ok } = require('../harness');
const { obre, estat, esperaLliure, unics } = require('./helpers');

const RUTA = (nivell, extra = '') =>
    `a-triangle-rectangle.html?nivell=${nivell}&fixed=A&totaloperations=4&maxintents=3${extra}`;

/** Fa clic a l'opció bona o a la primera equivocada que encara és activa. */
const clica = (page, correcta) =>
    page.evaluate(bona => {
        const { opcions } = window.__estatProves();
        const botons = [...document.querySelectorAll('#options-container .btn-option')];
        botons.find((b, k) => !b.disabled && opcions[k].correcta === bona).click();
    }, correcta);

module.exports = async function ({ browser, base }) {
    suite('Triangle rectangle: el triangle amb «?», les quatre opcions i cada nivell');
    for (const nivell of [1, 2, 3]) {
        const page = await obre(browser, base, RUTA(nivell), { rapid: false });
        await esperaLliure(page);
        const e = await estat(page);
        const v = await page.evaluate(() => ({
            etiquetes: [...document.querySelectorAll('#triangle-container text')].map(t => t.textContent),
            botons: [...document.querySelectorAll('#options-container .btn-option')].map(b => b.textContent),
            cap: document.getElementById('lvl-display').textContent,
        }));
        const cercat = e.problema.find;
        ok(
            v.etiquetes.includes(`${cercat} = ?`) && v.botons.length === 4 && v.cap === 'Repte 1 de 4',
            `nivell ${nivell}: el triangle porta «${cercat} = ?» i quatre opcions (${v.botons.join(', ')})`
        );
        ok(
            v.botons.includes(e.problema.answer),
            `la resposta correcta («${e.problema.answer}») és a les opcions i ${nivell === 3 ? 'el problema porta arrels' : 'no hi ha arrels als costats'}`
        );
        ok(
            page.errors.length === 0 && page.externes.length === 0,
            `sense errors JS ni peticions externes (${unics(page.errors) || 'cap'})`
        );
        await page.context().close();
    }

    suite('Triangle rectangle: opció equivocada, ajuda per tocs i solució revelada');
    {
        const page = await obre(browser, base, RUTA(2), { congela: 2000 });
        await esperaLliure(page);
        await clica(page, false);
        const mal = await page.evaluate(() => ({
            marcats: [...document.querySelectorAll('#options-container .btn-option.wrong')].map(b => b.textContent),
            desactivats: document.querySelectorAll('#options-container .btn-option:disabled').length,
        }));
        ok(
            mal.marcats.length === 1 && mal.marcats[0].endsWith('✖') && mal.desactivats === 1,
            `una opció equivocada surt amb ✖ i es desactiva («${mal.marcats[0]}»)`
        );
        const text = async () => page.evaluate(() => document.getElementById('help-text').textContent.trim());
        await page.click('.btn-ajuda');
        const t1 = await text();
        await page.click('.btn-ajuda');
        const t2 = await text();
        await page.click('.btn-ajuda');
        const t3 = await text();
        ok(
            /^[abc]² = [abc]² [+−] [abc]²$/.test(t1) && t2.split('²').length > 5 && t2.includes(t1) && t3 === '',
            `el 💡 mostra la fórmula («${t1}»), la fórmula amb els valors («${t2.replace(t1, '').trim()}») i res`
        );
        await esperaLliure(page);
        await clica(page, false);
        await esperaLliure(page);
        await clica(page, false);
        await page.waitForSelector('#options-container .btn-option.reveal-answer', { timeout: 4000 });
        const rev = await page.evaluate(() => ({
            revelats: document.querySelectorAll('#options-container .btn-option.reveal-answer').length,
            tots: [...document.querySelectorAll('#options-container .btn-option')].every(b => b.disabled),
        }));
        ok(
            rev.revelats === 1 && rev.tots,
            'amb els intents esgotats surt la resposta correcta en verd i tot queda bloquejat'
        );
        await page.context().close();
    }

    suite('Triangle rectangle: partida completa, mòbil i sessions fixes');
    {
        const p = await obre(browser, base, RUTA(3, '&totaloperations=3'));
        let final = false;
        for (let i = 0; i < 200 && !final; i++) {
            final = await p.evaluate(
                () => getComputedStyle(document.getElementById('final-screen')).display !== 'none'
            );
            if (final) break;
            const st = await p.evaluate(() => ({
                sessio: getComputedStyle(document.getElementById('session-end-screen')).display !== 'none',
                ocupat: window.__estatProves().ocupat,
            }));
            if (st.sessio) await p.evaluate(() => window.startNextSession());
            else if (!st.ocupat) await clica(p, true);
            await p.waitForTimeout(40);
        }
        ok(
            final && p.errors.length === 0,
            `responent bé s'arriba a la pantalla final (sense errors: ${unics(p.errors) || 'cap'})`
        );
        await p.context().close();

        const m = await obre(browser, base, RUTA(3), { mobil: true, w: 360, h: 700 });
        await esperaLliure(m);
        await m.locator('.btn-ajuda').tap();
        await m.locator('.btn-ajuda').tap();
        const d = await m.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
        ok(d[0] <= d[1], `en mòbil, amb l'ajuda oberta, no desborda (${d[0]} ≤ ${d[1]})`);
        await m.context().close();

        const a = await obre(browser, base, RUTA(2), { rapid: false });
        const b = await obre(browser, base, RUTA(2), { rapid: false });
        const [ea, eb] = [await estat(a), await estat(b)];
        ok(ea.problema.id === eb.problema.id, '?fixed=A dona sempre el mateix problema');
        await a.context().close();
        await b.context().close();
    }
};
