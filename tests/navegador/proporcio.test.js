/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/navegador/proporcio.test.js
 * ROL: «Proporcionalitat» (a-proporciodirecta, PR 9) al navegador, amb el motor
 *      nou: la pantalla mostra el problema que té el joc, els dos passos dels
 *      nivells 2 i 3, l'ajuda amb símbols, la resposta equivocada i els intents
 *      esgotats, que no desbordi en mòbil (320–390 px) i les sessions fixes.
 *      La lògica pura té els seus tests a tests/activitats.test.js.
 * ============================================================================
 */
'use strict';
const { suite, ok } = require('../harness');
const { obre, estat, esperaLliure, responLliure, unics } = require('./helpers');

const RUTA = (nivell, extra = '') =>
    `a-proporciodirecta.html?nivell=${nivell}&fixed=A&totaloperations=6&maxintents=3${extra}`;

/** Les files del problema tal com es veuen: «quantitat producte → preu». */
const files = page =>
    page.evaluate(() =>
        [...document.querySelectorAll('#problem-display .problem-row')].map(r => ({
            qty: Number(r.querySelector('.problem-qty').textContent.trim().split(/\s/)[0]),
            producte: r.querySelector('.paraula').dataset.paraula,
            preu: r.querySelector('.problem-price, .problem-unknown').textContent.trim(),
            tocable: r.querySelector('.paraula').getAttribute('role') === 'button',
        }))
    );

module.exports = async function ({ browser, base }) {
    suite('Proporcionalitat: la pantalla mostra el problema del joc (3 nivells) i es resol amb dos passos');
    for (const nivell of [1, 2, 3]) {
        const page = await obre(browser, base, RUTA(nivell));
        const vistes = [];
        for (let q = 0; q < 6; q++) {
            await esperaLliure(page);
            const e = await estat(page);
            const pr = e.problema;
            const f0 = await files(page);
            let f1 = null;
            for (let pas = 0; pas < pr.passos.length; pas++) {
                await responLliure(page, 'int', true);
                if (pas === 0 && pr.passos.length === 2) f1 = await files(page);
            }
            vistes.push({ pr, f0, f1 });
        }
        ok(
            vistes.every(
                ({ pr, f0, f1 }) =>
                    f0[0].qty === pr.qtyDada &&
                    f0[0].preu === `${pr.preuDada} €` &&
                    f0[0].producte === pr.producte &&
                    f0.at(-1).qty === pr.passos[0].qty &&
                    f0.at(-1).preu === '? €' &&
                    f0.every(f => f.tocable) &&
                    (pr.passos.length === 1 ||
                        (f1.length === 3 &&
                            f1[1].preu === `${pr.passos[0].resposta} €` &&
                            f1[2].qty === pr.qtyDemanada))
            ),
            `nivell ${nivell}: les files són la dada i el que es demana${nivell > 1 ? ", amb el preu d'un entremig al segon pas" : ''}; el producte és tocable`
        );
        const e = await estat(page);
        ok(
            page.errors.length === 0 && e.sessionHistory.length === vistes.reduce((n, v) => n + v.pr.passos.length, 0),
            `${e.sessionHistory.length} respostes a la revisió i sense errors JS (${unics(page.errors) || 'cap'})`
        );
        await page.context().close();
    }

    suite('Ajuda, resposta equivocada i intents esgotats');
    {
        const page = await obre(browser, base, RUTA(3), { congela: 2000 });
        await esperaLliure(page);
        const e = await estat(page);
        const pas = e.problema.passos[0];
        await page.click('.btn-ajuda');
        const aj = await page.evaluate(() =>
            document.getElementById('help-text').innerText.replace(/\s+/g, ' ').trim()
        );
        ok(
            aj.startsWith(`${pas.a} € ${pas.op} ${pas.b} = ?`) && !aj.includes(`= ${pas.resposta}`),
            `l'ajuda és l'operació sense la resposta: «${aj}»`
        );
        await responLliure(page, 'int', false);
        await esperaLliure(page);
        await responLliure(page, 'int', false);
        await esperaLliure(page);
        await responLliure(page, 'int', false);
        await page.waitForFunction(() => document.getElementById('value-input').classList.contains('reveal'), null, {
            timeout: 3000,
        });
        const r = await page.evaluate(() => ({
            valor: document.getElementById('value-input').value,
            intents: document.getElementById('attempts-display').textContent,
        }));
        ok(
            r.valor === String(pas.resposta) && r.intents === 'Intents: 0',
            `amb els intents esgotats la resposta (${r.valor}) surt dins del camp, en verd`
        );
        await page.context().close();
    }

    suite('Proporcionalitat en mòbil: cap fila tallada ni desbordament (320, 360 i 390 px)');
    for (const w of [320, 360, 390]) {
        const page = await obre(
            browser,
            base,
            'a-proporciodirecta.html?nivell=3&fixed=A&totaloperations=12&maxintents=3',
            { mobil: true, w, h: 700 }
        );
        let tallat = 0;
        for (let q = 0; q < 12; q++) {
            await esperaLliure(page);
            const n = await page.evaluate(() => {
                const panell = document.querySelector('.panel').getBoundingClientRect();
                return [...document.querySelectorAll('#problem-display .problem-row *')].filter(c => {
                    const b = c.getBoundingClientRect();
                    return b.width > 0 && (b.right > panell.right + 1 || b.left < panell.left - 1);
                }).length;
            });
            tallat += n;
            const pr = (await estat(page)).problema;
            for (let p = 0; p < pr.passos.length; p++) await responLliure(page, 'int', true);
        }
        const sw = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
        ok(
            tallat === 0 && sw[0] <= sw[1] && page.errors.length === 0,
            `${w} px: 12 problemes, ${tallat} peces tallades, pàgina ${sw[0]} ≤ ${sw[1]}`
        );
        await page.context().close();
    }

    suite('Sessions fixes de Proporcionalitat: tota la classe fa els mateixos problemes');
    {
        const juga = async (cerca, errors) => {
            const page = await obre(browser, base, `a-proporciodirecta.html?${cerca}&totaloperations=5`);
            const vistos = [];
            for (let q = 0; q < 5; q++) {
                await esperaLliure(page);
                const pr = (await estat(page)).problema;
                vistos.push(`${pr.producte}:${pr.qtyDada}/${pr.preuDada}/${pr.qtyDemanada}`);
                if (errors.includes(q)) await responLliure(page, 'int', false);
                for (let p = 0; p < pr.passos.length; p++) await responLliure(page, 'int', true);
            }
            await page.context().close();
            return vistos.join(' | ');
        };
        const a1 = await juga('nivell=2&fixed=A', []);
        const a2 = await juga('nivell=2&fixed=A', [0, 3]);
        const b = await juga('nivell=2&fixed=B', []);
        ok(a1 === a2 && a1 !== b, `A igual per a tothom (${a1}) i B és una altra`);
    }
};
