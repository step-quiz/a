/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/activitats.test.js
 * ROL: Proves de la LÒGICA PURA de les activitats que ja van amb el motor nou
 *      (js/<activitat>/generador.js): paràmetres de la URL, generació de les
 *      operacions i textos d'ajuda. Es carreguen de manera nativa (import() de Node),
 *      sense navegador, i amb un atzar sembrat perquè el resultat sigui sempre el mateix.
 *      El controlador (pantalla, teclat, punts) es prova al navegador: tests/navegador.
 * ÚS: node tests/activitats.test.js
 * ============================================================================
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { ROOT, suite, ok, finish, sembra, restauraAtzar, exigeixNode22 } = require('./harness');

exigeixNode22();

const carrega = fitxer => import(pathToFileURL(path.join(ROOT, fitxer)).href);

/** Genera `n` problemes amb els paràmetres donats. */
const mostra = (E, opcions, n = 20000) => Array.from({ length: n }, () => E.generaProblema(opcions));

(async () => {
    suite('a-enters: paràmetres de la URL');
    {
        const E = await carrega('js/a-enters/generador.js');
        const l = q => JSON.stringify(E.llegeixParametres(new URLSearchParams(q)));
        ok(l('') === '{"rang":12,"nivell":2,"operadors":"tots"}', `sense paràmetres: ${l('')}`);
        ok(l('?rang=5&nivell=1&operadors=suma') === '{"rang":5,"nivell":1,"operadors":"suma"}', 'valors vàlids');
        ok(
            l('?rang=0') === l('') && l('?rang=13') === l('') && l('?rang=abc') === l('') && l('?rang=2.5') === l(''),
            'rang fora de 1–12 o no enter → 12'
        );
        ok(
            JSON.parse(l('?nivell=3')).nivell === 2 && JSON.parse(l('?nivell=0')).nivell === 2,
            'nivell fora de 1–2 → 2'
        );
        ok(JSON.parse(l('?operadors=RESTA')).operadors === 'resta', 'operadors: no distingeix majúscules');
        ok(JSON.parse(l('?operadors=multiplica')).operadors === 'tots', 'operadors desconeguts → tots');
        ok(
            E.operadorsDisponibles(2, 'tots').join() === '+,-' && E.operadorsDisponibles(1, 'tots').join() === '+',
            'operadors disponibles: nivell 1 només suma; nivell 2 tots dos'
        );
        ok(
            E.operadorsDisponibles(2, 'suma').join() === '+' && E.operadorsDisponibles(1, 'resta').join() === '-',
            "?operadors= força l'operador, també al nivell 1"
        );
    }

    suite('a-enters: les operacions generades');
    {
        const E = await carrega('js/a-enters/generador.js');
        sembra(2024);

        let m = mostra(E, { nivell: 2, rang: 12, operadors: 'tots' });
        ok(
            m.every(p => p.b >= 1 && p.b <= 12),
            'nivell 2: b sempre entre 1 i 12 (mai negatiu ni zero: no hi ha 4 − (−5))'
        );
        ok(
            m.every(p => p.a >= -12 && p.a <= 12),
            'nivell 2: a entre −12 i 12'
        );
        ok(
            m.some(p => p.a < 0) && m.some(p => p.a > 0) && m.some(p => p.a === 0),
            'nivell 2: surten a negatives, positives i zero'
        );
        const suma = m.filter(p => p.op === '+').length / m.length;
        ok(suma > 0.38 && suma < 0.42, `nivell 2: ~40 % de sumes (${(suma * 100).toFixed(1)} %)`);
        const menor = m.filter(p => p.a < p.b).length / m.length;
        ok(menor > 0.68 && menor < 0.72, `nivell 2: ~70 % de vegades a < b (${(menor * 100).toFixed(1)} %)`);
        ok(
            m.every(p => p.op === '+' || p.op === '-'),
            "l'operador és sempre «+» o «−»"
        );

        m = mostra(E, { nivell: 1, rang: 12, operadors: 'tots' });
        ok(
            m.every(p => p.op === '+' && p.a >= 0 && p.a <= 12 && p.b >= 1 && p.b <= 12),
            'nivell 1: només sumes amb a ≥ 0 (resultats sempre positius)'
        );
        ok(
            m.every(p => E.calculaResposta(p.a, p.op, p.b) >= 1),
            'nivell 1: el resultat és sempre ≥ 1'
        );

        m = mostra(E, { nivell: 2, rang: 3, operadors: 'tots' }, 5000);
        ok(
            m.every(p => p.a >= -3 && p.a <= 3 && p.b >= 1 && p.b <= 3),
            '?rang=3: a entre −3 i 3, b entre 1 i 3 (R11: el paràmetre ara funciona)'
        );
        ok(
            new Set(m.map(p => p.a)).size === 7 && new Set(m.map(p => p.b)).size === 3,
            '?rang=3: surten tots els valors possibles'
        );
        m = mostra(E, { nivell: 2, rang: 1, operadors: 'tots' }, 2000);
        ok(
            m.every(p => p.b === 1 && p.a >= -1 && p.a <= 1),
            '?rang=1: el cas límit funciona'
        );

        m = mostra(E, { nivell: 2, rang: 12, operadors: 'resta' }, 3000);
        ok(
            m.every(p => p.op === '-'),
            '?operadors=resta: només restes'
        );
        m = mostra(E, { nivell: 2, rang: 12, operadors: 'suma' }, 3000);
        ok(
            m.every(p => p.op === '+'),
            '?operadors=suma: només sumes'
        );
        restauraAtzar();

        sembra(7);
        const x = mostra(E, { nivell: 2, rang: 12, operadors: 'tots' }, 50);
        sembra(7);
        const y = mostra(E, { nivell: 2, rang: 12, operadors: 'tots' }, 50);
        ok(
            JSON.stringify(x) === JSON.stringify(y),
            'amb la mateixa llavor surten les mateixes operacions (base de les sessions fixes, PR 5b)'
        );
        restauraAtzar();
    }

    suite("a-enters: resposta correcta i textos d'ajuda");
    {
        const E = await carrega('js/a-enters/generador.js');
        const c = E.calculaResposta;
        ok(
            [c(3, '+', 4), c(-3, '+', 4), c(3, '-', 4), c(-3, '-', 4), c(0, '-', 5), c(5, '-', 5)].join() ===
                '7,1,-1,-7,-5,0',
            'calculaResposta: sumes i restes amb signes'
        );

        ok(
            E.textAjuda(0, '+', 3) === 'Si estic a la planta baixa i pujo 3 pisos, en quin pis acabo?',
            'ajuda: a = 0 → «a la planta baixa»'
        );
        ok(
            E.textAjuda(5, '-', 2) === 'Si estic al pis 5 i baixo 2 pisos, en quin pis acabo?',
            'ajuda: a > 0 → «al pis 5»; resta → «baixo»'
        );
        ok(
            E.textAjuda(-11, '+', 1) === 'Si estic al soterrani 11 i pujo 1 pis, en quin pis acabo?',
            'ajuda: a < 0 → «al soterrani 11» (sense signe); «1 pis» en singular'
        );
        ok(
            / 1 pis,/.test(E.textAjuda(2, '-', 1)) && / 2 pisos,/.test(E.textAjuda(2, '-', 2)),
            'ajuda: «pis» en singular i «pisos» en plural'
        );
        ok(
            /zero/.test(E.textPistaSigne(0)) &&
                /positiu/.test(E.textPistaSigne(4)) &&
                /negatiu/.test(E.textPistaSigne(-4)),
            'pista del signe: zero, positiu i negatiu'
        );
    }

    suite("a-enters: l'ajuda amb les paraules il·lustrades (PR 6b)");
    {
        const E = await carrega('js/a-enters/generador.js');
        // El text de l'HTML sense les imatges (que són decoratives) ni les etiquetes
        const textDe = html => html.replace(/<span class="paraula-img"[^>]*>.*?<\/span>/g, '').replace(/<[^>]+>/g, '');
        const ids = html => [...html.matchAll(/data-paraula="([^"]+)"/g)].map(m => m[1]).join();

        const casos = [
            [0, '+', 3, 'planta-baixa,pujar,pis,pis'],
            [5, '-', 2, 'pis,baixar,pis,pis'],
            [-11, '+', 1, 'soterrani,pujar,pis,pis'],
            [-1, '-', 12, 'soterrani,baixar,pis,pis'],
        ];
        for (const [a, op, b, esperat] of casos) {
            const html = E.htmlAjuda(a, op, b);
            ok(
                textDe(html) === E.textAjuda(a, op, b),
                `htmlAjuda(${a}, ${op}, ${b}): sense imatges ni etiquetes, és el mateix text que textAjuda()`
            );
            ok(ids(html) === esperat, `htmlAjuda(${a}, ${op}, ${b}): paraules il·lustrades ${ids(html)}`);
        }

        const html = E.htmlAjuda(0, '+', 3);
        ok(
            (html.match(/<span class="paraula" /g) || []).length === 4 &&
                (html.match(/<span class="paraula-img" aria-hidden="true">/g) || []).length === 4,
            'cada paraula porta la seva imatge, amagada als lectors de pantalla'
        );
        ok(
            (html.match(/<svg /g) || []).length === 3 && (html.match(/<\/svg>/g) || []).length === 3,
            "a la planta baixa i als dos «pis» hi ha un pictograma SVG (l'edifici)"
        );
        ok(
            html.includes('⬆️') && E.htmlAjuda(5, '-', 2).includes('⬇️') && !E.htmlAjuda(5, '-', 2).includes('⬆️'),
            'pujar porta ⬆️ i baixar porta ⬇️'
        );
        ok(
            !/<script|\son[a-z]+=|javascript:/i.test(E.htmlAjuda(-12, '-', 12) + html),
            "l'HTML de l'ajuda no porta cap script ni cap esdeveniment"
        );
        ok(
            /^Si estic /.test(textDe(html)) && !/🏢/.test(html) && !/🏢/.test(E.textAjuda(0, '+', 3)),
            "la frase ja no porta el 🏢 del davant: l'edifici és als pictogrames"
        );
    }

    suite('a-proporciodirecta: paràmetres, problemes dels tres nivells i pantalla');
    {
        const P = await carrega('js/a-proporciodirecta/generador.js');
        const V = await carrega('js/a-proporciodirecta/vista.js');
        const { entrada } = await carrega('js/lexicon/lexicon.js');
        const n = q => P.llegeixParametres(new URLSearchParams(q)).nivell;
        ok(
            n('') === 1 && n('?nivell=3') === 3 && n('?nivell=0') === 1 && n('?nivell=4') === 1,
            'nivell 1–3 (per defecte 1)'
        );

        sembra(5);
        const per = nivell => Array.from({ length: 3000 }, () => P.generaProblema({ nivell }));
        const [n1, n2, n3] = [per(1), per(2), per(3)];
        restauraAtzar();
        const coherent = pr =>
            pr.passos.every(
                p =>
                    (p.op === '×' ? p.a * p.b === p.resposta : p.a === p.resposta * p.b) && Number.isInteger(p.resposta)
            ) && pr.preuDada % pr.qtyDada === 0;
        ok([...n1, ...n2, ...n3].every(coherent), 'tots enters, divisions exactes i cada pas diu com es calcula');
        ok(
            n1.every(pr => pr.passos.length === 1 && pr.qtyDada <= 9 && pr.qtyDemanada <= 9) &&
                n1.every(pr => pr.qtyDemanada % pr.qtyDada === 0 || pr.qtyDada % pr.qtyDemanada === 0),
            'nivell 1: un pas, la quantitat demanada és múltiple de la donada (o al revés)'
        );
        ok(
            new Set(n1.map(pr => `${pr.qtyDada === 1}${pr.qtyDemanada === 1}${pr.passos[0].op}`)).size === 4,
            'nivell 1: surten els 4 casos (1→N, N→1, N→kN, kN→N)'
        );
        ok(
            [n2, n3].every(g =>
                g.every(
                    pr =>
                        pr.passos.length === 2 &&
                        pr.passos[0].qty === 1 &&
                        pr.passos[0].op === '÷' &&
                        pr.passos[1].op === '×' &&
                        pr.passos[1].a === pr.passos[0].resposta &&
                        pr.qtyDemanada % pr.qtyDada !== 0 &&
                        pr.qtyDada % pr.qtyDemanada !== 0
                )
            ) &&
                n2.every(pr => pr.qtyDada <= 5 && pr.passos[0].resposta <= 4) &&
                n3.every(pr => pr.passos[0].resposta >= 2 && pr.passos[0].resposta <= 6),
            "nivells 2 i 3: dos passos (preu d'un i després el de la quantitat), sense múltiples, nombres petits o més grans"
        );

        // La pantalla
        const e = id => entrada(id).imatge.emoji;
        const veu = h =>
            h
                .replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        const pr = {
            producte: 'poma',
            qtyDada: 2,
            preuDada: 6,
            qtyDemanada: 5,
            passos: [
                { qty: 1, a: 6, op: '÷', b: 2, resposta: 3 },
                { qty: 5, a: 3, op: '×', b: 5, resposta: 15 },
            ],
        };
        ok(
            veu(V.htmlProblema(pr, 0)) === `2 ${e('poma')} pomes → 6 € 1 ${e('poma')} poma → ? €` &&
                veu(V.htmlProblema(pr, 1)) ===
                    `2 ${e('poma')} pomes → 6 € 1 ${e('poma')} poma → 3 € 5 ${e('poma')} pomes → ? €`,
            "les files: dada, [preu d'un ja fet] i el que es demana (producte en singular o plural)"
        );
        ok(
            veu(V.htmlAjuda(pr, 0)).startsWith('6 € ÷ 2 = ?') && veu(V.htmlAjuda(pr, 1)).startsWith('3 € × 5 = ?'),
            `ajuda: l'operació de cada pas («${veu(V.htmlAjuda(pr, 0))}»)`
        );
        ok(
            V.htmlAjuda(pr, 0).split('class="item"').length - 1 === 2 &&
                V.htmlAjuda(pr, 1).split('class="item"').length - 1 === 5 &&
                !veu(V.htmlAjuda(pr, 1)).includes('15'),
            "l'ajuda dibuixa els productes (2 al primer pas, 5 al segon) i no porta la resposta"
        );
        ok(
            V.textPregunta(pr, 0) === `${e('poma')} 2→6 €, 1→?` && V.textPregunta(pr, 1) === `${e('poma')} 1→3 €, 5→?`,
            'la pregunta de la revisió en símbols'
        );
        ok(
            P.exemplesDeText().includes('pomes') && P.exemplesDeText().includes('poma'),
            'exemplesDeText: noms en singular i plural'
        );
    }

    suite('a-enters-ordenar: els tres reptes, la seva comprovació i la revisió');
    {
        const O = await carrega('js/a-enters-ordenar/generador.js');
        ok([0, 1, 2, 3, 4, 5].map(O.tipusDeRepte).join('') === '123123', 'els reptes roten: 1, 2, 3, 1, 2, 3');
        sembra(7);
        const r1 = Array.from({ length: 2000 }, () => O.generaRepte(1));
        const r2 = Array.from({ length: 2000 }, () => O.generaRepte(2));
        const r3 = Array.from({ length: 2000 }, () => O.generaRepte(3));
        restauraAtzar();
        ok(
            r1.every(
                r => r.p !== r.q && r.signe === (r.p < r.q ? '<' : '>') && Math.abs(r.p) <= 9 && Math.abs(r.q) <= 9
            ),
            'repte 1: dos enters diferents (−9 a 9) i el signe que toca'
        );
        ok(
            r2.every(r => r.q - r.p >= 2 && r.p >= -9 && r.q <= 9) &&
                r2.every(r => O.esEntre(r, r.p + 1) && !O.esEntre(r, r.p) && !O.esEntre(r, r.q)),
            'repte 2: sempre hi ha un enter entre els dos, i els extrems no valen'
        );
        ok(
            r3.every(
                r =>
                    r.nums.length === 8 &&
                    new Set(r.nums).size === 8 &&
                    r.nums.every(n => n >= -9 && n <= 9) &&
                    r.nums.filter(n => n < r.r).length >= 2 &&
                    r.nums.filter(n => n < r.r).length <= 4
            ),
            'repte 3: 8 nombres diferents, 2–4 dels quals són menors que r'
        );
        const t = { r: 0, nums: [-3, 5, -1, 2, 7, -9, 4, 1] };
        ok(
            O.avaluaMenors(t, [0, 2, 5]).correcte &&
                !O.avaluaMenors(t, [0, 2]).correcte &&
                O.avaluaMenors(t, [0, 1, 2, 5]).dolents.join() === '1' &&
                O.avaluaMenors(t, [0, 1]).bons.join() === '0',
            'repte 3: només és correcte amb tots els menors i cap més; es distingeixen els bons i els dolents'
        );
        ok(
            O.textPregunta(1, { p: -3, q: 5 }) === '(-3) ? 5' &&
                O.textPregunta(2, { p: -3, q: 5 }) === '(-3) < ? < 5' &&
                O.textPregunta(3, { r: -2 }) === '? < (-2)',
            'la pregunta de la revisió en símbols'
        );
    }

    suite('a-rellotge: paràmetres, hores dels nivells, agulles i lectura de la resposta');
    {
        const R = await carrega('js/a-rellotge/generador.js');
        const V = await carrega('js/a-rellotge/vista.js');
        const l = q => R.llegeixParametres(new URLSearchParams(q));
        ok(
            l('').nivell === 1 && !l('').numeros && l('?nivell=3&numeros=1').nivell === 3 && l('?numeros=1').numeros,
            'nivell 1–3 (per defecte 1) i ?numeros=1'
        );
        sembra(3);
        const per = nivell => Array.from({ length: 3000 }, () => R.generaHora({ nivell }));
        const [n1, n2, n3] = [per(1), per(2), per(3)];
        restauraAtzar();
        const hores = g => g.every(t => t.hores >= 1 && t.hores <= 12);
        ok(
            [n1, n2, n3].every(hores) &&
                n1.every(t => [0, 15, 30, 45].includes(t.minuts)) &&
                n2.every(t => t.minuts % 5 === 0 && t.minuts <= 55) &&
                n3.every(t => t.minuts >= 0 && t.minuts <= 59) &&
                new Set(n1.map(t => t.minuts)).size === 4 &&
                new Set(n2.map(t => t.minuts)).size === 12 &&
                new Set(n3.map(t => t.minuts)).size === 60,
            "hores de l'1 al 12; minuts: quarts (nivell 1), de 5 en 5 (nivell 2) o qualsevol (nivell 3), i surten tots"
        );
        const a = R.anglesAgulles(3, 30);
        ok(
            a.hora === 105 &&
                a.minut === 180 &&
                R.anglesAgulles(12, 0).hora === 0 &&
                R.anglesAgulles(6, 0).hora === 180,
            'agulles: les 3:30 → hores a 105° (mig grau per minut) i minuts a 180°; les 12:00 a 0°'
        );
        const r = (h, m) => JSON.stringify(R.llegeixResposta(h, m));
        ok(
            r('3', '07') === '{"hores":3,"minuts":7}' &&
                r('15', '30') === '{"hores":3,"minuts":30}' &&
                r('12', '0') === '{"hores":12,"minuts":0}' &&
                r('0', '10') === 'null' &&
                r('13', '60') === 'null' &&
                r('24', '00') === 'null' &&
                r('a', '10') === 'null' &&
                r('3', '') === 'null' &&
                r('3.5', '10') === 'null',
            'lectura: 13–23 són hores del migdia; fora de rang, buit o no enter → no és una hora'
        );
        ok(R.formatHora(3, 7) === '3:07' && R.formatHora(12, 45) === '12:45', 'formatHora: «3:07»');
        const veu = h =>
            h
                .replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        ok(
            veu(V.htmlAjuda(1)) === '12 → :00 en punt 3 → :15 i quart 6 → :30 i mitja 9 → :45 menys quart' &&
                veu(V.htmlAjuda(2)).startsWith('1 → 5 2 → 10 3 → 15') &&
                veu(V.htmlAjuda(2)).endsWith('11 → 55') &&
                veu(V.htmlAjuda(3)).endsWith('+ 1 · + 1 · + 1 …'),
            "l'ajuda: les quatre expressions al nivell 1 i la taula de 5 en 5 als altres (amb «+ 1» al 3)"
        );
    }

    suite('a-recta-numerica: gràfic, preguntes dels nivells i opcions');
    {
        const G = await carrega('js/a-recta-numerica/generador.js');
        const V = await carrega('js/a-recta-numerica/vista.js');
        const l = q => G.llegeixParametres(new URLSearchParams(q));
        ok(
            l('').nivell === 2 && l('?nivell=1').nivell === 1 && l('?nivell=9').nivell === 2,
            'nivell 1–3 (per defecte 2)'
        );
        ok(
            G.etiquetaTemp(3) === '3 ºC' && G.etiquetaTemp(-2) === '−2 ºC' && G.etiquetaTemp(0) === '0 ºC',
            'les temperatures: «3 ºC», «−2 ºC»'
        );
        ok(
            [0, -1, 1, -3, 2].map(G.etiquetaDia).join('|') === 'avui|ahir|demà|−3|+2',
            'els dies: avui, ahir, demà i la resta amb signe'
        );
        let dolent = '';
        for (let i = 0; i < 400 && !dolent; i++) {
            const nivell = 1 + (i % 3);
            const yr = G.chooseYRange(nivell);
            const cloud = G.generateCloud(yr);
            const xs = cloud.map(p => p.x);
            if (cloud.length < 4 || cloud.length > 8 || !xs.includes(0) || new Set(xs).size !== xs.length)
                dolent = `núvol invàlid ${JSON.stringify(cloud)}`;
            if (cloud.some(p => !Number.isInteger(p.y) || p.y < yr.min || p.y > yr.max))
                dolent = "temperatura fora de l'eix";
            const q = G.generaPregunta(cloud, yr, nivell);
            if (!G.TIPUS_PER_NIVELL[nivell].includes(q.tipus)) dolent = `tipus ${q.tipus} al nivell ${nivell}`;
            const bones = q.opcions.filter(o => o.correcta);
            const textos = q.opcions.map(o => G.textOpcio(q, o));
            if (q.opcions.length !== 4 || bones.length !== 1 || new Set(textos).size !== 4)
                dolent = `opcions mal formades ${JSON.stringify(q)}`;
            if (q.tipus === 'Q3' && bones[0].valor !== cloud.filter(p => p.y === q.y).length)
                dolent = 'recompte incorrecte';
            if (q.tipus === 'Q4') {
                const ys = cloud.map(p => p.y);
                const objectiu = q.extrem === 'calent' ? Math.max(...ys) : Math.min(...ys);
                if (cloud.find(p => p.x === bones[0].valor).y !== objectiu) dolent = 'dia extrem incorrecte';
            }
            if ((q.tipus === 'Q1' || q.tipus === 'Q2') && cloud.find(p => p.x === q.x).y !== bones[0].valor)
                dolent = 'lectura incorrecta';
        }
        ok(!dolent, `400 gràfics i preguntes aleatoris coherents${dolent ? ` (${dolent})` : ''}`);
        const grafic = V.htmlGrafic(
            [
                { x: 0, y: 2 },
                { x: 1, y: -1 },
            ],
            { min: -6, max: 6, majorStep: 1, minorStep: 1 }
        );
        ok(
            grafic.startsWith('<svg') && (grafic.match(/<circle/g) || []).length >= 2,
            'el gràfic és un SVG amb un cercle per punt'
        );
    }

    suite('a-mcd-mcm: MCD i MCM, parells de cada nivell, ajuda i lectura de la resposta');
    {
        const G = await carrega('js/a-mcd-mcm/generador.js');
        const V = await carrega('js/a-mcd-mcm/vista.js');
        const l = q => G.llegeixParametres(new URLSearchParams(q));
        ok(
            l('').nivell === 1 && l('?nivell=3').nivell === 3 && l('?nivell=7').nivell === 1,
            'nivell 1–3 (per defecte 1)'
        );
        ok(
            G.mcd(12, 18) === 6 &&
                G.mcm(12, 18) === 36 &&
                G.mcd(8, 15) === 1 &&
                G.mcm(8, 15) === 120 &&
                JSON.stringify(G.factoritza(360)) === '{"2":3,"3":2,"5":1}',
            'MCD(12, 18) = 6, MCM(12, 18) = 36, coprimers i factoritzar 360 = 2³·3²·5'
        );
        ok(
            G.divisors(12).join() === '1,2,3,4,6,12' && G.multiples(4, 20).join() === '4,8,12,16,20',
            'divisors i múltiples'
        );
        ok(
            G.llegeixResposta(' 6 ') === 6 &&
                G.llegeixResposta('0') === null &&
                G.llegeixResposta('3,5') === null &&
                G.llegeixResposta('') === null,
            'lectura: enter positiu; 0, decimals i buit no ho són'
        );
        ok(
            JSON.stringify(G.comprovacions({ a: 12, b: 27 }, 'mcd', 4).map(d => d.ok)) === '[true,false]' &&
                JSON.stringify(G.comprovacions({ a: 12, b: 18 }, 'mcm', 72).map(d => d.ok)) === '[true,true]' &&
                JSON.stringify(G.comprovacions({ a: 12, b: 18 }, 'mcm', 50).map(d => d.ok)) === '[false,false]',
            'comprovacions: divisor dels dos nombres (MCD) o múltiple dels dos (MCM)'
        );
        let dolent = '';
        for (let i = 0; i < 600 && !dolent; i++) {
            const nivell = 1 + (i % 3);
            const q = G.generaPregunta(nivell);
            const primers = [2, 3, 5, 7, 11].slice(0, nivell + 2);
            const dins = Object.keys({ ...q.factorsA, ...q.factorsB }).every(p => primers.includes(Number(p)));
            if (q.a === q.b || q.a < 6 || q.b < 6 || q.a > 150 || q.b > 150) dolent = `parell ${q.a}, ${q.b}`;
            else if (!dins) dolent = `factors fora del nivell ${nivell}: ${q.a}, ${q.b}`;
            else if (q.mcd * q.mcm !== q.a * q.b) dolent = `MCD·MCM ≠ a·b per a ${q.a}, ${q.b}`;
            else if (q.mcm > 500) dolent = `MCM massa gran per a ${q.a}, ${q.b}`;
        }
        ok(!dolent, `600 preguntes aleatòries coherents${dolent ? ` (${dolent})` : ''}`);
        const veu = h =>
            h
                .replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        const q = { a: 12, b: 18, factorsA: G.factoritza(12), factorsB: G.factoritza(18), mcd: 6, mcm: 36 };
        ok(
            veu(V.htmlAjuda(q, 'mcd', false)) === '12 1 2 3 4 6 12 18 1 2 3 6 9 18' &&
                (V.htmlAjuda(q, 'mcd', false).match(/class="comu"/g) || []).length === 8 &&
                veu(V.htmlAjuda(q, 'mcm', false)) === '12 12 24 36 18 18 36',
            "l'ajuda: divisors (amb els comuns en destacat) i múltiples fins al MCM"
        );
        ok(
            veu(V.htmlAjuda(q, 'mcd', true)).startsWith('12 = 2 2 · 3 18 = 2 · 3 2') &&
                V.textPregunta('mcm', q) === 'MCM (12, 18)' &&
                veu(V.htmlResposta(q, 'mcd', 4)) === '12 ÷ 4 ✔ 18 ÷ 4 ✖' &&
                veu(V.htmlResposta(q, 'mcd', 3)) === '12 ÷ 3 ✔ 18 ÷ 3 ✔ ⬆' &&
                veu(V.htmlResposta(q, 'mcm', 72)) === '72 ÷ 12 ✔ 72 ÷ 18 ✔ ⬇',
            "factorització a l'ajuda, pregunta en text i resposta equivocada amb les seves divisions"
        );
    }

    suite('a-factoritzar: nombres, arbre de factors, comprovació de la parella i ajuda');
    {
        const G = await carrega('js/a-factoritzar/generador.js');
        const V = await carrega('js/a-factoritzar/vista.js');
        const l = q => G.llegeixParametres(new URLSearchParams(q));
        ok(
            l('').nivell === 1 && l('?nivell=3').nivell === 3 && l('?nivell=0').nivell === 1,
            'nivell 1–3 (per defecte 1)'
        );
        ok(G.esPrimer(2) && G.esPrimer(11) && !G.esPrimer(1) && !G.esPrimer(15), 'primers: 2 i 11 sí; 1 i 15 no');
        const c = (v, a, b) => JSON.stringify(G.comprova(v, a, b));
        ok(
            c(12, 3, 4) === '{"ok":true,"producte":12,"unAlgun":false}' &&
                c(12, 3, 5) === '{"ok":false,"producte":15,"unAlgun":false}' &&
                c(12, 1, 12) === '{"ok":false,"producte":12,"unAlgun":true}',
            'comprova: 3·4 és bo, 3·5 no, 1·12 no (un factor ha de ser més gran que 1)'
        );
        ok(
            G.llegeixFactor(' 4 ') === 4 && G.llegeixFactor('') === null && G.llegeixFactor('x') === null,
            'lectura del factor: enter o null'
        );
        let dolent = '';
        for (let i = 0; i < 300 && !dolent; i++) {
            const nivell = 1 + (i % 3);
            const n = G.generaNombre(nivell);
            const primers = G.PRIMERS_DEL_NIVELL[nivell - 1];
            const dins = Object.keys(G.factoritza(n)).every(p => primers.includes(Number(p)));
            if (n < 6 || n > 150 || G.esPrimer(n) || !dins) dolent = `nombre ${n} al nivell ${nivell}`;
            // Un joc complet: parteix cada node pendent amb la solució fins que no en queden
            const arbre = G.creaNode(n);
            let passos = 0;
            for (let p = G.pendents(arbre)[0]; p && !dolent; p = G.pendents(arbre)[0]) {
                const [x, y] = G.solucio(p.valor);
                if (!G.comprova(p.valor, x, y).ok) dolent = `solució dolenta de ${p.valor}`;
                G.parteix(p, x, y);
                if (++passos > 10) dolent = `massa passos per a ${n}`;
            }
            const fulles = G.fulles(arbre).map(f => f.valor);
            if (!dolent && (fulles.some(f => !G.esPrimer(f)) || fulles.reduce((a, b) => a * b, 1) !== n))
                dolent = `fulles de ${n}: ${fulles}`;
        }
        ok(
            !dolent,
            `300 nombres: no primers, dins del nivell, i l'arbre acaba amb primers que multipliquen el nombre${dolent ? ` (${dolent})` : ''}`
        );
        const veu = h =>
            h
                .replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        ok(
            veu(V.htmlProva(12, 3, 5)) === '3 · 5 = 15 ✖' &&
                veu(V.htmlProva(12, 1, 12)) === '1 ✖ · 12 = 12' &&
                V.htmlProva(12, null, 4) === '' &&
                veu(V.htmlAjuda(12, 1)) === '12 2 ✔ 3 ✔ 5 ✖' &&
                V.textPregunta(12) === '12 = ? · ?' &&
                V.textResposta(3, 4) === '3 · 4' &&
                veu(V.htmlResultat(12)) === '✅ 12 = 2 2 · 3',
            'vista: parella equivocada, ajuda amb ✔/✖, pregunta i resultat'
        );
        const arbre = G.creaNode(12);
        const actiu = V.htmlArbreActual(arbre);
        G.parteix(arbre, 2, 6);
        G.parteix(arbre.fills[1], 2, 3);
        ok(
            actiu.includes('node-value active') &&
                V.htmlArbreActual(arbre).includes('prime"') &&
                (V.htmlArbreActual(arbre).match(/node-value/g) || []).length === 5,
            "l'arbre: el node pendent és l'actiu i, complet, els primers en verd (5 nodes)"
        );
    }

    suite('a-fraccions: problemes de cada nivell, avaluació dels passos i marques');
    {
        const G = await carrega('js/a-fraccions/generador.js');
        const V = await carrega('js/a-fraccions/vista.js');
        const l = q => G.llegeixParametres(new URLSearchParams(q));
        ok(
            l('').nivell === 1 && l('?nivell=4').nivell === 4 && l('?nivell=5').nivell === 1,
            'nivell 1–4 (per defecte 1)'
        );
        ok(
            JSON.stringify(G.reduccio(6, 8)) === '{"n":3,"d":4}' &&
                G.esEquivalent(1, 2, 3, 6) &&
                !G.esEquivalent(1, 2, 3, 7) &&
                G.esMultipleComu(12, 4, 6) &&
                !G.esMultipleComu(8, 4, 6) &&
                G.numeradorEquivalent(3, 4, 12) === 9,
            'reduccio, equivalència, múltiple comú i numerador equivalent'
        );
        let dolent = '';
        for (let i = 0; i < 600 && !dolent; i++) {
            const nivell = 1 + (i % 4);
            const p = G.generaProblema(nivell);
            const ops = nivell === 4 ? [':', '·'] : ['+', '-'];
            if (!ops.includes(p.op)) dolent = `op ${p.op} al nivell ${nivell}`;
            else if ([p.n1, p.n2].some(n => n < 1) || [p.d1, p.d2].some(d => d < 2)) dolent = 'fracció invàlida';
            else if (nivell === 1 && p.d1 !== p.d2) dolent = 'nivell 1 sense el mateix denominador';
            else if (nivell === 2 && !(p.d1 % p.d2 === 0 || p.d2 % p.d1 === 0 || p.d1 === p.d2))
                dolent = 'nivell 2: no és múltiple';
            else if (nivell === 3 && (G.mcm(p.d1, p.d2) === p.d1 || G.mcm(p.d1, p.d2) === p.d2))
                dolent = 'nivell 3: un és múltiple';
            else if (p.final.n < 1 || !G.esIrreductible(p.final.n, p.final.d))
                dolent = `resultat final ${JSON.stringify(p.final)}`;
            else {
                // Una resolució completa amb les solucions: ha d'acabar i donar la fracció final
                let { pas, estat } = G.primerPas(p);
                for (let k = 0; pas !== 'fi' && !dolent; k++) {
                    const v = G.solucioDelPas(p, estat, pas);
                    const r =
                        pas === 'den'
                            ? { D: v[0] }
                            : pas === 'equiv'
                              ? {
                                    n1: G.filesJaFetes(p, estat.D).f1 ? null : v[0],
                                    n2: G.filesJaFetes(p, estat.D).f2 ? null : v[v.length - 1],
                                }
                              : { n: v[0], d: v[1] };
                    const res = G.avalua(p, estat, pas, r);
                    if (!res.ok || k > 6) dolent = `el pas ${pas} de ${JSON.stringify(p)} no es resol amb la solució`;
                    pas = res.seguent;
                    estat = res.estat;
                }
            }
        }
        ok(
            !dolent,
            `600 problemes de tots els nivells: dins del nivell i resolubles amb les solucions${dolent ? ` (${dolent})` : ''}`
        );
        const p = { nivell: 3, n1: 3, d1: 4, n2: 2, d2: 6, op: '+', final: { n: 13, d: 12 } };
        const a = (pas, estat, r) => JSON.stringify(G.avalua(p, estat, pas, r));
        ok(
            G.avalua(p, {}, 'den', { D: 12 }).ok &&
                G.avalua(p, {}, 'den', { D: 24 }).ok &&
                !G.avalua(p, {}, 'den', { D: 8 }).ok &&
                G.avalua(p, { D: 12 }, 'equiv', { n1: 9, n2: 4 }).seguent === 'resultat' &&
                !G.avalua(p, { D: 12 }, 'equiv', { n1: 9, n2: 5 }).ok,
            'den: qualsevol múltiple comú; equiv: els numeradors equivalents'
        );
        const e = { D: 24, num1: 18, num2: 8 };
        ok(
            G.avalua(p, e, 'resultat', { n: 26, d: 24 }).seguent === 'simplifica' &&
                G.avalua(p, e, 'resultat', { n: 13, d: 12 }).seguent === 'fi' &&
                !G.avalua(p, e, 'resultat', { n: 26, d: 12 }).ok &&
                G.avalua(p, e, 'simplifica', { n: 13, d: 12 }).seguent === 'fi' &&
                G.avalua(p, e, 'simplifica', { n: 26, d: 24 }).repeteix === true &&
                !G.avalua(p, e, 'simplifica', { n: 14, d: 12 }).ok &&
                a('resultat', { D: 12, num1: 9, num2: 4 }, { n: 13, d: null }).includes('"ok":false'),
            'resultat i simplifica: la sense simplificar porta a simplifica, la final acaba, una equivalent no reduïda es repeteix'
        );
        const q = { nivell: 4, n1: 3, d1: 4, n2: 5, d2: 2, op: ':', final: { n: 3, d: 10 } };
        ok(
            G.primerPas(q).pas === 'inversa' &&
                JSON.stringify(G.solucioDelPas(q, {}, 'inversa')) === '[2,5]' &&
                G.avalua(q, {}, 'inversa', { n: 2, d: 5 }).seguent === 'resultat' &&
                JSON.stringify(G.senseSimplificar(q)) === '{"n":6,"d":20}' &&
                G.primerPas({ ...q, op: '·' }).pas === 'resultat' &&
                G.primerPas({ ...p, d2: 4 }).pas === 'resultat',
            'divisió: primer la fracció girada; producte: directament; mateix denominador: directament al resultat'
        );
        const veu = h =>
            h
                .replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        ok(
            veu(V.htmlProblema(p)) === '3 4 + 2 6 =' &&
                veu(V.htmlMarques(p, {}, 'den', { D: 8 })) === '8 ÷ 4 ✔ 8 ÷ 6 ✖' &&
                veu(V.htmlMarques(p, { D: 12 }, 'equiv', { n1: 9, n2: 5 })) === '9 ✔ 5 ✖' &&
                veu(V.htmlMarques(p, e, 'resultat', { n: 26, d: 12 })) === '26 ✔ 12 ✖' &&
                veu(V.htmlMarques(p, e, 'simplifica', { n: 14, d: 12 })) === '14/12 ✖' &&
                V.textProblema(p) === '3/4 + 2/6' &&
                V.htmlLiniaDelPas(p, {}, 'den', { D: 12 }) === '' &&
                veu(V.htmlLiniaDelPas(p, { D: 12, num1: 9, num2: 4 }, 'equiv', {})) === '= 9 12 + 4 12',
            'vista: problema, marques ✔/✖ de cada pas i línies que s’afegeixen (cap al denominador)'
        );
        ok(
            veu(V.htmlAjuda(p, {}, 'den')) === '4 4 8 12 6 6 12' &&
                veu(V.htmlAjuda(p, { D: 12 }, 'equiv')).includes('×3') &&
                veu(V.htmlAjuda(p, { D: 12, num1: 9, num2: 4 }, 'resultat')) === '9 + 4 = ?' &&
                veu(V.htmlAjuda(p, e, 'simplifica')) === '2 ✔ 3 ✖ 5 ✖ 7 ✖',
            "l'ajuda: múltiples dels denominadors, factors, operació i primers que divideixen"
        );
    }

    suite('a-area-perimetre: figures, àrea, perímetre, contorn i comprovació');
    {
        const G = await carrega('js/a-area-perimetre/generador.js');
        const V = await carrega('js/a-area-perimetre/vista.js');
        const l = q => G.llegeixParametres(new URLSearchParams(q));
        ok(
            l('').nivell === 1 && l('?nivell=3').nivell === 3 && l('?nivell=9').nivell === 1,
            'nivell 1–3 (per defecte 1)'
        );
        const per = nom => G.perimetre(G.FIGURES.find(f => f.nom === nom).cells);
        ok(
            per('O4') === 8 &&
                per('I4') === 10 &&
                per('L3') === 8 &&
                per('X') === 12 &&
                per('I') === 12 &&
                per('U') === 12,
            'perímetres: O4 = 8, I4 = 10, L3 = 8, X = 12, I = 12, U = 12'
        );
        ok(
            G.FIGURES.every(f => f.cells.length === { tromino: 3, tetromino: 4, pentomino: 5 }[f.tipus]) &&
                new Set(G.FIGURES.map(f => f.nom)).size === G.FIGURES.length,
            'cada figura té els quadrats del seu tipus i cap nom es repeteix'
        );
        let dolent = '';
        for (const f of G.FIGURES) {
            const c = G.contorn(f.cells);
            // El contorn dona la volta i es tanca: cada segment comença on acaba l'anterior
            const tancat = c.every((s, i) => s.x2 === c[(i + 1) % c.length].x1 && s.y2 === c[(i + 1) % c.length].y1);
            if (c.length !== G.perimetre(f.cells) || !tancat) dolent = `contorn de ${f.nom}`;
        }
        ok(
            !dolent,
            `el contorn de les ${G.FIGURES.length} figures dona la volta i té tants segments com el perímetre${dolent ? ` (${dolent})` : ''}`
        );
        for (let i = 0; i < 400 && !dolent; i++) {
            const nivell = 1 + (i % 3);
            const g = G.crearGenerador(nivell);
            g.reinicia();
            const vistos = new Set();
            for (let k = 0; k < 4 && !dolent; k++) {
                const v = g.genera();
                const tipusPermesos = Object.keys(G.PROBABILITATS[nivell]).filter(t => G.PROBABILITATS[nivell][t] > 0);
                if (!tipusPermesos.includes(v.tipus)) dolent = `tipus ${v.tipus} al nivell ${nivell}`;
                else if (v.area !== v.cells.length || v.perimetre !== G.perimetre(v.cells))
                    dolent = `mesures de ${v.nom}`;
                else if (Math.min(...v.cells.map(c => c[0])) !== 0 || Math.min(...v.cells.map(c => c[1])) !== 0)
                    dolent = `${v.nom} sense normalitzar`;
                else if (vistos.has(v.nom)) dolent = `${v.nom} repetida dins de la sessió`;
                vistos.add(v.nom);
            }
        }
        ok(
            !dolent,
            `400 sessions de 4 figures: del tipus del nivell, mesures bones i sense repetir${dolent ? ` (${dolent})` : ''}`
        );
        const fig = { nom: 'L3', area: 3, perimetre: 8 };
        const c = (a, p) => JSON.stringify(G.comprovaResposta(fig, a, p));
        ok(
            c(3, 8) === '{"areaOk":true,"perimOk":true,"canviats":false}' &&
                c(3, 6) === '{"areaOk":true,"perimOk":false,"canviats":false}' &&
                c(8, 3) === '{"areaOk":false,"perimOk":false,"canviats":true}' &&
                c(5, 5) === '{"areaOk":false,"perimOk":false,"canviats":false}',
            'comprovaResposta: bones, una de bona, canviades i les dues equivocades'
        );
        const o4 = {
            cells: [
                [0, 0],
                [0, 1],
                [1, 0],
                [1, 1],
            ],
            nom: 'O4',
            area: 4,
            perimetre: 8,
        };
        const svg = V.htmlFigura(o4);
        ok(
            svg.startsWith('<svg') &&
                (svg.match(/fill="#0d9488"/g) || []).length === 4 &&
                svg.includes('1 cm') &&
                (V.htmlFigura(o4, 'area').match(/<circle/g) || []).length === 4 &&
                (V.htmlFigura(o4, 'perimetre').match(/<circle/g) || []).length === 8,
            "el dibuix: 4 quadrats, la cota «1 cm» i l'ajuda amb 4 números (àrea) o 8 (perímetre)"
        );
        ok(
            V.htmlMarca(true).includes('✔') &&
                V.htmlMarca(false).includes('✖') &&
                V.htmlEtiqueta('area').includes('àrea') &&
                V.htmlEtiqueta('area').includes('cm²') &&
                V.htmlEtiqueta('perimetre').includes('perímetre') &&
                V.textPregunta(fig) === 'L3: ? cm² · ? cm' &&
                V.textResposta(3, 8) === '3 cm² · 8 cm',
            'etiquetes (icona, paraula i unitat), marques i textos plans'
        );
    }

    suite('a-triangle-rectangle: problemes, opcions, mesures i ajuda');
    {
        const G = await carrega('js/a-triangle-rectangle/generador.js');
        const V = await carrega('js/a-triangle-rectangle/vista.js');
        const l = q => G.llegeixParametres(new URLSearchParams(q));
        ok(
            l('').nivell === 1 && l('?nivell=3').nivell === 3 && l('?nivell=9').nivell === 1,
            'nivell 1–3 (per defecte 1)'
        );
        ok(
            G.evalVal('5') === 5 &&
                Math.abs(G.evalVal('2√3') - 3.4641) < 0.001 &&
                Math.abs(G.evalVal('√2') - 1.4142) < 0.001 &&
                G.formatVal(5) === '5' &&
                G.formatVal(Math.sqrt(2)) === '√2' &&
                G.formatVal(2 * Math.sqrt(3)) === '2√3' &&
                G.formatVal(0) === null,
            'evalVal i formatVal: «5», «√2», «2√3»'
        );
        let dolent = '';
        for (const p of G.PROBLEMES) {
            // Cada problema compleix Pitàgores: b² + c² = a²
            const a = G.evalVal(p.find === 'a' ? p.answer : p.given.a);
            const b = G.evalVal(p.find === 'b' ? p.answer : p.given.b);
            const c = G.evalVal(p.find === 'c' ? p.answer : p.given.c);
            if (Math.abs(b * b + c * c - a * a) > 0.001) dolent = `el problema ${p.id} no compleix Pitàgores`;
        }
        ok(!dolent, `els ${G.PROBLEMES.length} problemes compleixen b² + c² = a²${dolent ? ` (${dolent})` : ''}`);
        ok(
            G.PROBLEMES_DEL_NIVELL[1].every(i => G.PROBLEMES[i].find === 'a') &&
                G.PROBLEMES_DEL_NIVELL[3].every(i => JSON.stringify(G.PROBLEMES[i]).includes('√')) &&
                G.PROBLEMES_DEL_NIVELL[2].length > G.PROBLEMES_DEL_NIVELL[1].length,
            'nivell 1: només la hipotenusa; nivell 2: també els catets; nivell 3: amb arrels'
        );
        for (let i = 0; i < 300 && !dolent; i++) {
            const p = G.PROBLEMES[i % G.PROBLEMES.length];
            const o = G.opcions(p);
            const valors = o.map(x => G.evalVal(x.valor));
            if (o.length !== 4 || o.filter(x => x.correcta).length !== 1) dolent = `opcions del problema ${p.id}`;
            else if (o.find(x => x.correcta).valor !== p.answer) dolent = `resposta del problema ${p.id}`;
            else if (new Set(valors.map(v => v.toFixed(3))).size !== 4)
                dolent = `opcions repetides al problema ${p.id}`;
        }
        ok(!dolent, `300 jocs d'opcions: quatre valors diferents i una sola bona${dolent ? ` (${dolent})` : ''}`);
        const g = G.crearGenerador(1);
        g.reinicia();
        const vistos = new Set();
        for (let k = 0; k < G.PROBLEMES_DEL_NIVELL[1].length; k++) vistos.add(g.genera().problema.id);
        ok(
            vistos.size === G.PROBLEMES_DEL_NIVELL[1].length,
            'el generador no repeteix cap problema fins que els ha fet tots'
        );
        const m = G.mesures(G.PROBLEMES[9]); // a = 5, c = 4 → b = 3
        ok(
            Math.abs(m.vertical - 3) < 0.001 &&
                Math.abs(m.horitzontal - 4) < 0.001 &&
                G.formula(G.PROBLEMES[0]) === 'a² = b² + c²' &&
                G.formula(G.PROBLEMES[9]) === 'b² = a² − c²' &&
                G.formula(G.PROBLEMES[15]) === 'c² = a² − b²' &&
                G.formulaAmbValors(G.PROBLEMES[0]) === 'a² = 3² + 4²' &&
                G.formulaAmbValors(G.PROBLEMES[12]) === 'b² = (√2)² − 1²',
            'mesures per dibuixar i fórmules (amb lletres i amb valors)'
        );
        const svg = V.htmlTriangle(G.PROBLEMES[0]);
        ok(
            svg.startsWith('<svg') && svg.includes('a = ?') && svg.includes('b = 3') && svg.includes('c = 4'),
            'el triangle porta «a = ?», «b = 3» i «c = 4»'
        );
        ok(
            V.htmlAjuda(G.PROBLEMES[0], 0) === '' &&
                !V.htmlAjuda(G.PROBLEMES[0], 1).includes('3²') &&
                V.htmlAjuda(G.PROBLEMES[0], 2).includes('a² = 3² + 4²') &&
                V.textPregunta(G.PROBLEMES[0]) === 'a? (b = 3, c = 4)',
            "l'ajuda per tocs (res → fórmula → fórmula amb valors) i la pregunta en text pla"
        );
    }

    suite('a-pla-cartesia: quadrants, punts i comprovació de cada tipus de pregunta');
    {
        const G = await carrega('js/a-pla-cartesia/generador.js');
        const V = await carrega('js/a-pla-cartesia/vista.js');
        const l = q => G.llegeixParametres(new URLSearchParams(q));
        ok(
            l('').nivell === 1 && l('?nivell=3').nivell === 3 && l('?nivell=9').nivell === 1,
            'nivell 1–3 (per defecte 1)'
        );
        ok(
            [
                [3, 2, 'Q1'],
                [-3, 2, 'Q2'],
                [-3, -2, 'Q3'],
                [3, -2, 'Q4'],
                [0, 2, 'eixY'],
                [3, 0, 'eixX'],
                [0, 0, 'origen'],
            ].every(([x, y, q]) => G.quadrantDe(x, y) === q),
            'quadrantDe: Q1…Q4, els dos eixos i l’origen'
        );
        ok(
            Object.entries(G.LLOCS_DEL_NIVELL).every(([, llocs]) =>
                llocs.every(q => {
                    const p = G.exemplePunt(q);
                    return G.dinsDelPla(p.x, p.y) && G.quadrantDe(p.x, p.y) === q;
                })
            ),
            'exemplePunt: un punt dins del pla per a cada lloc de cada nivell'
        );
        let dolent = '';
        const tipusVistos = new Set();
        for (let i = 0; i < 800 && !dolent; i++) {
            const nivell = 1 + (i % 3);
            const q = G.generaPregunta(nivell, i);
            tipusVistos.add(q.tipus);
            if (!G.LLOCS_DEL_NIVELL[nivell].includes(q.lloc)) dolent = `lloc ${q.lloc} fora del nivell ${nivell}`;
            else if (q.tipus === 'al-quadrant') {
                if (q.punt !== null) dolent = 'al-quadrant amb punt';
            } else {
                if (!G.dinsDelPla(q.punt.x, q.punt.y) || G.quadrantDe(q.punt.x, q.punt.y) !== q.lloc)
                    dolent = `punt fora del pla o del lloc: ${JSON.stringify(q)}`;
                if (nivell === 1 && (q.punt.y < 1 || q.punt.x === 0))
                    dolent = `nivell 1 amb y ≤ 0 o x = 0: ${JSON.stringify(q.punt)}`;
                if (nivell === 2 && (q.punt.x === 0 || q.punt.y === 0))
                    dolent = `nivell 2 amb un punt sobre un eix: ${JSON.stringify(q.punt)}`;
            }
        }
        ok(
            !dolent && tipusVistos.size === 4,
            `800 preguntes: dins del pla, del lloc i del nivell, i surten els 4 tipus${dolent ? ` (${dolent})` : ''}`
        );
        const sit = { tipus: 'situa', punt: { x: 3, y: -2 }, lloc: 'Q4', etiqueta: 'A' };
        const alq = { tipus: 'al-quadrant', punt: null, lloc: 'Q3', etiqueta: 'B' };
        ok(
            G.comprovaSitua(sit, 3, -2) &&
                !G.comprovaSitua(sit, -2, 3) &&
                JSON.stringify(G.comprovaCoordenades(sit, 3, 1)) === '{"xOk":true,"yOk":false}' &&
                G.comprovaAlQuadrant(alq, -1, -4) &&
                !G.comprovaAlQuadrant(alq, 1, -4) &&
                !G.comprovaAlQuadrant(alq, -9, -9),
            'comprovacions: situar, coordenades (x i y per separat) i punt al quadrant (també que sigui dins del pla)'
        );
        const veu = h =>
            h
                .replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        ok(
            V.textPunt(3, -2, 'A') === 'A (3, −2)' &&
                V.textPunt(0, 4) === '(0, 4)' &&
                veu(V.htmlDemana(sit)) === '👆 A (3, −2)' &&
                V.htmlDemana({ tipus: 'coordenades', etiqueta: 'C' }).includes('>C<') &&
                V.htmlDemana(alq).startsWith('<svg') &&
                V.ambCaselles(alq) &&
                V.ambCaselles({ tipus: 'coordenades' }) &&
                !V.ambCaselles(sit) &&
                V.textPregunta(alq) === 'Q3 → (?, ?)',
            'vista: el punt escrit, el que es demana i quan hi ha caselles'
        );
        ok(
            ['Q1', 'Q2', 'Q3', 'Q4', 'eixX', 'eixY', 'origen'].every(q => V.htmlIcona(q).includes('<svg')) &&
                V.htmlIcona('Q2').includes('>2<') &&
                V.htmlIcona('Q4').includes('>4<'),
            'les set icones de lloc són SVG i els quadrants porten el seu número'
        );
    }

    suite('a-equacions: equacions de cada nivell, comprovació per substitució i ajuda');
    {
        const G = await carrega('js/a-equacions/generador.js');
        const V = await carrega('js/a-equacions/vista.js');
        const l = q => G.llegeixParametres(new URLSearchParams(q));
        ok(
            l('').nivell === 1 && l('?nivell=4').nivell === 4 && l('?nivell=9').nivell === 1,
            'nivell 1–4 (per defecte 1)'
        );
        ok(
            G.tipusDelNivell(1).join() === 'ax_b' &&
                G.tipusDelNivell(2).join() === 'ax_b,xpb_c,xmb_c' &&
                G.tipusDelNivell(3).join() === 'ax_b,xpb_c,xmb_c' &&
                G.tipusDelNivell(4).join() === 'ax_b,xpb_c,xmb_c,bpx_c',
            'tipus d’equació de cada nivell'
        );
        let dolent = '';
        const vistos = new Set();
        for (let i = 0; i < 800 && !dolent; i++) {
            const nivell = 1 + (i % 4);
            const eq = G.generaEquacio(nivell);
            vistos.add(eq.tipus);
            if (!G.tipusDelNivell(nivell).includes(eq.tipus)) dolent = `tipus ${eq.tipus} al nivell ${nivell}`;
            else if (!Number.isInteger(eq.xSol) || eq.xSol < 1 || eq.xSol > 12) dolent = `solució ${eq.xSol}`;
            else if (!G.esSolucio(eq, eq.xSol)) dolent = `${G.textEquacio(eq)} no té per solució ${eq.xSol}`;
            else if (G.esSolucio(eq, eq.xSol + 1)) dolent = `${G.textEquacio(eq)} té dues solucions`;
            else if (dolent === '' && G.dreta(eq) < 1) dolent = `dreta no positiva a ${G.textEquacio(eq)}`;
        }
        ok(
            !dolent && vistos.size === 4,
            `800 equacions: solució entera positiva, única i del tipus del nivell${dolent ? ` (${dolent})` : ''}`
        );
        const ax = { tipus: 'ax_b', a: 3, b: 12, xSol: 4 };
        const xm = { tipus: 'xmb_c', b: 3, c: 4, xSol: 7 };
        const xp = { tipus: 'xpb_c', b: 3, c: 8, xSol: 5 };
        const bp = { tipus: 'bpx_c', b: 3, c: 8, xSol: 5 };
        ok(
            G.esquerra(ax, 5).text === '3 · 5' &&
                G.esquerra(xm, 9).valor === 6 &&
                G.esquerra(bp, 2).text === '3 + 2' &&
                G.operacioInversa(ax) === '12 ÷ 3 = ?' &&
                G.operacioInversa(xm) === '4 + 3 = ?' &&
                G.operacioInversa(xp) === '8 − 3 = ?' &&
                G.textEquacio(xp) === 'x + 3 = 8' &&
                G.textEquacio(bp) === '3 + x = 8',
            'esquerra, operació inversa i text de cada tipus'
        );
        const veu = h =>
            h
                .replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        ok(
            veu(V.htmlEquacio(xp)) === 'x + 3 = 8' &&
                veu(V.htmlEquacio(ax)) === '3 · x = 12' &&
                veu(V.htmlSubstitucio(xp, 4)) === '4 + 3 = 7 ≠ 8 ✖' &&
                veu(V.htmlSubstitucio(ax, 5)) === '3 · 5 = 15 ≠ 12 ✖',
            'vista: equació en gran i resposta substituïda («4 + 3 = 7 ≠ 8 ✖»)'
        );
        ok(
            V.htmlAjuda(xp, 0) === '' &&
                veu(V.htmlAjuda(xp, 1)) === '🎁 x + 3 🍬 = 8 🍬' &&
                (V.htmlAjuda(ax, 1).match(/ajuda-caixa/g) || []).length === 3 &&
                veu(V.htmlAjuda(xp, 2)).endsWith('8 − 3 = ?'),
            "l'ajuda per tocs: res → caixes i caramels (a caixes a a·x = b) → i l'operació"
        );
    }

    suite('a-potencies: preguntes de cada nivell, comprovació amb xifres i ajuda');
    {
        const G = await carrega('js/a-potencies/generador.js');
        const V = await carrega('js/a-potencies/vista.js');
        const l = q => G.llegeixParametres(new URLSearchParams(q));
        ok(
            l('').nivell === 1 && l('?nivell=4').nivell === 4 && l('?nivell=9').nivell === 1,
            'nivell 1–4 (per defecte 1)'
        );
        ok(
            G.tipusDelNivell(1).join() === 'prod,quot' &&
                G.tipusDelNivell(2).join() === 'prod,quot,powpow' &&
                G.tipusDelNivell(3).join() === 'prod,quot,powpow,baseneg' &&
                new Set(G.tipusDelNivell(4)).size === 5,
            'tipus de pregunta de cada nivell'
        );
        let dolent = '';
        const vistos = new Set();
        for (let i = 0; i < 1200 && !dolent; i++) {
            const nivell = 1 + (i % 4);
            const p = G.generaPregunta(nivell);
            vistos.add(p.tipus);
            if (!G.tipusDelNivell(nivell).includes(p.tipus)) dolent = `tipus ${p.tipus} al nivell ${nivell}`;
            else if (!Number.isInteger(p.solucio)) dolent = `solució ${p.solucio}`;
            else if (G.esCorrecta(p, p.solucio + 1)) dolent = `${G.textPregunta(p)} té dues solucions`;
            else if (
                p.tipus === 'prod' &&
                (p.base ** p.solucio !== p.base ** p.m * p.base ** p.n || p.solucio > G.EXPONENT_MAXIM[p.base])
            )
                dolent = `producte ${G.textPregunta(p)}`;
            else if (p.tipus === 'quot' && (p.base ** p.m / p.base ** p.n !== p.base ** p.solucio || p.solucio < 1))
                dolent = `quocient ${G.textPregunta(p)}`;
            else if (p.tipus === 'powpow' && (p.base ** p.m) ** p.n !== p.base ** p.solucio)
                dolent = `(aᵐ)ⁿ ${G.textPregunta(p)}`;
            else if (p.tipus === 'baseneg') {
                const esperat = p.parentesi ? (-p.base) ** p.exp : -(p.base ** p.exp);
                if (esperat !== p.solucio) dolent = `base negativa ${G.textPregunta(p)}`;
            } else if (p.tipus === 'cientifica') {
                const valor = Number(p.mant.replace(',', '.')) * 10 ** p.exp;
                const esperat = p.sentit === 'de_cient' ? p.solucio : Number(p.nombre.replace(',', '.'));
                if (Math.abs(valor - esperat) > 1e-9 * Math.abs(esperat)) dolent = `científica ${G.textPregunta(p)}`;
            }
        }
        ok(
            !dolent && vistos.size === 5,
            `1200 preguntes: solució única, correcta i del tipus del nivell${dolent ? ` (${dolent})` : ''}`
        );
        ok(
            G.textDecimal(34, 3) === '34000' &&
                G.textDecimal(34, -5) === '0,00034' &&
                G.textDecimal(5, -2) === '0,05' &&
                G.textDecimal(34, -1) === '3,4' &&
                G.aCientifica(3400).mant === '3,4' &&
                G.aCientifica(3400).exp === 3 &&
                G.aCientifica(50000).mant === '5' &&
                G.aCientifica(7) === null,
            'nombres escrits: textDecimal i aCientifica'
        );
        const prod = { tipus: 'prod', kind: 'exp', base: 3, m: 2, n: 4, solucio: 6 };
        const quot = { tipus: 'quot', kind: 'exp', base: 3, m: 5, n: 2, solucio: 3 };
        const neg = { tipus: 'baseneg', kind: 'valor', base: 2, exp: 3, parentesi: true, solucio: -8 };
        const negSense = { tipus: 'baseneg', kind: 'valor', base: 2, exp: 4, parentesi: false, solucio: -16 };
        const aCient = {
            tipus: 'cientifica',
            sentit: 'a_cient',
            kind: 'exp',
            digits: 34,
            dec: 1,
            mant: '3,4',
            exp: 4,
            solucio: 4,
            nombre: '34000',
        };
        const deCient = {
            tipus: 'cientifica',
            sentit: 'de_cient',
            kind: 'valor',
            digits: 34,
            dec: 1,
            mant: '3,4',
            exp: 5,
            solucio: 340000,
        };
        const veu = h =>
            h
                .replace(/<sup>([^<]*)<\/sup>/g, '^$1')
                .replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        ok(
            veu(V.htmlComprovacio(G.comprovacio(prod, 5))) === '3^5 = 243 ≠ 729 ✖' &&
                veu(V.htmlComprovacio(G.comprovacio(prod, 40))) === '3^40 ✖' &&
                veu(V.htmlComprovacio(G.comprovacio(neg, 8))) === '+ ✖ 8 ✔' &&
                veu(V.htmlComprovacio(G.comprovacio(neg, -9))) === '− ✔ 9 ✖' &&
                veu(V.htmlComprovacio(G.comprovacio(aCient, 3))) === '3,4 · 10^3 = 3400 ≠ 34000 ✖' &&
                veu(V.htmlComprovacio(G.comprovacio(aCient, -2))) === '3,4 · 10^−2 = 0,034 ≠ 34000 ✖' &&
                veu(V.htmlComprovacio(G.comprovacio(deCient, 34000))) === '34000 = 3,4 · 10^4 ✖' &&
                veu(V.htmlComprovacio(G.comprovacio(deCient, 5))) === '5 ✖',
            'resposta equivocada comprovada amb xifres (exponent, signe i valor, notació científica)'
        );
        ok(
            veu(V.htmlPregunta(prod)) === '3^2 · 3^4' &&
                veu(V.htmlPregunta(neg)) === '(−2)^3' &&
                veu(V.htmlPregunta(negSense)) === '−2^4' &&
                veu(V.htmlPregunta(aCient)) === '34000' &&
                V.etiquetaResposta(prod) === '3' &&
                V.etiquetaResposta(aCient) === '3,4 · 10' &&
                V.etiquetaResposta(neg) === '' &&
                G.textPregunta(quot) === '3^5 ÷ 3^2 = 3^?',
            'vista: pregunta en gran i el que va davant del camp'
        );
        ok(
            V.htmlAjuda(prod, 0) === '' &&
                veu(V.htmlAjuda(prod, 1)) === '(3·3) · (3·3·3·3)' &&
                veu(V.htmlAjuda(prod, 2)).endsWith('2 + 4 = ?') &&
                V.htmlAjuda(quot, 2).includes('fac-tatxat') &&
                veu(V.htmlAjuda(quot, 2)).endsWith('5 − 2 = ?') &&
                veu(V.htmlAjuda(neg, 1)) === '(−2) · (−2) · (−2)' &&
                veu(V.htmlAjuda(neg, 2)) === '−2 → 4 → ?' &&
                veu(V.htmlAjuda(aCient, 1)) === '34000 = 3,4 · 10000' &&
                veu(V.htmlAjuda(aCient, 2)) === '34000 = 3,4 · 10 · 10 · 10 · 10',
            "l'ajuda per tocs: res → producte de factors → factors tatxats / parcials / 10 un a un i l'operació"
        );
    }

    suite('a-nombres-lletres: els noms dels nombres, els distractors i la pregunta');
    {
        const G = await carrega('js/a-nombres-lletres/generador.js');
        const V = await carrega('js/a-nombres-lletres/vista.js');
        const l = q => G.llegeixParametres(new URLSearchParams(q));
        ok(
            l('').nivell === 1 && l('?nivell=4').nivell === 4 && l('?nivell=9').nivell === 1 && G.INTENTS === 2,
            'nivell 1–4 (per defecte 1) i només dues oportunitats'
        );
        const noms = {
            0: 'zero',
            1: 'un',
            7: 'set',
            13: 'tretze',
            20: 'vint',
            21: 'vint-i-un',
            29: 'vint-i-nou',
            30: 'trenta',
            31: 'trenta-un',
            52: 'cinquanta-dos',
            70: 'setanta',
            87: 'vuitanta-set',
            99: 'noranta-nou',
            100: 'cent',
        };
        ok(
            Object.entries(noms).every(([n, nom]) => G.nomNombre(Number(n)) === nom),
            'noms dels nombres: zero, tretze, vint-i-un, trenta-un, cinquanta-dos, vuitanta-set, cent…'
        );
        const tots = Array.from({ length: 101 }, (_, n) => G.nomNombre(n));
        ok(
            new Set(tots).size === 101 &&
                tots.every(t => /^[a-zç]+(-[a-zç]+)*$/.test(t)) &&
                G.exemplesDeText().join() === tots.join(),
            'els 101 noms són diferents, en minúscula i amb guionets; exemplesDeText els dona tots'
        );
        let dolent = '';
        for (let n = 0; n <= 100 && !dolent; n++) {
            const d = G.distractors(n);
            if (d.length !== 4) dolent = `${n}: ${d.length} distractors`;
            else if (new Set(d).size !== 4 || d.includes(G.nomNombre(n)))
                dolent = `${n}: repetits o inclou el nom correcte`;
        }
        ok(
            !dolent,
            `cada nombre del 0 al 100 té 4 distractors diferents del nom correcte${dolent ? ` (${dolent})` : ''}`
        );
        const prova = new Set();
        for (let i = 0; i < 40; i++) G.distractors(52).forEach(d => prova.add(d));
        ok(
            [
                'cinquanta-i-dos',
                'cinquenta-dos',
                'cinquanta dos',
                'cincuanta-dos',
                'cincuanta dos',
                'cinc dos',
                'cinquanta',
            ].every(t => prova.has(t)),
            'els distractors de 52 inclouen errors versemblants (castellanitzats, sense guionet, només la desena, dígits un a un…)'
        );
        let mal = '';
        for (let i = 0; i < 600 && !mal; i++) {
            const nivell = 1 + (i % 4);
            const p = G.generaPregunta(nivell);
            const [min, max] = G.RANGS[nivell];
            if (p.n < min || p.n > max) mal = `${p.n} fora del nivell ${nivell}`;
            else if (p.opcions.length !== 5 || p.opcions.filter(o => o.correcta).length !== 1) mal = `${p.n}: opcions`;
            else if (p.opcions.find(o => o.correcta).text !== G.nomNombre(p.n))
                mal = `${p.n}: la correcta no és el nom`;
        }
        ok(
            !mal,
            `600 preguntes: del rang del nivell, 5 opcions diferents i només una de correcta${mal ? ` (${mal})` : ''}`
        );
        const fetes = new Set();
        for (let i = 0; i < 21; i++) fetes.add(G.generaPregunta(1, fetes).n);
        ok(fetes.size === 21, 'amb `excloure`, el nivell 1 treu els 21 nombres sense repetir cap');
        ok(
            V.htmlNombre(52).includes('>52<') && G.textPregunta({ n: 52 }) === '52',
            'vista: el nombre en gran i en text pla'
        );
    }

    suite('a-prioritat: expressions de cada nivell, resolució pas a pas, operacions bloquejades i vista');
    {
        const G = await carrega('js/a-prioritat/generador.js');
        const V = await carrega('js/a-prioritat/vista.js');
        const l = q => G.llegeixParametres(new URLSearchParams(q));
        ok(
            l('').nivell === 1 && l('?nivell=4').nivell === 4 && l('?nivell=9').nivell === 1,
            'nivell 1–4 (per defecte 1)'
        );
        let dolent = '';
        for (let i = 0; i < 800 && !dolent; i++) {
            const nivell = 1 + (i % 4);
            const { toks, val } = G.generaExpressio(nivell, i % 6, 6);
            const pot = toks.some(t => t.k === 'pow');
            const par = toks.some(t => t.k === 'lp');
            if (!Number.isInteger(val) || val < 0 || val > G.MAX_RESULT) dolent = `valor ${val}`;
            else if (G.evaluate(toks, {}) !== val) dolent = `${G.textExpressio(toks)} no fa ${val}`;
            else if (nivell === 1 && (pot || par)) dolent = `${G.textExpressio(toks)} al nivell 1`;
            else if (nivell === 2 && (!pot || par)) dolent = `${G.textExpressio(toks)} al nivell 2`;
            else if (nivell === 3 && (pot || !par)) dolent = `${G.textExpressio(toks)} al nivell 3`;
            else if (nivell === 4 && !pot && !par) dolent = `${G.textExpressio(toks)} al nivell 4`;
        }
        ok(
            !dolent,
            `800 expressions: valor correcte, entre 0 i ${G.MAX_RESULT} i del tipus del nivell${dolent ? ` (${dolent})` : ''}`
        );
        // Resolem fent, a cada pas, una operació qualsevol de les que es poden fer: el resultat sempre és el mateix
        let mal = '';
        for (let i = 0; i < 400 && !mal; i++) {
            const { toks, val } = G.generaExpressio(1 + (i % 4), i % 6, 6);
            let line = G.startLine(toks);
            for (let pas = 0; pas < 20 && !G.isDone(line) && !mal; pas++) {
                const llestes = G.readyOps(line);
                if (!llestes.length) {
                    mal = `${G.textExpressio(toks)}: cap operació llesta`;
                    break;
                }
                const op = llestes[i % llestes.length];
                const bloq = line.findIndex((t, k) => (t.k === 'op' || t.k === 'pow') && !llestes.includes(k));
                if (G.blockers(line, op) !== null) mal = `blockers d'una llesta (${G.textExpressio(toks)})`;
                else if (bloq >= 0 && !G.blockers(line, bloq)?.green.length)
                    mal = `blockers sense verds (${G.textExpressio(toks)})`;
                const d = G.stepDistractors(line, op);
                const ok3 = d.length === 3 && new Set(d).size === 3 && !d.includes(G.opValue(line, op));
                if (!mal && !ok3) mal = `distractors ${d} de ${G.textOperacio(line, op)}`;
                line = G.applyAt(line, op);
            }
            if (!mal && (!G.isDone(line) || line[0].v !== val))
                mal = `${G.textExpressio(toks)} acaba en ${line[0]?.v}, no ${val}`;
            const llibre = G.solve(G.startLine(toks));
            if (!mal && G.applyAt(llibre.at(-2).line, llibre.at(-2).op)[0].v !== val)
                mal = `solve de ${G.textExpressio(toks)}`;
        }
        ok(
            !mal,
            `400 resolucions en qualsevol ordre vàlid: sempre acaben en el valor, i blockers i distractors són coherents${mal ? ` (${mal})` : ''}`
        );
        const pri = [G.N(2), G.O('+'), G.N(3), G.O('·'), G.P(4, 2)];
        const linia = G.startLine(pri);
        const res = G.startLine([G.N(8), G.O('-'), G.N(2), G.O('·'), G.N(3)]);
        ok(
            G.textExpressio(pri) === '2 + 3 · 4²' &&
                G.textOperacio(linia, 4) === '4²' &&
                G.readyOps(linia).join() === '4' &&
                G.blockers(linia, 3).reason === 'pow' &&
                G.blockers(res, 1).reason === 'prio' &&
                G.blockers(res, 1).green.join() === '3',
            "text de l'expressió, operacions llestes i el motiu pel qual una no es pot fer (potència abans, · abans que −)"
        );
        const veu = h =>
            h
                .replace(/<sup>([^<]*)<\/sup>/g, '^$1')
                .replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        const mes = [G.N(8), G.O('-'), G.N(2), G.O(':'), G.N(2)];
        const lm = G.startLine(mes);
        const bl = G.blockers(lm, 1);
        ok(
            veu(V.htmlBloqueig(lm, 1, bl)) === '2 ÷ 2 ✔ › − ✖' &&
                veu(V.htmlResultatEquivocat(lm, 3, 5)) === '2 ÷ 2 = 5 ✖' &&
                veu(V.htmlPregunta(lm, 3)) === '2 ÷ 2 = ?',
            'vista: operació bloquejada («2 ÷ 2 ✔ › − ✖»), resultat equivocat («2 ÷ 2 = 5 ✖») i la pregunta'
        );
        const taula = V.htmlTaula(G.solve(lm), { active: false });
        const actiu = V.htmlTaula([{ line: lm, op: -1 }], { active: true, red: new Set([1]), green: new Set([3]) });
        ok(
            (taula.match(/<tr/g) || []).length === 3 &&
                taula.includes('class="tok-op dest"') &&
                (actiu.match(/class="tok-btn/g) || []).length === 2 &&
                actiu.includes('tok-btn hl-red') &&
                actiu.includes('tok-btn hl-green') &&
                actiu.includes('aria-label="÷"'),
            "vista: la taula té una línia per pas, l'operació següent destacada, i els signes de la línia de treball són botons marcats"
        );
    }

    suite('a-vocabulari: banc de paraules, preguntes de cada nivell i paraula escrita lletra a lletra');
    {
        const G = await carrega('js/a-vocabulari/generador.js');
        const V = await carrega('js/a-vocabulari/vista.js');
        const l = q => G.llegeixParametres(new URLSearchParams(q));
        ok(
            l('').nivell === 1 &&
                l('?nivell=3').nivell === 3 &&
                l('?nivell=4').nivell === 1 &&
                l('?tema=botiga').tema === 'botiga' &&
                l('?tema=inventat').tema === '' &&
                l('?vistes=1').vistes === true &&
                l('').vistes === false,
            "paràmetres: nivell 1–3 (per defecte 1), ?tema= (un tema que no existeix s'ignora) i ?vistes=1"
        );
        const totes = G.totesLesParaules();
        const emojis = totes.map(e => JSON.stringify(e.imatge));
        ok(
            totes.length >= 60 && new Set(emojis).size === totes.length,
            `el banc té ${totes.length} paraules amb imatge, i cap imatge no es repeteix`
        );
        const tema = G.bancDeParaules({ tema: 'escola' });
        const vistes = G.bancDeParaules({ vistes: new Set(['poma', 'pa', 'cotxe']) });
        const buit = G.bancDeParaules({ vistes: new Set(['no-hi-es']) });
        ok(
            tema.ids.length >= 10 &&
                tema.ids.every(id => totes.find(e => e.id === id).tema === 'escola') &&
                tema.totes.length === totes.length &&
                vistes.ids.sort().join() === 'cotxe,pa,poma' &&
                buit.ids.length === totes.length,
            'banc: el tema i les vistes filtren les paraules que es pregunten; si no en queda cap, es pregunten totes; els distractors són de tot el banc'
        );
        let dolent = '';
        for (const e of totes) {
            const d = G.distractors(e.id, tema.totes);
            const mateix = totes.filter(a => a.tema === e.tema && a.id !== e.id).length;
            const delTema = d.filter(id => totes.find(a => a.id === id).tema === e.tema).length;
            if (d.length !== 3 || new Set(d).size !== 3 || d.includes(e.id)) dolent = `${e.id}: ${d}`;
            else if (new Set([...d, e.id].map(id => JSON.stringify(totes.find(a => a.id === id).imatge))).size !== 4)
                dolent = `${e.id}: imatges repetides`;
            else if (delTema !== Math.min(3, mateix)) dolent = `${e.id}: ${delTema} del tema (n'hi havia ${mateix})`;
        }
        ok(
            !dolent,
            `distractors de cada paraula: 3, diferents, amb imatges diferents i primer del mateix tema${dolent ? ` (${dolent})` : ''}`
        );
        let mal = '';
        for (let i = 0; i < 300 && !mal; i++) {
            const nivell = 1 + (i % 3);
            const p = G.generaPregunta(nivell, G.bancDeParaules({}));
            if (nivell < 3) {
                if (p.opcions.length !== 4 || p.opcions.filter(o => o.correcta).length !== 1) mal = `${p.id}: opcions`;
                else if (p.opcions.find(o => o.correcta).id !== p.id) mal = `${p.id}: la correcta no és la paraula`;
            } else if (p.opcions) mal = `${p.id}: el nivell 3 no té opcions`;
        }
        ok(
            !mal,
            `300 preguntes: 4 opcions amb només una correcta als nivells 1 i 2, i cap opció al 3${mal ? ` (${mal})` : ''}`
        );
        const fetes = new Set();
        const banc4 = { ids: ['poma', 'pa', 'llet', 'aigua'], totes: G.bancDeParaules({}).totes };
        for (let i = 0; i < 4; i++) fetes.add(G.generaPregunta(1, banc4, fetes).id);
        ok(fetes.size === 4, 'amb `excloure`, no es repeteix cap paraula mentre en queden');
        const poma = G.generaPregunta(3, { ids: ['poma'], totes: ['poma'] });
        const arbre = G.generaPregunta(3, { ids: ['arbre'], totes: ['arbre'] });
        const tomaquet = G.generaPregunta(3, { ids: ['tomaquet'], totes: ['tomaquet'] });
        const estats = (p, t) =>
            G.comparaLletres(p, t)
                .map(m => m.estat[0])
                .join('');
        ok(
            poma.text === 'la poma' &&
                poma.solucio === 'poma' &&
                G.esCorrecta(poma, 'poma') &&
                G.esCorrecta(poma, ' La Poma ') &&
                !G.esCorrecta(poma, 'pòma') &&
                G.esCorrecta(arbre, "l'arbre") &&
                G.esCorrecta(arbre, 'arbre') &&
                !G.esCorrecta(tomaquet, 'tomaquet') &&
                G.esCorrecta(tomaquet, 'tomàquet'),
            "escriure: s'accepta amb o sense l'article, amb majúscules i espais de més; però cal l'accent"
        );
        ok(
            estats(poma, 'poma') === 'oooo' &&
                estats(poma, 'pòma') === 'oaoo' &&
                estats(poma, 'pama') === 'omoo' &&
                estats(poma, 'pom') === 'ooof' &&
                estats(poma, 'pomes') === 'ooom' + 's' &&
                estats(tomaquet, 'tomaquet') === 'oooaoooo' &&
                G.comparaLletres(poma, 'pom').at(-1).lletra === '_',
            'lletra a lletra: ok, accent (´), mal, falta (_) i sobra'
        );
        const html = V.htmlLletres(G.comparaLletres(tomaquet, 'tomaquet'));
        ok(
            (html.match(/class="lletra bo"/g) || []).length === 7 &&
                (html.match(/class="lletra accent"/g) || []).length === 1 &&
                html.includes('<i aria-hidden="true">´</i>') &&
                V.htmlAccents().includes('data-lletra="ç"') &&
                V.htmlImatgeParaula('poma').includes('🍎') &&
                V.htmlImatgeParaula('pis').includes('<svg'),
            "vista: lletres amb marca, barra d'accents i imatge (emoji o pictograma)"
        );
    }

    suite(
        "a-vocabulari: la paraula escrita té tolerància davant de les errades petites (com a «Vocabulari» d'operacions)"
    );
    {
        const G = await carrega('js/a-vocabulari/generador.js');
        const V = await carrega('js/a-vocabulari/vista.js');
        const p = id => G.generaPregunta(3, { ids: [id], totes: [id] });
        const veredicte = (id, escrit) => G.avaluaEscrita(p(id), escrit).veredicte;
        const estats = (id, escrit) =>
            G.avaluaEscrita(p(id), escrit)
                .marques.map(m => m.estat[0])
                .join('');
        const casos = [
            // [paraula, escrit, veredicte esperat]
            ['poma', 'poma', 'correcta'],
            ['poma', ' La  Poma ', 'correcta'],
            ['arbre', "l'arbre", 'correcta'],
            ['tomaquet', 'tomàquet', 'correcta'],
            ['parallelogram', 'parallelogram', 'correcta'], // el punt volat no compta
            ['parallelogram', 'paral.lelogram', 'correcta'],
            ['poma', 'pòma', 'propera'], // un accent
            ['tomaquet', 'tomaquet', 'propera'],
            ['poma', 'pama', 'propera'], // una lletra equivocada
            ['poma', 'pom', 'propera'], // una lletra que falta
            ['tomaquet', 'tomquet', 'propera'],
            ['tomaquet', 'tomaquett', 'propera'], // una lletra de més
            ['tomaquet', 'tmoaquet', 'propera'], // dues lletres girades
            ['poma', 'opma', 'propera'],
            ['mcd', 'mdc', 'propera'],
            ['tomaquet', 'tomaqiit', 'propera'], // dues errades en una paraula llarga
            ['hexagon', 'exagon', 'propera'], // una lletra que falta i un accent
            ['nombre-enter', 'enter nombre', 'propera'], // les paraules en un altre ordre
            ['nombre-enter', 'nombre', 'propera'], // una paraula que falta
            ['nombre-enter', 'enter', 'propera'],
            ['nombre-enter', 'nombreenter', 'propera'], // un espai que falta
            ['poma', 'pomes', 'mal'], // dues errades en una paraula curta
            ['poma', 'pamo', 'mal'],
            ['tomaquet', 'tomaqiiz', 'mal'], // tres errades
            ['poma', 'casa', 'mal'],
            ['quadrat', 'quadrant', 'mal'], // una altra paraula del banc, no pas una errada de teclat
            ['mcd', 'mcm', 'mal'],
            ['triangle-rectangle', 'triangle', 'general'], // més general: també és cert
        ];
        const dolents = casos.filter(([id, escrit, esperat]) => veredicte(id, escrit) !== esperat);
        ok(
            dolents.length === 0,
            `${casos.length} paraules escrites: correcta, errada petita (cap intent), error de debò o més general`,
            dolents
                .map(([id, escrit, esperat]) => `${id} ← «${escrit}»: ${veredicte(id, escrit)} (esperat ${esperat})`)
                .join('\n')
        );
        ok(
            estats('tomaquet', 'tomquet') === 'ooofoooo' &&
                estats('arbre', 'arber') === 'ooocc' &&
                estats('nombre-enter', 'enter nombre') === 'ooooocoooooo' &&
                estats('nombre-enter', 'nombre') === 'ooooooffffff' &&
                estats('nombre-enter', 'enter') === 'fffffffooooo' &&
                estats('poma', 'pomes') === 'oooms' &&
                estats('tomaquet', 'tomaquet') === 'oooaoooo',
            'lletra a lletra: una lletra que falta no desplaça les altres, ⇄ marca les lletres (o les paraules) girades, i una paraula que falta surt amb una «_» per lletra'
        );
        const html = V.htmlLletres(G.avaluaEscrita(p('mcd'), 'mdc').marques);
        ok(
            html.includes('class="lletra creuada"') &&
                (html.match(/<i aria-hidden="true">⇄<\/i>/g) || []).length === 2 &&
                G.avaluaEscrita(p('parallelogram'), 'parallelogram').marques.some(m => m.lletra === '·'),
            'vista: ⇄ a les dues lletres girades, i una resposta correcta surt amb la paraula bona (amb el punt volat)'
        );
    }

    suite("a-vocabulari: al nivell d'escriure no es demana cap solució llarga («propietat commutativa»)");
    {
        const G = await carrega('js/a-vocabulari/generador.js');
        const L = await carrega('js/lexicon/lexicon.js');
        const banc = G.bancDeParaules({});
        const llarga = id => [...L.solucioBanc(id)].length;
        let mal = '';
        const demanades = new Set();
        for (let i = 0; i < 1500 && !mal; i++) {
            const q = G.generaPregunta(3, banc);
            demanades.add(q.id);
            if (llarga(q.id) > G.LLARGADA_MAXIMA_ESCRITA) mal = `${q.solucio} (${llarga(q.id)})`;
        }
        const curtes = banc.ids.filter(G.esEscrivible).length;
        ok(
            !mal &&
                G.LLARGADA_MAXIMA_ESCRITA === 14 &&
                !G.esEscrivible('propietat-commutativa') &&
                !G.esEscrivible('triangle-rectangle') &&
                !G.esEscrivible('constant-proporcionalitat') &&
                G.esEscrivible('poma') &&
                G.esEscrivible('circumferencia') &&
                G.esEscrivible('nombre-natural') &&
                curtes === 188 &&
                demanades.size === curtes,
            `1500 preguntes escrites: cap solució de més de ${G.LLARGADA_MAXIMA_ESCRITA} caràcters (${curtes} de ${banc.ids.length} paraules es poden escriure i surten totes)${mal ? `: ${mal}` : ''}`
        );
        // Als nivells de triar, els termes llargs hi continuen sortint; i un banc que només en té de llargs no es queda sense preguntes
        const llargues = new Set();
        for (let i = 0; i < 600; i++) {
            const q = G.generaPregunta(1 + (i % 2), G.bancDeParaules({ tema: 'mat-operacions' }));
            if (llarga(q.id) > G.LLARGADA_MAXIMA_ESCRITA) llargues.add(q.solucio);
        }
        const nomes = G.generaPregunta(3, { ids: ['propietat-commutativa'], totes: ['propietat-commutativa'] });
        ok(
            llargues.has('propietat commutativa') &&
                llargues.has('propietat distributiva') &&
                nomes.solucio === 'propietat commutativa',
            'als nivells 1 i 2 surten tots els termes (també «propietat commutativa»); si un banc no té cap paraula curta, es pregunta la llarga'
        );
        // Dins d'una sessió, sense repetir mentre en queden: les llargues no es fan servir per omplir
        const fetes = new Set();
        const mixt = { ids: ['poma', 'pa', 'propietat-commutativa'], totes: ['poma', 'pa', 'propietat-commutativa'] };
        const triades = [];
        for (let i = 0; i < 6; i++) {
            const q = G.generaPregunta(3, mixt, fetes);
            fetes.add(q.id);
            triades.push(q.id);
        }
        ok(
            !triades.includes('propietat-commutativa') && new Set(triades.slice(0, 2)).size === 2,
            "al nivell 3, quan s'han fet les paraules curtes, es repeteixen en lloc de preguntar la llarga"
        );
    }

    suite('album: les paraules per temes, el progrés, els enllaços i les cartes');
    {
        const L = await carrega('js/album/logica.js');
        const V = await carrega('js/album/vista.js');
        const { TEMES } = await carrega('js/lexicon/lexicon.js');
        const totes = L.paraulesDelAlbum();
        const grups = L.agrupaPerTemes(new Set(['poma', 'gos']));
        const ids = grups.flatMap(g => g.paraules.map(p => p.id));
        ok(
            ids.length === totes.length &&
                new Set(ids).size === totes.length &&
                grups.every(g => g.tema in TEMES && g.paraules.length > 0) &&
                grups.every(g => g.icona !== '📚'),
            `${totes.length} paraules en ${grups.length} temes, cap repetida, i cada tema amb la seva icona (un tema nou sense icona ho faria fallar)`
        );
        ok(
            grups
                .flatMap(g => g.paraules)
                .filter(p => p.vista)
                .map(p => p.id)
                .sort()
                .join() === 'gos,poma' && L.agrupaPerTemes().every(g => g.paraules.every(p => !p.vista)),
            'només es marquen com a vistes les paraules que ho són (i sense vistes, cap)'
        );
        const r = L.resum(new Set(['poma', 'gos', 'no-hi-es']));
        ok(
            r.vistes === 2 && r.total === totes.length && L.resum().vistes === 0,
            "el progrés compta només les paraules de l'àlbum (un id desconegut no compta)"
        );
        ok(
            L.enllacPractica() === 'a-vocabulari.html' &&
                L.enllacPractica({ vistes: true }) === 'a-vocabulari.html?vistes=1' &&
                L.enllacPractica({ tema: 'animals' }) === 'a-vocabulari.html?tema=animals' &&
                L.enllacPractica({ tema: 'casa', vistes: true }) === 'a-vocabulari.html?tema=casa&vistes=1',
            'enllaços per practicar a Vocabulari (les vistes o un tema)'
        );
        const vista = { id: 'poma', text: 'la poma', vista: true };
        const bloq = { ...vista, vista: false };
        const veu = h => h.replace(/<[^>]*>/g, '').trim();
        ok(
            V.htmlCarta(vista).includes('role="button"') &&
                V.htmlCarta(vista).includes('data-paraula="poma"') &&
                !V.htmlCarta(vista).includes('album-bloquejada') &&
                veu(V.htmlCarta(vista)) === '🍎la poma' &&
                V.htmlCarta(bloq).includes('album-bloquejada') &&
                veu(V.htmlCarta(bloq)) === '🍎?' &&
                !V.htmlCarta(bloq).includes('la poma'),
            "carta: com a píndola tocable; si no s'ha vist, «?» i la paraula no hi és enlloc"
        );
        const grup = V.htmlGrup(grups[0], 'Jugar');
        const prog = V.htmlProgres({ vistes: 12, total: 65 }, 'Paraules');
        ok(
            grup.includes(`data-tema="${grups[0].tema}"`) &&
                grup.includes('aria-label="Jugar"') &&
                grup.includes(`a-vocabulari.html?tema=${grups[0].tema}`) &&
                veu(prog) === '12 / 65' &&
                prog.includes('aria-valuenow="12"') &&
                prog.includes('width: 18%'),
            'grup amb la icona i el ▶, i el progrés «12 / 65» amb la seva barra'
        );
    }

    suite("vocabulari matemàtic: temes, paraules amb imatge de mini-exemple, frases i noms de més d'una paraula");
    {
        const L = await carrega('js/lexicon/lexicon.js');
        const G = await carrega('js/a-vocabulari/generador.js');
        const { MATES } = await carrega('js/lexicon/mates.js');
        const { paraula } = await carrega('js/lexicon/paraula.js');
        const mat = L.paraulesDelBanc().filter(e => e.tema.startsWith('mat-'));
        const perTema = {};
        for (const e of mat) (perTema[e.tema] ||= []).push(e.id);
        const temes = Object.keys(L.TEMES).filter(t => t.startsWith('mat-'));
        ok(
            mat.length >= 130 &&
                temes.length === 11 &&
                temes.every(t => (perTema[t] || []).length >= 7) &&
                mat.every(e => e.imatge.mates || e.imatge.emoji) &&
                mat.filter(e => e.imatge.mates).length === Object.keys(MATES).length,
            `${mat.length} termes de matemàtiques en ${temes.length} temes (de ${Math.min(...temes.map(t => perTema[t].length))} a ${Math.max(...temes.map(t => perTema[t].length))} cada un), tots amb imatge`
        );
        const text = id => L.textBanc(id);
        ok(
            text('equacio') === "l'equació" &&
                text('incognita') === 'la incògnita' &&
                text('nombre-enter') === 'el nombre enter' &&
                text('hipotenusa') === 'la hipotenusa' &&
                text('igualtat') === 'la igualtat' &&
                text('exponent') === "l'exponent" &&
                text('hexagon') === "l'hexàgon" &&
                text('parallelogram') === 'el paral·lelogram' &&
                text('resoldre-equacio') === 'resoldre una equació' &&
                text('mcd') === 'MCD' &&
                L.solucioBanc('mcm') === 'MCM' &&
                L.solucioBanc('nombre-enter') === 'nombre enter' &&
                L.solucioBanc('simplificar-fraccio') === 'simplificar una fracció' &&
                L.entrada('nombre-negatiu').plural === 'nombres negatius' &&
                L.ambArticle('quadrant', { plural: true }) === 'els quadrants',
            "articles i formes: «l'equació», «la incògnita», «el nombre enter», «la hipotenusa», «el paral·lelogram», les frases i les sigles sense article"
        );
        const banc = G.bancDeParaules({ tema: 'mat-algebra' });
        ok(
            banc.ids.includes('equacio') &&
                banc.ids.includes('resoldre-equacio') &&
                banc.ids.every(id => L.entrada(id).tema === 'mat-algebra') &&
                banc.totes.length === L.paraulesDelBanc().length,
            "el banc d'un tema de matemàtiques té els seus termes, i les frases hi són (els distractors són de tot el banc)"
        );
        const mcd = G.generaPregunta(3, { ids: ['mcd'], totes: banc.totes });
        const p = G.generaPregunta(3, { ids: ['resoldre-equacio'], totes: banc.totes });
        const q = G.generaPregunta(3, { ids: ['nombre-enter'], totes: banc.totes });
        ok(
            G.esCorrecta(p, 'Resoldre una equació') &&
                !G.esCorrecta(p, 'resoldre equació') &&
                G.esCorrecta(mcd, 'MCD') &&
                G.esCorrecta(mcd, 'mcd') &&
                !G.esCorrecta(mcd, 'mcm') &&
                G.comparaLletres(mcd, 'mcd').every(m => m.estat === 'ok') &&
                G.esCorrecta(q, 'nombre enter') &&
                G.esCorrecta(q, 'el nombre enter') &&
                G.comparaLletres(q, 'nombre entre')
                    .map(m => m.estat[0])
                    .join('') === 'oooooooooocc' &&
                G.generaPregunta(1, banc).opcions.length === 4,
            "escriure un terme de més d'una paraula: s'accepta amb o sense article, i surt lletra a lletra"
        );
        const html = paraula('equacio');
        ok(
            html.includes('class="mat"') &&
                html.includes('x + 3 = 8') &&
                paraula('angle-agut').includes('<svg class="mat-svg"'),
            'una paraula matemàtica surt amb el seu mini-exemple o el seu dibuix (paraula())'
        );
    }

    suite('vocabulari: cap opció equivocada no és també una resposta certa (js/lexicon/relacions.js)');
    {
        const L = await carrega('js/lexicon/lexicon.js');
        const G = await carrega('js/a-vocabulari/generador.js');
        const R = await carrega('js/lexicon/relacions.js');
        const banc = G.bancDeParaules({});
        const al = new Set(banc.totes);
        const fora = [...Object.entries(R.PARE), ...Object.entries(R.TAMBE)]
            .flatMap(([k, v]) => [k, ...[v].flat()])
            .filter(id => !al.has(id));
        const cicle = Object.keys(R.PARE).filter(id => {
            const vistos = new Set();
            for (let p = R.PARE[id]; p; p = R.PARE[p]) if (p === id || vistos.has(p)) return true;
            return false;
        });
        const sense = [...new Set(L.paraulesDelBanc().map(e => e.tema))].filter(
            t => !R.FAMILIES_DE_TEMES.some(f => f.includes(t))
        );
        ok(
            fora.length === 0 && cicle.length === 0 && sense.length === 0,
            `les taules de relacions només parlen de paraules del banc, la jerarquia no té cicles i cada tema del banc és a una família${fora.length ? ` (no són al banc: ${[...new Set(fora)]})` : ''}${cicle.length ? ` (cicle: ${cicle})` : ''}${sense.length ? ` (temes sense família: ${sense})` : ''}`
        );
        const t = id => [...R.tambeEs(id)].sort().join();
        ok(
            t('triangle-rectangle') === 'figura,poligon,triangle,triangle-escale' &&
                R.tambeEs('quadrat').has('rombe') &&
                R.tambeEs('quadrat').has('poligon') &&
                R.tambeEs('nombre-primer').has('nombre-enter') &&
                R.tambeEs('hipotenusa').has('triangle-rectangle') &&
                !R.tambeEs('triangle').has('triangle-rectangle') &&
                !R.tambeEs('triangle-rectangle').has('triangle-equilater'),
            'tambeEs: un triangle rectangle també és triangle, polígon i figura (i un triangle escalè); però un triangle qualsevol no és rectangle ni un rectangle és equilàter'
        );
        // Tot el banc, als dos nivells de triar: els distractors són 3 i mai no són certs
        let dolent = '';
        for (const id of banc.totes)
            for (const nivell of [1, 2])
                for (let k = 0; k < 6 && !dolent; k++) {
                    const d = G.distractors(id, banc.totes, 3, nivell);
                    const cert = d.find(a => G.esAmbigua(id, a, nivell));
                    if (d.length !== 3) dolent = `${id} (nivell ${nivell}): només ${d.length} distractors`;
                    else if (cert) dolent = `${id} (nivell ${nivell}): «${cert}» també és certa`;
                }
        ok(
            !dolent,
            `${banc.totes.length} paraules × 2 nivells × 6 sortejos: sempre 3 distractors i cap és també certa${dolent ? ` (${dolent})` : ''}`
        );
        // Els distractors d'un objecte són objectes i els d'un terme de matemàtiques són termes (ni «el pis» amb un «quocient»)
        const esMat = id => L.entrada(id).tema.startsWith('mat-');
        let barreja = '';
        for (const id of banc.totes)
            for (let k = 0; k < 6 && !barreja; k++) {
                const mal = G.distractors(id, banc.totes, 3, 1).find(a => esMat(a) !== esMat(id));
                if (mal) barreja = `${id} amb «${mal}»`;
            }
        ok(
            !barreja,
            `els distractors d'un objecte són objectes i els d'un terme de matemàtiques, termes${barreja ? ` (${barreja})` : ''}`
        );
        // El cas de la persona que ha provat l'activitat: la imatge d'un triangle rectangle no pot portar «el polígon»
        let vist = '';
        for (let k = 0; k < 300 && !vist; k++) {
            const n1 = G.distractors('triangle-rectangle', banc.totes, 3, 1);
            const n2 = G.distractors('poligon', banc.totes, 3, 2);
            const intrus = n1.find(a => ['poligon', 'triangle', 'triangle-escale', 'figura'].includes(a));
            const imatge = n2.find(a => R.tambeEs(a).has('poligon'));
            if (intrus) vist = `triangle rectangle → «${intrus}»`;
            else if (imatge) vist = `polígon → la imatge de «${imatge}»`;
        }
        ok(
            !vist,
            `300 sortejos: a un triangle rectangle no li toca «el polígon», «el triangle» ni «el triangle escalè», i a «el polígon» no li toca cap polígon${vist ? ` (${vist})` : ''}`
        );
        // Escriure una paraula més general: és certa, però no la que es busca (✔ 🔍, sense error)
        const tr = G.generaPregunta(3, { ids: ['triangle-rectangle'], totes: banc.totes });
        const q = G.generaPregunta(3, { ids: ['quadrat'], totes: banc.totes });
        ok(
            G.esMesGeneral(tr, 'triangle') &&
                G.esMesGeneral(tr, 'el triangle') &&
                G.esMesGeneral(tr, ' Polígon ') &&
                G.esMesGeneral(tr, 'triangle escalè') &&
                G.esMesGeneral(q, 'rombe') &&
                !G.esMesGeneral(tr, 'triangle rectangle') &&
                !G.esMesGeneral(tr, 'el triangle rectangle') &&
                !G.esMesGeneral(tr, 'hexàgon') &&
                !G.esMesGeneral(tr, 'triangle equilàter') &&
                !G.esMesGeneral(tr, 'poma') &&
                !G.esCorrecta(tr, 'triangle'),
            'esMesGeneral: «triangle», «polígon»… són certs per a un triangle rectangle però no la resposta; la bona i les equivocades no hi compten'
        );
    }

    suite('targetes imprimibles: temes, pàgines, doble cara, peu i resum (js/targetes/)');
    {
        const G = await carrega('js/targetes/generador.js');
        const V = await carrega('js/targetes/vista.js');
        const L = await carrega('js/lexicon/lexicon.js');
        const temes = G.temesDelBanc();
        const totes = G.targetesDe(temes.map(t => t.tema));
        const l = q => G.llegeixParametres(new URLSearchParams(q));
        ok(
            totes.length === L.paraulesDelBanc().length &&
                totes.length === temes.reduce((s, t) => s + t.n, 0) &&
                new Set(totes.map(t => t.id)).size === totes.length &&
                temes.every(t => t.nom && t.icona !== '📚') &&
                G.targetesDe(['mat-figures']).length === temes.find(t => t.tema === 'mat-figures').n &&
                G.targetesDe([]).length === 0,
            `${totes.length} targetes (les paraules del banc, cap repetida) en ${temes.length} temes, cada un amb nom i icona`
        );
        const estat = l('?temes=mat-figures,animals,inventat&mida=4&contingut=doblecara&color=color');
        ok(
            l('').temes.length === temes.length &&
                l('').mida === 9 &&
                l('').contingut === 'tot' &&
                l('').color === 'bn' &&
                estat.temes.join() === 'animals,mat-figures' &&
                l('?temes=').temes.length === 0 &&
                l('?mida=16').mida === 9 &&
                l('?contingut=altre').contingut === 'tot' &&
                l('?color=x').color === 'bn' &&
                G.queryDe(estat) === 'temes=animals,mat-figures&mida=4&contingut=doblecara&color=color' &&
                JSON.stringify(l(G.queryDe(estat))) === JSON.stringify(estat) &&
                G.queryDe(l('')) === '',
            "paràmetres de la URL: per defecte tots els temes, 9 per pàgina, imatge i paraula i en blanc i negre; un tema o una mida que no existeix s'ignora; i tornen a la URL sense el que és per defecte"
        );
        const cinc = totes.slice(0, 5);
        const ids = caselles => caselles.map(c => (c ? c.id : null));
        const sola = G.pagines(totes.slice(0, 14), 9, 'tot');
        const doble = G.pagines(cinc, 9, 'doblecara');
        ok(
            G.grups(totes, 9).length === Math.ceil(totes.length / 9) &&
                sola.length === 2 &&
                sola.every(p => p.caselles.length === 9 && p.cara === 0 && p.contingut === 'tot') &&
                sola[1].caselles.filter(Boolean).length === 5 &&
                doble.length === 2 &&
                doble[0].cara === 1 &&
                doble[0].contingut === 'imatge' &&
                doble[1].cara === 2 &&
                doble[1].contingut === 'paraula' &&
                JSON.stringify(ids(doble[1].caselles)) ===
                    JSON.stringify([2, 1, 0, null, 4, 3, null, null, null].map(i => (i === null ? null : cinc[i].id))),
            'repartiment: 9 caselles per pàgina (les que sobren, buides) i, a doble cara, el davant amb les imatges i el darrere amb les paraules, amb cada fila girada'
        );
        let desalineada = '';
        for (const mida of G.MIDES) {
            const [columnes] = G.QUADRICULES[mida];
            const p = G.pagines(totes, mida, 'doblecara');
            for (let i = 0; i < p.length; i += 2)
                p[i].caselles.forEach((c, k) => {
                    const darrere =
                        p[i + 1].caselles[Math.floor(k / columnes) * columnes + (columnes - 1 - (k % columnes))];
                    if ((c && c.id) !== (darrere && darrere.id))
                        desalineada = `${mida} per pàgina, pàgina ${i + 1}, casella ${k}`;
                });
        }
        ok(
            !desalineada &&
                G.resum(14, 9).pagines === 2 &&
                G.resum(14, 9, 'doblecara').pagines === 4 &&
                G.resum(0, 9, 'doblecara').pagines === 0,
            `a doble cara, la paraula queda just darrere de la seva imatge en girar el full per la vora llarga (amb 1, 4 i 9 per pàgina)${desalineada ? `: ${desalineada}` : ''}`
        );
        const poma = totes.find(t => t.id === 'poma');
        const tot = V.htmlTargeta(poma);
        const imatge = V.htmlTargeta(poma, 'imatge');
        const paraula = V.htmlTargeta(poma, 'paraula');
        const peu = V.htmlPagina(doble[1], 9, 2, 2);
        ok(
            tot.includes('targeta-imatge targeta-emoji') &&
                tot.includes('🍎') &&
                tot.includes('<div class="targeta-mot">la poma</div>') &&
                imatge.includes('role="img" aria-label="la poma"') &&
                !imatge.includes('targeta-mot') &&
                !paraula.includes('targeta-imatge') &&
                paraula.includes('la poma') &&
                V.htmlTargeta(totes.find(t => t.id === 'pis')).includes('targeta-pictograma') &&
                V.htmlTargeta(totes.find(t => t.id === 'triangle-rectangle')).includes('targeta-mates') &&
                V.htmlTargeta(totes.find(t => t.id === 'mcd')).includes('>MCD<') &&
                V.htmlTargeta(null).includes('targeta-buida') &&
                !V.htmlTargeta(null).includes('data-paraula') &&
                peu.includes('--columnes: 3; --files: 3') &&
                peu.includes('data-contingut="paraula"') &&
                (peu.match(/data-paraula=/g) || []).length === 5 &&
                (peu.match(/targeta-buida/g) || []).length === 4 &&
                peu.includes('Targetes de vocabulari · 2 / 2 · darrere'),
            'vista: la targeta (imatge i paraula, només la imatge amb nom accessible, o només la paraula), les imatges de cada mena, les caselles buides i el peu de la pàgina'
        );
        ok(
            V.textPeu({ cara: 0 }, 3, 12) === 'Targetes de vocabulari · 3 / 12' &&
                V.textPeu({ cara: 1 }, 1, 4).endsWith('· davant') &&
                V.textResum(36, 4) === '36 targetes · 4 pàgines' &&
                V.textResum(1, 1) === '1 targeta · 1 pàgina' &&
                V.textResum(0, 0) === '0 targetes · 0 pàgines' &&
                V.htmlTema(temes[0], true).includes(' checked') &&
                !V.htmlTema(temes[0], false).includes('checked') &&
                V.htmlTema(temes[0], true).includes(`value="${temes[0].tema}"`),
            "resum i peu amb el singular, i el botó d'un tema"
        );
    }

    suite("portada de l'alumnat i panell del professorat: el catàleg d'activitats (js/portada/)");
    {
        const C = await carrega('js/portada/activitats.js');
        const V = await carrega('js/portada/vista.js');
        const { entrada } = await carrega('js/lexicon/lexicon.js');
        const titol = f => (fs.readFileSync(path.join(ROOT, f), 'utf8').match(/<title>([^<]*)<\/title>/) || [])[1];

        // El nom d'una fitxa és el títol de la pàgina: l'alumne reconeix el que ha tocat
        const noms = [...C.ACTIVITATS, C.ALBUM].filter(a => a.nom !== titol(a.file));
        ok(
            noms.length === 0 && new Set(C.ACTIVITATS.map(a => a.etiqueta)).size === C.ACTIVITATS.length,
            "el nom de cada fitxa és el títol de la pàgina de l'activitat (i de l'àlbum); les etiquetes del professorat no es repeteixen",
            noms.map(a => `${a.file}: «${a.nom}» ≠ «${titol(a.file)}»`).join('\n')
        );

        // Els nivells (i el nivell per defecte) són els que de debò entén cada generador
        const problemes = [];
        for (const a of C.ACTIVITATS) {
            const nom = a.file.replace('.html', '');
            const G = await carrega(`js/${nom}/generador.js`);
            const llegeix = q => G.llegeixParametres(new URLSearchParams(q));
            if (!a.nivells.length) {
                if (G.llegeixParametres && llegeix('nivell=1').nivell !== undefined)
                    problemes.push(`${nom}: té nivells i el catàleg no els declara`);
                continue;
            }
            if (llegeix('').nivell !== a.nivellDefecte)
                problemes.push(`${nom}: el nivell per defecte és el ${llegeix('').nivell}, no el ${a.nivellDefecte}`);
            for (let n = 1; n <= a.nivells.length; n++)
                if (llegeix(`nivell=${n}`).nivell !== n) problemes.push(`${nom}: no admet el nivell ${n}`);
            for (const n of [0, a.nivells.length + 1])
                if (llegeix(`nivell=${n}`).nivell !== a.nivellDefecte)
                    problemes.push(`${nom}: admet el nivell ${n} (el catàleg en declara ${a.nivells.length})`);
        }
        const GV = await carrega('js/a-vocabulari/generador.js');
        ok(
            problemes.length === 0 &&
                C.ACTIVITATS.filter(a => a.tema).length === 1 &&
                C.activitatDe('a-vocabulari.html').tema &&
                GV.llegeixParametres(new URLSearchParams('tema=mat-figures')).tema === 'mat-figures',
            `els nivells del catàleg són els de cada generador (${C.ACTIVITATS.filter(a => a.nivells.length).length} activitats amb nivells), i només «Vocabulari» admet ?tema=`,
            problemes.join('\n')
        );

        // L'enllaç del professorat: sempre sessions, preguntes i errors; el nivell, el tema i la sessió fixa només si l'activitat els admet
        const base = 'https://a.step-quiz.net/';
        const dades = { sessions: 1, preguntes: 6, intents: 4 };
        const sense = `${base}a-enters.html?totalsessions=1&totaloperations=6&maxintents=4`;
        const enters = C.activitatDe('a-enters.html');
        const vocabulari = C.activitatDe('a-vocabulari.html');
        const ordenar = C.activitatDe('a-enters-ordenar.html');
        ok(
            C.enllacProfessorat(base, enters, dades) === sense &&
                C.enllacProfessorat(base, enters, { ...dades, nivell: '1', fixed: 'B' }) ===
                    `${sense}&nivell=1&fixed=B` &&
                C.enllacProfessorat(base, enters, { ...dades, nivell: '', tema: '', fixed: '' }) === sense &&
                C.enllacProfessorat(base, enters, { ...dades, nivell: '3', fixed: 'D' }) === sense &&
                C.enllacProfessorat(base, enters, { ...dades, nivell: '0', tema: 'botiga' }) === sense &&
                C.enllacProfessorat(base, ordenar, { ...dades, nivell: '1' }) ===
                    `${base}a-enters-ordenar.html?totalsessions=1&totaloperations=6&maxintents=4` &&
                C.enllacProfessorat(base, vocabulari, {
                    sessions: 2,
                    preguntes: 3,
                    intents: 5,
                    nivell: '3',
                    tema: 'botiga',
                    fixed: 'A',
                }) ===
                    `${base}a-vocabulari.html?totalsessions=2&totaloperations=3&maxintents=5&nivell=3&tema=botiga&fixed=A`,
            "l'enllaç del professorat porta només els paràmetres que l'activitat entén (nivell vàlid, tema, sessió fixa)"
        );

        // Les fitxes de la portada de l'alumnat
        const fitxes = C.fitxesAlumne();
        const htmls = fitxes.map(V.htmlFitxa);
        const buides = fitxes.filter(f => f.imatge.id && !entrada(f.imatge.id).imatge).map(f => f.file);
        ok(
            fitxes.length === C.ACTIVITATS.length + 1 &&
                fitxes[0].file === 'a-vocabulari.html' &&
                fitxes[1].file === 'album.html' &&
                new Set(fitxes.map(f => f.file)).size === fitxes.length &&
                buides.length === 0 &&
                htmls.every(
                    (h, i) =>
                        h.includes(`<a class="fitxa" href="${fitxes[i].file}">`) &&
                        h.includes(`<span class="fitxa-nom">${fitxes[i].nom.replace(/&/g, '&amp;')}</span>`) &&
                        !/class="fitxa-imatge [^"]*" aria-hidden="true"><\/span>/.test(h)
                ),
            "la portada de l'alumnat té una fitxa (enllaç, imatge i nom) per activitat i l'àlbum, just després de «Vocabulari»",
            buides.join(', ')
        );
        const menes = f => (V.htmlFitxa(f).match(/fitxa-imatge fitxa-(\w+)/) || [])[1];
        ok(
            menes(C.activitatDe('a-vocabulari.html')) === 'emoji' &&
                menes(C.activitatDe('a-rellotge.html')) === 'emoji' &&
                menes(C.activitatDe('a-decimals.html')) === 'pictograma' &&
                menes(C.activitatDe('a-equacions.html')) === 'mates' &&
                V.htmlFitxa({ file: 'x.html', nom: 'a<b & "c"', imatge: { emoji: '🍎' } }).includes(
                    'a&lt;b &amp; &quot;c&quot;'
                ),
            'la imatge de la fitxa és un emoji, un pictograma o una imatge de matemàtiques (cada una amb la seva mida); el nom va escapat'
        );
    }

    suite('Instruccions: quina frase toca a Coordenades i a Temperatura (formaInstruccio)');
    {
        const C = await carrega('js/a-pla-cartesia/generador.js');
        const T = await carrega('js/a-recta-numerica/generador.js');
        const f = (tipus, lloc = 'Q1', nivell = 1) => C.formaInstruccio({ tipus, lloc }, nivell);
        ok(
            f('situa') === 'situa' && f('coordenades') === 'coordenades',
            'Coordenades: «situa» i «coordenades» diuen cada una la seva'
        );
        ok(
            f('quadrant', 'Q2', 1) === 'quadrant' &&
                f('quadrant', 'Q2', 2) === 'quadrant' &&
                f('quadrant', 'eixX', 3) === 'on',
            'Coordenades: «en quin quadrant» als nivells 1 i 2 i «on» al 3 (amb eixos i origen)'
        );
        ok(
            f('al-quadrant', 'Q3', 2) === 'al-quadrant' &&
                f('al-quadrant', 'eixY', 3) === 'al-eix' &&
                f('al-quadrant', 'eixX', 3) === 'al-eix' &&
                f('al-quadrant', 'origen', 3) === 'a-lorigen',
            "Coordenades: escriure un punt d'un quadrant, d'un eix o l'origen"
        );
        const t = (tipus, x, extrem) => T.formaInstruccio({ tipus, x, extrem });
        ok(t('Q1', 0) === 'avui' && t('Q2', -1) === 'ahir' && t('Q2', 1) === 'dema', 'Temperatura: avui, ahir i demà');
        ok(
            [-5, -4, -3, -2].every(x => t('Q2', x) === 'passat') && [2, 3, 4, 5].every(x => t('Q2', x) === 'futur'),
            'Temperatura: un dia passat és «feia» i un de futur és «farà»'
        );
        ok(
            t('Q3') === 'recompte' && t('Q4', 0, 'calent') === 'calent' && t('Q4', 0, 'fred') === 'fred',
            'Temperatura: el recompte de dies i el dia més calent o més fred'
        );
    }

    finish();
})().catch(e => {
    console.error(e);
    process.exit(1);
});
