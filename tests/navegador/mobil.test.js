/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/navegador/mobil.test.js
 * ROL: Mòbils estrets (320, 360 i 390 px de zona útil, tàctils): cap pàgina
 *      desborda en horitzontal, les files de «proporció directa» no es tallen,
 *      i la portada de l'alumnat (fitxes) i el panell del professorat (generador
 *      d'enllaços) no tapen res amb el peu (R12c, R14).
 * ============================================================================
 */
'use strict';
const { suite, ok } = require('../harness');
const { ACTIVITATS, obre, esperaLliure, responLliure, jugaFinsAlFinal, unics } = require('./helpers');

const AMPLADES = [320, 360, 390];

/** Amplada del document, de la finestra i els primers elements que sobresurten (per al missatge d'error). */
const mesura = page =>
    page.evaluate(() => {
        const fora = [];
        document.querySelectorAll('body *').forEach(el => {
            const b = el.getBoundingClientRect();
            if (b.width > 0 && (b.right > innerWidth + 1 || b.left < -1) && getComputedStyle(el).position !== 'fixed') {
                fora.push(
                    `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${typeof el.className === 'string' && el.className ? `.${el.className.trim().split(/\s+/).join('.')}` : ''}[${Math.round(b.left)}..${Math.round(b.right)}]`
                );
            }
        });
        return { sw: document.documentElement.scrollWidth, iw: innerWidth, fora: fora.slice(0, 4) };
    });

