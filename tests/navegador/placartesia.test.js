/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/navegador/placartesia.test.js
 * ROL: «Coordenades» (a-pla-cartesia, PR 12g) al navegador, amb el motor nou:
 *      els quatre tipus de pregunta (tocar el punt, escriure'n les
 *      coordenades, triar el quadrant, escriure un punt d'un quadrant), les
 *      marques ✔/✖, la solució revelada, la partida completa, el teclat
 *      tàctil, que no desbordi en mòbil i les sessions fixes. La lògica pura
 *      té els seus tests a tests/activitats.test.js.
 * ============================================================================
 */
'use strict';
const { suite, ok } = require('../harness');
const { obre, estat, esperaLliure, unics } = require('./helpers');

const RUTA = (nivell, extra = '') =>
    `a-pla-cartesia.html?nivell=${nivell}&fixed=A&totaloperations=24&maxintents=3${extra}`;

/** Un punt de cada lloc per escriure'l a «al-quadrant» (el mateix criteri que exemplePunt). */
const EXEMPLES = { Q1: [2, 2], Q2: [-2, 2], Q3: [-2, -2], Q4: [2, -2], eixX: [3, 0], eixY: [0, 3], origen: [0, 0] };

/** Respon la pregunta actual, bé o malament (un toc, una icona o unes caselles). */
async function respon(page, bo) {
    const e = await estat(page);
    const q = e.pregunta;
    if (q.tipus === 'situa') {
        const p = bo ? q.punt : { x: q.punt.x === 5 ? -5 : q.punt.x + 1, y: q.punt.y };
        const { clientX, clientY } = await page.evaluate(([x, y]) => window.__estatProves().aPixels(x, y), [p.x, p.y]);
        await page.mouse.click(clientX, clientY);
    } else if (q.tipus === 'quadrant') {
        await page.evaluate(
            ([lloc, bo]) => {
                const botons = [...document.querySelectorAll('#llocs .btn-lloc')];
                botons.find(b => !b.disabled && (b.dataset.lloc === lloc) === bo).click();
            },
            [q.lloc, bo]
        );
    } else {
        // Bé: el punt demanat o un d'exemple del lloc; malament: un punt d'un altre quadrant (o una coordenada canviada)
        const bons = q.tipus === 'coordenades' ? [q.punt.x, q.punt.y] : EXEMPLES[q.lloc];
        const mals =
            q.tipus === 'coordenades'
                ? [bons[0] === 5 ? -5 : bons[0] + 1, bons[1] === 4 ? -4 : bons[1] + 1]
                : EXEMPLES[q.lloc === 'Q1' ? 'Q3' : 'Q1'];
        await page.evaluate(
            ([vx, vy]) => {
                const ix = document.getElementById('input-x');
                const iy = document.getElementById('input-y');
                if (ix.dataset.locked !== 'true') ix.value = String(vx);
                if (iy.dataset.locked !== 'true') iy.value = String(vy);
                window.checkCoords();
            },
            bo ? bons : mals
        );
    }
}

/** Respon bé fins que la pregunta és del tipus demanat (o s'acaben els intents de buscar-lo). */
async function finsATipus(page, tipus) {
    for (let i = 0; i < 24; i++) {
        await esperaLliure(page);
        if ((await estat(page)).pregunta.tipus === tipus) return true;
        const abans = (await estat(page)).currentOperation;
        await respon(page, true);
        await page.waitForFunction(op => window.__estatProves().currentOperation !== op, abans, { timeout: 6000 });
    }
    return false;
}

module.exports = async function ({ browser, base }) {
    suite('Coordenades: el pla i el que es demana a cada nivell');
    for (const nivell of [1, 2, 3]) {
        const page = await obre(browser, base, RUTA(nivell), { rapid: false });
        await esperaLliure(page);
        const v = await page.evaluate(() => ({
            ample: document.getElementById('canvas-pla').getBoundingClientRect().width,
            demana:
                document.getElementById('demana').textContent.trim() !== '' ||
                document.querySelector('#demana svg') !== null,
            cap: document.getElementById('lvl-display').textContent,
        }));
        ok(
            v.ample > 100 && v.demana && v.cap === 'Repte 1 de 24',
            `nivell ${nivell}: pla de ${Math.round(v.ample)} px, es demana alguna cosa i «${v.cap}»`
        );
        ok(
            page.errors.length === 0 && page.externes.length === 0,
            `sense errors JS ni peticions externes (${unics(page.errors) || 'cap'})`
        );
        await page.context().close();
    }

    suite('Coordenades: respostes equivocades i solució revelada de cada tipus de pregunta');
    for (const tipus of ['situa', 'coordenades', 'quadrant', 'al-quadrant']) {
        const page = await obre(browser, base, RUTA(3), { congela: 2000 });
        const trobat = await finsATipus(page, tipus);
        ok(trobat, `${tipus}: surt una pregunta d'aquest tipus`);
        if (!trobat) {
            await page.context().close();
            continue;
        }
        await respon(page, false);
        await page.waitForTimeout(100);
        const marca = await page.evaluate(() => ({
            marca: document.getElementById('marca').textContent.trim(),
            malament: document.querySelectorAll('#llocs .btn-lloc.wrong').length,
        }));
        ok(
            marca.marca.includes('✖') || marca.malament === 1,
            `${tipus}: una resposta equivocada es marca amb ✖ («${marca.marca || 'icona'}»)`
        );
        for (let i = 0; i < 2; i++) {
            await esperaLliure(page);
            await respon(page, false);
        }
        // S'esgoten els intents: «Intents: 0» (i, segons el tipus, surt la solució)
        await page.waitForFunction(() => document.getElementById('attempts-display').textContent.endsWith('0'), null, {
            timeout: 4000,
        });
        await page.waitForTimeout(1200);
        const rev = await page.evaluate(() => ({
            icona: document.querySelectorAll('#llocs .reveal-answer').length,
            caselles: [...document.querySelectorAll('#coord-area input.reveal')].map(i => i.value),
            intents: document.getElementById('attempts-display').textContent,
        }));
        ok(
            tipus === 'situa'
                ? rev.intents.endsWith('0')
                : tipus === 'quadrant'
                  ? rev.icona === 1
                  : rev.caselles.length === 2,
            `${tipus}: amb els intents esgotats surt la solució (${tipus === 'quadrant' ? 'icona' : tipus === 'situa' ? 'punt en verd' : rev.caselles.join(', ')})`
        );
        await page.context().close();
    }

    suite('Coordenades: partida completa, mòbil i sessions fixes');
    {
        const p = await obre(browser, base, RUTA(2, '&totaloperations=8'));
        let final = false;
        const tipus = new Set();
        for (let i = 0; i < 400 && !final; i++) {
            final = await p.evaluate(
                () => getComputedStyle(document.getElementById('final-screen')).display !== 'none'
            );
            if (final) break;
            const st = await p.evaluate(() => ({
                sessio: getComputedStyle(document.getElementById('session-end-screen')).display !== 'none',
                ocupat: window.__estatProves().ocupat || window.__estatProves().isTransitioning,
                tipus: window.__estatProves().pregunta?.tipus,
            }));
            if (st.sessio) await p.evaluate(() => window.startNextSession());
            else if (!st.ocupat) {
                tipus.add(st.tipus);
                await respon(p, true);
            }
            await p.waitForTimeout(40);
        }
        ok(
            final && p.errors.length === 0,
            `responent bé s'arriba a la pantalla final (tipus vistos: ${[...tipus].join(', ')}; errors: ${unics(p.errors) || 'cap'})`
        );
        await p.context().close();

        const m = await obre(browser, base, RUTA(2), { mobil: true, w: 360, h: 700 });
        await esperaLliure(m);
        const d = await m.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
        ok(d[0] <= d[1], `en mòbil no desborda (${d[0]} ≤ ${d[1]})`);
        await m.context().close();

        const a = await obre(browser, base, RUTA(2), { rapid: false });
        const b = await obre(browser, base, RUTA(2), { rapid: false });
        const [ea, eb] = [await estat(a), await estat(b)];
        ok(JSON.stringify(ea.pregunta) === JSON.stringify(eb.pregunta), '?fixed=A dona sempre la mateixa pregunta');
        await a.context().close();
        await b.context().close();
    }
};
