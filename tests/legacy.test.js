/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/legacy.test.js
 * ROL: Proves de les funcions pures del MOTOR ANTIC (scripts clàssics de js/legacy/),
 *      carregades en un context de Node sense navegador. S'esborrarà amb el motor antic (PR 15).
 *      El que necessita el DOM (pantalles, teclat…) es prova al navegador:
 *      tests/navegador.
 * ÚS: node tests/legacy.test.js
 * ============================================================================
 */
'use strict';
const vm = require('vm');
const { suite, ok, finish, read } = require('./harness');

/** Carrega els tres scripts clàssics, en l'ordre de les pàgines, simulant la URL indicada. */
function carrega(cerca = '') {
    const ctx = vm.createContext({
        console,
        URLSearchParams,
        setTimeout,
        window: { location: { search: cerca } },
        document: { getElementById: () => null, querySelectorAll: () => [] },
    });
    ctx.window.window = ctx.window;
    for (const f of ['js/legacy/utils.js', 'js/legacy/config.js', 'js/legacy/game-core.js'])
        vm.runInContext(read(f), ctx, { filename: f });
    return ctx;
}
const val = (ctx, expressio) => vm.runInContext(expressio, ctx);

const ctx = carrega();

suite('utils.js: funcions pures');
{
    const params = q => new URLSearchParams(q);
    ok(
        val(ctx, 'getIntParam(new URLSearchParams(""), "a", 7, 1, 10)') === 7,
        'getIntParam: sense paràmetre → valor per defecte'
    );
    ok(val(ctx, 'getIntParam(new URLSearchParams("a=4"), "a", 7, 1, 10)') === 4, 'getIntParam: valor vàlid');
    ok(
        val(ctx, 'getIntParam(new URLSearchParams("a=0"), "a", 7, 1, 10)') === 7,
        'getIntParam: per sota del mínim → per defecte'
    );
    ok(
        val(ctx, 'getIntParam(new URLSearchParams("a=11"), "a", 7, 1, 10)') === 7,
        'getIntParam: per sobre del màxim → per defecte'
    );
    ok(
        val(ctx, 'getIntParam(new URLSearchParams("a=2.5"), "a", 7, 1, 10)') === 7,
        'getIntParam: decimal → per defecte'
    );
    ok(val(ctx, 'getIntParam(new URLSearchParams("a=x"), "a", 7, 1, 10)') === 7, 'getIntParam: text → per defecte');
    void params;

    const r = val(ctx, '(() => { const v = []; for (let i = 0; i < 5000; i++) v.push(randInt(-3, 4)); return v; })()');
    ok(
        r.every(n => Number.isInteger(n) && n >= -3 && n <= 4),
        'randInt(-3, 4): sempre un enter dins del rang (5.000 mostres)'
    );
    ok(new Set(r).size === 8, 'randInt(-3, 4): surten els 8 valors possibles');
    ok(
        val(
            ctx,
            '(() => { for (let i = 0; i < 3000; i++) if (randIntNonZero(-2, 2) === 0) return false; return true; })()'
        ),
        'randIntNonZero: mai 0'
    );
    ok(
        val(
            ctx,
            '(() => { const a = [1, 2, 3]; for (let i = 0; i < 300; i++) if (!a.includes(pick(a))) return false; return true; })()'
        ),
        'pick: sempre un element de la llista'
    );
    const sh = val(
        ctx,
        '(() => { const a = [1, 2, 3, 4, 5, 6]; const b = shuffle(a.slice()); return [a.join(), b.slice().sort().join()]; })()'
    );
    ok(sh[0] === sh[1], 'shuffle: és una permutació (no perd ni repeteix elements)');
    ok(
        val(
            ctx,
            '[parseStrictInt("12"), parseStrictInt(" -7 "), parseStrictInt("1.5"), parseStrictInt("1e2"), parseStrictInt("0x10"), parseStrictInt("12abc"), parseStrictInt("")].map(String).join()'
        ) === '12,-7,NaN,NaN,NaN,NaN,NaN',
        'parseStrictInt: només enters'
    );
}

suite('config.js: paràmetres de la URL');
{
    const v = c => [val(c, 'TOTAL_SESSIONS'), val(c, 'TOTAL_OPERATIONS'), val(c, 'MAX_INTENTS')].join(',');
    ok(v(ctx) === '1,3,4', `sense paràmetres: ${v(ctx)} (sessions, preguntes, intents)`);
    ok(v(carrega('?totalsessions=2&totaloperations=5&maxintents=8')) === '2,5,8', 'valors del professor');
    ok(v(carrega('?totalsessions=0&totaloperations=31&maxintents=11')) === '1,3,4', 'fora de rang → per defecte');
    ok(
        v(carrega('?totalsessions=20&totaloperations=30&maxintents=10')) === '20,30,10',
        'els màxims permesos (20, 30, 10)'
    );
    ok(
        v(carrega('?totalsessions=abc&totaloperations=2.5&maxintents=')) === '1,3,4',
        'text, decimals o buit → per defecte'
    );
    ok(v(carrega('?maxenllocmitjana=0&totaloperations=2')) === '1,2,4', "el paràmetre antic maxenllocmitjana s'ignora");
}

suite('game-core.js: punts i estrelles');
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
        .filter(([p, m, e]) => val(ctx, `calculaEstrelles(${p}, ${m})`) !== e)
        .map(([p, m, e]) => `${p}/${m} → esperat ${e}`);
    ok(
        dolents.length === 0,
        'calculaEstrelles: 0 punts = 0 estrelles; qualsevol punt = ≥ 1; el màxim = 5',
        dolents.join('; ')
    );

    const pp = (e, f) => val(ctx, `puntsPregunta(${e}, ${f})`);
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
        val(ctx, '[0, 1, 2, 10].map(n => textPunts(n)).join("|")') === '0 punts|1 punt|2 punts|10 punts',
        'textPunts: singular només per a 1'
    );
    ok(val(ctx, 'textPunts(1, true) + "|" + textPunts(8, true)') === '+1 punt|+8 punts', 'textPunts amb «+»');

    const h = val(ctx, 'htmlEstrelles(3)');
    ok(
        (h.match(/star on/g) || []).length === 3 && (h.match(/star off/g) || []).length === 2,
        'htmlEstrelles(3): 3 estrelles guanyades i 2 atenuades'
    );
    ok(/aria-label="3 de 5 estrelles"/.test(h), 'htmlEstrelles: etiqueta per a lectors de pantalla');
    ok(
        val(ctx, 'MAX_PUNTS_PREGUNTA') === 10 && val(ctx, 'MAX_ESTRELLES') === 5,
        'màxim de 10 punts per pregunta i 5 estrelles'
    );
}

finish();
