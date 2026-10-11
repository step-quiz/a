/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/navegador/ordenar.test.js
 * ROL: «Ordenar enters» (a-enters-ordenar, PR 10) al navegador: els tres
 *      reptes es resolen i es comproven com toca, la solució es veu quan
 *      s'esgoten els intents, el teclat tàctil té el «−», no desborda en mòbil,
 *      les sessions fixes i l'accessibilitat (axe) de cada repte.
 *      La lògica pura té els seus tests a tests/activitats.test.js.
 * ============================================================================
 */
'use strict';
const { suite, ok } = require('../harness');
const { obre, estat, esperaLliure, carregaAxe, unics } = require('./helpers');

const RUTA = (extra = '') => `a-enters-ordenar.html?fixed=A&totaloperations=6&maxintents=3${extra}`;

/** Resol el repte actual, bé o malament (un sol intent). */
async function resol(page, correcte = true) {
    await esperaLliure(page);
    const { tipus, repte } = await estat(page);
    await page.evaluate(
        ([t, r, ok_]) => {
            if (t === 1) {
                const bo = r.signe;
                const triat = ok_ ? bo : bo === '<' ? '>' : '<';
                [...document.querySelectorAll('#step-signe .btn-sign')].find(b => b.textContent === triat).click();
            } else if (t === 2) {
                document.getElementById('value-input').value = String(ok_ ? r.p + 1 : r.p);
                window.checkCurrentCell();
            } else {
                const bots = [...document.querySelectorAll('#menors-grid .btn-sign')];
                bots.forEach((b, i) => {
                    if (r.nums[i] < r.r === ok_ && !b.disabled) b.click();
                });
                if (!ok_) bots.filter((b, i) => r.nums[i] >= r.r)[0].click();
                window.checkCurrentCell();
            }
        },
        [tipus, repte, correcte]
    );
}

