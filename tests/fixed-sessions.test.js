/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/fixed-sessions.test.js
 * ROL: Proves de js/fixed-sessions.js (sessions fixes ?fixed=A/B/C), carregat de
 *      manera nativa (import() de Node) amb un navegador simulat:
 *        - la mateixa etiqueta de pregunta dona sempre la mateixa seqüència,
 *          encara que abans s'hagin gastat números aleatoris (clics, errors…);
 *        - lletres o activitats diferents donen seqüències diferents;
 *        - wrap('buildLevel') torna a sembrar a cada crida;
 *        - sense ?fixed= (o amb una lletra que no és A, B o C) no es toca res;
 *        - els paràmetres per defecte i el distintiu «Sessió fixa».
 *      Valors fixats («golden»): si canvien, les sessions fixes ja repartides
 *      donarien preguntes diferents; només s'ha de fer a propòsit.
 * ÚS: node tests/fixed-sessions.test.js
 * ============================================================================
 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { ROOT, suite, ok, finish, exigeixNode22 } = require('./harness');

exigeixNode22();

const MODUL = pathToFileURL(path.join(ROOT, 'js/fixed-sessions.js')).href;
const mathRandomReal = Math.random;
let versio = 0;

/**
 * Carrega js/fixed-sessions.js com si fos la pàgina `pathname` oberta amb `search`, executa `prova(FixedSessions, e)`
 * i ho deixa tot com estava (el mòdul substitueix Math.random). `e` és el navegador simulat: la URL, quantes vegades s'ha
 * canviat (replaces), els oients registrats (handlers) i el distintiu que s'ha creat (badge).
 */
async function pagina(search, pathname, prova, readyState = 'complete') {
    const primer = { sentinella: true }; // el que seria document.body.firstChild
    const e = { location: { search, pathname }, replaces: 0, handlers: {}, badge: null, badgeAbans: null, primer };
    e.history = {
        replaceState(_estat, _titol, url) {
            e.replaces++;
            e.location.search = url;
        },
    };
    e.document = {
        readyState,
        createElement: () => ({ style: {} }),
        body: {
            firstChild: primer,
            insertBefore(node, abans) {
                e.badge = node;
                e.badgeAbans = abans;
            },
        },
    };
    const claus = ['window', 'location', 'history', 'document', 'addEventListener'];
    globalThis.window = globalThis;
    globalThis.location = e.location;
    globalThis.history = e.history;
    globalThis.document = e.document;
    globalThis.addEventListener = (esdeveniment, fn) => {
        e.handlers[esdeveniment] = fn;
    };
    try {
        const { FixedSessions } = await import(`${MODUL}?v=${++versio}`);
        return await prova(FixedSessions, e);
    } finally {
        Math.random = mathRandomReal;
        for (const clau of claus) delete globalThis[clau];
    }
}

const trau = (n = 8) => Array.from({ length: n }, () => Math.random());
const json = JSON.stringify;

