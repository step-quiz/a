/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/album/album.js
 * ROL: «Àlbum de paraules» (album.html): totes les paraules amb imatge del
 *      lèxic, per temes. Les que l'alumne ja ha vist (n'ha obert la targeta
 *      «Aprèn la paraula») surten amb la paraula; les altres, amb «?» fins que
 *      les toca. Mostra el progrés («12 / 65») i enllaços per practicar a
 *      «Vocabulari» (les vistes, o un tema). Només es guarda al dispositiu de
 *      l'alumne (localStorage): no s'envia res enlloc.
 *      No és una activitat de preguntes: no fa servir el motor (game-core.js),
 *      només la targeta de la paraula.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa logica.js, vista.js,
 *      textos.js, targeta-paraula.js, lexicon/targeta.js i textos del motor.
 * ============================================================================
 */
import { initTargetaParaula } from '../targeta-paraula.js';
import { crearVistes } from '../lexicon/targeta.js';
import { agrupaPerTemes, enllacPractica, resum } from './logica.js';
import { TEXTOS } from './textos.js';
import { htmlGrup, htmlProgres, textCarta } from './vista.js';

const $ = id => document.getElementById(id);

function emmagatzematge() {
    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

/** Les paraules vistes: les desades i les que es toquin en aquesta pàgina (encara que no es pugui desar res). */
const vistes = new Set(crearVistes(emmagatzematge()).llista());

function pinta() {
    $('album-grups').innerHTML = agrupaPerTemes(vistes)
        .map(g => htmlGrup(g, TEXTOS.jugar))
        .join('');
    actualitza();
}

/** Posa al dia les cartes i el progrés (sense tornar a pintar res, perquè el focus no es perdi). */
function actualitza() {
    const grups = agrupaPerTemes(vistes);
    for (const g of grups)
        for (const p of g.paraules) {
            const carta = document.querySelector(`.album-carta[data-paraula="${p.id}"]`);
            if (!carta) continue;
            carta.classList.toggle('album-bloquejada', !p.vista);
            carta.querySelector('.paraula-text').textContent = textCarta(p);
        }
    const r = resum(vistes);
    $('album-progres').innerHTML = htmlProgres(r, TEXTOS.progres);
    const jugar = $('album-jugar');
    jugar.hidden = r.vistes === 0;
    jugar.href = enllacPractica({ vistes: true });
}

// Una paraula tocada (o oberta amb Intro o Espai) es dona per vista; es desbloqueja quan es tanca la targeta
document.addEventListener(
    'click',
    e => {
        const carta = e.target.closest && e.target.closest('.album-carta');
        if (carta) vistes.add(carta.dataset.paraula);
    },
    true
);
document.addEventListener(
    'keydown',
    e => {
        const carta = e.target.closest && e.target.closest('.album-carta');
        if (carta && (e.key === 'Enter' || e.key === ' ')) vistes.add(carta.dataset.paraula);
    },
    true
);
document.addEventListener('close', actualitza, true);

$('album-jugar').textContent = `▶ ${TEXTOS.jugar}`;
initTargetaParaula();
pinta();
