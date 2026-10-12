/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/navegador/accessibilitat.test.js
 * ROL: Accessibilitat de totes les pantalles (R20, R23):
 *   1. axe-core (WCAG 2.2 A i AA: contrast de colors, noms dels botons, ARIA…)
 *      a cada estat de cada pàgina: joc, error, encert, intents esgotats, ajuda,
 *      targeta d'una paraula, fi de sessió, pantalla final, revisió, tutorials i portada.
 *      S'executa amb «moviment reduït» perquè cap animació a mitges falsegi els colors.
 *   2. Focus visible: cada element que rep el focus amb Tab es nota.
 *   3. Camps de text de 16 px o més en mòbil (si no, iOS fa zoom en tocar-los).
 *   4. Moviment reduït: cap animació d'una durada apreciable.
 *   5. Zones de toc de 44 × 44 px en dispositius tàctils.
 * ============================================================================
 */
'use strict';
const { suite, ok } = require('../harness');
const { ACTIVITATS, obre, esperaLliure, respon, jugaFinsAlFinal, carregaAxe } = require('./helpers');

const ETIQUETES_AXE = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const PAGINES = [
    'index.html', // la portada de l'alumnat
    'professorat.html', // el panell del professorat (generador d'enllaços)
    ...ACTIVITATS.flatMap(([nom]) => [`${nom}.html?totaloperations=3&nivell=1`, `${nom}-tutorial.html`]),
    'a-enters.html?fixed=A&totaloperations=3&nivell=1', // amb el distintiu «Sessió fixa A»
    'album.html', // l'àlbum de paraules (no és cap activitat)
    'targetes.html', // les targetes de vocabulari per imprimir (eina del professorat)
];

