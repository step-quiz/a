/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/run-all.js
 * ROL: Executa els tests que només necessiten Node (sense instal·lar res),
 *      l'un darrere l'altre, i acaba amb error si algun falla. És el que
 *      executen tools/desa.sh i el primer treball de GitHub
 *      (.github/workflows/tests.yml).
 *      Els tests del navegador (Chromium) són a part: node tests/navegador/run.js
 * ÚS: node tests/run-all.js
 * ============================================================================
 */
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TESTS = [
    ['Comprovacions del repositori', 'tests/check-repo.js'],
    ['Motor nou (mòduls ES de js/)', 'tests/game-core.test.js'],
    ['Lògica de les activitats (js/<activitat>/generador.js)', 'tests/activitats.test.js'],
    ['Diners i canvi: la lògica (js/a-decimals/)', 'tests/a-decimals.test.js'],
    ['Sessions fixes (js/fixed-sessions.js)', 'tests/fixed-sessions.test.js'],
    ['Lèxic: dades i API (js/lexicon/)', 'tests/lexicon.test.js'],
    ['Vocabulari: les paraules dels textos són al lèxic', 'tests/check-lexicon.js'],
];

const resultats = TESTS.map(([nom, fitxer]) => {
    console.log(`\n${'═'.repeat(60)}\n  ${nom}  (${fitxer})\n${'═'.repeat(60)}`);
    const r = spawnSync(process.execPath, [path.join(ROOT, fitxer)], { stdio: 'inherit', cwd: ROOT });
    return [nom, r.status === 0];
});

console.log(`\n${'═'.repeat(60)}\n  RESUM\n${'═'.repeat(60)}`);
resultats.forEach(([nom, correcte]) => console.log(`  ${correcte ? '✓' : '✗'} ${nom}`));
const tot = resultats.every(([, correcte]) => correcte);
console.log(tot ? '\nTot correcte.' : '\nHi ha errors: mira els ✗ de més amunt.');
process.exit(tot ? 0 : 1);