(async () => {
    suite('Sense ?fixed= (o amb una lletra que no és A, B ni C)');
    {
        for (const q of ['', '?fixed=', '?fixed=Z', '?fixed=AB', '?fixed=1', '?totaloperations=3']) {
            await pagina(q, '/a2/a-enters.html', (F, e) => {
                ok(F === null, `«${q}»: FixedSessions val null`);
                ok(Math.random === mathRandomReal, `«${q}»: Math.random continua sent el del navegador`);
                ok(
                    e.replaces === 0 && e.location.search === q && e.badge === null,
                    `«${q}»: la URL i la pàgina no es toquen`
                );
            });
        }
    }

    suite('Una llavor per pregunta');
    {
        const [a, b, c] = await pagina('?fixed=A', '/a2/a-enters.html', F => {
            F.seed('s0-q3');
            const primera = trau();
            trau(37); // «l'alumne» gasta números aleatoris (errors, ajudes, clics…)
            F.seed('s0-q3');
            const segona = trau();
            F.seed('s0-q4');
            return [primera, segona, trau()];
        });
        ok(json(a) === json(b), 'mateixa etiqueta → mateixa seqüència, passi el que passi abans');
        ok(json(a) !== json(c), 'etiqueta diferent → seqüència diferent');
        ok(
            [...a, ...c].every(x => x >= 0 && x < 1),
            'els valors són a [0, 1)'
        );

        const trauAmb = (search, pathname, etiqueta = 's0-q3') =>
            pagina(search, pathname, F => {
                trau(5);
                F.seed(etiqueta);
                return trau();
            });
        const A = await trauAmb('?fixed=A', '/a2/a-enters.html');
        ok(json(A) === json(a), 'un altre alumne amb la mateixa lletra rep la mateixa pregunta');
        ok(json(await trauAmb('?fixed=a', '/a2/a-enters.html')) === json(a), '?fixed=a (minúscula) és la sessió A');
        ok(
            json(await trauAmb('?fixed=B', '/a2/a-enters.html')) !== json(a),
            "lletra B → preguntes diferents de les d'A"
        );
        ok(
            json(await trauAmb('?fixed=C', '/a2/a-enters.html')) !==
                json(await trauAmb('?fixed=B', '/a2/a-enters.html')),
            'C és diferent de B'
        );
        ok(
            json(await trauAmb('?fixed=A', '/a2/a-decimals.html')) !== json(a),
            'una altra activitat → seqüència diferent'
        );
        ok(
            json(await trauAmb('?fixed=A', '/a2/a-enters.html', 's1-q3')) !== json(a),
            'una altra sessió → seqüència diferent'
        );
        ok(
            json(await trauAmb('?fixed=A', '/a-enters.html')) === json(a),
            'el prefix de la ruta no compta (GitHub Pages /a2/… o un domini propi)'
        );

        const primeres = await pagina('?fixed=A', '/a2/a-enters.html', F =>
            Array.from({ length: 10 }, (_, q) => {
                F.seed(`s0-q${q}`);
                return Math.random();
            })
        );
        ok(new Set(primeres).size === 10, "les 10 preguntes d'una sessió no comparteixen mai la mateixa llavor");
    }

    suite('Valors fixats (golden): les sessions ja repartides no han de canviar');
    {
        const g = await pagina('?fixed=A', '/a2/a-enters.html', F => {
            F.seed('s0-q0');
            const q0 = trau(3);
            F.seed('s0-q1');
            return [q0, trau(3)];
        });
        ok(
            json(g[0]) === json([0.3407663858961314, 0.3370531245600432, 0.4121711803600192]),
            `A · a-enters · s0-q0: ${json(g[0])}`
        );
        ok(
            json(g[1]) === json([0.5936791491694748, 0.9840706498362124, 0.9361621083226055]),
            `A · a-enters · s0-q1: ${json(g[1])}`
        );
    }

    suite("Qualitat de l'atzar (Mulberry32)");
    {
        const m = await pagina('?fixed=B', '/a2/a-enters.html', F => {
            F.seed('prova');
            const v = trau(20000);
            return {
                mitjana: v.reduce((s, x) => s + x, 0) / v.length,
                min: Math.min(...v),
                max: Math.max(...v),
                cubells: v.reduce((c, x) => (c[Math.floor(x * 10)]++, c), Array(10).fill(0)),
            };
        });
        ok(m.mitjana > 0.49 && m.mitjana < 0.51, `mitjana de 20.000 valors ≈ 0,5 (${m.mitjana.toFixed(4)})`);
        ok(m.min >= 0 && m.max < 1, 'tots els valors són a [0, 1)');
        ok(
            m.cubells.every(n => n > 1800 && n < 2200),
            `distribució uniforme en 10 trams: ${m.cubells.join(', ')}`
        );
    }

    suite('next(tipus): comptador per a pàgines sense número de pregunta');
    {
        const r = await pagina('?fixed=C', '/a2/complexos.html', F => {
            F.next('SR');
            const e1 = trau();
            F.next('SR');
            const e2 = trau();
            return [e1, e2];
        });
        ok(json(r[0]) !== json(r[1]), 'dues crides seguides → exercicis diferents');
        const f1 = await pagina('?fixed=C', '/a2/complexos.html', F => {
            F.next('DV');
            trau(20); // un altre tipus no afecta el comptador de 'SR'
            F.next('SR');
            return trau();
        });
        ok(json(f1) === json(r[0]), 'el comptador és independent per a cada tipus');
    }

    suite('wrap(): embolcallar buildLevel');
    {
        await pagina('?fixed=A', '/a2/a-enters.html', F => {
            let pregunta = 0;
            const generats = [];
            globalThis.buildLevel = function () {
                generats.push(Math.random());
            };
            globalThis.suma = (x, y) => x + y;
            ok(F.wrap('buildLevel', () => `q${pregunta}`) === true, 'wrap torna true');
            ok(F.wrap('buildLevel', () => 'x') === false, 'no embolcalla dues vegades');
            ok(F.wrap('noExisteix', () => 'x') === false, 'una funció que no existeix → false');
            globalThis.buildLevel();
            Math.random();
            Math.random();
            globalThis.buildLevel();
            pregunta++;
            globalThis.buildLevel();
            ok(
                generats[0] === generats[1],
                'la mateixa pregunta es regenera igual (encara que hi hagi hagut atzar pel mig)'
            );
            ok(generats[2] !== generats[0], 'la pregunta següent és diferent');
            F.wrap('suma', () => 'x');
            ok(globalThis.suma(2, 3) === 5, 'wrap conserva els arguments i el valor que torna la funció');
            delete globalThis.buildLevel;
            delete globalThis.suma;
        });
    }

    suite('Paràmetres per defecte a la URL');
    {
        const url = async search =>
            pagina(search, '/a2/a-enters.html', (F, e) => ({ url: e.location.search, canvis: e.replaces }));
        let r = await url('?fixed=A');
        ok(r.url === '?fixed=A&totaloperations=5&totalsessions=1' && r.canvis === 1, `?fixed=A → ${r.url}`);
        r = await url('?fixed=A&totaloperations=3');
        ok(
            r.url === '?fixed=A&totaloperations=3&totalsessions=1',
            `les preguntes que ja hi són es respecten → ${r.url}`
        );
        r = await url('?fixed=B&totalsessions=2');
        ok(
            r.url === '?fixed=B&totalsessions=2&totaloperations=5',
            `les sessions que ja hi són es respecten → ${r.url}`
        );
        r = await url('?totalsessions=2&fixed=B&totaloperations=4&maxintents=7');
        ok(
            r.canvis === 0 && r.url === '?totalsessions=2&fixed=B&totaloperations=4&maxintents=7',
            'si ja hi són tots dos, la URL no es toca (cap replaceState)'
        );
        r = await url('?fixed=C&nivell=1&rang=3');
        ok(
            /nivell=1/.test(r.url) && /rang=3/.test(r.url) && /totaloperations=5/.test(r.url),
            `els paràmetres propis de l'activitat es conserven → ${r.url}`
        );
    }

    suite('Distintiu «Sessió fixa»');
    {
        await pagina(
            '?fixed=B',
            '/a2/a-enters.html',
            (F, e) => {
                ok(
                    typeof e.handlers.DOMContentLoaded === 'function' && e.badge === null,
                    'mentre es carrega la pàgina, espera el DOMContentLoaded'
                );
                e.handlers.DOMContentLoaded();
                ok(
                    e.badge && e.badge.textContent === 'Sessió fixa B' && e.badge.id === 'badge-sessio-fixa',
                    `text i id: «${e.badge && e.badge.textContent}» (${e.badge && e.badge.id})`
                );
                ok(e.badgeAbans === e.primer, 'es posa dalt de tot de la pàgina, abans del primer element');
                const css = e.badge.style.cssText;
                ok(/pointer-events:none/.test(css), 'no intercepta els clics');
                ok(
                    !/position:\s*(fixed|absolute)/.test(css),
                    'dins del flux de la pàgina: no flota ni tapa cap botó en un mòbil estret'
                );
            },
            'loading'
        );
        await pagina('?fixed=C', '/a2/a-enters.html', (F, e) => {
            ok(
                e.badge && e.badge.textContent === 'Sessió fixa C' && !e.handlers.DOMContentLoaded,
                "si la pàgina ja és carregada, es crea a l'acte"
            );
        });
    }

    finish();
})().catch(e => {
    console.error(e);
    process.exit(1);
});
