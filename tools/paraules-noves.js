/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tools/paraules-noves.js
 * ROL: Llista les PARAULES NOVES del lèxic (js/lexicon/dades.js) respecte d'una
 *      versió anterior del repositori, agrupades per tema i llestes per enganxar
 *      a la descripció d'una pull request («Paraules noves per validar»): així
 *      el professorat veu quines paraules noves llegirà l'alumnat abans de
 *      fusionar-la. Només llegeix; no canvia res.
 * ÚS (des de l'arrel del repositori):
 *      node tools/paraules-noves.js              → respecte d'origin/main
 *      node tools/paraules-noves.js 9a98f95      → respecte d'un altre commit, branca o etiqueta
 * Si «origin/main» no hi és (o és antic): git fetch origin main
 * DEPENDÈNCIES: cap (només Node i git).
 * ============================================================================
 */
'use strict';
const path = require('path');
const { execFileSync } = require('child_process');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..');

/** Les formes escrites d'una entrada (els noms, singular i plural; la resta, la llista de formes). */
const formes = e => (e.tipus === 'nom' ? [e.singular, e.plural] : e.formes);

/** La paraula tal com s'escriu al diccionari: el singular d'un nom o la primera forma (l'infinitiu d'un verb). */
const lema = e => (e.tipus === 'nom' ? e.singular : e.formes[0]);

/** La imatge d'una entrada, per a l'informe: l'emoji, «pictograma «pis»», «cal imatge» (concreta sense imatge) o buit. */
const imatge = e => {
    if (e.imatge && e.imatge.emoji) return e.imatge.emoji;
    if (e.imatge && e.imatge.mates) return e.imatge.mates.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (e.imatge && e.imatge.pictograma) return `pictograma «${e.imatge.pictograma}»`;
    return e.concret ? 'cal imatge' : '';
};

/** «el pis, els pisos» per a un nom; les formes separades per comes per a la resta. */
function descriu(e) {
    if (e.tipus !== 'nom') return e.formes.join(', ');
    const plural = e.genere === 'm' ? 'els' : 'les';
    const sing = e.article.endsWith("'") ? e.article + e.singular : `${e.article} ${e.singular}`;
    return `${sing}, ${plural} ${e.plural}`;
}

/**
 * Compara dues versions de les dades del lèxic i torna el que és nou a `ara`:
 *   noves: entrades que no hi eren; formesNoves: formes noves d'entrades que ja hi eren;
 *   imatgesNoves: entrades que ja hi eren i ara tenen una imatge nova o canviada;
 *   funcionals: paraules gramaticals noves.
 * `abans` pot ser null (el lèxic encara no existia: tot és nou).
 */
function compara(abans, ara) {
    const antics = new Map(((abans && abans.LEXIC) || []).map(e => [e.id, e]));
    const noves = [];
    const formesNoves = [];
    const imatgesNoves = [];
    for (const e of ara.LEXIC) {
        const antic = antics.get(e.id);
        if (!antic) {
            noves.push(e);
            continue;
        }
        const tenia = new Set(formes(antic));
        const afegides = formes(e).filter(f => !tenia.has(f));
        if (afegides.length) formesNoves.push({ entrada: e, formes: afegides });
        if (e.imatge && JSON.stringify(e.imatge) !== JSON.stringify(antic.imatge ?? null)) imatgesNoves.push(e);
    }
    const teniaFuncionals = new Set((abans && abans.FUNCIONALS) || []);
    return { noves, formesNoves, imatgesNoves, funcionals: ara.FUNCIONALS.filter(f => !teniaFuncionals.has(f)) };
}

/** L'informe en Markdown, per posar a la descripció d'una PR. */
function informe(canvis, TEMES, referencia) {
    const { noves, formesNoves, imatgesNoves, funcionals } = canvis;
    if (!noves.length && !formesNoves.length && !imatgesNoves.length && !funcionals.length) return `Cap paraula nova respecte de \`${referencia}\`.\n`;
    const l = [];
    if (noves.length || formesNoves.length || funcionals.length) {
        l.push(`Paraules noves respecte de \`${referencia}\` (cal validar-les):`, '');
        const temes = [...new Set([...noves.map(e => e.tema), ...formesNoves.map(x => x.entrada.tema)])];
        for (const tema of temes) {
            l.push(`**${TEMES[tema] || tema}**`, '', '| Paraula | Tipus | Formes | Imatge |', '|---|---|---|---|');
            for (const e of noves.filter(x => x.tema === tema)) l.push(`| ${lema(e)} | ${e.tipus} | ${descriu(e)} | ${imatge(e)} |`);
            for (const x of formesNoves.filter(y => y.entrada.tema === tema))
                l.push(`| ${lema(x.entrada)} | ${x.entrada.tipus} | forma nova: ${x.formes.join(', ')} | |`);
            l.push('');
        }
        if (funcionals.length) l.push(`**Paraules gramaticals noves:** ${funcionals.join(', ')}`, '');
    }
    if (imatgesNoves.length) {
        l.push(`Imatges noves o canviades respecte de \`${referencia}\` (cal validar-les):`, '', '| Paraula | Imatge |', '|---|---|');
        for (const e of imatgesNoves) l.push(`| ${lema(e)} | ${imatge(e)} |`);
        l.push('');
    }
    return l.join('\n');
}

/** Les dades del lèxic tal com eren a la referència (null si el fitxer encara no existia). */
async function dadesDe(referencia) {
    let codi;
    try {
        execFileSync('git', ['rev-parse', '--verify', '--quiet', `${referencia}^{commit}`], { cwd: ROOT, stdio: 'ignore' });
    } catch {
        throw new Error(`No trobo «${referencia}». Si és «origin/main», baixa'l amb: git fetch origin main`);
    }
    try {
        codi = execFileSync('git', ['show', `${referencia}:js/lexicon/dades.js`], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    } catch {
        return null; // a la referència el lèxic encara no existia
    }
    // El fitxer de dades no importa res: es pot carregar directament des del seu text
    return import(`data:text/javascript;base64,${Buffer.from(codi).toString('base64')}`);
}

if (require.main === module) {
    const referencia = process.argv[2] || 'origin/main';
    (async () => {
        const ara = await import(pathToFileURL(path.join(ROOT, 'js/lexicon/dades.js')).href);
        const abans = await dadesDe(referencia);
        process.stdout.write(informe(compara(abans, ara), ara.TEMES, referencia));
    })().catch(e => {
        console.error(e.message);
        process.exit(1);
    });
}

module.exports = { compara, informe, descriu };
