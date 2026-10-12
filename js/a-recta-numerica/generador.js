/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-recta-numerica/generador.js
 * ROL: Lògica PURA de l'activitat «Temperatura» (a-recta-numerica.html), una
 *      recta numèrica doble: la temperatura (ºC) de fins a 8 dies, del −5 al +5
 *      (avui és el 0). Genera el gràfic (el «núvol» de punts) i les preguntes:
 *        Q1: quina temperatura fa avui?
 *        Q2: quina temperatura feia o farà un altre dia?
 *        Q3: quants dies hi ha amb una temperatura donada? (nivells 2 i 3)
 *        Q4: quin dia fa més calor o més fred? (nivell 3)
 *      Adaptada de js/recta-numerica/ d'operacions: sense frases (les opcions són
 *      temperatures, recomptes o dies) i els distractors de Q4 són dies, no frases.
 *      No toca el DOM: es pot provar des de Node (tests/activitats.test.js).
 * DEPENDÈNCIES: utils.js (getIntParam, pick, randInt, shuffle).
 * ============================================================================
 */
import { getIntParam, pick, randInt, shuffle } from '../utils.js';

/** Els dies del gràfic: de −5 a 5 (0 = avui). */
export const X_MIN = -5;
export const X_MAX = 5;

/** Quins tipus de pregunta pot sortir a cada nivell. */
export const TIPUS_PER_NIVELL = { 1: ['Q1', 'Q2'], 2: ['Q1', 'Q2', 'Q3'], 3: ['Q1', 'Q2', 'Q3', 'Q4'] };

/**
 * Llegeix els paràmetres propis de l'activitat:
 *   ?nivell=1|2|3   1 = lectura directa (Q1 i Q2), eix petit; 2 = més Q3 (recompte) (per defecte);
 *                   3 = més Q4 (el dia més calent o més fred), distractors subtils
 */
export function llegeixParametres(params) {
    return { nivell: getIntParam(params, 'nivell', 2, 1, 3) };
}

// ── Les etiquetes (només xifres i tres paraules del lèxic) ──────────────────

/** Una temperatura: «3 ºC», «0 ºC», «−2 ºC» (amb el signe menys tipogràfic). */
export const etiquetaTemp = y => (y < 0 ? `−${Math.abs(y)} ºC` : `${y} ºC`);

/** Un dia: «avui», «ahir», «demà» i, la resta, el nombre amb signe («−3», «+2»). */
export function etiquetaDia(x) {
    if (x === 0) return 'avui';
    if (x === -1) return 'ahir';
    if (x === 1) return 'demà';
    return x < 0 ? `−${Math.abs(x)}` : `+${x}`;
}

// ── El gràfic: rang de l'eix Y i punts ───────────────────────────────────────

/**
 * Tria el rang de l'eix Y: { min, max, majorStep, minorStep }.
 *   nivell 1: sempre −6…6; nivell 2: 80 % −6…6 i 20 % −5…20; nivell 3: 80 % −6…6, 10 % −5…20 i 10 % −10…40.
 */
export function chooseYRange(nivell) {
    const r = Math.random();
    const petit = { min: -6, max: 6, majorStep: 1, minorStep: 1 };
    const mitja = { min: -5, max: 20, majorStep: 5, minorStep: 1 };
    const gran = { min: -10, max: 40, majorStep: 10, minorStep: 5 };
    if (nivell === 1 || r < 0.8) return petit;
    if (nivell === 2 || r < 0.9) return mitja;
    return gran;
}

/**
 * Genera els punts { x, y }: de 4 a 8, amb x entre −5 i 5 sense repetir i sempre el 0, ordenats per x; la temperatura canvia
 * poc d'un dia al següent (amb un o dos salts bruscos de tant en tant) i sempre és un enter dins del marge de l'eix.
 */
