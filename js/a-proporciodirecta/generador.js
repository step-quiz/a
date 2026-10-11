/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/a-proporciodirecta/generador.js
 * ROL: Lògica PURA de l'activitat «Proporcionalitat» (a-proporciodirecta.html):
 *      paràmetres de la URL i generació dels problemes, sempre per REDUCCIÓ A LA
 *      UNITAT (mai regla de tres). Tot són enters i la divisió és sempre exacta.
 *      No toca el DOM: es pot provar des de Node (tests/activitats.test.js).
 *      Els productes són els de «Diners i canvi» (js/a-decimals/productes.js):
 *      aquí només en cal l'id del lèxic, que en porta la imatge i el nom.
 * DEPENDÈNCIES: utils.js (getIntParam, pick, randInt), a-decimals/productes.js i el lèxic (només per a exemplesDeText).
 * ============================================================================
 */
import { textParaula } from '../lexicon/paraula.js';
import { PRODUCTES } from '../a-decimals/productes.js';
import { getIntParam, pick, randInt } from '../utils.js';

/**
 * Llegeix els paràmetres propis de l'activitat:
 *   ?nivell=1|2|3   1 = un sol pas, la quantitat demanada és múltiple de la donada (o al revés) (per defecte)
 *                   2 = dos passos (preu d'un i després el de la quantitat demanada), nombres petits
 *                   3 = com el 2, amb nombres més grans
 */
export function llegeixParametres(params) {
    return { nivell: getIntParam(params, 'nivell', 1, 1, 3) };
}

/**
 * Genera un problema:
 *   { producte, qtyDada, preuDada, qtyDemanada, passos: [{ qty, a, op, b, resposta }] }
 * «Dada»: `qtyDada` productes costen `preuDada` €. Cada pas demana el preu de `qty` productes i diu com es calcula:
 * `a op b` (op és '×' o '÷') = `resposta`. Al nivell 1 hi ha un sol pas (4 casos: 1→N, N→1, N→kN i kN→N); als
 * nivells 2 i 3, dos: el preu d'un producte (preuDada ÷ qtyDada) i el de la quantitat demanada (× qtyDemanada).
 */
export function generaProblema({ nivell }) {
    const producte = pick(PRODUCTES).id;
    const problema = (qtyDada, preuDada, qtyDemanada, passos) => ({ producte, qtyDada, preuDada, qtyDemanada, passos });
    const pas = (qty, a, op, b, resposta) => ({ qty, a, op, b, resposta });

    if (nivell === 1) {
        const cas = pick(['1toN', 'Nto1', 'NtokN', 'kNtoN']);
        const preuUnitat = randInt(1, 4);
        if (cas === '1toN') {
            const qtyDemanada = randInt(2, 5);
            return problema(1, preuUnitat, qtyDemanada, [
                pas(qtyDemanada, preuUnitat, '×', qtyDemanada, preuUnitat * qtyDemanada),
            ]);
        }
        if (cas === 'Nto1') {
            const qtyDada = randInt(2, 5);
            return problema(qtyDada, preuUnitat * qtyDada, 1, [pas(1, preuUnitat * qtyDada, '÷', qtyDada, preuUnitat)]);
        }
        const multiplicador = randInt(2, 3);
        if (cas === 'NtokN') {
            const qtyDada = randInt(2, 3);
            const qtyDemanada = qtyDada * multiplicador;
            const preuDada = preuUnitat * qtyDada;
            return problema(qtyDada, preuDada, qtyDemanada, [
                pas(qtyDemanada, preuDada, '×', multiplicador, preuUnitat * qtyDemanada),
            ]);
        }
        const qtyDemanada = randInt(2, 3);
        const qtyDada = qtyDemanada * multiplicador;
        const preuDada = preuUnitat * qtyDada;
        return problema(qtyDada, preuDada, qtyDemanada, [
            pas(qtyDemanada, preuDada, '÷', multiplicador, preuUnitat * qtyDemanada),
        ]);
    }

    // Nivells 2 i 3: reducció a la unitat obligada; la quantitat demanada no és múltiple de la donada ni al revés
    const petit = nivell === 2;
    const preuUnitat = petit ? randInt(1, 4) : randInt(2, 6);
    const qtyDada = petit ? randInt(2, 5) : randInt(2, 8);
    let qtyDemanada;
    do {
        qtyDemanada = petit ? randInt(2, 5) : randInt(2, 8);
    } while (qtyDemanada === qtyDada || qtyDemanada % qtyDada === 0 || qtyDada % qtyDemanada === 0);
    const preuDada = preuUnitat * qtyDada;
    return problema(qtyDada, preuDada, qtyDemanada, [
        pas(1, preuDada, '÷', qtyDada, preuUnitat),
        pas(qtyDemanada, preuUnitat, '×', qtyDemanada, preuUnitat * qtyDemanada),
    ]);
}

/** Els textos que l'activitat posa a la pantalla a partir del lèxic (el nom de cada producte, en singular i en plural). */
export function exemplesDeText() {
    return PRODUCTES.flatMap(p => [
        textParaula(p.id, { article: false }),
        textParaula(p.id, { plural: true, article: false }),
    ]);
}
