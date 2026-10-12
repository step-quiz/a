/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/navegador/vocabulari.test.js
 * ROL: «Vocabulari» (a-vocabulari, PR 13a) al navegador, amb el motor nou:
 *      els tres nivells (imatge → paraula, paraula → imatge, imatge →
 *      escriure), les dues oportunitats, la paraula escrita lletra a lletra, la
 *      tolerància davant de les errades petites (no costen cap intent), que no
 *      es demani escriure cap solució llarga, la barra d'accents, ?tema= i
 *      ?vistes=1, la partida completa, el mòbil i les sessions fixes. La lògica
 *      pura té els seus tests a tests/activitats.test.js.
 * ============================================================================
 */
'use strict';
const { suite, ok } = require('../harness');
const { obre, estat, esperaLliure, unics } = require('./helpers');

const RUTA = (nivell, extra = '') => `a-vocabulari.html?nivell=${nivell}&fixed=A&totaloperations=4${extra}`;

/** Fa clic al botó d'una opció (la correcta o la primera incorrecta que encara és activa). */
const clica = (page, correcta) =>
    page.evaluate(bona => {
        const { pregunta } = window.__estatProves();
        const botons = [...document.querySelectorAll('#options-container .btn-option')];
        botons.find((b, k) => !b.disabled && pregunta.opcions[k].correcta === bona).click();
    }, correcta);

