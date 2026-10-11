/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tests/check-repo.js
 * ROL: Comprovacions de tot el repositori (no executa cap joc):
 *   1. Sintaxi de tots els fitxers JS i dels <script> en línia dels HTML.
 *   2. Enllaços locals trencats (HTML, CSS, redireccions JS, llista de la
 *      portada i enllaços entre documents .md).
 *   3. Cap «id» repetit dins d'una pàgina.
 *   4. Res que es descarregui de tercers (privacitat de l'alumnat, i perquè
 *      l'aula pot tenir el filtre d'internet molt tancat) ni cap petició de xarxa.
 *   5. Guardes contra errors ja corregits que no han de tornar (vegeu
 *      docs/REVISIO-INICIAL.md): codis de retorn, zoom bloquejat, accents
 *      que falten, fórmula de punts antiga, imatges massa pesades…
 *   6. Infraestructura: .nojekyll, .gitignore, Codespace, workflows, l'ordre
 *      dels scripts de cada activitat i els fulls d'estils comuns
 *      (css/tokens.css, css/accessibilitat.css).
 *   7. Document viu: com a molt una PR «EN CURS» a docs/PLA.md.
 * ÚS: node tests/check-repo.js
 * ============================================================================
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');
const { ROOT, suite, ok, finish, read, exists, listFiles, sensePComentaris } = require('./harness');

const htmlFiles = listFiles('.', ['.html']);
const jsFiles = listFiles('.', ['.js']);
const cssFiles = listFiles('.', ['.css']);
const mdFiles = listFiles('.', ['.md']);
const activitats = htmlFiles.filter(f => /^a-[^/]*\.html$/.test(f) && !f.endsWith('-tutorial.html'));
const tutorials = htmlFiles.filter(f => f.endsWith('-tutorial.html'));

/** Treu els comentaris HTML i els blocs <style> (un «<script>» dins d'un comentari no és cap script). */
const stripNoise = h => h.replace(/<!--[\s\S]*?-->/g, '').replace(/<style[\s\S]*?<\/style>/gi, '');
const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;
// ── 1. Sintaxi ───────────────────────────────────────────────────────────────
suite('1. Sintaxi de tots els fitxers JS i dels <script> en línia');

/** Comprova la sintaxi sense executar res. Retorna el missatge d'error o null. */
function errorDeSintaxi(codi, fitxer, esModul) {
    if (esModul) {
        const r = spawnSync(process.execPath, ['--check', '--input-type=module'], { input: codi, encoding: 'utf8' });
        return r.status === 0 ? null : r.stderr.split('\n').find(l => /Error/.test(l)) || 'error de sintaxi';
    }
    try {
        new vm.Script(codi, { filename: fitxer });
        return null;
    } catch (e) {
        return e.message;
    }
}

