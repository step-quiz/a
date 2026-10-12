/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/portada/activitats.js
 * ROL: El CATÀLEG d'activitats: una sola llista per a les dues portades, la de
 *      l'alumnat (alumnat.html: una fitxa amb imatge i nom per activitat) i el
 *      panell del professorat (index.html: el generador d'enllaços).
 *      Una activitat nova s'hi afegeix aquí i surt a les dues. Lògica pura,
 *      sense DOM: es prova des de Node (tests/activitats.test.js; la comprovació
 *      que cada fitxer, nivell i tutorial existeix és a tests/check-repo.js).
 * CAMPS D'UNA ACTIVITAT:
 *   file          la pàgina (a-….html)
 *   grup          el tema de la llista del professorat (GRUPS); les d'un mateix grup van seguides
 *   nom           el nom que veu l'alumne (textos.js); és el títol de la pàgina de l'activitat
 *   etiqueta      el nom que veu el professorat a la llista (més descriptiu)
 *   imatge        la imatge de la fitxa: { id: 'rellotge' } (la imatge d'aquesta paraula del lèxic) o { emoji: '🍎' }
 *   tutorial      la pàgina del tutorial ('' si no n'hi ha cap per oferir; el del rellotge no s'ofereix a propòsit)
 *   fixed         admet sessions fixes (?fixed=A/B/C: tota la classe fa les mateixes preguntes)
 *   nivells       què és cada nivell (?nivell=1…n), per al professorat; [] si l'activitat no en té
 *   nivellDefecte el nivell que es fa sense ?nivell=
 *   tema          admet ?tema= (un tema del lèxic): només «Vocabulari»
 *   Els nivells i el nivell per defecte són els del generador de cada activitat (js/<activitat>/generador.js): la
 *   prova de Node comprova que coincideixen.
 * DEPENDÈNCIES: textos.js.
 * ============================================================================
 */
import { TEXTOS } from './textos.js';

/** Els temes de la llista del professorat, en ordre. */
export const GRUPS = [
    { id: 'paraules', nom: 'Paraules' },
    { id: 'mesura', nom: 'Hora, temperatura i diners' },
    { id: 'nombres', nom: 'Nombres' },
    { id: 'operacions', nom: 'Operacions' },
    { id: 'fraccions', nom: 'Fraccions i proporcionalitat' },
    { id: 'algebra', nom: 'Àlgebra' },
    { id: 'geometria', nom: 'Geometria' },
];

export const ACTIVITATS = [
    {
        file: 'a-vocabulari.html',
        grup: 'paraules',
        nom: TEXTOS.vocabulari,
        etiqueta: 'Vocabulari',
        imatge: { emoji: '🍎' },
        tutorial: '',
        fixed: true,
        nivells: ['imatge → paraula', 'paraula → imatge', 'escriure la paraula'],
        nivellDefecte: 1,
        tema: true,
    },
    {
        file: 'a-rellotge.html',
        grup: 'mesura',
        nom: TEXTOS.rellotge,
        etiqueta: "Rellotge d'agulles",
        imatge: { id: 'rellotge' },
        tutorial: '',
        fixed: true,
        nivells: ["quarts d'hora", 'de 5 en 5 minuts', 'qualsevol minut'],
        nivellDefecte: 1,
    },
    {
        file: 'a-recta-numerica.html',
        grup: 'mesura',
        nom: TEXTOS.temperatura,
        etiqueta: 'Temperatura (gràfica)',
        imatge: { id: 'temperatura' },
        tutorial: '',
        fixed: true,
        nivells: ['lectura directa', 'més recompte', 'el dia més calent o més fred'],
        nivellDefecte: 2,
    },
    {
        file: 'a-decimals.html',
        grup: 'mesura',
        nom: TEXTOS.decimals,
        etiqueta: 'Diners i canvi (decimals)',
        imatge: { id: 'canvi' },
        tutorial: 'a-decimals-tutorial.html',
        fixed: true,
        nivells: ['preu enter i moneda gran', 'preu en passos de 0,10 €', 'dos productes: total i canvi'],
        nivellDefecte: 1,
    },
    {
        file: 'a-enters.html',
        grup: 'nombres',
        nom: TEXTOS.enters,
        etiqueta: 'Nombres enters',
        imatge: { id: 'nombre-enter' },
        tutorial: 'a-enters-tutorial.html',
        fixed: true,
        nivells: ['només sumes', 'sumes i restes'],
        nivellDefecte: 2,
    },
    {
        file: 'a-enters-ordenar.html',
        grup: 'nombres',
        nom: TEXTOS.ordenar,
        etiqueta: 'Ordenar enters',
        imatge: { id: 'recta-numerica' },
        tutorial: '',
        fixed: true,
        nivells: [],
    },
    {
        file: 'a-nombres-lletres.html',
        grup: 'nombres',
        nom: TEXTOS.nombresLletres,
        etiqueta: 'Escriure nombres (0–100)',
        imatge: { emoji: '🔢' },
        tutorial: '',
        fixed: true,
        nivells: ['del 0 al 20', 'del 21 al 69', 'del 70 al 100', 'tots, del 0 al 100'],
        nivellDefecte: 1,
    },
    {
        file: 'a-prioritat.html',
        grup: 'operacions',
        nom: TEXTOS.prioritat,
        etiqueta: "Prioritat d'operacions",
        imatge: { id: 'prioritat' },
        tutorial: '',
        fixed: true,
        nivells: ['sense potències ni parèntesis', 'amb potències', 'amb parèntesis', 'parèntesis i potències'],
        nivellDefecte: 1,
    },
    {
        file: 'a-potencies.html',
        grup: 'operacions',
        nom: TEXTOS.potencies,
        etiqueta: 'Potències',
        imatge: { id: 'potencia' },
        tutorial: '',
        fixed: true,
        nivells: ['producte i quocient', "potència d'una potència", 'base negativa', 'notació científica'],
        nivellDefecte: 1,
    },
    {
        file: 'a-mcd-mcm.html',
        grup: 'operacions',
        nom: TEXTOS.mcdMcm,
        etiqueta: 'MCD i MCM',
        imatge: { id: 'mcd' },
        tutorial: '',
        fixed: true,
        nivells: ['factors 2, 3 i 5, a la vista', 'també el 7', "també l'11"],
        nivellDefecte: 1,
    },
    {
        file: 'a-factoritzar.html',
        grup: 'operacions',
        nom: TEXTOS.factoritzar,
        etiqueta: 'Factoritzar',
        imatge: { id: 'factoritzar' },
        tutorial: '',
        fixed: true,
        nivells: ['factors 2, 3 i 5', 'també el 7', "també l'11"],
        nivellDefecte: 1,
    },
    {
        file: 'a-fraccions.html',
        grup: 'fraccions',
        nom: TEXTOS.fraccions,
        etiqueta: 'Fraccions',
        imatge: { id: 'fraccio' },
        tutorial: '',
        fixed: true,
        nivells: ['mateix denominador', "un és múltiple de l'altre", 'denominadors diferents', 'producte i divisió'],
        nivellDefecte: 1,
    },
    {
        file: 'a-proporciodirecta.html',
        grup: 'fraccions',
        nom: TEXTOS.proporcionalitat,
        etiqueta: 'Proporció directa',
        imatge: { id: 'proporcionalitat-directa' },
        tutorial: 'a-proporciodirecta-tutorial.html',
        fixed: true,
        nivells: ['un sol pas', 'dos passos', 'dos passos, nombres més grans'],
        nivellDefecte: 1,
    },
    {
        file: 'a-equacions.html',
        grup: 'algebra',
        nom: TEXTOS.equacions,
        etiqueta: 'Equacions de 1r grau',
        imatge: { id: 'equacio' },
        tutorial: 'a-equacions-tutorial.html',
        fixed: true,
        nivells: ['a·x = b', 'també x + b = c i x − b = c', 'els mateixos, amb nombres més grans', 'també b + x = c'],
        nivellDefecte: 1,
    },
    {
        file: 'a-area-perimetre.html',
        grup: 'geometria',
        nom: TEXTOS.area,
        etiqueta: 'Àrea i perímetre',
        imatge: { id: 'area' },
        tutorial: '',
        fixed: true,
        nivells: ['figures de 3 i 4 quadrats', 'de 3, 4 i 5 quadrats', 'sobretot de 5 quadrats'],
        nivellDefecte: 1,
    },
    {
        file: 'a-triangle-rectangle.html',
        grup: 'geometria',
        nom: TEXTOS.triangle,
        etiqueta: 'Triangle rectangle',
        imatge: { id: 'triangle-rectangle' },
        tutorial: '',
        fixed: true,
        nivells: ['hipotenusa, amb enters', 'també un catet', 'amb arrels quadrades'],
        nivellDefecte: 1,
    },
    {
        file: 'a-pla-cartesia.html',
        grup: 'geometria',
        nom: TEXTOS.coordenades,
        etiqueta: 'Coordenades',
        imatge: { id: 'pla-cartesia' },
        tutorial: '',
        fixed: true,
        nivells: ['dos quadrants', 'quatre quadrants', "també els eixos i l'origen"],
        nivellDefecte: 1,
    },
];

/** L'activitat que surt triada al panell del professorat. */
export const ACTIVITAT_PER_DEFECTE = 'a-enters.html';

/** L'àlbum de paraules: té fitxa a la portada de l'alumnat, però no és cap activitat de preguntes (ni surt al panell). */
export const ALBUM = { file: 'album.html', nom: TEXTOS.album, imatge: { emoji: '📒' } };

/** L'activitat d'una pàgina (undefined si no n'hi ha cap). */
export const activitatDe = file => ACTIVITATS.find(a => a.file === file);

/** Les fitxes de la portada de l'alumnat, en ordre: les activitats, amb l'àlbum de paraules just després de «Vocabulari». */
export function fitxesAlumne() {
    const fitxes = [...ACTIVITATS];
    fitxes.splice(fitxes.findIndex(a => a.file === 'a-vocabulari.html') + 1, 0, ALBUM);
    return fitxes;
}

/** Les sessions fixes que es poden triar. */
export const SESSIONS_FIXES = ['A', 'B', 'C'];

/**
 * L'enllaç d'una activitat per a la classe: l'adreça `base` (acaba en «/»), la pàgina de l'activitat `a` i els paràmetres.
 * `sessions`, `preguntes` i `intents` hi són sempre; `nivell` (un dels de l'activitat), `tema` (només a les que admeten
 * ?tema=) i `fixed` (una lletra de SESSIONS_FIXES, només a les que admeten sessions fixes) només hi són si es donen i
 * l'activitat els admet: l'enllaç no porta mai un paràmetre que l'activitat no entendria.
 */
export function enllacProfessorat(base, a, { sessions, preguntes, intents, nivell, tema, fixed }) {
    const qs = new URLSearchParams({ totalsessions: sessions, totaloperations: preguntes, maxintents: intents });
    const n = Number(nivell);
    if (Number.isInteger(n) && n >= 1 && n <= a.nivells.length) qs.set('nivell', n);
    if (a.tema && tema) qs.set('tema', tema);
    if (a.fixed && SESSIONS_FIXES.includes(fixed)) qs.set('fixed', fixed);
    // Les comes de ?tema=mat-figures,mat-algebra es queden com a comes (el navegador les llegeix igual i l'enllaç es veu net)
    return `${base}${a.file}?${String(qs).replace(/%2C/gi, ',')}`;
}
