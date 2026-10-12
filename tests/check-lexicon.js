/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/check-lexicon.js
 * ROL: El CONTROL DEL VOCABULARI. L'alumnat és d'aula d'acollida: només pot
 *      llegir paraules que el professorat ha vist i validat. Aquesta prova
 *      comprova que a les activitats (js/<activitat>/):
 *        1. cada paraula dels textos (js/textos.js i js/<activitat>/textos.js), de
 *           les frases que genera l'activitat i del text fix de la seva pàgina
 *           HTML és al lèxic (js/lexicon/dades.js) o és una paraula gramatical;
 *        2. cada text que el codi fa servir (TEXTOS.clau) existeix, i cap text no
 *           queda sense fer servir (un text que falta es veuria com «undefined»);
 *        3. els textos es poden posar tal qual a l'HTML (cap «<», «>», «&» ni cometa doble).
 *      Per veure les paraules noves d'una PR: node tools/paraules-noves.js
 * ÚS: node tests/check-lexicon.js
 * ============================================================================
 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { ROOT, suite, ok, finish, read, exists, listFiles, exigeixNode22, sensePComentaris } = require('./harness');

exigeixNode22();

const carrega = fitxer => import(pathToFileURL(path.join(ROOT, fitxer)).href);

/** Les paraules d'un text, en minúscula: només lletres (i la «·» entre dues, com a «col·legi»); els números, els símbols i els emojis no en són. */
const paraules = text => text.toLocaleLowerCase('ca').match(/\p{L}+(?:·\p{L}+)*/gu) || [];

/** Els textos d'un objecte de textos, amb la seva clau. Les parts {entre claus} són valors que canvien: no són paraules. */
const textosDe = objecte =>
    Object.entries(objecte).map(([clau, text]) => ({ clau, text, net: text.replace(/\{\w+\}/g, ' ') }));

const ENTITATS = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#039;': "'", '&apos;': "'" };

/** El text que es veu en una pàgina HTML: el contingut, el títol i els atributs aria-label, title, alt i placeholder. */
function textDeLaPagina(html) {
    const h = html
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<script\b[\s\S]*?<\/script>/gi, '')
        .replace(/<style\b[\s\S]*?<\/style>/gi, '')
        // El peu legal (<footer data-legal>: l'autoria i la llicència) és per als adults, no per a l'alumne: queda fora del control
        .replace(/<footer\b[^>]*\bdata-legal\b[^>]*>[\s\S]*?<\/footer>/gi, '');
    const trossos = [...h.matchAll(/\b(?:aria-label|title|alt|placeholder)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)].map(
        m => m[1] ?? m[2]
    );
    trossos.push(h.replace(/<[^>]*>/g, ' '));
    return trossos.join(' ').replace(/&#?\w+;/g, e => ENTITATS[e] ?? ' ');
}

