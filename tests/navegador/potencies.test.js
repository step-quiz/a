/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/navegador/potencies.test.js
 * ROL: «Potències» (a-potencies, PR 12i) al navegador, amb el motor nou:
 *      la pregunta de cada nivell i el camp (aixecat com un exponent o amb
 *      el valor), la resposta equivocada comprovada amb xifres, l'ajuda per
 *      tocs, la solució revelada, el teclat tàctil (amb el signe menys) i
 *      les sessions fixes. La lògica pura té els seus tests a
 *      tests/activitats.test.js.
 * ============================================================================
 */
'use strict';
const { suite, ok } = require('../harness');
const { obre, estat, esperaLliure, jugaFinsAlFinal, unics } = require('./helpers');

const RUTA = (nivell, extra = '') => `a-potencies.html?nivell=${nivell}&fixed=A&totaloperations=3&maxintents=3${extra}`;

module.exports = async function ({ browser, base }) {
    suite('Potències: la pregunta en gran i «= [ ]» a cada nivell');
    for (const nivell of [1, 2, 3, 4]) {
        const page = await obre(browser, base, RUTA(nivell), { rapid: false });
        await esperaLliure(page);
        const e = await estat(page);
        const v = await page.evaluate(() => ({
            pregunta: document.getElementById('equation-display').textContent.replace(/\s+/g, ' ').trim(),
            etiqueta: document.getElementById('answer-x-label').textContent,
            exponent: document.getElementById('answer-row').classList.contains('exponent'),
            cap: document.getElementById('lvl-display').textContent,
        }));
        ok(
            v.pregunta !== '' && v.cap === 'Potència 1 de 3' && v.exponent === (e.pregunta.kind === 'exp'),
            `nivell ${nivell}: «${v.pregunta}» amb etiqueta «${v.etiqueta}», camp ${v.exponent ? 'aixecat (exponent)' : 'del valor'} i «${v.cap}» (solució ${e.resposta})`
        );
        ok(
            page.errors.length === 0 && page.externes.length === 0,
            `sense errors JS ni peticions externes (${unics(page.errors) || 'cap'})`
        );
        await page.context().close();
    }

    suite('Potències: resposta comprovada amb xifres, ajuda per tocs i solució revelada');
    {
        const page = await obre(browser, base, RUTA(1), { congela: 2000 });
        await esperaLliure(page);
        const e = await estat(page);
        await page.evaluate(x => {
            document.getElementById('value-input').value = String(x);
            window.checkValue();
        }, e.resposta + 1);
        const xip = await page.evaluate(() => document.querySelector('#part-feedback .part')?.textContent.trim());
        ok(/^\d+\d* = \d+ ≠ \d+ ✖$/.test(xip || ''), `una resposta equivocada es comprova amb xifres («${xip}»)`);
        const tocs = [];
        for (let i = 0; i < 3; i++) {
            await page.click('.btn-ajuda');
            tocs.push(
                await page.evaluate(() => ({
                    text: document.getElementById('help-text').textContent.replace(/\s+/g, ' ').trim(),
                    operacio: document.querySelector('#help-text .ajuda-operacio')?.textContent ?? '',
                    visible: document.getElementById('help-text').classList.contains('visible'),
                }))
            );
        }
        ok(
            tocs[0].visible &&
                tocs[0].text.includes('·') &&
                !tocs[0].operacio &&
                /[+−] .+ = \?$/.test(tocs[1].operacio) &&
                !tocs[2].visible,
            `el 💡 mostra els factors, l'operació dels exponents («${tocs[1].operacio}») i res`
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

    suite('Potències: partida completa, teclat tàctil amb signe i sessions fixes');
    {
        const p = await obre(browser, base, RUTA(4));
        ok(
            await jugaFinsAlFinal(p, 'int'),
            'responent bé de totes les preguntes del nivell 4 s’arriba a la pantalla final'
        );
        ok(p.errors.length === 0, `sense errors JS (${unics(p.errors) || 'cap'})`);
        await p.context().close();

        const m = await obre(browser, base, RUTA(4), { mobil: true, w: 360, h: 700 });
        await esperaLliure(m);
        const { resposta } = await estat(m);
        for (const c of String(resposta)) await m.locator(`#customKeyboard .kb-btn[data-key="${c}"]`).tap();
        await m.locator('#customKeyboard .kb-enter').tap();
        await m.waitForFunction(() => window.__estatProves().sessionScore > 0, null, { timeout: 4000 });
        const d = await m.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
        ok(d[0] <= d[1], `teclat tàctil: la resposta (${resposta}) es dona per bona i no desborda (${d[0]} ≤ ${d[1]})`);
        await m.context().close();

        const a = await obre(browser, base, RUTA(3), { rapid: false });
        const b = await obre(browser, base, RUTA(3), { rapid: false });
        const [ea, eb] = [await estat(a), await estat(b)];
        ok(JSON.stringify(ea.pregunta) === JSON.stringify(eb.pregunta), '?fixed=A dona sempre la mateixa pregunta');
        await a.context().close();
        await b.context().close();
    }
};
