/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/a-decimals.test.js
 * ROL: Proves de la LÒGICA PURA de «Diners i canvi» (js/a-decimals/): els
 *      paràmetres de la URL, els imports (com s'escriuen i com es llegeixen),
 *      la comparació de la resposta, el catàleg de productes, les compres que
 *      genera cada nivell i l'HTML de cada peça de la pantalla (vista.js). Es
 *      carreguen de manera nativa (import() de Node), sense navegador, i amb un
 *      atzar sembrat perquè el resultat sigui sempre el mateix.
 *      El controlador (pantalla, teclat, punts) es prova al navegador: tests/navegador.
 * ÚS: node tests/a-decimals.test.js
 * ============================================================================
 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { ROOT, suite, ok, finish, sembra, restauraAtzar, exigeixNode22 } = require('./harness');

exigeixNode22();

const carrega = fitxer => import(pathToFileURL(path.join(ROOT, fitxer)).href);

/** Una sessió: `n` compres d'un generador nou. */
const sessio = (G, nivell, n) => {
    const g = G.crearGenerador(nivell);
    g.reinicia();
    return Array.from({ length: n }, () => g.genera());
};

(async () => {
    const G = await carrega('js/a-decimals/generador.js');
    const { PRODUCTES } = await carrega('js/a-decimals/productes.js');
    const { LEXIC } = await carrega('js/lexicon/dades.js');
    const V = await carrega('js/a-decimals/vista.js');
    const { ambArticle, entrada } = await carrega('js/lexicon/lexicon.js');

    suite('a-decimals: paràmetres de la URL');
    {
        const n = q => G.llegeixParametres(new URLSearchParams(q)).nivell;
        ok(n('') === 1, 'sense paràmetres: nivell 1');
        ok(n('?nivell=2') === 2 && n('?nivell=3') === 3, 'nivells 2 i 3');
        ok(
            n('?nivell=0') === 1 && n('?nivell=4') === 1 && n('?nivell=abc') === 1 && n('?nivell=2.5') === 1,
            'fora de 1–3 o no enter → 1'
        );
        ok(G.NIVELL_MAXIM === 3, 'el nivell més alt és el 3');
    }

    suite('a-decimals: els imports (cèntims enters)');
    {
        ok(
            G.aCentims(3.6) === 360 && G.aCentims(1.15) === 115 && G.aCentims(0.29) === 29 && G.aCentims(4.35) === 435,
            'aCentims: sense errors de coma flotant (1,15 → 115; 0,29 → 29)'
        );
        const f = c => G.formatImport(c);
        ok(
            [f(500), f(360), f(305), f(10), f(5), f(0), f(1000), f(990)].join(' | ') ===
                '5 € | 3,60 € | 3,05 € | 0,10 € | 0,05 € | 0 € | 10 € | 9,90 €',
            'formatImport: «5 €» si és exacte; si no, coma i dos decimals («3,05 €», «0,05 €»)'
        );
        // (si no es llegeix, `{}`: així una errada es veu com un ✗ i no com una excepció)
        const l = t => G.llegeixImport(t) ?? {};
        ok(
            l('3,60').valor === 3.6 && l('3,6').valor === 3.6 && l('3').valor === 3 && l('0,05').valor === 0.05,
            'llegeixImport: «3,60», «3,6», «3», «0,05»'
        );
        ok(
            l('3,60').ambPunt === false && l('3.60').ambPunt === true && l('3.60').valor === 3.6,
            'el punt decimal també es llegeix (i es diu que és un punt, per no penalitzar-lo)'
        );
        ok(
            l(' 3,60 € ').valor === 3.6 &&
                l('€3,60').valor === 3.6 &&
                l('3,60€').valor === 3.6 &&
                l('€ 3,60').valor === 3.6,
            'amb un «€» davant o darrere i amb espais als costats'
        );
        ok(
            l('3,600').decimalsExtra === true && l('3,60').decimalsExtra === false && l('3,605').decimalsExtra === true,
            'més de dos decimals: es detecta'
        );
        ok(
            [
                '',
                ' ',
                'abc',
                '3,',
                ',5',
                '.5',
                '3,6,0',
                '3,6.0',
                '-3',
                '3 60',
                '3 €€',
                '1e2',
                '0x10',
                '3,60 euros',
            ].every(t => G.llegeixImport(t) === null),
            'el que no és un import no es llegeix (res de signes, notació científica ni text)'
        );
        ok(
            G.esCorrecte(360, 3.6) &&
                G.esCorrecte(115, 1.15) &&
                G.esCorrecte(29, 0.29) &&
                G.esCorrecte(360, 3.6) &&
                !G.esCorrecte(360, 3.605) &&
                !G.esCorrecte(360, 3.06) &&
                !G.esCorrecte(360, 36),
            "esCorrecte: exactament l'import (3,605 i 3,06 no són 3,60)"
        );
        let tots = true;
        for (let c = 0; c <= 999; c++) {
            const llegit = G.llegeixImport(G.formatImport(c));
            if (!llegit || !G.esCorrecte(c, llegit.valor) || llegit.ambPunt) tots = false;
        }
        ok(tots, 'cada import de 0 a 9,99 € escrit amb formatImport es torna a llegir exactament');
    }

    suite('a-decimals: quines parts de la resposta són bones (euros i cèntims)');
    {
        const p = (c, v) => JSON.stringify(G.comparaParts(c, v));
        ok(p(360, 3.6) === '{"euros":true,"centims":true}', '3,60 a 3,60: tot bé');
        ok(
            p(360, 3.06) === '{"euros":true,"centims":false}',
            '3,06 a 3,60: els euros sí, els cèntims no (cifres girades)'
        );
        ok(p(360, 2.6) === '{"euros":false,"centims":true}', '2,60 a 3,60: els cèntims sí, els euros no');
        ok(p(360, 2) === '{"euros":false,"centims":false}', '2 a 3,60: res');
        ok(p(360, 3) === '{"euros":true,"centims":false}', '3 a 3,60: els euros sí (3 és 3,00); els cèntims no');
        ok(p(2, 2) === '{"euros":false,"centims":false}', '2 a 0,02 (euros en lloc de cèntims): res');
        ok(p(2, 0.2) === '{"euros":true,"centims":false}', '0,20 a 0,02: els euros (0) sí, els cèntims no');
        ok(p(360, 3.605) === '{"euros":true,"centims":false}', '3,605 a 3,60: els cèntims no (no és exacte)');
        ok(
            p(360, 3.6004) === '{"euros":true,"centims":false}',
            '3,6004 a 3,60: els cèntims no (arrodonits serien 60, però no és exacte)'
        );
    }

    suite('a-decimals: el catàleg de productes');
    {
        const ids = PRODUCTES.map(p => p.id);
        ok(new Set(ids).size === ids.length && ids.length >= 12, `${ids.length} productes, sense cap id repetit`);
        const lexic = new Map(LEXIC.map(e => [e.id, e]));
        const sensePar = PRODUCTES.filter(p => {
            const e = lexic.get(p.id);
            return !e || e.tipus !== 'nom' || !e.concret || !e.imatge || e.tema !== 'botiga';
        });
        ok(
            sensePar.length === 0,
            'cada producte és un nom concret del lèxic (tema «botiga»), amb la seva imatge',
            sensePar.map(p => p.id).join(', ')
        );
        const mals = PRODUCTES.filter(
            p => !(Array.isArray(p.preu) && p.preu[0] > 0 && p.preu[0] < p.preu[1] && p.preu[1] <= 5)
        );
        ok(
            mals.length === 0,
            'cada producte té un rang de preu [mínim, màxim] versemblant (fins a 5 €)',
            mals.map(p => p.id).join(', ')
        );
        ok(
            PRODUCTES.filter(p => p.plural)
                .map(p => p.id)
                .sort()
                .join() === 'galeta,ou',
            'es compren en plural només les galetes i els ous (un sol ou no val 3 €)'
        );
        const noPerNoms = ['pizza', 'magdalena', 'entrepa', 'fruits-secs', 'pernil', 'vi', 'cervesa'];
        ok(
            !ids.some(id => noPerNoms.includes(id)),
            'sense pizza, magdalena, entrepà ni fruits secs (contextos neutres)'
        );

        const pa = PRODUCTES.find(p => p.id === 'pa');
        ok(G.preusNivell1(pa).join() === '110,120,150,210,220,250', 'preusNivell1(pa): 1,10 1,20 1,50 2,10 2,20 2,50');
        const formatge = PRODUCTES.find(p => p.id === 'formatge');
        const pf = G.preusNivell1(formatge);
        ok(
            pf[0] === 150 && pf[pf.length - 1] === 450,
            'preusNivell1(formatge): del mínim (1,50) al màxim (4,50), tots dos inclosos'
        );
        ok(
            G.preusNivell1(PRODUCTES.find(p => p.id === 'poma')).length === 0,
            'preusNivell1(poma): cap (és massa barata per a un enter més una moneda gran)'
        );
        ok(
            PRODUCTES.filter(p => G.preusNivell1(p).length > 0).length >= 8,
            'almenys 8 productes poden sortir al nivell 1'
        );
    }

    suite('a-decimals: les compres del nivell 1 (un producte, un enter més 0,10, 0,20 o 0,50; es paga amb 5 €)');
    {
        sembra(2026);
        const compres = Array.from({ length: 300 }, () => sessio(G, 1, 4)).flat();
        const prod = c => PRODUCTES.find(p => p.id === c.productes[0].id);
        ok(
            compres.every(c => c.productes.length === 1 && c.bitllet === 500 && c.passos.join() === 'canvi'),
            'un sol producte, bitllet de 5 € i un sol pas (el canvi)'
        );
        ok(
            compres.every(c => G.preusNivell1(prod(c)).includes(c.total) && c.total === c.productes[0].preu),
            "el preu és un enter de l'1 al 4 més 0,10, 0,20 o 0,50 i és dins del rang del producte"
        );
        ok(
            compres.every(c => c.canvi === 500 - c.total && c.canvi >= 50 && [90, 80, 50].includes(c.canvi % 100)),
            'el canvi és 5 € menys el preu: sempre un enter més 0,90, 0,80 o 0,50'
        );
        ok(
            new Set(compres.map(c => c.total % 100)).size === 3 &&
                new Set(compres.map(c => Math.floor(c.total / 100))).size === 4,
            'surten les tres monedes (0,10, 0,20 i 0,50) i els quatre enters (1, 2, 3 i 4)'
        );
        const productes = new Set(compres.map(c => c.productes[0].id));
        ok(
            [...productes].every(id => G.preusNivell1(PRODUCTES.find(p => p.id === id)).length > 0) &&
                productes.size >= 8,
            `només surten productes que poden costar això (${productes.size} diferents)`
        );
        const sessions = Array.from({ length: 300 }, () => sessio(G, 1, 3));
        ok(
            sessions.every(s => new Set(s.map(c => c.canvi)).size === 3),
            'no es repeteix cap canvi dins de les 3 primeres compres de cada sessió'
        );
        restauraAtzar();
    }

    suite('a-decimals: les compres del nivell 2 (un producte, preu en passos de 0,10 €)');
    {
        sembra(2027);
        const compres = Array.from({ length: 300 }, () => sessio(G, 2, 6)).flat();
        const prod = c => PRODUCTES.find(p => p.id === c.productes[0].id);
        ok(
            compres.every(
                c => c.productes.length === 1 && c.passos.join() === 'canvi' && c.total === c.productes[0].preu
            ),
            'un sol producte i un sol pas (el canvi)'
        );
        ok(
            compres.every(c => c.total % 10 === 0 && c.total <= 490),
            'el preu és múltiple de 0,10 € i no passa de 4,90 €'
        );
        ok(
            compres.every(c => {
                const [min, max] = prod(c).preu.map(G.aCentims);
                return c.total >= min && c.total <= max;
            }),
            'el preu és dins del rang del producte'
        );
        ok(
            compres.every(
                c =>
                    (c.bitllet === 500 || c.bitllet === 1000) &&
                    (c.total <= 450 || c.bitllet === 1000) &&
                    c.canvi === c.bitllet - c.total &&
                    c.canvi > 0
            ),
            'es paga amb 5 € o amb 10 € (sempre amb 10 € si el preu passés de 4,50 €) i el canvi és positiu'
        );
        const ambDeu = compres.filter(c => c.bitllet === 1000);
        const fraccio = ambDeu.length / compres.length;
        ok(
            fraccio > 0.28 && fraccio < 0.39,
            `el bitllet de 10 € surt de vegades: un ${(fraccio * 100).toFixed(1)} % de les compres (≈ 1 de cada 3)`
        );
        ok(
            ambDeu.every(c => c.canvi >= 550 && c.canvi <= 980) &&
                ambDeu.some(c => c.canvi >= 900) &&
                compres.filter(c => c.bitllet === 500).every(c => c.canvi >= 50 && c.canvi <= 480),
            'amb 10 € el canvi va de 5,50 € a 9,80 €; amb 5 €, de 0,50 € a 4,80 €'
        );
        ok(
            new Set(compres.map(c => c.productes[0].id)).size === PRODUCTES.length,
            'surten tots els productes del catàleg'
        );
        const sessions = Array.from({ length: 300 }, () => sessio(G, 2, 10));
        const senseRepetir = sessions.filter(s => new Set(s.map(c => c.canvi)).size === 10).length;
        ok(
            senseRepetir >= 285,
            `no es repeteix cap canvi a les primeres 10 compres de ${senseRepetir} de 300 sessions (≥ 285)`
        );
        restauraAtzar();
    }

    suite('a-decimals: les compres del nivell 3 (dos productes, primer el total i després el canvi)');
    {
        sembra(2028);
        const compres = Array.from({ length: 300 }, () => sessio(G, 3, 6)).flat();
        ok(
            compres.every(c => c.productes.length === 2 && c.passos.join() === 'total,canvi' && c.bitllet === 1000),
            'dos productes, bitllet de 10 € i dos passos (total i canvi)'
        );
        ok(
            compres.every(c => c.productes[0].id !== c.productes[1].id),
            'els dos productes són diferents'
        );
        ok(
            compres.every(c => c.productes.every(p => p.preu % 10 === 0 && p.preu >= 110 && p.preu <= 400)),
            'cada preu és múltiple de 0,10 € entre 1,10 € i 4,00 €'
        );
        ok(
            compres.every(c => c.total === c.productes[0].preu + c.productes[1].preu && c.canvi === 1000 - c.total),
            'el total és la suma dels preus i el canvi, 10 € menys el total'
        );
        ok(
            compres.every(c => c.total >= 220 && c.total <= 800 && c.canvi >= 200 && c.canvi <= 780),
            'el total fa de 2,20 € a 8,00 € (mai passa de 10 €)'
        );
        const sessions = Array.from({ length: 300 }, () => sessio(G, 3, 10));
        ok(
            sessions.filter(s => new Set(s.map(c => c.canvi)).size === 10).length >= 285,
            'no es repeteix cap canvi a les primeres 10 compres (≥ 285 de 300 sessions)'
        );
        restauraAtzar();
    }

    suite("a-decimals: la resposta de cada pas, el generador i l'atzar sembrat");
    {
        const c = { total: 310, canvi: 690 };
        ok(
            G.respostaDelPas(c, 'total') === 310 && G.respostaDelPas(c, 'canvi') === 690,
            'respostaDelPas: el total i el canvi'
        );

        sembra(7);
        const x = sessio(G, 2, 12);
        sembra(7);
        const y = sessio(G, 2, 12);
        ok(
            JSON.stringify(x) === JSON.stringify(y),
            'amb la mateixa llavor surten les mateixes compres (base de les sessions fixes, PR 5b)'
        );

        // reinicia(): s'oblida dels canvis vistos (comença una sessió nova)
        const g = G.crearGenerador(1);
        sembra(11);
        const primera = g.genera();
        g.genera();
        g.reinicia();
        sembra(11);
        ok(
            JSON.stringify(g.genera()) === JSON.stringify(primera),
            'reinicia(): una sessió nova torna a començar de zero'
        );
        // Sense reiniciar, la memòria de canvis fa que un nivell 1 no repeteixi els últims 3
        sembra(13);
        const g2 = G.crearGenerador(1);
        const seguides = Array.from({ length: 3 }, () => g2.genera().canvi);
        ok(new Set(seguides).size === 3, 'el nivell 1 no repeteix els últims 3 canvis');
        restauraAtzar();
    }

    suite("a-decimals: l'HTML de la pantalla (vista.js)");
    {
        const compra1 = {
            productes: [{ id: 'llet', plural: false, preu: 140 }],
            bitllet: 500,
            total: 140,
            canvi: 360,
            passos: ['canvi'],
        };
        const compra3 = {
            productes: [
                { id: 'galeta', plural: true, preu: 200 },
                { id: 'pa', plural: false, preu: 320 },
            ],
            bitllet: 1000,
            total: 520,
            canvi: 480,
            passos: ['total', 'canvi'],
        };
        const e = id => entrada(id).imatge.emoji;
        /** El text que es veu d'un tros d'HTML: sense les etiquetes i amb els espais normalitzats. */
        const veu = h =>
            h
                .replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        const compta = (h, trosset) => h.split(trosset).length - 1;

        // La botiga
        let h = V.htmlBotiga(compra1);
        ok(
            compta(h, 'class="product-card"') === 1 && compta(h, 'products-plus') === 0,
            'un producte: una targeta i cap «+»'
        );
        ok(
            veu(h) === `${e('llet')} la llet 1,40 € ${e('bitllet')} el bitllet 5 €`,
            `un producte, amb el preu i el bitllet: «${veu(h)}»`
        );
        ok(
            h.includes('data-paraula="llet"') &&
                h.includes('data-paraula="bitllet"') &&
                compta(h, 'role="button"') === 2,
            'el producte i el bitllet són paraules del lèxic que es poden tocar'
        );
        h = V.htmlBotiga(compra3);
        ok(
            compta(h, 'class="product-card"') === 2 && compta(h, 'products-plus') === 1,
            'dos productes: dues targetes i un «+» entre elles'
        );
        ok(
            veu(h) === `${e('galeta')} les galetes 2 € + ${e('pa')} el pa 3,20 € ${e('bitllet')} el bitllet 10 €`,
            `un producte en plural es veu en plural («les galetes»): «${veu(h)}»`
        );
        ok(
            !V.htmlBotiga(compra3, false).includes('bill-display') &&
                V.htmlBotiga(compra3, false).includes('class="product-card"'),
            'mostraBitllet = false amaga el bitllet i deixa els productes'
        );

        // L'etiqueta i els passos fets
        const total = V.htmlEtiquetaPas('total');
        const canvi = V.htmlEtiquetaPas('canvi');
        ok(
            total.includes('data-paraula="total"') && veu(total) === `${e('total')} total` && !total.includes('<svg'),
            `l'etiqueta del pas «total»: «${veu(total)}» (sense article)`
        );
        ok(
            canvi.includes('data-paraula="canvi"') && veu(canvi) === 'canvi' && canvi.includes('<svg'),
            "l'etiqueta del pas «canvi»: la paraula amb el pictograma de la moneda"
        );
        h = V.htmlPasFet('total', 520);
        ok(
            h.includes('<span aria-hidden="true">✅</span>') && veu(h) === `✅ ${e('total')} total 5,20 €`,
            `un pas fet: «${veu(h)}»`
        );

        // L'ajuda: només símbols
        ok(
            veu(V.htmlAjuda(compra1, 'canvi')) === `${e('bitllet')} 5 € − ${e('llet')} 1,40 € = ?`,
            `ajuda del canvi amb un producte: «${veu(V.htmlAjuda(compra1, 'canvi'))}» (bitllet − producte)`
        );
        ok(
            veu(V.htmlAjuda(compra3, 'total')) === `${e('galeta')} 2 € + ${e('pa')} 3,20 € = ?`,
            `ajuda del total: «${veu(V.htmlAjuda(compra3, 'total'))}»`
        );
        ok(
            veu(V.htmlAjuda(compra3, 'canvi')) === `${e('bitllet')} 10 € − ${e('total')} 5,20 € = ?`,
            `ajuda del canvi amb dos productes: «${veu(V.htmlAjuda(compra3, 'canvi'))}» (bitllet − total)`
        );
        ok(
            !veu(V.htmlAjuda(compra1, 'canvi')).includes('3,60') &&
                !veu(V.htmlAjuda(compra3, 'canvi')).includes('4,80'),
            "l'ajuda no porta la resposta"
        );
        ok(
            compta(V.htmlAjuda(compra3, 'total'), 'aria-hidden="true"') === 2,
            "les imatges de l'ajuda són decoratives (aria-hidden)"
        );

        // La pregunta de la revisió, en text pla
        ok(
            V.textPregunta(compra1, 'canvi') === `${e('bitllet')} 5 € − ${e('llet')} 1,40 €` &&
                V.textPregunta(compra3, 'total') === `${e('galeta')} 2 € + ${e('pa')} 3,20 €` &&
                V.textPregunta(compra3, 'canvi') === `${e('bitllet')} 10 € − ${e('total')} 5,20 €`,
            "la pregunta de la revisió és l'operació en símbols (sense «= ?»)"
        );

        // Les parts de la resposta
        const parts = (correcte, escrit) =>
            [
                ...V.htmlParts(correcte, escrit).matchAll(
                    /<span class="part (bo|mal)" role="img" aria-label="([^"]*)">([^<]*)<\/span>/g
                ),
            ].map(m => `${m[1]}|${m[3]}|${m[2]}`);
        ok(
            parts(360, '3,06').join(' ') === 'bo|3 ✔|3: correcte mal|,06 ✖|,06: incorrecte',
            `3,60 amb «3,06»: euros bons i cèntims no (${parts(360, '3,06').join(' ')})`
        );
        ok(
            parts(360, '4,60').join(' ') === 'mal|4 ✖|4: incorrecte bo|,60 ✔|,60: correcte',
            '3,60 amb «4,60»: euros no i cèntims bons'
        );
        ok(
            parts(360, '3').join(' ') === 'bo|3 ✔|3: correcte mal|,00 ✖|,00: incorrecte',
            '3,60 amb «3»: euros bons i «,00» no'
        );
        ok(
            parts(360, '4,06')
                .map(x => x.split('|')[0])
                .join() === 'mal,mal',
            '3,60 amb «4,06»: cap de les dues'
        );
        ok(
            parts(360, '3.06').join(' ') === parts(360, '3,06').join(' '),
            'amb punt es veu igual que amb coma (sempre es mostra la coma)'
        );
        ok(
            parts(360, '3,6 €')
                .map(x => x.split('|')[1])
                .join(' ') === '3 ✔ ,60 ✔' &&
                parts(360, '03,6')
                    .map(x => x.split('|')[1])
                    .join(' ') === '3 ✔ ,60 ✔',
            'un decimal s’escriu amb dos («3,6» → «,60») i un zero davant no hi fa res («03,6» → «3»)'
        );
        ok(
            parts(360, '3,605')
                .map(x => x.split('|').slice(0, 2).join('|'))
                .join(' ') === 'bo|3 ✔ mal|,605 ✖',
            'més de dos decimals: es veuen tal com s’han escrit («,605») i són dolents'
        );
        ok(
            V.htmlParts(360, 'abc') === '' && V.htmlParts(360, '3,,6') === '' && V.htmlParts(360, '') === '',
            'si el que s’ha escrit no és un import, no hi ha parts'
        );
        ok(
            !/["<>&]/.test(
                parts(360, '3,06')
                    .map(x => x.split('|')[2])
                    .join('')
            ),
            'les etiquetes de les parts es poden posar tal qual a l’HTML'
        );

        // El vocabulari que la pantalla pot produir
        const ex = G.exemplesDeText();
        ok(
            PRODUCTES.every(p => ex.includes(ambArticle(p.id, { plural: !!p.plural }))) &&
                ex.includes('les galetes') &&
                ex.includes('els ous') &&
                ex.includes('el bitllet') &&
                ex.includes('total') &&
                ex.includes('canvi') &&
                ex.length === PRODUCTES.length + 3,
            `exemplesDeText(): els ${PRODUCTES.length} productes (en plural els que es compren en plural), «total», «canvi» i «el bitllet»`
        );
    }

    finish();
})().catch(e => {
    console.error(e);
    process.exit(1);
});
