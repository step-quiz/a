/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/lexicon/relacions.js
 * ROL: Quan la imatge d'una paraula del banc TAMBÉ és un exemple d'una altra
 *      paraula, aquesta altra no pot sortir com a distractor (seria una opció
 *      també correcta): a la imatge d'un triangle rectangle, «el polígon», «el
 *      triangle» i «el triangle escalè» també hi són certs. Aquest fitxer ho diu.
 *      Només dades i funcions petites, sense DOM: es prova des de Node.
 *
 * Hi ha dues taules:
 *   · PARE: la jerarquia («és un»): un triangle rectangle ÉS un triangle, que ÉS un polígon, que ÉS una figura.
 *     És transitiva: si una imatge és d'una paraula, també és de totes les seves paraules pare.
 *   · TAMBE: fets de la IMATGE concreta (no transitius): «la imatge de la hipotenusa és un triangle rectangle»
 *     (tota la figura hi surt); «la imatge del dividend és una divisió» (la part destacada és un tros de la divisió
 *     sencera); «el 5 de la imatge del nombre positiu també és natural, enter, senar i primer». Si una imatge
 *     és de B (TAMBE) i B és de C (PARE), també és de C.
 *
 * Criteri: en cas de dubte, es posa. Una relació de més només treu una opció possible de les que es poden triar de
 * distractor (n'hi ha moltes); una relació que falta fa que l'alumne trobi dues respostes correctes.
 *
 * L'ús: a «Vocabulari» (js/a-vocabulari/generador.js). Nivell 1 (imatge → paraula): cap opció equivocada pot ser
 * tambeEs(la paraula). Nivell 2 (paraula → imatge): cap imatge equivocada pot ser d'una paraula que tingui la
 * preguntada a tambeEs. Nivell 3 (escriure): si l'alumne escriu una paraula de tambeEs, és certa però no la que es
 * busca: es diu «✔ 🔍» (més concreta) i no costa cap intent.
 * ============================================================================
 */

/** La jerarquia: id → el seu pare («és un»). */
export const PARE = {
    // Figures
    'poligon': 'figura',
    'triangle': 'poligon',
    'triangle-equilater': 'triangle',
    'triangle-isosceles': 'triangle',
    'triangle-escale': 'triangle',
    'triangle-rectangle': 'triangle',
    'parallelogram': 'poligon',
    'rectangle-figura': 'parallelogram',
    'rombe': 'parallelogram',
    'quadrat': 'rectangle-figura',
    'trapezi': 'poligon',
    'pentagon': 'poligon',
    'hexagon': 'poligon',
    'circumferencia': 'figura',
    // Cossos
    'prisma': 'figura',
    'cub': 'prisma',
    'piramide': 'figura',
    'cilindre': 'figura',
    'con': 'figura',
    'esfera': 'figura',
    // Angles i rectes
    'angle-recte': 'angle',
    'angle-agut': 'angle',
    'angle-obtus': 'angle',
    'recta-paral-lela': 'recta',
    'recta-perpendicular': 'recta',
    // Nombres
    'nombre-natural': 'nombre-enter',
    'nombre-primer': 'nombre-natural',
    // Àlgebra
    'monomi': 'polinomi',
    'polinomi': 'expressio-algebraica',
    'equacio': 'igualtat',
};

/** Fets de cada imatge: id → les altres paraules de les quals la seva imatge també és un exemple. */
export const TAMBE = {
    // ── Els nombres (un nombre sol és de moltes classes alhora)
    'zero': ['nombre-natural', 'nombre-parell', 'xifra'],
    'nombre-natural': ['nombre-positiu'],
    'nombre-positiu': ['nombre-natural', 'nombre-senar', 'nombre-primer'],
    'nombre-negatiu': ['nombre-enter', 'nombre-senar'],
    'nombre-decimal': ['nombre-positiu'],
    'nombre-parell': ['nombre-natural', 'nombre-positiu'],
    'nombre-senar': ['nombre-natural', 'nombre-positiu'],
    'nombre-primer': ['nombre-positiu'],
    'multiple': ['nombre-natural', 'nombre-positiu'],
    'xifra': ['nombre-natural', 'nombre-positiu'],
    'valor-absolut': ['nombre-positiu', 'nombre-negatiu', 'nombre-enter', 'nombre-oposat', 'igualtat'],
    'nombre-oposat': ['nombre-positiu', 'nombre-negatiu', 'nombre-enter', 'signe', 'valor-absolut'],
    'recta-numerica': ['nombre-enter', 'recta', 'eix'],
    // ── Les operacions (una operació sencera hi surt sempre, i tot el que té un «=» és una igualtat)
    'resultat': ['suma', 'igualtat'],
    'prioritat': ['suma', 'multiplicacio'],
    'arrel-quadrada': ['igualtat'],
    'parentesi': ['multiplicacio', 'suma', 'prioritat'],
    'sumand': ['suma', 'igualtat'],
    'factor': ['multiplicacio', 'igualtat'],
    'producte': ['multiplicacio', 'igualtat', 'resultat'],
    'dividend': ['divisio', 'igualtat'],
    'divisor': ['divisio', 'igualtat'],
    'quocient': ['divisio', 'igualtat', 'resultat'],
    'residu': ['divisio', 'igualtat', 'multiplicacio', 'suma'],
    'base': ['potencia'],
    'exponent': ['potencia'],
    'propietat-commutativa': ['igualtat', 'suma'],
    'propietat-associativa': ['igualtat', 'suma', 'parentesi'],
    'propietat-distributiva': ['igualtat', 'multiplicacio', 'suma', 'parentesi'],
    // ── Fraccions i proporcionalitat
    'fraccio': ['circumferencia', 'diagrama-de-sectors'],
    'numerador': ['fraccio'],
    'denominador': ['fraccio'],
    'fraccio-equivalent': ['fraccio', 'igualtat', 'fraccio-irreductible', 'simplificar-fraccio'],
    'fraccio-irreductible': ['fraccio', 'fraccio-equivalent', 'simplificar-fraccio'],
    'simplificar-fraccio': ['fraccio', 'fraccio-equivalent', 'fraccio-irreductible'],
    'mcd': ['igualtat'],
    'mcm': ['igualtat'],
    'percentatge': ['igualtat', 'fraccio'],
    'proporcio': ['igualtat', 'rao'],
    'constant-proporcionalitat': ['proporcionalitat-directa'],
    'regla-de-tres': ['proporcionalitat-directa', 'proporcio'],
    'proporcionalitat-directa': ['grafica', 'funcio', 'pla-cartesia', 'eix'],
    // ── Àlgebra
    'variable': ['incognita'],
    'incognita': ['variable'],
    'coeficient': ['monomi', 'terme'],
    'terme': ['polinomi'],
    'monomi': ['terme'],
    'igualtat': ['suma', 'resultat'],
    'membre': ['equacio', 'expressio-algebraica'],
    'solucio': ['equacio'],
    'resoldre-equacio': ['equacio', 'solucio'],
    'sistema-equacions': ['equacio'],
    'factoritzar': ['igualtat', 'multiplicacio', 'potencia'],
    // ── Punts, rectes i angles
    'angle': ['angle-agut'],
    'angle-recte': ['recta-perpendicular'],
    'recta-perpendicular': ['angle-recte'],
    // ── Figures i les seves parts (la figura sencera hi surt: la part destacada no la fa deixar de ser un exemple)
    'figura': ['circumferencia', 'triangle', 'quadrat'],
    'canvi': ['circumferencia'],
    'triangle': ['triangle-escale'],
    'triangle-equilater': ['triangle-isosceles'],
    'triangle-rectangle': ['triangle-escale'],
    'quadrat': ['rombe'],
    'vertex': ['triangle-escale'],
    'costat': ['trapezi'],
    'diagonal': ['rectangle-figura'],
    'altura': ['triangle-escale'],
    'radi': ['circumferencia'],
    'diametre': ['circumferencia'],
    'hipotenusa': ['triangle-rectangle', 'triangle-escale'],
    'catet': ['triangle-rectangle', 'triangle-escale'],
    'perimetre': ['rectangle-figura'],
    'area': ['rectangle-figura'],
    'simetria': ['triangle'],
    'volum': ['cub'],
    // ── Mesura
    'longitud': ['regle'],
    'regle': ['longitud'],
    'metre': ['longitud'],
    'centimetre': ['longitud'],
    'quilometre': ['longitud'],
    'gram': ['massa'],
    'quilogram': ['massa'],
    'litre': ['capacitat'],
    'segon': ['temps'],
    'rellotge': ['temps'],
    'grau': ['angle', 'angle-recte'],
    // ── Funcions i gràfiques
    'eix': ['recta', 'semirecta', 'recta-numerica'],
    'origen': ['pla-cartesia', 'coordenada', 'eix'],
    'abscissa': ['coordenada'],
    'ordenada': ['coordenada'],
    'quadrant': ['pla-cartesia', 'eix'],
    'pla-cartesia': ['eix'],
    'funcio': ['equacio'],
    'grafica': ['funcio', 'pla-cartesia', 'eix', 'grafic-de-barres'],
    'pendent': ['grafica', 'funcio', 'pla-cartesia', 'eix'],
    // ── Estadística i probabilitat
    'dada': ['nombre-natural', 'nombre-positiu', 'nombre-parell', 'xifra'],
    'frequencia': ['moda'],
    'moda': ['frequencia'],
    'mitjana': ['divisio', 'suma', 'igualtat', 'parentesi'],
    'rang': ['resta', 'igualtat', 'resultat'],
    'grafic-de-barres': ['grafica'],
    'diagrama-de-sectors': ['circumferencia', 'fraccio'],
    'probabilitat': ['fraccio', 'igualtat'],
    // ── Objectes
    'pluja': ['nuvol', 'aigua'],
    'mar': ['aigua'],
    'finestra': ['quadrat'],
    'dau': ['cub'],
};

/** Totes les paraules pare d'una (el pare, el pare del pare…). */
function ancestres(id) {
    const r = [];
    for (let p = PARE[id]; p && !r.includes(p); p = PARE[p]) r.push(p);
    return r;
}

/**
 * Les paraules de les quals la imatge d'`id` també és un exemple (sense `id`): els seus pares, els fets de la imatge
 * (TAMBE) i els pares d'aquests. Torna un Set.
 */
export function tambeEs(id) {
    const base = [...ancestres(id), ...(TAMBE[id] ?? [])];
    const r = new Set(base.flatMap(b => [b, ...ancestres(b)]));
    r.delete(id);
    return r;
}

/** Si dues paraules no poden sortir juntes en una pregunta d'imatge → paraula (nivell 1): `altra` també és certa per a la imatge d'`id`. */
export const esTambeCerta = (id, altra) => tambeEs(id).has(altra);

/**
 * Els temes que es poden confondre entre ells: les opcions equivocades d'una paraula es trien, primer, del seu tema;
 * després, dels temes de la seva família (no sigui que a «el polígon» li tocàs, de distractor, una poma, ni a «el pis» un
 * «quocient»); i, només si encara en falten, de qualsevol altre. Un tema que no és a cap família no té veïns.
 */
export const FAMILIES_DE_TEMES = [
    ['mat-linies', 'mat-figures', 'mat-elements', 'mat-cossos'],
    ['mat-nombres', 'mat-operacions', 'mat-fraccions'],
    ['mat-algebra', 'mat-funcions'],
    ['mat-mesura', 'mat-estadistica'],
    ['botiga', 'menjar', 'escola', 'casa', 'edifici', 'hora'],
    ['animals', 'natura', 'transport'],
];

/** Els temes de la mateixa família que `tema` (sense ell). */
export const temesVeins = tema => (FAMILIES_DE_TEMES.find(f => f.includes(tema)) ?? []).filter(t => t !== tema);
