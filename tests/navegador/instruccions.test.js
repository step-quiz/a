/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/navegador/instruccions.test.js
 * ROL: La INSTRUCCIÓ de cada pregunta («Escriu el resultat.»): totes les activitats diuen què cal fer, amb la
 *      frase que toca a cada nivell i a cada tipus de pregunta, sempre al mateix lloc (sota la capçalera) i sense
 *      que la pàgina desbordi en mòbil. Els textos són a js/<activitat>/textos.js; mostraInstruccio() és a
 *      js/game-core.js. Les frases d'aquí són les que el professorat va validar: si una canvia, ha de canviar aquí.
 * ============================================================================
 */
'use strict';
const { suite, ok } = require('../harness');
const { obre, estat, esperaLliure, respon: responHelper, unics } = require('./helpers');

const RUTA = (pagina, nivell, extra = '') =>
    `${pagina}.html?${nivell ? `nivell=${nivell}&` : ''}totalsessions=1&totaloperations=3&maxintents=3${extra}`;

/** La instrucció que es veu ara: { text, nota, visible, desprésDeLaCapçalera, negreta }. */
const llegeix = page =>
    page.evaluate(() => {
        const el = document.getElementById('instruccio');
        if (!el) return null;
        const nota = el.querySelector('.instruccio-nota');
        const r = el.getBoundingClientRect();
        return {
            text: nota ? el.textContent.slice(0, el.textContent.length - nota.textContent.length) : el.textContent,
            nota: nota ? nota.textContent : '',
            visible: !el.hidden && r.width > 0 && r.height > 0,
            desprésDeLaCapçalera:
                !!el.previousElementSibling && el.previousElementSibling.classList.contains('header-info'),
            negreta: Number(getComputedStyle(el).fontWeight) >= 600,
        };
    });

/** Torna a generar la pregunta (com fa el motor en passar a la següent) `n` vegades i en recull l'estat i la instrucció. */
const mostra = (page, n, preparar = '') =>
    page.evaluate(
        async ([n, preparar]) => {
            const sortida = [];
            const m = await import('/js/game-core.js');
            for (let i = 0; i < n; i++) {
                if (preparar === 'rota') m.state.currentOperation = i % 3;
                window.buildLevel();
                sortida.push({
                    e: window.__prova(),
                    text: document.getElementById('instruccio').textContent,
                    xipsDia: document.querySelectorAll('.xip-dia').length,
                });
            }
            return sortida;
        },
        [n, preparar]
    );

