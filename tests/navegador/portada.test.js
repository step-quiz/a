/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/navegador/portada.test.js
 * ROL: La portada de l'alumnat (index.html): una fitxa amb imatge i nom per
 *      activitat i per a l'àlbum, sense menús ni camps, que porta a cada pàgina;
 *      es maneja amb teclat; i el peu amb la llicència i l'enllaç al panell del
 *      professorat (el generador d'enllaços és a professorat.test.js).
 * ============================================================================
 */
'use strict';
const { suite, ok } = require('../harness');
const { obre, unics } = require('./helpers');

const NOMS = [
    'Vocabulari',
    'Àlbum de paraules',
    'Rellotge',
    'Temperatura',
    'Diners i canvi',
    'Nombres enters',
    'Ordenar enters',
    'Escriure nombres',
    "Prioritat d'operacions",
    'Potències',
    'MCD i MCM',
    'Factoritzar',
    'Fraccions',
    'Proporcionalitat',
    'Equacions',
    'Àrea i perímetre',
    'Triangle rectangle',
    'Coordenades',
];

module.exports = async function ({ browser, base }) {
    suite("Portada de l'alumnat: una fitxa amb imatge i nom per activitat, sense menús (escriptori 1280×800)");
    {
        const page = await obre(browser, base, 'index.html', { rapid: false });
        const r = await page.evaluate(() => ({
            titol: document.title,
            h1: document.querySelector('h1').textContent,
            fitxes: [...document.querySelectorAll('a.fitxa')].map(a => {
                const b = a.getBoundingClientRect();
                const imatge = a.querySelector('.fitxa-imatge');
                return {
                    href: a.getAttribute('href'),
                    nom: a.querySelector('.fitxa-nom').textContent,
                    imatge: imatge.innerHTML.length,
                    imatgeAmagada: imatge.getAttribute('aria-hidden') === 'true',
                    w: Math.round(b.width),
                    h: Math.round(b.height),
                    dins: b.left >= 0 && b.right <= innerWidth,
                };
            }),
            controls: document.querySelectorAll('select, input, textarea, button, [role=combobox]').length,
            flotants: document.querySelectorAll('.bottom-icon').length,
            peu: document.querySelector('.site-footer').innerText,
            peuAProfessorat: (document.querySelector('.site-footer a[href="professorat.html"]') || {}).textContent,
            html: document.documentElement.outerHTML,
            sw: document.documentElement.scrollWidth,
            iw: innerWidth,
            fitxesTop: Math.min(...[...document.querySelectorAll('a.fitxa')].map(a => a.getBoundingClientRect().top)),
            peuTop: document.querySelector('.site-footer').getBoundingClientRect().top,
            fitxesBaix: Math.max(
                ...[...document.querySelectorAll('a.fitxa')].map(a => a.getBoundingClientRect().bottom)
            ),
        }));
        ok(
            JSON.stringify(r.fitxes.map(f => f.nom)) === JSON.stringify(NOMS),
            `fitxes: ${r.fitxes.map(f => f.nom).join(' · ')}`
        );
        ok(
            r.fitxes.every(f => f.imatge > 0 && f.imatgeAmagada && f.w >= 130 && f.h >= 140 && f.dins),
            'cada fitxa porta una imatge (decorativa, aria-hidden) i és gran (130×140 px com a mínim) i dins de la finestra'
        );
        ok(
            new Set(r.fitxes.map(f => f.href)).size === NOMS.length &&
                r.fitxes.every(f => /^[a-z-]+\.html$/.test(f.href)),
            'cada fitxa és un enllaç diferent a una pàgina del web (sense paràmetres)'
        );
        ok(
            r.controls === 0,
            'sense menús ni camps ni botons: només imatges i enllaços (cap select, input, textarea ni button)'
        );
        ok(r.titol === 'Matemàtiques' && r.h1 === 'Matemàtiques', `títol: «${r.titol}» i «${r.h1}»`);
        ok(
            /CC BY-NC-SA 4\.0/.test(r.peu) &&
                /MIT/.test(r.peu) &&
                !/NC-ND/.test(r.html) &&
                r.peuAProfessorat === 'Professorat',
            `peu amb la llicència i l'enllaç al professorat: «${r.peu.replace(/\s+/g, ' ')}»`
        );
        ok(
            !/licensebuttons|wikimedia|by-sa\/4\.0/.test(r.html),
            'cap referència a licensebuttons.net, wikimedia ni a by-sa'
        );
        ok(page.externes.length === 0, `peticions a tercers: ${page.externes.join(', ') || 'cap'}`);
        ok(r.flotants === 0, 'cap botó flotant');
        ok(
            r.peuTop >= r.fitxesBaix,
            `el peu (${Math.round(r.peuTop)}) és sota de les fitxes (${Math.round(r.fitxesBaix)})`
        );
        ok(r.sw <= r.iw, `sense desplaçament horitzontal: ${r.sw} dins de ${r.iw}`);
        ok(
            page.errors.length === 0 && page.fallades.length === 0,
            `errors JS i de consola: ${page.errors.length ? unics(page.errors) : 'cap'}; peticions fallides: ${page.fallades.join(', ') || 'cap'}`
        );
        await page.context().close();
    }

    suite("Cada fitxa obre la seva pàgina i l'icona d'inici hi torna");
    {
        const page = await obre(browser, base, 'index.html', { rapid: false });
        const fitxers = await page.evaluate(() => [...document.querySelectorAll('a.fitxa')].map(a => a.href));
        const dolents = [];
        for (const url of fitxers) {
            const resposta = await page.request.get(url);
            if (resposta.status() !== 200) dolents.push(`${url}: HTTP ${resposta.status()}`);
        }
        ok(dolents.length === 0, `les ${fitxers.length} fitxes porten a una pàgina que existeix`, dolents.join('\n'));
        await page.click('a.fitxa:has-text("Rellotge")');
        await page.waitForURL(/a-rellotge\.html$/);
        ok(
            (await page.locator('.home-icon-link').count()) === 1 && page.errors.length === 0,
            `tocar «Rellotge» obre l'activitat (${page.url().split('/').pop()}), sense errors`
        );
        await page.click('.home-icon-link');
        await page.waitForURL(/index\.html$|\/$/);
        ok((await page.locator('a.fitxa').count()) === NOMS.length, "l'icona d'inici torna a la portada");
        await page.context().close();
    }

    suite("Teclat: Tab recorre les fitxes en ordre, amb focus visible, i Intro n'obre una");
    {
        const page = await obre(browser, base, 'index.html', { rapid: false });
        const recorregut = [];
        let senseContorn = 0;
        for (let i = 0; i < NOMS.length; i++) {
            await page.keyboard.press('Tab');
            const f = await page.evaluate(() => {
                const el = document.activeElement;
                const c = getComputedStyle(el);
                return {
                    nom: (el.querySelector('.fitxa-nom') || {}).textContent,
                    contorn: c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) >= 3,
                };
            });
            recorregut.push(f.nom);
            if (!f.contorn) senseContorn++;
        }
        ok(
            JSON.stringify(recorregut) === JSON.stringify(NOMS) && senseContorn === 0,
            `${NOMS.length} Tabs recorren les fitxes en ordre, cada una amb contorn visible (sense contorn: ${senseContorn})`
        );
        // Dues fitxes enrere de l'última («Coordenades»): «Àrea i perímetre»
        await page.keyboard.press('Shift+Tab');
        await page.keyboard.press('Shift+Tab');
        await page.keyboard.press('Enter');
        await page.waitForURL(/a-area-perimetre\.html$/);
        ok(
            /a-area-perimetre\.html$/.test(page.url()),
            'Intro en una fitxa en seleccionada obre la seva pàgina (a-area-perimetre.html)'
        );
        await page.context().close();
    }
};
