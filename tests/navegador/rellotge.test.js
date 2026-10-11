/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/navegador/rellotge.test.js
 * ROL: «Rellotge» (a-rellotge, PR 11) al navegador, amb el motor nou: les
 *      agulles marquen l'hora que té el joc, els nivells (ratlletes, botons i
 *      números), l'ajuda, l'hora revelada quan s'esgoten els intents, el teclat
 *      tàctil entre els dos camps, que no desbordi en mòbil i les sessions fixes.
 *      La lògica pura té els seus tests a tests/activitats.test.js.
 * ============================================================================
 */
'use strict';
const { suite, ok } = require('../harness');
const { obre, estat, esperaLliure, responLliure, unics } = require('./helpers');

const RUTA = (nivell, extra = '') => `a-rellotge.html?nivell=${nivell}&fixed=A&totaloperations=6&maxintents=3${extra}`;

/** Els graus de les dues agulles tal com es veuen (esperant que acabi l'animació de 0,6 s). */
async function agulles(page) {
    await page.waitForTimeout(800);
    return page.evaluate(() => {
        const graus = id => {
            const m = new DOMMatrix(getComputedStyle(document.getElementById(id)).transform);
            return ((Math.round((Math.atan2(m.b, m.a) * 180) / Math.PI) % 360) + 360) % 360;
        };
        return { hora: graus('hour-hand'), minut: graus('min-hand') };
    });
}

