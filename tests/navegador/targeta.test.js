/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/navegador/targeta.test.js
 * ROL: «Aprèn la paraula» (PR 7): un toc a una paraula amb imatge n'obre la
 *      targeta (la imatge gran i la paraula, sense àudio). Es prova amb
 *      a-enters, amb l'ajuda oberta: ratolí, teclat (Intro i Espai no han
 *      d'enviar la resposta), toc en un mòbil de 320, 360 i 390 px, el focus,
 *      el distintiu «paraula nova» (i que es recordi, o no falli si el navegador
 *      no deixa recordar res) i que no hi hagi errors.
 *      A-enters amb `?fixed=A` fa sempre les mateixes preguntes; la primera és
 *      «−8 + 5»: «Si estic al soterrani 8 i pujo 5 pisos, en quin pis acabo?»,
 *      és a dir, les píndoles soterrani, pujar, pis i pis.
 * ============================================================================
 */
'use strict';
const { suite, ok } = require('../harness');
const { obre, estat, esperaLliure, responLliure, unics } = require('./helpers');

const RUTA = 'a-enters.html?fixed=A&totaloperations=6&nivell=2&maxintents=4';
const CLAU = 'a2-paraules-vistes';

/** Obre a-enters amb l'ajuda oberta a la primera pregunta. */
async function ambAjuda(browser, base, opcions = {}) {
    const page = await obre(browser, base, RUTA, opcions);
    await esperaLliure(page);
    await page.click('.btn-ajuda');
    return page;
}

/** La píndola número `n` de l'ajuda. */
const pindola = (page, n) => page.locator('#help-text .paraula').nth(n);

/** El que mostra la targeta ara mateix (tot en una sola lectura). */
const targeta = page =>
    page.evaluate(() => {
        const d = document.querySelector('dialog.targeta-paraula');
        const r = d.getBoundingClientRect();
        const img = d.querySelector('.targeta-img');
        const svg = img.querySelector('svg');
        const pl = d.querySelector('.targeta-plural');
        const ok = d.querySelector('.targeta-ok');
        const okR = ok.getBoundingClientRect();
        return {
            oberta: d.open,
            nom: d.querySelector('.targeta-nom').textContent,
            plural: pl.hidden ? '' : pl.textContent,
            pluralAmagat: pl.getBoundingClientRect().height === 0,
            svg: svg ? Math.round(svg.getBoundingClientRect().width) : 0,
            mat: !!img.querySelector('.mat'),
            emoji: svg ? '' : img.textContent,
            lletraImatge: parseFloat(getComputedStyle(img).fontSize),
            dinsFinestra: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
            centrada: Math.abs((r.left + r.right) / 2 - innerWidth / 2) <= 1,
            focusAlOk: document.activeElement === ok,
            focusDins: d.contains(document.activeElement),
            ok: { w: Math.round(okR.width), h: Math.round(okR.height) },
            sw: document.documentElement.scrollWidth,
            iw: innerWidth,
        };
    });

/** Les píndoles de l'ajuda: la paraula, si porten el distintiu «paraula nova» i la seva alçada. */
const estatPindoles = page =>
    page.evaluate(() =>
        [...document.querySelectorAll('#help-text .paraula')].map(p => ({
            id: p.dataset.paraula,
            nova: p.classList.contains('paraula-nova'),
            h: Math.round(p.getBoundingClientRect().height),
        }))
    );

const oberta = page => page.evaluate(() => document.querySelector('dialog.targeta-paraula').open);