module.exports = async function ({ browser, base }) {
    suite('Vocabulari: imatge → paraula, paraula → imatge i imatge → escriure');
    {
        const p1 = await obre(browser, base, RUTA(1), { rapid: false });
        await esperaLliure(p1);
        const e1 = await estat(p1);
        const v1 = await p1.evaluate(() => ({
            imatge: document.querySelector('#question-prompt .img-paraula')?.textContent,
            opcions: [...document.querySelectorAll('#options-container .btn-option')].map(b => b.textContent),
            cap: document.getElementById('lvl-display').textContent,
            escriure: !document.getElementById('write-area').hidden,
        }));
        ok(
            v1.imatge &&
                v1.opcions.length === 4 &&
                v1.opcions.includes(e1.pregunta.text) &&
                !v1.escriure &&
                v1.cap === 'Repte 1 de 4',
            `nivell 1: la imatge ${v1.imatge} i 4 paraules («${v1.opcions.join('», «')}»; bona: «${e1.pregunta.text}»)`
        );
        ok(
            p1.errors.length === 0 && p1.externes.length === 0,
            `sense errors JS ni peticions externes (${unics(p1.errors) || 'cap'})`
        );
        await p1.context().close();

        const p2 = await obre(browser, base, RUTA(2), { rapid: false });
        await esperaLliure(p2);
        const e2 = await estat(p2);
        const v2 = await p2.evaluate(() => ({
            paraula: document.querySelector('#question-prompt .paraula-gran')?.textContent,
            imatges: document.querySelectorAll('#options-container .btn-option .img-paraula').length,
            etiquetes: [...document.querySelectorAll('#options-container .btn-option')].map(b =>
                b.getAttribute('aria-label')
            ),
        }));
        ok(
            v2.paraula === e2.pregunta.text && v2.imatges === 4 && v2.etiquetes.includes(e2.pregunta.text),
            `nivell 2: la paraula «${v2.paraula}» i 4 imatges`
        );
        await p2.context().close();

        const p3 = await obre(browser, base, RUTA(3), { rapid: false });
        await esperaLliure(p3);
        const v3 = await p3.evaluate(() => ({
            imatge: !!document.querySelector('#question-prompt .img-paraula'),
            camp: !document.getElementById('write-area').hidden,
            accents: document.querySelectorAll('#accents-bar .btn-accent').length,
            opcions: document.getElementById('options-container').hidden,
        }));
        ok(
            v3.imatge && v3.camp && v3.accents === 10 && v3.opcions,
            'nivell 3: la imatge, el camp per escriure i la barra amb 10 lletres amb accent (sense opcions)'
        );
        await p3.context().close();
    }

    suite('Vocabulari: dues oportunitats, la bona revelada i la paraula escrita lletra a lletra');
    {
        const page = await obre(browser, base, RUTA(1), { congela: 2000 });
        await esperaLliure(page);
        await clica(page, false);
        await esperaLliure(page);
        const mig = await page.evaluate(() => ({
            intents: document.getElementById('attempts-display').textContent,
            marcats: document.querySelectorAll('#options-container .btn-option.wrong:disabled').length,
        }));
        await clica(page, false);
        await page.waitForSelector('#options-container .btn-option.reveal-answer', { timeout: 4000 });
        const rev = await page.evaluate(() => ({
            revelats: document.querySelectorAll('#options-container .btn-option.reveal-answer').length,
            tots: [...document.querySelectorAll('#options-container .btn-option')].every(b => b.disabled),
        }));
        ok(
            /1$/.test(mig.intents) && mig.marcats === 1 && rev.revelats === 1 && rev.tots,
            `un error: queda 1 intent («${mig.intents}»); el segon error revela la bona en verd i ho bloqueja tot`
        );
        await page.context().close();

        const w = await obre(browser, base, RUTA(3, '&tema=menjar'), { congela: 2000 });
        await esperaLliure(w);
        const { pregunta } = await estat(w);
        const sol = pregunta.solucio;
        const intents = () => w.evaluate(() => document.getElementById('attempts-display').textContent);
        const abans = await intents();
        // Una errada petita (una lletra canviada): surt lletra a lletra amb ✔ i ✖, però no costa cap intent i es pot corregir
        const mala = (sol[0] === 'x' ? 'y' : 'x') + sol.slice(1);
        await w.fill('#value-input', mala);
        await w.click('.btn-ok');
        await esperaLliure(w);
        const m = await w.evaluate(() => ({
            bo: document.querySelectorAll('#part-feedback .lletra.bo').length,
            mal: document.querySelectorAll('#part-feedback .lletra.mal').length,
            valor: document.getElementById('value-input').value,
        }));
        ok(
            m.mal === 1 && m.bo === [...sol].length - 1 && (await intents()) === abans && m.valor === mala,
            `una lletra equivocada («${mala}» per «${sol}») surt ✖ i la resta ✔, però no costa cap intent («${abans}») i el camp es queda per corregir-lo`
        );
        // Un error de debò (una paraula que no s'hi assembla): costa un intent
        await w.fill('#value-input', 'zzzzzzzzzz');
        await w.click('.btn-ok');
        await esperaLliure(w);
        ok(/1$/.test(await intents()), `una paraula que no s'hi assembla costa un intent («${await intents()}»)`);
        await esperaLliure(w);
        await w.fill('#value-input', '');
        await w.click('#accents-bar .btn-accent[data-lletra="à"]');
        await w.click('#accents-bar .btn-accent[data-lletra="ç"]');
        ok((await w.inputValue('#value-input')) === 'àç', "la barra d'accents escriu la lletra al camp");
        await w.fill('#value-input', pregunta.text);
        await w.press('#value-input', 'Enter');
        await w.waitForFunction(() => window.__estatProves().sessionScore > 0, null, { timeout: 4000 });
        ok(
            (await estat(w)).sessionScore === 8,
            "escriure-la bé a la segona oportunitat (amb l'article, que és opcional) val 8 punts"
        );
        await w.context().close();
    }

    suite('Vocabulari: ?tema= i ?vistes=1, partida completa, mòbil i sessions fixes');
    {
        const t = await obre(browser, base, RUTA(1, '&tema=animals'), { rapid: false });
        const et = await estat(t);
        ok(
            et.banc.ids.length === 6 && et.banc.ids.includes('gos'),
            `?tema=animals: es pregunten només les ${et.banc.ids.length} paraules d'animals`
        );
        await t.context().close();

        const v = await obre(browser, base, RUTA(1, '&vistes=1'), {
            rapid: false,
            init: () => localStorage.setItem('a2-paraules-vistes', JSON.stringify(['poma', 'cotxe', 'gos'])),
        });
        const ev = await estat(v);
        ok(
            ev.banc.ids.sort().join() === 'cotxe,gos,poma',
            `?vistes=1: només les paraules vistes (${ev.banc.ids.join(', ')})`
        );
        await v.context().close();

        const p = await obre(browser, base, RUTA(1, '&totaloperations=3'));
        let final = false;
        for (let i = 0; i < 300 && !final; i++) {
            final = await p.evaluate(
                () => getComputedStyle(document.getElementById('final-screen')).display !== 'none'
            );
            if (final) break;
            const st = await p.evaluate(() => ({
                sessio: getComputedStyle(document.getElementById('session-end-screen')).display !== 'none',
                ocupat: window.__estatProves().ocupat,
            }));
            if (st.sessio) await p.evaluate(() => window.startNextSession());
            else if (!st.ocupat) await clica(p, true);
            await p.waitForTimeout(40);
        }
        ok(
            final && p.errors.length === 0,
            `responent bé s'arriba a la pantalla final (sense errors: ${unics(p.errors) || 'cap'})`
        );
        await p.context().close();

        for (const nivell of [2, 3]) {
            const m = await obre(browser, base, RUTA(nivell), { mobil: true, w: 360, h: 700 });
            await esperaLliure(m);
            const d = await m.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
            ok(d[0] <= d[1], `al mòbil (360 px), nivell ${nivell}, no desborda (${d[0]} ≤ ${d[1]})`);
            await m.context().close();
        }

        const a = await obre(browser, base, RUTA(2), { rapid: false });
        const b = await obre(browser, base, RUTA(2), { rapid: false });
        const [ea, eb] = [await estat(a), await estat(b)];
        ok(
            JSON.stringify(ea.pregunta) === JSON.stringify(eb.pregunta),
            '?fixed=A dona sempre la mateixa pregunta, amb les mateixes opcions'
        );
        await a.context().close();
        await b.context().close();
    }

    suite("Vocabulari matemàtic: mini-exemples i dibuixos com a imatge, i termes de més d'una paraula");
    {
        const RUTA_M = (nivell, extra = '') =>
            `a-vocabulari.html?nivell=${nivell}&tema=mat-figures&fixed=A&totaloperations=4${extra}`;
        const p1 = await obre(browser, base, RUTA_M(1), { rapid: false });
        await esperaLliure(p1);
        const e1 = await estat(p1);
        const v1 = await p1.evaluate(() => ({
            mat: !!document.querySelector('#question-prompt .img-paraula .mat'),
            opcions: document.querySelectorAll('#options-container .btn-option').length,
        }));
        ok(
            v1.mat && v1.opcions === 4 && e1.banc.ids.length >= 14,
            `nivell 1 amb el tema de figures planes (${e1.banc.ids.length} paraules): la imatge és un dibuix (.mat) i hi ha 4 opcions («${e1.pregunta.text}»)`
        );
        await p1.context().close();

        const p2 = await obre(browser, base, RUTA_M(2), { rapid: false });
        await esperaLliure(p2);
        const v2 = await p2.evaluate(() => ({
            dibuixos: document.querySelectorAll('#options-container .btn-option .mat').length,
            etiquetes: [...document.querySelectorAll('#options-container .btn-option')].every(b =>
                b.getAttribute('aria-label')
            ),
        }));
        ok(
            v2.dibuixos === 4 && v2.etiquetes,
            'nivell 2: les 4 opcions són dibuixos, cada una amb el seu nom accessible'
        );
        await p2.context().close();

        const p3 = await obre(browser, base, `a-vocabulari.html?nivell=3&tema=mat-algebra&fixed=B&totaloperations=3`, {
            rapid: false,
        });
        await esperaLliure(p3);
        const { pregunta } = await estat(p3);
        await p3.fill('#value-input', pregunta.text);
        await p3.press('#value-input', 'Enter');
        await p3.waitForFunction(() => window.__estatProves().sessionScore > 0, null, { timeout: 4000 });
        ok(
            (await estat(p3)).sessionScore === 10,
            `escriure «${pregunta.text}» (amb l'article, si en porta) a la primera val 10 punts`
        );
        await p3.context().close();

        const m = await obre(browser, base, RUTA_M(2), { mobil: true, w: 360, h: 700 });
        await esperaLliure(m);
        const d = await m.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
        ok(d[0] <= d[1], `al mòbil (360 px), amb dibuixos de geometria, no desborda (${d[0]} ≤ ${d[1]})`);
        await m.context().close();
    }

    suite('Vocabulari: una paraula més general també és certa (✔ 🔍) i no gasta cap intent');
    {
        const w = await obre(browser, base, `a-vocabulari.html?nivell=3&tema=mat-figures&totaloperations=4`, {
            congela: 2000,
        });
        await esperaLliure(w);
        // El motor sorteja la paraula (sense ?fixed=, que repetiria sempre la mateixa): es demanen preguntes noves
        // fins que surt la imatge d'un quadrat (10 paraules del tema es poden escriure; en 300 sortejos, la probabilitat de no trobar-la és ~10⁻¹⁴)
        const trobada = await w.evaluate(() => {
            for (let i = 0; i < 300; i++) {
                if (window.__estatProves().pregunta.id === 'quadrat') return true;
                window.buildLevel();
            }
            return false;
        });
        const abans = await w.evaluate(() => document.getElementById('attempts-display').textContent);
        await w.fill('#value-input', 'polígon');
        await w.click('.btn-ok');
        await esperaLliure(w);
        const mes = await w.evaluate(() => ({
            marca: document.querySelector('#part-feedback .lletra.bo i')?.textContent,
            mals: document.querySelectorAll('#part-feedback .lletra.mal').length,
            intents: document.getElementById('attempts-display').textContent,
        }));
        const e = await estat(w);
        ok(
            trobada && mes.marca === '✔ 🔍' && mes.mals === 0 && mes.intents === abans && e.sessionScore === 0,
            `la imatge d'un quadrat + «polígon»: surt ✔ 🔍, sense ✖, sense perdre cap intent («${mes.intents}») ni punts`
        );
        await w.fill('#value-input', 'el quadrat');
        await w.press('#value-input', 'Enter');
        await w.waitForFunction(() => window.__estatProves().sessionScore > 0, null, { timeout: 4000 });
        ok(
            (await estat(w)).sessionScore === 10,
            'i la paraula bona encara val 10 punts: la pista de «més concreta» no ha costat res'
        );
        ok(w.errors.length === 0, `sense errors JS (${unics(w.errors) || 'cap'})`);
        await w.context().close();
    }

    suite('Vocabulari: lletres girades, paraules en un altre ordre i punt volat no costen cap intent');
    {
        const w = await obre(browser, base, 'a-vocabulari.html?nivell=3&tema=mat-nombres&totaloperations=4', {
            congela: 2000,
        });
        await esperaLliure(w);
        const trobada = await w.evaluate(() => {
            for (let i = 0; i < 400; i++) {
                if (window.__estatProves().pregunta.id === 'nombre-enter') return true;
                window.buildLevel();
            }
            return false;
        });
        const intents = () => w.evaluate(() => document.getElementById('attempts-display').textContent);
        const abans = await intents();
        const prova = async escrit => {
            await w.fill('#value-input', escrit);
            await w.click('.btn-ok');
            await esperaLliure(w);
            return w.evaluate(() => ({
                creuades: document.querySelectorAll('#part-feedback .lletra.creuada').length,
                bones: document.querySelectorAll('#part-feedback .lletra.bo').length,
                mals: document.querySelectorAll('#part-feedback .lletra.mal').length,
            }));
        };
        const ordre = await prova('enter nombre');
        const girades = await prova('nombre entre');
        const falta = await prova('nombre');
        ok(
            trobada &&
                ordre.creuades === 1 &&
                ordre.bones === 11 &&
                girades.creuades === 2 &&
                falta.mals === 6 &&
                falta.bones === 6 &&
                (await intents()) === abans &&
                (await estat(w)).sessionScore === 0,
            `«enter nombre» (⇄ a l'espai), «nombre entre» (⇄ a dues lletres) i «nombre» (6 «_» per a la paraula que falta): marques, cap intent perdut («${abans}»)`
        );
        await w.fill('#value-input', 'el nombre enter');
        await w.press('#value-input', 'Enter');
        await w.waitForFunction(() => window.__estatProves().sessionScore > 0, null, { timeout: 4000 });
        ok((await estat(w)).sessionScore === 10, 'i la paraula bona, corregida, encara val 10 punts');
        ok(w.errors.length === 0, `sense errors JS (${unics(w.errors) || 'cap'})`);
        await w.context().close();

        const p = await obre(browser, base, 'a-vocabulari.html?nivell=3&tema=mat-figures&totaloperations=4', {
            congela: 2000,
        });
        await esperaLliure(p);
        const trobat = await p.evaluate(() => {
            for (let i = 0; i < 400; i++) {
                if (window.__estatProves().pregunta.id === 'parallelogram') return true;
                window.buildLevel();
            }
            return false;
        });
        await p.fill('#value-input', 'parallelogram');
        await p.press('#value-input', 'Enter');
        await p.waitForFunction(() => window.__estatProves().sessionScore > 0, null, { timeout: 4000 });
        const bona = await p.evaluate(() =>
            [...document.querySelectorAll('#part-feedback .lletra')].map(l => l.firstChild.textContent).join('')
        );
        ok(
            trobat && (await estat(p)).sessionScore === 10 && bona === 'paral·lelogram',
            '«parallelogram», sense el punt volat, és correcta (10 punts) i la resposta surt amb la paraula bona: «paral·lelogram»'
        );
        await p.context().close();
    }

    suite("Vocabulari: al nivell d'escriure no es demana cap solució llarga, i als de triar sí");
    {
        const demana = async (nivell, tema) => {
            const page = await obre(
                browser,
                base,
                `a-vocabulari.html?nivell=${nivell}&tema=${tema}&totaloperations=4`,
                {
                    congela: 2000,
                }
            );
            await esperaLliure(page);
            const solucions = await page.evaluate(() => {
                const v = [];
                for (let i = 0; i < 300; i++) {
                    window.buildLevel();
                    v.push(window.__estatProves().pregunta.solucio);
                }
                return v;
            });
            await page.context().close();
            return solucions;
        };
        const escrites = await demana(3, 'mat-operacions');
        const triades = await demana(1, 'mat-operacions');
        const llarga = escrites.find(x => [...x].length > 14);
        ok(
            !llarga && triades.includes('propietat commutativa') && new Set(escrites).size >= 10,
            `mat-operacions, 300 preguntes: escrivint, cap solució de més de 14 caràcters (${new Set(escrites).size} paraules diferents${llarga ? `; «${llarga}»` : ''}); triant, també surt «propietat commutativa»`
        );
    }
};