module.exports = async function ({ browser, base }) {
    suite("Rellotge: les agulles marquen l'hora del joc i cada nivell té la seva cara");
    for (const nivell of [1, 2, 3]) {
        const page = await obre(browser, base, RUTA(nivell), { rapid: false });
        await esperaLliure(page);
        const e = await estat(page);
        const g = await agulles(page);
        const cara = await page.evaluate(() => ({
            ratlles: document.querySelectorAll('#clock-ticks line').length,
            numeros: document.querySelectorAll('#clock-numbers text').length,
            actiu: document.querySelector('.btn-nivell.active').textContent.trim(),
            cap: document.getElementById('lvl-display').textContent,
        }));
        ok(
            g.minut === (e.minuts * 6) % 360 && Math.abs(g.hora - (((e.hores % 12) * 30 + e.minuts * 0.5) % 360)) <= 1,
            `nivell ${nivell}: a les ${e.hores}:${String(e.minuts).padStart(2, '0')} les agulles són a ${g.hora}° i ${g.minut}°`
        );
        ok(
            cara.ratlles === (nivell === 3 ? 60 : 12) &&
                cara.numeros === 0 &&
                cara.actiu === `Nivell ${nivell}` &&
                cara.cap === 'Repte 1 de 6',
            `nivell ${nivell}: ${cara.ratlles} ratlletes (les dels minuts només al 3), sense números, botó «${cara.actiu}» i «${cara.cap}»`
        );
        ok(page.errors.length === 0, `sense errors JS (${unics(page.errors) || 'cap'})`);
        await page.context().close();
    }

    suite('Rellotge: números, botons de nivell, ajuda, hora revelada i teclat tàctil');
    {
        const page = await obre(browser, base, RUTA(2), { congela: 2000 });
        await esperaLliure(page);
        await page.click('#btn-toggle-nombres');
        const n = await page.evaluate(() => ({
            numeros: document.querySelectorAll('#clock-numbers text').length,
            premut: document.getElementById('btn-toggle-nombres').getAttribute('aria-pressed'),
        }));
        ok(n.numeros === 12 && n.premut === 'true', 'la rodeta «123» afegeix els 12 números al rellotge');
        await page.click('.btn-ajuda');
        const aj = await page.evaluate(() =>
            document.getElementById('help-text').innerText.replace(/\s+/g, ' ').trim()
        );
        ok(aj.startsWith('1 → 5') && aj.endsWith('11 → 55'), `ajuda del nivell 2: «${aj}»`);
        // Tres respostes equivocades: l'hora correcta surt als camps, en verd
        for (let i = 0; i < 3; i++) {
            await responLliure(page, 'rellotge', false);
            await esperaLliure(page).catch(() => {});
        }
        await page.waitForFunction(() => document.getElementById('input-hores').classList.contains('reveal'), null, {
            timeout: 3000,
        });
        const r = await page.evaluate(() => ({
            h: document.getElementById('input-hores').value,
            m: document.getElementById('input-minuts').value,
            fons: getComputedStyle(document.getElementById('input-hores')).borderTopColor,
        }));
        const e = await estat(page);
        ok(
            r.h === String(e.hores) && r.m === String(e.minuts).padStart(2, '0'),
            `amb els intents esgotats l'hora correcta surt als camps (${r.h}:${r.m})`
        );
        await page.context().close();

        // Els botons de nivell recarreguen amb el nivell i conserven la resta de paràmetres
        const p2 = await obre(browser, base, RUTA(1));
        await Promise.all([p2.waitForNavigation({ timeout: 4000 }), p2.click('.btn-nivell:nth-child(3)')]);
        const u = new URL(p2.url());
        ok(
            u.searchParams.get('nivell') === '3' &&
                u.searchParams.get('fixed') === 'A' &&
                u.searchParams.get('maxintents') === '3',
            `el botó «Nivell 3» recarrega amb nivell=3 i la resta de paràmetres (${u.search})`
        );
        await p2.context().close();

        // Mòbil: el teclat de la pantalla escriu a l'hora i, tocant l'altre camp, als minuts
        const m = await obre(browser, base, RUTA(2, '&totaloperations=6'), { mobil: true, w: 360, h: 760 });
        await esperaLliure(m);
        const { hores, minuts } = await estat(m);
        const tecla = c => m.locator(`#customKeyboard .kb-btn[data-key="${c}"]`).tap();
        for (const c of String(hores)) await tecla(c);
        await m.locator('#input-minuts').tap();
        for (const c of String(minuts).padStart(2, '0')) await tecla(c);
        const v = await m.evaluate(() => [
            document.getElementById('input-hores').value,
            document.getElementById('input-minuts').value,
        ]);
        ok(
            v[0] === String(hores) && v[1] === String(minuts).padStart(2, '0'),
            `teclat tàctil: hores «${v[0]}» i minuts «${v[1]}»`
        );
        await m.locator('#customKeyboard .kb-enter').tap();
        await m.waitForFunction(() => window.__estatProves().sessionScore > 0, null, { timeout: 4000 });
        ok(m.errors.length === 0, 'una hora bona escrita amb el teclat es dona per correcta, sense errors JS');
        await m.context().close();
        for (const w of [320, 360, 390]) {
            const p = await obre(browser, base, RUTA(3), { mobil: true, w, h: 700 });
            await esperaLliure(p);
            await p.locator('.btn-ajuda').tap();
            const sw = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
            ok(sw[0] <= sw[1], `${w} px: res no desborda amb l'ajuda oberta (${sw[0]} ≤ ${sw[1]})`);
            await p.context().close();
        }
    }

    suite('Sessions fixes del Rellotge: les mateixes hores per a tothom');
    {
        const juga = async (cerca, errors) => {
            const p = await obre(browser, base, `a-rellotge.html?${cerca}&totaloperations=6&maxintents=4`);
            const v = [];
            for (let q = 0; q < 6; q++) {
                await esperaLliure(p);
                const e = await estat(p);
                v.push(`${e.hores}:${e.minuts}`);
                if (errors.includes(q)) await responLliure(p, 'rellotge', false);
                await responLliure(p, 'rellotge', true);
            }
            await p.context().close();
            return v.join(' ');
        };
        const a1 = await juga('nivell=3&fixed=A', []);
        const a2 = await juga('nivell=3&fixed=A', [1, 4]);
        const b = await juga('nivell=3&fixed=B', []);
        ok(a1 === a2 && a1 !== b, `sessió A igual per a tothom (${a1}) i la B és una altra`);
    }
};
