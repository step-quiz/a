/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/navegador/professorat.test.js
 * ROL: El panell del professorat (index.html, la pàgina principal del web), el generador d'enllaços per
 *      a la classe: la llista d'activitats per temes, el selector accessible amb
 *      teclat, el nivell, el tema (només a «Vocabulari») i la sessió fixa (només
 *      a les activitats que els admeten), el botó «Copia», el botó «Tutorial», el
 *      peu amb la llicència, cap recurs de tercers i que cada enllaç generat obre
 *      l'activitat amb els paràmetres triats. El catàleg d'activitats és a
 *      js/portada/activitats.js (la seva lògica pura, a tests/activitats.test.js).
 * ============================================================================
 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { ROOT, suite, ok } = require('../harness');
const { obre, unics, text } = require('./helpers');

const enllac = page => page.evaluate(() => document.getElementById('l-eso').textContent);

const ETIQUETES = [
    'Vocabulari',
    "Rellotge d'agulles",
    'Temperatura (gràfica)',
    'Diners i canvi (decimals)',
    'Nombres enters',
    'Ordenar enters',
    'Escriure nombres (0–100)',
    "Prioritat d'operacions",
    'Potències',
    'MCD i MCM',
    'Factoritzar',
    'Fraccions',
    'Proporció directa',
    'Equacions de 1r grau',
    'Àrea i perímetre',
    'Triangle rectangle',
    'Coordenades',
];