(async () => {
    const { LEXIC, FUNCIONALS } = await carrega('js/lexicon/dades.js');
    const { formesDe } = await carrega('js/lexicon/lexicon.js');
    const coneguts = new Set([...LEXIC.flatMap(e => formesDe(e).flatMap(paraules)), ...FUNCIONALS]);
    const desconegudes = text => [...new Set(paraules(text).filter(p => !coneguts.has(p)))];

    // Les activitats del motor nou: les pàgines a-*.html que carreguen js/<activitat>/<activitat>.js com a mòdul
    const activitats = listFiles('.', ['.html'])
        .filter(f => /^a-[^/]*\.html$/.test(f) && !f.endsWith('-tutorial.html'))
        .filter(f =>
            new RegExp(`<script\\s+type=["']module["']\\s+src=["']js/${f.replace('.html', '')}/`).test(read(f))
        )
        .map(f => f.replace('.html', ''));
    // Les pàgines que no són activitats però porten text per a l'alumne (el lèxic també les cobreix): { carpeta de js/: pàgina }
    const PAGINES_ALUMNE = { album: 'album.html', portada: 'index.html' };
    const paginaDe = nom => PAGINES_ALUMNE[nom] || `${nom}.html`;
    for (const [nom, pagina] of Object.entries(PAGINES_ALUMNE))
        if (exists(pagina) && exists(`js/${nom}/textos.js`)) activitats.push(nom);

    // Totes les fonts de text: { origen, text, net }
    const fonts = [];
    const { TEXTOS_COMUNS } = await carrega('js/textos.js');
    fonts.push(...textosDe(TEXTOS_COMUNS).map(t => ({ ...t, origen: `js/textos.js → ${t.clau}` })));
    const textosActivitat = {};
    const sensePortar = [];
    for (const nom of activitats) {
        if (!exists(`js/${nom}/textos.js`)) {
            sensePortar.push(nom);
            continue;
        }
        const { TEXTOS } = await carrega(`js/${nom}/textos.js`);
        textosActivitat[nom] = TEXTOS;
        fonts.push(...textosDe(TEXTOS).map(t => ({ ...t, origen: `js/${nom}/textos.js → ${t.clau}` })));
        if (exists(`js/${nom}/generador.js`)) {
            const G = await carrega(`js/${nom}/generador.js`);
            if (typeof G.exemplesDeText === 'function')
                for (const text of G.exemplesDeText())
                    fonts.push({ origen: `frase generada per js/${nom}/generador.js`, text, net: text });
        }
        const pagina = textDeLaPagina(read(paginaDe(nom)));
        fonts.push({ origen: `${paginaDe(nom)} (el text fix de la pàgina)`, text: pagina, net: pagina });
    }

    suite('Vocabulari: cada activitat del motor nou té els seus textos');
    {
        ok(activitats.length > 0, `activitats del motor nou: ${activitats.join(', ') || 'cap'}`);
        ok(sensePortar.length === 0, 'cada una té js/<activitat>/textos.js', sensePortar.join(', '));
    }

    suite('Vocabulari: totes les paraules són al lèxic');
    {
        const p = [];
        for (const f of fonts) {
            const falten = desconegudes(f.net);
            if (falten.length)
                p.push(
                    `${f.origen}: ${falten.map(x => `«${x}»`).join(', ')}${f.text.length < 80 ? `   (text: «${f.text}»)` : ''}`
                );
        }
        ok(
            p.length === 0,
            `${fonts.length} textos (${coneguts.size} formes al lèxic i a les paraules gramaticals)`,
            `Cal afegir-les a js/lexicon/dades.js (vegeu docs/LEXIC.md) o canviar el text:\n${p.join('\n')}`
        );
        // Control de la mateixa prova: una paraula fora del lèxic sí que es detecta
        ok(
            desconegudes('Mira aquest dinosaure, si us plau').join() === 'mira,aquest,dinosaure,us,plau',
            'la prova detecta les paraules que no hi són'
        );
        ok(
            desconegudes('Sessió {n} de {total}'.replace(/\{\w+\}/g, ' ')).length === 0,
            'els {valors} entre claus no compten com a paraules'
        );
    }

    suite("Vocabulari: els textos es poden posar tal qual a l'HTML");
    {
        const p = fonts
            .filter(f => /[<>&"]/.test(f.text) && !f.origen.endsWith('(el text fix de la pàgina)'))
            .map(f => f.origen);
        ok(p.length === 0, 'cap text amb «<», «>», «&» ni cometes dobles', p.join('\n'));
    }

    suite('Vocabulari: cada text es fa servir i cada text que es fa servir existeix');
    {
        const comuns = new Set(Object.keys(TEXTOS_COMUNS));
        const usatsComuns = new Set();
        const usatsActivitat = Object.fromEntries(activitats.map(nom => [nom, new Set()]));
        const inexistents = [];
        for (const f of listFiles('js', ['.js']).filter(f => f !== 'js/textos.js' && !/\/textos\.js$/.test(f))) {
            const codi = sensePComentaris(read(f));
            const nom = (f.match(/^js\/([^/]+)\//) || [])[1];
            for (const m of codi.matchAll(/\bTEXTOS_COMUNS\.(\w+)/g)) {
                usatsComuns.add(m[1]);
                if (!comuns.has(m[1])) inexistents.push(`${f}: TEXTOS_COMUNS.${m[1]} no existeix`);
            }
            for (const m of codi.matchAll(/(?<![\w.])TEXTOS\.(\w+)/g)) {
                if (!textosActivitat[nom])
                    inexistents.push(`${f}: fa servir TEXTOS, però js/${nom}/textos.js no existeix`);
                else if (!(m[1] in textosActivitat[nom]))
                    inexistents.push(`${f}: TEXTOS.${m[1]} no existeix a js/${nom}/textos.js`);
                else usatsActivitat[nom].add(m[1]);
            }
        }
        ok(inexistents.length === 0, 'cap TEXTOS.clau que no existeixi', inexistents.join('\n'));
        const mortsComuns = [...comuns].filter(c => !usatsComuns.has(c));
        ok(mortsComuns.length === 0, 'js/textos.js: cap text sense fer servir', mortsComuns.join(', '));
        for (const nom of activitats) {
            if (!textosActivitat[nom]) continue;
            const morts = Object.keys(textosActivitat[nom]).filter(c => !usatsActivitat[nom].has(c));
            ok(morts.length === 0, `js/${nom}/textos.js: cap text sense fer servir`, morts.join(', '));
        }
    }

    suite('Vocabulari: les paraules del lèxic es fan servir (informatiu)');
    {
        const totsElsTextos = fonts.map(f => f.net).join(' ');
        const usades = new Set(paraules(totsElsTextos));
        const sensePortar2 = LEXIC.filter(
            e =>
                !formesDe(e)
                    .flatMap(paraules)
                    .some(p => usades.has(p))
        ).map(e => e.id);
        if (sensePortar2.length)
            console.log(`  (avís) paraules del lèxic que cap text fa servir encara: ${sensePortar2.join(', ')}`);
        ok(true, `${LEXIC.length - sensePortar2.length} de ${LEXIC.length} paraules del lèxic surten als textos`);
    }

    finish();
})().catch(e => {
    console.error(e);
    process.exit(1);
});