module.exports = async function ({ browser, base }) {
    suite('Aprèn la paraula: un clic a una paraula amb imatge obre la targeta (escriptori)');
    {
        const page = await ambAjuda(browser, base);
        ok(!(await oberta(page)), 'la targeta és tancada mentre ningú no toca cap paraula');
        const ids = (await estatPindoles(page)).map(p => p.id).join();
        ok(ids === 'soterrani,pujar,pis,pis', `les píndoles de la primera pregunta: ${ids}`);

        await pindola(page, 0).click();
        let t = await targeta(page);
        ok(t.oberta && t.nom === 'el soterrani' && t.plural === 'els soterranis', `un nom: «${t.nom}» i «${t.plural}»`);
        ok(
            t.svg >= 100 && t.dinsFinestra && t.centrada,
            `el pictograma és gran (${t.svg} px) i la targeta és al centre`
        );
        ok(t.focusAlOk, 'el focus entra a la targeta, al botó «OK»');
        const nomAccessible = await page.locator('dialog').ariaSnapshot();
        ok(
            /^- dialog "el soterrani":/.test(nomAccessible) && !/img|image|svg/i.test(nomAccessible),
            `la targeta té nom («el soterrani») i la imatge no és per als lectors de pantalla: ${JSON.stringify(nomAccessible)}`
        );
        // La resta de la pàgina queda inactiva (mode modal): el camp de resposta no pot prendre el focus
        const focusDetras = await page.evaluate(() => {
            document.getElementById('value-input').focus();
            return document.activeElement.id === 'value-input';
        });
        ok(!focusDetras, 'mentre la targeta és oberta, el joc de darrere no es pot tocar (mode modal)');

        // Tancar amb «OK»
        await page.click('.targeta-ok');
        ok(!(await oberta(page)), 'amb «OK» es tanca');

        // Un verb: l'infinitiu i la seva fletxa, sense plural
        await pindola(page, 1).click();
        t = await targeta(page);
        ok(
            t.oberta && t.nom === 'pujar' && t.plural === '' && t.svg === 0 && t.emoji === '⬆️' && t.lletraImatge >= 64,
            `un verb: «${t.nom}», sense plural, amb ${t.emoji} gran (${t.lletraImatge} px)`
        );
        ok(t.pluralAmagat, 'un verb no té plural: no queda cap línia buida a la targeta');
        const arbreVerb = await page.locator('dialog').ariaSnapshot();
        ok(
            /^- dialog "pujar":/.test(arbreVerb) && !arbreVerb.includes('⬆️'),
            `l'emoji de la targeta tampoc no és per als lectors de pantalla: ${JSON.stringify(arbreVerb)}`
        );
        // Tancar amb Esc
        await page.keyboard.press('Escape');
        ok(!(await oberta(page)), 'amb Esc es tanca');

        // Una altra paraula: el contingut es posa al dia (no es queda amb el de l'anterior)
        await pindola(page, 2).click();
        t = await targeta(page);
        ok(t.oberta && t.nom === 'el pis' && t.plural === 'els pisos' && t.svg >= 100, `«${t.nom}», «${t.plural}»`);
        // Tancar tocant fora de la targeta
        await page.mouse.click(5, 5);
        ok(!(await oberta(page)), 'tocant fora de la targeta es tanca');
        // I tocar a dins (a la imatge) no la tanca
        await pindola(page, 3).click();
        const r = await page.evaluate(() => document.querySelector('.targeta-img').getBoundingClientRect().toJSON());
        await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
        ok(await oberta(page), 'tocar la imatge de la targeta no la tanca');
        await page.click('.targeta-ok');

        // Tornar a la pregunta: ningú no ha enviat res
        const e = await estat(page);
        ok(
            e.attemptsLeft === 4 && e.currentOperation === 0 && e.sessionScore === 0,
            'obrir i tancar targetes no gasta intents ni canvia la pregunta ni els punts'
        );
        ok(page.errors.length === 0, `sense errors JS (${unics(page.errors) || 'cap'})`);
        ok(
            page.fallades.length === 0 && page.externes.length === 0,
            'cap petició fallida ni externa',
            unics(page.fallades)
        );
        await page.context().close();
    }

    suite("Aprèn la paraula: el teclat (Intro i Espai no han d'enviar la resposta que hi ha escrita)");
    {
        // Una finestra baixa, perquè la pàgina es pugui fer lliscar i es vegi si Espai la fa lliscar
        const page = await ambAjuda(browser, base, { h: 420 });
        ok(
            await page.evaluate(() => document.documentElement.scrollHeight > innerHeight + 60),
            "la finestra és prou baixa perquè la pàgina es pugui fer lliscar (si no, la prova d'Espai no tindria sentit)"
        );
        // Es posa una resposta errònia al camp: si Intro l'enviés, es gastaria un intent
        await page.evaluate(() => {
            document.getElementById('value-input').value = '99';
        });
        // Es va fins a la primera píndola amb el tabulador
        await page.focus('#value-input');
        let enPindola = false;
        for (let i = 0; i < 12 && !enPindola; i++) {
            await page.keyboard.press('Tab');
            enPindola = await page.evaluate(() => document.activeElement.classList.contains('paraula'));
        }
        ok(enPindola, 'es pot arribar a una paraula amb el tabulador');
        const contorn = await page.evaluate(() => {
            const c = getComputedStyle(document.activeElement);
            return { estil: c.outlineStyle, ample: parseFloat(c.outlineWidth) };
        });
        ok(
            contorn.estil !== 'none' && contorn.ample >= 2,
            `la paraula amb el focus es nota (contorn ${contorn.estil} de ${contorn.ample} px)`
        );
        const id = await page.evaluate(() => document.activeElement.dataset.paraula);

        await page.keyboard.press('Enter');
        let t = await targeta(page);
        ok(t.oberta && t.focusAlOk, `Intro a una paraula n'obre la targeta («${t.nom}») i el focus entra a «OK»`);
        await page.keyboard.press('Enter');
        ok(!(await oberta(page)), 'Intro a «OK» la tanca');
        const tornaALaPindola = await page.evaluate(() => document.activeElement.dataset.paraula);
        ok(tornaALaPindola === id, `en tancar-la, el focus torna a la paraula (${tornaALaPindola})`);
        let e = await estat(page);
        ok(
            e.attemptsLeft === 4 &&
                e.currentOperation === 0 &&
                (await page.inputValue('#value-input')) === '99' &&
                !e.ocupat,
            "l'Intro de la targeta no ha enviat la resposta (cap intent gastat, el camp conserva el «99»)"
        );

        // Espai obre la targeta sense fer lliscar la pàgina; Espai a «OK» la tanca
        const scrollAbans = await page.evaluate(() => scrollY);
        await page.keyboard.press(' ');
        t = await targeta(page);
        ok(t.oberta, 'Espai a una paraula també obre la targeta');
        const scrollDurant = await page.evaluate(() => scrollY);
        await page.keyboard.press(' ');
        ok(!(await oberta(page)), 'Espai a «OK» la tanca');
        const scrollDespres = await page.evaluate(() => scrollY);
        ok(
            scrollDurant === scrollAbans && scrollDespres === scrollAbans,
            `Espai no fa lliscar la pàgina (${scrollAbans} → ${scrollDurant} → ${scrollDespres})`
        );

        // Esc tanca i tampoc no envia res
        await page.keyboard.press('Enter');
        await page.keyboard.press('Escape');
        e = await estat(page);
        ok(!(await oberta(page)) && e.attemptsLeft === 4, 'Esc tanca la targeta sense enviar res');

        // Una altra tecla que no sigui Intro ni Espai no fa res a una paraula
        await page.keyboard.press('a');
        ok(!(await oberta(page)), 'una altra tecla a una paraula no obre res');
        // Fora de les paraules, Intro continua enviant la resposta com sempre
        await page.focus('#value-input');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(80);
        e = await estat(page);
        ok(e.attemptsLeft === 3, 'fora de les paraules, Intro continua enviant la resposta (queden 3 intents)');
        ok(page.errors.length === 0, `sense errors JS (${unics(page.errors) || 'cap'})`);
        await page.context().close();
    }

    suite('Aprèn la paraula: en tancar la targeta, es continua escrivint on es era (escriptori)');
    {
        const page = await ambAjuda(browser, base);
        await page.click('#value-input');
        await page.keyboard.type('7');
        await pindola(page, 2).click();
        await page.click('.targeta-ok');
        // El focus torna quan el navegador avisa que la targeta s'ha tancat (una passa més tard)
        await page
            .waitForFunction(() => document.activeElement.id === 'value-input', null, { timeout: 2000 })
            .catch(() => {});
        const focus = await page.evaluate(() => ({
            id: document.activeElement.id,
            valor: document.getElementById('value-input').value,
        }));
        ok(
            focus.id === 'value-input' && focus.valor === '7',
            `el focus torna al camp de resposta, amb «${focus.valor}»`
        );
        await page.keyboard.type('5');
        ok((await page.inputValue('#value-input')) === '75', 'i es pot continuar escrivint («75»)');
        await page.context().close();
    }

    suite('Aprèn la paraula: el distintiu «paraula nova»');
    {
        const page = await ambAjuda(browser, base);
        let p = await estatPindoles(page);
        ok(
            p.every(x => x.nova),
            'a la primera visita, totes les paraules són noves (porten el distintiu)'
        );
        const punt = await page.evaluate(() => {
            const c = getComputedStyle(document.querySelector('.paraula-nova'), '::after');
            return { contingut: c.content, w: c.width, fons: c.backgroundColor };
        });
        ok(
            punt.contingut === '""' && punt.w === '12px' && punt.fons !== 'rgba(0, 0, 0, 0)',
            `el distintiu és un punt de color, sense text (${punt.contingut}, ${punt.w}, ${punt.fons})`
        );

        await pindola(page, 2).click(); // «pis»
        await page.click('.targeta-ok');
        p = await estatPindoles(page);
        ok(
            p.map(x => `${x.id}:${x.nova ? 'nova' : 'vista'}`).join() ===
                'soterrani:nova,pujar:nova,pis:vista,pis:vista',
            `en obrir la targeta de «pis», totes les «pis» deixen de ser noves: ${p.map(x => `${x.id}:${x.nova ? 'nova' : 'vista'}`).join()}`
        );
        ok(
            (await page.evaluate(k => localStorage.getItem(k), CLAU)) === '["pis"]',
            'es recorda al navegador (localStorage)'
        );

        // Una pregunta nova: l'ajuda torna a sortir amb «pis» ja vista i la resta noves
        await page.click('.btn-ajuda'); // tanca l'ajuda
        await responLliure(page, 'int', true);
        await esperaLliure(page);
        await page.click('.btn-ajuda');
        p = await estatPindoles(page);
        ok(
            p.filter(x => x.id === 'pis').every(x => !x.nova) && p.filter(x => x.id !== 'pis').every(x => x.nova),
            'a la pregunta següent, «pis» continua vista i les altres paraules són noves (el distintiu va amb la paraula, no amb la píndola)'
        );

        // Una visita nova (es torna a carregar la pàgina): es recorda
        await page.reload({ waitUntil: 'load' });
        await esperaLliure(page);
        await page.click('.btn-ajuda');
        p = await estatPindoles(page);
        ok(
            p.filter(x => x.id === 'pis').every(x => !x.nova) && p.filter(x => x.id !== 'pis').every(x => x.nova),
            'en tornar a carregar la pàgina, «pis» continua vista'
        );
        ok(page.errors.length === 0, `sense errors JS (${unics(page.errors) || 'cap'})`);
        await page.context().close();

        // Dades desades trencades: com si no hi hagués res, sense errors
        const trencat = await obre(browser, base, RUTA, {
            init: () => localStorage.setItem('a2-paraules-vistes', 'això no és JSON'),
        });
        await esperaLliure(trencat);
        await trencat.click('.btn-ajuda');
        ok(
            (await estatPindoles(trencat)).every(x => x.nova) && trencat.errors.length === 0,
            `dades desades trencades: totes noves i sense errors (${unics(trencat.errors) || 'cap'})`
        );
        await trencat.context().close();

        // Un navegador que no deixa fer servir localStorage (mode privat, dades bloquejades)
        const bloquejat = await obre(browser, base, RUTA, {
            init: () =>
                Object.defineProperty(window, 'localStorage', {
                    get() {
                        throw new DOMException('bloquejat', 'SecurityError');
                    },
                }),
        });
        await esperaLliure(bloquejat);
        await bloquejat.click('.btn-ajuda');
        await pindola(bloquejat, 2).click();
        const tb = await targeta(bloquejat);
        await bloquejat.click('.targeta-ok');
        const pb = await estatPindoles(bloquejat);
        ok(
            tb.oberta &&
                tb.nom === 'el pis' &&
                pb.filter(x => x.id === 'pis').every(x => !x.nova) &&
                bloquejat.errors.length === 0,
            `sense localStorage: la targeta funciona, la paraula queda vista mentre la pàgina és oberta i no hi ha errors (${unics(bloquejat.errors) || 'cap'})`
        );
        await bloquejat.context().close();
    }

    suite('Aprèn la paraula: la targeta de cada paraula amb imatge del lèxic (emoji o pictograma)');
    {
        const page = await obre(browser, base, RUTA);
        await esperaLliure(page);
        // Una píndola de cada paraula amb imatge, a la pàgina, i el que n'ha de dir la targeta segons el lèxic
        const esperades = await page.evaluate(async () => {
            const m = await import('./js/lexicon/paraula.js');
            const t = await import('./js/lexicon/targeta.js');
            const d = await import('./js/lexicon/dades.js');
            const ids = d.LEXIC.filter(e => e.imatge).map(e => e.id);
            const c = document.createElement('div');
            c.id = 'prova-pindoles';
            c.style.cssText = 'position:absolute;top:0;left:0;background:#fff;z-index:1';
            c.innerHTML = ids.map(id => m.paraula(id)).join(' ');
            document.body.appendChild(c);
            return ids.map(id => {
                const x = t.contingutTargeta(id);
                return {
                    id,
                    nom: x.nom,
                    plural: x.plural,
                    svg: x.imatge.startsWith('<svg') || x.imatge.includes('<svg'),
                    mates: x.imatge.includes('class="mat'),
                    emoji: x.imatge,
                };
            });
        });
        const problemes = [];
        for (const e of esperades) {
            await page.locator(`#prova-pindoles .paraula[data-paraula="${e.id}"]`).click();
            const t = await targeta(page);
            if (!t.oberta) problemes.push(`${e.id}: no s'obre`);
            else {
                if (t.nom !== e.nom) problemes.push(`${e.id}: nom «${t.nom}» (esperat «${e.nom}»)`);
                if (t.plural !== e.plural) problemes.push(`${e.id}: plural «${t.plural}» (esperat «${e.plural}»)`);
                if (e.mates) {
                    // Un mini-exemple o un dibuix de matemàtiques: ha de ser a la targeta, i un dibuix, prou gran
                    if (!t.mat || (e.svg && t.svg < 100))
                        problemes.push(
                            `${e.id}: imatge de matemàtiques (${t.mat ? `SVG de ${t.svg} px` : 'no hi és'})`
                        );
                } else if (e.svg ? t.svg < 100 : t.emoji !== e.emoji || t.lletraImatge < 64)
                    problemes.push(`${e.id}: imatge ${e.svg ? `SVG de ${t.svg} px` : `«${t.emoji}»`}`);
                if (!t.dinsFinestra) problemes.push(`${e.id}: la targeta surt de la finestra`);
            }
            await page.keyboard.press('Escape');
        }
        ok(
            problemes.length === 0 && esperades.length >= 24,
            `${esperades.length} paraules amb imatge: totes obren la targeta amb el nom, el plural i la imatge gran que toquen`,
            problemes.slice(0, 5).join(' ; ')
        );
        ok(page.errors.length === 0, `sense errors JS (${unics(page.errors) || 'cap'})`);
        await page.context().close();
    }

    suite('Aprèn la paraula: toc en un mòbil (320, 360 i 390 px)');
    for (const w of [320, 360, 390]) {
        const page = await ambAjuda(browser, base, { mobil: true, w, h: 700 });
        const p = await estatPindoles(page);
        ok(
            p.length === 4 && p.every(x => x.h >= 44),
            `@${w}: les 4 paraules fan ≥ 44 px d'alt (zona de toc): ${p.map(x => x.h).join(', ')}`
        );

        await pindola(page, 0).tap();
        let t = await targeta(page);
        ok(
            t.oberta && t.nom === 'el soterrani' && t.svg >= 100 && t.dinsFinestra && t.centrada && t.sw <= t.iw,
            `@${w}: un toc obre la targeta, sencera dins de la finestra i sense desbordar (${t.svg} px)`
        );
        ok(t.ok.w >= 44 && t.ok.h >= 44, `@${w}: el botó «OK» fa ${t.ok.w}×${t.ok.h} px`);
        await page.locator('.targeta-ok').tap();
        ok(!(await oberta(page)), `@${w}: «OK» la tanca`);

        await pindola(page, 1).tap();
        t = await targeta(page);
        ok(
            t.oberta && t.nom === 'pujar' && t.emoji === '⬆️' && t.dinsFinestra,
            `@${w}: un verb: «${t.nom}» ${t.emoji}`
        );
        await page.touchscreen.tap(4, 4);
        ok(!(await oberta(page)), `@${w}: tocant fora es tanca`);

        // El teclat numèric continua funcionant després de mirar una paraula
        await pindola(page, 2).tap();
        await page.locator('.targeta-ok').tap();
        const teclat = await page.evaluate(() =>
            document.getElementById('customKeyboard').classList.contains('kb-visible')
        );
        await page.evaluate(() => {
            document
                .querySelector('#customKeyboard .kb-btn[data-key="1"]')
                .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
        });
        ok(
            teclat && (await page.inputValue('#value-input')) === '1',
            `@${w}: el teclat numèric continua visible i escriu després de mirar una paraula`
        );
        ok(page.errors.length === 0, `@${w}: sense errors JS (${unics(page.errors) || 'cap'})`);
        await page.context().close();
    }

    suite('Aprèn la paraula: alt contrast del sistema i moviment reduït');
    {
        const page = await ambAjuda(browser, base, { reduit: true });
        await page.emulateMedia({ forcedColors: 'active' });
        const punt = await page.evaluate(() => {
            const c = getComputedStyle(document.querySelector('.paraula-nova'), '::after');
            return { fons: c.backgroundColor, vora: c.borderTopColor };
        });
        ok(
            punt.fons !== 'rgba(0, 0, 0, 0)' && punt.fons !== punt.vora,
            `alt contrast: el punt de «paraula nova» es veu (${punt.fons} sobre vora ${punt.vora})`
        );
        await pindola(page, 0).click();
        const t = await targeta(page);
        ok(
            t.oberta && t.nom === 'el soterrani' && t.svg >= 100,
            "alt contrast i moviment reduït: la targeta s'obre igualment"
        );
        await page.context().close();
    }
};
