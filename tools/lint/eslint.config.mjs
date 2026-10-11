/**
 * Configuració d'ESLint (revisor de codi) del projecte.
 * ÚS (des de l'arrel del repositori):
 *   tools/lint/node_modules/.bin/eslint -c tools/lint/eslint.config.mjs .
 *
 * Només s'activen regles que troben ERRORS (variables no definides, codi
 * inabastable, claus repetides…), no qüestions d'estil: de l'estil se
 * n'encarrega Prettier.
 */
import js from '@eslint/js';
import globals from 'globals';

export default [
    {
        ignores: [
            // El motor antic són scripts clàssics que comparteixen variables globals (un fitxer fa servir
            // el que defineix un altre): ESLint hi veuria centenars de «no definit». S'esborra a la PR 15.
            'js/legacy/**',
            // La configuració d'ESLint mateixa
            'tools/lint/**',
        ],
    },
    js.configs.recommended,
    {
        // Tot el JS de js/ (fora de js/legacy/) són mòduls ES: el que un fitxer necessita d'un altre
        // s'importa (import { randInt } from '../utils.js'), no hi ha globals compartides.
        // Un nom sense declarar ni importar és un error.
        files: ['js/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: { ...globals.browser },
        },
        rules: {
            'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }],
            // Un valor assignat que després no es llegeix: codi sobrer, no un error
            'no-useless-assignment': 'warn',
        },
    },
    {
        // Tests de Node i eines (servidor): CommonJS
        files: ['tests/**/*.js', 'tools/*.js'],
        languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs', globals: { ...globals.node } },
        rules: { 'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }] },
    },
    {
        // Els tests de navegador escriuen funcions que s'executen DINS de la pàgina (page.evaluate…):
        // allà hi ha document, window, getComputedStyle… i alguns noms interns de les pàgines.
        files: ['tests/navegador/**/*.js'],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.browser,
                // Noms interns que els tests llegeixen dins de la pàgina. Si una pàgina els canvia, el test
                // falla i s'ha d'adaptar (i aquesta llista, amb ell).
                ACTIVITIES_ESO: 'readonly', // index.html
                PRODUCTS: 'readonly', // a-proporciodirecta.html
                renderProblem: 'readonly',
                els: 'readonly',
                updateAskedRow: 'readonly',
                svgTwoSteps: 'readonly', // a-decimals-tutorial.html
            },
        },
    },
];