module.exports = async function ({ browser, base }) {
    const { ACTIVITATS, GRUPS } = await import(pathToFileURL(path.join(ROOT, 'js/portada/activitats.js')).href);
    const triaPerFitxer = (page, fitxer) =>
        page.evaluate(
            i => document.getElementById(`cd-eso-opt-${i}`).click(),
            ACTIVITATS.findIndex(a => a.file === fitxer)
        );

    suite('Panell del professorat: llista per temes, peu i cap recurs de tercers (escriptori 1280×800)');
    {
        const page = await obre(browser, base, 'index.html', { rapid: false });
        const r = await page.evaluate(() => ({
            opcions: [...document.querySelectorAll('.cd-option')].map(o => o.innerText.trim()),
            grups: [...document.querySelectorAll('.cd-group')].map(g => ({
                rol: g.getAttribute('role'),
                nom: g.getAttribute('aria-label'),
                n: g.querySelectorAll('.cd-option').length,
            })),
            triada: (document.querySelector('.cd-option.selected') || {}).innerText,
            h1: document.querySelector('h1').textContent,
            recursos: [...document.querySelectorAll('.recursos a')].map(a => a.getAttribute('href')),
            peu: document.querySelector('.site-footer').innerText,
            peuTop: document.querySelector('.site-footer').getBoundingClientRect().top,
            panellBaix: document.getElementById('panel-eso').getBoundingClientRect().bottom,
            flotants: document.querySelectorAll('.bottom-icon').length,
            html: document.documentElement.outerHTML,
            sw: document.documentElement.scrollWidth,
            iw: innerWidth,
        }));
        ok(
            JSON.stringify(r.opcions) === JSON.stringify(ETIQUETES),
            `activitats, per temes: ${JSON.stringify(r.opcions)}`
        );
        ok(
            JSON.stringify(r.grups) ===
                JSON.stringify(GRUPS.map((g, k) => ({ rol: 'group', nom: g.nom, n: [1, 3, 3, 4, 2, 1, 3][k] }))),
            `cada tema és un grup amb el seu nom (role=group, aria-label): ${r.grups.map(g => `${g.nom} (${g.n})`).join(' · ')}`
        );
        ok((r.triada || '').trim() === 'Nombres enters', `activitat per defecte: ${(r.triada || '').trim()}`);
        ok(
            r.h1 === 'Professorat' &&
                JSON.stringify(r.recursos) === JSON.stringify(['targetes.html', 'album.html', 'alumnat.html']),
            `capçalera «${r.h1}» i recursos: ${r.recursos.join(', ')}`
        );
        ok(/CC BY-NC-SA 4\.0/.test(r.peu) && /MIT/.test(r.peu) && !/NC-ND/.test(r.html), `peu: «${text(r.peu)}»`);
        ok(
            !/licensebuttons|wikimedia|by-sa\/4\.0/.test(r.html),
            'cap referència a licensebuttons.net, wikimedia ni a by-sa'
        );
        ok(page.externes.length === 0, `peticions a tercers: ${page.externes.join(', ') || 'cap'}`);
        ok(r.flotants === 0, 'cap botó flotant');
        ok(
            r.peuTop >= r.panellBaix,
            `el peu (${Math.round(r.peuTop)}) és sota el panell (${Math.round(r.panellBaix)})`
        );
        ok(r.sw <= r.iw, `sense desplaçament horitzontal: ${r.sw} dins de ${r.iw}`);
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
        const actual = ACTIVITATS.findIndex(a => a.file === 'a-enters.html');
        await page.keyboard.press('ArrowDown');
        const st = await page.evaluate(() => ({
            expandit: document.querySelector('.cd-trigger').getAttribute('aria-expanded'),
            actiu: document.querySelector('.cd-trigger').getAttribute('aria-activedescendant'),
            obert: document.getElementById('cd-eso').classList.contains('open'),
        }));
        ok(
            st.obert && st.expandit === 'true' && st.actiu === `cd-eso-opt-${actual}`,
            `↓ obre la llista i ressalta l'activitat actual: ${JSON.stringify(st)}`
        );
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        ok(
            (await page.evaluate(() => document.querySelector('.cd-trigger').getAttribute('aria-activedescendant'))) ===
                `cd-eso-opt-${actual + 2}`,
            '↓ ↓ avança dues opcions (també per damunt de la ratlla que separa dos temes)'
        );
        await page.keyboard.press('Enter');
        let l = await enllac(page);
        ok(
            /a-nombres-lletres\.html\?totalsessions=1&totaloperations=6&maxintents=4$/.test(l),
            `Intro tria «Escriure nombres»: ${l}`
        );
        ok(
            await page.evaluate(
                () =>
                    !document.getElementById('cd-eso').classList.contains('open') &&
                    document.querySelector('.cd-trigger').getAttribute('aria-expanded') === 'false' &&
                    document.querySelector('.cd-label').textContent === 'Escriure nombres (0–100)'
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
        ok(/a-pla-cartesia\.html/.test(l), `Fi + Intro → ${l.split('?')[0].split('/').pop()}`);
        await page.keyboard.press('ArrowUp');
        await page.keyboard.press('Home');
        await page.keyboard.press('Escape');
        ok(
            (await page.evaluate(() => !document.getElementById('cd-eso').classList.contains('open'))) &&
                /a-pla-cartesia\.html/.test(await enllac(page)),
            'Esc tanca sense canviar la tria'
        );
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Tab');
        const f1 = await page.evaluate(() => ({
            obert: document.getElementById('cd-eso').classList.contains('open'),
            id: document.activeElement.id,
        }));
        ok(!f1.obert && f1.id === 'nivell-eso', `Tab tanca la llista i passa al control següent (${f1.id})`);
        await page.click('.cd-trigger');
        ok(
            await page.evaluate(() => document.getElementById('cd-eso').classList.contains('open')),
            'el clic obre la llista'
        );
        await page.click('#cd-eso-opt-1');
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

    suite('Botó «▶ Tutorial»: només a les activitats que en tenen');
    {
        const page = await obre(browser, base, 'index.html', { rapid: false });
        const visible = () =>
            page.evaluate(() => getComputedStyle(document.getElementById('h-eso')).display !== 'none');
        ok(await visible(), 'visible per a «Nombres enters» (té tutorial), sense esperar res');
        ok(
            (await page.evaluate(() => document.getElementById('h-eso').textContent.trim().replace(/\s+/g, ' '))) ===
                '▶ Tutorial',
            'text «▶ Tutorial» (sense la icona de YouTube)'
        );
        const dolents = [];
        let amb = 0;
        for (const a of ACTIVITATS) {
            await triaPerFitxer(page, a.file);
            if ((await visible()) !== !!a.tutorial) {
                dolents.push(`${a.file}: botó ${(await visible()) ? 'visible' : 'amagat'}`);
                continue;
            }
            if (!a.tutorial) continue;
            amb++;
            const [pop] = await Promise.all([page.waitForEvent('popup', { timeout: 4000 }), page.click('#h-eso')]);
            if (pop.url() !== `${base}/${a.tutorial}`) dolents.push(`${a.file}: obre ${pop.url()}`);
            await pop.close();
        }
        ok(
            dolents.length === 0 && amb === 4,
            `el botó surt (i obre el tutorial) a les ${amb} activitats que en tenen, i no surt a les altres`,
            dolents.join('\n')
        );
        await triaPerFitxer(page, 'a-rellotge.html');
        ok(!(await visible()), "el rellotge no ofereix el tutorial: l'activitat el té amagat a propòsit");
        await page.context().close();
    }

    suite('Nivell, tema i sessió fixa: només surten a les activitats que els admeten');
    {
        const page = await obre(browser, base, 'index.html', { rapid: false });
        const fila = id =>
            page.evaluate(id => {
                const f = document.getElementById(`row-${id}-eso`) || document.getElementById('row-fixed-eso');
                const s = document.getElementById(`${id}-eso`);
                return {
                    visible: getComputedStyle(f).display !== 'none',
                    valor: s.value,
                    opcions: [...s.options].map(o => o.textContent.trim()),
                    etiqueta: f.querySelector('label').textContent.trim(),
                    associada: f.querySelector('label').htmlFor === s.id,
                    mida: parseFloat(getComputedStyle(s).fontSize),
                };
            }, id);
        let nivell = await fila('nivell');
        let tema = await fila('tema');
        let fixa = await fila('fix');
        ok(
            nivell.visible &&
                nivell.valor === '' &&
                nivell.etiqueta === 'Nivell' &&
                nivell.associada &&
                JSON.stringify(nivell.opcions) ===
                    JSON.stringify(['— Per defecte (2) —', '1 · només sumes', '2 · sumes i restes']) &&
                !tema.visible &&
                fixa.visible &&
                fixa.valor === '' &&
                fixa.etiqueta === 'Sessió fixa' &&
                fixa.associada &&
                JSON.stringify(fixa.opcions) === JSON.stringify(['— Aleatòria —', 'A', 'B', 'C']),
            `a-enters (per defecte): «Nivell» (${nivell.opcions.length - 1} nivells) i «Sessió fixa» surten, associats al seu selector i buits; «Tema» no`
        );
        ok(nivell.mida >= 16 && fixa.mida >= 16, `els selectors tenen ${nivell.mida} px (iOS no fa zoom en tocar-los)`);
        ok(
            !/nivell=|fixed=|tema=/.test(await enllac(page)),
            "sense triar res, l'enllaç no porta ?nivell=, ?tema= ni ?fixed="
        );
        await page.selectOption('#nivell-eso', '1');
        ok(/maxintents=4&nivell=1$/.test(await enllac(page)), `triar el nivell 1: ${await enllac(page)}`);
        await page.selectOption('#fix-eso', 'B');
        ok(
            /a-enters\.html\?totalsessions=1&totaloperations=6&maxintents=4&nivell=1&fixed=B$/.test(await enllac(page)),
            `el nivell i la sessió fixa B: ${await enllac(page)}`
        );
        await page.selectOption('#o-eso', '3');
        await page.selectOption('#i-eso', '5');
        ok(
            /totaloperations=3&maxintents=5&nivell=1&fixed=B$/.test(await enllac(page)),
            'canviar preguntes i errors màxims conserva el nivell i la sessió fixa'
        );
        // El nivell és de cada activitat (el 2 de l'una no és el 2 de l'altra): en canviar d'activitat torna al per defecte; la sessió fixa es conserva
        await triaPerFitxer(page, 'a-decimals.html');
        nivell = await fila('nivell');
        ok(
            nivell.visible &&
                nivell.valor === '' &&
                nivell.opcions.length === 4 &&
                /a-decimals\.html\?totalsessions=1&totaloperations=3&maxintents=5&fixed=B$/.test(await enllac(page)),
            `a-decimals: 3 nivells, torna a «${nivell.opcions[0]}», i la sessió fixa B es conserva: ${await enllac(page)}`
        );
        await triaPerFitxer(page, 'a-vocabulari.html');
        tema = await fila('tema');
        nivell = await fila('nivell');
        ok(
            tema.visible &&
                tema.etiqueta === 'Tema' &&
                tema.associada &&
                tema.opcions.length === 21 &&
                tema.opcions[0] === '— Tots —' &&
                nivell.opcions.length === 4,
            `a-vocabulari: «Tema» surt amb ${tema.opcions.length - 1} temes (i «— Tots —») i «Nivell» amb ${nivell.opcions.length - 1} nivells`
        );
        await page.selectOption('#tema-eso', 'mat-figures');
        await page.selectOption('#nivell-eso', '3');
        ok(
            /a-vocabulari\.html\?totalsessions=1&totaloperations=3&maxintents=5&nivell=3&tema=mat-figures&fixed=B$/.test(
                await enllac(page)
            ),
            `el nivell 3 i el tema de figures planes: ${await enllac(page)}`
        );
        await triaPerFitxer(page, 'a-enters-ordenar.html');
        nivell = await fila('nivell');
        tema = await fila('tema');
        ok(
            !nivell.visible &&
                !tema.visible &&
                (await fila('fix')).visible &&
                /a-enters-ordenar\.html\?totalsessions=1&totaloperations=3&maxintents=5&fixed=B$/.test(
                    await enllac(page)
                ),
            "a-enters-ordenar no té nivells ni temes: els camps s'amaguen i l'enllaç no en porta; la sessió fixa continua"
        );
        await triaPerFitxer(page, 'a-vocabulari.html');
        ok(
            (await fila('tema')).valor === '' &&
                /fixed=B$/.test(await enllac(page)) &&
                !/tema=/.test(await enllac(page)),
            "en tornar a «Vocabulari» el tema i el nivell han tornat a ser buits (no hi queda res de l'altra vegada)"
        );
        // L'enllaç de «Vocabulari» obre l'activitat amb el nivell, el tema i la sessió triats
        await page.selectOption('#tema-eso', 'mat-figures');
        await page.selectOption('#nivell-eso', '3');
        const p2 = await page.context().newPage();
        const errors = [];
        p2.on('pageerror', e => errors.push(e.message));
        await p2.goto(await enllac(page), { waitUntil: 'load' });
        await p2.waitForTimeout(250);
        const e = await p2.evaluate(() => {
            const s = window.__estatProves();
            return {
                nivell: s.nivell,
                fixed: s.fixed,
                banc: s.banc.ids.length,
                temes: [...new Set(s.banc.ids)].length,
            };
        });
        ok(
            e.nivell === 3 && e.fixed === 'B' && e.banc === 14 && errors.length === 0,
            `l'enllaç obre «Vocabulari» al nivell ${e.nivell}, amb les ${e.banc} paraules de figures planes i la sessió fixa ${e.fixed}`
        );
        await page.context().close();
    }

    suite("Cada enllaç generat obre l'activitat amb els paràmetres triats (nivell més alt, sessió fixa B)");
    {
        const page = await obre(browser, base, 'index.html', { rapid: false });
        await page.selectOption('#s-eso', '2');
        await page.selectOption('#o-eso', '3');
        await page.selectOption('#i-eso', '5');
        await page.selectOption('#fix-eso', 'B');
        for (const a of ACTIVITATS) {
            await triaPerFitxer(page, a.file);
            if (a.nivells.length) await page.selectOption('#nivell-eso', String(a.nivells.length));
            const url = await enllac(page);
            const p2 = await page.context().newPage();
            const errors = [];
            p2.on('pageerror', e => errors.push(e.message));
            const resposta = await p2.goto(url, { waitUntil: 'load' });
            await p2.waitForTimeout(250);
            const e = await p2.evaluate(() => window.__estatProves());
            ok(
                resposta.status() === 200 &&
                    e.sessions === 2 &&
                    e.preguntes === 3 &&
                    e.intents === 5 &&
                    e.fixed === 'B' &&
                    (!a.nivells.length || e.nivell === a.nivells.length) &&
                    errors.length === 0,
                `${a.file}: HTTP ${resposta.status()}, sessions=${e.sessions}, preguntes=${e.preguntes}, intents=${e.intents}, sessió fixa ${e.fixed}${a.nivells.length ? `, nivell ${e.nivell}/${a.nivells.length}` : ''}, errors ${errors.length || 'cap'}`
            );
            await p2.close();
        }
        await page.context().close();
    }
};