export function generateCloud(yRange) {
    const { min, max } = yRange;
    const span = max - min;
    const count = randInt(4, 8);
    const altres = shuffle([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]).slice(0, count - 1);
    const xs = [0, ...altres].sort((a, b) => a - b);

    const rj = Math.random();
    const numSalts = rj < 0.6 ? 0 : rj < 0.9 ? 1 : 2;
    const salts = new Set(shuffle(Array.from({ length: xs.length - 1 }, (_, i) => i)).slice(0, numSalts));
    const suau = Math.max(1, Math.round(span / 8));
    const saltMin = Math.max(2, Math.round(span / 4));
    const saltMax = Math.max(4, Math.round(span / 2));
    const marge = Math.max(1, Math.round(span * 0.15));
    const entre = v => Math.max(min + marge, Math.min(max - marge, v));

    let y = randInt(min + marge, max - marge);
    return xs.map((x, i) => {
        const punt = { x, y };
        if (i < xs.length - 1) {
            const delta = salts.has(i)
                ? randInt(saltMin, saltMax) * (Math.random() < 0.5 ? 1 : -1)
                : randInt(-suau, suau);
            y = entre(y + delta);
        }
        return punt;
    });
}

// ── Els distractors ──────────────────────────────────────────────────────────

/** Treu els repetits d'una llista i el valor correcte. */
function senseRepetits(valors, exclos) {
    const vistos = new Set([exclos]);
    return valors.filter(v => !vistos.has(v) && vistos.add(v));
}

/**
 * Tres temperatures INCORRECTES per a Q1/Q2, diferents entre si, dins de l'eix:
 *   nivell 1: valors propers al correcte; nivell 2: temperatures d'altres dies;
 *   nivell 3: les dels dies del costat (confondre el dia).
 */
export function buildDirectRead(correctY, cloud, yRange, questionX, nivell) {
    const { min, max, minorStep: pas } = yRange;
    const candidats = [];
    if (nivell === 3) {
        const costats = [questionX - 1, questionX + 1, questionX - 2, questionX + 2].filter(
            x => x >= X_MIN && x <= X_MAX
        );
        for (const x of shuffle(costats)) {
            const p = cloud.find(q => q.x === x);
            if (p) candidats.push(p.y);
        }
    }
    if (nivell >= 2) for (const p of shuffle(cloud.filter(q => q.x !== questionX))) candidats.push(p.y);
    for (let d = pas; candidats.length < 8 && d <= 20 * pas; d += pas) {
        if (correctY + d <= max) candidats.push(correctY + d);
        if (correctY - d >= min) candidats.push(correctY - d);
    }
    const diferents = () => senseRepetits(candidats, correctY).filter(v => v >= min && v <= max);
    for (let d = pas; diferents().length < 3 && d <= 20 * pas; d += pas) {
        if (correctY + d <= max) candidats.push(correctY + d);
        if (correctY - d >= min) candidats.push(correctY - d);
    }
    return shuffle(diferents()).slice(0, 3);
}

/** Quatre recomptes, un de correcte: sempre el 0, l'1, el 2 i el 3 (i el correcte si passa de 3). */
export function buildCountOptions(correctCount) {
    const base = [0, 1, 2, 3];
    const pool = base.includes(correctCount) ? base : [...base, correctCount];
    const altres = shuffle(pool.filter(c => c !== correctCount)).slice(0, 3);
    return [correctCount, ...altres]
        .map(c => ({ valor: c, correcta: c === correctCount }))
        .sort((a, b) => a.valor - b.valor);
}

// ── Les preguntes ────────────────────────────────────────────────────────────

const opcions = (valors, correcte) => valors.map(valor => ({ valor, correcta: valor === correcte }));

function generaLectura(tipus, cloud, yRange, nivell) {
    const punt = tipus === 'Q1' ? cloud.find(p => p.x === 0) : pick(cloud.filter(p => p.x !== 0));
    const mal = buildDirectRead(punt.y, cloud, yRange, punt.x, nivell);
    const ys = [punt.y, ...mal].sort((a, b) => b - a); // de més alta a més baixa
    return { tipus, x: punt.x, y: punt.y, opcions: opcions(ys, punt.y), disposicio: 'grid' };
}

