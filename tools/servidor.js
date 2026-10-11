/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: tools/servidor.js
 * ROL: Servidor web mínim per provar el projecte a l'ordinador o al Codespace.
 *      Les pàgines fan servir rutes relatives i alguns navegadors no deixen
 *      carregar-ne tots els fitxers si s'obre l'HTML amb doble clic (file://):
 *      millor un servidor. No guarda res a la memòria cau: cada canvi es veu en
 *      tornar a carregar la pàgina.
 * ÚS (des de l'arrel del repositori):
 *      node tools/servidor.js          → http://localhost:8000
 *      node tools/servidor.js 8080     → un altre port
 *      Per aturar-lo: Ctrl+C
 *      Els tests de navegador (tests/navegador) l'engeguen ells sols, amb require().
 * DEPENDÈNCIES: cap (només Node).
 * Adaptat de tools/servidor.js d'operacions (vegeu UPSTREAM.md).
 * ============================================================================
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
    '.txt': 'text/plain; charset=utf-8',
    '.md': 'text/plain; charset=utf-8',
    '.csv': 'text/csv; charset=utf-8',
};

/** Crea (sense engegar-lo) el servidor que serveix el repositori. */
function crea() {
    return http.createServer((req, res) => {
        let rel;
        try {
            rel = decodeURIComponent(req.url.split(/[?#]/)[0]);
        } catch {
            res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Adreça incorrecta');
            return;
        }
        if (rel.endsWith('/')) rel += 'index.html';
        const file = path.join(ROOT, rel);
        // Només fitxers de dins del repositori, i cap carpeta oculta (.git, .github…)
        const ocult = rel.split('/').some(s => s.startsWith('.') && s !== '');
        if (!file.startsWith(ROOT + path.sep) || ocult) {
            res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Prohibit');
            return;
        }
        fs.readFile(file, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end(`No existeix: ${rel}`);
                return;
            }
            const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' }).end(data);
        });
    });
}

if (require.main === module) {
    const PORT = Number(process.argv[2]) || 8000;
    crea()
        .on('error', e => {
            console.error(
                e.code === 'EADDRINUSE'
                    ? `El port ${PORT} ja està ocupat: potser ja tens el servidor engegat (mira la pestanya PORTS).`
                    : e.message
            );
            process.exit(1);
        })
        .listen(PORT, () => console.log(`a2: http://localhost:${PORT}  (per aturar-lo: Ctrl+C)`));
}

module.exports = { crea, ROOT };
