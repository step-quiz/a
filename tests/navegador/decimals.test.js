/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/navegador/decimals.test.js
 * ROL: «Diners i canvi» (a-decimals, PR 8b) al navegador, amb el motor nou:
 *      la botiga (productes, preus, bitllet) i cada nivell tal com es veu;
 *      la resposta (coma o punt, parts bones i dolentes, resposta no vàlida,
 *      intents esgotats); els dos passos del nivell 3; l'ajuda amb símbols;
 *      les paraules (un toc n'obre la targeta); el teclat tàctil amb la coma;
 *      el botó «Nivell següent»; les sessions fixes; i l'accessibilitat dels
 *      estats propis (el nivell 3 i les parts de la resposta).
 *      La lògica pura (imports, compres, comparació) té els seus tests a
 *      tests/a-decimals.test.js; aquí es comprova que la PANTALLA diu el que
 *      el joc té per dins i que tot funciona amb un ratolí, un teclat i un dit.
 * ============================================================================
 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { ROOT, suite, ok } = require('../harness');
const { obre, estat, esperaLliure, responLliure, carregaAxe, text, unics } = require('./helpers');

const carrega = fitxer => import(pathToFileURL(path.join(ROOT, fitxer)).href);

/** Un import en cèntims com s'escriu a la pantalla: «5 €», «3,90 €». */
const imp = c => (c % 100 === 0 ? `${c / 100} €` : `${Math.floor(c / 100)},${String(c % 100).padStart(2, '0')} €`);
/** Els euros i els cèntims d'un import: 390 → ['3', '90']. */
const parts = c => [String(Math.floor(c / 100)), String(c % 100).padStart(2, '0')];

/** La botiga i el pas tal com es veuen (i només el que es veu). */
const pantalla = page =>
    page.evaluate(() => {
        const cents = t => {
            const m = t.trim().match(/^(\d+)(?:,(\d\d))? €$/);
            return m ? Number(m[1]) * 100 + Number(m[2] || 0) : null;
        };
        const bitllet = document.querySelector('#shop-display .bill-display');
        const pas = document.querySelector('#step-prompt .paraula');
        return {
            productes: [...document.querySelectorAll('#shop-display .product-card')].map(c => ({
                id: c.querySelector('.paraula').dataset.paraula,
                nom: c.querySelector('.paraula-text').textContent,
                preu: cents(c.querySelector('.product-price').textContent),
                textPreu: c.querySelector('.product-price').textContent,
            })),
            mes: document.querySelectorAll('#shop-display .products-plus').length,
            bitllet: bitllet ? cents(bitllet.querySelector('.bill-amount').textContent) : null,
            paraulaBitllet: bitllet ? bitllet.querySelector('.paraula').dataset.paraula : null,
            pas: pas ? pas.dataset.paraula : null,
            textPas: pas ? pas.textContent.trim() : null,
            fets: [...document.querySelectorAll('#steps-done .step-done')].map(
                d => `${d.querySelector('.paraula-text').textContent} ${d.querySelector('.step-done-val').textContent}`
            ),
            fetsMarcats: [...document.querySelectorAll('#steps-done .step-done')].every(
                d =>
                    !!d.firstElementChild &&
                    d.firstElementChild.textContent === '✅' &&
                    d.firstElementChild.getAttribute('aria-hidden') === 'true'
            ),
            capcalera: {
                sessio: document.getElementById('session-display').textContent,
                compra: document.getElementById('lvl-display').textContent,
                nivell: document.getElementById('nivell-display').textContent,
                punts: document.getElementById('score-display').textContent,
                intents: document.getElementById('attempts-display').textContent,
            },
            tocables: [...document.querySelectorAll('#shop-display .paraula, #step-prompt .paraula')].every(
                p => p.getAttribute('role') === 'button' && p.getAttribute('tabindex') === '0' && !!p.dataset.paraula
            ),
        };
    });

/** Les parts de la resposta equivocada (els euros i els cèntims, amb ✔ o ✖). */
const partsMostrades = page =>
    page.evaluate(() =>
        [...document.querySelectorAll('#part-feedback .part')].map(p => ({
            estat: p.classList.contains('bo') ? 'bo' : p.classList.contains('mal') ? 'mal' : '?',
            text: p.textContent.replace(/\s+/g, ' ').trim(),
            etiqueta: p.getAttribute('aria-label'),
            rol: p.getAttribute('role'),
            color: getComputedStyle(p).color,
        }))
    );

/** Escriu al camp i envia amb Intro (com ho fa l'alumne amb un teclat). */
async function envia(page, valor) {
    await esperaLliure(page);
    await page.fill('#value-input', valor);
    await page.keyboard.press('Enter');
}

/** Tecleja amb el teclat de la pantalla (tàctil). */
async function tecleja(page, valor) {
    for (const c of valor) await page.locator(`#customKeyboard .kb-btn[data-key="${c}"]`).tap();
}

const intents = page => page.evaluate(() => document.getElementById('attempts-display').textContent.trim());

module.exports = async function ({ browser, base }) {
    const { ambArticle, entrada } = await carrega('js/lexicon/lexicon.js');
    const emoji = id => entrada(id).imatge.emoji;
    /** El que ha d'escriure l'ajuda d'un pas, amb símbols («💶 5 € − 🥐 3,90 € = ?»). */
    const ajudaEsperada = (compra, pas) =>
        pas === 'total'
            ? `${compra.productes.map(p => `${emoji(p.id)} ${imp(p.preu)}`).join(' + ')} = ?`
            : `${emoji('bitllet')} ${imp(compra.bitllet)} − ${emoji(compra.productes.length === 1 ? compra.productes[0].id : 'total')} ${imp(compra.total)} = ?`;

    // ── La botiga i els nivells ──────────────────────────────────────────────
    for (const nivell of [1, 2, 3]) {
        const preguntes = nivell === 2 ? 30 : 12;
        suite(`Nivell ${nivell}: la pantalla mostra la compra que té el joc (${preguntes} compres)`);
        const page = await obre(
            browser,
            base,
            `a-decimals.html?nivell=${nivell}&totaloperations=${preguntes}&maxintents=4`
        );
        const vistes = [];
        for (let q = 0; q < preguntes; q++) {
            await esperaLliure(page);
            const e = await estat(page);
            const p = await pantalla(page);
            const v = { q, e, p, segon: null };
            for (let pas = 0; pas < e.compra.passos.length; pas++) {
                await responLliure(page, 'money', true);
                if (pas === 0 && e.compra.passos.length === 2)
                    v.segon = { e: await estat(page), p: await pantalla(page) };
            }
            vistes.push(v);
        }
        const compres = vistes.map(v => v.e.compra);
        const modelPantalla = v =>
            v.p.productes.length === v.e.compra.productes.length &&
            v.p.productes.every(
                (x, i) =>
                    x.id === v.e.compra.productes[i].id &&
                    x.preu === v.e.compra.productes[i].preu &&
                    x.nom === ambArticle(x.id, { plural: v.e.compra.productes[i].plural }) &&
                    x.textPreu === imp(v.e.compra.productes[i].preu)
            ) &&
            v.p.mes === v.e.compra.productes.length - 1 &&
            v.p.pas === v.e.pas &&
            Math.round(v.e.resposta * 100) === (v.e.pas === 'total' ? v.e.compra.total : v.e.compra.canvi);
        ok(
            vistes.every(v => modelPantalla(v)),
            `${preguntes} compres: cada producte amb el seu nom (amb article) i el seu preu, i la resposta que toca`
        );
        ok(
            vistes.every(v => v.p.tocables),
            'els productes, el bitllet i la paraula del pas són paraules tocables (role=button, tabindex=0)'
        );
        ok(
            vistes.every(v => v.p.capcalera.compra === `Compra ${v.q + 1} de ${preguntes}`) &&
                vistes.every(v => v.p.capcalera.nivell === `· Nivell ${nivell}`) &&
                vistes.every(v => v.p.capcalera.punts === `Punts: ${10 * v.q}`) &&
                vistes.every(v => v.p.capcalera.intents === 'Intents: 4') &&
                vistes.every(v => v.p.capcalera.sessio === 'Sessió 1 de 1'),
            `capçalera: «${vistes[3].p.capcalera.compra}», «· Nivell ${nivell}», «${vistes[3].p.capcalera.punts}», «Intents: 4»`
        );
        if (nivell === 1) {
            ok(
                compres.every(
                    c =>
                        c.productes.length === 1 &&
                        c.bitllet === 500 &&
                        [10, 20, 50].includes(c.productes[0].preu % 100) &&
                        c.productes[0].preu >= 110 &&
                        c.productes[0].preu <= 450 &&
                        c.passos.join() === 'canvi'
                ) && vistes.every(v => v.p.bitllet === 500 && v.p.paraulaBitllet === 'bitllet' && v.p.pas === 'canvi'),
                'sempre un producte de preu enter + 0,10, 0,20 o 0,50, es paga amb 5 € i només es demana el canvi'
            );
        } else if (nivell === 2) {
            ok(
                compres.every(
                    c =>
                        c.productes.length === 1 &&
                        c.productes[0].preu % 10 === 0 &&
                        c.productes[0].preu <= 490 &&
                        (c.bitllet === 1000 || (c.bitllet === 500 && c.productes[0].preu <= 450)) &&
                        c.passos.join() === 'canvi'
                ),
                'un producte amb preu en passos de 0,10 € (fins a 4,90 €) i bitllet de 5 € o de 10 €'
            );
            const deu = compres.filter(c => c.bitllet === 1000).length;
            ok(
                deu >= 1 && deu < preguntes,
                `el bitllet de 10 € surt de tant en tant (${deu} de ${preguntes} compres) i el de 5 € també`
            );
            ok(
                vistes.every(v => v.p.bitllet === v.e.compra.bitllet),
                'el bitllet de la pantalla és el de la compra («5 €» o «10 €»)'
            );
        } else {
            ok(
                compres.every(
                    c =>
                        c.productes.length === 2 &&
                        c.productes[0].id !== c.productes[1].id &&
                        c.productes.every(p => p.preu >= 110 && p.preu <= 400 && p.preu % 10 === 0) &&
                        c.bitllet === 1000 &&
                        c.total === c.productes[0].preu + c.productes[1].preu &&
                        c.passos.join() === 'total,canvi'
                ),
                'dos productes diferents (1,10–4,00 €), bitllet de 10 € i dos passos: total i canvi'
            );
            ok(
                vistes.every(
                    v => v.p.pas === 'total' && v.p.bitllet === null && v.p.mes === 1 && v.p.fets.length === 0
                ),
                'al primer pas es demana el «total»: el bitllet encara no es veu i hi ha un «+» entre els productes'
            );
            ok(
                vistes.every(
                    v =>
                        v.segon.p.pas === 'canvi' &&
                        v.segon.p.bitllet === 1000 &&
                        v.segon.p.fets.length === 1 &&
                        v.segon.p.fetsMarcats &&
                        v.segon.p.fets[0] === `total ${imp(v.e.compra.total)}`
                ),
                `al segon pas apareix el bitllet i el total ja fet («${vistes[0].segon.p.fets[0]}»); ara es demana el «canvi»`
            );
        }
        ok(page.errors.length === 0, `sense errors JS (${unics(page.errors) || 'cap'})`);
        ok(page.fallades.length === 0 && page.externes.length === 0, 'cap petició fallida ni externa');
        await page.context().close();
    }

    // ── La resposta ──────────────────────────────────────────────────────────
    suite('La resposta: coma o punt, parts bones i dolentes, resposta no vàlida');
    {
        const page = await obre(browser, base, 'a-decimals.html?nivell=1&fixed=A&totaloperations=4&maxintents=8');
        await esperaLliure(page);
        const e0 = await estat(page);
        const [E, C] = parts(e0.compra.canvi); // p. ex. canvi 3,90 → '3', '90'
        const euros = Number(E);
        const buit = async () => (await page.inputValue('#value-input')) === '';
        const enfocat = () => page.evaluate(() => document.activeElement.id === 'value-input');

        await envia(page, `${E},06`);
        await esperaLliure(page);
        let m = await partsMostrades(page);
        ok(
            m.length === 2 &&
                m[0].estat === 'bo' &&
                m[0].text === `${E} ✔` &&
                m[1].estat === 'mal' &&
                m[1].text === ',06 ✖',
            `«${E},06»: els euros són bons i els cèntims no → ${m.map(x => x.text).join(' ')}`
        );
        ok(
            m[0]?.color === 'rgb(22, 101, 52)' && m[1]?.color === 'rgb(185, 28, 28)',
            `la part bona és verda (${m[0]?.color}) i la dolenta vermella (${m[1]?.color}); a més de ✔ i ✖, perquè no depengui només del color`
        );
        ok(
            m[0]?.etiqueta === `${E}: correcte` &&
                m[1]?.etiqueta === ',06: incorrecte' &&
                m.every(x => x.rol === 'img'),
            `cada part té el seu nom per als lectors de pantalla: «${m[0]?.etiqueta}», «${m[1]?.etiqueta}»`
        );
        ok((await intents(page)) === 'Intents: 7', 'cada resposta equivocada gasta un intent («Intents: 7»)');
        ok((await buit()) && (await enfocat()), 'el camp es buida i conserva el focus per tornar-ho a provar');

        await envia(page, `${euros + 1},${C}`);
        await esperaLliure(page);
        m = await partsMostrades(page);
        ok(
            m.length === 2 &&
                m[0].estat === 'mal' &&
                m[0].text === `${euros + 1} ✖` &&
                m[1].estat === 'bo' &&
                m[1].text === `,${C} ✔`,
            `«${euros + 1},${C}»: els euros no són bons i els cèntims sí → ${m.map(x => x.text).join(' ')}`
        );

        await envia(page, E);
        await esperaLliure(page);
        m = await partsMostrades(page);
        ok(
            m.length === 2 &&
                m[0].estat === 'bo' &&
                m[0].text === `${E} ✔` &&
                m[1].estat === 'mal' &&
                m[1].text === ',00 ✖',
            `«${E}» (sense cèntims): euros ✔ i «,00» ✖ → ${m.map(x => x.text).join(' ')}`
        );

        await envia(page, `${euros + 1},06`);
        await esperaLliure(page);
        m = await partsMostrades(page);
        ok(
            m.length === 2 && m.every(x => x.estat === 'mal'),
            `«${euros + 1},06»: cap de les dues parts → ${m.map(x => x.text).join(' ')}`
        );

        await envia(page, `${E}.06`);
        await esperaLliure(page);
        m = await partsMostrades(page);
        ok(
            m.map(x => x.text).join(' ') === `${E} ✔ ,06 ✖`,
            `amb punt, les parts es mostren amb coma («${E}.06» → ${m.map(x => x.text).join(' ')})`
        );

        await envia(page, `${E},${C}5`);
        await esperaLliure(page);
        m = await partsMostrades(page);
        ok(
            m.length === 2 && m[1].estat === 'mal' && m[1].text === `,${C}5 ✖`,
            `«${E},${C}5» (tres decimals): els cèntims no són bons i es veuen tal com s'han escrit → ${m.map(x => x.text).join(' ')}`
        );

        const h = (await estat(page)).sessionHistory;
        ok(
            h.length === 6 && h.every(x => x.isCorrect === false) && h[0]?.answer === `${E},06`,
            `les 6 respostes equivocades són a la revisió («${h[0]?.answer}», «${h[1]?.answer}»…)`
        );
        ok(page.errors.length === 0, `sense errors JS (${unics(page.errors) || 'cap'})`);
        await page.context().close();

        // Una resposta que no és un import no es compara amb res: només gasta un intent
        const q = await obre(browser, base, 'a-decimals.html?nivell=1&fixed=A&totaloperations=4&maxintents=8');
        await esperaLliure(q);
        await envia(q, `${E},06`); // perquè hi hagi parts a la pantalla
        await esperaLliure(q);
        ok((await partsMostrades(q)).length === 2, 'abans: hi ha les parts de la resposta equivocada');
        for (const rar of ['abc', `${E},,${C}`, `,${C}`, `${E},`]) {
            await envia(q, rar);
            await esperaLliure(q);
        }
        const e1 = await estat(q);
        ok(
            e1.sessionHistory.length === 1 && (await partsMostrades(q)).length === 0,
            `«abc», «${E},,${C}», «,${C}» i «${E},» no es comparen: no surten a la revisió i les parts desapareixen`
        );
        ok(e1.attemptsLeft === 3, `però cada una gasta un intent com qualsevol error (en queden ${e1.attemptsLeft})`);
        ok(q.errors.length === 0, `sense errors JS (${unics(q.errors) || 'cap'})`);
        await q.context().close();
    }

    suite('La resposta correcta: la coma, el punt, més decimals i el «€» s’accepten; es mostra amb coma');
    {
        // Es congela el que ve després de l'encert per poder-ne veure el resultat (el missatge «Molt bé!»)
        for (const [nom, escriu] of [
            ['amb coma', (E, C) => `${E},${C}`],
            ['amb punt', (E, C) => `${E}.${C}`],
            ['amb tres decimals', (E, C) => `${E},${C}0`],
            ['amb el «€» darrere', (E, C) => `${E},${C} €`],
        ]) {
            const page = await obre(browser, base, 'a-decimals.html?nivell=1&fixed=A&totaloperations=3&maxintents=4', {
                congela: 1000,
            });
            await esperaLliure(page);
            const e0 = await estat(page);
            const [E, C] = parts(e0.compra.canvi);
            await envia(page, escriu(E, C));
            await page.waitForTimeout(150);
            const e = await estat(page);
            const valor = await page.inputValue('#value-input');
            const feedback = await page.evaluate(() => document.getElementById('mini-victory-overlay').innerText);
            ok(
                e.sessionScore === 10 &&
                    e.attemptsLeft === 4 &&
                    e.sessionHistory.length === 1 &&
                    e.sessionHistory[0].isCorrect &&
                    /Molt bé/.test(feedback),
                `${nom}: «${escriu(E, C)}» és correcte (10 punts, cap intent gastat, «${text(feedback)}»)`
            );
            ok(
                valor === `${E},${C}`.replace(/,00$/, ''),
                `${nom}: el camp es queda amb la coma i dos decimals («${valor}»)`
            );
            await page.context().close();
        }
    }

    suite('Intents esgotats: la resposta correcta surt dins del camp, en verd');
    {
        const page = await obre(browser, base, 'a-decimals.html?nivell=1&fixed=A&totaloperations=3&maxintents=2', {
            congela: 2000,
        });
        await esperaLliure(page);
        const e0 = await estat(page);
        const [E, C] = parts(e0.compra.canvi);
        await envia(page, `${E},06`);
        await esperaLliure(page);
        await envia(page, `${Number(E) + 1},06`);
        await page.waitForFunction(() => document.getElementById('value-input').classList.contains('reveal'), null, {
            timeout: 3000,
        });
        await page.waitForTimeout(400); // el camp passa al verd amb una transició de 0,2 s
        const r = await page.evaluate(() => {
            const i = document.getElementById('value-input');
            const c = getComputedStyle(i);
            return {
                valor: i.value,
                fons: c.backgroundColor,
                color: c.color,
                vora: c.borderTopColor,
                intents: document.getElementById('attempts-display').textContent,
                parts: document.querySelectorAll('#part-feedback .part').length,
            };
        });
        ok(r.valor === `${E},${C}`, `la resposta correcta surt dins del camp: «${r.valor}»`);
        ok(
            r.fons === 'rgb(220, 252, 231)' && r.color === 'rgb(22, 101, 52)' && r.vora === 'rgb(4, 120, 87)',
            `en verd (fons ${r.fons}, text ${r.color}, vora ${r.vora})`
        );
        ok(r.intents === 'Intents: 0' && r.parts === 0, `«${r.intents}» i ja no es veuen les parts de l'últim error`);
        ok((await estat(page)).ocupat, 'mentre es veu la resposta, el joc no admet res més');
        await page.context().close();

        // Sense congelar: després de la resposta surt «Intents esgotats» i comença la compra següent amb el camp net
        const p2 = await obre(browser, base, 'a-decimals.html?nivell=1&fixed=A&totaloperations=3&maxintents=1');
        await esperaLliure(p2);
        await responLliure(p2, 'money', false);
        await p2.waitForFunction(() => /Compra 2 de 3/.test(document.getElementById('lvl-display').textContent), null, {
            timeout: 8000,
        });
        const s = await p2.evaluate(() => ({
            valor: document.getElementById('value-input').value,
            reveal: document.getElementById('value-input').classList.contains('reveal'),
            punts: window.__estatProves().sessionScore,
        }));
        ok(
            s.valor === '' && !s.reveal && s.punts === 0,
            `la compra següent comença amb el camp buit i sense el verd; 0 punts (valor «${s.valor}»)`
        );
        ok(p2.errors.length === 0, `sense errors JS (${unics(p2.errors) || 'cap'})`);
        await p2.context().close();
    }

    // ── Nivell 3: dos passos ─────────────────────────────────────────────────
    suite('Nivell 3: total i canvi; els intents i els punts són de tota la compra');
    {
        const page = await obre(browser, base, 'a-decimals.html?nivell=3&fixed=A&totaloperations=2&maxintents=4');
        await esperaLliure(page);
        const e0 = await estat(page);
        const c = e0.compra;
        ok(e0.pas === 'total' && Math.round(e0.resposta * 100) === c.total, `primer pas: el total (${imp(c.total)})`);
        await envia(page, `${parts(c.total)[0]},06`);
        await esperaLliure(page);
        ok((await intents(page)) === 'Intents: 3', 'un error al primer pas gasta un intent');
        await envia(page, `${parts(c.total)[0]},${parts(c.total)[1]}`);
        await esperaLliure(page);
        const e1 = await estat(page);
        const p1 = await pantalla(page);
        ok(
            e1.pas === 'canvi' &&
                Math.round(e1.resposta * 100) === c.canvi &&
                p1.bitllet === 1000 &&
                p1.fets.join() === `total ${imp(c.total)}` &&
                e1.attemptsLeft === 3 &&
                e1.currentOperation === 0,
            `segon pas: el canvi (${imp(c.canvi)}); el total queda fet, surt el bitllet i els intents continuen (${e1.attemptsLeft})`
        );
        ok((await page.inputValue('#value-input')) === '', 'el camp comença buit al segon pas');
        await envia(page, `${parts(c.canvi)[0]},06`);
        await esperaLliure(page);
        ok((await intents(page)) === 'Intents: 2', 'un error al segon pas gasta un intent del mateix compte');
        await envia(page, `${parts(c.canvi)[0]}.${parts(c.canvi)[1]}`);
        await page.waitForFunction(
            () => /Compra 2 de 2/.test(document.getElementById('lvl-display').textContent),
            null,
            {
                timeout: 8000,
            }
        );
        const e2 = await estat(page);
        ok(e2.sessionScore === 6, `la compra val 10 − 2 × 2 = 6 punts (en té ${e2.sessionScore})`);
        const p2 = await pantalla(page);
        ok(
            p2.fets.length === 0 && p2.pas === 'total' && p2.bitllet === null && p2.capcalera.intents === 'Intents: 4',
            'la compra següent torna a començar pel total, sense el bitllet i amb tots els intents'
        );
        const h = e2.sessionHistory.map(x => `${x.isCorrect ? '✔' : '✖'} ${x.question} → ${x.answer}`);
        ok(
            h.length === 4 &&
                h[0].startsWith('✖ ') &&
                h[1].startsWith('✔ ') &&
                h[2].startsWith('✖ ') &&
                h[3].startsWith('✔ ') &&
                e2.sessionHistory[0].question === c.productes.map(p => `${emoji(p.id)} ${imp(p.preu)}`).join(' + ') &&
                e2.sessionHistory[2].question ===
                    `${emoji('bitllet')} ${imp(c.bitllet)} − ${emoji('total')} ${imp(c.total)}`,
            `la revisió té una fila per resposta, amb l'operació en símbols: ${JSON.stringify(h.slice(0, 4))}`
        );
        ok(page.errors.length === 0, `sense errors JS (${unics(page.errors) || 'cap'})`);
        await page.context().close();
    }

    // ── L'ajuda ──────────────────────────────────────────────────────────────
    suite("L'ajuda 💡: només símbols (l'operació), sense la resposta, sense gastar intents");
    {
        const page = await obre(browser, base, 'a-decimals.html?nivell=3&fixed=A&totaloperations=2&maxintents=4');
        await esperaLliure(page);
        let e = await estat(page);
        const vist = () =>
            page.evaluate(() => {
                const h = document.getElementById('help-text');
                return {
                    visible: getComputedStyle(h).display !== 'none',
                    text: h.innerText.replace(/\s+/g, ' ').trim(),
                };
            });
        ok(!(await vist()).visible, "l'ajuda és tancada de bon començament");
        await page.click('.btn-ajuda');
        let a = await vist();
        ok(
            a.visible && a.text === ajudaEsperada(e.compra, 'total'),
            `pas «total»: «${a.text}» (esperat «${ajudaEsperada(e.compra, 'total')}»)`
        );
        await page.click('.btn-ajuda');
        ok(!(await vist()).visible, 'un segon toc la tanca');
        await page.click('.btn-ajuda');
        await envia(page, `${parts(e.compra.total)[0]},${parts(e.compra.total)[1]}`);
        await esperaLliure(page);
        ok(!(await vist()).visible, "en passar al pas següent l'ajuda es tanca");
        e = await estat(page);
        await page.click('.btn-ajuda');
        a = await vist();
        ok(
            a.visible && a.text === ajudaEsperada(e.compra, 'canvi') && !a.text.includes(imp(e.compra.canvi)),
            `pas «canvi»: «${a.text}», sense el canvi resolt`
        );
        ok(
            (await estat(page)).attemptsLeft === 4 && (await estat(page)).sessionScore === 0,
            "demanar l'ajuda no gasta intents ni punts"
        );
        const l = await page.evaluate(() => document.getElementById('help-text').getAttribute('aria-live'));
        ok(l === 'polite', "l'ajuda és una regió aria-live=polite");
        await page.context().close();

        // Una sola compra: el bitllet menys el producte
        const p1 = await obre(browser, base, 'a-decimals.html?nivell=1&fixed=A&totaloperations=2&maxintents=4');
        await esperaLliure(p1);
        const e1 = await estat(p1);
        await p1.click('.btn-ajuda');
        const t = (await p1.evaluate(() => document.getElementById('help-text').innerText)).replace(/\s+/g, ' ').trim();
        ok(
            t === ajudaEsperada(e1.compra, 'canvi') &&
                t.startsWith(`${emoji('bitllet')} 5 € − ${emoji(e1.compra.productes[0].id)} `),
            `nivell 1: «${t}»`
        );
        await p1.context().close();
    }

    // ── Les paraules ─────────────────────────────────────────────────────────
    suite('Les paraules de la botiga: un toc obre la targeta «Aprèn la paraula»');
    {
        const page = await obre(browser, base, 'a-decimals.html?nivell=1&fixed=A&totaloperations=3&maxintents=4');
        await esperaLliure(page);
        const e = await estat(page);
        const idProducte = e.compra.productes[0].id;
        const nova = id =>
            page.evaluate(
                i => document.querySelector(`.paraula[data-paraula="${i}"]`).classList.contains('paraula-nova'),
                id
            );
        ok(
            (await nova(idProducte)) && (await nova('bitllet')) && (await nova('canvi')),
            `les tres paraules de la pantalla (${idProducte}, bitllet, canvi) porten el distintiu «paraula nova»`
        );
        const targeta = () =>
            page.evaluate(() => {
                const d = document.querySelector('dialog.targeta-paraula');
                const svg = d.querySelector('.targeta-img svg');
                const pl = d.querySelector('.targeta-plural');
                return {
                    oberta: d.open,
                    nom: d.querySelector('.targeta-nom').textContent,
                    plural: pl.hidden ? '' : pl.textContent,
                    svg: svg ? Math.round(svg.getBoundingClientRect().width) : 0,
                    emoji: svg ? '' : d.querySelector('.targeta-img').textContent,
                };
            });
        await page.fill('#value-input', '3,9');
        await page.click(`.product-card .paraula[data-paraula="${idProducte}"]`);
        let t = await targeta();
        ok(
            t.oberta &&
                t.nom === ambArticle(idProducte) &&
                t.plural === ambArticle(idProducte, { plural: true }) &&
                t.emoji === emoji(idProducte),
            `el producte: «${t.nom}», «${t.plural}» i ${t.emoji} gran`
        );
        await page.click('.targeta-ok');
        ok(
            !(await nova(idProducte)) && (await nova('bitllet')) && (await nova('canvi')),
            'en mirar-la, només aquesta paraula perd el distintiu'
        );
        await page
            .waitForFunction(() => document.activeElement.id === 'value-input', null, { timeout: 2000 })
            .catch(() => {});
        ok(
            (await page.evaluate(() => document.activeElement.id)) === 'value-input' &&
                (await page.inputValue('#value-input')) === '3,9' &&
                (await estat(page)).attemptsLeft === 4,
            'en tancar-la, el focus torna al camp, la resposta escrita hi és i no s’ha gastat cap intent'
        );
        await page.click('#step-prompt .paraula');
        t = await targeta();
        ok(
            t.oberta && t.nom === 'el canvi' && t.plural === 'els canvis' && t.svg >= 100,
            `«canvi»: «${t.nom}», «${t.plural}» i la moneda gran (${t.svg} px)`
        );
        await page.keyboard.press('Escape');
        await page.click('.bill-display .paraula');
        t = await targeta();
        ok(
            t.oberta && t.nom === 'el bitllet' && t.plural === 'els bitllets' && t.emoji === '💶',
            `el bitllet: «${t.nom}», «${t.plural}» i ${t.emoji}`
        );
        await page.keyboard.press('Escape');
        // La targeta es tanca amb una tasca asíncrona: s'espera que sigui tancada abans de tocar res més
        await page.waitForFunction(() => !document.querySelector('dialog.targeta-paraula').open);
        // En tancar-se, la targeta torna el focus al camp amb una altra tasca asíncrona: s'espera, perquè no ens el prengui
        // just després de posar-lo a la paraula
        await page.waitForFunction(() => document.activeElement && document.activeElement.id === 'value-input');

        // Teclat: el focus a una paraula i Intro; l'Intro no ha d'enviar la resposta escrita
        await page.fill('#value-input', '99');
        await page.evaluate(() => document.querySelector('.product-card .paraula').focus());
        const enPindola = await page.evaluate(() => document.activeElement.classList.contains('paraula'));
        await page.keyboard.press('Enter');
        // La targeta s'obre amb una tasca asíncrona: s'espera que sigui oberta abans de mirar-ho
        const oberta = await page
            .waitForFunction(() => document.querySelector('dialog.targeta-paraula').open, null, { timeout: 3000 })
            .then(() => true)
            .catch(() => false);
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !document.querySelector('dialog.targeta-paraula').open);
        const e2 = await estat(page);
        ok(
            enPindola && oberta && e2.attemptsLeft === 4 && e2.sessionHistory.length === 0,
            "Intro a una paraula n'obre la targeta i no envia la resposta escrita («99»): cap intent gastat"
        );
        ok(page.errors.length === 0, `sense errors JS (${unics(page.errors) || 'cap'})`);
        await page.context().close();
    }

    // ── Mòbil: el teclat amb la coma ─────────────────────────────────────────
    suite('Mòbil (360 × 700, tàctil): el teclat de la pantalla té la coma i la botiga es veu sencera');
    {
        const page = await obre(browser, base, 'a-decimals.html?nivell=1&fixed=A&totaloperations=3&maxintents=4', {
            mobil: true,
            congela: 1000,
        });
        await esperaLliure(page);
        const e0 = await estat(page);
        const [E, C] = parts(e0.compra.canvi);
        const k = await page.evaluate(() => {
            const kb = document.getElementById('customKeyboard');
            const coma = kb.querySelector('.kb-btn[data-key=","]');
            const i = document.getElementById('value-input');
            const r = (coma && coma.getBoundingClientRect()) || { width: 0, height: 0 };
            return {
                visible: getComputedStyle(kb).display !== 'none',
                coma: coma ? coma.textContent.trim() : null,
                menys: !!kb.querySelector('.kb-btn[data-key="-"]') || !!kb.querySelector('.kb-minus'),
                inputmode: i.getAttribute('inputmode'),
                nomesLectura: i.hasAttribute('readonly'),
                w: Math.round(r.width),
                h: Math.round(r.height),
                sw: document.documentElement.scrollWidth,
                iw: innerWidth,
            };
        });
        ok(
            k.visible && k.coma === ',' && !k.menys,
            `el teclat és visible i la tecla «,» pren el lloc del «−» («${k.coma}»)`
        );
        ok(
            k.inputmode === 'none' && k.nomesLectura,
            'el camp no obre el teclat del sistema (inputmode=none, només lectura)'
        );
        ok(k.w >= 44 && k.h >= 44, `la tecla «,» fa ${k.w} × ${k.h} px`);
        ok(k.sw <= k.iw, `la pàgina no desborda en horitzontal (${k.sw} ≤ ${k.iw})`);
        ok(
            (await pantalla(page)).tocables,
            'les paraules de la botiga i del pas són botons que es poden tocar (role=button)'
        );
        const altures = await page.evaluate(() =>
            [...document.querySelectorAll('#shop-display .paraula, #step-prompt .paraula')].map(p =>
                Math.round(p.getBoundingClientRect().height)
            )
        );
        ok(
            altures.every(h => h >= 44),
            `alçada de les paraules tocables: ${altures.join(', ')} px`
        );

        await tecleja(page, `${E},06`);
        ok((await page.inputValue('#value-input')) === `${E},06`, `tecleja «${E},06» amb les tecles de la pantalla`);
        await page.locator('#customKeyboard .kb-enter').tap();
        await page.waitForTimeout(150);
        const m = await partsMostrades(page);
        ok(
            m.map(x => x.text).join(' ') === `${E} ✔ ,06 ✖` &&
                (await page.evaluate(() => document.getElementById('value-input').classList.contains('kb-selected'))),
            `una resposta equivocada mostra les parts (${m.map(x => x.text).join(' ')}) i deixa el camp marcat per sobreescriure`
        );
        await tecleja(page, E);
        ok(
            (await page.inputValue('#value-input')) === E &&
                !(await page.evaluate(() => document.getElementById('value-input').classList.contains('kb-selected'))),
            'la primera tecla després de l’error esborra la resposta anterior'
        );
        await tecleja(page, `,${C}`);
        await page.locator('#customKeyboard .kb-enter').tap();
        await page.waitForTimeout(150);
        const f = await page.evaluate(() => {
            const o = document.getElementById('mini-victory-overlay');
            const r = o.getBoundingClientRect();
            const kb = document.getElementById('customKeyboard');
            return {
                visible: getComputedStyle(o).display !== 'none',
                dins: r.top >= 0 && r.bottom <= innerHeight,
                top: Math.round(r.top),
                bottom: Math.round(r.bottom),
                alt: innerHeight,
                teclat: getComputedStyle(kb).display !== 'none',
                text: o.innerText.replace(/\s+/g, ' ').trim(),
            };
        });
        ok(f.visible && /Molt bé/.test(f.text) && !f.teclat, `amb la resposta bona: «${f.text}» i el teclat s'amaga`);
        ok(f.dins, `el missatge es veu sencer en pantalla (de ${f.top} a ${f.bottom} px d'una finestra de ${f.alt})`);
        ok(page.errors.length === 0, `sense errors JS (${unics(page.errors) || 'cap'})`);
        await page.context().close();

        // Cap desbordament en 320, 360 i 390 px, també al nivell 3 amb les parts i l'ajuda a la vista
        for (const w of [320, 360, 390]) {
            const p = await obre(browser, base, 'a-decimals.html?nivell=3&fixed=B&totaloperations=3&maxintents=6', {
                mobil: true,
                w,
                congela: 1000,
            });
            await esperaLliure(p);
            const c = (await estat(p)).compra;
            await tecleja(p, `${parts(c.total)[0]},06`);
            await p.locator('#customKeyboard .kb-enter').tap();
            await p.waitForTimeout(100);
            await p.locator('.btn-ajuda').tap();
            await p.waitForTimeout(350);
            const r = await p.evaluate(() => ({
                sw: document.documentElement.scrollWidth,
                iw: innerWidth,
                parts: document.querySelectorAll('#part-feedback .part').length,
                ajuda: getComputedStyle(document.getElementById('help-text')).display !== 'none',
                fora: [...document.querySelectorAll('#game-screen *')].filter(el => {
                    const b = el.getBoundingClientRect();
                    return b.width > 0 && (b.left < -1 || b.right > innerWidth + 1) && !el.closest('dialog');
                }).length,
            }));
            ok(
                r.sw <= r.iw && r.parts === 2 && r.ajuda && r.fora === 0,
                `${w} px, nivell 3 amb les parts i l'ajuda: sense desbordament (${r.sw} ≤ ${r.iw}, ${r.fora} elements fora)`
            );
            await p.context().close();
        }
    }

    // ── Botons de la capçalera ───────────────────────────────────────────────
    suite('«Nivell següent ›» i «Tutorial»');
    {
        const mostra = page =>
            page.evaluate(() => {
                const b = document.getElementById('btn-next-level');
                return { visible: getComputedStyle(b).display !== 'none', text: b.textContent.trim() };
            });
        let page = await obre(browser, base, 'a-decimals.html?nivell=1&fixed=A&totaloperations=3&maxintents=5');
        await esperaLliure(page);
        let b = await mostra(page);
        ok(b.visible && b.text === 'Nivell 2 ›', `al nivell 1 el botó diu «${b.text}»`);
        await Promise.all([page.waitForNavigation({ timeout: 4000 }), page.click('#btn-next-level')]);
        await page.waitForTimeout(250);
        const u = new URL(page.url());
        ok(
            u.searchParams.get('nivell') === '2' &&
                u.searchParams.get('fixed') === 'A' &&
                u.searchParams.get('totaloperations') === '3' &&
                u.searchParams.get('maxintents') === '5',
            `puja al nivell 2 conservant els altres paràmetres (${u.search})`
        );
        b = await mostra(page);
        const cap = await page.evaluate(() => document.getElementById('nivell-display').textContent);
        ok(
            cap === '· Nivell 2' && b.visible && b.text === 'Nivell 3 ›',
            `ara és el nivell 2 («${cap}») i el botó diu «${b.text}»`
        );
        await Promise.all([page.waitForNavigation({ timeout: 4000 }), page.click('#btn-next-level')]);
        await page.waitForTimeout(250);
        b = await mostra(page);
        ok(!b.visible, 'al nivell 3 (el màxim) no hi ha cap botó per pujar');

        // El nivell no es pot baixar des de la pàgina i un valor fora de rang es corregeix
        const p2 = await obre(browser, base, 'a-decimals.html?nivell=9&totaloperations=2');
        const n = await p2.evaluate(() => document.getElementById('nivell-display').textContent);
        ok(n === '· Nivell 1', `?nivell=9 (fora de rang) torna al nivell per defecte («${n}»)`);
        await p2.context().close();

        // El tutorial
        const [nav] = await Promise.all([
            page.waitForNavigation({ timeout: 6000 }).catch(() => null),
            page.click('#btn-tutorial'),
        ]);
        await page.waitForTimeout(100);
        ok(
            !!nav && /a-decimals-tutorial\.html\?.*nivell=3/.test(page.url()),
            `«Tutorial» porta al tutorial conservant els paràmetres (${page.url().split('/').pop()})`
        );
        ok(page.errors.length === 0, `sense errors JS (${unics(page.errors) || 'cap'})`);
        await page.context().close();
    }

    // ── Sessions fixes ───────────────────────────────────────────────────────
    suite('Sessions fixes (?fixed=A/B/C): tota la classe fa les mateixes compres');
    {
        const juga = async (cerca, errors = []) => {
            const page = await obre(browser, base, `a-decimals.html?${cerca}`);
            const compres = [];
            const preguntes = Number(new URLSearchParams(cerca).get('totaloperations'));
            for (let q = 0; q < preguntes; q++) {
                await esperaLliure(page);
                const e = await estat(page);
                compres.push(e.compra.productes.map(p => `${p.id}:${p.preu}`).join('+') + `/${e.compra.bitllet}`);
                if (errors.includes(q)) {
                    await responLliure(page, 'money', false);
                    await page.click('.btn-ajuda');
                }
                for (let pas = 0; pas < e.compra.passos.length; pas++) await responLliure(page, 'money', true);
            }
            const badge = await page.evaluate(
                () => (document.getElementById('badge-sessio-fixa') || {}).textContent ?? null
            );
            const err = page.errors.slice();
            await page.context().close();
            return { compres, badge, err };
        };
        for (const nivell of [1, 2, 3]) {
            const A1 = await juga(`nivell=${nivell}&fixed=A&totaloperations=5&maxintents=4`);
            const A2 = await juga(`nivell=${nivell}&fixed=A&totaloperations=5&maxintents=4`, [0, 2, 3]);
            const B = await juga(`nivell=${nivell}&fixed=B&totaloperations=5&maxintents=4`);
            ok(
                JSON.stringify(A1.compres) === JSON.stringify(A2.compres),
                `nivell ${nivell}, sessió A: un alumne que s'equivoca i demana ajuda veu les mateixes 5 compres (${A1.compres.join(' | ')})`
            );
            ok(
                JSON.stringify(A1.compres) !== JSON.stringify(B.compres),
                `nivell ${nivell}: la sessió B és una altra (${B.compres.join(' | ')})`
            );
            ok(
                A1.badge === 'Sessió fixa A' &&
                    B.badge === 'Sessió fixa B' &&
                    A1.err.length + A2.err.length + B.err.length === 0,
                `distintiu «${A1.badge}» i sense errors JS`
            );
        }
    }

    // ── Accessibilitat dels estats propis ───────────────────────────────────
    suite('Accessibilitat (axe, WCAG 2.2 AA): el nivell 3 i les parts de la resposta');
    {
        const AxeBuilder = carregaAxe();
        if (!AxeBuilder) {
            ok(false, 'Falta @axe-core/playwright', 'Instal·la-ho amb: npm ci --prefix tools/proves');
        } else {
            const revisa = async (etiqueta, page) => {
                const vs = (
                    await new AxeBuilder({ page })
                        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
                        .analyze()
                ).violations;
                ok(
                    vs.length === 0,
                    etiqueta,
                    vs.flatMap(v => v.nodes.slice(0, 5).map(n => `${v.id}: ${n.target.join(' ')}`)).join('\n')
                );
            };
            const page = await obre(browser, base, 'a-decimals.html?nivell=3&fixed=A&totaloperations=3&maxintents=6', {
                reduit: true,
                congela: 1000,
            });
            await esperaLliure(page);
            await revisa('nivell 3, primer pas (el total, sense bitllet)', page);
            const c = (await estat(page)).compra;
            await envia(page, `${parts(c.total)[0]},06`);
            await esperaLliure(page);
            await page.click('.btn-ajuda');
            await page.waitForTimeout(150);
            await revisa('amb les parts de la resposta (✔ / ✖) i l’ajuda oberta', page);
            await envia(page, imp(c.total).replace(' €', ''));
            await esperaLliure(page);
            await revisa('nivell 3, segon pas (el total fet i el bitllet)', page);
            await page.context().close();

            const m = await obre(browser, base, 'a-decimals.html?nivell=2&fixed=A&totaloperations=3&maxintents=6', {
                mobil: true,
                reduit: true,
                congela: 1000,
            });
            await esperaLliure(m);
            const c2 = (await estat(m)).compra;
            await tecleja(m, `${parts(c2.canvi)[0]},06`);
            await m.locator('#customKeyboard .kb-enter').tap();
            await m.waitForTimeout(150);
            await revisa('mòbil: amb el teclat de la pantalla i les parts de la resposta', m);
            await m.context().close();
        }
    }
};
