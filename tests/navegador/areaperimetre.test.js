/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/navegador/areaperimetre.test.js
 * ROL: «Àrea i perímetre» (a-area-perimetre, PR 12e) al navegador, amb el
 *      motor nou: la figura i les etiquetes, les marques ✔/✖ i el bloqueig de
 *      la casella encertada, les respostes canviades (⇄), l'ajuda amb els
 *      números, la solució revelada, la partida completa, el teclat tàctil
 *      entre les dues caselles, que no desbordi en mòbil i les sessions
 *      fixes. La lògica pura té els seus tests a tests/activitats.test.js.
 * ============================================================================
 */
'use strict';
const { suite, ok } = require('../harness');
const { obre, estat, esperaLliure, unics } = require('./helpers');

const RUTA = (nivell, extra = '') =>
    `a-area-perimetre.html?nivell=${nivell}&fixed=A&totaloperations=2&maxintents=3${extra}`;

/** Escriu l'àrea i el perímetre (null = no tocar la casella) i comprova. */
const respon = (page, area, perim) =>
    page.evaluate(
        ([a, p]) => {
            const ai = document.getElementById('area-input');
            const pi = document.getElementById('perim-input');
            if (a !== null) ai.value = String(a);
            if (p !== null) pi.value = String(p);
            window.checkAnswers();
        },
        [area, perim]
    );

