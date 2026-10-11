/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/game-core.test.js
 * ROL: Proves del MOTOR NOU (mòduls ES de js/: utils.js, config.js i game-core.js),
 *      carregats de manera NATIVA (import() de Node) sense navegador. Només es
 *      proven les funcions que no necessiten pantalla; la resta (pantalles,
 *      teclat…) es prova al navegador: tests/navegador.
 * ÚS: node tests/game-core.test.js
 * ============================================================================
 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { ROOT, suite, ok, finish, sembra, restauraAtzar, exigeixNode22 } = require('./harness');

exigeixNode22();

// Entorn mínim perquè els mòduls es puguin carregar sense navegador:
// window (config.js i game-core.js) i window.location (config.js).
globalThis.window = globalThis;

let versio = 0;
/** Importa js/<fitxer> simulant la URL de la pàgina (`cerca`) i el window.APP_CONFIG de l'activitat. */
function carrega(fitxer, cerca = '', appConfig = undefined) {
    globalThis.location = { search: cerca };
    globalThis.APP_CONFIG = appConfig;
    // La «versió» fa que cada importació sigui un mòdul nou (així es poden provar diverses URL)
    return import(`${pathToFileURL(path.join(ROOT, fitxer)).href}?v=${++versio}`);
}

(async () => {
    suite('utils.js: funcions pures');
    {
        const U = await carrega('js/utils.js');
        const p = q => new URLSearchParams(q);
        ok(U.getIntParam(p(''), 'a', 7, 1, 10) === 7, 'getIntParam: sense paràmetre → valor per defecte');
        ok(U.getIntParam(p('a=4'), 'a', 7, 1, 10) === 4, 'getIntParam: valor vàlid');
        ok(U.getIntParam(p('a=0'), 'a', 7, 1, 10) === 7, 'getIntParam: per sota del mínim → per defecte');
        ok(U.getIntParam(p('a=11'), 'a', 7, 1, 10) === 7, 'getIntParam: per sobre del màxim → per defecte');
        ok(U.getIntParam(p('a=2.5'), 'a', 7, 1, 10) === 7, 'getIntParam: decimal → per defecte');
        ok(U.getIntParam(p('a=x'), 'a', 7, 1, 10) === 7, 'getIntParam: text → per defecte');

        const r = Array.from({ length: 5000 }, () => U.randInt(-3, 4));
        ok(
            r.every(n => Number.isInteger(n) && n >= -3 && n <= 4),
            'randInt(-3, 4): sempre un enter dins del rang (5.000 mostres)'
        );
        ok(new Set(r).size === 8, 'randInt(-3, 4): surten els 8 valors possibles');
        ok(
            Array.from({ length: 3000 }, () => U.randIntNonZero(-2, 2)).every(n => n !== 0),
            'randIntNonZero: mai 0'
        );
        const llista = [1, 2, 3];
        ok(
            Array.from({ length: 300 }, () => U.pick(llista)).every(n => llista.includes(n)),
            'pick: sempre un element de la llista'
        );
        const original = [1, 2, 3, 4, 5, 6];
        const barrejat = U.shuffle(original.slice());
        ok(
            barrejat.slice().sort().join() === original.join(),
            'shuffle: és una permutació (no perd ni repeteix elements)'
        );
        sembra(99);
        const comptes = {};
        for (let i = 0; i < 6000; i++) {
            const clau = U.shuffle([1, 2, 3]).join('');
            comptes[clau] = (comptes[clau] || 0) + 1;
        }
        restauraAtzar();
        const valors = Object.values(comptes);
        ok(
            valors.length === 6 && valors.every(n => n > 850 && n < 1150),
            `shuffle: les 6 permutacions de 3 elements surten amb la mateixa freqüència (${valors.join(', ')} de 6.000)`
        );
        ok(
            [U.gcd(12, 18), U.gcd(-12, 18), U.gcd(7, 0), U.gcd(0, 0), U.gcd(17, 5)].join() === '6,6,7,0,1',
            'gcd: màxim comú divisor (sempre ≥ 0)'
        );
        ok([U.gcd(-12, 0), U.gcd(0, -5), U.gcd(-4, -6)].join() === '12,5,2', 'gcd: el resultat no és mai negatiu');
        ok(
            [
                U.parseStrictInt('12'),
                U.parseStrictInt(' -7 '),
                U.parseStrictInt('1.5'),
                U.parseStrictInt('1e2'),
                U.parseStrictInt('0x10'),
                U.parseStrictInt('12abc'),
                U.parseStrictInt(''),
            ]
                .map(String)
                .join() === '12,-7,NaN,NaN,NaN,NaN,NaN',
            'parseStrictInt: només enters'
        );
    }

    suite('config.js: paràmetres de la URL');
    {
        const v = async (cerca, app) => {
            const C = await carrega('js/config.js', cerca, app);
            return [C.TOTAL_SESSIONS, C.TOTAL_OPERATIONS, C.MAX_INTENTS].join(',');
        };
        let r = await v('');
        ok(r === '1,3,4', `sense paràmetres: ${r} (sessions, preguntes, intents)`);
        r = await v('?totalsessions=2&totaloperations=5&maxintents=8');
        ok(r === '2,5,8', 'valors del professor');
        r = await v('?totalsessions=0&totaloperations=31&maxintents=11');
        ok(r === '1,3,4', 'fora de rang → per defecte');
        r = await v('?totalsessions=20&totaloperations=30&maxintents=10');
        ok(r === '20,30,10', 'els màxims permesos (20, 30, 10)');
        r = await v('?totalsessions=abc&totaloperations=2.5&maxintents=');
        ok(r === '1,3,4', 'text, decimals o buit → per defecte');
        r = await v('?maxenllocmitjana=0&totaloperations=2');
        ok(r === '1,2,4', "el paràmetre antic de la nota s'ignora");
        r = await v('', { defaultSessions: 2, defaultOperations: 4, defaultIntents: 5 });
        ok(r === '2,4,5', "els valors per defecte de l'activitat (window.APP_CONFIG)");
        r = await v('?totaloperations=7', { defaultSessions: 2, defaultOperations: 4, defaultIntents: 5 });
        ok(r === '2,7,5', "els paràmetres de la URL manen sobre els de l'activitat");
    }

    suite('game-core.js: punts i estrelles');
    const G = await carrega('js/game-core.js');
    {
        const taula = [
            [0, 30, 0],
            [1, 30, 1],
            [5, 30, 1],
            [6, 30, 1],
            [15, 30, 3],
            [20, 30, 3],
            [24, 30, 4],
            [29, 30, 5],
            [30, 30, 5],
            [40, 30, 5],
            [10, 0, 0],
            [-3, 30, 0],
        ];
        const dolents = taula
            .filter(([p, m, e]) => G.calculaEstrelles(p, m) !== e)
            .map(([p, m, e]) => `${p}/${m} → esperat ${e}`);
        ok(
            dolents.length === 0,
            'calculaEstrelles: 0 punts = 0 estrelles; qualsevol punt = ≥ 1; el màxim = 5',
            dolents.join('; ')
        );

        const pp = G.puntsPregunta;
        ok(
            [pp(true, 0), pp(true, 1), pp(true, 2), pp(true, 3), pp(true, 4)].join() === '10,8,6,4,2',
            'puntsPregunta: 10 menys 2 per error'
        );
        ok(
            [pp(true, 5), pp(true, 6), pp(true, 9)].join() === '1,1,1',
            'puntsPregunta: un encert tardà val sempre 1 punt (R5)'
        );
        ok([pp(false, 0), pp(false, 5)].join() === '0,0', "puntsPregunta: si no s'encerta, 0 punts");

        ok(
            [0, 1, 2, 10].map(n => G.textPunts(n)).join('|') === '0 punts|1 punt|2 punts|10 punts',
            'textPunts: singular només per a 1'
        );
        ok(`${G.textPunts(1, true)}|${G.textPunts(8, true)}` === '+1 punt|+8 punts', 'textPunts amb «+»');

        const h = G.htmlEstrelles(3);
        ok(
            (h.match(/star on/g) || []).length === 3 && (h.match(/star off/g) || []).length === 2,
            'htmlEstrelles(3): 3 estrelles guanyades i 2 atenuades'
        );
        ok(/aria-label="3 de 5 estrelles"/.test(h), 'htmlEstrelles: etiqueta per a lectors de pantalla');
        ok(G.MAX_PUNTS_PREGUNTA === 10 && G.MAX_ESTRELLES === 5, 'màxim de 10 punts per pregunta i 5 estrelles');
    }

    suite('game-core.js: pantalla final (amb un DOM mínim)');
    {
        const resum = { innerHTML: '' };
        globalThis.document = { getElementById: id => (id === 'final-summary' ? resum : null) };
        const pinta = scores => {
            G.state.sessionScores = scores;
            G.renderFinalSummary();
            return resum.innerHTML;
        };
        const on = html => (html.match(/star on/g) || []).length;
        let html = pinta([30]);
        ok(
            on(html) === 5 && /<strong>30<\/strong> \/ 30 punts/.test(html),
            'una sessió perfecta: 5 estrelles i «30 / 30 punts»'
        );
        html = pinta([20]);
        ok(on(html) === 3 && /<strong>20<\/strong> \/ 30 punts/.test(html), '20 de 30: 3 estrelles');
        ok(on(pinta([0])) === 0 && on(pinta([1])) === 1, '0 punts = 0 estrelles; 1 punt = 1 estrella');
        html = pinta([30, 20]);
        ok(
            (html.match(/class="session-line"/g) || []).length === 2 && /session-line--total/.test(html),
            'dues sessions: una línia per sessió i la del total'
        );
        ok(
            /Sessió 1/.test(html) && /Sessió 2/.test(html) && /50 \/ 60/.test(html),
            'dues sessions: «Sessió 1», «Sessió 2» i «50 / 60»'
        );
        ok(!/codi|nota|criteri/i.test(html), 'la pantalla final no parla de codis, notes ni criteris');
        delete globalThis.document;
        G.state.sessionScores = [];
    }

    suite('textos.js: format() omple els {valors} i falla si en falta algun');
    {
        const { TEXTOS_COMUNS, format } = await carrega('js/textos.js');
        ok(format('Sessió {n} de {total}', { n: 1, total: 3 }) === 'Sessió 1 de 3', 'omple els valors');
        ok(format('{n} / {n}', { n: 7 }) === '7 / 7', 'un valor es pot repetir');
        ok(format('Molt bé!') === 'Molt bé!', 'un text sense valors queda igual');
        ok(format('{n}', { n: 0 }) === '0', 'el 0 és un valor vàlid');
        let error = '';
        try {
            format('Sessió {n} de {total}', { n: 1 });
        } catch (e) {
            error = e.message;
        }
        ok(
            /Falta el valor «total»/.test(error),
            "si falta un valor, falla amb un missatge que diu quin (no arriba a l'alumne com a «{total}»)"
        );
        ok(
            format(TEXTOS_COMUNS.estrelles, { n: 3, max: 5 }) === '3 de 5 estrelles' &&
                format(TEXTOS_COMUNS.sessioFixa, { lletra: 'B' }) === 'Sessió fixa B',
            'textos comuns'
        );
        ok(
            Object.values(TEXTOS_COMUNS).every(x => typeof x === 'string' && x.trim()),
            'tots els textos comuns són text no buit'
        );
    }

    suite('game-core.js: revisió, text i lectura per als tests');
    {
        ok(
            G.escapeHtml('<b>"a" & \'b\'</b>') === '&lt;b&gt;&quot;a&quot; &amp; &#039;b&#039;&lt;/b&gt;' &&
                G.escapeHtml(null) === '',
            'escapeHtml: escapa <, >, &, cometes; null → buit'
        );
        ok(
            G.plainFrac('\\frac{3}{4} + \\frac{1}{2}') === '3/4 + 1/2' && G.plainFrac('') === '',
            'plainFrac: \\frac{a}{b} → a/b'
        );

        G.state.sessionHistory = [];
        G.recordAnswerToHistory('2 + 3', '5', true);
        G.recordAnswerToHistory('2 + 3', '6', false);
        ok(
            G.state.sessionHistory.map(h => `${h.question}=${h.answer}:${h.isCorrect}`).join() ===
                '2 + 3=5:true,2 + 3=6:false',
            'recordAnswerToHistory: guarda pregunta, resposta i si era correcta'
        );

        G.registraProva(() => ({ ocupat: false, resposta: 7 }));
        let est = globalThis.__prova();
        ok(
            est.resposta === 7 &&
                est.ocupat === false &&
                est.preguntes === 3 &&
                est.sessions === 1 &&
                est.intents === 4 &&
                est.fixed === null,
            "registraProva: estat comú (sense sessió fixa: fixed = null) + el de l'activitat"
        );
        G.state.isTransitioning = true;
        ok(globalThis.__prova().ocupat === true, 'registraProva: ocupat si el motor està en transició');
        G.state.isTransitioning = false;
        G.registraProva(() => ({ ocupat: true }));
        est = globalThis.__prova();
        ok(
            est.ocupat === true && est.sessionHistory.length === 2,
            "registraProva: ocupat si l'activitat ho diu; inclou l'historial"
        );
        G.state.sessionHistory = [];
    }

    finish();
})().catch(e => {
    console.error(e);
    process.exit(1);
});
