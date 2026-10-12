# El panell del professorat (`index.html`) i la portada d'icones de l'alumnat (`alumnat.html`)

> **Document viu.** Les pàgines són [`index.html`](../index.html) (el professorat: la pàgina principal) i [`alumnat.html`](../alumnat.html) (la portada d'icones de l'alumnat, opcional); el codi, a [`js/portada/`](../js/portada/) (el catàleg d'activitats, que comparteixen) i [`js/professorat/`](../js/professorat/); els estils, a [`css/portada.css`](../css/portada.css) i [`css/peu.css`](../css/peu.css).

## Què són

**Qui obre `index.html` és el professorat**: l'alumnat no navega pel web, rep un enllaç directe de l'activitat que genera el professorat. Per això el panell del professorat (el generador d'enllaços) és la pàgina principal. A la 13d es va fer al revés (la portada d'icones a `index.html` i el panell a `professorat.html`); el 2026-10-12 es va tornar a deixar com al principi (decisió D12 del [pla](PLA.md)), amb la portada d'icones com a pàgina opcional. Són **dues pàgines**:

| Pàgina | Per a qui | Què fa |
|---|---|---|
| `index.html` | el professorat | El **generador d'enllaços per a la classe**, i els recursos del professorat (les targetes per imprimir, l'àlbum, la portada d'icones de l'alumnat). És la pàgina principal; l'icona d'inici de cada activitat hi porta. |
| `alumnat.html` | l'alumnat (opcional) | Una **fitxa gran amb la imatge i el nom** de cada activitat (i de l'àlbum de paraules). Tocar-la obre l'activitat. S'hi arriba des de l'enllaç «Portada de l'alumnat» del panell; el peu («Professorat») torna al panell. |

## La portada d'icones de l'alumnat (`alumnat.html`)

- **Imatges i noms, res més.** Cap menú, camp ni botó: només fitxes (enllaços). La imatge de cada fitxa és la d'una paraula del lèxic (així l'alumne hi veu la mateixa imatge que a la targeta «Aprèn la paraula»: el rellotge 🕐, la fracció, l'equació `x + 3 = 8`…) o un emoji; el nom és **el títol de la pàgina de l'activitat** (una prova ho vigila), perquè reconegui el que ha tocat.
- **Cada fitxa porta a l'activitat sense paràmetres**: l'activitat comença amb els seus valors per defecte. Els valors de la classe (nivell, sessió fixa…) els posa el professorat a l'enllaç.
- **L'ordre és per temes**: Vocabulari i l'àlbum de paraules; el rellotge, la temperatura i els diners; els nombres; les operacions; les fraccions; l'àlgebra; la geometria. És el mateix ordre del panell del professorat.
- **Mida de les fitxes.** Cada fitxa és un contenidor (`container-type: inline-size`) i la imatge té la mida relativa a la seva amplada, amb la mateixa proporció que les cartes de l'[àlbum](../album.html) i les [targetes](TARGETES.md): una imatge hi cap sempre. Les columnes s'ajusten a l'amplada (2 en un mòbil de 320 px, fins a 6 en una pantalla gran) i cada fitxa fa com a mínim 130 × 140 px.
- **Vocabulari controlat.** El títol («Matemàtiques»: al lèxic hi ha *matemàtica* i *matemàtiques*) i els noms de les fitxes ([`js/portada/textos.js`](../js/portada/textos.js)) passen pel control del lèxic ([`LEXIC.md`](LEXIC.md)). El **peu** (l'autoria i la llicència, amb `data-legal`) és per als adults i queda fora d'aquest control: és l'única part d'una pàgina de l'alumnat que no hi passa.
- **Sense marca en anglès.** La portada no diu «Step Quiz» enlloc de la part de l'alumnat (només la icona, i el nom en el peu): l'aula és immersiva en català.

## El panell del professorat (`index.html`)

| Camp | Quan surt | Què posa a l'enllaç |
|---|---|---|
| **Activitat** | sempre; una llista per temes que es maneja amb teclat (com un *combobox*) | la pàgina |
| **Nivell** | si l'activitat en té (16 de 17; no «Ordenar enters») | `nivell=` (cada nivell diu què és: «1 · només sumes») |
| **Tema** i **Subtema** | només a «Vocabulari» | `tema=`: `mates`, `no-mates`, un dels 20 temes del banc o diversos amb comes (`mat-nombres,mat-algebra`). «Tema» és de tria única (Matemàtiques, No matemàtiques, Tot) i amb Matemàtiques surt «Subtema», una llista de caselles dels més senzills als més complexos; el navegador en recorda l'última tria |
| **Sessions**, **Preguntes**, **Errors màx.** | sempre | `totalsessions=`, `totaloperations=`, `maxintents=` |
| **Sessió fixa** | si l'activitat n'admet (totes les del motor nou) | `fixed=A/B/C` |

- L'enllaç el construeix `enllacProfessorat()` ([`js/portada/activitats.js`](../js/portada/activitats.js)), que **no hi posa mai un paràmetre que l'activitat no entendria** (un nivell que no té, un tema a una activitat que no en té…). L'ordre és `totalsessions`, `totaloperations`, `maxintents`, `nivell`, `tema`, `fixed`.
- **El nivell torna al per defecte** en canviar d'activitat (el 2 de l'una no és el 2 de l'altra); **la sessió fixa es conserva** (és de la classe, no de l'activitat).
- «Copia» (amb alternativa si el navegador no deixa fer servir el porta-retalls), «Obre» i, a les activitats amb tutorial, «▶ Tutorial».

## El catàleg d'activitats

[`js/portada/activitats.js`](../js/portada/activitats.js) és **l'única llista d'activitats**: la portada i el panell la fan servir tots dos. **Una activitat nova** s'hi afegeix aquí (amb el seu `grup`, el `nom` a `textos.js`, la `imatge`, els `nivells`…) i surt a les dues pàgines. La capçalera del fitxer explica cada camp. Les proves comproven que:

- cada pàgina i cada tutorial existeixen, i **totes** les activitats (`a-*.html`) hi són (`tests/check-repo.js`);
- els **nivells** i el nivell per defecte són els del generador de cada activitat, i només «Vocabulari» admet `?tema=` (`tests/activitats.test.js`);
- «Sessió fixa» hi surt just a les activitats del motor nou (`tests/check-repo.js`);
- el nom de cada fitxa és el títol de la seva pàgina i cada paraula és al lèxic (`tests/activitats.test.js`, `tests/check-lexicon.js`);
- al navegador, cada enllaç del panell obre l'activitat amb el nivell més alt i la sessió fixa triats (`professorat`), la portada es maneja amb teclat i no desborda en mòbil (`portada`, `mobil`) i les dues pàgines passen axe, focus visible i zones de toc de 44 px (`accessibilitat`).

## Què no hi ha (encara)

- Que l'**alumne triï el nivell** des de la portada: el nivell el fixa el professorat amb l'enllaç (cada activitat comença pel seu nivell per defecte).
- Una portada que **mostri només algunes activitats** (per a una classe concreta).
