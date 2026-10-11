/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/navegador/jocs.test.js
 * ROL: Partides senceres de cada activitat al navegador: pantalla final amb
 *      estrelles i punts, revisió ✔/✖, «Torna a jugar», diverses sessions,
 *      puntuació parcial, doble Intro (R1) i punts d'un encert tardà (R5).
 * ============================================================================
 */
'use strict';
const { suite, ok } = require('../harness');
const {
    ACTIVITATS,
    obre,
    estat,
    esperaLliure,
    respon,
    responLliure,
    jugaFinsAlFinal,
    text,
    unics,
} = require('./helpers');

module.exports = async function ({ browser, base }) {
    suite('Partida completa de cada activitat (3 preguntes, tot correcte)');
    for (const [nom, tipus] of ACTIVITATS) {
        const page = await obre(browser, base, `${nom}.html?totaloperations=3&maxintents=4`);
        console.log(`  — ${nom}`);
        const arriba = await jugaFinsAlFinal(page, tipus);
        const fin = await page.evaluate(() => ({
            on: document.querySelectorAll('#final-summary .star.on').length,
            off: document.querySelectorAll('#final-summary .star.off').length,
            resum: document.getElementById('final-summary').innerText,
            pantalla: document.getElementById('final-screen').innerText,
            botons: [...document.querySelectorAll('#final-screen button')].map(b => b.innerText.trim()),
            punts: window.__estatProves().sessionScores.join(','),
        }));
        ok(arriba, 'arriba a la pantalla final');
        ok(fin.on === 5 && fin.off === 0, `5 estrelles guanyades (${fin.on} il·luminades, ${fin.off} atenuades)`);
        ok(/30 \/ 30 punts/.test(text(fin.resum)), `punts: «${text(fin.resum)}»`);
        ok(fin.punts === '30', `sessionScores = [${fin.punts}] (cap pregunta comptada dues vegades)`);
        ok(
            !/codi|copiar|nota|criteri|informe/i.test(fin.pantalla),
            'la pantalla final no parla de codis, notes, criteris ni informes'
        );
        ok(
            fin.botons.length === 2 && /Revisa/.test(fin.botons[0]) && /Torna a jugar/.test(fin.botons[1]),
            `botons: ${JSON.stringify(fin.botons)}`
        );

        await page.click('#final-screen button:nth-child(1)');
        await page.waitForTimeout(100);
        const rev = await page.evaluate(() => ({
            visible: getComputedStyle(document.getElementById('history-summary-screen')).display !== 'none',
            finalAmagat: getComputedStyle(document.getElementById('final-screen')).display === 'none',
            targetes: document.querySelectorAll('.history-item').length,
            correctes: document.querySelectorAll('.history-item--ok').length,
            icones: [...new Set([...document.querySelectorAll('.history-icon')].map(i => i.textContent.trim()))].join(
                ''
            ),
            primera: ((document.querySelector('.history-item') || {}).innerText || '').replace(/\s+/g, ' ').trim(),
            botons: [...document.querySelectorAll('.history-actions button')].map(b => b.innerText.trim()),
        }));
        ok(rev.visible && rev.finalAmagat, 'la revisió es mostra i amaga la pantalla final');
        ok(
            rev.targetes >= 3 && rev.targetes === rev.correctes && rev.icones === '✔',
            `${rev.targetes} targetes, totes ✔ («${rev.primera}»)`
        );
        ok(rev.botons.length === 2, `botons de la revisió: ${JSON.stringify(rev.botons)}`);
        if (nom === 'a-equacions')
            ok(
                /=/.test(rev.primera) && !/Equació \d/.test(rev.primera),
                `la revisió mostra l'equació: «${rev.primera}»`
            );

        await page.click('.history-actions button:nth-child(1)');
        await page.waitForTimeout(80);
        const enrere = await page.evaluate(() => ({
            final: getComputedStyle(document.getElementById('final-screen')).display !== 'none',
            revisio: getComputedStyle(document.getElementById('history-summary-screen')).display === 'none',
        }));
        ok(enrere.final && enrere.revisio, '«Enrere» torna a la pantalla final');

        const [nav] = await Promise.all([
            page.waitForNavigation({ timeout: 4000 }).catch(() => null),
            page.click('#final-screen button:nth-child(2)'),
        ]);
        await page.waitForTimeout(250);
        ok(!!nav && /totaloperations=3/.test(page.url()), '«Torna a jugar» recarrega conservant els paràmetres');
        ok(page.errors.length === 0, `errors JS: ${page.errors.length ? unics(page.errors) : 'cap'}`);
        ok(
            page.fallades.length === 0 && page.externes.length === 0,
            `peticions fallides o a tercers: ${page.fallades.concat(page.externes).join(', ') || 'cap'}`
        );
        await page.context().close();
    }

    suite('Diverses sessions (a-enters: 2 sessions × 2 preguntes)');
    {
        const page = await obre(browser, base, 'a-enters.html?totalsessions=2&totaloperations=2&maxintents=4');
        await jugaFinsAlFinal(page, 'int');
        const r = await page.evaluate(() => ({
            files: [...document.querySelectorAll('#final-summary .session-line')].map(l =>
                l.innerText.replace(/\s+/g, ' ').trim()
            ),
            total: document.querySelectorAll('#final-summary .session-line--total').length,
            punts: window.__estatProves().sessionScores.join(','),
        }));
        ok(r.files.length === 3 && r.total === 1, `3 files (2 sessions + el total): ${JSON.stringify(r.files)}`);
        ok(r.punts === '20,20', `puntuació de cada sessió: [${r.punts}]`);
        await page.context().close();
    }

    suite('Puntuació parcial (a-enters, 2 intents: encert, fallada total, encert → 20/30 → 3 estrelles)');
    {
        const page = await obre(browser, base, 'a-enters.html?totaloperations=3&maxintents=2');
        for (let q = 0; q < 3; q++) {
            const malament = q === 1;
            for (let k = 0; k < (malament ? 2 : 1); k++) {
                await esperaLliure(page).catch(() => {});
                await page.evaluate(w => {
                    const { resposta } = window.__estatProves();
                    document.getElementById('value-input').value = String(w ? resposta + 1 : resposta);
                    window.checkValue();
                }, malament);
                await page.waitForTimeout(150);
            }
            await page.waitForTimeout(400);
        }
        await page.waitForFunction(
            () => getComputedStyle(document.getElementById('final-screen')).display !== 'none',
            null,
            { timeout: 8000 }
        );
        const r = await page.evaluate(() => ({
            on: document.querySelectorAll('#final-summary .star.on').length,
            resum: document.getElementById('final-summary').innerText,
            historial: window
                .__estatProves()
                .sessionHistory.map(h => (h.isCorrect ? '✔' : '✖'))
                .join(''),
        }));
        ok(r.on === 3 && /20 \/ 30 punts/.test(text(r.resum)), `${r.on} estrelles i «${text(r.resum)}»`);
        ok(r.historial === '✔✖✖✔', `historial d'intents: ${r.historial}`);
        await page.context().close();
    }

    suite('Doble enviament (R1): dos Intros seguits durant la pausa no compten dues vegades (temps real)');
    {
        const resultats = await Promise.all(
            ACTIVITATS.map(async ([nom, tipus]) => {
                const page = await obre(browser, base, `${nom}.html?totaloperations=3&maxintents=4&nivell=1`, {
                    rapid: false,
                });
                await page.waitForTimeout(400);
                for (let q = 0; q < 3; q++) {
                    if (
                        await page.evaluate(
                            () => getComputedStyle(document.getElementById('final-screen')).display !== 'none'
                        )
                    )
                        break;
                    await esperaLliure(page).catch(() => {});
                    if (tipus === 'rellotge') {
                        const { hores, minuts } = await estat(page);
                        await page.fill('#input-hores', String(hores), { timeout: 3000 });
                        await page.fill('#input-minuts', String(minuts), { timeout: 3000 });
                    } else {
                        const { resposta: r } = await estat(page);
                        const resposta = Number.isInteger(r) ? String(r) : r.toFixed(2).replace('.', ',');
                        await page.fill('#value-input', resposta, { timeout: 3000 });
                    }
                    await page.keyboard.press('Enter');
                    await page.waitForTimeout(80);
                    await page.keyboard.press('Enter');
                    await page.waitForTimeout(2400);
                }
                await page.waitForTimeout(800);
                const r = await page.evaluate(() => ({
                    punts: window.__estatProves().sessionScores.join(','),
                    resum: (document.getElementById('final-summary') || {}).innerText,
                }));
                await page.context().close();
                return [nom, r];
            })
        );
        for (const [nom, r] of resultats)
            ok(r.punts === '30', `${nom}: dos Intros per pregunta → sessionScores = [${r.punts}], «${text(r.resum)}»`);
    }

    suite("Punts d'un encert amb molts errors (R5): sempre ≥ 1 punt i «Molt bé!», no «Intents esgotats»");
    {
        // Text visible del feedback just després d'un encert o d'un esgotament (els temporitzadors accelerats el retiren aviat)
        const feedback = page =>
            page.evaluate(
                () =>
                    new Promise(resolve => {
                        const llegeix = () => {
                            const o = document.getElementById('mini-victory-overlay');
                            if (o && getComputedStyle(o).display !== 'none')
                                return o.innerText.replace(/\s+/g, ' ').trim();
                            return null;
                        };
                        const t0 = performance.now();
                        const iv = setInterval(() => {
                            const r = llegeix();
                            if (r || performance.now() - t0 > 3000) {
                                clearInterval(iv);
                                resolve(r || '(res)');
                            }
                        }, 1);
                    })
            );
        const un = async (nom, tipus, errors, intents, final) => {
            const page = await obre(browser, base, `${nom}.html?totaloperations=2&maxintents=${intents}&nivell=1`);
            for (let k = 0; k < errors; k++) await responLliure(page, tipus, false);
            await responLliure(page, tipus, final);
            const r = {
                feedback: await feedback(page),
                punts: (await estat(page)).sessionScore,
                errors: page.errors.slice(),
            };
            await page.context().close();
            return r;
        };
        const resultats = await Promise.all(
            ACTIVITATS.map(async ([nom, tipus]) => [
                nom,
                await un(nom, tipus, 5, 8, true),
                await un(nom, tipus, 6, 8, true),
                await un(nom, tipus, 1, 8, true),
                await un(nom, tipus, 2, 3, false), // 2 errors + una tercera resposta errònia = 3 intents esgotats
            ])
        );
        for (const [nom, cinc, sis, un_, esgotat] of resultats) {
            ok(
                /Molt bé/.test(cinc.feedback) && !/esgotats/i.test(cinc.feedback) && cinc.punts === 1,
                `${nom}: 5 errors + encert → «${cinc.feedback}», ${cinc.punts} punt`
            );
            ok(/Molt bé/.test(sis.feedback) && sis.punts === 1, `${nom}: 6 errors + encert → ${sis.punts} punt`);
            ok(un_.punts === 8, `${nom}: 1 error + encert → ${un_.punts} punts («${un_.feedback}»)`);
            ok(
                /esgotats/i.test(esgotat.feedback) && esgotat.punts === 0,
                `${nom}: intents esgotats → «${esgotat.feedback}», ${esgotat.punts} punts`
            );
            ok(/\+1 punt(?!s)/.test(cinc.feedback), `${nom}: «+1 punt» en singular`);
            ok(/\+8 punts/.test(un_.feedback), `${nom}: «+8 punts» en plural`);
            ok(
                [cinc, sis, un_, esgotat].every(r => r.errors.length === 0),
                `${nom}: sense errors JS`
            );
        }
    }

    suite('a-enters (motor nou): ?rang= i ?nivell= es compleixen a la pantalla (R11)');
    {
        const mira = async (cerca, preguntes) => {
            const page = await obre(browser, base, `a-enters.html?${cerca}&totaloperations=${preguntes}&maxintents=4`);
            const vistes = [];
            for (let q = 0; q < preguntes; q++) {
                await esperaLliure(page);
                const mostrat = await page.evaluate(() => ({
                    nums: [...document.querySelectorAll('#answer-row .token-num')].map(n => n.textContent.trim()),
                    op: (document.querySelector('#answer-row .token-op') || {}).textContent,
                    nivell: document.getElementById('nivell-display').textContent.trim(),
                }));
                vistes.push({ ...(await estat(page)).operacio, mostrat });
                await responLliure(page, 'int', true);
            }
            const errors = page.errors.slice();
            await page.context().close();
            return { vistes, errors };
        };
        const r3 = await mira('rang=3&nivell=2', 14);
        ok(
            r3.vistes.every(v => v.a >= -3 && v.a <= 3 && v.b >= 1 && v.b <= 3),
            `?rang=3: ${r3.vistes.length} operacions amb a entre −3 i 3 i b entre 1 i 3`
        );
        ok(
            r3.vistes.every(v => v.mostrat.nums.join() === [v.a, v.b].join() && v.mostrat.op === v.op),
            'la pantalla mostra la mateixa operació que té el joc per dins'
        );
        ok(
            r3.vistes.every(v => v.mostrat.nivell === '· Nivell 2') && r3.errors.length === 0,
            `capçalera «· Nivell 2» i sense errors JS (${unics(r3.errors) || 'cap'})`
        );
        const r1 = await mira('rang=12&nivell=1', 14);
        ok(
            r1.vistes.every(v => v.op === '+' && v.a >= 0 && v.mostrat.nivell === '· Nivell 1'),
            '?nivell=1: només sumes amb a ≥ 0 i capçalera «· Nivell 1»'
        );
    }

    suite("Textos d'a-enters (js/textos.js i js/a-enters/textos.js): capçalera, fi de sessió, final i revisió");
    {
        // Capçalera i camp de resposta (temps accelerat)
        const page = await obre(browser, base, 'a-enters.html?totalsessions=2&totaloperations=2&maxintents=4&nivell=1');
        const cap = () =>
            page.evaluate(() => ({
                sessio: document.getElementById('session-display').textContent,
                operacio: document.getElementById('lvl-display').textContent,
                nivell: document.getElementById('nivell-display').textContent,
                punts: document.getElementById('score-display').textContent,
                intents: document.getElementById('attempts-display').textContent,
                ok: document.getElementById('btn-submit-val').textContent,
                ajuda: document.querySelector('.btn-ajuda').textContent,
                etiqueta: document.getElementById('value-input').getAttribute('aria-label'),
            }));
        let c = await cap();
        ok(
            c.sessio === 'Sessió 1 de 2' &&
                c.operacio === 'Operació 1 de 2' &&
                c.nivell === '· Nivell 1' &&
                c.punts === 'Punts: 0' &&
                c.intents === 'Intents: 4',
            `capçalera: «${c.sessio}», «${c.operacio}», «${c.nivell}», «${c.punts}», «${c.intents}»`
        );
        ok(
            c.ok === 'OK' && c.ajuda.trim() === '💡 Ajuda' && c.etiqueta === 'Escriu el resultat',
            `botons i etiqueta del camp: «${c.ok}», «${c.ajuda.trim()}», «${c.etiqueta}»`
        );
        await responLliure(page, 'int', false);
        await esperaLliure(page);
        ok((await cap()).intents === 'Intents: 3', "després d'un error: «Intents: 3»");
        await page.click('.btn-ajuda');
        // El text que es llegeix: el de l'ajuda sense les imatges decoratives (aria-hidden)
        const ajuda = await page.evaluate(() => {
            const c = document.getElementById('help-text').cloneNode(true);
            c.querySelectorAll('.paraula-img').forEach(i => i.remove());
            return c.textContent;
        });
        ok(
            /^Si estic (al pis \d+|a la planta baixa|al soterrani \d+) i (pujo|baixo) (1 pis|(?:[2-9]|\d\d) pisos), en quin pis acabo\?$/.test(
                ajuda
            ),
            `frase d'ajuda: «${ajuda}»`
        );
        await responLliure(page, 'int', true);
        await page.waitForFunction(
            () => document.getElementById('lvl-display').textContent === 'Operació 2 de 2',
            null,
            { timeout: 8000 }
        );
        c = await cap();
        ok(
            c.punts === 'Punts: 8' && c.intents === 'Intents: 4',
            `segona operació: «${c.punts}» (un error resta 2) i «${c.intents}»`
        );
        await page.context().close();

        // Fi de sessió, pantalla final i revisió (temps real: el missatge d'espera dura un segon)
        const p2 = await obre(browser, base, 'a-enters.html?totalsessions=2&totaloperations=1&maxintents=3&nivell=1', {
            rapid: false,
        });
        await p2.waitForTimeout(300);
        await respon(p2, 'int', true);
        await p2.waitForFunction(
            () => getComputedStyle(document.getElementById('session-end-screen')).display !== 'none',
            null,
            { timeout: 8000 }
        );
        const fi = await p2.evaluate(() => ({
            titol: document.getElementById('session-end-title').textContent,
            espera: (document.getElementById('session-wait-msg') || {}).textContent ?? null,
            botoVisible: getComputedStyle(document.getElementById('btn-next-session')).display !== 'none',
        }));
        ok(
            fi.titol === 'Sessió 1 completada' && fi.espera === 'Preparant sessió següent…' && !fi.botoVisible,
            `fi de sessió: «${fi.titol}», «${fi.espera}»`
        );
        await p2.waitForFunction(
            () => getComputedStyle(document.getElementById('btn-next-session')).display !== 'none',
            null,
            { timeout: 4000 }
        );
        ok(
            (await p2.evaluate(() => document.getElementById('btn-next-session').textContent)) ===
                'Començar sessió següent',
            'botó «Començar sessió següent»'
        );
        await p2.click('#btn-next-session');
        ok(
            (await p2.evaluate(() => document.getElementById('session-display').textContent)) === 'Sessió 2 de 2',
            'la segona sessió: «Sessió 2 de 2»'
        );
        await respon(p2, 'int', true);
        await p2.waitForFunction(
            () => getComputedStyle(document.getElementById('final-screen')).display !== 'none',
            null,
            { timeout: 8000 }
        );
        const fin = await p2.evaluate(() => ({
            linies: [...document.querySelectorAll('#final-summary .session-line')].map(l =>
                l.innerText.replace(/\s+/g, ' ').trim()
            ),
            etiquetaEstrelles: (document.querySelector('#final-summary .stars') || {}).getAttribute?.('aria-label'),
            botons: [...document.querySelectorAll('#final-screen button')].map(b => b.textContent.trim()),
        }));
        ok(
            fin.linies.length === 3 &&
                /^Sessió 1 /.test(fin.linies[0]) &&
                /^Sessió 2 /.test(fin.linies[1]) &&
                /^Total /.test(fin.linies[2]),
            `pantalla final: «${fin.linies.join('» · «')}»`
        );
        ok(
            fin.etiquetaEstrelles === '5 de 5 estrelles' && fin.botons.join('|') === '📋 Revisa|🔄 Torna a jugar',
            `estrelles: «${fin.etiquetaEstrelles}»; botons: ${fin.botons.join(' | ')}`
        );
        await p2.click('#final-screen button:nth-child(1)');
        const rev = await p2.evaluate(() => ({
            encapcalament: document.querySelector('.history-heading').getAttribute('aria-label'),
            icona: document.querySelector('.history-icon').getAttribute('aria-label'),
            botons: [...document.querySelectorAll('.history-actions button')].map(b => b.textContent.trim()),
        }));
        ok(
            rev.encapcalament === 'Revisió' &&
                rev.icona === 'Correcte' &&
                rev.botons.join('|') === '⬅ Enrere|🔄 Torna a jugar',
            `revisió: «${rev.encapcalament}», «${rev.icona}», ${rev.botons.join(' | ')}`
        );
        ok(p2.errors.length === 0, `sense errors JS (${unics(p2.errors) || 'cap'})`);
        await p2.context().close();
    }

    suite("Paraules amb imatge (PR 6b): l'ajuda d'a-enters porta pictogrames i emojis, i es llegeix bé");
    {
        const page = await obre(browser, base, 'a-enters.html?fixed=A&totaloperations=8&nivell=2&maxintents=4');
        // El que ha de dir l'ajuda de cada operació, escrit a partir de l'enunciat (no del generador)
        const esperat = ({ a, op, b }) => ({
            frase: `Si estic ${a === 0 ? 'a la planta baixa' : a > 0 ? `al pis ${a}` : `al soterrani ${-a}`} i ${
                op === '+' ? 'pujo' : 'baixo'
            } ${b} ${b === 1 ? 'pis' : 'pisos'}, en quin pis acabo?`,
            ids: [
                a === 0 ? 'planta-baixa' : a > 0 ? 'pis' : 'soterrani',
                op === '+' ? 'pujar' : 'baixar',
                'pis',
                'pis',
            ],
        });
        const vistos = new Set();
        const problemes = [];
        for (let q = 0; q < 8; q++) {
            await esperaLliure(page);
            const { operacio } = await estat(page);
            const clau = `${operacio.a} ${operacio.op} ${operacio.b}`;
            const esp = esperat(operacio);
            await page.click('.btn-ajuda');
            const r = await page.evaluate(() => {
                const ajuda = document.getElementById('help-text');
                const caixa = ajuda.getBoundingClientRect();
                const dins = (b, c) =>
                    b.left >= c.left - 1 && b.right <= c.right + 1 && b.top >= c.top - 1 && b.bottom <= c.bottom + 1;
                const llegit = ajuda.cloneNode(true);
                llegit.querySelectorAll('.paraula-img').forEach(i => i.remove());
                return {
                    visible: getComputedStyle(ajuda).display !== 'none' && caixa.height > 0,
                    alt: caixa.height,
                    llegit: llegit.textContent,
                    desborda: ajuda.scrollWidth > ajuda.clientWidth + 1,
                    paraules: [...ajuda.querySelectorAll('.paraula')].map(el => {
                        const b = el.getBoundingClientRect();
                        const img = el.querySelector(':scope > .paraula-img');
                        const text = el.querySelector(':scope > .paraula-text');
                        const svg = el.querySelector('svg');
                        const sb = svg && svg.getBoundingClientRect();
                        const destac = el.querySelector('.pict-destac');
                        return {
                            id: el.dataset.paraula,
                            imatgeAmagada: !!img && img.getAttribute('aria-hidden') === 'true',
                            text: !!text && text.textContent.trim() !== '' && !text.closest('[aria-hidden]'),
                            dinsLaCaixa: dins(b, caixa),
                            svg: svg && {
                                gran: sb.width >= 16 && sb.height >= 16,
                                dinsLaPindola: dins(sb, b),
                                amagat:
                                    svg.getAttribute('aria-hidden') === 'true' &&
                                    svg.getAttribute('focusable') === 'false',
                                colorat: !!destac && !['none', 'rgb(0, 0, 0)'].includes(getComputedStyle(destac).fill),
                            },
                        };
                    }),
                };
            });
            // Les píndoles són botons (un toc n'obre la targeta): l'arbre d'accessibilitat porta text i botons, sense les imatges
            const snap = await page.locator('#help-text').ariaSnapshot();
            const aria = snap
                .split('\n')
                .map(l => l.replace(/^- (?:text: |button )/, '').replace(/^"(.*)"$/, '$1'))
                .join(' ')
                .replace(/\s+([,.?])/g, '$1')
                .trim();
            const ids = r.paraules.map(x => x.id);
            r.paraules.forEach(x => vistos.add(x.id));
            const mal = (cond, msg) => cond || problemes.push(`${clau}: ${msg}`);
            mal(r.visible, "l'ajuda no es veu");
            mal(r.alt < 85, `l'ajuda fa ${Math.round(r.alt)} px d'alt: les paraules haurien d'anar en una sola línia`);
            mal(ids.join() === esp.ids.join(), `paraules ${ids} (esperat ${esp.ids})`);
            mal(r.llegit === esp.frase, `frase «${r.llegit}» (esperat «${esp.frase}»)`);
            mal(aria === esp.frase, `un lector de pantalla llegiria «${aria}» (esperat «${esp.frase}»)`);
            mal((snap.match(/- button "/g) || []).length === 4, `les 4 píndoles haurien de ser botons: ${snap}`);
            mal(
                r.paraules.every(x => x.imatgeAmagada && x.text),
                'imatge sense aria-hidden o paraula sense text'
            );
            mal(!r.desborda && r.paraules.every(x => x.dinsLaCaixa), "una paraula surt de la caixa de l'ajuda");
            mal(
                r.paraules.every(x => !x.svg || (x.svg.gran && x.svg.dinsLaPindola && x.svg.amagat && x.svg.colorat)),
                'un pictograma és massa petit, surt de la píndola, no és aria-hidden o no té color'
            );
            await page.click('.btn-ajuda');
            await responLliure(page, 'int', true);
        }
        ok(
            problemes.length === 0,
            "8 preguntes amb l'ajuda oberta: les paraules, la frase i el que llegeix un lector de pantalla són els esperats",
            problemes.slice(0, 3).join(' ; ')
        );
        ok(
            ['pis', 'soterrani', 'pujar', 'baixar'].every(id => vistos.has(id)),
            `a la sessió fixa A surten pis, soterrani, pujar i baixar (vistos: ${[...vistos].join(', ')})`
        );

        // Els tres pictogrames de l'edifici, tal com els pinta el CSS: cadascun destaca el nivell que toca
        const pict = await page.evaluate(async () => {
            const m = await import('./js/lexicon/paraula.js');
            const c = document.createElement('div');
            c.id = 'prova-paraules';
            c.style.cssText = 'font-size:20px;padding:10px;position:absolute;top:0;left:0;background:#fff';
            c.innerHTML = ['pis', 'planta-baixa', 'soterrani'].map(id => m.paraula(id)).join(' ');
            document.body.appendChild(c);
            return [...c.querySelectorAll('.paraula')].map(el => {
                const svg = el.querySelector('svg');
                const destacats = svg.querySelectorAll('.pict-destac');
                const d = destacats[0].getBBox();
                const terra = svg.querySelector('.pict-terra').getBBox();
                return {
                    id: el.dataset.paraula,
                    codi: svg.outerHTML,
                    destacats: destacats.length,
                    dalt: d.y,
                    baix: d.y + d.height,
                    terra: terra.y,
                    pisos: svg.querySelectorAll('rect').length,
                };
            });
        });
        const [pis, plantaBaixa, soterrani] = pict;
        ok(
            pict.every(x => x.destacats === 1),
            'cada pictograma destaca un únic nivell (el color de la paraula)'
        );
        ok(
            pis.baix < pis.terra && plantaBaixa.baix === plantaBaixa.terra && soterrani.dalt === soterrani.terra,
            'pis: un pis de dalt; planta baixa: el nivell que toca el terra; soterrani: el nivell sota el terra'
        );
        ok(
            plantaBaixa.baix > pis.baix && new Set(pict.map(x => x.codi)).size === 3,
            'els tres pictogrames són diferents i la planta baixa és més avall que el pis'
        );
        // La moneda de «canvi»: un disc de color amb un anell i un «€» de traços, que es veu (i es pinta) com cal
        const moneda = await page.evaluate(async () => {
            const m = await import('./js/lexicon/paraula.js');
            const c = document.createElement('div');
            c.id = 'prova-moneda';
            c.style.cssText = 'font-size:20px;position:absolute;top:60px;left:0;background:#fff';
            c.innerHTML = m.paraula('canvi');
            document.body.appendChild(c);
            const svg = c.querySelector('svg');
            const b = svg.getBoundingClientRect();
            const fill = s => getComputedStyle(svg.querySelector(s)).fill;
            return {
                w: b.width,
                h: b.height,
                disc: fill('circle.pict-destac'),
                anell: fill('circle.pict-linia'),
                euro: fill('path.pict-linia'),
                traç: getComputedStyle(svg.querySelector('circle.pict-destac')).stroke,
                destacats: svg.querySelectorAll('.pict-destac').length,
            };
        });
        ok(
            moneda.w >= 16 &&
                moneda.h >= 16 &&
                moneda.destacats === 1 &&
                !['none', 'rgb(0, 0, 0)'].includes(moneda.disc) &&
                moneda.anell === 'none' &&
                moneda.euro === 'none' &&
                moneda.traç !== 'none',
            `la moneda de «canvi»: ${Math.round(moneda.w)} px, disc ${moneda.disc}, anell i «€» sense farcit, vora ${moneda.traç}`
        );
        ok(page.errors.length === 0, `sense errors JS (${unics(page.errors) || 'cap'})`);
        ok(
            page.fallades.length === 0 && page.externes.length === 0,
            'cap petició fallida ni externa (les imatges són dins de la pàgina)',
            unics(page.fallades.concat(page.externes))
        );

        // Alt contrast del sistema: els pictogrames passen als colors del sistema i el destacat es continua distingint
        await page.emulateMedia({ forcedColors: 'active' });
        const forts = await page.evaluate(() => {
            const fill = s => getComputedStyle(document.querySelector(`#prova-paraules ${s}`)).fill;
            return { destac: fill('.pict-destac'), fons: fill('.pict-fons') };
        });
        ok(
            forts.destac !== forts.fons && forts.destac !== 'rgb(245, 158, 11)',
            `alt contrast: destacat ${forts.destac}, fons ${forts.fons} (colors del sistema)`
        );
        await page.context().close();
    }

    suite('Sessions fixes (?fixed=A/B/C): tota la classe fa les mateixes preguntes');
    {
        // Juga a-enters del principi al final (canviant de sessió si cal) i torna les operacions que ha vist.
        const juga = async (cerca, { errors = 0, ajuda = false, reinici = false } = {}) => {
            const page = await obre(browser, base, `a-enters.html${cerca}`);
            const vistes = [];
            const estatInicial = await page.evaluate(() => ({
                url: location.search,
                badge: (document.getElementById('badge-sessio-fixa') || {}).textContent ?? null,
                fixed: window.__estatProves().fixed,
            }));
            for (let pas = 0; pas < 400; pas++) {
                // Una sola lectura de l'estat per decidir què fer (així no hi ha curses entre pantalles)
                const st = await page.evaluate(() => ({
                    final: getComputedStyle(document.getElementById('final-screen')).display !== 'none',
                    sessio: getComputedStyle(document.getElementById('session-end-screen')).display !== 'none',
                    joc: getComputedStyle(document.getElementById('game-screen')).display !== 'none',
                    ...window.__estatProves(),
                }));
                if (st.final) break;
                if (st.sessio) {
                    await page.waitForTimeout(90);
                    await page.evaluate(() => window.startNextSession());
                    await page.waitForTimeout(60);
                    continue;
                }
                if (!st.joc || st.ocupat) {
                    await page.waitForTimeout(20);
                    continue;
                }
                vistes.push(`${st.operacio.a} ${st.operacio.op} ${st.operacio.b}`);
                if (ajuda) await page.click('.btn-ajuda');
                for (let k = 0; k < errors; k++) await responLliure(page, 'int', false);
                await responLliure(page, 'int', true);
                await page.waitForTimeout(25);
            }
            let alTornar = null;
            if (reinici) {
                // «Torna a jugar» recarrega la pàgina: la sessió fixa torna a començar amb les mateixes preguntes
                await Promise.all([
                    page.waitForNavigation({ timeout: 4000 }),
                    page.click('#final-screen button:nth-child(2)'),
                ]);
                await page.waitForTimeout(250);
                alTornar = (await estat(page)).operacio;
            }
            const errorsJs = page.errors.slice();
            await page.context().close();
            return { vistes, ...estatInicial, alTornar, errors: errorsJs };
        };

        const net = await juga('?fixed=A', { reinici: true });
        ok(net.vistes.length === 5, `?fixed=A porta 5 preguntes per defecte: ${net.vistes.join(' | ')}`);
        ok(
            net.url === '?fixed=A&totaloperations=5&totalsessions=1' &&
                net.fixed === 'A' &&
                net.badge === 'Sessió fixa A',
            `paràmetres afegits a la URL (${net.url}), sessió A i distintiu «${net.badge}»`
        );
        ok(
            net.alTornar && `${net.alTornar.a} ${net.alTornar.op} ${net.alTornar.b}` === net.vistes[0],
            '«Torna a jugar» repeteix la mateixa sessió fixa (la primera pregunta és la mateixa)'
        );
        const complicat = await juga('?fixed=A', { errors: 2, ajuda: true });
        ok(
            complicat.vistes.join('|') === net.vistes.join('|'),
            `un alumne que s'equivoca dues vegades i demana ajuda veu les mateixes 5 preguntes que els altres`
        );
        const b = await juga('?fixed=B');
        ok(
            b.vistes.join('|') !== net.vistes.join('|') && b.fixed === 'B' && b.badge === 'Sessió fixa B',
            `la sessió B és una altra: ${b.vistes.join(' | ')}`
        );
        const minuscula = await juga('?fixed=a');
        ok(minuscula.vistes.join('|') === net.vistes.join('|') && minuscula.fixed === 'A', '?fixed=a és la sessió A');
        const tres = await juga('?fixed=A&totaloperations=3');
        ok(
            tres.vistes.length === 3 &&
                tres.vistes.join('|') === net.vistes.slice(0, 3).join('|') &&
                /totaloperations=3/.test(tres.url),
            'amb ?totaloperations=3 es respecta, i són les 3 primeres preguntes de la sessió A'
        );
        const dues = await juga('?fixed=C&totalsessions=2&totaloperations=2');
        const duesAltra = await juga('?fixed=C&totalsessions=2&totaloperations=2', { errors: 1 });
        ok(
            dues.vistes.length === 4 &&
                new Set(dues.vistes).size >= 3 &&
                dues.vistes.join('|') === duesAltra.vistes.join('|'),
            `dues sessions de 2 preguntes: 4 preguntes, iguals per a tothom (${dues.vistes.join(' | ')})`
        );
        const ignorada = await juga('?fixed=Z&totaloperations=3');
        ok(
            ignorada.fixed === null &&
                ignorada.badge === null &&
                ignorada.url === '?fixed=Z&totaloperations=3' &&
                ignorada.vistes.length === 3,
            '?fixed=Z no és cap sessió fixa: res de distintiu ni de paràmetres afegits'
        );
        ok(
            [net, complicat, b, minuscula, tres, dues, duesAltra, ignorada].every(r => r.errors.length === 0),
            'sense errors JS'
        );
    }

    suite('Enllaços ja repartits amb el paràmetre antic ?maxenllocmitjana=0');
    {
        const page = await obre(browser, base, 'a-enters.html?totaloperations=2&maxenllocmitjana=0');
        const r = await page.evaluate(() => ({
            preguntes: window.__estatProves().preguntes,
            joc: getComputedStyle(document.getElementById('game-screen')).display,
        }));
        ok(r.preguntes === 2 && r.joc !== 'none' && page.errors.length === 0, "es tolera i s'ignora");
        await page.context().close();
    }
};
