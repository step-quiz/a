/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/navegador/nombres.test.js
 * ROL: «Escriure nombres» (a-nombres-lletres, PR 12j) al navegador, amb el
 *      motor nou: el nombre en xifres i les 5 opcions de cada nivell, les dues
 *      oportunitats i prou (també amb ?maxintents=5), la bona revelada en
 *      verd, els punts de la segona oportunitat, que no desbordi al mòbil i
 *      les sessions fixes. La lògica pura té els seus tests a
 *      tests/activitats.test.js.
 * ============================================================================
 */
'use strict';
const { suite, ok } = require('../harness');
const { obre, estat, esperaLliure, unics } = require('./helpers');

const RUTA = (nivell, extra = '') => `a-nombres-lletres.html?nivell=${nivell}&fixed=A&totaloperations=4${extra}`;

/** Fa clic al botó d'una opció (la correcta o la primera incorrecta que encara és activa). */
const clica = (page, correcta) =>
    page.evaluate(bona => {
        const { pregunta } = window.__estatProves();
        const botons = [...document.querySelectorAll('#options-container .btn-option')];
        botons.find((b, k) => !b.disabled && pregunta.opcions[k].correcta === bona).click();
    }, correcta);

module.exports = async function ({ browser, base }) {
    suite('Nombres: «Baixar de nivell» i «Pujar de nivell» (el 1 només puja i el 4 només baixa)');
    {
        const botons = page =>
            page.evaluate(() =>
                ['btn-prev-level', 'btn-next-level']
                    .map(id => document.getElementById(id))
                    .filter(b => getComputedStyle(b).display !== 'none')
                    .map(b => b.textContent.trim())
            );
        const esperats = {
            1: ['Pujar de nivell ›'],
            2: ['‹ Baixar de nivell', 'Pujar de nivell ›'],
            3: ['‹ Baixar de nivell', 'Pujar de nivell ›'],
            4: ['‹ Baixar de nivell'],
        };
        for (const nivell of [1, 2, 3, 4]) {
            const page = await obre(browser, base, RUTA(nivell), { mobil: true });
            await esperaLliure(page);
            const b = await botons(page);
            const desborda = await page.evaluate(
                () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
            );
            ok(
                JSON.stringify(b) === JSON.stringify(esperats[nivell]) && !desborda,
                `nivell ${nivell}: ${b.map(x => `«${x}»`).join(' i ')}${desborda ? ' (desborda en mòbil)' : ''}`
            );
            await page.context().close();
        }
        const page = await obre(browser, base, RUTA(2), { rapid: false });
        await Promise.all([page.waitForNavigation({ timeout: 4000 }), page.click('#btn-prev-level')]);
        await esperaLliure(page);
        ok(
            (await estat(page)).nivell === 1 && /nivell=1/.test(page.url()) && /fixed=A/.test(page.url()),
            '«Baixar de nivell» porta al nivell 1 i conserva la resta de paràmetres'
        );
        await Promise.all([page.waitForNavigation({ timeout: 4000 }), page.click('#btn-next-level')]);
        await esperaLliure(page);
        ok((await estat(page)).nivell === 2, '«Pujar de nivell» torna al nivell 2');
        await page.context().close();
    }

    suite('Nombres: el nombre en xifres i 5 opcions escrites a cada nivell');
    const rangs = { 1: [0, 20], 2: [21, 69], 3: [70, 100], 4: [0, 100] };
    for (const nivell of [1, 2, 3, 4]) {
        const page = await obre(browser, base, RUTA(nivell), { rapid: false });
        await esperaLliure(page);
        const e = await estat(page);
        const v = await page.evaluate(() => ({
            xifres: document.querySelector('#question-prompt .nombre-gran')?.textContent,
            opcions: [...document.querySelectorAll('#options-container .btn-option')].map(b => b.textContent),
            cap: document.getElementById('lvl-display').textContent,
        }));
        const [min, max] = rangs[nivell];
        ok(
            Number(v.xifres) >= min &&
                Number(v.xifres) <= max &&
                v.opcions.length === 5 &&
                new Set(v.opcions).size === 5 &&
                v.opcions.includes(e.resposta) &&
                v.cap === 'Nombre 1 de 4',
            `nivell ${nivell}: ${v.xifres} → «${v.opcions.join('», «')}» (bona: ${e.resposta}) i «${v.cap}»`
        );
        ok(
            page.errors.length === 0 && page.externes.length === 0,
            `sense errors JS ni peticions externes (${unics(page.errors) || 'cap'})`
        );
        await page.context().close();
    }

    suite('Nombres: dues oportunitats i prou (també amb ?maxintents=5)');
    {
        const page = await obre(browser, base, RUTA(2, '&maxintents=5'), { congela: 2000 });
        await esperaLliure(page);
        const inici = await page.evaluate(() => document.getElementById('attempts-display').textContent);
        await clica(page, false);
        await esperaLliure(page);
        const mig = await page.evaluate(() => ({
            intents: document.getElementById('attempts-display').textContent,
            marcats: document.querySelectorAll('#options-container .btn-option.wrong:disabled').length,
            actius: document.querySelectorAll('#options-container .btn-option:not(:disabled)').length,
        }));
        ok(
            /2$/.test(inici) && /1$/.test(mig.intents) && mig.marcats === 1 && mig.actius === 4,
            `un error: queda 1 intent («${inici}» → «${mig.intents}»), l'opció dolenta es marca i les altres 4 segueixen actives`
        );
        await clica(page, true);
        await page.waitForFunction(() => window.__estatProves().sessionScore > 0, null, { timeout: 4000 });
        ok((await estat(page)).sessionScore === 8, 'encertar a la segona oportunitat val 8 punts');
        await page.context().close();

        const p2 = await obre(browser, base, RUTA(3, '&maxintents=5'), { congela: 2000 });
        await esperaLliure(p2);
        await clica(p2, false);
        await esperaLliure(p2);
        await clica(p2, false);
        await p2.waitForSelector('#options-container .btn-option.reveal-answer', { timeout: 4000 });
        const rev = await p2.evaluate(() => ({
            revelats: document.querySelectorAll('#options-container .btn-option.reveal-answer').length,
            tots: [...document.querySelectorAll('#options-container .btn-option')].every(b => b.disabled),
            punts: window.__estatProves().sessionScore,
        }));
        ok(
            rev.revelats === 1 && rev.tots && rev.punts === 0,
            'després de la segona errada surt la bona en verd, tot es bloqueja i no hi ha punts'
        );
        await p2.context().close();
    }

    suite('Nombres: partida completa, mòbil i sessions fixes');
    {
        const p = await obre(browser, base, RUTA(4, '&totaloperations=3'));
        let final = false;
        for (let i = 0; i < 300 && !final; i++) {
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
        const d = await m.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
        await m.locator('#options-container .btn-option').first().tap();
        ok(d[0] <= d[1], `al mòbil (360 px) no desborda (${d[0]} ≤ ${d[1]})`);
        await m.context().close();

        const a = await obre(browser, base, RUTA(2), { rapid: false });
        const b = await obre(browser, base, RUTA(2), { rapid: false });
        const [ea, eb] = [await estat(a), await estat(b)];
        ok(
            JSON.stringify(ea.pregunta) === JSON.stringify(eb.pregunta),
            '?fixed=A dona sempre la mateixa pregunta, amb les mateixes opcions i el mateix ordre'
        );
        await a.context().close();
        await b.context().close();
    }
};
