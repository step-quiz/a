/**
 * ============================================================================
 * PROJECTE: a2 — Matemàtiques per a l'aula d'acollida
 * FITXER: js/professorat/professorat.js
 * ROL: El panell del professorat (index.html): el generador d'enllaços per
 *      a la classe. S'hi tria l'activitat (una llista per temes que es maneja
 *      amb teclat, com un combobox), el nivell, el tema (només a «Vocabulari»), les
 *      sessions, les preguntes, els errors màxims i la sessió fixa; surt
 *      l'enllaç, que es pot copiar, obrir o provar amb el botó «Tutorial».
 *      L'enllaç el construeix enllacProfessorat() (js/portada/activitats.js), que
 *      no hi posa mai un paràmetre que l'activitat no entendria.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). Importa el catàleg
 *      d'activitats (js/portada/activitats.js) i els temes del banc de paraules
 *      (js/targetes/generador.js).
 * ============================================================================
 */
import { ACTIVITATS, ACTIVITAT_PER_DEFECTE, GRUPS, activitatDe, enllacProfessorat } from '../portada/activitats.js';
import { temesDelBanc } from '../targetes/generador.js';

// Adreça base: la carpeta d'aquesta mateixa pàgina. Així els enllaços apunten a la web on s'ha obert el panell
// (GitHub Pages, un domini propi o un servidor local).
const BASE_URL = new URL('.', window.location.href).href;

const $ = id => document.getElementById(id);

// ── El selector d'activitat: un combobox personalitzat ──
// Accessibilitat: el disparador es comporta com un combobox (Tab, fletxes, Home/End, Intro/Espai, Esc) i la llista com un
// listbox per als lectors de pantalla. Les activitats van per temes: cada tema és un grup (role="group") amb el seu nom.
function creaSelectorActivitat(wrapId, activitats, fitxerPerDefecte, alCanviar) {
    const wrap = $(wrapId);
    const trigger = wrap.querySelector('.cd-trigger');
    const list = wrap.querySelector('.cd-list');
    const label = wrap.querySelector('.cd-label');
    let fitxerActual = fitxerPerDefecte;
    let activa = -1; // opció ressaltada amb les fletxes del teclat

    list.id = `${wrapId}-list`;
    trigger.setAttribute('tabindex', '0');
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-controls', list.id);
    trigger.setAttribute('aria-expanded', 'false');
    const etiquetaFila = wrap.closest('.row')?.querySelector('label');
    if (etiquetaFila) {
        etiquetaFila.id = `${wrapId}-label`;
        trigger.setAttribute('aria-labelledby', etiquetaFila.id);
    }
    list.setAttribute('role', 'listbox');
    // La classe 'open' també la posen/treuen altres parts de la pàgina (clic fora): aria-expanded hi va sincronitzat.
    new MutationObserver(() => {
        const oberta = wrap.classList.contains('open');
        trigger.setAttribute('aria-expanded', String(oberta));
        if (!oberta) ressalta(-1);
    }).observe(wrap, { attributes: true, attributeFilter: ['class'] });

    const indexActual = () => activitats.findIndex(a => a.file === fitxerActual);

    function tria(a) {
        fitxerActual = a.file;
        label.textContent = a.etiqueta;
        pinta();
        wrap.classList.remove('open');
        alCanviar();
    }

    function ressalta(idx) {
        activa = idx;
        list.querySelectorAll('.cd-option').forEach((el, i) => el.classList.toggle('active', i === idx));
        if (idx >= 0) {
            const el = $(`${wrapId}-opt-${idx}`);
            trigger.setAttribute('aria-activedescendant', el.id);
            el.scrollIntoView({ block: 'nearest' });
        } else {
            trigger.removeAttribute('aria-activedescendant');
        }
    }

    function pinta() {
        list.innerHTML = '';
        let grup = null;
        let contenidor = null;
        activitats.forEach((a, i) => {
            if (a.grup !== grup) {
                grup = a.grup;
                contenidor = document.createElement('div');
                contenidor.className = 'cd-group';
                contenidor.setAttribute('role', 'group');
                contenidor.setAttribute('aria-label', GRUPS.find(g => g.id === grup).nom);
                list.appendChild(contenidor);
            }
            const div = document.createElement('div');
            div.className = `cd-option${a.file === fitxerActual ? ' selected' : ''}`;
            div.id = `${wrapId}-opt-${i}`;
            div.setAttribute('role', 'option');
            div.setAttribute('aria-selected', String(a.file === fitxerActual));
            div.innerHTML = `
                <svg class="cd-check" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="3 8 7 12 13 4"/>
                </svg>
                <span>${a.etiqueta}</span>`;
            div.addEventListener('click', () => tria(a));
            contenidor.appendChild(div);
        });
    }

    label.textContent = (activitats.find(a => a.file === fitxerPerDefecte) || activitats[0]).etiqueta;
    pinta();

    function obre() {
        wrap.classList.add('open');
        // La llista no ha de sortir de la pantalla: s'ajusta a l'espai que queda sota el disparador
        const disponible = window.innerHeight - trigger.getBoundingClientRect().bottom - 12;
        list.style.maxHeight = `${Math.min(320, Math.max(100, disponible))}px`;
    }

    trigger.addEventListener('click', e => {
        e.stopPropagation();
        if (wrap.classList.contains('open')) wrap.classList.remove('open');
        else obre();
    });
    list.addEventListener('click', e => e.stopPropagation());

    trigger.addEventListener('keydown', e => {
        const oberta = wrap.classList.contains('open');
        const triada = indexActual();
        switch (e.key) {
            case 'ArrowDown':
            case 'ArrowUp': {
                e.preventDefault();
                if (!oberta) {
                    obre();
                    ressalta(triada);
                    return;
                }
                const des = activa >= 0 ? activa : triada;
                const pas = e.key === 'ArrowDown' ? 1 : -1;
                ressalta(Math.min(activitats.length - 1, Math.max(0, des + pas)));
                break;
            }
            case 'Home':
            case 'End':
                if (!oberta) return;
                e.preventDefault();
                ressalta(e.key === 'Home' ? 0 : activitats.length - 1);
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (oberta && activa >= 0) tria(activitats[activa]);
                else if (oberta) wrap.classList.remove('open');
                else {
                    obre();
                    ressalta(triada);
                }
                break;
            case 'Escape':
                if (oberta) {
                    e.preventDefault();
                    wrap.classList.remove('open');
                }
                break;
            case 'Tab':
                wrap.classList.remove('open');
                break;
        }
    });

    return { valor: () => fitxerActual };
}