module.exports = async function ({ browser, base }) {
    suite('Ordenar enters: els tres reptes (1, 2, 3, 1, 2, 3) es veuen i es resolen');
    {
        const page = await obre(browser, base, RUTA());
        const vistos = [];
        for (let q = 0; q < 6; q++) {
            await esperaLliure(page);
            const e = await estat(page);
            const pantalla = await page.evaluate(() => ({
                cap: document.getElementById('lvl-display').textContent,
                visibles: ['step-signe', 'step-entre', 'step-menors'].filter(
                    id => getComputedStyle(document.getElementById(id)).display !== 'none'
                ),
                expr: document.getElementById('expression-box').innerText.replace(/\s+/g, ' ').trim(),
                botonsMenors: document.querySelectorAll('#menors-grid .btn-sign').length,
                titol: document.getElementById('menors-title').innerText.replace(/\s+/g, ' ').trim(),
            }));
            vistos.push({ e, pantalla });
            await resol(page, true);
        }
        const dosPassos = vistos.every(
            ({ e, pantalla: p }, q) =>
                e.tipus === (q % 3) + 1 &&
                p.cap === `Repte ${q + 1} de 6` &&
                p.visibles.join() === ['step-signe', 'step-entre', 'step-menors'][q % 3]
        );
        ok(dosPassos, 'cada pregunta és del tipus que toca, amb la seva capçalera «Repte n de 6» i el seu panell');
        ok(
            vistos[0].pantalla.expr.startsWith(
                `${vistos[0].e.repte.p < 0 ? `(${vistos[0].e.repte.p})` : vistos[0].e.repte.p} ?`
            ) &&
                vistos[2].pantalla.botonsMenors === 8 &&
                vistos[2].pantalla.titol.endsWith(
                    vistos[2].e.repte.r < 0 ? `(${vistos[2].e.repte.r})` : String(vistos[2].e.repte.r)
                ),
            `les peces són les del repte («${vistos[0].pantalla.expr}», «${vistos[2].pantalla.titol}», 8 nombres)`
        );
        const e = await estat(page);
        ok(
            e.sessionHistory.length === 6 && e.sessionHistory.every(h => h.isCorrect) && page.errors.length === 0,
            `6 respostes bones a la revisió i sense errors JS (${unics(page.errors) || 'cap'})`
        );
        await page.context().close();
    }

    suite("Ordenar enters: errors, bloqueig dels encertats i solució quan s'esgoten els intents");
    {
        const page = await obre(browser, base, RUTA(), { congela: 2000 });
        // Repte 1: un signe equivocat gasta un intent
        await resol(page, false);
        await esperaLliure(page);
        ok((await estat(page)).attemptsLeft === 2, 'repte 1: el signe equivocat gasta un intent');
        await resol(page, false);
        await esperaLliure(page);
        await resol(page, false);
        await page.waitForFunction(() => document.querySelector('.token-num.sign-big'), null, { timeout: 3000 });
        const sol = await page.evaluate(() => document.querySelector('.token-num.sign-big').textContent);
        ok(
            sol === (await estat(page)).repte.signe,
            `esgotats els intents, el signe correcte surt a l'expressió («${sol}»)`
        );
        await page.context().close();

        // Repte 3: els encertats es queden en verd, els sobrers se solten
        const p3 = await obre(browser, base, 'a-enters-ordenar.html?fixed=A&totaloperations=3&maxintents=4', {
            congela: 2000,
        });
        await resol(p3, true);
        await p3.waitForFunction(() => window.__estatProves().currentOperation === 1, null, { timeout: 5000 });
        await resol(p3, true);
        await p3
            .waitForFunction(() => window.__estatProves().currentOperation === 2, null, { timeout: 5000 })
            .catch(() => {});
        await esperaLliure(p3).catch(() => {});
        const t = await estat(p3);
        if (t.tipus === 3) {
            // tria tots els menors i un nombre de sobra
            await p3.evaluate(r => {
                const bots = [...document.querySelectorAll('#menors-grid .btn-sign')];
                bots.forEach((b, i) => r.nums[i] < r.r && b.click());
                bots.find((b, i) => r.nums[i] >= r.r).click();
                window.checkCurrentCell();
            }, t.repte);
            await esperaLliure(p3);
            const r = await p3.evaluate(() => ({
                bloquejats: [...document.querySelectorAll('#menors-grid .locked')].map(b => Number(b.textContent)),
                triats: [...document.querySelectorAll('#menors-grid .selected:not(.locked)')].length,
            }));
            const menors = t.repte.nums.filter(n => n < t.repte.r).sort();
            ok(
                r.bloquejats.sort().join() === menors.join() && r.triats === 0,
                `repte 3: els ${menors.length} menors encertats es queden en verd i el que sobrava se sol (${r.bloquejats.join(', ')})`
            );
        } else ok(false, 'la tercera pregunta hauria de ser el repte 3');
        await p3.context().close();
    }

    suite('Ordenar enters en mòbil: teclat amb «−», sense desbordament (320, 360 i 390 px) i sessions fixes');
    {
        const page = await obre(browser, base, RUTA('&totaloperations=6'), { mobil: true, w: 360, h: 700 });
        await resol(page, true);
        await page.waitForFunction(() => window.__estatProves().currentOperation === 1, null, { timeout: 5000 });
        await esperaLliure(page);
        const k = await page.evaluate(() => ({
            menys: !!document.querySelector('#customKeyboard .kb-btn[data-key="-"]'),
            visible: getComputedStyle(document.getElementById('customKeyboard')).display !== 'none',
        }));
        ok(k.menys && k.visible, 'al repte 2 el teclat de la pantalla és visible i té el «−»');
        await page.context().close();
        for (const w of [320, 360, 390]) {
            const p = await obre(browser, base, RUTA(), { mobil: true, w, h: 700 });
            let sw = [0, 0];
            for (let q = 0; q < 3; q++) {
                await esperaLliure(p);
                sw = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
                if (sw[0] > sw[1]) break;
                await resol(p, true);
                await p.waitForTimeout(100);
            }
            ok(sw[0] <= sw[1] && p.errors.length === 0, `${w} px: cap repte desborda (${sw[0]} ≤ ${sw[1]})`);
            await p.context().close();
        }
        const juga = async (cerca, errors) => {
            const p = await obre(browser, base, `a-enters-ordenar.html?${cerca}&totaloperations=6&maxintents=4`);
            const v = [];
            for (let q = 0; q < 6; q++) {
                await esperaLliure(p);
                const { tipus, repte } = await estat(p);
                v.push(`${tipus}:${JSON.stringify(repte)}`);
                if (errors.includes(q)) await resol(p, false);
                await resol(p, true);
            }
            await p.context().close();
            return v.join('|');
        };
        const a1 = await juga('fixed=A', []);
        const a2 = await juga('fixed=A', [0, 2, 4]);
        const b = await juga('fixed=B', []);
        ok(
            a1 === a2 && a1 !== b,
            'sessió fixa A: els mateixos 6 reptes per a tothom, passi el que passi; la B és una altra'
        );
    }

    suite('Ordenar enters: accessibilitat (axe, WCAG 2.2 AA) dels tres reptes');
    {
        const AxeBuilder = carregaAxe();
        if (!AxeBuilder) ok(false, 'Falta @axe-core/playwright');
        else {
            for (let repte = 1; repte <= 3; repte++) {
                const page = await obre(browser, base, RUTA(), { reduit: true });
                for (let q = 1; q < repte; q++) await resol(page, true);
                await page.waitForFunction(
                    r => window.__estatProves().tipus === r && !window.__estatProves().ocupat,
                    repte,
                    {
                        timeout: 5000,
                    }
                );
                await page.waitForTimeout(150);
                const vs = (
                    await new AxeBuilder({ page })
                        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
                        .analyze()
                ).violations;
                ok(
                    vs.length === 0,
                    `repte ${repte}`,
                    vs.flatMap(v => v.nodes.slice(0, 4).map(n => `${v.id}: ${n.target.join(' ')}`)).join('\n')
                );
                await page.context().close();
            }
        }
    }
};