module.exports = async function ({ browser, base }) {
    const AxeBuilder = carregaAxe();
    suite('Accessibilitat amb axe-core (WCAG 2.2 A i AA) a cada pantalla');
    if (!AxeBuilder) {
        ok(false, 'Falta @axe-core/playwright', 'Instal·la-ho amb: npm ci --prefix tools/proves');
        return;
    }
    // Els tutorials atenuen a propòsit (opacity: 0.06) el panell que no s'està explicant: no es jutja mentre està atenuat.
    const violacions = async page =>
        (await new AxeBuilder({ page }).withTags(ETIQUETES_AXE).exclude('.dimmed').analyze()).violations;
    const descriu = vs =>
        vs
            .flatMap(v =>
                v.nodes.slice(0, 6).map(n => {
                    const d = (n.any[0] && n.any[0].data) || {};
                    return `${v.id}: ${n.target.join(' ')}${v.id === 'color-contrast' ? ` — contrast ${d.contrastRatio} (text ${d.fgColor} sobre ${d.bgColor}, ${d.fontSize})` : ''}`;
                })
            )
            .join('\n');
    const revisa = async (etiqueta, page) => {
        const vs = await violacions(page);
        ok(vs.length === 0, etiqueta, descriu(vs));
    };
    const tanca = page => page.context().close();

    // ── Portada de l'alumnat ────────────────────────────────────────────────
    {
        const page = await obre(browser, base, 'index.html', { reduit: true, rapid: false });
        await page.waitForTimeout(300);
        console.log("  — portada de l'alumnat");
        await revisa("portada de l'alumnat", page);
        await tanca(page);
        const mobil = await obre(browser, base, 'index.html', { mobil: true, rapid: false });
        await mobil.waitForTimeout(300);
        await revisa("portada de l'alumnat en mòbil", mobil);
        await tanca(mobil);
    }

    // ── Panell del professorat ──────────────────────────────────────────────
    {
        const page = await obre(browser, base, 'professorat.html', { reduit: true, rapid: false });
        await page.waitForTimeout(300);
        console.log('  — panell del professorat');
        await revisa('panell del professorat', page);
        await page.click('.cd-trigger');
        await page.waitForTimeout(150);
        await revisa("panell del professorat amb el selector d'activitat obert", page);
        await page.keyboard.press('Escape');
        await page.evaluate(() => document.getElementById('cd-eso-opt-0').click());
        await page.waitForTimeout(150);
        await revisa('panell del professorat amb «Vocabulari» (nivell, tema i sessió fixa)', page);
        await tanca(page);
    }

    // ── Targetes de vocabulari (eina del professorat) ───────────────────────
    {
        console.log('  — targetes');
        let page = await obre(browser, base, 'targetes.html?temes=mat-figures,mat-algebra', {
            reduit: true,
            rapid: false,
        });
        await revisa('targetes: formulari i vista prèvia (en blanc i negre)', page);
        await tanca(page);
        page = await obre(browser, base, 'targetes.html?temes=mat-figures&contingut=imatge&color=color', {
            reduit: true,
            rapid: false,
        });
        await revisa('targetes: només la imatge (cada targeta amb el seu nom), en color', page);
        await tanca(page);
    }

    // ── Activitats ──────────────────────────────────────────────────────────
    for (const [nom, tipus] of ACTIVITATS) {
        console.log(`  — ${nom}`);
        let page = await obre(browser, base, `${nom}.html?totaloperations=3&maxintents=4&nivell=1`, {
            reduit: true,
            congela: 100,
        });
        await revisa('pantalla de joc', page);
        await respon(page, tipus, false);
        await page.waitForTimeout(60);
        await revisa("després d'un error (camp en vermell i menys intents)", page);
        const ajuda = await page.$('.btn-ajuda');
        if (ajuda) {
            await ajuda.click();
            await page.waitForTimeout(150);
            await revisa("amb l'ajuda oberta", page);
            // Les paraules amb imatge de l'ajuda s'hi poden tocar: n'obren la targeta (PR 7)
            const pindola = await page.$('#help-text .paraula');
            if (pindola) {
                await pindola.click();
                await page.waitForTimeout(150);
                await revisa("amb la targeta d'una paraula oberta", page);
            }
        }
        await tanca(page);

        page = await obre(browser, base, `${nom}.html?totaloperations=3&maxintents=4&nivell=1`, {
            reduit: true,
            congela: 1000,
        });
        await respon(page, tipus, true);
        await page.waitForTimeout(200);
        await revisa("després d'un encert («Molt bé!»)", page);
        await tanca(page);

        page = await obre(browser, base, `${nom}.html?totaloperations=3&maxintents=2&nivell=1`, {
            reduit: true,
            congela: 1000,
        });
        await respon(page, tipus, false);
        await esperaLliure(page);
        await respon(page, tipus, false);
        await page.waitForTimeout(200);
        await revisa('amb els intents esgotats (resposta correcta a la vista)', page);
        await tanca(page);

        page = await obre(browser, base, `${nom}.html?totalsessions=2&totaloperations=1&maxintents=3&nivell=1`, {
            reduit: true,
        });
        await respon(page, tipus, true);
        await page.waitForFunction(
            () =>
                getComputedStyle(document.getElementById('session-end-screen')).display !== 'none' &&
                getComputedStyle(document.getElementById('btn-next-session')).display !== 'none',
            null,
            { timeout: 8000 }
        );
        await revisa('fi de sessió', page);
        await tanca(page);

        page = await obre(browser, base, `${nom}.html?totaloperations=2&maxintents=3&nivell=1`, { reduit: true });
        await jugaFinsAlFinal(page, tipus);
        await page.waitForTimeout(150);
        await revisa('pantalla final (estrelles i punts)', page);
        await page.evaluate(() => window.showHistorySummary());
        await page.waitForTimeout(150);
        await revisa('revisió de les respostes', page);
        await tanca(page);

        // Tutorial: l'inici i dos moments més (es prem «Següent» a poc a poc)
        page = await obre(browser, base, `${nom}-tutorial.html`, { reduit: true });
        await page.waitForTimeout(400);
        await revisa('tutorial: inici', page);
        let fets = 0;
        for (const objectiu of [2, 4]) {
            while (fets < objectiu) {
                await page.evaluate(() => {
                    const b = document.querySelector('#btn-mega-next, #btn-next');
                    if (b && !b.disabled) b.click();
                });
                fets++;
                await page.waitForTimeout(120);
            }
            await page.waitForTimeout(250);
            await revisa(`tutorial: després de ${objectiu} passos`, page);
        }
        await tanca(page);
    }

    // ── Sessió fixa (distintiu) ─────────────────────────────────────────────
    {
        console.log('  — sessió fixa (a-enters)');
        const page = await obre(browser, base, 'a-enters.html?fixed=A&totaloperations=3&nivell=1', {
            reduit: true,
            congela: 100,
        });
        await revisa('sessió fixa: pantalla de joc amb el distintiu', page);
        await tanca(page);
    }

    // ── Focus visible ───────────────────────────────────────────────────────
    suite('Focus visible: cada element que rep el focus amb Tab es nota');
    for (const ruta of PAGINES) {
        const page = await obre(browser, base, ruta, { rapid: false });
        await page.waitForTimeout(500);
        // Estil de cada element focalitzable abans de rebre el focus. Primer es treu el focus de qui el tingui
        // (p. ex. el camp de resposta) i s'espera que acabi la transició d'estil.
        await page.evaluate(
            () => document.activeElement && document.activeElement !== document.body && document.activeElement.blur()
        );
        await page.waitForTimeout(350);
        await page.evaluate(() => {
            const estil = el => {
                const c = getComputedStyle(el);
                return [
                    c.outlineStyle,
                    c.outlineWidth,
                    c.outlineColor,
                    c.boxShadow,
                    c.borderTopColor,
                    c.borderTopWidth,
                    c.backgroundColor,
                    c.color,
                    c.textDecorationLine,
                    c.transform,
                    c.filter,
                ].join('|');
            };
            window.__estils = new Map();
            document
                .querySelectorAll(
                    'a[href], button, input:not([type=hidden]), select, textarea, [tabindex]:not([tabindex="-1"])'
                )
                .forEach(el => window.__estils.set(el, estil(el)));
            window.__estil = estil;
        });
        const sensePista = [];
        const vistos = new Set();
        for (let i = 0; i < 60; i++) {
            await page.keyboard.press('Tab');
            const mira = () =>
                page.evaluate(() => {
                    const el = document.activeElement;
                    if (!el || el === document.body) return null;
                    const abans = window.__estils.get(el);
                    const c = getComputedStyle(el);
                    const contorn = c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) >= 2;
                    const canvia = abans !== undefined && abans !== window.__estil(el);
                    const clau = `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${typeof el.className === 'string' && el.className ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}` : ''}`;
                    return { clau, visible: contorn || canvia };
                });
            let r = await mira();
            if (r && !r.visible) {
                await page.waitForTimeout(350); // potser l'estil encara està en transició
                r = await mira();
            }
            if (!r) continue;
            if (vistos.has(r.clau)) break;
            vistos.add(r.clau);
            if (!r.visible) sensePista.push(r.clau);
        }
        ok(
            vistos.size > 0 && sensePista.length === 0,
            `${ruta.split('?')[0]}: ${vistos.size} elements amb focus visible`,
            `Sense indicador de focus: ${sensePista.join(', ')}`
        );
        await tanca(page);
    }

    // ── Camps de 16 px (mòbil) ──────────────────────────────────────────────
    suite('Camps de text de 16 px o més en mòbil (iOS no fa zoom en tocar-los)');
    for (const ruta of PAGINES) {
        const page = await obre(browser, base, ruta, { mobil: true });
        await page.waitForTimeout(400);
        const petits = await page.evaluate(() =>
            [
                ...document.querySelectorAll(
                    'input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]), select, textarea'
                ),
            ]
                .filter(el => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0)
                .map(el => ({
                    clau: `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}`,
                    mida: parseFloat(getComputedStyle(el).fontSize),
                }))
                .filter(x => x.mida < 16)
                .map(x => `${x.clau} (${x.mida} px)`)
        );
        ok(petits.length === 0, `${ruta.split('?')[0]}`, petits.join(', '));
        await tanca(page);
    }

    // ── Moviment reduït ─────────────────────────────────────────────────────
    suite('Moviment reduït: amb la preferència activada no hi ha cap animació apreciable');
    const animacionsLlargues = page =>
        page.evaluate(() =>
            document
                .getAnimations()
                .filter(a => a.playState === 'running')
                .map(a => ({
                    nom: a.animationName || a.transitionProperty || '(transició)',
                    durada: a.effect.getComputedTiming().activeDuration,
                }))
                .filter(a => a.durada > 50)
                .map(a => `${a.nom} (${a.durada === Infinity ? 'infinita' : `${Math.round(a.durada)} ms`})`)
        );
    for (const ruta of PAGINES) {
        const page = await obre(browser, base, ruta, { reduit: true, rapid: false });
        await page.waitForTimeout(250);
        const llargues = await animacionsLlargues(page);
        ok(llargues.length === 0, `${ruta.split('?')[0]}`, llargues.slice(0, 5).join(', '));
        await tanca(page);
    }
    {
        // Control: sense la preferència, la icona d'inici s'anima en passar-hi per sobre (així sabem que la prova detecta alguna cosa)
        const page = await obre(browser, base, 'a-enters.html?totaloperations=3', { rapid: false });
        await page.hover('.home-icon-link');
        await page.waitForTimeout(150);
        const llargues = await animacionsLlargues(page);
        ok(
            llargues.length > 0,
            "control: sense la preferència, la icona d'inici s'anima en passar-hi per sobre",
            'La prova no detectaria res!'
        );
        await tanca(page);
    }

    // ── Zones de toc ────────────────────────────────────────────────────────
    suite('Zones de toc de 44 × 44 px en dispositius tàctils (mòbil de 360 px)');
    /** Els controls tocables de la pantalla que fan menys de 44 × 44 px (s'executa dins de la pàgina). */
    const buscaPetits = () =>
        [
            ...document.querySelectorAll(
                'button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=combobox]'
            ),
        ]
            .filter(el => {
                const c = getComputedStyle(el);
                if (c.display === 'none' || c.visibility === 'hidden' || c.pointerEvents === 'none') return false;
                if (el.closest('[aria-hidden="true"]')) return false;
                if (el.disabled) return false; // un control desactivat (p. ex. una maqueta) no es toca
                if (el.tagName === 'A' && c.display === 'inline') return false; // enllaç dins d'un text (WCAG 2.5.8)
                const b = el.getBoundingClientRect();
                return b.width > 0 && b.height > 0;
            })
            .map(el => {
                const b = el.getBoundingClientRect();
                return {
                    clau: `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${typeof el.className === 'string' && el.className ? `.${el.className.trim().split(/\s+/)[0]}` : ''}`,
                    w: Math.round(b.width),
                    h: Math.round(b.height),
                };
            })
            .filter(x => x.w < 44 || x.h < 44)
            .map(x => `${x.clau} ${x.w}×${x.h}`);
    for (const ruta of PAGINES) {
        const page = await obre(browser, base, ruta, { mobil: true });
        await page.waitForTimeout(600);
        const petits = await page.evaluate(buscaPetits);
        ok(petits.length === 0, `${ruta.split('?')[0]}`, petits.join(', '));
        await tanca(page);
    }
    {
        // Les paraules amb imatge de l'ajuda (cada una és un botó) i el botó de la seva targeta (PR 7)
        const page = await obre(browser, base, 'a-enters.html?fixed=A&totaloperations=3&nivell=2', { mobil: true });
        await esperaLliure(page);
        await page.click('.btn-ajuda');
        await page.waitForTimeout(150);
        const n = await page.locator('#help-text .paraula[role=button]').count();
        const ambAjuda = await page.evaluate(buscaPetits);
        ok(
            n === 4 && ambAjuda.length === 0,
            `a-enters amb l'ajuda oberta (${n} paraules tocables)`,
            ambAjuda.join(', ')
        );
        await page.locator('#help-text .paraula').first().tap();
        await page.waitForTimeout(150);
        const ambTargeta = await page.evaluate(buscaPetits);
        ok(ambTargeta.length === 0, "a-enters amb la targeta d'una paraula oberta", ambTargeta.join(', '));
        await tanca(page);
    }
};
