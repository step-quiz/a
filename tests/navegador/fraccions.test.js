/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/navegador/fraccions.test.js
 * ROL: «Fraccions» (a-fraccions, PR 12d) al navegador, amb el motor nou: els
 *      nivells, els passos que van creixent l'expressió, les marques ✔/✖, la
 *      fracció simplificable (⟳), l'ajuda, la solució revelada, la partida
 *      completa, el teclat tàctil entre les caselles, que no desbordi en
 *      mòbil i les sessions fixes. La lògica pura té els seus tests a
 *      tests/activitats.test.js.
 * ============================================================================
 */
'use strict';
const { suite, ok } = require('../harness');
const { obre, estat, esperaLliure, unics } = require('./helpers');

const RUTA = (nivell, extra = '') => `a-fraccions.html?nivell=${nivell}&fixed=A&totaloperations=2&maxintents=3${extra}`;

/** Escriu uns valors a les caselles del pas actual (en ordre) i comprova. */
const respon = (page, valors) =>
    page.evaluate(v => {
        const cs = [...document.querySelectorAll('#step-area input.math-cell')];
        cs.forEach((inp, i) => (inp.value = v[i] === null || v[i] === undefined ? '' : String(v[i])));
        window.checkValue();
    }, valors);

/** Respon bé el pas actual. */
const responBe = async page => respon(page, (await estat(page)).resposta);