module.exports = async function ({ browser, base }) {
    suite('Àrea i perímetre: la figura, les etiquetes i cada nivell');
    for (const nivell of [1, 2, 3]) {
        const page = await obre(browser, base, RUTA(nivell), { rapid: false });
        await esperaLliure(page);
        const e = await estat(page);
        const v = await page.evaluate(() => ({
            quadrats: document.querySelectorAll('#figura-container rect[fill="#0d9488"]').length,
            cota: document.getElementById('figura-container').textContent.includes('1 cm'),
            etiquetes: [...document.querySelectorAll('.etiqueta')].map(x => x.textContent.replace(/\s+/g, ' ').trim()),
            cap: document.getElementById('lvl-display').textContent,
        }));
        const permesos = { 1: [3, 4], 2: [3, 4, 5], 3: [4, 5] }[nivell];
        ok(
            v.quadrats === e.area && permesos.includes(e.area) && v.cota && v.cap === 'Figura 1 de 2',
            `nivell ${nivell}: figura de ${e.area} quadrats (perímetre ${e.perimetre}), cota «1 cm» i «${v.cap}»`
        );
        ok(
            v.etiquetes.join('|') === 'àrea (cm²)|perímetre (cm)',
            `les etiquetes porten la paraula i la unitat («${v.etiquetes.join('|')}»)`
        );
        ok(
            page.errors.length === 0 && page.externes.length === 0,
            `sense errors JS ni peticions externes (${unics(page.errors) || 'cap'})`
        );
        await page.context().close();
    }

    suite('Àrea i perímetre: marques, casella encertada bloquejada, canviades, ajuda i solució revelada');
    {
        const page = await obre(browser, base, RUTA(2), { congela: 2000 });
        await esperaLliure(page);
        const e = await estat(page);
        // L'àrea bona i el perímetre equivocat: ✔ i ✖, i l'àrea es queda bloquejada
        await respon(page, e.area, e.perimetre + 1);
        const m = await page.evaluate(() => ({
            area: document.getElementById('area-marca').textContent.trim(),
            perim: document.getElementById('perim-marca').textContent.trim(),
            bloquejada: document.getElementById('area-input').dataset.locked === 'true',
        }));
        ok(
            m.area === '✔' && m.perim === '✖' && m.bloquejada,
            "l'àrea bona surt amb ✔ i es bloqueja; el perímetre equivocat, amb ✖"
        );
        await esperaLliure(page);
        await page.click('.btn-ajuda');
        const a1 = await page.evaluate(() => document.querySelectorAll('#figura-container circle').length);
        await page.click('.btn-ajuda');
        const a2 = await page.evaluate(() => document.querySelectorAll('#figura-container circle').length);
        await page.click('.btn-ajuda');
        const a3 = await page.evaluate(() => document.querySelectorAll('#figura-container circle').length);
        ok(
            a1 === e.area && a2 === e.perimetre && a3 === 0,
            `el 💡 numera els quadrats (${a1}), després els costats de la vora (${a2}) i després res (${a3})`
        );
        await respon(page, null, e.perimetre);
        await page.waitForFunction(() => window.__estatProves().sessionScore > 0, null, { timeout: 4000 });
        ok(true, 'encertar el perímetre dona la figura per bona');
        await page.context().close();

        // Les dues respostes canviades: ⇄
        const c = await obre(browser, base, RUTA(2), { congela: 2000 });
        await esperaLliure(c);
        const ec = await estat(c);
        await respon(c, ec.perimetre, ec.area);
        const canvi = await c.evaluate(() => document.getElementById('canviats').textContent.trim());
        ok(canvi === '⇄', `si l'àrea i el perímetre estan canviats surt ⇄ («${canvi}»)`);
        await c.context().close();

        // Tres intents equivocats: surten les respostes correctes, en verd
        const q = await obre(browser, base, RUTA(2), { congela: 2000 });
        await esperaLliure(q);
        const eq = await estat(q);
        const mal = eq.area + eq.perimetre + 5;
        for (let i = 0; i < 3; i++) {
            await esperaLliure(q);
            await respon(q, mal, mal);
        }
        await q.waitForFunction(() => document.getElementById('area-input').classList.contains('reveal'), null, {
            timeout: 3000,
        });
        const r = await q.evaluate(() => [
            document.getElementById('area-input').value,
            document.getElementById('perim-input').value,
        ]);
        ok(
            r[0] === String(eq.area) && r[1] === String(eq.perimetre),
            `amb els intents esgotats surten les respostes correctes, en verd (${r.join(' · ')})`
        );
        await q.context().close();
    }

    suite('Àrea i perímetre: partida completa i teclat tàctil en mòbil');
    {
        const p = await obre(browser, base, RUTA(1));
        let final = false;
        for (let i = 0; i < 400 && !final; i++) {
            const st = await p.evaluate(() => ({
                fi: getComputedStyle(document.getElementById('final-screen')).display !== 'none',
                sessio: getComputedStyle(document.getElementById('session-end-screen')).display !== 'none',
                ocupat: window.__estatProves().ocupat || window.__estatProves().isTransitioning,
                area: window.__estatProves().area,
                perimetre: window.__estatProves().perimetre,
            }));
            final = st.fi;
            if (st.sessio) await p.evaluate(() => window.startNextSession());
            else if (!st.ocupat && !final && st.area) await respon(p, st.area, st.perimetre);
            await p.waitForTimeout(40);
        }
        ok(
            final && p.errors.length === 0,
            `responent bé s'arriba a la pantalla final (sense errors: ${unics(p.errors) || 'cap'})`
        );
        await p.context().close();

        const m = await obre(browser, base, RUTA(3), { mobil: true, w: 360, h: 700 });
        await esperaLliure(m);
        const { area, perimetre } = await estat(m);
        const tecla = c => m.locator(`#customKeyboard .kb-btn[data-key="${c}"]`).tap();
        for (const c of String(area)) await tecla(c);
        await m.locator('#customKeyboard .kb-enter').tap(); // amb la primera plena, salta a la segona casella
        for (const c of String(perimetre)) await tecla(c);
        const v = await m.evaluate(() => [
            document.getElementById('area-input').value,
            document.getElementById('perim-input').value,
        ]);
        await m.locator('#customKeyboard .kb-enter').tap();
        await m.waitForFunction(() => window.__estatProves().sessionScore > 0, null, { timeout: 4000 });
        const d = await m.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
        ok(
            v[0] === String(area) && v[1] === String(perimetre) && d[0] <= d[1],
            `teclat tàctil: «${v.join(' · ')}» (→ salta a la segona casella) i no desborda (${d[0]} ≤ ${d[1]})`
        );
        await m.context().close();
    }

    suite('Àrea i perímetre: sessions fixes');
    {
        const a = await obre(browser, base, RUTA(2), { rapid: false });
        const b = await obre(browser, base, RUTA(2), { rapid: false });
        const [ea, eb] = [await estat(a), await estat(b)];
        ok(
            JSON.stringify(ea.figura.cells) === JSON.stringify(eb.figura.cells),
            '?fixed=A dona sempre la mateixa figura'
        );
        await a.context().close();
        await b.context().close();
    }
};
