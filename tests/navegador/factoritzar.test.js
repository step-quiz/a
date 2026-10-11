/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/navegador/factoritzar.test.js
 * ROL: «Factoritzar» (a-factoritzar, PR 12c) al navegador, amb el motor nou:
 *      l'arbre de factors, la parella equivocada amb ✖, l'ajuda, la solució
 *      revelada, la partida completa, el teclat tàctil entre els dos camps,
 *      que no desbordi en mòbil i les sessions fixes. La lògica pura té els
 *      seus tests a tests/activitats.test.js.
 * ============================================================================
 */
'use strict';
const { suite, ok } = require('../harness');
const { obre, estat, esperaLliure, unics } = require('./helpers');

const RUTA = (nivell, extra = '') =>
    `a-factoritzar.html?nivell=${nivell}&fixed=A&totaloperations=2&maxintents=3${extra}`;

/** Escriu una parella als dos camps i l'envia. */
const respon = (page, a, b) =>
    page.evaluate(
        ([x, y]) => {
            document.getElementById('factor-a-input').value = String(x);
            document.getElementById('factor-b-input').value = String(y);
            window.checkFactors();
        },
        [a, b]
    );

/** Respon bé el pas actual. */
const responBe = async page => {
    const { resposta } = await estat(page);
    await respon(page, resposta[0], resposta[1]);
};