module.exports = async function ({ browser, base }) {
    suite('Cap activitat ni tutorial desborda en horitzontal (320, 360 i 390 px)');
    for (const [nom] of ACTIVITATS) {
        for (const w of AMPLADES) {
            const page = await obre(browser, base, `${nom}.html?totaloperations=3&nivell=2`, {
                mobil: true,
                w,
                h: 700,
            });
            const m = await mesura(page);
            ok(m.sw <= m.iw, `${nom} @${w}: document ${m.sw} / finestra ${m.iw}`, m.fora.join(' ; '));
            await page.context().close();
        }
        const page = await obre(browser, base, `${nom}-tutorial.html`, { mobil: true, w: 360, h: 700 });
        const m = await mesura(page);
        ok(m.sw <= m.iw, `${nom}-tutorial @360: document ${m.sw} / finestra ${m.iw}`, m.fora.join(' ; '));
        await page.context().close();
    }

    suite('Sessió fixa: el distintiu no desborda ni tapa el títol, la icona ni el botó «Tutorial» (320, 360 i 390 px)');
    for (const w of AMPLADES) {
        const page = await obre(browser, base, 'a-enters.html?fixed=A&totaloperations=3', { mobil: true, w, h: 700 });
        const r = await page.evaluate(() => {
            const rect = s => {
                const b = document.querySelector(s).getBoundingClientRect();
                return { l: b.left, t: b.top + scrollY, r: b.right, b: b.bottom + scrollY, clau: s };
            };
            const badge = rect('#badge-sessio-fixa');
            const tapa = ['.home-icon-link', 'h1', '#btn-tutorial']
                .map(rect)
                .filter(p => !(badge.r <= p.l || p.r <= badge.l || badge.b <= p.t || p.b <= badge.t))
                .map(p => p.clau);
            return {
                dins: badge.l >= 0 && badge.r <= innerWidth,
                tapa,
                sw: document.documentElement.scrollWidth,
                iw: innerWidth,
            };
        });
        ok(
            r.dins && r.tapa.length === 0 && r.sw <= r.iw,
            `a-enters?fixed=A @${w}: distintiu dins de la finestra i sense tapar res`,
            r.tapa.join(', ')
        );
        await page.context().close();
    }

    suite(
        'Ajuda oberta amb les paraules il·lustrades: cap píndola surt de la caixa ni queda sota el teclat (320, 360 i 390 px)'
    );
    for (const w of AMPLADES) {
        const page = await obre(browser, base, 'a-enters.html?fixed=A&totaloperations=4&nivell=2', {
            mobil: true,
            w,
            h: 700,
        });
        const problemes = [];
        let pindoles = 0;
        for (let q = 0; q < 4; q++) {
            await esperaLliure(page);
            await page.click('.btn-ajuda');
            await page.waitForTimeout(100);
            const m = await mesura(page);
            const r = await page.evaluate(() => {
                const caixa = document.getElementById('help-text').getBoundingClientRect();
                const teclat = document.getElementById('customKeyboard').getBoundingClientRect();
                const pindoles = [...document.querySelectorAll('#help-text .paraula')].map(el => {
                    const b = el.getBoundingClientRect();
                    const t = el.querySelector('.paraula-text').getBoundingClientRect();
                    return {
                        fora: b.left < caixa.left - 1 || b.right > caixa.right + 1,
                        partida: t.height > 1.6 * parseFloat(getComputedStyle(el).fontSize),
                    };
                });
                return {
                    alt: caixa.height,
                    caixaDinsFinestra: caixa.left >= 0 && caixa.right <= innerWidth,
                    sobreElTeclat: caixa.bottom <= teclat.top + 1,
                    pindoles,
                };
            });
            pindoles += r.pindoles.length;
            if (m.sw > m.iw) problemes.push(`desborda ${m.sw}/${m.iw} (${m.fora.join(' ; ')})`);
            if (!r.caixaDinsFinestra) problemes.push("la caixa de l'ajuda surt de la finestra");
            // Cada fila de píndoles fa 44 px (zona de toc de les pantalles tàctils): fins a 4 files
            if (r.alt > 230) problemes.push(`l'ajuda fa ${Math.round(r.alt)} px d'alt (més de 4 files de paraules)`);
            if (!r.sobreElTeclat) problemes.push("el teclat tapa l'ajuda");
            if (r.pindoles.some(x => x.fora)) problemes.push("una píndola surt de la caixa de l'ajuda");
            if (r.pindoles.some(x => x.partida))
                problemes.push('una paraula es parteix en dues línies dins de la píndola');
            await page.click('.btn-ajuda');
            await responLliure(page, 'int', true);
        }
        ok(
            problemes.length === 0 && pindoles === 16,
            `a-enters amb l'ajuda oberta @${w}: 4 preguntes, ${pindoles} píndoles, tot dins de la finestra`,
            unics(problemes)
        );
        ok(page.errors.length === 0, `a-enters @${w}: sense errors JS (${unics(page.errors) || 'cap'})`);
        await page.context().close();
    }

    suite('Pantalla final i revisió a 360 px, sense desbordament');
    for (const [nom, tipus] of ACTIVITATS) {
        const page = await obre(browser, base, `${nom}.html?totaloperations=3&maxintents=4`, {
            mobil: true,
            w: 360,
            h: 700,
        });
        await jugaFinsAlFinal(page, tipus);
        await page.waitForTimeout(150);
        const a = await mesura(page);
        await page.evaluate(() => window.showHistorySummary());
        await page.waitForTimeout(100);
        const b = await mesura(page);
        ok(
            a.sw <= a.iw && b.sw <= b.iw,
            `${nom}: final ${a.sw}/${a.iw}, revisió ${b.sw}/${b.iw}`,
            a.fora.concat(b.fora).join(' ; ')
        );
        await page.context().close();
    }

    suite("Portada de l'alumnat en mòbil: dues columnes de fitxes grans, sense desbordar, i el peu s'hi pot arribar");
    for (const [w, h] of [
        [360, 700],
        [320, 640],
        [390, 844],
    ]) {
        const page = await obre(browser, base, 'alumnat.html', { mobil: true, w, h, rapid: false });
        const r = await page.evaluate(() => {
            const fitxes = [...document.querySelectorAll('a.fitxa')].map(a => a.getBoundingClientRect());
            const peu = document.querySelector('.site-footer').getBoundingClientRect();
            const logo = document.querySelector('.footer-logo').getBoundingClientRect();
            const professorat = document.querySelector('.peu-professorat').getBoundingClientRect();
            return {
                sw: document.documentElement.scrollWidth,
                iw: innerWidth,
                n: fitxes.length,
                columnes: new Set(fitxes.map(f => Math.round(f.left))).size,
                dins: fitxes.every(f => f.left >= 0 && f.right <= innerWidth),
                tocables: fitxes.every(f => f.width >= 44 && f.height >= 44),
                petita: Math.round(Math.min(...fitxes.map(f => f.width))),
                peuDalt: peu.top + scrollY,
                fitxesBaix: Math.max(...fitxes.map(f => f.bottom)) + scrollY,
                logoDinsPeu: logo.left >= peu.left - 1 && logo.right <= peu.right + 1 && logo.top >= peu.top - 1,
                professorat: Math.round(professorat.height),
            };
        });
        ok(
            r.sw <= r.iw && r.dins,
            `${w}×${h}: sense desbordament horitzontal (${r.sw}/${r.iw}) i totes les fitxes dins`
        );
        ok(
            r.n === 18 && r.columnes === 2 && r.tocables,
            `${w}×${h}: 18 fitxes en ${r.columnes} columnes, la més estreta de ${r.petita} px (zones de toc de sobra)`
        );
        ok(
            r.peuDalt >= r.fitxesBaix,
            `${w}×${h}: el peu (${Math.round(r.peuDalt)}) no tapa les fitxes (${Math.round(r.fitxesBaix)})`
        );
        ok(
            r.logoDinsPeu && r.professorat >= 44,
            `${w}×${h}: la icona de Step Quiz és dins del peu i l'enllaç al professorat fa ${r.professorat} px d'alt`
        );
        // De cop (sense el desplaçament suau dels dispositius tàctils): el que es prova és que s'hi pot arribar, no la durada
        await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
        await page.waitForTimeout(150);
        ok(
            await page.evaluate(
                () => document.querySelector('.site-footer').getBoundingClientRect().bottom <= innerHeight + 1
            ),
            `${w}×${h}: es pot arribar al final del peu`
        );
        ok(page.errors.length === 0, `${w}×${h}: sense errors JS (${unics(page.errors) || 'cap'})`);
        await page.context().close();
    }

    suite("Panell del professorat en mòbil: el peu no tapa el panell i s'hi pot arribar fent scroll");
    for (const [w, h] of [
        [360, 700],
        [320, 640],
        [390, 844],
    ]) {
        const page = await obre(browser, base, 'index.html', { mobil: true, w, h, rapid: false });
        // El panell amb «Vocabulari» (amb tots els camps: nivell, tema i sessió fixa) és el més alt
        await page.evaluate(() => document.getElementById('cd-eso-opt-0').click());
        const r = await page.evaluate(() => {
            const peu = document.querySelector('.site-footer').getBoundingClientRect();
            const panell = document.getElementById('panel-eso').getBoundingClientRect();
            const logo = document.querySelector('.footer-logo').getBoundingClientRect();
            return {
                sw: document.documentElement.scrollWidth,
                iw: innerWidth,
                peuDalt: peu.top + scrollY,
                panellBaix: panell.bottom + scrollY,
                logoDinsPeu:
                    logo.left >= peu.left - 1 &&
                    logo.right <= peu.right + 1 &&
                    logo.top >= peu.top - 1 &&
                    logo.bottom <= peu.bottom + 1,
                botons: [...document.querySelectorAll('.btn-row button')]
                    .filter(b => getComputedStyle(b).display !== 'none')
                    .map(b => b.getBoundingClientRect().right),
                panellDreta: panell.right,
                selectors: [...document.querySelectorAll('#panel-eso select')]
                    .filter(s => getComputedStyle(s.closest('.row')).display !== 'none')
                    .map(s => s.getBoundingClientRect().right),
            };
        });
        ok(r.sw <= r.iw, `${w}×${h}: sense desbordament horitzontal (${r.sw}/${r.iw})`);
        ok(
            r.peuDalt >= r.panellBaix,
            `${w}×${h}: el peu (${Math.round(r.peuDalt)}) no tapa el panell (${Math.round(r.panellBaix)})`
        );
        ok(r.logoDinsPeu, `${w}×${h}: la icona de Step Quiz és dins del peu`);
        ok(
            r.botons.every(b => b <= r.panellDreta) && r.selectors.every(b => b <= r.panellDreta),
            `${w}×${h}: els botons i els selectors caben al panell`
        );
        await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
        await page.waitForTimeout(150);
        ok(
            await page.evaluate(
                () => document.querySelector('.site-footer').getBoundingClientRect().bottom <= innerHeight + 1
            ),
            `${w}×${h}: es pot arribar al final del peu`
        );
        await page.context().close();
    }
};