{
    const dolents = [];
    let moduls = 0;
    for (const f of jsFiles) {
        const codi = read(f);
        // Els mòduls ES (js/, fora de js/legacy/) porten import/export; la resta són scripts clàssics o de Node
        const esModul = f.startsWith('js/') && !f.startsWith('js/legacy/') && /^\s*(import|export)\s/m.test(codi);
        if (esModul) moduls++;
        const e = errorDeSintaxi(codi, f, esModul);
        if (e) dolents.push(`${f}: ${e}`);
    }
    ok(dolents.length === 0, `${jsFiles.length} fitxers .js (${moduls} mòduls ES)`, dolents.join('\n'));
}
{
    let blocs = 0;
    const dolents = [];
    for (const f of htmlFiles) {
        const html = stripNoise(read(f));
        for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
            if (/\bsrc\s*=/.test(m[1])) continue;
            if (/type\s*=\s*["']?(application\/(ld\+)?json|importmap|text\/template)/i.test(m[1])) continue;
            blocs++;
            const e = errorDeSintaxi(m[2], f, /type\s*=\s*["']?module/i.test(m[1]));
            if (e) dolents.push(`${f} (bloc que comença a la línia ${lineOf(html, m.index)}): ${e}`);
        }
    }
    ok(
        dolents.length === 0,
        `${blocs} blocs <script> en línia de ${htmlFiles.length} pàgines HTML`,
        dolents.join('\n')
    );
}

// ── 2. Enllaços locals ───────────────────────────────────────────────────────
suite('2. Enllaços locals que no existeixen');

const ES_EXTERN = u => /^(https?:|\/\/|mailto:|tel:|data:|#|javascript:)/i.test(u);
{
    const dolents = [];
    for (const f of htmlFiles) {
        const html = stripNoise(read(f));
        for (const m of html.matchAll(/(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
            const u = m[1].trim();
            if (ES_EXTERN(u) || u.includes('${') || u.includes('{{')) continue;
            const ruta = u.split('#')[0].split('?')[0];
            if (!ruta) continue;
            if (!exists(path.posix.join(path.posix.dirname(f), ruta)))
                dolents.push(`${f}:${lineOf(html, m.index)} → ${u}`);
        }
    }
    ok(dolents.length === 0, 'href i src de les pàgines HTML', dolents.join('\n'));
}
{
    const dolents = [];
    for (const f of cssFiles) {
        const css = read(f);
        for (const m of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
            const u = m[1].trim();
            if (ES_EXTERN(u)) continue;
            if (!exists(path.posix.join(path.posix.dirname(f), u.split(/[?#]/)[0])))
                dolents.push(`${f}:${lineOf(css, m.index)} → ${u}`);
        }
    }
    ok(dolents.length === 0, 'url(…) dels fitxers CSS', dolents.join('\n'));
}
{
    const dolents = [];
    let n = 0;
    for (const f of [...htmlFiles, ...jsFiles]) {
        const t = read(f);
        for (const m of t.matchAll(/location\.href\s*=\s*['"]([^'"]+?\.html)(?:[?#][^'"]*)?['"]/g)) {
            n++;
            // Una ruta relativa d'un fitxer .js es resol respecte de la PÀGINA (totes són a l'arrel), no respecte del .js
            const base = f.endsWith('.js') ? '.' : path.posix.dirname(f);
            if (!exists(path.posix.join(base, m[1]))) dolents.push(`${f}:${lineOf(t, m.index)} → ${m[1]}`);
        }
    }
    ok(dolents.length === 0, `${n} redireccions amb location.href`, dolents.join('\n'));
}
{
    // Mòduls ES (js/, fora de js/legacy/): cada import ha de dur a un fitxer que existeix i que exporta el que se li demana.
    // Els controladors necessiten la pàgina i no es poden carregar des de Node: aquesta comprovació en detecta els errors
    // (un nom mal escrit, un fitxer canviat de lloc…) abans que el navegador es trobi un «SyntaxError» en obrir l'activitat.
    const moduls = jsFiles.filter(f => f.startsWith('js/') && !f.startsWith('js/legacy/'));
    const exportats = f => {
        const t = sensePComentaris(read(f));
        const noms = new Set();
        for (const m of t.matchAll(/^export\s+(?:async\s+)?(?:function\*?|const|let|var|class)\s+([\w$]+)/gm))
            noms.add(m[1]);
        for (const m of t.matchAll(/^export\s*\{([^}]*)\}/gm))
            for (const part of m[1].split(','))
                noms.add(
                    part
                        .trim()
                        .split(/\s+as\s+/)
                        .pop()
                );
        if (/^export\s+default\b/m.test(t)) noms.add('default');
        return { noms, totEs: /^export\s*\*/m.test(t) };
    };
    const dolents = [];
    let n = 0;
    for (const f of moduls) {
        const t = sensePComentaris(read(f));
        // (la part «… from» no pot contenir cometes ni «;»: si no, un import sense «from» se la menjaria amb el següent)
        for (const m of t.matchAll(/^import\s+(?:([^'";]*?)\s+from\s+)?['"]([^'"]+)['"]/gm)) {
            n++;
            const [, clau, spec] = m;
            const on = `${f}:${lineOf(t, m.index)}`;
            if (!spec.startsWith('.')) {
                dolents.push(`${on} → import no relatiu «${spec}» (res de tercers)`);
                continue;
            }
            const desti = path.posix.join(path.posix.dirname(f), spec);
            if (!exists(desti)) {
                dolents.push(`${on} → ${spec} no existeix`);
                continue;
            }
            const { noms, totEs } = exportats(desti);
            if (!clau || totEs) continue;
            const demanats = ((clau.match(/\{([\s\S]*)\}/) || [])[1] || '')
                .split(',')
                .map(s =>
                    s
                        .trim()
                        .split(/\s+as\s+/)[0]
                        .trim()
                )
                .filter(Boolean);
            for (const nom of demanats) if (!noms.has(nom)) dolents.push(`${on} → «${nom}» no ho exporta ${desti}`);
        }
    }
    ok(dolents.length === 0, `${n} import de ${moduls.length} mòduls ES: fitxers i noms existents`, dolents.join('\n'));
}
{
    // La llista d'activitats de la portada (ACTIVITIES_ESO): cada pàgina i cada tutorial han d'existir
    const idx = read('index.html');
    const llista = idx.slice(idx.indexOf('ACTIVITIES_ESO'), idx.indexOf('DEFAULT_ESO'));
    const fitxers = [...llista.matchAll(/file:\s*'([^']+)'/g)].map(m => m[1]);
    const yts = [...llista.matchAll(/yt:\s*'([^']+)'/g)].map(m => m[1]);
    const dolents = [...fitxers, ...yts].filter(f => !/^https?:/.test(f) && !exists(f));
    ok(
        fitxers.length >= 5 && dolents.length === 0,
        `la portada ofereix ${fitxers.length} activitats i ${yts.length} tutorials`,
        dolents.join('\n')
    );
    const sensePortada = activitats.filter(a => !fitxers.includes(a));
    ok(sensePortada.length === 0, 'totes les activitats (a-*.html) són a la portada', sensePortada.join(', '));
    const defecte = (idx.match(/DEFAULT_ESO\s*=\s*'([^']+)'/) || [])[1];
    ok(fitxers.includes(defecte), `l'activitat per defecte de la portada és a la llista (${defecte})`);
}
{
    const dolents = [];
    let n = 0;
    for (const f of mdFiles) {
        const t = read(f).replace(/```[\s\S]*?```/g, '');
        for (const m of t.matchAll(/\]\(([^)\s]+)\)/g)) {
            const u = m[1];
            if (ES_EXTERN(u)) continue;
            n++;
            if (!exists(path.posix.join(path.posix.dirname(f), u.split('#')[0])))
                dolents.push(`${f}:${lineOf(t, m.index)} → ${u}`);
        }
    }
    ok(dolents.length === 0, `${n} enllaços entre documents .md`, dolents.join('\n'));
}

// ── 3. Ids repetits ──────────────────────────────────────────────────────────
suite("3. Cap «id» repetit dins d'una pàgina");
{
    const dolents = [];
    for (const f of htmlFiles) {
        const html = stripNoise(read(f)).replace(/<script\b[\s\S]*?<\/script>/gi, '');
        const comptes = {};
        for (const m of html.matchAll(/\sid\s*=\s*["']([^"']+)["']/g))
            if (!m[1].includes('${')) comptes[m[1]] = (comptes[m[1]] || 0) + 1;
        const rep = Object.entries(comptes).filter(([, n]) => n > 1);
        if (rep.length) dolents.push(`${f}: ${rep.map(([id, n]) => `${id} ×${n}`).join(', ')}`);
    }
    ok(dolents.length === 0, `${htmlFiles.length} pàgines HTML`, dolents.join('\n'));
}

// ── 4. Tercers i xarxa ───────────────────────────────────────────────────────
suite('4. Res que es descarregui de tercers ni cap petició de xarxa');
{
    // Recursos que el navegador baixa sol. Els enllaços <a href> a altres webs sí que es permeten.
    const dolents = [];
    for (const f of htmlFiles) {
        const html = stripNoise(read(f));
        for (const m of html.matchAll(/<(script|img|iframe|source|video|audio|embed|object|link)\b([^>]*)>/gi)) {
            const tag = m[1].toLowerCase();
            const a = m[2];
            const url =
                tag === 'link'
                    ? (a.match(/\bhref\s*=\s*["']([^"']+)["']/i) || [])[1]
                    : (a.match(/\b(?:src|data)\s*=\s*["']([^"']+)["']/i) || [])[1];
            if (url && /^(https?:)?\/\//i.test(url.trim()))
                dolents.push(`${f}:${lineOf(html, m.index)} <${tag}> → ${url}`);
        }
    }
    for (const f of cssFiles) {
        const css = read(f);
        for (const m of css.matchAll(/(?:url\(\s*["']?|@import\s+["']?)((?:https?:)?\/\/[^"')\s]+)/gi))
            dolents.push(`${f}:${lineOf(css, m.index)} → ${m[1]}`);
    }
    ok(dolents.length === 0, "cap script, imatge, tipus de lletra ni full d'estils de tercers", dolents.join('\n'));
}
{
    // L'alumnat és menor d'edat: les activitats no envien cap dada enlloc.
    const dolents = [];
    for (const f of [...htmlFiles, ...jsFiles.filter(f => f.startsWith('js/'))]) {
        const t = read(f);
        for (const m of t.matchAll(/\b(fetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|importScripts)/g))
            dolents.push(`${f}:${lineOf(t, m.index)} → ${m[1]}`);
    }
    ok(dolents.length === 0, 'cap fetch, XMLHttpRequest, sendBeacon ni WebSocket al codi del web', dolents.join('\n'));
}

// ── 5. Guardes contra errors ja corregits ────────────────────────────────────
suite('5. Guardes: errors corregits que no han de tornar');
{
    const codi = [...htmlFiles, ...jsFiles.filter(f => f.startsWith('js/')), ...cssFiles];
    const buscar = (re, fitxers = codi) => {
        const global = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
        return fitxers.flatMap(f => [...read(f).matchAll(global)].map(m => `${f}: ${m[0]}`));
    };
    const codis = buscar(
        /EXERCISE_CODES|copiarResultats|recordResult|defaultEnllocMitjana|maxenllocmitjana|analitzador/
    );
    ok(codis.length === 0, 'cap codi de retorn al professorat (D3)', codis.join('\n'));
    const accents = buscar(/\bSessio\b|Molt be!|Comencar|mes alta obte|Configuracio/);
    ok(accents.length === 0, 'cap accent que falta a la interfície (R15)', accents.join('\n'));
    const formula = buscar(/Math\.max\(\s*0\s*,\s*10\s*-/);
    ok(
        formula.length === 0,
        'els punts es calculen amb puntsPregunta(), no amb la fórmula antiga (R5)',
        formula.join('\n')
    );
    const zoom = htmlFiles.filter(f => {
        const v = read(f).match(/<meta[^>]*name=["']viewport["'][^>]*>/i);
        return !v || /user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b/i.test(v[0]);
    });
    ok(zoom.length === 0, 'totes les pàgines tenen <meta viewport> i deixen fer zoom', zoom.join(', '));
    const senseAlt = htmlFiles.flatMap(f =>
        [...stripNoise(read(f)).matchAll(/<img\b[^>]*>/gi)].filter(m => !/\balt\s*=/.test(m[0])).map(() => f)
    );
    ok(senseAlt.length === 0, 'cap <img> sense atribut alt', senseAlt.join(', '));
    // Colors de text/estat amb poc contrast (WCAG AA): els tokens de css/tokens.css els substitueixen (R23)
    const pocContrast = buscar(/#059669|#10b981|#ef4444/i);
    ok(
        pocContrast.length === 0,
        "cap dels colors amb poc contrast (#059669, #10b981, #ef4444): s'usen els de css/tokens.css (R23)",
        pocContrast.join('\n')
    );
    // Cada alçada en vh ha d'anar acompanyada de la mateixa en dvh (a mòbil, 100vh passa per sota de la barra del navegador)
    const senseDvh = [...htmlFiles, ...cssFiles].filter(f => {
        const t = read(f);
        return (t.match(/\b\d+vh\b/g) || []).length > (t.match(/\b\d+dvh\b/g) || []).length;
    });
    ok(senseDvh.length === 0, 'cada alçada en vh té la seva versió en dvh', senseDvh.join(', '));
    const pesades = listFiles('.', ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']).filter(
        f => fs.statSync(path.join(ROOT, f)).size > 150 * 1024
    );
    ok(pesades.length === 0, 'cap imatge de més de 150 KB (R13: les icones pesaven 212 KB)', pesades.join(', '));
}

// ── 6. Infraestructura ───────────────────────────────────────────────────────
suite('6. Infraestructura del repositori');
{
    ok(exists('.nojekyll'), '.nojekyll (GitHub Pages publica els fitxers tal com són)');
    ok(
        /^node_modules\/?$/m.test(read('.gitignore')) && /^\*\.zip$/m.test(read('.gitignore')),
        '.gitignore ignora node_modules i els .zip'
    );
    try {
        const dc = JSON.parse(read('.devcontainer/devcontainer.json').replace(/^\s*\/\/.*$/gm, ''));
        ok(
            Array.isArray(dc.forwardPorts) && dc.forwardPorts.includes(8000),
            'Codespace: .devcontainer/devcontainer.json és vàlid i reenvia el port 8000'
        );
    } catch (e) {
        ok(false, 'Codespace: .devcontainer/devcontainer.json és vàlid', e.message);
    }
    const workflows = exists('.github/workflows') ? fs.readdirSync(path.join(ROOT, '.github/workflows')) : [];
    ok(workflows.length > 0, `hi ha ${workflows.length} workflow(s) a .github/workflows`);
    // Mai etiquetes que facin que GitHub no publiqui un canvi (només es miren els fitxers que fan ordres)
    const prohibides = /\[(skip ci|ci skip|cf-pages-skip|no ci|skip actions|actions skip)\]/i;
    const amb = [...workflows.map(f => `.github/workflows/${f}`), 'tools/desa.sh', 'tools/servidor.js'].filter(
        f => exists(f) && prohibides.test(read(f))
    );
    ok(amb.length === 0, 'cap etiqueta que impedeixi publicar als workflows ni a les eines', amb.join(', '));
    try {
        const pk = JSON.parse(read('tools/proves/package.json'));
        const versio = pk.devDependencies && pk.devDependencies.playwright;
        ok(/^\d+\.\d+\.\d+$/.test(versio || ''), `tools/proves: Playwright fixat a una versió exacta (${versio})`);
        ok(exists('tools/proves/package-lock.json'), 'tools/proves/package-lock.json (el CI fa servir npm ci)');
    } catch (e) {
        ok(false, 'tools/proves/package.json és vàlid', e.message);
    }
    {
        const dev = JSON.parse(read('tools/proves/package.json')).devDependencies || {};
        ok(
            /^\d+\.\d+\.\d+$/.test(dev['@axe-core/playwright'] || ''),
            `tools/proves: axe-core fixat a una versió exacta (${dev['@axe-core/playwright']})`
        );
    }
    {
        // ESLint i Prettier (tools/lint): versions exactes i fitxer de bloqueig, perquè el CI i el Codespace facin el mateix
        const dev = JSON.parse(read('tools/lint/package.json')).devDependencies || {};
        const noExactes = ['eslint', 'prettier', '@eslint/js', 'globals'].filter(
            n => !/^\d+\.\d+\.\d+$/.test(dev[n] || '')
        );
        ok(
            noExactes.length === 0,
            `tools/lint: ESLint i Prettier fixats a versions exactes (${dev.eslint}, ${dev.prettier})`,
            noExactes.join(', ')
        );
        ok(
            exists('tools/lint/package-lock.json') &&
                exists('tools/lint/eslint.config.mjs') &&
                exists('.prettierrc.json') &&
                exists('.prettierignore'),
            'tools/lint/package-lock.json, eslint.config.mjs, .prettierrc.json i .prettierignore'
        );
    }
    {
        // Colors comuns: una sola font (css/tokens.css), carregada abans de css/shared.css; les activitats no els redefineixen
        const tokens = read('css/tokens.css');
        const faltenTokens = ['--text-main', '--text-muted', '--success', '--danger', '--border-heavy'].filter(
            v => !new RegExp(`${v}\\s*:`).test(tokens)
        );
        ok(faltenTokens.length === 0, 'css/tokens.css defineix els colors comuns', faltenTokens.join(', '));
        const sense = [];
        const redefinides = [];
        for (const f of activitats) {
            const h = read(f);
            const links = [...h.matchAll(/<link\s+rel=["']stylesheet["']\s+href=["']([^"']+)["']/g)].map(m => m[1]);
            const i = n => links.indexOf(n);
            if (!(
                i('css/tokens.css') >= 0 &&
                i('css/tokens.css') < i('css/shared.css') &&
                i('css/shared.css') < i('css/accessibilitat.css')
            ))
                sense.push(f);
            for (const m of h.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
                for (const v of m[1].matchAll(
                    /(--(?:text-main|text-muted|panel-bg|success|success-light|danger|danger-light|warning|border-color|border-heavy|border-light|border-strong))\s*:/g
                ))
                    redefinides.push(`${f}: ${v[1]}`);
            }
        }
        ok(
            sense.length === 0,
            'les activitats carreguen tokens.css → shared.css → accessibilitat.css',
            sense.join(', ')
        );
        ok(
            redefinides.length === 0,
            'cap activitat redefineix els colors comuns de tokens.css',
            redefinides.join(', ')
        );
        const senseAccess = htmlFiles.filter(
            f => !/<link\s+rel=["']stylesheet["']\s+href=["']css\/accessibilitat\.css["']/.test(read(f))
        );
        ok(
            senseAccess.length === 0,
            'totes les pàgines carreguen css/accessibilitat.css (moviment reduït, focus i zones de toc)',
            senseAccess.join(', ')
        );
    }
    // Cada activitat va amb el motor antic (scripts clàssics de js/legacy/, en ordre) o amb el nou
    // (un únic <script type="module" src="js/<activitat>/<activitat>.js"> i cap altre JS a la pàgina).
    const ordre = [];
    const motors = { antic: 0, nou: 0 };
    const activitatsNoves = [];
    for (const f of activitats) {
        const h = stripNoise(read(f));
        const srcs = [...h.matchAll(/<script\s+src=["']([^"']+)["']/g)].map(m => m[1]);
        const moduls = [...h.matchAll(/<script\s+type=["']module["']\s+src=["']([^"']+)["']/g)].map(m => m[1]);
        const nom = f.replace('.html', '');
        const i = n => srcs.indexOf(n);
        if (srcs.includes('js/legacy/game-core.js')) {
            motors.antic++;
            if (!(
                i('js/legacy/utils.js') >= 0 &&
                i('js/legacy/utils.js') < i('js/legacy/config.js') &&
                i('js/legacy/config.js') < i('js/legacy/game-core.js')
            ))
                ordre.push(`${f} (motor antic en desordre)`);
        } else {
            motors.nou++;
            activitatsNoves.push(f);
            const enLinia = [...h.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].filter(
                m => m[1].trim() && !/window\.APP_CONFIG/.test(m[1])
            );
            if (moduls.length !== 1 || moduls[0] !== `js/${nom}/${nom}.js` || srcs.length)
                ordre.push(`${f} (motor nou: cal un sol <script type="module" src="js/${nom}/${nom}.js">)`);
            if (enLinia.length) ordre.push(`${f} (motor nou: no pot tenir JS dins de l'HTML)`);
        }
    }
    ok(
        ordre.length === 0,
        `${activitats.length} activitats: ${motors.antic} amb el motor antic (js/legacy) i ${motors.nou} amb el nou (mòduls ES)`,
        ordre.join('\n')
    );
    {
        // Sessions fixes (?fixed=A/B/C, js/fixed-sessions.js): només funcionen amb el motor nou. L'ordre dels import de
        // config.js és crític (fixed-sessions.js ha d'afegir els paràmetres a la URL ABANS que config.js els llegeixi), i
        // la portada només ha d'oferir el camp «Sessió fixa» a les activitats que l'admeten.
        const config = sensePComentaris(read('js/config.js'));
        const primerImport = (config.match(/^import\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/m) || [])[1];
        ok(
            primerImport === './fixed-sessions.js',
            `js/config.js importa fixed-sessions.js el primer (${primerImport})`
        );
        ok(
            /FixedSessions\.wrap\(\s*'buildLevel'/.test(sensePComentaris(read('js/game-core.js'))),
            'game-core.js embolcalla buildLevel amb FixedSessions.wrap'
        );
        const directes = activitatsNoves.flatMap(f => {
            const nom = f.replace('.html', '');
            const codi = sensePComentaris(read(`js/${nom}/${nom}.js`));
            // buildLevel() sense «window.» davant (i que no sigui la declaració) no passaria per les sessions fixes
            const crides = [...codi.matchAll(/(?<![\w.$])buildLevel\s*\(/g)].filter(
                m => !/function\s+$/.test(codi.slice(0, m.index))
            );
            return crides.map(m => `js/${nom}/${nom}.js:${lineOf(codi, m.index)}`);
        });
        ok(
            directes.length === 0,
            'les activitats comencen cada pregunta amb window.buildLevel() (si no, les sessions fixes no hi arriben)',
            directes.join('\n')
        );
        // Targeta «Aprèn la paraula» (js/targeta-paraula.js): la posa en marxa injectSharedHTML() de game-core.js, i així
        // totes les activitats del motor nou tenen les paraules amb imatge tocables. Els seus estils són a css/shared.css.
        const nucli = sensePComentaris(read('js/game-core.js'));
        const injecta = nucli.slice(
            nucli.indexOf('export function injectSharedHTML'),
            nucli.indexOf('export function isTouchDevice')
        );
        ok(
            /import\s*\{[^}]*\binitTargetaParaula\b[^}]*\}\s*from\s*'\.\/targeta-paraula\.js'/.test(nucli) &&
                /\binitTargetaParaula\(\)/.test(injecta),
            'game-core.js posa en marxa la targeta «Aprèn la paraula» a injectSharedHTML()'
        );
        const senseEstils = activitatsNoves.filter(f => !/href=["']css\/shared\.css["']/.test(read(f)));
        ok(
            senseEstils.length === 0,
            'les activitats del motor nou carreguen css/shared.css (hi ha els estils de la targeta de la paraula)',
            senseEstils.join(', ')
        );
        const idx = read('index.html');
        const llista = idx.slice(idx.indexOf('ACTIVITIES_ESO'), idx.indexOf('DEFAULT_ESO'));
        const ambFixa = [...llista.matchAll(/\{\s*file:\s*'([^']+)'([^}]*)\}/g)]
            .filter(m => /\bfixed:\s*true\b/.test(m[2]))
            .map(m => m[1]);
        ok(
            JSON.stringify([...ambFixa].sort()) === JSON.stringify([...activitatsNoves].sort()),
            `la portada ofereix «Sessió fixa» just a les activitats del motor nou (${ambFixa.join(', ') || 'cap'})`,
            `portada: ${ambFixa.join(', ')}; motor nou: ${activitatsNoves.join(', ')}`
        );
    }
    // Activitats noves que encara no tenen tutorial (es faran, visuals i sense frases, amb els dels altres; PR 10)
    const SENSE_TUTORIAL_ENCARA = [
        'a-enters-ordenar.html',
        'a-recta-numerica.html',
        'a-mcd-mcm.html',
        'a-factoritzar.html',
        'a-fraccions.html',
        'a-area-perimetre.html',
        'a-triangle-rectangle.html',
        'a-pla-cartesia.html',
        'a-potencies.html',
        'a-nombres-lletres.html',
        'a-prioritat.html',
        'a-vocabulari.html',
    ];
    const sensesTutorial = activitats.filter(
        a => !SENSE_TUTORIAL_ENCARA.includes(a) && !tutorials.includes(a.replace('.html', '-tutorial.html'))
    );
    ok(sensesTutorial.length === 0, 'cada activitat té el seu tutorial', sensesTutorial.join(', '));
}

// ── 7. Document viu ──────────────────────────────────────────────────────────
suite('7. docs/PLA.md');
{
    const pla = read('docs/PLA.md');
    const roadmap = pla.slice(pla.indexOf('## 5. Full de ruta'), pla.indexOf('## 6.'));
    const enCurs = roadmap.split('\n').filter(l => /^\|/.test(l) && /\*\*EN CURS\*\*/.test(l));
    ok(
        enCurs.length <= 1,
        `com a molt una PR «EN CURS» al full de ruta (n'hi ha ${enCurs.length})`,
        enCurs.map(l => l.slice(0, 60)).join('\n')
    );
}

finish();