module.exports = async function ({ browser, base }) {
    suite("Fraccions: l'expressió i les caselles del primer pas de cada nivell");
    for (const nivell of [1, 2, 3, 4]) {
        const page = await obre(browser, base, RUTA(nivell), { rapid: false });
        await esperaLliure(page);
        const e = await estat(page);
        const v = await page.evaluate(() => ({
            fraccions: document.querySelectorAll('#expression-box .fraction, #expression-box .integer-val').length,
            caselles: document.querySelectorAll('#step-area input.math-cell').length,
            cap: document.getElementById('lvl-display').textContent,
        }));
        const esperades = { den: 1, equiv: 2, inversa: 2, resultat: 2 }[e.pas];
        ok(
            v.fraccions === 2 && v.caselles >= 1 && v.cap === 'Repte 1 de 2' && v.caselles >= esperades - 1,
            `nivell ${nivell}: ${e.problema.n1}/${e.problema.d1} ${e.problema.op} ${e.problema.n2}/${e.problema.d2}, primer pas «${e.pas}» amb ${v.caselles} caselles`
        );
        ok(
            page.errors.length === 0 && page.externes.length === 0,
            `sense errors JS ni peticions externes (${unics(page.errors) || 'cap'})`
        );
        await page.context().close();
    }

    suite('Fraccions: marques ✔/✖, passos que fan créixer l’expressió, ajuda i solució revelada');
    {
        const page = await obre(browser, base, RUTA(3), { congela: 2000 });
        await esperaLliure(page);
        let e = await estat(page);
        // Pas «den»: un nombre que no és múltiple comú surt amb les dues divisions
        const { d1, d2 } = e.problema;
        const dolent = d1 * d2 + 1;
        await respon(page, [dolent]);
        const mal = await page.evaluate(() =>
            [...document.querySelectorAll('#part-feedback .part')].map(p => p.textContent.trim())
        );
        ok(
            mal.length === 2 &&
                mal[0] === `${dolent} ÷ ${d1} ${dolent % d1 === 0 ? '✔' : '✖'}` &&
                mal[1].startsWith(`${dolent} ÷ ${d2}`),
            `un denominador equivocat surt amb les dues divisions i ✔/✖ («${mal.join(' · ')}»)`
        );
        await page.click('.btn-ajuda');
        const aj = await page.evaluate(() => ({
            visible: document.getElementById('help-text').classList.contains('visible'),
            comu: document.querySelectorAll('#help-text .comu').length,
        }));
        ok(aj.visible && aj.comu === 2, "l'ajuda del denominador mostra els múltiples amb el primer comú en destacat");
        await esperaLliure(page);
        const liniesInicials = await page.evaluate(
            () => document.querySelectorAll('#expression-box .expr-line').length
        );
        await responBe(page);
        await page.waitForFunction(() => window.__estatProves().pas === 'equiv', null, { timeout: 3000 });
        ok(
            (await page.evaluate(() => document.querySelectorAll('#expression-box .expr-line').length)) ===
                liniesInicials,
            "triar el denominador comú no afegeix cap línia a l'expressió"
        );
        await esperaLliure(page);
        const abans = await page.evaluate(() => document.querySelectorAll('#expression-box .expr-line').length);
        await responBe(page);
        await page.waitForFunction(() => window.__estatProves().pas === 'resultat', null, { timeout: 3000 });
        const despres = await page.evaluate(() => document.querySelectorAll('#expression-box .expr-line').length);
        ok(despres === abans + 1, "un pas bo afegeix una línia «= …» a l'expressió");
        await page.context().close();

        // Tres respostes equivocades: s'esgoten els intents i surt la solució a les caselles
        const q = await obre(browser, base, RUTA(3), { congela: 2000 });
        for (let i = 0; i < 3; i++) {
            await esperaLliure(q);
            await respon(q, [7]);
        }
        await q.waitForFunction(() => document.querySelector('#step-area input.math-cell.reveal'), null, {
            timeout: 3000,
        });
        const r = await q.evaluate(() => document.querySelector('#step-area input.math-cell').value);
        ok(
            r === String((await estat(q)).resposta[0]),
            `amb els intents esgotats la solució surt a la casella, en verd (${r})`
        );
        await q.context().close();
    }

    suite('Fraccions: partida completa de cada nivell i teclat tàctil en mòbil');
    for (const nivell of [1, 4]) {
        const p = await obre(browser, base, RUTA(nivell));
        let final = false;
        for (let i = 0; i < 500 && !final; i++) {
            const st = await p.evaluate(() => ({
                fi: getComputedStyle(document.getElementById('final-screen')).display !== 'none',
                sessio: getComputedStyle(document.getElementById('session-end-screen')).display !== 'none',
                ocupat: window.__estatProves().ocupat,
                resposta: window.__estatProves().resposta,
            }));
            final = st.fi;
            if (st.sessio) await p.evaluate(() => window.startNextSession());
            else if (!st.ocupat && !final && st.resposta) await respon(p, st.resposta);
            await p.waitForTimeout(40);
        }
        ok(
            final && p.errors.length === 0,
            `nivell ${nivell}: responent bé s'arriba a la pantalla final (sense errors: ${unics(p.errors) || 'cap'})`
        );
        await p.context().close();
    }
    {
        const m = await obre(browser, base, RUTA(4), { mobil: true, w: 360, h: 700 });
        await esperaLliure(m);
        const { resposta, pas } = await estat(m);
        const tecla = c => m.locator(`#customKeyboard .kb-btn[data-key="${c}"]`).tap();
        // Cada valor, amb el teclat; el botó → passa a la casella següent i, a l'última, comprova
        for (const valor of resposta) {
            for (const c of String(valor)) await tecla(c);
            await m.locator('#customKeyboard .kb-enter').tap();
        }
        await m.waitForFunction(p => window.__estatProves().pas !== p, pas, { timeout: 4000 });
        const d = await m.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
        ok(d[0] <= d[1], `teclat tàctil: el primer pas (${pas}) es dona per bo i no desborda (${d[0]} ≤ ${d[1]})`);
        await m.context().close();
    }

    suite('Fraccions: sessions fixes');
    {
        const a = await obre(browser, base, RUTA(3), { rapid: false });
        const b = await obre(browser, base, RUTA(3), { rapid: false });
        const [ea, eb] = [await estat(a), await estat(b)];
        ok(JSON.stringify(ea.problema) === JSON.stringify(eb.problema), '?fixed=A dona sempre el mateix problema');
        await a.context().close();
        await b.context().close();
    }
};
