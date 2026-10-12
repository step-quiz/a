/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/navegador/run.js
 * ROL: Executa els tests de navegador: engega el servidor local i un Chromium
 *      (Playwright) i passa tots els blocs de proves, l'un darrere l'altre.
 * ÚS (des de l'arrel del repositori):
 *      node tests/navegador/run.js              → tots els blocs
 *      node tests/navegador/run.js portada      → només un (jocs, targeta, decimals, proporcio, ordenar, rellotge, recta, mcdmcm, factoritzar, fraccions, areaperimetre, triangle, placartesia, equacions, potencies, nombres, prioritat, vocabulari, instruccions, album, targetes, tutorials, portada, professorat, mobil, accessibilitat)
 * PRIMERA VEGADA (instal·la Playwright i el navegador, uns 150 MB):
 *      npm ci --prefix tools/proves
 *      tools/proves/node_modules/.bin/playwright install chromium
 * ============================================================================
 */
'use strict';
const { finish } = require('../harness');
const { carregaPlaywright, engegaServidor } = require('./helpers');

const BLOCS = [
    'jocs',
    'targeta',
    'decimals',
    'proporcio',
    'ordenar',
    'rellotge',
    'recta',
    'mcdmcm',
    'factoritzar',
    'fraccions',
    'areaperimetre',
    'triangle',
    'placartesia',
    'equacions',
    'potencies',
    'nombres',
    'prioritat',
    'vocabulari',
    'instruccions',
    'album',
    'targetes',
    'tutorials',
    'portada',
    'professorat',
    'mobil',
    'accessibilitat',
];

(async () => {
    const playwright = carregaPlaywright();
    if (!playwright) {
        console.error(
            "Falta Playwright. Instal·la'l (només la primera vegada):\n  npm ci --prefix tools/proves\n  tools/proves/node_modules/.bin/playwright install chromium"
        );
        process.exit(1);
    }
    const triats = process.argv.slice(2);
    const desconeguts = triats.filter(b => !BLOCS.includes(b));
    if (desconeguts.length) {
        console.error(`Bloc desconegut: ${desconeguts.join(', ')}. Els que hi ha: ${BLOCS.join(', ')}.`);
        process.exit(1);
    }
    const { servidor, base } = await engegaServidor();
    const browser = await playwright.chromium.launch();
    try {
        for (const bloc of triats.length ? triats : BLOCS) {
            const t0 = Date.now();
            await require(`./${bloc}.test.js`)({ browser, base });
            console.log(`  (${bloc}: ${((Date.now() - t0) / 1000).toFixed(1)} s)`);
        }
    } finally {
        await browser.close();
        servidor.close();
    }
    finish();
})().catch(e => {
    console.error(e);
    process.exit(1);
});
