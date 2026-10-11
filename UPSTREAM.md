# Relació amb `operacions` (UPSTREAM)

`a2` no és un *fork* literal: és una adaptació amb objectius propis (aula d'acollida, només català). Aquest fitxer deixa constància de **de quina versió d'`operacions` deriva cada part** i de què s'ha decidit **no** portar, perquè la deriva no torni a passar de manera invisible (la [revisió inicial](docs/REVISIO-INICIAL.md) en va trobar).

## Referència actual

- **Repositori:** <https://github.com/step-quiz/operacions> (públic; des d'`a2` només es llegeix).
- **Commit de referència:** `3bb77b6` (2026-10-06, «Merge pull request #6 from step-quiz/claude/practical-babbage-ab54cc»).
- **Revisat per última vegada:** 2026-10-10.

## Fitxers compartits (estat a la PR 5a)

Des de la PR 5a els fitxers del motor són mòduls ES com a `operacions`. La còpia antiga (scripts clàssics) és a `js/legacy/` i ja no la fa servir cap activitat (s'esborrarà a la PR 15).

| Fitxer d'`a2` | Origen a `operacions` | Estat | Pas del pla |
|---|---|---|---|
| `js/utils.js` | `js/utils.js` | **Idèntic** (PR 5a). | — |
| `js/config.js` | `js/config.js` | Mòdul ES (PR 5a). Difereix en: límits 20/30/10 (a `operacions`, 5/10, perquè el seu codi de verificació no en representa més), i sense el paràmetre de la nota. Importa `fixed-sessions.js` el primer, com a `operacions` (PR 5b). | — |
| `js/game-core.js` | `js/game-core.js` | Mòdul ES (PR 5a) amb el mateix disseny: estat compartit a `state`, `window.buildLevel` i `window.checkCurrentCell`, `Object.assign(window, …)` per als `onclick`. **Sense** el sistema de codis, la nota sobre 10, el «Criteri» ni `MAX_RESULTS` (D3, PR 2). Té de més: `puntsPregunta()` (un encert val sempre ≥ 1 punt), `textPunts()`, estrelles, la revisió ✔/✖ i `registraProva()` (lectura de l'estat per als tests de navegador). Embolcalla `buildLevel` amb les sessions fixes a `startGame()` (PR 5b). **Encara no té** els camps bloquejats (`data-locked`, `getKbActiveInput`, `kbReleaseInput`), que s'hi afegiran amb la primera activitat que els necessiti. | amb la primera activitat que usi `data-locked` |
| `css/shared.css` | `css/shared.css` | Equivalent en estructura (Prettier a part). Des de la PR 4b els colors comuns són a `css/tokens.css`, com a `operacions`; `a2` hi afegeix els estils de la pantalla final i de la revisió (PR 2), `.title-row`/files de proporció (PR 3) i els de les paraules amb imatge (`.paraula`, `.pict-*`, amb el bloc `forced-colors`; PR 6b) i els de la targeta «Aprèn la paraula» i el distintiu de «paraula nova» (`.targeta-paraula`, `.paraula-nova`; PR 7). | PR 5 |
| `css/tokens.css` | `css/tokens.css` | Adaptat a la PR 4b. Diferència: `--text-muted` és `#475569` (a `operacions`, `#64748b`, que només fa 4,34:1 sobre la capçalera de les activitats), i `--danger-light` és `#fef2f2`. | PR 5 |
| `css/accessibilitat.css` | — | Propi d'`a2` (PR 4b): moviment reduït, focus visible i zones de toc a totes les pàgines, també als tutorials i a la portada, que no carreguen `shared.css`. | — |
| `css/chromebook.css` | `css/chromebook.css` | Equivalent (només canvia el format). Des de la PR 4b, amb `dvh` de reserva a les alçades en `vh`. | PR 5 |
| — (esborrat a la PR 8b: era `js/legacy/decimals/diners-feedback.js`) | `js/decimals/diners-feedback.js` | **No es porta.** Eren frases d'error en català («T'has equivocat en els cèntims», «Has encertat els 90 cèntims, però t'has equivocat en la part entera»…) que l'alumnat de l'aula d'acollida no pot llegir; en distingia, a més, alguns errors típics (xifres girades, euros per cèntims…), que ara només es veuen com a part dolenta. En el seu lloc, `js/a-decimals/vista.js` parteix la resposta en euros i cèntims i en marca amb ✔ o ✖ els bons i els dolents (sense cap frase). | PR 8b |
| — (esborrat a la PR 8b: era `js/legacy/decimals/products-diners.js`) | `js/decimals/products-diners.js` | **Substituït** pel catàleg de `js/a-decimals/productes.js` (PR 8a): els productes són paraules del lèxic, amb imatge. | PR 8b |
| `index.html` | `index.html` | Portat a la PR 3: el selector accessible (*combobox* amb teclat i ARIA), l'alternativa del porta-retalls i el peu amb la llicència (sense la insígnia de `licensebuttons.net`). Té el camp «Sessió fixa» (PR 5b), però només per a les activitats del motor nou (`fixed: true` a la llista). **No** té les files per dificultat, dimensió i modalitat, ni la navegació mòbil ESO/Batxillerat, ni les icones flotants. | PR 13 (portada nova) |
| `icon.png`, `icon-green.png` | `icon.png`, `app/icon-green.png` | Còpies exactes (a la PR 3; abans eren dues imatges blaves de 212 KB). | — |
| `tools/servidor.js` | `tools/servidor.js` | Adaptat a la PR 4a: exporta `crea()` perquè els tests l'engeguin, no serveix carpetes ocultes i avisa si el port és ocupat. | — |
| `tools/desa.sh` | `tools/desa.sh` | Adaptat a la PR 4a (guarda contra les etiquetes que impedeixen publicar i que no falla en una branca nova). Des de la PR 5a, com a `operacions`: Prettier i ESLint abans de desar (si estan instal·lats). | — |
| `.devcontainer/devcontainer.json` | `.devcontainer/devcontainer.json` | Adaptat a la PR 4a. Des de la PR 5a amb el `postCreateCommand` que instal·la ESLint i Prettier. | — |
| `.github/workflows/tests.yml` | `.github/workflows/tests.yml` | Reescrit a la PR 4a: dos treballs (comprovacions i navegador) i la guarda d'etiquetes. Des de la PR 5a, el de comprovacions inclou ESLint i, només a les pull requests, Prettier (com a `operacions`). | — |
| `tools/lint/`, `.prettierrc.json`, `.prettierignore` | els mateixos | PR 5a: les mateixes versions i regles que `operacions` (`eslint` 10.11.0, `prettier` 3.9.9). Difereix en: s'ignoren `js/legacy/` (scripts clàssics que comparteixen globals) i `tools/lint/`; els tests de navegador veuen els globals de la pàgina (`document`, `window`…) i els noms interns que llegeixen; i Prettier no formata els CSS (a `operacions` sí; s'hi arribarà amb la portada nova). | — |
| `tests/harness.js`, `tests/check-repo.js`, `tests/run-all.js` | els mateixos noms | Idea i estructura d'`operacions` (comprovacions del repositori i execució conjunta); el contingut és propi. Des de la PR 5a, `check-repo` entén els mòduls ES (sintaxi i `import`). | — |
| `tests/game-core.test.js`, `tests/activitats.test.js` | `tests/esm.test.js` (idea) | PR 5a: càrrega nativa (`import()`) del motor nou i dels generadors de les activitats migrades, amb atzar sembrat. | — |
| `js/fixed-sessions.js` | `js/fixed-sessions.js` | Adaptat a la PR 5b. **Sense** les taules de nivell, famílies i tipus per sessió (no hi ha cap activitat d'`a2` que les necessiti) i **sense** restaurar `Math.random` en acabar (era per al «salt» aleatori del codi de verificació, que `a2` no té). El text del distintiu és a `js/textos.js` (depèn només d'aquest fitxer; la resta és autocontinguda). El distintiu «Sessió fixa A/B/C» és dins del flux de la pàgina (a `operacions` flota a la cantonada, i en un mòbil de 320 px es posa sobre el botó «Tutorial»). Mateix algorisme (hash FNV-1a + Mulberry32). Com que el nom de l'activitat forma part de la llavor, `a-enters` no repeteix les preguntes d'`enters`. | — |
| `tests/fixed-sessions.test.js` | `tests/fixed-sessions.test.js` | Idea d'`operacions`, reescrita per a `import()` nadiu i ampliada amb valors fixats, qualitat de l'atzar, paràmetres per defecte i distintiu. | — |
| `js/lexicon/` (`dades.js`, `lexicon.js`, `pictogrames.js`, `mates.js`, `relacions.js`, `paraula.js`, `targeta.js`), `js/targeta-paraula.js`, `js/textos.js`, `js/<activitat>/textos.js`, `tests/check-lexicon.js`, `tools/paraules-noves.js` | — | Propis d'`a2` (PR 6a, 6b i 7), sense equivalent a `operacions`: el lèxic controlat per a l'aula d'acollida, amb la imatge de cada paraula (emojis i pictogrames SVG propis) i la targeta «Aprèn la paraula» (un toc a una paraula en mostra la imatge gran) ([`docs/LEXIC.md`](docs/LEXIC.md)). `operacions` fa servir un `strings.js` a algunes activitats (`recta-numerica`, `prioritat`…) amb funcions que munten el text; quan es porti una d'aquestes activitats, els seus textos passaran a `js/<activitat>/textos.js` (amb `{claus}` i el lèxic) i les seves paraules, al lèxic. | amb cada activitat |
| `targetes.html`, `js/targetes/` (`generador.js`, `vista.js`, `targetes.js`), `css/targetes.css` | — | Propis d'`a2` (PR 13c-bis), sense equivalent a `operacions`: les targetes de vocabulari per imprimir (eina del professorat). Les regles del paper (blanc i negre, lletra de 14 pt, A4, doble cara) són del material del professorat [`step-quiz/pi`](https://github.com/step-quiz/pi) ([`docs/TARGETES.md`](docs/TARGETES.md)); d'allà no s'ha copiat codi, només les idees. | — |
| `js/a-decimals/` (`productes.js`, `generador.js`, `vista.js`, `textos.js`, `a-decimals.js`) i `a-decimals.html` | `decimals.html` i `js/decimals/decimals.js` (la lògica de generació i la pantalla) | Propis d'`a2` (PR 8a i 8b). `productes.js` i `generador.js` són lògica pura sense DOM: els productes són paraules del lèxic (amb imatge) i se n'han tret quatre —pizza, magdalena, entrepà i fruits secs— pels contextos neutres; els diners són enters en cèntims; l'import es llegeix amb coma o punt (el punt no es penalitza); al nivell 2 es paga amb 10 € un de cada tres cops. `vista.js` construeix l'HTML de cada peça (la botiga, l'ajuda amb símbols, les parts de la resposta) i `a-decimals.js` és el controlador, com `a-enters.js`. La pantalla no té frases: les paraules (productes, «el bitllet», «total», «canvi») són del lèxic i es poden tocar; el feedback d'error és ✔/✖ per parts (no es porta `diners-feedback.js`) i el missatge de fi de pregunta és el del motor (`#mini-victory-overlay`), no el feedback en línia. | PR 8b |
| `js/legacy/` | — | Còpia dels fitxers antics (`utils.js`, `config.js` i `game-core.js`). **Des de la PR 12h cap activitat els fa servir**: s'esborren a la PR 15. (`a-decimals` en va marxar a la PR 8b, `a-proporciodirecta` a la 9 i `a-rellotge` a l'11.) Es retira a la PR 15. | PR 15 |
| `tests/navegador/` | — | Propi d'`a2` (Playwright i, des de la PR 4b, axe-core): `operacions` no té tests de navegador. | — |

Les pàgines `a-*.html` són originals d'`a2` (conceptualment derivades de `enters`, `decimals`, `equacions` i `proporciodirecta`); `a-rellotge.html` no té equivalent a `operacions`. `js/a-enters/` (controlador i generador) també és d'`a2`: l'«enters» d'`operacions` és «Operacions amb enters», una altra activitat.

## Què NO es porta (decisió deliberada)

- **Codis de retorn al professorat:** `js/exercise-codes.js`, el generador del codi de verificació (`copiarResultats`), el control antifrau, `analitzador-stepquiz.html` i tot el que en depèn (nota sobre 10, «Criteri»).
- **Batxillerat** (11 activitats) i la resta de projectes que viuen dins `operacions`: `cb`, `gem4eso`, `app`, `meteo*`, `informe-cb*`, `decaleg-pau`, PAU…
- **Cap infraestructura multillengua:** `a2` és només en català (vegeu `docs/PLA.md`, principi 2).
- **KaTeX** (`vendor/katex`, 1,5 MB) fins que una activitat el necessiti (`llenguatge-algebraic`, `sistemes-equacions` i `probabilitat`).

## Activitats adaptades

Cada PR d'activitat hi afegeix una fila amb l'origen exacte (les que van néixer abans d'aquest registre hi són posades després).

| Activitat | Fitxers d'origen a `operacions` | Commit d'origen | PR |
|---|---|---|---|
| Nombres enters (`a-enters`) | `enters.html`, `js/enters/` | `3bb77b6` | 5a (lèxic i imatges: 6a, 6b i 7) |
| Diners i canvi (`a-decimals`) | `decimals.html`, `js/decimals/` | `3bb77b6` | 8a i 8b |
| Proporcionalitat (`a-proporciodirecta`) | `proporciodirecta.html`, `js/proporciodirecta/` | `3bb77b6` | 9 |
| Rellotge (`a-rellotge`) | — (original d'`a2`: `operacions` no té rellotge) | — | 11 |
| Temperatura (`a-recta-numerica`) | `recta-numerica.html`, `js/recta-numerica/` | `3bb77b6` | 12 (sense frases ni tipografia de Google; el nivell 3 demana el dia més calent/fred; no es porta `recordResult`; tutorial pendent) |
| MCD i MCM (`a-mcd-mcm`) | `mcd-mcm.html`, `js/mcd-mcm/mcd-mcm.js` | `3bb77b6` | 12b (sense frases; el nivell es tria amb `?nivell=` en lloc de pujar amb la pregunta; pista «divisor/múltiple» (PR 12c) i ajuda amb divisors i múltiples; no es porta `recordResult`; tutorial pendent) |
| Factoritzar (`a-factoritzar`) | `factoritzar.html`, `js/factoritzar/factoritzar.js` | `3bb77b6` | 12c (sense frases; el nivell es tria amb `?nivell=` en lloc de pujar amb la pregunta; ajuda amb els primers; solució quan s'esgoten els intents; no es porta `recordResult`; tutorial pendent) |
| Fraccions (`a-fraccions`) | `fraccions.html`, `js/fraccions/fraccions.js` | `3bb77b6` | 12d (sense menú ni frases: els modes són nivells; sense la casella «irreductible» (sempre cal simplificar); no es porten els factors de la casella ×; no es porta `recordResult`; tutorial pendent) |
| Àrea i perímetre (`a-area-perimetre`) | `area-perimetre.html`, `js/area-perimetre/area-perimetre.js` | `3bb77b6` | 12e (sense frases ni avisos; ajuda amb números en lloc de text; nivells `?nivell=` segons el tipus de figura; no es porta `recordResult`; el tutorial d'`operacions` (`area-perimetre-tutorial.html`) no s'ha portat encara) |
| Triangle rectangle (`a-triangle-rectangle`) | `triangle-rectangle.html`, `js/triangle-rectangle/triangle-rectangle.js`, `css/triangle-rectangle.css` | `3bb77b6` | 12f (sense frases; el dibuix porta les lletres dels costats («b = 3», «a = ?»); les arrels es simplifiquen; ajuda per tocs; nivells `?nivell=`; no es porta `recordResult`) |
| Coordenades (`a-pla-cartesia`) | `pla-cartesia.html`, `js/pla-cartesia/pla-cartesia.js` | `3bb77b6` | 12g (sense menú de seccions ni frases; 3a i 3b són tipus de pregunta; quadrants amb icones; pla sense scroll intern; no es porta `recordResult`; sense tutorial) |
| Equacions (`a-equacions`) | `equacions.html`, `js/equacions/` (la versió adaptada d'`a2` és original; la lògica d'un pas ve de l'activitat de caixes de caramels d'`a2`) | `3bb77b6` | 12h (al motor nou; sense frases; comprovació per substitució; nivell per defecte 1; el tutorial no s'ha tocat) |
| Potències (`a-potencies`) | `potencies.html`, `js/potencies/potencies.js` | `3bb77b6` | 12i (els tres reptes són nivells; sense menú ni el pas de triar l'operació; el camp de l'exponent va aixecat; comprovació amb xifres; ajuda amb els factors escrits; no es porta `recordResult`; sense tutorial) |
| Àlbum de paraules (`album.html`) | — | — | 13b (pròpia d'`a2`, sense equivalent a `operacions`: les paraules que l'alumne ha vist, només al dispositiu) |
| Vocabulari (`a-vocabulari`) | `vocabulari.html`, `js/vocabulari/` (`vocabulari.js`, `vocabulari-engine.js`, `vocabulari-figures.js`), `vocabulari-figures.json` | `3bb77b6` | 13a (no es porta el contingut de l'original —les figures geomètriques i les etiquetes a posar-hi—: l'activitat d'`a2` treballa les paraules amb imatge del lèxic; sí la idea d'escriure la paraula amb avís d'accents, ara amb marques lletra a lletra sense frases; sense «mode A» d'arrossegar; no es porta `recordResult`; sense àudio) |
| Prioritat d'operacions (`a-prioritat`) | `prioritat.html`, `js/prioritat/` (`math-engine.js`, `prioritat.js`, `renderer.js`, `strings.js`) | `3bb77b6` | 12k (només la modalitat «Pas a pas»; `math-engine.js` es porta com a mòdul de funcions, sense `diagnose`, `buildDistractors` ni les frases de `strings.js`; 10 nivells interns → 4 nivells `?nivell=`; la divisió es mostra amb «÷»; feedback amb xifres i marques; no es porta `recordResult`; sense tutorial) |
| Escriure nombres (`a-nombres-lletres`) | — | — | 12j (activitat pròpia d'`a2`, sense equivalent a `operacions`: el professorat de l'aula d'acollida la va demanar; dues oportunitats fixes) |
| Ordenar enters (`a-enters-ordenar`) | `enters-ordenar.html`, `js/enters-ordenar/enters-ordenar.js` | `3bb77b6` | 10 (sense frases, solució quan s'esgoten els intents, punts del motor d'`a2`; no es porta `recordResult`) |

## Com revisar què ha canviat a `operacions`

Abans de cada onada d'activitats convé veure què s'hi ha tocat des del commit de referència. Ordres per copiar i enganxar (en un terminal, per exemple el del Codespace):

```
git clone https://github.com/step-quiz/operacions.git ../operacions
cd ../operacions
git pull
git log --oneline 3bb77b6..HEAD -- js css
cd -
```

La primera ordre només cal la primera vegada. L'última línia et torna a la carpeta d'`a2`. Per veure els canvis d'una activitat concreta, afegeix-ne el nom: `git log --oneline 3bb77b6..HEAD -- js/enters enters.html`.

> Sessions de Claude: `operacions` es clona de manera superficial (`--depth 1`); per veure'n l'historial cal ampliar-lo amb `git fetch --depth=1000 origin main`.

## Historial de sincronitzacions

| Data | Commit d'`operacions` | Resum |
|---|---|---|
| 2026-10-10 | `3bb77b6` | Revisió inicial: comparació de tots els fitxers compartits i enquesta de les 25 activitats d'ESO. Cap codi portat encara. |
| 2026-10-10 | `3bb77b6` | PR 3: portats d'`index.html` el selector accessible, l'alternativa del porta-retalls i el peu; i les dues icones. |
| 2026-10-10 | `3bb77b6` | PR 4a: adaptats `tools/servidor.js`, `tools/desa.sh`, `.devcontainer`, `.gitignore` i el workflow de tests. |
| 2026-10-10 | `3bb77b6` | PR 4b: adaptat `css/tokens.css`; `css/shared.css` passa a fer-lo servir. |
