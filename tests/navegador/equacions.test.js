/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/navegador/equacions.test.js
 * ROL: «Equacions» (a-equacions, PR 12h) al navegador, amb el motor nou:
 *      l'equació de cada nivell, la resposta equivocada substituïda a
 *      l'equació, l'ajuda per tocs (caixes i caramels, operació), la
 *      solució revelada, el teclat tàctil, el botó del tutorial i les
 *      sessions fixes. La lògica pura té els seus tests a
 *      tests/activitats.test.js.
 * ============================================================================
 */
'use strict';
const { suite, ok } = require('../harness');
const { obre, estat, esperaLliure, jugaFinsAlFinal, unics } = require('./helpers');

const RUTA = (nivell, extra = '') => `a-equacions.html?nivell=${nivell}&fixed=A&totaloperations=3&maxintents=3${extra}`;

module.exports = async function ({ browser, base }) {
    suite("Equacions: l'equació en gran i «x = [ ]» a cada nivell");
    for (const nivell of [1, 2, 3, 4]) {
        const page = await obre(browser, base, RUTA(nivell), { rapid: false });
        await esperaLliure(page);
        const e = await estat(page);
        const v = await page.evaluate(() => ({
            equacio: document.getElementById('equation-display').textContent.replace(/\s+/g, ' ').trim(),
            etiqueta: document.getElementById('answer-x-label').textContent,
            cap: document.getElementById('lvl-display').textContent,
        }));
        ok(
            v.equacio.includes('x') && v.equacio.includes('=') && v.etiqueta === 'x' && v.cap === 'Equació 1 de 3',
            `nivell ${nivell}: «${v.equacio}», camp «x =» i «${v.cap}» (solució ${e.resposta})`
        );
        ok(
            page.errors.length === 0 && page.externes.length === 0,
            `sense errors JS ni peticions externes (${unics(page.errors) || 'cap'})`
        );
        await page.context().close();
    }

    suite('Equacions: resposta substituïda, ajuda per tocs i solució revelada');
    {
        const page = await obre(browser, base, RUTA(2), { congela: 2000 });
        await esperaLliure(page);
        const e = await estat(page);
        await page.evaluate(x => {
            document.getElementById('value-input').value = String(x);
            window.checkValue();
        }, e.resposta + 1);
        const sub = await page.evaluate(() => document.querySelector('#part-feedback .part')?.textContent.trim());
        ok(/^.+ = \d+ ≠ \d+ ✖$/.test(sub || ''), `una resposta equivocada es substitueix a l'equació («${sub}»)`);
        const dibuixos = [];
        for (let i = 0; i < 3; i++) {
            await page.click('.btn-ajuda');
            dibuixos.push(
                await page.evaluate(() => ({
                    caixes: document.querySelectorAll('#help-text .ajuda-caixa').length,
                    operacio: document.querySelector('#help-text .ajuda-operacio')?.textContent ?? '',
                    visible: document.getElementById('help-text').classList.contains('visible'),
                }))
            );
        }
        ok(
            dibuixos[0].visible &&
                dibuixos[0].caixes >= 1 &&
                !dibuixos[0].operacio &&
                dibuixos[1].operacio.endsWith('= ?') &&
                !dibuixos[2].visible,
            `el 💡 mostra el dibuix de caixes i caramels, l'operació («${dibuixos[1].operacio}») i res`
        );
        for (let i = 0; i < 2; i++) {
            await esperaLliure(page);
            await page.evaluate(x => {
                document.getElementById('value-input').value = String(x);
                window.checkValue();
            }, e.resposta + 1);
        }
        await page.waitForFunction(() => document.getElementById('value-input').classList.contains('reveal'), null, {
            timeout: 4000,
        });
        const r = await page.evaluate(() => document.getElementById('value-input').value);
        ok(r === String(e.resposta), `amb els intents esgotats la solució surt al camp, en verd (${r})`);
        await page.context().close();
    }

    suite('Equacions: partida completa, teclat tàctil, tutorial i sessions fixes');
    {
        const p = await obre(browser, base, RUTA(4));
        ok(
            await jugaFinsAlFinal(p, 'int'),
            'responent bé de totes les equacions del nivell 4 s’arriba a la pantalla final'
        );
        ok(p.errors.length === 0, `sense errors JS (${unics(p.errors) || 'cap'})`);
        await p.context().close();

        const m = await obre(browser, base, RUTA(2), { mobil: true, w: 360, h: 700 });
        await esperaLliure(m);
        const { resposta } = await estat(m);
        for (const c of String(resposta)) await m.locator(`#customKeyboard .kb-btn[data-key="${c}"]`).tap();
        await m.locator('#customKeyboard .kb-enter').tap();
        await m.waitForFunction(() => window.__estatProves().sessionScore > 0, null, { timeout: 4000 });
        const d = await m.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
        ok(d[0] <= d[1], `teclat tàctil: la resposta es dona per bona i no desborda (${d[0]} ≤ ${d[1]})`);
        await m.context().close();

        const t = await obre(browser, base, RUTA(3), { rapid: false });
        await Promise.all([t.waitForURL(/a-equacions-tutorial\.html/, { timeout: 4000 }), t.click('#btn-tutorial')]);
        ok(
            new URL(t.url()).searchParams.get('nivell') === '3',
            'el botó del tutorial hi porta els paràmetres (?nivell=3)'
        );
        await t.context().close();

        const a = await obre(browser, base, RUTA(2), { rapid: false });
        const b = await obre(browser, base, RUTA(2), { rapid: false });
        const [ea, eb] = [await estat(a), await estat(b)];
        ok(JSON.stringify(ea.equacio) === JSON.stringify(eb.equacio), '?fixed=A dona sempre la mateixa equació');
        await a.context().close();
        await b.context().close();
    }
};
