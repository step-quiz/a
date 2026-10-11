/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/navegador/recta.test.js
 * ROL: «Temperatura» (a-recta-numerica, PR 12) al navegador, amb el motor nou:
 *      el gràfic dibuixa els punts del núvol, les respostes bones i dolentes,
 *      la resposta revelada quan s'esgoten els intents, que no desbordi en
 *      mòbil i les sessions fixes. La lògica pura té els seus tests a
 *      tests/activitats.test.js.
 * ============================================================================
 */
'use strict';
const { suite, ok } = require('../harness');
const { obre, estat, esperaLliure, unics } = require('./helpers');

const RUTA = (nivell, extra = '') =>
    `a-recta-numerica.html?nivell=${nivell}&fixed=A&totaloperations=4&maxintents=3${extra}`;

/** Fa clic al botó d'una opció (la correcta o la primera incorrecta que encara és activa). */
const clica = (page, correcta) =>
    page.evaluate(bona => {
        const { pregunta } = window.__estatProves();
        const botons = [...document.querySelectorAll('#options-container .btn-option')];
        botons.find((b, k) => !b.disabled && pregunta.opcions[k].correcta === bona).click();
    }, correcta);

module.exports = async function ({ browser, base }) {
    suite('Temperatura: el gràfic dibuixa els punts i cada nivell té les seves preguntes');
    for (const nivell of [1, 2, 3]) {
        const page = await obre(browser, base, RUTA(nivell), { rapid: false });
        await esperaLliure(page);
        const e = await estat(page);
        const v = await page.evaluate(() => ({
            punts: document.querySelectorAll('#graph-container circle').length,
            botons: document.querySelectorAll('#options-container .btn-option').length,
            cap: document.getElementById('lvl-display').textContent,
        }));
        const permesos = { 1: ['Q1', 'Q2'], 2: ['Q1', 'Q2', 'Q3'], 3: ['Q1', 'Q2', 'Q3', 'Q4'] }[nivell];
        ok(
            v.punts >= e.cloud.length && v.botons === 4 && v.cap === 'Repte 1 de 4',
            `nivell ${nivell}: ${v.punts} cercles per ${e.cloud.length} punts, ${v.botons} botons i «${v.cap}»`
        );
        ok(permesos.includes(e.pregunta.tipus), `nivell ${nivell}: la pregunta és ${e.pregunta.tipus}`);
        ok(
            page.errors.length === 0 && page.externes.length === 0,
            `sense errors JS ni peticions externes (${unics(page.errors) || 'cap'})`
        );
        await page.context().close();
    }

    suite('Temperatura: resposta bona, dolenta, solució revelada i final');
    {
        const page = await obre(browser, base, RUTA(2), { congela: 2000 });
        await esperaLliure(page);
        await clica(page, false);
        const mal = await page.evaluate(() => ({
            marcats: document.querySelectorAll('#options-container .btn-option.wrong:disabled').length,
            actius: document.querySelectorAll('#options-container .btn-option:not(:disabled)').length,
        }));
        ok(
            mal.marcats === 1 && mal.actius === 3,
            'una resposta dolenta queda marcada i desactivada, les altres segueixen actives'
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

        const p2 = await obre(browser, base, RUTA(1, '&totaloperations=3'));
        let final = false;
        for (let i = 0; i < 200 && !final; i++) {
            final = await p2.evaluate(
                () => getComputedStyle(document.getElementById('final-screen')).display !== 'none'
            );
            if (final) break;
            const st = await p2.evaluate(() => ({
                sessio: getComputedStyle(document.getElementById('session-end-screen')).display !== 'none',
                ocupat: window.__estatProves().ocupat,
            }));
            if (st.sessio) await p2.evaluate(() => window.startNextSession());
            else if (!st.ocupat) await clica(p2, true);
            await p2.waitForTimeout(40);
        }
        ok(
            final && p2.errors.length === 0,
            `responent bé s'arriba a la pantalla final (sense errors: ${unics(p2.errors) || 'cap'})`
        );
        await p2.context().close();
    }

    suite('Temperatura: en mòbil no desborda');
    {
        const m = await obre(browser, base, RUTA(3), { mobil: true, w: 360, h: 700 });
        await esperaLliure(m);
        const d = await m.evaluate(() => ({
            sw: document.documentElement.scrollWidth,
            iw: innerWidth,
            grafic: document.getElementById('graph-container').getBoundingClientRect().width,
        }));
        ok(
            d.sw <= d.iw && d.grafic <= d.iw,
            `cap desbordament horitzontal (${d.sw} ≤ ${d.iw}; gràfic ${Math.round(d.grafic)} px)`
        );
        await m.context().close();
    }

    suite('Temperatura: sessions fixes');
    {
        const a = await obre(browser, base, RUTA(2), { rapid: false });
        const b = await obre(browser, base, RUTA(2), { rapid: false });
        const [ea, eb] = [await estat(a), await estat(b)];
        ok(JSON.stringify(ea.cloud) === JSON.stringify(eb.cloud), '?fixed=A dona sempre el mateix gràfic');
        await a.context().close();
        await b.context().close();
    }
};
