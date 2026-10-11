/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-area-perimetre/generador.js
 * ROL: La lògica pura de «Àrea i perímetre» (sense DOM): els paràmetres de la
 *      URL, la biblioteca de figures (triominós, tetrominós i pentominós, de
 *      quadrats d'1 cm), les variants (girades i emmirallades), l'àrea, el
 *      perímetre, el contorn ordenat (per a l'ajuda) i la comprovació de la
 *      resposta. Es prova des de Node (tests/activitats.test.js).
 * DEPENDÈNCIES: js/utils.js.
 * ============================================================================
 */
import { getIntParam, randInt } from '../utils.js';

export const NIVELL_MAXIM = 3;

/**
 * Llegeix els paràmetres propis de l'activitat:
 *   ?nivell=1|2|3   1 = figures de 3 i 4 quadrats (per defecte); 2 = de 3, 4 i 5 (sobretot 4 i 5); 3 = sobretot de 5
 */
export function llegeixParametres(params) {
    return { nivell: getIntParam(params, 'nivell', 1, 1, NIVELL_MAXIM) };
}

// ── La biblioteca de figures ─────────────────────────────────────────────────

/** Cada figura: nom, tipus i quadrats [fila, columna]; `nomesHoritzontal` = no es gira (una barra). */
export const FIGURES = [
    {
        nom: 'I3',
        tipus: 'tromino',
        cells: [
            [0, 0],
            [0, 1],
            [0, 2],
        ],
        nomesHoritzontal: true,
    },
    {
        nom: 'L3',
        tipus: 'tromino',
        cells: [
            [0, 0],
            [1, 0],
            [1, 1],
        ],
    },
    {
        nom: 'I4',
        tipus: 'tetromino',
        cells: [
            [0, 0],
            [0, 1],
            [0, 2],
            [0, 3],
        ],
        nomesHoritzontal: true,
    },
    {
        nom: 'O4',
        tipus: 'tetromino',
        cells: [
            [0, 0],
            [0, 1],
            [1, 0],
            [1, 1],
        ],
    },
    {
        nom: 'T4',
        tipus: 'tetromino',
        cells: [
            [0, 0],
            [0, 1],
            [0, 2],
            [1, 1],
        ],
    },
    {
        nom: 'S4',
        tipus: 'tetromino',
        cells: [
            [0, 1],
            [0, 2],
            [1, 0],
            [1, 1],
        ],
    },
    {
        nom: 'L4',
        tipus: 'tetromino',
        cells: [
            [0, 0],
            [1, 0],
            [2, 0],
            [2, 1],
        ],
    },
    {
        nom: 'F',
        tipus: 'pentomino',
        cells: [
            [0, 1],
            [0, 2],
            [1, 0],
            [1, 1],
            [2, 1],
        ],
    },
    {
        nom: 'I',
        tipus: 'pentomino',
        cells: [
            [0, 0],
            [0, 1],
            [0, 2],
            [0, 3],
            [0, 4],
        ],
        nomesHoritzontal: true,
    },
    {
        nom: 'L',
        tipus: 'pentomino',
        cells: [
            [0, 0],
            [1, 0],
            [2, 0],
            [3, 0],
            [3, 1],
        ],
    },
    {
        nom: 'N',
        tipus: 'pentomino',
        cells: [
            [0, 1],
            [1, 0],
            [1, 1],
            [2, 0],
            [3, 0],
        ],
    },
    {
        nom: 'P',
        tipus: 'pentomino',
        cells: [
            [0, 0],
            [0, 1],
            [1, 0],
            [1, 1],
            [2, 0],
        ],
    },
    {
        nom: 'T',
        tipus: 'pentomino',
        cells: [
            [0, 0],
            [0, 1],
            [0, 2],
            [1, 1],
            [2, 1],
        ],
    },
    {
        nom: 'U',
        tipus: 'pentomino',
        cells: [
            [0, 0],
            [0, 2],
            [1, 0],
            [1, 1],
            [1, 2],
        ],
    },
    {
        nom: 'V',
        tipus: 'pentomino',
        cells: [
            [0, 0],
            [1, 0],
            [2, 0],
            [2, 1],
            [2, 2],
        ],
    },
    {
        nom: 'W',
        tipus: 'pentomino',
        cells: [
            [0, 0],
            [1, 0],
            [1, 1],
            [2, 1],
            [2, 2],
        ],
    },
    {
        nom: 'X',
        tipus: 'pentomino',
        cells: [
            [0, 1],
            [1, 0],
            [1, 1],
            [1, 2],
            [2, 1],
        ],
    },
    {
        nom: 'Y',
        tipus: 'pentomino',
        cells: [
            [0, 1],
            [1, 0],
            [1, 1],
            [2, 1],
            [3, 1],
        ],
    },
    {
        nom: 'Z',
        tipus: 'pentomino',
        cells: [
            [0, 0],
            [0, 1],
            [1, 1],
            [2, 1],
            [2, 2],
        ],
    },
];

// ── Geometria ────────────────────────────────────────────────────────────────

/** Mou els quadrats perquè la fila i la columna mínimes siguin 0. */
export function normalitza(cells) {
    const minR = Math.min(...cells.map(([r]) => r));
    const minC = Math.min(...cells.map(([, c]) => c));
    return cells.map(([r, c]) => [r - minR, c - minC]);
}

export function gira(cells) {
    const maxR = Math.max(...cells.map(([r]) => r));
    return normalitza(cells.map(([r, c]) => [c, maxR - r]));
}

export function emmiralla(cells) {
    const maxC = Math.max(...cells.map(([, c]) => c));
    return cells.map(([r, c]) => [r, maxC - c]);
}

const clau = (r, c) => `${r},${c}`;
const COSTATS = [
    [-1, 0, 'T'],
    [1, 0, 'B'],
    [0, -1, 'L'],
    [0, 1, 'R'],
];

/** Els costats d'un quadrat que donen a l'exterior: de 'T' (dalt), 'B' (baix), 'L' (esquerra) i 'R' (dreta). */
export function costatsExteriors(cells) {
    const set = new Set(cells.map(([r, c]) => clau(r, c)));
    const vores = [];
    for (const [r, c] of cells)
        for (const [dr, dc, costat] of COSTATS) if (!set.has(clau(r + dr, c + dc))) vores.push({ r, c, costat });
    return vores;
}

/** El perímetre, en costats de quadrat: el nombre de costats que donen a l'exterior. */
export const perimetre = cells => costatsExteriors(cells).length;

/**
 * El contorn de la figura, com a segments d'1 cm ordenats donant la volta en el sentit de les agulles del rellotge:
 * [{ x1, y1, x2, y2 }] en coordenades de la quadrícula (x = columna, y = fila). Funciona per a figures sense forats
 * (els tromins, tetrominós i pentominós ho són).
 */
export function contorn(cells) {
    const segment = ({ r, c, costat }) =>
        ({
            T: { x1: c, y1: r, x2: c + 1, y2: r },
            R: { x1: c + 1, y1: r, x2: c + 1, y2: r + 1 },
            B: { x1: c + 1, y1: r + 1, x2: c, y2: r + 1 },
            L: { x1: c, y1: r + 1, x2: c, y2: r },
        })[costat];
    const segments = costatsExteriors(cells).map(segment);
    const perInici = new Map(segments.map(s => [`${s.x1},${s.y1}`, s]));
    const ordenats = [segments[0]];
    while (ordenats.length < segments.length) {
        const ultim = ordenats[ordenats.length - 1];
        ordenats.push(perInici.get(`${ultim.x2},${ultim.y2}`));
    }
    return ordenats;
}

/** Una variant d'una figura (girada de 0 a 3 cops i, de vegades, emmirallada): { nom, tipus, cells, area, perimetre }. */
export function variant(figura) {
    let cells = figura.cells.map(c => [...c]);
    if (!figura.nomesHoritzontal) {
        for (let i = randInt(0, 3); i > 0; i--) cells = gira(cells);
        if (Math.random() < 0.5) cells = emmiralla(cells);
    }
    cells = normalitza(cells);
    return { nom: figura.nom, tipus: figura.tipus, cells, area: cells.length, perimetre: perimetre(cells) };
}

// ── L'elecció de figures ─────────────────────────────────────────────────────

/** La probabilitat de cada tipus de figura a cada nivell. */
export const PROBABILITATS = {
    1: { tromino: 0.4, tetromino: 0.6, pentomino: 0 },
    2: { tromino: 0.1, tetromino: 0.5, pentomino: 0.4 },
    3: { tromino: 0, tetromino: 0.2, pentomino: 0.8 },
};

/**
 * El generador d'un nivell: { reinicia(), genera() }. Dins d'una sessió no es repeteix cap figura mentre n'hi hagi de noves
 * del tipus triat; el tipus de l'última figura es repeteix amb més probabilitat (80 %) fins a dues vegades seguides.
 * `reinicia()` s'ha de cridar a l'inici de cada sessió.
 */
export function crearGenerador(nivell) {
    const base = PROBABILITATS[nivell];
    const tipus = Object.keys(base).filter(t => base[t] > 0);
    let usades = new Set();
    let ultimTipus = null;
    let seguits = 0;

    const disponibles = t => FIGURES.filter(f => f.tipus === t && !usades.has(f.nom));

    function probabilitats() {
        const p = {};
        for (const t of tipus) p[t] = disponibles(t).length > 0 ? base[t] : 0;
        if (ultimTipus && p[ultimTipus] > 0) p[ultimTipus] = seguits >= 2 ? 0.1 : 0.8;
        const total = Object.values(p).reduce((a, b) => a + b, 0);
        if (total <= 0) {
            usades = new Set();
            return { ...base };
        }
        for (const t of tipus) p[t] /= total;
        return p;
    }

    function triaTipus(p) {
        const r = Math.random();
        let acumulat = 0;
        for (const [t, prob] of Object.entries(p)) {
            acumulat += prob;
            if (r < acumulat) return t;
        }
        return Object.keys(p).find(t => p[t] > 0);
    }

    return {
        reinicia() {
            usades = new Set();
            ultimTipus = null;
            seguits = 0;
        },
        genera() {
            const t = triaTipus(probabilitats());
            const pool = disponibles(t).length ? disponibles(t) : FIGURES.filter(f => f.tipus === t);
            const figura = pool[randInt(0, pool.length - 1)];
            usades.add(figura.nom);
            if (t === ultimTipus) seguits++;
            else {
                ultimTipus = t;
                seguits = 1;
            }
            return variant(figura);
        },
    };
}

// ── La resposta de l'alumne ──────────────────────────────────────────────────

/**
 * Comprova la resposta: { areaOk, perimOk, canviats }. `canviats` és que ha escrit l'àrea al lloc del perímetre i al revés
 * (les dues són equivocades però entre elles són les bones).
 */
export function comprovaResposta(figura, area, perim) {
    const areaOk = area === figura.area;
    const perimOk = perim === figura.perimetre;
    return { areaOk, perimOk, canviats: !areaOk && !perimOk && area === figura.perimetre && perim === figura.area };
}

/** Els textos que l'activitat posa a la figura i a les unitats: han de ser al lèxic. */
export function exemplesDeText() {
    return ['1 cm', 'cm²', 'cm'];
}
