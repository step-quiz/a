/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/lexicon.test.js
 * ROL: Proves del LÈXIC (js/lexicon/): que les dades són coherents (cap id
 *      repetit, articles que encaixen amb el gènere i amb la primera lletra,
 *      formes en minúscula…) i que l'API posa les paraules en català correcte
 *      (articles, contraccions «al», «del», «pel», apòstrofs, plurals).
 *      Les dades es comproven també amb una versió equivocada de cada cosa (a
 *      mà), perquè se sàpiga que la prova detecta els errors.
 * ÚS: node tests/lexicon.test.js
 * ============================================================================
 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { ROOT, suite, ok, finish, exigeixNode22 } = require('./harness');

exigeixNode22();

const carrega = fitxer => import(pathToFileURL(path.join(ROOT, fitxer)).href);

/** Si un text SVG és XML ben format (cada etiqueta que s'obre es tanca). */
function esBenFormat(svg) {
    const pila = [];
    for (const m of svg.matchAll(/<(\/?)([a-z][\w-]*)([^>]*?)(\/?)>/gi)) {
        const [, tanca, nom, , autotanca] = m;
        if (autotanca) continue;
        if (tanca) {
            if (pila.pop() !== nom) return false;
        } else pila.push(nom);
    }
    return pila.length === 0;
}