module.exports = async function ({ browser, base }) {
    suite("Factoritzar: l'arbre comença amb el nombre i cada nivell té el seu");
    for (const nivell of [1, 2, 3]) {
        const page = await obre(browser, base, RUTA(nivell), { rapid: false });
        await esperaLliure(page);
        const e = await estat(page);
        const v = await page.evaluate(() => ({
            nodes: [...document.querySelectorAll('.node-value')].map(n => n.textContent),
            actiu: document.querySelectorAll('.node-value.active').length,
            objectiu: document.getElementById('step-target').textContent,
            cap: document.getElementById('lvl-display').textContent,
        }));
        ok(
            v.nodes.join() === String(e.nombre) &&
                v.actiu === 1 &&
                v.objectiu === String(e.nombre) &&
                v.cap === 'Repte 1 de 2',
            `nivell ${nivell}: l'arbre és «${v.nodes.join()}», el node actiu pulsa i es demana «${v.objectiu} = ? · ?»`
        );
        ok(
            page.errors.length === 0 && page.externes.length === 0,
            `sense errors JS ni peticions externes (${unics(page.errors) || 'cap'})`
        );
        await page.context().close();
    }

    suite('Factoritzar: parella equivocada, ajuda, arbre que creix i solució revelada');
    {
        const page = await obre(browser, base, RUTA(2), { congela: 2000 });
        await esperaLliure(page);
        const e = await estat(page);
        await respon(page, 1, e.valor);
        const u = await page.evaluate(() => document.querySelector('#part-feedback .part')?.textContent.trim());
        ok(u === `1 ✖ · ${e.valor} = ${e.valor}`, `un factor 1 surt amb ✖ al costat («${u}»)`);
        await esperaLliure(page);
        await respon(page, e.resposta[0], e.resposta[0] + 1);
        const p = await page.evaluate(() => document.querySelector('#part-feedback .part')?.textContent.trim());
        const x = e.resposta[0];
        ok(
            p === `${x} · ${x + 1} = ${x * (x + 1)}${x * (x + 1) === e.valor ? '' : ' ✖'}`,
            `una parella equivocada surt amb el seu producte i ✖ («${p}»)`
        );
        await page.click('.btn-ajuda');
        const aj = await page.evaluate(() => ({
            visible: document.getElementById('help-text').classList.contains('visible'),
            marques: document.querySelectorAll('#help-text .ajuda-primer').length,
            divideixen: document.querySelectorAll('#help-text .divideix').length,
        }));
        ok(
            aj.visible && aj.marques === 4 && aj.divideixen >= 1,
            "l'ajuda mostra els 4 primers del nivell 2 i els que divideixen el nombre"
        );
        await esperaLliure(page);
        await responBe(page);
        await page.waitForFunction(() => document.querySelectorAll('.node-value').length >= 3, null, { timeout: 3000 });
        const arbre = await page.evaluate(() => ({
            nodes: document.querySelectorAll('.node-value').length,
            ajuda: document.getElementById('help-text').classList.contains('visible'),
        }));
        ok(arbre.nodes >= 3 && !arbre.ajuda, "partir el nombre afegeix dos nodes a l'arbre i tanca l'ajuda");
        await page.context().close();

        // Tres parelles equivocades: s'esgoten els intents i surt una parella correcta
        const q = await obre(browser, base, RUTA(2), { congela: 2000 });
        for (let i = 0; i < 3; i++) {
            await esperaLliure(q);
            await respon(q, 1, 1);
        }
        await q.waitForFunction(() => document.getElementById('factor-a-input').classList.contains('reveal'), null, {
            timeout: 3000,
        });
        const r = await q.evaluate(() => [
            document.getElementById('factor-a-input').value,
            document.getElementById('factor-b-input').value,
        ]);
        ok(
            r[0] * r[1] === (await estat(q)).valor,
            `amb els intents esgotats surt una parella correcta als camps, en verd (${r.join(' · ')})`
        );
        await q.context().close();
    }

    suite('Factoritzar: partida completa i teclat tàctil en mòbil');
    {
        const p = await obre(browser, base, RUTA(1, '&totaloperations=2'));
        let final = false;
        for (let i = 0; i < 400 && !final; i++) {
            const st = await p.evaluate(() => ({
                fi: getComputedStyle(document.getElementById('final-screen')).display !== 'none',
                sessio: getComputedStyle(document.getElementById('session-end-screen')).display !== 'none',
                ocupat: window.__estatProves().ocupat,
                resposta: window.__estatProves().resposta,
            }));
            final = st.fi;
            if (st.sessio) await p.evaluate(() => window.startNextSession());
            else if (!st.ocupat && !final && st.resposta) await respon(p, st.resposta[0], st.resposta[1]);
            await p.waitForTimeout(40);
        }
        ok(
            final && p.errors.length === 0,
            `responent bé s'arriba a la pantalla final (sense errors: ${unics(p.errors) || 'cap'})`
        );
        await p.context().close();

        const m = await obre(browser, base, RUTA(3), { mobil: true, w: 360, h: 700 });
        await esperaLliure(m);
        const { resposta, valor } = await estat(m);
        const tecla = c => m.locator(`#customKeyboard .kb-btn[data-key="${c}"]`).tap();
        for (const c of String(resposta[0])) await tecla(c);
        await m.locator('#customKeyboard .kb-enter').tap(); // amb només el primer ple, salta al segon camp
        for (const c of String(resposta[1])) await tecla(c);
        const v = await m.evaluate(() => [
            document.getElementById('factor-a-input').value,
            document.getElementById('factor-b-input').value,
        ]);
        await m.locator('#customKeyboard .kb-enter').tap();
        await m.waitForFunction(
            n => window.__estatProves().valor !== n || window.__estatProves().valor === null,
            valor,
            { timeout: 4000 }
        );
        const d = await m.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
        ok(
            v[0] === String(resposta[0]) && v[1] === String(resposta[1]) && d[0] <= d[1],
            `teclat tàctil: «${v.join(' · ')}» (→ salta al segon camp) i no desborda (${d[0]} ≤ ${d[1]})`
        );
        await m.context().close();
    }

    suite('Factoritzar: sessions fixes');
    {
        const a = await obre(browser, base, RUTA(2), { rapid: false });
        const b = await obre(browser, base, RUTA(2), { rapid: false });
        const [ea, eb] = [await estat(a), await estat(b)];
        ok(ea.nombre === eb.nombre, '?fixed=A dona sempre el mateix nombre');
        await a.context().close();
        await b.context().close();
    }
};
