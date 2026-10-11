/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/navegador/tutorials.test.js
 * ROL: Anar al tutorial i tornar-ne conserva els paràmetres del professor
 *      (R4), a-rellotge no dona cap error en carregar (R8) i el tutorial de
 *      decimals té l'esquema de dos passos (R7).
 * ============================================================================
 */
'use strict';
const { suite, ok } = require('../harness');
const { obre, estat, unics } = require('./helpers');

const Q = 'totalsessions=2&totaloperations=3&maxintents=5&nivell=2';

/** Prem «Següent» del tutorial fins que la pàgina arriba a `ruta` (o s'acaben els intents). */
async function avancaFinsA(page, ruta, maxClics = 600) {
    for (let i = 0; i < maxClics; i++) {
        if (new URL(page.url()).pathname.endsWith(`/${ruta}`)) return true;
        await page
            .evaluate(() => {
                const b = document.querySelector('#btn-mega-next, #btn-next');
                if (b && !b.disabled) b.click();
            })
            .catch(() => {});
        await page.waitForTimeout(60);
    }
    return new URL(page.url()).pathname.endsWith(`/${ruta}`);
}

module.exports = async function ({ browser, base }) {
    suite('Activitat → tutorial → activitat conserva els paràmetres del professor (R4)');
    for (const nom of ['a-enters', 'a-decimals', 'a-equacions', 'a-proporciodirecta']) {
        const page = await obre(browser, base, `${nom}.html?${Q}`);
        await Promise.all([page.waitForURL(/-tutorial\.html/, { timeout: 8000 }), page.click('#btn-tutorial')]);
        const anada = new URL(page.url());
        ok(
            anada.pathname.endsWith(`/${nom}-tutorial.html`) && anada.search === `?${Q}`,
            `${nom}: anada → ${anada.pathname.split('/').pop()}${anada.search}`
        );
        const torna = await avancaFinsA(page, `${nom}.html`);
        await page.waitForLoadState('load').catch(() => {});
        const tornada = new URL(page.url());
        ok(
            torna && tornada.search === `?${Q}`,
            `${nom}: tornada → ${tornada.pathname.split('/').pop()}${tornada.search}`
        );
        if (torna) {
            await page.waitForTimeout(250);
            const e = await estat(page);
            const g = { s: e.sessions, o: e.preguntes, i: e.intents, n: e.nivell };
            ok(
                g.s === 2 && g.o === 3 && g.i === 5 && (g.n === null || g.n === 2),
                `${nom}: l'activitat aplica sessions=${g.s}, preguntes=${g.o}, intents=${g.i}, nivell=${g.n}`
            );
        }
        ok(page.errors.length === 0, `${nom}: errors JS: ${page.errors.length ? unics(page.errors) : 'cap'}`);
        await page.context().close();
    }

    suite('Sessió fixa: anar al tutorial i tornar-ne conserva la sessió');
    {
        const page = await obre(browser, base, 'a-enters.html?fixed=B&totaloperations=3');
        const abans = await estat(page);
        await Promise.all([page.waitForURL(/-tutorial\.html/, { timeout: 8000 }), page.click('#btn-tutorial')]);
        const anada = new URL(page.url());
        ok(
            /(^|&)fixed=B(&|$)/.test(anada.search.slice(1)) && /totaloperations=3/.test(anada.search),
            `el tutorial rep la sessió fixa i els paràmetres: ${anada.search}`
        );
        const torna = await avancaFinsA(page, 'a-enters.html');
        await page.waitForLoadState('load').catch(() => {});
        await page.waitForTimeout(250);
        const despres = await estat(page);
        ok(
            torna &&
                despres.fixed === 'B' &&
                despres.preguntes === 3 &&
                JSON.stringify(despres.operacio) === JSON.stringify(abans.operacio),
            `en tornar, continua la sessió B amb la mateixa primera pregunta (${JSON.stringify(abans.operacio)} → ${JSON.stringify(despres.operacio)})`
        );
        ok(page.errors.length === 0, `errors JS: ${page.errors.length ? unics(page.errors) : 'cap'}`);
        await page.context().close();
    }

    suite('a-rellotge: sense errors en carregar (R8) i el seu tutorial torna amb els paràmetres');
    {
        const page = await obre(browser, base, `a-rellotge.html?${Q}`);
        ok(page.errors.length === 0, `càrrega sense errors: ${page.errors.length ? unics(page.errors) : 'cap'}`);
        ok(
            await page.evaluate(() => !document.getElementById('btn-tutorial')),
            "el botó «Tutorial» continua amagat (decisió de l'autor)"
        );
        await page.goto(`${base}/a-rellotge-tutorial.html?${Q}`, { waitUntil: 'load' });
        const torna = await avancaFinsA(page, 'a-rellotge.html');
        ok(
            torna && new URL(page.url()).search === `?${Q}`,
            `el tutorial del rellotge torna a ${new URL(page.url()).pathname.split('/').pop()}${new URL(page.url()).search}`
        );
        await page.context().close();
    }

    suite("Tutorial de decimals: l'esquema de dos passos (R7)");
    {
        const page = await obre(browser, base, 'a-decimals-tutorial.html');
        const dibuix = await page.evaluate(() => ({
            sense: svgTwoSteps(0.6, 1.2, 1.8, 10, 8.2, false),
            resolt: svgTwoSteps(0.6, 1.2, 1.8, 10, 8.2, true),
        }));
        const txt = s => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
        ok(
            /^\s*<svg/.test(dibuix.sense) &&
                /0,60/.test(txt(dibuix.sense)) &&
                /1,20/.test(txt(dibuix.sense)) &&
                /\?/.test(txt(dibuix.sense)),
            'svgTwoSteps (sense resoldre): els dos preus i el «?»'
        );
        ok(
            /1,80/.test(txt(dibuix.resolt)) && /8,20/.test(txt(dibuix.resolt)),
            'svgTwoSteps (resolt): el total (1,80) i el canvi (8,20)'
        );
        // El tutorial arriba al pas «Tens dos productes…» i hi pinta el dibuix
        let arribat = false;
        for (let i = 0; i < 400 && !arribat; i++) {
            arribat = /dos productes/i.test(
                await page.evaluate(() => (document.getElementById('narration-box') || document.body).innerText)
            );
            if (!arribat) {
                await page.evaluate(() => {
                    const b = document.getElementById('btn-mega-next');
                    if (b && !b.disabled) b.click();
                });
                await page.waitForTimeout(60);
            }
        }
        await page.waitForTimeout(600);
        const panell = await page.evaluate(() => ({
            svg: !!document.querySelector('#tut-visual svg'),
            mida: document.getElementById('tut-visual').innerHTML.length,
        }));
        ok(arribat, 'el tutorial arriba al pas «Tens dos productes…»');
        ok(
            panell.svg && panell.mida > 500,
            `el panell visual no és buit (${panell.mida} caràcters, svg: ${panell.svg})`
        );
        ok(page.errors.length === 0, `errors JS: ${page.errors.length ? unics(page.errors) : 'cap'}`);
        await page.context().close();
    }
};