/** Els problemes d'un conjunt de pictogrames SVG (buida si tots són correctes). */
function problemesPictogrames(PICTOGRAMES) {
    const p = [];
    for (const [nom, svg] of Object.entries(PICTOGRAMES)) {
        const qui = `pictograma «${nom}»`;
        if (!/^<svg\b/.test(svg) || !/<\/svg>$/.test(svg)) p.push(`${qui}: ha de ser un <svg>…</svg>`);
        if (!/\bviewBox="[\d. ]+"/.test(svg)) p.push(`${qui}: falta el viewBox`);
        if (!/aria-hidden="true"/.test(svg) || !/focusable="false"/.test(svg))
            p.push(`${qui}: ha de ser decoratiu (aria-hidden i focusable="false")`);
        if (/<script|\son\w+\s*=|https?:|href=|url\(/i.test(svg))
            p.push(`${qui}: res de scripts, esdeveniments ni referències externes`);
        if (/<style|\sstyle\s*=|#[0-9a-f]{3,8}\b|\b(?:rgb|hsl)a?\(/i.test(svg))
            p.push(`${qui}: res de colors ni d'estils fixos: els colors són al CSS (classes pict-*)`);
        if (svg.length > 2000) p.push(`${qui}: massa gran (${svg.length} bytes; màxim 2000)`);
        if (!esBenFormat(svg)) p.push(`${qui}: l'XML no està ben format`);
    }
    return p;
}

/** Els problemes d'un conjunt d'imatges de matemàtiques (mini-exemples en HTML i dibuixos SVG): buit si tots són correctes. */
function problemesMates(MATES) {
    const p = [];
    const vistes = new Map();
    for (const [nom, html] of Object.entries(MATES)) {
        const qui = `imatge «${nom}»`;
        if (!/^<span class="mat(?: mat-p)?">[\s\S]*<\/span>$/.test(html))
            p.push(`${qui}: ha de ser un <span class="mat">…</span> (els dibuixos SVG, a dins)`);
        if (/<script|<img|<a\b|<iframe|<style|\son\w+\s*=|\sstyle\s*=|https?:|href=|url\(|javascript:/i.test(html))
            p.push(`${qui}: res de scripts, enllaços, estils fixos ni referències externes`);
        if (
            /<svg/.test(html) &&
            (!/\bviewBox="[\d. ]+"/.test(html) || !/aria-hidden="true"/.test(html) || !/focusable="false"/.test(html))
        )
            p.push(`${qui}: un dibuix SVG ha de portar viewBox, aria-hidden="true" i focusable="false"`);
        if (/#[0-9a-f]{3,8}\b|\b(?:rgb|hsl)a?\(/i.test(html.replace(/&#\d+;/g, '')))
            p.push(`${qui}: res de colors fixos: són al CSS`);
        if (!html.replace(/<[^>]*>/g, '').trim() && !/<(?:svg|circle|line|polygon|path|rect|ellipse)/.test(html))
            p.push(`${qui}: és buida`);
        if (html.length > 1500) p.push(`${qui}: massa gran (${html.length} bytes; màxim 1500)`);
        if (!esBenFormat(html)) p.push(`${qui}: l'HTML no està ben format`);
        if (vistes.has(html))
            p.push(`${qui}: és igual que «${vistes.get(html)}» (cada paraula necessita la seva imatge)`);
        vistes.set(html, nom);
    }
    return p;
}

/** Els problemes de coherència que té una llista d'entrades (buida si tot és correcte). */
function problemes(L, { LEXIC, FUNCIONALS, TEMES }, PICTOGRAMES = {}, MATES = {}) {
    const p = [];
    const ids = new Set();
    const vocal = /^[aeiouàèéíòóúïüh]/i;
    for (const e of LEXIC) {
        const qui = `«${e.id}»`;
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.id))
            p.push(`${qui}: l'id ha de ser en minúscules, sense accents ni espais`);
        if (ids.has(e.id)) p.push(`${qui}: id repetit`);
        ids.add(e.id);
        if (!['nom', 'verb', 'adjectiu', 'altre'].includes(e.tipus)) p.push(`${qui}: tipus desconegut «${e.tipus}»`);
        if (!TEMES[e.tema]) p.push(`${qui}: tema desconegut «${e.tema}»`);
        const formes = L.formesDe(e);
        if (!Array.isArray(formes) || !formes.length || formes.some(f => typeof f !== 'string' || !f.trim()))
            p.push(`${qui}: sense formes`);
        else if (
            formes.some(f => f !== f.trim() || f !== (e.sigla ? f.toLocaleUpperCase('ca') : f.toLocaleLowerCase('ca')))
        )
            p.push(
                `${qui}: les formes van en minúscula (en majúscula, si són una sigla) i sense espais als costats (${formes.join(', ')})`
            );
        if (e.sigla !== undefined && (e.sigla !== true || e.tipus === 'nom'))
            p.push(`${qui}: «sigla» és només per a les paraules que no són noms i només amb true`);
        if (e.tipus === 'nom') {
            if (!['m', 'f'].includes(e.genere)) p.push(`${qui}: el gènere ha de ser «m» o «f»`);
            if (!['el', 'la', "l'"].includes(e.article))
                p.push(`${qui}: article «${e.article}» no vàlid (el, la o l')`);
            if (e.article === 'el' && e.genere !== 'm') p.push(`${qui}: «el» però és femení`);
            if (e.article === 'la' && e.genere !== 'f') p.push(`${qui}: «la» però és masculí`);
            const elidit = vocal.test(e.singular);
            if (elidit && e.article !== "l'" && e.elisio !== false)
                p.push(`${qui}: comença per vocal o h: l'article és «l'»`);
            if (!elidit && e.article === "l'") p.push(`${qui}: «l'» davant de consonant`);
        } else if (e.singular || e.plural || e.article) {
            p.push(`${qui}: només els noms porten singular, plural i article`);
        }
        if (e.concret !== undefined && e.tipus !== 'nom') p.push(`${qui}: «concret» només és per als noms`);
        if (e.concret && !e.imatge) p.push(`${qui}: és concreta (concret: true) però no té imatge`);
        if (e.banc !== undefined && (e.banc !== true || !e.imatge || e.tipus === 'nom'))
            p.push(
                `${qui}: «banc» és només per a les paraules que no són noms i porten imatge (els noms concrets hi entren sols)`
            );
        if (e.imatge) {
            const { emoji, pictograma, mates } = e.imatge;
            if ([emoji, pictograma, mates].filter(x => x !== undefined).length !== 1) {
                p.push(
                    `${qui}: la imatge ha de ser o un emoji o un pictograma o un mini-exemple matemàtic, no més d'una ni cap`
                );
            } else if (mates !== undefined) {
                if (!(mates in MATES)) p.push(`${qui}: la imatge «mates» «${mates}» no existeix a js/lexicon/mates.js`);
            } else if (emoji !== undefined && (typeof emoji !== 'string' || !emoji.trim())) {
                p.push(`${qui}: emoji buit`);
            } else if (pictograma !== undefined && !(pictograma in PICTOGRAMES)) {
                p.push(`${qui}: el pictograma «${pictograma}» no existeix a js/lexicon/pictogrames.js`);
            }
        }
    }
    const usats = new Set(LEXIC.map(e => e.imatge && e.imatge.pictograma).filter(Boolean));
    for (const nom of Object.keys(PICTOGRAMES))
        if (!usats.has(nom)) p.push(`pictograma «${nom}»: cap paraula no el fa servir`);
    const usatsMates = new Set(LEXIC.map(e => e.imatge && e.imatge.mates).filter(Boolean));
    for (const nom of Object.keys(MATES))
        if (!usatsMates.has(nom)) p.push(`imatge «mates» «${nom}»: cap paraula no la fa servir`);
    if (new Set(FUNCIONALS).size !== FUNCIONALS.length) p.push('FUNCIONALS té paraules repetides');
    if (FUNCIONALS.some(f => f !== f.toLocaleLowerCase('ca'))) p.push('FUNCIONALS: tot en minúscula');
    return p;
}

(async () => {
    const L = await carrega('js/lexicon/lexicon.js');
    const dades = await carrega('js/lexicon/dades.js');
    const { PICTOGRAMES } = await carrega('js/lexicon/pictogrames.js');
    const { MATES } = await carrega('js/lexicon/mates.js');
    const { paraula, textParaula } = await carrega('js/lexicon/paraula.js');
    const { contingutTargeta, crearVistes, CLAU_VISTES } = await carrega('js/lexicon/targeta.js');

    suite('Lèxic: les dades són coherents');
    {
        const p = problemes(L, dades, PICTOGRAMES, MATES);
        ok(
            p.length === 0,
            `${dades.LEXIC.length} entrades i ${dades.FUNCIONALS.length} paraules gramaticals`,
            p.join('\n')
        );
        const q = problemesPictogrames(PICTOGRAMES);
        ok(
            q.length === 0,
            `${Object.keys(PICTOGRAMES).length} pictogrames SVG ben formats, decoratius i sense res extern`,
            q.join('\n')
        );
        const m = problemesMates(MATES);
        ok(
            m.length === 0,
            `${Object.keys(MATES).length} imatges de matemàtiques (mini-exemples i dibuixos) ben formades, úniques i sense res extern`,
            m.join('\n')
        );
        const temesUsats = new Set(dades.LEXIC.map(e => e.tema));
        const sensePortar = Object.keys(dades.TEMES).filter(t => !temesUsats.has(t));
        ok(sensePortar.length === 0, 'cap tema sense paraules', sensePortar.join(', '));
        ok(
            dades.LEXIC.some(e => e.concret),
            'hi ha paraules concretes, i totes porten imatge (si no, el problema ho diria)'
        );
    }

    suite('Lèxic: la prova de coherència detecta els errors (versions equivocades)');
    {
        const base = {
            id: 'prova',
            tipus: 'nom',
            singular: 'prova',
            plural: 'proves',
            genere: 'f',
            article: 'la',
            tema: 'joc',
        };
        const amb = (...entrades) => problemes(L, { LEXIC: entrades, FUNCIONALS: [], TEMES: dades.TEMES });
        const ambImatge = (e, pict = { pis: '<svg/>' }) =>
            problemes(L, { LEXIC: [e], FUNCIONALS: [], TEMES: dades.TEMES }, pict);
        ok(amb(base).length === 0, 'una entrada correcta no dona cap problema');
        ok(
            amb({ ...base, concret: true }).some(x => /no té imatge/.test(x)),
            'una paraula concreta sense imatge'
        );
        ok(
            ambImatge({ ...base, concret: true, imatge: { pictograma: 'pis' } }, { pis: '<svg/>' }).length === 0,
            'una concreta amb pictograma és correcta'
        );
        ok(
            ambImatge({ ...base, imatge: { emoji: '🍎' } }).some(x => /cap paraula no el fa servir/.test(x)),
            'un pictograma que cap paraula fa servir'
        );
        ok(
            ambImatge({ ...base, imatge: { pictograma: 'poma' } }).some(x => /no existeix/.test(x)),
            'un pictograma que no existeix'
        );
        ok(
            ambImatge({ ...base, imatge: { emoji: '🍎', pictograma: 'pis' } }).some(x => /no més d'una/.test(x)),
            'una imatge que és emoji i pictograma alhora'
        );
        ok(
            ambImatge({ ...base, imatge: {} }).some(x => /no més d'una ni cap/.test(x)),
            'una imatge buida'
        );
        ok(
            ambImatge({ ...base, imatge: { emoji: ' ' } }).some(x => /emoji buit/.test(x)),
            'un emoji buit'
        );
        const MATES_PROVA = { x: '<span class="mat"><span class="mat-linia">x + 3</span></span>' };
        const ambMates = (...entrades) =>
            problemes(L, { LEXIC: entrades, FUNCIONALS: [], TEMES: dades.TEMES }, {}, MATES_PROVA);
        ok(
            ambMates({ ...base, concret: true, imatge: { mates: 'x' } }).length === 0 &&
                ambMates({
                    id: 'prova',
                    tipus: 'altre',
                    formes: ['x'],
                    tema: 'joc',
                    banc: true,
                    imatge: { mates: 'x' },
                }).length === 0,
            'una imatge de matemàtiques és correcta (i «banc» ho és en una paraula que no és un nom)'
        );
        ok(
            ambMates({ ...base, imatge: { mates: 'y' } }).some(x => /no existeix a js\/lexicon\/mates/.test(x)) &&
                ambMates({ ...base, imatge: { emoji: '🍎', mates: 'x' } }).some(x => /no més d'una/.test(x)) &&
                problemes(L, { LEXIC: [], FUNCIONALS: [], TEMES: dades.TEMES }, {}, MATES_PROVA).some(x =>
                    /cap paraula no la fa servir/.test(x)
                ),
            'una imatge de matemàtiques que no existeix, barrejada amb un emoji o que cap paraula no fa servir'
        );
        const bo = '<span class="mat"><span class="mat-linia">1</span></span>';
        ok(
            problemesMates({ a: bo }).length === 0 &&
                problemesMates({ a: '2 + 2' }).some(x => /ha de ser un/.test(x)) &&
                problemesMates({ a: bo.replace('1', '<img src="x">') }).some(x => /scripts, enllaços/.test(x)) &&
                problemesMates({ a: bo.replace('<span class="mat-linia">', '<span onclick="x()">') }).some(x =>
                    /scripts, enllaços/.test(x)
                ) &&
                problemesMates({ a: bo.replace('1', '<b>1') }).some(x => /no està ben format/.test(x)) &&
                problemesMates({ a: bo, b: bo }).some(x => /és igual que/.test(x)) &&
                problemesMates({ a: '<svg class="mat-svg" viewBox="0 0 6 6"><line/></svg>' }).some(x =>
                    /viewBox, aria-hidden/.test(x)
                ) &&
                problemesMates({ a: bo.replace('1', '<i style="color:red">1</i>') }).some(x => /estils fixos/.test(x)),
            'les imatges de matemàtiques mal fetes es detecten: sense .mat, amb img o esdeveniments, mal formades, repetides, SVG sense viewBox, estils fixos'
        );
        ok(
            amb({ ...base, banc: true }).some(x => /«banc» és només/.test(x)) &&
                amb({ ...base, banc: true, imatge: { emoji: '🍎' } }).some(x => /«banc» és només/.test(x)) &&
                amb({ id: 'prova', tipus: 'altre', formes: ['x'], tema: 'joc', banc: 1, imatge: { emoji: '🍎' } }).some(
                    x => /«banc» és només/.test(x)
                ),
            '«banc» només amb imatge, només a les paraules que no són noms i només amb true'
        );
        const sigla = { id: 'prova', tipus: 'altre', formes: ['MCD'], tema: 'joc', sigla: true };
        ok(
            amb(sigla).length === 0 &&
                amb({ ...sigla, formes: ['mcd'] }).some(x => /minúscula/.test(x)) &&
                amb({ ...sigla, sigla: 1 }).some(x => /«sigla» és només/.test(x)) &&
                amb({ ...base, sigla: true }).some(x => /«sigla» és només/.test(x)) &&
                amb({ ...sigla, sigla: undefined }).some(x => /minúscula/.test(x)),
            'una sigla va en majúscula i les altres paraules, en minúscula; «sigla» només amb true i en paraules que no són noms'
        );
        const svgBo =
            '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><rect x="1" y="1" width="2" height="2"/></svg>';
        ok(problemesPictogrames({ a: svgBo }).length === 0, 'un pictograma correcte no dona cap problema');
        ok(
            problemesPictogrames({ a: svgBo.replace('<rect', '<script>x</script><rect') }).some(x => /scripts/.test(x)),
            'un pictograma amb un script'
        );
        ok(
            problemesPictogrames({ a: svgBo.replace('<rect', '<image href="http://x/y.png"/><rect') }).some(x =>
                /externes/.test(x)
            ),
            'un pictograma amb una referència externa'
        );
        ok(
            problemesPictogrames({ a: svgBo.replace('<rect', '<rect style="fill:red"') }).some(x => /colors/.test(x)) &&
                problemesPictogrames({ a: svgBo.replace('<rect', '<rect fill="#f59e0b"') }).some(x =>
                    /colors/.test(x)
                ) &&
                problemesPictogrames({ a: svgBo.replace('<rect', '<rect stroke="rgb(0,0,0)"') }).some(x =>
                    /colors/.test(x)
                ) &&
                problemesPictogrames({ a: svgBo.replace('<rect', '<style>.a{}</style><rect') }).some(x =>
                    /colors/.test(x)
                ),
            'un pictograma amb colors o estils fixos (style, #hex, rgb(), <style>)'
        );
        ok(
            problemesPictogrames({ a: svgBo.replace('<rect', '<rect class="pict-destac" fill="none"') }).length === 0,
            'les classes pict-* i fill="none" no són colors fixos'
        );
        ok(
            problemesPictogrames({ a: svgBo.replace(' aria-hidden="true"', '') }).some(x => /decoratiu/.test(x)),
            'un pictograma que no és decoratiu (sense aria-hidden)'
        );
        ok(
            problemesPictogrames({ a: svgBo.replace(' viewBox="0 0 32 32"', '') }).some(x => /viewBox/.test(x)),
            'un pictograma sense viewBox'
        );
        ok(
            problemesPictogrames({ a: svgBo.replace('</svg>', '<g></svg>') }).some(x => /ben format/.test(x)),
            'un pictograma amb una etiqueta sense tancar'
        );
        ok(
            problemesPictogrames({ a: svgBo.replace('<rect', `<desc>${'x'.repeat(2100)}</desc><rect`) }).some(x =>
                /massa gran/.test(x)
            ),
            'un pictograma massa gran'
        );
        ok(
            problemesPictogrames({ a: 'no és un svg' }).some(x => /<svg>/.test(x)),
            'un text que no és un SVG'
        );
        ok(
            amb(base, { ...base }).some(x => /id repetit/.test(x)),
            'id repetit'
        );
        ok(
            amb({ ...base, id: 'Prova' }).some(x => /minúscules/.test(x)),
            'id amb majúscules'
        );
        ok(
            amb({ ...base, id: 'planta baixa' }).some(x => /minúscules/.test(x)),
            'id amb un espai'
        );
        ok(
            amb({ ...base, tipus: 'nombre' }).some(x => /tipus desconegut/.test(x)),
            'tipus desconegut'
        );
        ok(
            amb({ ...base, tema: 'cuina' }).some(x => /tema desconegut/.test(x)),
            'tema desconegut'
        );
        ok(
            amb({ ...base, article: 'el' }).some(x => /femení/.test(x)),
            '«el» amb un nom femení'
        );
        ok(
            amb({ ...base, genere: 'm', article: 'la' }).some(x => /masculí/.test(x)),
            '«la» amb un nom masculí'
        );
        ok(
            amb({ ...base, singular: 'hora', plural: 'hores', article: 'la' }).some(x => /l'article és/.test(x)),
            'sense apostrofar davant de vocal o h'
        );
        ok(
            amb({ ...base, singular: 'hora', plural: 'hores', article: 'la', elisio: false }).length === 0,
            "l'excepció d'apostrofació s'accepta si es declara (elisio: false)"
        );
        ok(
            amb({ ...base, article: "l'" }).some(x => /davant de consonant/.test(x)),
            "«l'» davant de consonant"
        );
        ok(
            amb({ ...base, plural: 'Proves' }).some(x => /minúscula/.test(x)),
            'forma amb majúscules'
        );
        ok(
            amb({ id: 'x', tipus: 'verb', formes: [], tema: 'joc' }).some(x => /sense formes/.test(x)),
            'verb sense formes'
        );
        ok(
            amb({ id: 'x', tipus: 'verb', formes: ['fer'], singular: 'fer', tema: 'joc' }).some(x =>
                /només els noms/.test(x)
            ),
            'un verb amb camps de nom'
        );
        ok(
            amb({ id: 'x', tipus: 'verb', formes: ['fer'], concret: true, tema: 'joc' }).some(x => /concret/.test(x)),
            '«concret» en un verb'
        );
    }

    suite('Lèxic: articles, plurals i quantitats');
    {
        ok(L.forma('pis') === 'pis' && L.forma('pis', { plural: true }) === 'pisos', 'forma: singular i plural');
        ok(
            L.article('pis') === 'el' && L.article('pis', { plural: true }) === 'els',
            "article d'un nom masculí: el, els"
        );
        ok(
            L.article('planta-baixa') === 'la' && L.article('planta-baixa', { plural: true }) === 'les',
            "article d'un nom femení: la, les"
        );
        ok(
            L.article('inici') === "l'" && L.article('inici', { plural: true }) === 'els',
            "davant de vocal masculí: l', els"
        );
        ok(
            L.article('estrella') === "l'" && L.article('estrella', { plural: true }) === 'les',
            "davant de vocal femení: l', les"
        );
        const amb = [
            L.ambArticle('pis'),
            L.ambArticle('pis', { plural: true }),
            L.ambArticle('inici'),
            L.ambArticle('estrella', { plural: true }),
            L.ambArticle('planta-baixa'),
        ];
        ok(
            amb.join(' | ') === "el pis | els pisos | l'inici | les estrelles | la planta baixa",
            `ambArticle: ${amb.join(' | ')}`
        );
        ok(
            [L.quantitat(1, 'pis'), L.quantitat(2, 'pis'), L.quantitat(0, 'pis'), L.quantitat(11, 'soterrani')].join(
                ' | '
            ) === '1 pis | 2 pisos | 0 pisos | 11 soterranis',
            'quantitat: 1 en singular; 0 i la resta en plural'
        );
        ok(L.quantitat(1, 'punt') === '1 punt' && L.quantitat(5, 'punt') === '5 punts', 'quantitat de punts');
    }

    suite('Lèxic: preposicions i contraccions');
    {
        const c = (prep, id, plural = false) => L.preposicio(prep, id, { plural });
        const r = [
            c('a', 'pis'),
            c('a', 'pis', true),
            c('a', 'planta-baixa'),
            c('a', 'planta-baixa', true),
            c('a', 'inici'),
            c('de', 'pis'),
            c('de', 'pis', true),
            c('de', 'planta-baixa'),
            c('de', 'inici'),
            c('de', 'estrella', true),
            c('per', 'pis'),
            c('per', 'pis', true),
            c('per', 'planta-baixa'),
            c('per', 'inici'),
        ];
        ok(
            r.join(' | ') ===
                "al pis | als pisos | a la planta baixa | a les plantes baixes | a l'inici | del pis | dels pisos | de la planta baixa | de l'inici | de les estrelles | pel pis | pels pisos | per la planta baixa | per l'inici",
            `preposicions: ${r.join(' | ')}`
        );
        let error = '';
        try {
            L.preposicio('sobre', 'pis');
        } catch (e) {
            error = e.message;
        }
        ok(
            /Preposició desconeguda/.test(error),
            'una preposició que no es contracta tal com cal falla amb un missatge clar'
        );
    }

    suite('paraula(): la paraula amb la seva imatge');
    {
        const sense = html => html.replace(/<[^>]*>/g, '');
        ok(
            textParaula('pis') === 'el pis' &&
                textParaula('pis', { article: false }) === 'pis' &&
                textParaula('pis', { prep: 'a' }) === 'al pis',
            'textParaula: «el pis», «pis», «al pis»'
        );
        ok(
            textParaula('pis', { plural: true, article: false }) === 'pisos' &&
                textParaula('planta-baixa', { prep: 'a' }) === 'a la planta baixa',
            'textParaula: plural i preposició'
        );
        ok(
            textParaula('pujar') === 'pujar' && textParaula('pujar', { forma: 'pujo' }) === 'pujo',
            'un verb: la primera forma, o la triada'
        );
        const falla = f => {
            try {
                f();
                return '';
            } catch (e) {
                return e.message;
            }
        };
        ok(
            /no és cap forma de «pujar»/.test(falla(() => textParaula('pujar', { forma: 'pujem' }))),
            'una forma que el lèxic no té falla'
        );
        ok(
            /no té plural ni preposició/.test(falla(() => textParaula('pujar', { plural: true }))),
            "el plural d'un verb falla"
        );

        const h = paraula('pis', { prep: 'a' });
        ok(
            /^<span class="paraula" data-paraula="pis" role="button" tabindex="0">/.test(h) &&
                /<span class="paraula-text">al pis<\/span><\/span>$/.test(h),
            `l'estructura: ${h.slice(0, 60)}…`
        );
        ok(
            /<span class="paraula-img" aria-hidden="true"><svg class="pict" viewBox="0 0 32 32"/.test(h),
            'un pictograma, decoratiu (aria-hidden)'
        );
        ok(sense(h) === 'al pis', 'sense les etiquetes, només queda el text: el que llegeix un lector de pantalla');
        const v = paraula('pujar', { forma: 'pujo' });
        ok(
            /<span class="paraula-img" aria-hidden="true">⬆️<\/span><span class="paraula-text">pujo<\/span>/.test(v),
            'un emoji, decoratiu també'
        );
        const noImatge = paraula('molt');
        ok(!/paraula-img/.test(noImatge) && sense(noImatge) === 'molt', 'una paraula sense imatge: només el text');
        ok(
            !/role=|tabindex/.test(noImatge) &&
                ['pis', 'pujar', 'soterrani'].every(id => /role="button" tabindex="0"/.test(paraula(id))),
            'amb imatge, la píndola és un botó que es pot tocar i arribar-hi amb el teclat; sense imatge, no (la targeta només tindria el text)'
        );
        ok(
            ['pis', 'planta-baixa', 'soterrani'].every(id => /<svg/.test(paraula(id))) &&
                new Set(
                    ['pis', 'planta-baixa', 'soterrani'].map(
                        id => paraula(id, { article: false }).match(/<svg.*<\/svg>/)[0]
                    )
                ).size === 3,
            "els tres pictogrames de l'edifici són diferents"
        );
        ok(/no és al lèxic/.test(falla(() => paraula('dinosaure'))), 'una paraula que no hi és falla');

        // Si una paraula portés caràcters especials, l'HTML no s'hi trencaria (es canvia l'entrada un moment)
        const pis = L.entrada('pis');
        const pujar = L.entrada('pujar');
        const [singular, imatgePis, imatge] = [pis.singular, pis.imatge, pujar.imatge];
        try {
            pis.imatge = { pictograma: 'no-hi-es' };
            ok(/no existeix/.test(falla(() => paraula('pis'))), 'un pictograma que no existeix falla');
            pis.imatge = imatgePis;
            pis.singular = 'p<i>&"s';
            pujar.imatge = { emoji: '<b>&' };
            const x = paraula('pis', { article: false });
            ok(
                x.includes('<span class="paraula-text">p&lt;i&gt;&amp;&quot;s</span>') && !x.includes('p<i>'),
                "el text de la paraula s'escapa a l'HTML"
            );
            ok(
                paraula('pujar').includes('<span class="paraula-img" aria-hidden="true">&lt;b&gt;&amp;</span>'),
                "l'emoji s'escapa a l'HTML"
            );
        } finally {
            pis.singular = singular;
            pis.imatge = imatgePis;
            pujar.imatge = imatge;
        }
        ok(
            textParaula('pis', { article: false }) === 'pis' && paraula('pujar').includes('⬆️'),
            "l'entrada ha quedat com estava"
        );
    }

    suite('Aprèn la paraula (js/lexicon/targeta.js): què mostra la targeta de cada paraula');
    {
        const pis = contingutTargeta('pis');
        ok(
            pis.nom === 'el pis' && pis.plural === 'els pisos' && /^<svg /.test(pis.imatge),
            `un nom: «${pis.nom}», «${pis.plural}» i el pictograma`
        );
        const pb = contingutTargeta('planta-baixa');
        ok(
            pb.nom === 'la planta baixa' && pb.plural === 'les plantes baixes',
            `un nom femení: «${pb.nom}», «${pb.plural}»`
        );
        const inici = contingutTargeta('inici');
        ok(
            inici.nom === "l'inici" && inici.plural === 'els inicis' && inici.imatge === '',
            `un nom que comença per vocal i no té imatge: «${inici.nom}», «${inici.plural}»`
        );
        const pujar = contingutTargeta('pujar');
        ok(
            pujar.nom === 'pujar' && pujar.plural === '' && pujar.imatge === '⬆️',
            "un verb: l'infinitiu, sense plural, amb la seva fletxa"
        );
        ok(
            dades.LEXIC.filter(e => e.imatge).every(e => {
                const c = contingutTargeta(e.id);
                return c.id === e.id && c.nom.length > 0 && c.imatge.length > 0;
            }),
            'cada paraula amb imatge té targeta, amb nom i imatge'
        );
        ok(
            /no és al lèxic/.test(
                (() => {
                    try {
                        contingutTargeta('dinosaure');
                        return '';
                    } catch (e) {
                        return e.message;
                    }
                })()
            ),
            'una paraula que no és al lèxic falla'
        );
    }

    suite('Aprèn la paraula: les paraules vistes (el distintiu «paraula nova»)');
    {
        /** Un emmagatzematge de mentida, amb la mateixa interfície que localStorage. */
        const falsa = (inicial = {}) => {
            const dades2 = { ...inicial };
            return {
                dades: dades2,
                getItem: k => (k in dades2 ? dades2[k] : null),
                setItem: (k, v) => {
                    dades2[k] = String(v);
                },
            };
        };
        const e1 = falsa();
        const v1 = crearVistes(e1);
        ok(v1.esNova('pis') && v1.llista().length === 0, 'al principi, totes les paraules són noves');
        v1.marca('pis');
        ok(!v1.esNova('pis') && v1.esNova('pujar'), 'en veure una paraula, ja no és nova; les altres, sí');
        ok(e1.dades[CLAU_VISTES] === '["pis"]', `es recorda (${e1.dades[CLAU_VISTES]})`);
        ok(
            !crearVistes(e1).esNova('pis') && crearVistes(e1).esNova('pujar'),
            'una altra visita (un altre objecte) ho recorda'
        );
        v1.marca('pis');
        v1.marca('pujar');
        ok(e1.dades[CLAU_VISTES] === '["pis","pujar"]', 'no es repeteix i es van afegint');

        // Una altra pestanya ha afegit una paraula mentrestant: no s'esborra
        const e2 = falsa({ [CLAU_VISTES]: '["pis"]' });
        const v2 = crearVistes(e2);
        e2.dades[CLAU_VISTES] = '["pis","baixar"]';
        v2.marca('pujar');
        ok(
            JSON.parse(e2.dades[CLAU_VISTES]).sort().join() === 'baixar,pis,pujar',
            'si una altra pestanya ha afegit paraules, es conserven'
        );

        // Dades trencades o estranyes: com si no hi hagués res
        for (const [nom, text] of [
            ['text que no és JSON', 'això no és JSON'],
            ['JSON que no és una llista', '{"pis":true}'],
            ['una cadena', '"pis"'],
        ])
            ok(
                crearVistes(falsa({ [CLAU_VISTES]: text })).esNova('pis'),
                `dades desades trencades (${nom}): s'ignoren`
            );
        ok(
            crearVistes(falsa({ [CLAU_VISTES]: '["pis", 7, null, {"a":1}]' }))
                .llista()
                .join() === 'pis',
            'a la llista només es fan servir els textos'
        );

        // Sense emmagatzematge (mode privat, dades bloquejades): no falla i es recorda mentre dura la pàgina
        const trencada = {
            getItem() {
                throw new Error('SecurityError');
            },
            setItem() {
                throw new Error('QuotaExceededError');
            },
        };
        for (const [nom, emm] of [
            ['null', null],
            ['una que falla', trencada],
        ]) {
            const v = crearVistes(emm);
            v.marca('pis');
            ok(
                !v.esNova('pis') && v.esNova('pujar'),
                `sense emmagatzematge (${nom}): no falla i ho recorda mentre la pàgina és oberta`
            );
        }
    }

    suite("Lèxic: errors d'ús amb missatges clars");
    {
        const falla = f => {
            try {
                f();
                return '';
            } catch (e) {
                return e.message;
            }
        };
        ok(/no és al lèxic/.test(falla(() => L.entrada('dinosaure'))), 'una paraula que no és al lèxic');
        ok(/no és al lèxic/.test(falla(() => L.forma('Pis'))), "una errada de lletra a l'id");
        ok(/no un nom/.test(falla(() => L.forma('pujar'))), "forma() d'un verb");
        ok(/no un nom/.test(falla(() => L.preposicio('a', 'molt'))), "preposicio() d'una paraula que no és un nom");
        ok(
            L.entrada('pujar').formes.includes('pujo') && L.formesDe(L.entrada('pis')).join() === 'pis,pisos',
            'formesDe: totes les formes escrites'
        );
    }

    suite('Paraules noves (tools/paraules-noves.js): la comparació entre dues versions del lèxic');
    {
        const { compara, informe } = require('../tools/paraules-noves.js');
        const pis = {
            id: 'pis',
            tipus: 'nom',
            singular: 'pis',
            plural: 'pisos',
            genere: 'm',
            article: 'el',
            tema: 'edifici',
            concret: true,
        };
        const pujar = { id: 'pujar', tipus: 'verb', formes: ['pujar', 'pujo'], tema: 'moviment' };
        const abans = { LEXIC: [pis], FUNCIONALS: ['el', 'a'] };
        const ara = {
            LEXIC: [{ ...pis, plural: 'pisos' }, pujar, { ...pujar, id: 'x', formes: ['xxx'], tema: 'joc' }],
            FUNCIONALS: ['el', 'a', 'al'],
        };
        let c = compara(abans, ara);
        ok(c.noves.map(e => e.id).join() === 'pujar,x', 'les entrades que abans no hi eren són noves');
        ok(c.funcionals.join() === 'al', 'les paraules gramaticals noves');
        ok(c.formesNoves.length === 0, 'cap forma nova si les entrades que ja hi eren no han canviat');
        c = compara({ LEXIC: [{ ...pujar, formes: ['pujar'] }], FUNCIONALS: [] }, { LEXIC: [pujar], FUNCIONALS: [] });
        ok(
            c.noves.length === 0 && c.formesNoves.length === 1 && c.formesNoves[0].formes.join() === 'pujo',
            "una forma nova (pujo) d'una entrada que ja hi era"
        );
        c = compara(null, ara);
        ok(c.noves.length === 3 && c.funcionals.length === 3, 'si el lèxic encara no existia, tot és nou');
        ok(
            /^Cap paraula nova/.test(informe(compara(abans, abans), dades.TEMES, 'origin/main')),
            'sense canvis: «Cap paraula nova»'
        );
        const text = informe(compara(abans, ara), dades.TEMES, 'origin/main');
        ok(
            /Moviment/.test(text) && /\| pujar \| verb \| pujar, pujo \| {2}\|/.test(text),
            "l'informe agrupa per tema i mostra la paraula amb les seves formes"
        );
        ok(/\*\*Paraules gramaticals noves:\*\* al/.test(text), "l'informe llista les paraules gramaticals noves");
        const ambImatge = informe(compara(null, { LEXIC: [pis], FUNCIONALS: [] }), dades.TEMES, 'x');
        ok(
            /\| pis \| nom \| el pis, els pisos \| cal imatge \|/.test(ambImatge),
            'una paraula concreta sense imatge diu que cal imatge'
        );
        const conImatge = { ...pis, imatge: { pictograma: 'pis' } };
        ok(
            /\| pis \| nom \| el pis, els pisos \| pictograma «pis» \|/.test(
                informe(compara(null, { LEXIC: [conImatge], FUNCIONALS: [] }), dades.TEMES, 'x')
            ),
            'una paraula amb pictograma el diu'
        );
        c = compara({ LEXIC: [pis], FUNCIONALS: [] }, { LEXIC: [conImatge], FUNCIONALS: [] });
        ok(
            c.noves.length === 0 && c.imatgesNoves.length === 1,
            'una entrada que ja hi era i ara té imatge: imatge nova'
        );
        ok(
            /Imatges noves o canviades[\s\S]*\| pis \| pictograma «pis» \|/.test(
                informe(c, dades.TEMES, 'origin/main')
            ) && !/Paraules noves/.test(informe(c, dades.TEMES, 'origin/main')),
            "l'informe té una secció d'imatges, i cap de paraules noves"
        );
        c = compara(
            { LEXIC: [conImatge], FUNCIONALS: [] },
            { LEXIC: [{ ...conImatge, imatge: { emoji: '🏢' } }], FUNCIONALS: [] }
        );
        ok(c.imatgesNoves.length === 1, 'una imatge canviada també es llista');
        c = compara({ LEXIC: [conImatge], FUNCIONALS: [] }, { LEXIC: [conImatge], FUNCIONALS: [] });
        ok(c.imatgesNoves.length === 0, 'una imatge que no ha canviat no es llista');
    }

    finish();
})().catch(e => {
    console.error(e);
    process.exit(1);
});