// ── El panell ──
function iniciaPanell() {
    const els = {
        s: $('s-eso'),
        o: $('o-eso'),
        i: $('i-eso'),
        fix: $('fix-eso'),
        rowFix: $('row-fixed-eso'),
        nivell: $('nivell-eso'),
        rowNivell: $('row-nivell-eso'),
        tema: $('tema-eso'),
        rowTema: $('row-tema-eso'),
        link: $('l-eso'),
        copy: $('c-eso'),
        open: $('p-eso'),
        help: $('h-eso'),
        status: $('st-eso'),
    };

    // Els temes del vocabulari: només els tria «Vocabulari» (?tema=)
    els.tema.innerHTML =
        '<option value="">— Tots —</option>' +
        temesDelBanc()
            .map(t => `<option value="${t.tema}">${t.icona} ${t.nom}</option>`)
            .join('');

    const activitat = () => activitatDe(selector.valor());

    // Els camps que només tenen sentit a algunes activitats surten només a aquestes: «Nivell» (hi ha activitats que no en
    // tenen), «Tema» (només «Vocabulari») i «Sessió fixa». En amagar-se es buiden, per no deixar un paràmetre penjat a l'enllaç.
    function ajustaCamps() {
        const a = activitat();
        els.rowFix.style.display = a.fixed ? '' : 'none';
        if (!a.fixed) els.fix.value = '';
        els.rowTema.style.display = a.tema ? '' : 'none';
        if (!a.tema) els.tema.value = '';
        // El nivell és propi de cada activitat (el 2 de l'una no és el 2 de l'altra): en canviar d'activitat torna al per defecte
        els.rowNivell.style.display = a.nivells.length ? '' : 'none';
        els.nivell.innerHTML = a.nivells.length
            ? `<option value="">— Per defecte (${a.nivellDefecte}) —</option>` +
              a.nivells.map((text, k) => `<option value="${k + 1}">${k + 1} · ${text}</option>`).join('')
            : '';
    }

    function construeix() {
        els.link.textContent = enllacProfessorat(BASE_URL, activitat(), {
            sessions: els.s.value,
            preguntes: els.o.value,
            intents: els.i.value,
            nivell: els.nivell.value,
            tema: els.tema.value,
            fixed: els.fix.value,
        });
    }

    // El botó «Tutorial» només surt a les activitats que en tenen
    const ajustaTutorial = () => {
        els.help.style.display = activitat().tutorial ? 'flex' : 'none';
    };

    const selector = creaSelectorActivitat('cd-eso', ACTIVITATS, ACTIVITAT_PER_DEFECTE, () => {
        ajustaCamps();
        construeix();
        ajustaTutorial();
    });

    ajustaCamps();
    construeix();
    ajustaTutorial();

    [els.s, els.o, els.i, els.nivell, els.tema, els.fix].forEach(el => el.addEventListener('change', construeix));

    els.copy.addEventListener('click', async () => {
        // Si el navegador no deixa usar el porta-retalls (HTTP, navegador antic, permís denegat…) se selecciona l'enllaç
        // (és un <div>, no un textarea) i es prova la còpia clàssica. Si tampoc funciona, l'enllaç queda seleccionat
        // perquè es copiï a mà.
        let copiat = false;
        try {
            await navigator.clipboard.writeText(els.link.textContent);
            copiat = true;
        } catch {
            const rang = document.createRange();
            rang.selectNodeContents(els.link);
            const seleccio = window.getSelection();
            seleccio.removeAllRanges();
            seleccio.addRange(rang);
            try {
                copiat = document.execCommand('copy');
            } catch {
                // sense còpia possible: `copiat` es queda a false i l'enllaç continua seleccionat
            }
        }
        els.status.textContent = copiat ? 'Copiat ✅' : "Copia l'enllaç seleccionat (Ctrl+C)";
        setTimeout(() => (els.status.textContent = ''), copiat ? 2000 : 5000);
    });
    els.open.addEventListener('click', () => window.open(els.link.textContent, '_blank'));
    els.help.addEventListener('click', () => {
        const a = activitat();
        if (a.tutorial) window.open(new URL(a.tutorial, BASE_URL).href, '_blank');
    });
}

iniciaPanell();

// Tanca el selector en clicar fora
document.addEventListener('click', () => {
    document.querySelectorAll('.cd-wrap').forEach(w => w.classList.remove('open'));
});
