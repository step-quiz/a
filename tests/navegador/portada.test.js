/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/navegador/portada.test.js
 * ROL: La portada (index.html, el generador d'enllaços del professorat):
 *      llista d'activitats, selector accessible amb teclat, botó «Copia»,
 *      botó «Tutorial», peu amb la llicència, cap recurs de tercers i que cada
 *      enllaç generat obre l'activitat amb els paràmetres triats.
 * ============================================================================
 */
'use strict';
const { suite, ok } = require('../harness');
const { obre, unics, text } = require('./helpers');

const enllac = page => page.evaluate(() => document.getElementById('l-eso').textContent);
const triaPerFitxer = (page, fitxer) =>
    page.evaluate(f => {
        const i = ACTIVITIES_ESO.findIndex(a => a.file === f);
        document.getElementById(`cd-eso-opt-${i}`).click();
    }, fitxer);

module.exports = async function ({ browser, base }) {
    suite('Portada: contingut, peu i cap recurs de tercers (escriptori 1280×800)');
    {
        const page = await obre(browser, base, 'index.html', { rapid: false });
        await page.waitForTimeout(2600); // fi de les animacions d'entrada
        const r = await page.evaluate(() => ({
            opcions: [...document.querySelectorAll('.cd-option')].map(o => o.innerText.trim()),
            triada: (document.querySelector('.cd-option.selected') || {}).innerText,
            peu: document.querySelector('.site-footer').innerText,
            peuRect: (b => ({ top: b.top, bottom: b.bottom }))(
                document.querySelector('.site-footer').getBoundingClientRect()
            ),
            panellRect: (b => ({ top: b.top, bottom: b.bottom }))(
                document.getElementById('panel-eso').getBoundingClientRect()
            ),
            flotants: document.querySelectorAll('.bottom-icon').length,
            html: document.documentElement.outerHTML,
            sw: document.documentElement.scrollWidth,
            iw: innerWidth,
            sh: document.documentElement.scrollHeight,
            ih: innerHeight,
        }));
        ok(
            JSON.stringify(r.opcions) ===
                JSON.stringify([
                    "Rellotge d'agulles",
                    'Nombres enters',
                    'Diners i canvi (decimals)',
                    'Proporció directa',
                    'Equacions de 1r grau',
                    'Ordenar enters',
                    'Temperatura (gràfica)',
                    'MCD i MCM',
                    'Factoritzar',
                    'Fraccions',
                    'Àrea i perímetre',
                    'Triangle rectangle',
                    'Coordenades',
                    'Potències',
                    'Escriure nombres (0–100)',
                    "Prioritat d'operacions",
                    'Vocabulari (paraules amb imatge)',
                ]),
            `activitats: ${JSON.stringify(r.opcions)}`
        );
        ok((r.triada || '').trim() === 'Nombres enters', `activitat per defecte: ${(r.triada || '').trim()}`);
        ok(/CC BY-NC-SA 4\.0/.test(r.peu) && /MIT/.test(r.peu) && !/NC-ND/.test(r.html), `peu: «${text(r.peu)}»`);
        ok(
            !/licensebuttons|wikimedia|by-sa\/4\.0/.test(r.html),
            'cap referència a licensebuttons.net, wikimedia ni a by-sa'
        );
        ok(page.externes.length === 0, `peticions a tercers: ${page.externes.join(', ') || 'cap'}`);
        ok(r.flotants === 0, 'cap botó flotant');
        ok(
            r.peuRect.top >= r.panellRect.bottom,
            `el peu (${Math.round(r.peuRect.top)}) és sota el panell (${Math.round(r.panellRect.bottom)})`
        );
        ok(
            Math.abs(r.peuRect.bottom - r.ih) <= 1,
            `el peu toca el fons de la finestra (${Math.round(r.peuRect.bottom)} / ${r.ih})`
        );
        ok(r.sw <= r.iw && r.sh <= r.ih, `sense barres de desplaçament: ${r.sw}×${r.sh} dins de ${r.iw}×${r.ih}`);
        ok(page.errors.length === 0, `errors JS i de consola: ${page.errors.length ? unics(page.errors) : 'cap'}`);
        await page.context().close();
    }

    suite("Selector d'activitat: teclat i ARIA (R12a)");
    {
        const page = await obre(browser, base, 'index.html', { rapid: false });
        await page.keyboard.press('Tab');
        const f0 = await page.evaluate(() => ({
            rol: document.activeElement.getAttribute('role'),
            classe: document.activeElement.className,
            expandit: document.activeElement.getAttribute('aria-expanded'),
            etiqueta: document.activeElement.getAttribute('aria-labelledby'),
            contorn: `${getComputedStyle(document.activeElement).outlineStyle} ${getComputedStyle(document.activeElement).outlineWidth}`,
        }));
        ok(
            /cd-trigger/.test(f0.classe) && f0.rol === 'combobox' && f0.expandit === 'false',
            `el primer Tab arriba al selector (role=${f0.rol}, aria-expanded=${f0.expandit})`
        );
        ok(f0.etiqueta === 'cd-eso-label', 'el selector té el nom «Activitat» (aria-labelledby)');
        ok(/solid 3px/.test(f0.contorn), `focus visible: ${f0.contorn}`);
        await page.keyboard.press('ArrowDown');
        let st = await page.evaluate(() => ({
            expandit: document.querySelector('.cd-trigger').getAttribute('aria-expanded'),
            actiu: document.querySelector('.cd-trigger').getAttribute('aria-activedescendant'),
            obert: document.getElementById('cd-eso').classList.contains('open'),
        }));
        ok(
            st.obert && st.expandit === 'true' && st.actiu === 'cd-eso-opt-1',
            `↓ obre la llista i ressalta l'activitat actual: ${JSON.stringify(st)}`
        );
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        ok(
            (await page.evaluate(() => document.querySelector('.cd-trigger').getAttribute('aria-activedescendant'))) ===
                'cd-eso-opt-3',
            '↓ ↓ avança dues opcions'
        );
        await page.keyboard.press('Enter');
        let l = await enllac(page);
        ok(
            /a-proporciodirecta\.html\?totalsessions=1&totaloperations=6&maxintents=4$/.test(l),
            `Intro tria «Proporció directa»: ${l}`
        );
        ok(
            await page.evaluate(
                () =>
                    !document.getElementById('cd-eso').classList.contains('open') &&
                    document.querySelector('.cd-trigger').getAttribute('aria-expanded') === 'false' &&
                    document.querySelector('.cd-label').textContent === 'Proporció directa'
            ),
            "la llista es tanca i l'etiqueta canvia"
        );
        ok(
            await page.evaluate(() => document.querySelectorAll('.cd-option[aria-selected="true"]').length === 1),
            "aria-selected només a l'opció triada"
        );
        await page.keyboard.press('Space');
        ok(
            await page.evaluate(() => document.getElementById('cd-eso').classList.contains('open')),
            'Espai obre la llista'
        );
        await page.keyboard.press('End');
        await page.keyboard.press('Enter');
        l = await enllac(page);
        ok(/a-vocabulari\.html/.test(l), `Fi + Intro → ${l.split('?')[0].split('/').pop()}`);
        await page.keyboard.press('ArrowUp');
        await page.keyboard.press('Home');
        await page.keyboard.press('Escape');
        ok(
            (await page.evaluate(() => !document.getElementById('cd-eso').classList.contains('open'))) &&
                /a-vocabulari\.html/.test(await enllac(page)),
            'Esc tanca sense canviar la tria'
        );
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Tab');
        const f1 = await page.evaluate(() => ({
            obert: document.getElementById('cd-eso').classList.contains('open'),
            id: document.activeElement.id,
        }));
        ok(!f1.obert && f1.id === 's-eso', `Tab tanca la llista i passa al control següent (${f1.id})`);
        await page.click('.cd-trigger');
        ok(
            await page.evaluate(() => document.getElementById('cd-eso').classList.contains('open')),
            'el clic obre la llista'
        );
        await page.click('.cd-option:nth-child(1)');
        ok(/a-rellotge\.html/.test(await enllac(page)), 'el clic en una opció la tria (rellotge)');
        await page.click('.cd-trigger');
        await page.click('h2');
        ok(
            await page.evaluate(() => !document.getElementById('cd-eso').classList.contains('open')),
            'el clic fora tanca la llista'
        );
        ok(page.errors.length === 0, `errors JS: ${page.errors.length ? unics(page.errors) : 'cap'}`);
        await page.context().close();
    }

    suite("«Copia»: porta-retalls, alternativa i missatge d'error (R12b)");
    {
        const amb = async (init, comprova) => {
            const page = await obre(browser, base, 'index.html', { rapid: false, init });
            await page.click('#c-eso');
            await page.waitForTimeout(80);
            await comprova(page);
            await page.context().close();
        };
        await amb(
            () => {
                window.__porta = [];
                Object.defineProperty(navigator, 'clipboard', {
                    value: { writeText: async t => window.__porta.push(t) },
                    configurable: true,
                });
            },
            async page => {
                const r = await page.evaluate(() => ({
                    estat: document.getElementById('st-eso').textContent,
                    copiat: window.__porta[0],
                    enllac: document.getElementById('l-eso').textContent,
                    live: document.getElementById('st-eso').getAttribute('aria-live'),
                }));
                ok(
                    r.estat === 'Copiat ✅' && r.copiat === r.enllac,
                    `porta-retalls: «${r.estat}», el text copiat és l'enllaç`
                );
                ok(r.live === 'polite', 'el missatge és una regió aria-live');
            }
        );
        await amb(
            () => {
                Object.defineProperty(navigator, 'clipboard', {
                    value: {
                        writeText: async () => {
                            throw new Error('denegat');
                        },
                    },
                    configurable: true,
                });
                window.__ordres = [];
                document.execCommand = c => (window.__ordres.push(`${c}:${String(getSelection())}`), true);
            },
            async page => {
                const r = await page.evaluate(() => ({
                    estat: document.getElementById('st-eso').textContent,
                    ordres: window.__ordres,
                    enllac: document.getElementById('l-eso').textContent,
                }));
                ok(
                    r.estat === 'Copiat ✅' && r.ordres.length === 1 && r.ordres[0] === `copy:${r.enllac}`,
                    `alternativa execCommand: «${r.estat}» (enllaç seleccionat: ${r.ordres[0] === `copy:${r.enllac}`})`
                );
                ok(
                    page.errors.length === 0,
                    `cap error no controlat: ${page.errors.length ? unics(page.errors) : 'cap'}`
                );
            }
        );
        await amb(
            () => {
                Object.defineProperty(navigator, 'clipboard', {
                    value: {
                        writeText: async () => {
                            throw new Error('denegat');
                        },
                    },
                    configurable: true,
                });
                document.execCommand = () => false;
            },
            async page => {
                const r = await page.evaluate(() => ({
                    estat: document.getElementById('st-eso').textContent,
                    seleccio: String(getSelection()),
                    enllac: document.getElementById('l-eso').textContent,
                }));
                ok(
                    /Ctrl\+C/.test(r.estat) && r.seleccio === r.enllac,
                    `sense còpia possible: «${r.estat}» i l'enllaç queda seleccionat`
                );
                ok(
                    page.errors.length === 0,
                    `cap error no controlat: ${page.errors.length ? unics(page.errors) : 'cap'}`
                );
            }
        );
    }

    suite('Botó «▶ Tutorial»');
    {
        const page = await obre(browser, base, 'index.html', { rapid: false });
        ok(
            await page.evaluate(() => getComputedStyle(document.getElementById('h-eso')).display === 'none'),
            "amagat mentre duren les animacions d'entrada"
        );
        await page.waitForTimeout(5000);
        ok(
            await page.evaluate(() => getComputedStyle(document.getElementById('h-eso')).display !== 'none'),
            'visible per a «Nombres enters» (té tutorial)'
        );
        ok(
            (await page.evaluate(() => document.getElementById('h-eso').textContent.trim().replace(/\s+/g, ' '))) ===
                '▶ Tutorial',
            'text «▶ Tutorial» (sense la icona de YouTube)'
        );
        const [pop] = await Promise.all([page.waitForEvent('popup', { timeout: 4000 }), page.click('#h-eso')]);
        await pop.waitForLoadState('load').catch(() => {});
        ok(pop.url() === `${base}/a-enters-tutorial.html`, `obre ${pop.url()}`);
        await pop.close();
        for (const [fitxer, tutorial] of [
            ['a-decimals.html', 'a-decimals-tutorial.html'],
            ['a-proporciodirecta.html', 'a-proporciodirecta-tutorial.html'],
            ['a-equacions.html', 'a-equacions-tutorial.html'],
            ['a-rellotge.html', null],
            ['a-recta-numerica.html', null],
            ['a-mcd-mcm.html', null],
            ['a-factoritzar.html', null],
            ['a-fraccions.html', null],
            ['a-area-perimetre.html', null],
            ['a-triangle-rectangle.html', null],
            ['a-pla-cartesia.html', null],
            ['a-potencies.html', null],
            ['a-nombres-lletres.html', null],
            ['a-prioritat.html', null],
            ['a-vocabulari.html', null],
        ]) {
            await triaPerFitxer(page, fitxer);
            await page.waitForTimeout(1300);
            const visible = await page.evaluate(
                () => getComputedStyle(document.getElementById('h-eso')).display !== 'none'
            );
            if (tutorial) {
                const [p2] = await Promise.all([page.waitForEvent('popup', { timeout: 4000 }), page.click('#h-eso')]);
                ok(
                    visible && p2.url() === `${base}/${tutorial}`,
                    `${fitxer}: botó visible → ${p2.url().split('/').pop()}`
                );
                await p2.close();
            } else {
                ok(!visible, `${fitxer}: sense botó (encara no hi ha tutorial)`);
            }
        }
        await page.context().close();
    }

    suite('Generador: el camp «Sessió fixa» només surt a les activitats que admeten sessions fixes');
    {
        const page = await obre(browser, base, 'index.html', { rapid: false });
        const fila = () =>
            page.evaluate(() => {
                const f = document.getElementById('row-fixed-eso');
                const s = document.getElementById('fix-eso');
                return {
                    visible: getComputedStyle(f).display !== 'none',
                    valor: s.value,
                    opcions: [...s.options].map(o => o.textContent.trim()),
                    etiqueta: f.querySelector('label').textContent.trim(),
                    associada: f.querySelector('label').htmlFor === s.id,
                    mida: parseFloat(getComputedStyle(s).fontSize),
                };
            });
        let f = await fila();
        ok(
            f.visible && f.valor === '' && f.etiqueta === 'Sessió fixa' && f.associada,
            `a-enters (per defecte): el camp «${f.etiqueta}» és visible, associat al seu selector i buit`
        );
        ok(
            JSON.stringify(f.opcions) === JSON.stringify(['— Aleatòria —', 'A', 'B', 'C']),
            `opcions: ${JSON.stringify(f.opcions)}`
        );
        ok(f.mida >= 16, `el selector té ${f.mida} px (iOS no fa zoom en tocar-lo)`);
        ok(!/fixed=/.test(await enllac(page)), "sense triar res, l'enllaç no porta ?fixed=");
        await page.selectOption('#fix-eso', 'B');
        ok(
            /a-enters\.html\?totalsessions=1&totaloperations=6&maxintents=4&fixed=B$/.test(await enllac(page)),
            `triar B afegeix ?fixed=B a l'enllaç: ${await enllac(page)}`
        );
        await page.selectOption('#o-eso', '3');
        await page.selectOption('#i-eso', '5');
        ok(
            /totaloperations=3&maxintents=5&fixed=B$/.test(await enllac(page)),
            'canviar preguntes i errors màxims conserva la sessió fixa'
        );
        // a-decimals (PR 8b) també admet sessions fixes: el camp surt i la sessió triada es conserva en canviar d'activitat
        await triaPerFitxer(page, 'a-decimals.html');
        f = await fila();
        ok(
            f.visible && f.valor === 'B',
            `a-decimals també admet sessions fixes: el camp surt i conserva la B triada a a-enters (valor «${f.valor}»)`
        );
        ok(
            /a-decimals\.html\?totalsessions=1&totaloperations=3&maxintents=5&fixed=B$/.test(await enllac(page)),
            `l'enllaç d'a-decimals porta ?fixed=B: ${await enllac(page)}`
        );
        await triaPerFitxer(page, 'a-proporciodirecta.html');
        f = await fila();
        ok(
            f.visible && f.valor === 'B' && /a-proporciodirecta\.html\?.*&fixed=B$/.test(await enllac(page)),
            "a-proporciodirecta també admet sessions fixes: el camp surt i l'enllaç porta ?fixed=B"
        );
        await triaPerFitxer(page, 'a-rellotge.html');
        f = await fila();
        ok(
            f.visible && f.valor === 'B' && /a-rellotge\.html\?.*&fixed=B$/.test(await enllac(page)),
            "a-rellotge també admet sessions fixes: el camp surt i l'enllaç porta ?fixed=B"
        );
        await triaPerFitxer(page, 'a-recta-numerica.html');
        f = await fila();
        ok(
            f.visible && f.valor === 'B' && /a-recta-numerica\.html\?.*&fixed=B$/.test(await enllac(page)),
            "a-recta-numerica també admet sessions fixes: el camp surt i l'enllaç porta ?fixed=B"
        );
        await triaPerFitxer(page, 'a-mcd-mcm.html');
        f = await fila();
        ok(
            f.visible && f.valor === 'B' && /a-mcd-mcm\.html\?.*&fixed=B$/.test(await enllac(page)),
            "a-mcd-mcm també admet sessions fixes: el camp surt i l'enllaç porta ?fixed=B"
        );
        await triaPerFitxer(page, 'a-factoritzar.html');
        f = await fila();
        ok(
            f.visible && f.valor === 'B' && /a-factoritzar\.html\?.*&fixed=B$/.test(await enllac(page)),
            "a-factoritzar també admet sessions fixes: el camp surt i l'enllaç porta ?fixed=B"
        );
        await triaPerFitxer(page, 'a-fraccions.html');
        f = await fila();
        ok(
            f.visible && f.valor === 'B' && /a-fraccions\.html\?.*&fixed=B$/.test(await enllac(page)),
            "a-fraccions també admet sessions fixes: el camp surt i l'enllaç porta ?fixed=B"
        );
        await triaPerFitxer(page, 'a-area-perimetre.html');
        f = await fila();
        ok(
            f.visible && f.valor === 'B' && /a-area-perimetre\.html\?.*&fixed=B$/.test(await enllac(page)),
            "a-area-perimetre també admet sessions fixes: el camp surt i l'enllaç porta ?fixed=B"
        );
        await triaPerFitxer(page, 'a-triangle-rectangle.html');
        f = await fila();
        ok(
            f.visible && f.valor === 'B' && /a-triangle-rectangle\.html\?.*&fixed=B$/.test(await enllac(page)),
            "a-triangle-rectangle també admet sessions fixes: el camp surt i l'enllaç porta ?fixed=B"
        );
        await triaPerFitxer(page, 'a-pla-cartesia.html');
        f = await fila();
        ok(
            f.visible && f.valor === 'B' && /a-pla-cartesia\.html\?.*&fixed=B$/.test(await enllac(page)),
            "a-pla-cartesia també admet sessions fixes: el camp surt i l'enllaç porta ?fixed=B"
        );
        await triaPerFitxer(page, 'a-equacions.html');
        f = await fila();
        ok(
            f.visible && f.valor === 'B' && /a-equacions\.html\?.*&fixed=B$/.test(await enllac(page)),
            "a-equacions també admet sessions fixes: el camp surt i l'enllaç porta ?fixed=B"
        );
        // Ja totes les activitats del selector admeten sessions fixes: el camp surt sempre
        await triaPerFitxer(page, 'a-enters.html');
        f = await fila();
        ok(f.visible, 'en tornar a a-enters el camp continua visible');
        await page.selectOption('#fix-eso', 'C');
        const url = await enllac(page);
        const p2 = await page.context().newPage();
        const errors = [];
        p2.on('pageerror', e => errors.push(e.message));
        await p2.goto(url, { waitUntil: 'load' });
        await p2.waitForTimeout(250);
        const e = await p2.evaluate(() => ({
            ...window.__estatProves(),
            badge: (document.getElementById('badge-sessio-fixa') || {}).textContent ?? null,
        }));
        ok(
            e.fixed === 'C' &&
                e.badge === 'Sessió fixa C' &&
                e.sessions === 1 &&
                e.preguntes === 3 &&
                e.intents === 5 &&
                errors.length === 0,
            `l'enllaç generat obre la sessió fixa C amb els paràmetres triats (sessions=${e.sessions}, preguntes=${e.preguntes}, intents=${e.intents}, distintiu «${e.badge}»)`
        );
        await page.context().close();
    }

    suite("Cada enllaç generat obre l'activitat amb els paràmetres triats");
    {
        const page = await obre(browser, base, 'index.html', { rapid: false });
        await page.selectOption('#s-eso', '2');
        await page.selectOption('#o-eso', '3');
        await page.selectOption('#i-eso', '5');
        for (const f of [
            'a-rellotge.html',
            'a-enters.html',
            'a-decimals.html',
            'a-proporciodirecta.html',
            'a-equacions.html',
            'a-recta-numerica.html',
            'a-mcd-mcm.html',
            'a-factoritzar.html',
            'a-fraccions.html',
            'a-area-perimetre.html',
            'a-triangle-rectangle.html',
            'a-pla-cartesia.html',
            'a-potencies.html',
            'a-nombres-lletres.html',
            'a-prioritat.html',
            'a-vocabulari.html',
        ]) {
            await triaPerFitxer(page, f);
            const url = await enllac(page);
            const p2 = await page.context().newPage();
            const errors = [];
            p2.on('pageerror', e => errors.push(e.message));
            const resposta = await p2.goto(url, { waitUntil: 'load' });
            await p2.waitForTimeout(250);
            const e = await p2.evaluate(() => window.__estatProves());
            const g = { s: e.sessions, o: e.preguntes, i: e.intents };
            ok(
                resposta.status() === 200 && g.s === 2 && g.o === 3 && g.i === 5 && errors.length === 0,
                `${f}: HTTP ${resposta.status()}, sessions=${g.s}, preguntes=${g.o}, intents=${g.i}, errors ${errors.length || 'cap'}`
            );
            await p2.close();
        }
        await page.context().close();
    }
};