function generaRecompte(cloud, yRange) {
    const ys = cloud.map(p => p.y);
    const marge = Math.max(1, Math.round((yRange.max - yRange.min) * 0.15));
    let y;
    if (Math.random() < 0.5)
        y = pick(ys); // una temperatura que hi és
    else {
        // una de propera que no hi és
        const absents = [];
        for (let v = yRange.min + marge; v <= yRange.max - marge; v++) if (!ys.includes(v)) absents.push(v);
        const distancia = v => Math.min(...ys.map(q => Math.abs(q - v)));
        absents.sort((a, b) => distancia(a) - distancia(b));
        y = absents.length ? pick(absents.slice(0, 5)) : pick(ys);
    }
    const recompte = ys.filter(v => v === y).length;
    return { tipus: 'Q3', y, recompte, opcions: buildCountOptions(recompte), disposicio: 'grid' };
}

/** Q4: el dia més calent o més fred; només si aquest dia és únic. Torna null si no ho és (ni el màxim ni el mínim). */
function generaExtrem(cloud) {
    const ys = cloud.map(p => p.y);
    const max = Math.max(...ys);
    const min = Math.min(...ys);
    const possibles = [];
    if (ys.filter(v => v === max).length === 1) possibles.push('calent');
    if (ys.filter(v => v === min).length === 1) possibles.push('fred');
    if (!possibles.length) return null;
    const extrem = pick(possibles);
    const correcte = cloud.find(p => p.y === (extrem === 'calent' ? max : min)).x;
    const altres = shuffle(cloud.filter(p => p.x !== correcte))
        .slice(0, 3)
        .map(p => p.x);
    const xs = [correcte, ...altres].sort((a, b) => a - b);
    return { tipus: 'Q4', extrem, x: correcte, opcions: opcions(xs, correcte), disposicio: 'grid' };
}

/**
 * Una pregunta del nivell sobre el gràfic:
 *   { tipus, opcions: [{ valor, correcta }], disposicio, … } amb x/y (Q1, Q2), y i recompte (Q3) o extrem i x (Q4).
 * Les opcions valen: temperatures (Q1, Q2), recomptes (Q3) o dies (Q4).
 */
export function generaPregunta(cloud, yRange, nivell) {
    const tipus = pick(TIPUS_PER_NIVELL[nivell]);
    if (tipus === 'Q3') return generaRecompte(cloud, yRange);
    if (tipus === 'Q4') return generaExtrem(cloud) ?? generaLectura('Q1', cloud, yRange, nivell);
    return generaLectura(tipus, cloud, yRange, nivell);
}

/**
 * Quina de les instruccions toca a una pregunta (el text és a textos.js): la temperatura d'avui, d'ahir, de demà,
 * d'abans-d'ahir (fa 2 dies), de demà-passat (d'aquí 2 dies), d'un dia passat (fa 3 dies o més) o d'un de futur (d'aquí 3 dies
 * o més) —el verb canvia: fa / feia / farà—, el recompte de dies o el dia més calent o més fred.
 */
export function formaInstruccio(pregunta) {
    if (pregunta.tipus === 'Q3') return 'recompte';
    if (pregunta.tipus === 'Q4') return pregunta.extrem === 'calent' ? 'calent' : 'fred';
    if (pregunta.x === 0) return 'avui';
    if (pregunta.x === -1) return 'ahir';
    if (pregunta.x === 1) return 'dema';
    if (pregunta.x === -2) return 'abansdahir';
    if (pregunta.x === 2) return 'demapassat';
    return pregunta.x < 0 ? 'passat' : 'futur';
}

/** El text d'una opció d'una pregunta: «3 ºC», «2» (dies) o «ahir» / «+3». */
export function textOpcio(pregunta, opcio) {
    if (pregunta.tipus === 'Q3') return String(opcio.valor);
    if (pregunta.tipus === 'Q4') return etiquetaDia(opcio.valor);
    return etiquetaTemp(opcio.valor);
}

/** La pregunta, en símbols, per a la revisió final: «avui → ? ºC», «3 ºC → ? dies», «? → 🥵». */
export function textPregunta(pregunta) {
    if (pregunta.tipus === 'Q3') return `${etiquetaTemp(pregunta.y)} → ?`;
    if (pregunta.tipus === 'Q4') return `? → ${pregunta.extrem === 'calent' ? '🥵' : '🥶'}`;
    return `${etiquetaDia(pregunta.x)} → ? ºC`;
}

/** Els textos que l'activitat posa a la pantalla a partir del lèxic: les tres paraules dels dies. */
export function exemplesDeText() {
    return ['avui', 'ahir', 'demà'];
}
