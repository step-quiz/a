/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/harness.js
 * ROL: Utilitats mínimes comunes de tots els tests (sense dependències):
 *      informe de ✓/✗, recompte i lectura de fitxers del repositori.
 * ÚS: const { suite, ok, finish, read } = require('./harness');
 * ============================================================================
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
// Carpetes que no formen part del web (dependències i còpies del control de versions)
const SKIP_DIRS = new Set(['node_modules', '.git']);

let correctes = 0;
let errors = 0;

/** Títol d'un bloc de comprovacions. */
function suite(nom) {
    console.log(`\n▸ ${nom}`);
}

/** Registra una comprovació. `detall` només es mostra si falla. */
function ok(condicio, missatge, detall) {
    if (condicio) {
        correctes++;
        console.log(`  ✓ ${missatge}`);
    } else {
        errors++;
        console.log(`  ✗ ${missatge}${detall ? `\n      ${String(detall).replace(/\n/g, '\n      ')}` : ''}`);
    }
}

/** Resum final i codi de sortida (≠ 0 si alguna comprovació ha fallat). */
function finish() {
    console.log(`\n${correctes} correctes, ${errors} amb error.`);
    process.exit(errors ? 1 : 0);
}

const atzarReal = Math.random;

/**
 * Atzar sembrat (Mulberry32): substitueix Math.random per una seqüència que depèn només de la llavor,
 * de manera que les proves estadístiques donen sempre el mateix resultat. `restauraAtzar()` el torna a deixar com era.
 */
function sembra(llavor) {
    let s = llavor >>> 0;
    Math.random = () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const restauraAtzar = () => {
    Math.random = atzarReal;
};

/** Els tests dels mòduls ES carreguen js/ amb import() sense package.json: cal la detecció de mòduls, que és de Node 22. */
function exigeixNode22() {
    if (Number(process.versions.node.split('.')[0]) < 22) {
        console.error(`Aquest test necessita Node 22 o més nou i aquí hi ha ${process.version}.`);
        process.exit(1);
    }
}

/** El codi JS sense comentaris (substituïts per espais, perquè no canviïn les línies ni les posicions). */
const buida = s => s.replace(/[^\n]/g, ' ');
const sensePComentaris = t =>
    t.replace(/\/\*[\s\S]*?\*\//g, buida).replace(/(^|[^:])(\/\/.*)$/gm, (_, abans, c) => abans + buida(c));

const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(ROOT, rel));

/** Llista (recursivament) els fitxers amb alguna de les extensions, com a rutes relatives amb «/». */
function listFiles(dir, exts) {
    const out = [];
    const walk = rel => {
        for (const e of fs.readdirSync(path.join(ROOT, rel), { withFileTypes: true })) {
            if (SKIP_DIRS.has(e.name)) continue;
            const r = rel === '.' ? e.name : `${rel}/${e.name}`;
            if (e.isDirectory()) walk(r);
            else if (!exts || exts.includes(path.extname(e.name).toLowerCase())) out.push(r);
        }
    };
    walk(dir);
    return out.sort();
}

module.exports = {
    ROOT,
    suite,
    ok,
    finish,
    read,
    exists,
    listFiles,
    sembra,
    restauraAtzar,
    exigeixNode22,
    sensePComentaris,
};
