/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-pla-cartesia/vista.js
 * ROL: L'HTML i els textos plans de la pantalla de «Coordenades» a partir
 *      d'una pregunta (vegeu generaPregunta a generador.js): les icones dels
 *      quadrants i eixos, el punt demanat («👆 A (3, −2)») i les caselles de
 *      les coordenades. Només hi ha punts, nombres i icones.
 *      No toca el DOM: només construeix text. Es prova des de Node
 *      (tests/activitats.test.js); el controlador és a-pla-cartesia.js.
 * DEPENDÈNCIES: cap.
 * ============================================================================
 */

const nombre = n => (n < 0 ? `−${Math.abs(n)}` : String(n));

/** Un punt escrit: «A (3, −2)» (o «(3, −2)» sense lletra). */
export const textPunt = (x, y, etiqueta = '') => `${etiqueta ? `${etiqueta} ` : ''}(${nombre(x)}, ${nombre(y)})`;

// ── Les icones dels quadrants ────────────────────────────────────────────────

const COLOR = '#0d9488';
const FONS = '#e2e8f0';

/**
 * La icona d'un lloc del pla: dos eixos i el quadrant (o l'eix, o l'origen) en color; els quadrants porten el seu número
 * (1 a dalt a la dreta, 2 a dalt a l'esquerra, 3 a baix a l'esquerra i 4 a baix a la dreta).
 */
export function htmlIcona(lloc, mida = 44) {
    const quadrants = {
        Q1: { x: 22, y: 2, n: '1', nx: 31, ny: 16 },
        Q2: { x: 2, y: 2, n: '2', nx: 13, ny: 16 },
        Q3: { x: 2, y: 22, n: '3', nx: 13, ny: 36 },
        Q4: { x: 22, y: 22, n: '4', nx: 31, ny: 36 },
    };
    let ressalt;
    if (quadrants[lloc]) {
        const q = quadrants[lloc];
        ressalt = `<rect x="${q.x}" y="${q.y}" width="20" height="20" fill="${COLOR}" opacity="0.85"/><text x="${q.nx}" y="${q.ny}" font-size="13" font-weight="800" fill="#fff" text-anchor="middle" font-family="Segoe UI, sans-serif">${q.n}</text>`;
    } else if (lloc === 'eixX') {
        ressalt = `<line x1="2" y1="22" x2="42" y2="22" stroke="${COLOR}" stroke-width="6" stroke-linecap="round"/>`;
    } else if (lloc === 'eixY') {
        ressalt = `<line x1="22" y1="2" x2="22" y2="42" stroke="${COLOR}" stroke-width="6" stroke-linecap="round"/>`;
    } else {
        ressalt = `<circle cx="22" cy="22" r="7" fill="${COLOR}"/>`;
    }
    return `<svg class="icona-lloc" viewBox="0 0 44 44" width="${mida}" height="${mida}" aria-hidden="true"><rect x="2" y="2" width="40" height="40" fill="${FONS}" opacity="0.5"/>${ressalt}<line x1="2" y1="22" x2="42" y2="22" stroke="#334155" stroke-width="1.5"/><line x1="22" y1="2" x2="22" y2="42" stroke="#334155" stroke-width="1.5"/></svg>`;
}

// ── El que es demana ─────────────────────────────────────────────────────────

/**
 * El que es demana a la part de dalt, només amb símbols:
 *   situa: «👆 A (3, −2)» (cal tocar el punt)   coordenades i quadrant: «A» (el punt que es veu)
 *   al-quadrant: la icona del lloc
 */
export function htmlDemana(pregunta) {
    if (pregunta.tipus === 'situa')
        return `<span class="demana-icona" aria-hidden="true">👆</span><span class="demana-text">${textPunt(pregunta.punt.x, pregunta.punt.y, pregunta.etiqueta)}</span>`;
    if (pregunta.tipus === 'al-quadrant') return htmlIcona(pregunta.lloc, 64);
    return `<span class="demana-text">${pregunta.etiqueta}</span>`;
}

/** Les opcions d'una pregunta de quadrant: una icona per lloc, en ordre. */
export function htmlOpcioLloc(lloc) {
    return htmlIcona(lloc, 52);
}

/** Si la pregunta es respon amb les caselles de les coordenades. */
export const ambCaselles = pregunta => pregunta.tipus === 'coordenades' || pregunta.tipus === 'al-quadrant';

/** La pregunta, en text pla, per a la revisió final. */
export function textPregunta(pregunta) {
    if (pregunta.tipus === 'situa') return textPunt(pregunta.punt.x, pregunta.punt.y, pregunta.etiqueta);
    if (pregunta.tipus === 'coordenades') return `${pregunta.etiqueta} = (?, ?)`;
    if (pregunta.tipus === 'quadrant') return `${pregunta.etiqueta} → ${pregunta.lloc}`;
    return `${pregunta.lloc} → (?, ?)`;
}