module.exports = async function ({ browser, base }) {
    suite('Instruccions: cada activitat i cada nivell diu què cal fer, sempre al mateix lloc');
    {
        // [pàgina, nivells, frase esperada (text o funció de l'estat)]
        const UNA = [
            ['a-area-perimetre', [1, 2, 3], "Escriu l'àrea i el perímetre."],
            ['a-enters', [1, 2], 'Escriu el resultat.'],
            ['a-equacions', [1, 2, 3, 4], 'Escriu el valor de x.'],
            ['a-mcd-mcm', [1, 2, 3], 'Escriu el MCD.'],
            ['a-nombres-lletres', [1, 2, 3, 4], 'Tria el nom del nombre.'],
            ['a-proporciodirecta', [1, 2, 3], 'Escriu el preu.'],
            ['a-rellotge', [1, 2, 3], "Escriu l'hora."],
            ['a-prioritat', [1, 2, 3, 4], 'Escull quina operació es fa en primer lloc.'],
            ['a-factoritzar', [1, 2, 3], 'Escriu dos factors.'],
            ['a-decimals', [1, 2], 'Escriu el canvi.'],
            ['a-decimals', [3], 'Escriu el total.'],
            ['a-triangle-rectangle', [1, 2, 3], e => `Tria la mesura del costat ${e.problema.find}.`],
            ['a-vocabulari', [1], 'Tria la paraula.'],
            ['a-vocabulari', [2], 'Tria la imatge.'],
            ['a-vocabulari', [3], 'Escriu la paraula.'],
            [
                'a-potencies',
                [1, 2, 3, 4],
                e => (e.pregunta.kind === 'exp' ? "Escriu l'exponent." : 'Escriu el resultat.'),
            ],
            [
                'a-fraccions',
                [1, 2, 3, 4],
                e =>
                    ({
                        den: 'Escriu un denominador comú.',
                        resultat: 'Escriu el resultat.',
                        inversa: 'Escriu la fracció inversa.',
                    })[e.pas],
            ],
        ];
        for (const [pagina, nivells, esperada] of UNA) {
            for (const nivell of nivells) {
                const page = await obre(browser, base, RUTA(pagina, nivell), { mobil: true });
                await esperaLliure(page);
                const e = await estat(page);
                const i = await llegeix(page);
                const frase = typeof esperada === 'function' ? esperada(e) : esperada;
                const desborda = await page.evaluate(
                    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
                );
                ok(
                    i && i.text === frase && i.visible && i.desprésDeLaCapçalera && i.negreta && !desborda,
                    `${pagina} nivell ${nivell}: «${i && i.text}»${i && i.visible ? '' : ' (no es veu)'}${desborda ? ' (desborda en mòbil)' : ''}`,
                    `s'esperava «${frase}»`
                );
                ok(
                    page.errors.length === 0 && page.externes.length === 0,
                    `${pagina} nivell ${nivell}: sense errors JS ni peticions externes (${unics(page.errors) || 'cap'})`
                );
                await page.context().close();
            }
        }
    }

    suite('Instruccions: Coordenades diu la frase de cada tipus de pregunta');
    for (const nivell of [1, 2, 3]) {
        const page = await obre(browser, base, RUTA('a-pla-cartesia', nivell));
        await esperaLliure(page);
        const veus = await mostra(page, 300);
        const vistes = new Set();
        const dolentes = [];
        for (const { e, text } of veus) {
            const p = e.pregunta;
            const quadrantOEix =
                nivell >= 3 ? `On és el punt ${p.etiqueta}?` : `En quin quadrant és el punt ${p.etiqueta}?`;
            const esperada = {
                'situa': `Marca on és el punt ${p.etiqueta}.`,
                'coordenades': `Escriu les coordenades del punt ${p.etiqueta}.`,
                'quadrant': quadrantOEix,
                'al-quadrant':
                    p.lloc === 'origen'
                        ? "Escriu les coordenades de l'origen."
                        : p.lloc === 'eixX' || p.lloc === 'eixY'
                          ? 'Escriu un punt que estigui en aquest eix.'
                          : 'Escriu un punt que estigui en aquest quadrant.',
            }[p.tipus];
            vistes.add(esperada.replace(p.etiqueta, 'X'));
            if (text !== esperada) dolentes.push(`${p.tipus}/${p.lloc}: «${text}» (esperada «${esperada}»)`);
        }
        const distintes = { 1: 4, 2: 4, 3: 6 }[nivell]; // nivell 3: 4 tipus, però «al quadrant» són 3 frases (quadrant, eix, origen)
        ok(
            dolentes.length === 0,
            `nivell ${nivell}: 300 preguntes, cada una amb la seva frase`,
            dolentes.slice(0, 3).join('\n')
        );
        ok(vistes.size === distintes, `nivell ${nivell}: han sortit les ${distintes} frases (${vistes.size})`);
        await page.context().close();
    }

    suite('Instruccions: Temperatura canvia «fa», «feia» i «farà» segons el dia');
    {
        const page = await obre(browser, base, RUTA('a-recta-numerica', 3));
        await esperaLliure(page);
        const veus = await mostra(page, 300);
        const vistes = new Set();
        const dolentes = [];
        for (const { e, text, xipsDia } of veus) {
            const p = e.pregunta;
            const temp = p.y < 0 ? `−${Math.abs(p.y)} ºC` : `${p.y} ºC`;
            let esperada;
            if (p.tipus === 'Q3') esperada = `Quants dies fa ${temp}?`;
            else if (p.tipus === 'Q4') esperada = `Quin dia fa més ${p.extrem === 'calent' ? 'calor' : 'fred'}?`;
            else if (p.x === 0) esperada = 'Quina temperatura fa avui?';
            else if (p.x === -1) esperada = 'Quina temperatura feia ahir?';
            else if (p.x === 1) esperada = 'Quina temperatura farà demà?';
            else if (p.x === -2) esperada = "Fa 2 dies, o sigui abans-d'ahir, quina temperatura feia?";
            else if (p.x === 2) esperada = "D'aquí 2 dies, o sigui demà-passat, quina temperatura farà?";
            else if (p.x < 0) esperada = `Fa ${-p.x} dies, quina temperatura feia?`;
            else esperada = `D'aquí ${p.x} dies, quina temperatura farà?`;
            vistes.add(esperada.replace(/−?\d+ ºC/, 'N ºC').replace(/(Fa|aquí) [345] dies/, '$1 N dies'));
            // Quan es demana la temperatura d'un dia no hi ha xip de dia (el calendari): només el termòmetre
            if ((p.tipus === 'Q1' || p.tipus === 'Q2') && xipsDia !== 0)
                dolentes.push(`${p.tipus}/${p.x}: encara hi ha el xip del dia`);
            if (text !== esperada) dolentes.push(`${p.tipus}/${p.x}: «${text}» (esperada «${esperada}»)`);
        }
        ok(dolentes.length === 0, '300 preguntes, cada una amb la seva frase', dolentes.slice(0, 3).join('\n'));
        ok(vistes.size === 10, `han sortit les 10 frases (${vistes.size}: ${[...vistes].join(' | ')})`);
        await page.context().close();
    }

    suite('Instruccions: Ordenar enters diu la frase de cada repte i Potències la de cada pregunta');
    {
        const page = await obre(browser, base, RUTA('a-enters-ordenar', 0));
        await esperaLliure(page);
        const veus = await mostra(page, 9, 'rota');
        const dolentes = [];
        for (const { e, text } of veus) {
            const esperada = { 1: 'Tria el signe: < o >.', 2: 'Escriu un nombre entre els dos.' }[e.tipus];
            const ok3 = new RegExp(`^Toca els nombres menors que \\(?-?${Math.abs(e.repte.r)}\\)?\\.$`);
            if (e.tipus === 3 ? !ok3.test(text) : text !== esperada) dolentes.push(`repte ${e.tipus}: «${text}»`);
        }
        ok(dolentes.length === 0, 'els tres reptes diuen: signe, entre i menors que r', dolentes.join('\n'));
        await page.context().close();

        const pot = await obre(browser, base, RUTA('a-potencies', 4));
        await esperaLliure(pot);
        const ps = await mostra(pot, 200);
        const tipusVistos = new Set(ps.map(x => x.e.pregunta.kind));
        const malament = ps.filter(
            x => x.text !== (x.e.pregunta.kind === 'exp' ? "Escriu l'exponent." : 'Escriu el resultat.')
        );
        ok(
            malament.length === 0 && tipusVistos.size === 2,
            `200 preguntes: exponent (${tipusVistos.has('exp')}) i valor (${tipusVistos.has('valor')})`
        );
        await pot.context().close();
    }

    suite('Instruccions: les activitats de dos passos canvien la frase en passar al pas següent');
    {
        // MCD → MCM
        const mcd = await obre(browser, base, RUTA('a-mcd-mcm', 1));
        await esperaLliure(mcd);
        const e = await estat(mcd);
        await mcd.evaluate(v => {
            document.getElementById('value-input').value = String(v);
            window.checkValue();
        }, e.resposta);
        await esperaLliure(mcd);
        const aMcm = await llegeix(mcd);
        ok(aMcm.text === 'Escriu el MCM.', `MCD i MCM: després del MCD diu «${aMcm.text}»`);
        await mcd.context().close();

        // Diners i canvi (nivell 3): total → canvi
        const dec = await obre(browser, base, RUTA('a-decimals', 3));
        await esperaLliure(dec);
        await responHelper(dec, 'money');
        await esperaLliure(dec);
        const aCanvi = await llegeix(dec);
        ok(aCanvi.text === 'Escriu el canvi.', `Diners i canvi: després del total diu «${aCanvi.text}»`);
        await dec.context().close();

        // Prioritat: l'operació → el resultat (es toca la primera que es pot fer)
        const pri = await obre(browser, base, RUTA('a-prioritat', 1), { congela: 2000 });
        await esperaLliure(pri);
        for (let k = 0; k < 6; k++) {
            const fase = (await estat(pri)).fase;
            if (fase === 'result') break;
            await pri.evaluate(
                i => document.querySelectorAll('.tok-btn')[i] && document.querySelectorAll('.tok-btn')[i].click(),
                k
            );
            await esperaLliure(pri);
        }
        const aResultat = await llegeix(pri);
        ok(
            (await estat(pri)).fase === 'result' && aResultat.text === 'Escull el resultat.',
            `Prioritat: després de tocar l'operació diu «${aResultat.text}»`
        );
        await pri.context().close();

        // Factoritzar: la nota «Acaba amb nombres primers.» i, en completar l'arbre, la frase s'amaga
        const fac = await obre(browser, base, RUTA('a-factoritzar', 1), { rapid: false });
        await esperaLliure(fac);
        const abans = await llegeix(fac);
        ok(
            abans.text === 'Escriu dos factors.' && abans.nota === 'Acaba amb nombres primers.',
            `Factoritzar: «${abans.text}» i, a sota, «${abans.nota}»`
        );
        for (let k = 0; k < 12; k++) {
            const { resposta } = await estat(fac);
            if (!resposta) break;
            await fac.evaluate(([a, b]) => {
                document.getElementById('factor-a-input').value = String(a);
                document.getElementById('factor-b-input').value = String(b);
                window.checkFactors();
            }, resposta);
            // Mentre es veu el resultat (1,2 s) la frase és amagada; entre passos, torna a ser-hi
            const amagada = await fac
                .waitForFunction(() => document.getElementById('instruccio').hidden, null, { timeout: 1500 })
                .then(() => true)
                .catch(() => false);
            if (amagada) break;
            await esperaLliure(fac);
        }
        const final = { amagada: await fac.evaluate(() => document.getElementById('instruccio').hidden) };
        ok(final.amagada, "Factoritzar: quan l'arbre és complet, la frase s'amaga");
        await fac.context().close();
    }
};
