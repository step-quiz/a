/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/navegador/targetes.test.js
 * ROL: «Targetes de vocabulari» (targetes.html, PR 13c-bis) al navegador: la
 *      tria de temes, mida, contingut i color amb la seva vista prèvia i la URL;
 *      la doble cara (la paraula darrere de la seva imatge); la impressió en A4
 *      (cada pàgina del PDF és un full, sense cap pàgina en blanc); i el paper
 *      com al material de step-quiz/pi: cap paraula per sota de 14 pt, res que
 *      surti de la targeta ni de la pàgina, i només grisos en blanc i negre. La
 *      lògica pura té els seus tests a tests/activitats.test.js.
 * ============================================================================
 */
'use strict';
const { suite, ok } = require('../harness');
const { obre, unics } = require('./helpers');

/** Les pàgines d'un PDF (cada pàgina és un «/Type /Page»; «/Type /Pages» és l'arbre). */
const paginesDelPdf = pdf => (pdf.toString('latin1').match(/\/Type\s*\/Page\b(?!s)/g) || []).length;

/** El PDF d'una pàgina, tal com s'imprimiria (la pàgina que fa el CSS), i quantes pàgines té. */
async function pdfDe(browser, base, ruta) {
    const page = await obre(browser, base, ruta, { rapid: false });
    await page.emulateMedia({ media: 'print' });
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
    await page.context().close();
    return {
        pagines: paginesDelPdf(pdf),
        mida: (pdf.toString('latin1').match(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)/) || [])
            .slice(1)
            .map(Number),
    };
}

