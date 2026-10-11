/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/navegador/album.test.js
 * ROL: «Àlbum de paraules» (album.html, PR 13b) al navegador: les cartes per
 *      temes, les paraules vistes i les bloquejades («?»), que tocar una carta
 *      en desbloqueja la paraula i la recorda, el teclat, el botó de practicar
 *      (només amb paraules vistes), l'enllaç des de Vocabulari i el mòbil. La
 *      lògica pura té els seus tests a tests/activitats.test.js.
 * ============================================================================
 */
'use strict';
const { suite, ok } = require('../harness');
const { obre, unics } = require('./helpers');

const VISTES = ['poma', 'cotxe', 'gos'];
const amb = vistes =>
    `if (!localStorage.getItem('a2-paraules-vistes')) localStorage.setItem('a2-paraules-vistes', '${JSON.stringify(vistes)}')`;

module.exports = async function ({ browser, base }) {
    suite('Àlbum: cartes per temes, paraules vistes i bloquejades');
    {
        const page = await obre(browser, base, 'album.html', { rapid: false, init: amb(VISTES) });
        const v = await page.evaluate(() => ({
            cartes: document.querySelectorAll('.album-carta').length,
            bloquejades: document.querySelectorAll('.album-carta.album-bloquejada').length,
            grups: document.querySelectorAll('.album-grup').length,
            progres: document.querySelector('.album-num')?.textContent,
            barra: document.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow'),
            poma: document.querySelector('.album-carta[data-paraula="poma"] .paraula-text')?.textContent,
            gat: document.querySelector('.album-carta[data-paraula="gat"] .paraula-text')?.textContent,
            jugar: !document.getElementById('album-jugar').hidden,
            href: document.getElementById('album-jugar').getAttribute('href'),
            titol: document.querySelector('h1').textContent,
        }));
        ok(
            v.cartes >= 60 &&
                v.bloquejades === v.cartes - 3 &&
                v.grups >= 8 &&
                v.progres === `3 / ${v.cartes}` &&
                v.barra === '3' &&
                v.poma === 'la poma' &&
                v.gat === '?',
            `${v.cartes} cartes en ${v.grups} temes: ${v.progres} vistes («${v.poma}» i, la que no s'ha vist, «${v.gat}»)`
        );
        ok(
            v.jugar && v.href === 'a-vocabulari.html?vistes=1',
            'amb paraules vistes, surt el botó «▶ Jugar» que practica les vistes'
        );
        const tema = await page.evaluate(() =>
            document.querySelector('.album-grup .album-tema-jugar').getAttribute('href')
        );
        ok(/^a-vocabulari\.html\?tema=\w+$/.test(tema), `cada tema té el seu ▶ per practicar-lo (${tema})`);
        ok(
            page.errors.length === 0 && page.externes.length === 0,
            `sense errors JS ni peticions externes (${unics(page.errors) || 'cap'})`
        );
        await page.context().close();

        const buit = await obre(browser, base, 'album.html', { rapid: false });
        ok(
            await buit.evaluate(() => document.getElementById('album-jugar').hidden),
            'sense cap paraula vista, el botó de practicar no surt'
        );
        await buit.context().close();
    }

    suite('Àlbum: tocar una carta en desbloqueja la paraula, i es recorda');
    {
        const page = await obre(browser, base, 'album.html', { rapid: false, init: amb(VISTES) });
        await page.click('.album-carta[data-paraula="gat"]');
        const targeta = await page.evaluate(() => ({
            oberta: document.querySelector('dialog.targeta-paraula')?.open,
            nom: document.querySelector('.targeta-nom')?.textContent,
        }));
        ok(targeta.oberta && targeta.nom === 'el gat', `tocar una carta bloquejada obre la targeta («${targeta.nom}»)`);
        await page.click('.targeta-ok');
        await page.waitForFunction(
            () => document.querySelector('.album-carta[data-paraula="gat"] .paraula-text').textContent === 'el gat'
        );
        const d = await page.evaluate(() => ({
            text: document.querySelector('.album-carta[data-paraula="gat"] .paraula-text').textContent,
            bloquejada: document
                .querySelector('.album-carta[data-paraula="gat"]')
                .classList.contains('album-bloquejada'),
            progres: document.querySelector('.album-num').textContent,
            desat: JSON.parse(localStorage.getItem('a2-paraules-vistes')),
        }));
        ok(
            d.text === 'el gat' && !d.bloquejada && /^4 \//.test(d.progres) && d.desat.includes('gat'),
            `en tancar la targeta, la carta es desbloqueja («${d.text}»), el progrés passa a ${d.progres} i la paraula es recorda`
        );
        await page.reload({ waitUntil: 'load' });
        ok(
            (await page.evaluate(
                () => document.querySelector('.album-carta[data-paraula="gat"] .paraula-text').textContent
            )) === 'el gat',
            "en tornar a obrir l'àlbum, la paraula continua desbloquejada"
        );
        await page.focus('.album-carta[data-paraula="vaca"]');
        await page.keyboard.press('Enter');
        ok(
            await page.evaluate(() => document.querySelector('dialog.targeta-paraula').open),
            "amb el teclat (Intro) també s'obre la targeta"
        );
        await page.keyboard.press('Escape');
        await page.waitForFunction(
            () => document.querySelector('.album-carta[data-paraula="vaca"] .paraula-text').textContent === 'la vaca',
            null,
            { timeout: 3000 }
        );
        ok(true, 'tancar-la amb Esc també desbloqueja la carta');
        await page.context().close();
    }

    suite('Àlbum: el vocabulari matemàtic, amb els seus dibuixos i la targeta');
    {
        const page = await obre(browser, base, 'album.html', { rapid: false, init: amb(['poma']) });
        const v = await page.evaluate(() => ({
            temes: document.querySelectorAll('.album-grup[data-tema^="mat-"]').length,
            dibuixos: document.querySelectorAll('.album-carta .mat-svg').length,
            exemples: document.querySelectorAll('.album-carta .mat').length,
            cartes: document.querySelectorAll('.album-carta').length,
            noms: [...document.querySelectorAll('.album-carta.album-bloquejada .paraula-text')].every(
                t => t.textContent === '?'
            ),
        }));
        ok(
            v.temes === 11 && v.dibuixos >= 40 && v.exemples >= 130 && v.cartes >= 200 && v.noms,
            `${v.temes} temes de matemàtiques, ${v.exemples} imatges de mini-exemple (${v.dibuixos} dibuixos) en ${v.cartes} cartes, i cap paraula a les bloquejades`
        );
        await page.click('.album-carta[data-paraula="angle-agut"]');
        const t = await page.evaluate(() => ({
            oberta: document.querySelector('dialog.targeta-paraula')?.open,
            nom: document.querySelector('.targeta-nom')?.textContent,
            dibuix: !!document.querySelector('.targeta-img .mat-svg'),
        }));
        ok(
            t.oberta && t.nom === "l'angle agut" && t.dibuix,
            `la targeta d'un terme de matemàtiques mostra el dibuix i la paraula («${t.nom}»)`
        );
        await page.context().close();
    }

    suite('Àlbum: enllaç des de Vocabulari i mòbil');
    {
        const v = await obre(browser, base, 'a-vocabulari.html?nivell=1&fixed=A', { rapid: false });
        ok(
            (await v.evaluate(() => document.querySelector('.album-link')?.getAttribute('href'))) === 'album.html',
            "Vocabulari porta a l'àlbum amb el 📒"
        );
        await v.context().close();
        const m = await obre(browser, base, 'album.html', { mobil: true, w: 360, h: 700, init: amb(VISTES) });
        const d = await m.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
        ok(d[0] <= d[1], `al mòbil (360 px) no desborda (${d[0]} ≤ ${d[1]})`);
        await m.context().close();
    }
};