module.exports = async function ({ browser, base }) {
    suite('Targetes imprimibles: tria de temes, mida, contingut i color, amb la vista prèvia i la URL');
    {
        const p = await obre(browser, base, 'targetes.html', { rapid: false });
        const llegeix = () =>
            p.evaluate(() => ({
                targetes: document.querySelectorAll('.targeta:not(.targeta-buida)').length,
                suma: [...document.querySelectorAll('.opcio-n')].reduce((s, e) => s + Number(e.textContent), 0),
                pagines: document.querySelectorAll('.targetes-full').length,
                temes: document.querySelectorAll('input[name="tema"]').length,
                marcats: document.querySelectorAll('input[name="tema"]:checked').length,
                color: document.getElementById('targetes-pagines').dataset.color,
                resum: document.getElementById('targetes-resum').textContent,
                imprimir: document.getElementById('btn-imprimir').disabled,
                imatges: document.querySelectorAll('.targeta-imatge').length,
                mots: document.querySelectorAll('.targeta-mot').length,
                columnes: getComputedStyle(document.querySelector('.targetes-pagina') || document.body)
                    .gridTemplateColumns.split(' ')
                    .filter(Boolean).length,
                url: location.search,
            }));
        const v = await llegeix();
        ok(
            v.temes >= 20 &&
                v.marcats === v.temes &&
                v.targetes === v.suma &&
                v.pagines === Math.ceil(v.targetes / 9) &&
                v.color === 'bn' &&
                v.resum === `${v.targetes} targetes · ${v.pagines} pàgines` &&
                !v.imprimir &&
                v.url === '',
            `per defecte: els ${v.temes} temes, ${v.targetes} targetes de 9 per pàgina (${v.pagines} pàgines), en blanc i negre i sense res a la URL`
        );
        ok(
            p.errors.length === 0 && p.externes.length === 0,
            `sense errors JS ni peticions externes (${unics(p.errors) || 'cap'})`
        );

        await p.click('#temes-cap');
        const cap = await llegeix();
        ok(
            cap.targetes === 0 && cap.pagines === 0 && cap.imprimir && cap.url === '?temes=' && cap.marcats === 0,
            '«Cap»: res a imprimir, el botó queda desactivat i la URL ho diu (?temes=)'
        );
        await p.check('input[name="tema"][value="mat-figures"]');
        const n = await p.evaluate(() =>
            Number(
                document
                    .querySelector('input[name="tema"][value="mat-figures"]')
                    .closest('label')
                    .querySelector('.opcio-n').textContent
            )
        );
        const un = await llegeix();
        ok(
            un.targetes === n && un.pagines === Math.ceil(n / 9) && un.url === '?temes=mat-figures',
            `un sol tema (figures planes): ${un.resum}, i la URL el recorda (${un.url})`
        );

        await p.check('input[name="mida"][value="4"]');
        const quatre = await llegeix();
        ok(
            quatre.pagines === Math.ceil(n / 4) && quatre.columnes === 2 && quatre.url === '?temes=mat-figures&mida=4',
            `4 per pàgina: ${quatre.resum}, a dues columnes`
        );
        await p.check('input[name="contingut"][value="paraula"]');
        const paraula = await llegeix();
        await p.check('input[name="contingut"][value="imatge"]');
        const imatge = await llegeix();
        const noms = await p.evaluate(() =>
            [...document.querySelectorAll('.targeta:not(.targeta-buida)')].every(t => t.getAttribute('aria-label'))
        );
        ok(
            paraula.imatges === 0 && paraula.mots === n && imatge.mots === 0 && imatge.imatges === n && noms,
            'només la paraula: cap imatge; només la imatge: cap paraula, i cada targeta amb el seu nom accessible'
        );

        await p.check('input[name="contingut"][value="doblecara"]');
        const doble = await llegeix();
        const alineades = await p.evaluate(() => {
            const fulls = [...document.querySelectorAll('.targetes-pagina')];
            const columnes = getComputedStyle(fulls[0]).gridTemplateColumns.split(' ').length;
            const ids = f => [...f.children].map(t => t.dataset.paraula || null);
            let mal = 0;
            for (let i = 0; i < fulls.length; i += 2) {
                const davant = ids(fulls[i]);
                const darrere = ids(fulls[i + 1]);
                davant.forEach((id, k) => {
                    if (id !== darrere[Math.floor(k / columnes) * columnes + (columnes - 1 - (k % columnes))]) mal++;
                });
            }
            return {
                mal,
                davant:
                    fulls[0].querySelectorAll('.targeta-imatge').length > 0 &&
                    fulls[0].querySelectorAll('.targeta-mot').length === 0,
                darrere:
                    fulls[1].querySelectorAll('.targeta-mot').length > 0 &&
                    fulls[1].querySelectorAll('.targeta-imatge').length === 0,
                peu: [...document.querySelectorAll('.targetes-peu')].map(e => e.textContent).slice(0, 2),
            };
        });
        ok(
            doble.pagines === 2 * Math.ceil(n / 4) &&
                alineades.mal === 0 &&
                alineades.davant &&
                alineades.darrere &&
                alineades.peu.join() ===
                    `Targetes de vocabulari · 1 / ${doble.pagines} · davant,Targetes de vocabulari · 2 / ${doble.pagines} · darrere`,
            `doble cara: ${doble.resum} (el davant amb imatges, el darrere amb paraules) i cada paraula darrere de la seva imatge`
        );

        await p.check('input[name="color"][value="color"]');
        const color = await llegeix();
        ok(
            color.color === 'color' && color.url === '?temes=mat-figures&mida=4&contingut=doblecara&color=color',
            `color: la URL porta tot el que s'ha triat (${color.url})`
        );

        // Una URL desada torna a posar tot com estava
        await p.goto(`${base}/targetes.html${color.url}`, { waitUntil: 'load' });
        const tornat = await p.evaluate(() => ({
            mida: document.querySelector('input[name="mida"]:checked').value,
            contingut: document.querySelector('input[name="contingut"]:checked').value,
            color: document.querySelector('input[name="color"]:checked').value,
            temes: [...document.querySelectorAll('input[name="tema"]:checked')].map(i => i.value).join(),
            pagines: document.querySelectorAll('.targetes-full').length,
        }));
        ok(
            tornat.mida === '4' &&
                tornat.contingut === 'doblecara' &&
                tornat.color === 'color' &&
                tornat.temes === 'mat-figures' &&
                tornat.pagines === 2 * Math.ceil(n / 4),
            'una URL desada torna a posar els temes, la mida, el contingut i el color com estaven'
        );
        await p.context().close();

        const panell = await obre(browser, base, 'index.html', { rapid: false });
        await panell.click('.recursos a[href="targetes.html"]');
        await panell.waitForURL(/targetes\.html$/);
        ok(
            (await panell.locator('.targeta').count()) > 0,
            "el panell del professorat porta a les targetes (l'enllaç «Targetes de vocabulari per imprimir»)"
        );
        await panell.click('.home-icon-link');
        await panell.waitForURL(/index\.html$|\/$/);
        ok(
            (await panell.locator('.cd-trigger').count()) === 1,
            'i la icona de les targetes torna al panell del professorat'
        );
        await panell.context().close();
    }

    suite('Targetes imprimibles: impressió en A4 (cada pàgina del PDF és un full, sense cap pàgina en blanc)');
    {
        const p = await obre(browser, base, 'targetes.html?temes=mat-figures', { rapid: false });
        await p.emulateMedia({ media: 'print' });
        const imp = await p.evaluate(() => {
            const full = document.querySelector('.targetes-full').getBoundingClientRect();
            return {
                panell: getComputedStyle(document.getElementById('main-panel')).display,
                titol: getComputedStyle(document.querySelector('.title-row')).display,
                ample: (full.width / 96) * 25.4,
                alt: (full.height / 96) * 25.4,
            };
        });
        ok(
            imp.panell === 'none' &&
                imp.titol === 'none' &&
                Math.abs(imp.ample - 210) < 1 &&
                Math.abs(imp.alt - 296) < 1,
            `en imprimir, el formulari s'amaga i cada pàgina és un full de ${imp.ample.toFixed(0)} × ${imp.alt.toFixed(0)} mm`
        );
        await p.context().close();
        const q = await obre(browser, base, 'targetes.html?temes=mat-figures', { rapid: false });
        const n = await q.evaluate(() => document.querySelectorAll('.targeta:not(.targeta-buida)').length);
        await q.context().close();
        const nou = await pdfDe(browser, base, 'targetes.html?temes=mat-figures');
        const una = await pdfDe(browser, base, 'targetes.html?temes=mat-figures&mida=1');
        const doblecara = await pdfDe(browser, base, 'targetes.html?temes=mat-figures&contingut=doblecara');
        ok(
            nou.pagines === Math.ceil(n / 9) &&
                una.pagines === n &&
                doblecara.pagines === 2 * Math.ceil(n / 9) &&
                Math.abs(nou.mida[0] - 595) < 2 &&
                Math.abs(nou.mida[1] - 842) < 2,
            `PDF en A4: ${n} targetes → ${nou.pagines} pàgines de 9, ${una.pagines} d'una i ${doblecara.pagines} a doble cara (cap pàgina en blanc)`
        );
    }

    suite(
        'Targetes imprimibles: el paper (lletra de 14 pt o més, res que surti de la targeta, només grisos en blanc i negre)'
    );
    {
        for (const mida of [1, 4, 9]) {
            const p = await obre(browser, base, `targetes.html?mida=${mida}`, { rapid: false, w: 794, h: 1123 });
            await p.emulateMedia({ media: 'print' });
            const r = await p.evaluate(() => {
                const dins = (a, b, tol = 1.5) =>
                    a.left >= b.left - tol &&
                    a.right <= b.right + tol &&
                    a.top >= b.top - tol &&
                    a.bottom <= b.bottom + tol;
                const res = { n: 0, minPt: Infinity, pitjor: '', fora: [], vessa: [], peus: 0 };
                for (const targeta of document.querySelectorAll('.targeta:not(.targeta-buida)')) {
                    const caixa = targeta.getBoundingClientRect();
                    const mot = targeta.querySelector('.targeta-mot');
                    res.n++;
                    if (mot) {
                        const pt = parseFloat(getComputedStyle(mot).fontSize) * 0.75;
                        if (pt < res.minPt) {
                            res.minPt = pt;
                            res.pitjor = mot.textContent;
                        }
                        const rang = document.createRange();
                        rang.selectNodeContents(mot);
                        if ([...rang.getClientRects()].some(rc => !dins(rc, caixa))) res.fora.push(mot.textContent);
                    }
                    for (const e of targeta.querySelectorAll('.targeta-imatge *')) {
                        const rc = e.getBoundingClientRect();
                        if (rc.width && !dins(rc, caixa)) {
                            res.fora.push(targeta.dataset.paraula);
                            break;
                        }
                    }
                    const cos = targeta.querySelector('.targeta-cos');
                    if (cos.scrollWidth > cos.clientWidth + 1 || cos.scrollHeight > cos.clientHeight + 1)
                        res.vessa.push(targeta.dataset.paraula);
                }
                for (const f of document.querySelectorAll('.targetes-full')) {
                    const base = f.getBoundingClientRect();
                    for (const e of f.querySelectorAll('*'))
                        if (!dins(e.getBoundingClientRect(), base, 2)) res.fora.push('pàgina');
                    res.peus += f.querySelector('.targetes-peu') ? 1 : 0;
                }
                return res;
            });
            ok(
                r.n >= 200 && r.minPt >= 14 && r.fora.length === 0 && r.vessa.length === 0,
                `${mida} per pàgina: ${r.n} targetes, la paraula més petita fa ${r.minPt.toFixed(1)} pt («${r.pitjor}»; el mínim és 14), res no surt de la targeta ni de la pàgina`,
                `Fora: ${unics(r.fora)}\nVessa: ${r.vessa.join(', ')}`
            );
            await p.context().close();
        }

        // Blanc i negre estricte: cap color que no sigui un gris (l'emoji és una imatge i es porta a gris amb un filtre)
        const cromatic = bn => {
            const page = obre(browser, base, `targetes.html?color=${bn}&mida=9`, { rapid: false });
            return page.then(async p => {
                const r = await p.evaluate(() => {
                    const gris = c => {
                        const m = c && c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
                        if (!m || (m[4] !== undefined && Number(m[4]) === 0)) return true;
                        return Math.max(m[1], m[2], m[3]) - Math.min(m[1], m[2], m[3]) <= 2;
                    };
                    const mals = new Set();
                    for (const e of document.querySelectorAll('#targetes-pagines *')) {
                        if (e.closest('.targeta-emoji')) continue;
                        const cs = getComputedStyle(e);
                        const colors = [cs.color, cs.backgroundColor];
                        if (parseFloat(cs.borderTopWidth) > 0) colors.push(cs.borderTopColor);
                        if (cs.outlineStyle !== 'none') colors.push(cs.outlineColor);
                        if (e instanceof SVGElement) colors.push(cs.fill, cs.stroke);
                        if (colors.some(c => !gris(c)))
                            mals.add(`${e.tagName.toLowerCase()}.${(e.getAttribute('class') || '').split(' ')[0]}`);
                    }
                    return [...mals];
                });
                await p.context().close();
                return r;
            });
        };
        const enBn = await cromatic('bn');
        const enColor = await cromatic('color');
        ok(
            enBn.length === 0 && enColor.length > 0,
            `en blanc i negre, cap color que no sigui un gris (en color, sí: ${enColor.slice(0, 3).join(', ')}…)`,
            `En blanc i negre porten color: ${enBn.join(', ')}`
        );
    }

    suite('Targetes imprimibles: mòbil (el formulari i la vista prèvia no desborden)');
    {
        const p = await obre(browser, base, 'targetes.html', { mobil: true, w: 360, h: 700 });
        const d = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
        ok(d[0] <= d[1], `a 360 px, no desborda (${d[0]} ≤ ${d[1]})`);
        await p.context().close();
    }
};
