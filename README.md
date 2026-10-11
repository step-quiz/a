# a2 — Matemàtiques per a l'aula d'acollida

Activitats interactives de matemàtiques d'**ESO** adaptades per a l'**aula d'acollida**: alumnat que fa menys de dos anys que és a Catalunya i que sovint no entén el català.

Les activitats parteixen de les d'[`operacions`](https://github.com/step-quiz/operacions) (Step Quiz) i hi afegeixen suport visual i un català matemàtic mínim i controlat. L'aula d'acollida és **immersiva en català**: tot el text és en català i no hi ha cap altra llengua enlloc.

El projecte té una **doble funció**:

1. **Practicar matemàtiques** sense saber gairebé gens de català.
2. **Aprendre, en context, les poques paraules que apareixen**: si estem comprant un producte i veiem la imatge d'una 🍎 amb la paraula «poma», ja sabem que aquella fruita es diu «poma» en català.

> **Estat: en transició.** Aquest repositori va néixer com a còpia de les activitats adaptades per a necessitats educatives especials (`a-*.html`) i s'està convertint, pas a pas, en l'adaptació per a l'aula d'acollida. El pla, les decisions preses i l'estat de cada pas són a [`docs/PLA.md`](docs/PLA.md).

Web: <https://step-quiz2.github.io/a2/> (GitHub Pages).

## Objectiu

- Només activitats d'**ESO** (cap de Batxillerat).
- **Matemàtica primer, llengua mínima**: enunciats amb números, símbols i dibuixos; el text just i amb un vocabulari controlat.
- **Només català, amb suport visual**: cada paraula concreta va acompanyada de la seva imatge (la pronunciació la fa la professora, que parla català). No hi ha traduccions ni cap altra llengua.
- **Sense codis de retorn al professorat**: no hi haurà codi de verificació, ni nota sobre 10, ni analitzador. L'alumne acaba amb estrelles i punts.
- Aprofitar les millores d'UX/UI d'`operacions`: accessibilitat, mòbil, sessions fixes, proves automàtiques…

## Què hi ha ara

Les activitats del moment en què va néixer el repositori (cada bloc és una activitat i el seu tutorial). **Nombres enters**, **Ordenar enters**, **Diners i canvi**, **Proporcionalitat**, el **Rellotge**, la **Temperatura**, el **MCD i MCM**, **Factoritzar**, **Fraccions**, **Àrea i perímetre**, **Triangle rectangle**, **Coordenades**, **Equacions**, **Potències**, **Escriure nombres**, **Prioritat d'operacions** i **Vocabulari** (amb l'**Àlbum de paraules** i **144 termes de matemàtiques**; i les **Targetes de vocabulari** per imprimir, una eina del professorat) ja van amb el motor nou, el vocabulari controlat i les paraules amb imatge; les altres s'aniran migrant:

| Fitxer | Contingut |
|---|---|
| `index.html` | Generador d'enllaços per al professorat |
| `a-enters.html` · `a-enters-tutorial.html` | Nombres enters (l'ascensor) |
| `a-decimals.html` · `a-decimals-tutorial.html` | Diners i canvi (decimals) |
| `a-enters-ordenar.html` | Ordenar enters (sense tutorial encara) |
| `a-equacions.html` · `a-equacions-tutorial.html` | Equacions de 1r grau |
| `a-proporciodirecta.html` · `a-proporciodirecta-tutorial.html` | Proporcionalitat directa |
| `a-rellotge.html` · `a-rellotge-tutorial.html` | Llegir el rellotge |
| `a-recta-numerica.html` | Temperatura (gràfica; sense tutorial encara) |
| `a-mcd-mcm.html` | MCD i MCM (sense tutorial encara) |
| `a-factoritzar.html` | Factoritzar en primers (sense tutorial encara) |
| `a-fraccions.html` | Operacions amb fraccions (sense tutorial encara) |
| `a-area-perimetre.html` | Àrea i perímetre de figures de quadrats (sense tutorial encara) |
| `a-triangle-rectangle.html` | Teorema de Pitàgores en un triangle rectangle |
| `a-pla-cartesia.html` | Coordenades al pla cartesià |
| `targetes.html` | Targetes de vocabulari per imprimir (eina del professorat; vegeu [`docs/TARGETES.md`](docs/TARGETES.md)) |

## Vocabulari controlat

Totes les paraules que l'alumne pot llegir són a **un registre** (el lèxic, [`docs/LEXIC.md`](docs/LEXIC.md)), i una prova automàtica impedeix que surti una paraula que no hi sigui. Així el vocabulari és el que el professorat ha validat i es repeteix d'una activitat a l'altra. Cada paraula concreta porta la seva **imatge** (un emoji del sistema o un pictograma propi), que surt davant de la paraula en els textos que ho necessiten —com l'ajuda de «Nombres enters»— sense que els lectors de pantalla la llegeixin dues vegades. **Tocant una paraula amb imatge** s'obre una targeta amb la imatge gran i la paraula (sense àudio: la pronuncia la professora), i les paraules que l'alumne encara no ha obert porten un punt de «paraula nova». Cada pull request llista les **paraules** i les **imatges noves** que introdueix perquè es puguin validar abans de fusionar-la.

## Sessions fixes: la mateixa partida per a tota la classe

Al generador d'enllaços (la portada), el camp **Sessió fixa** (A, B o C) fa que **tots els alumnes que obrin l'enllaç facin exactament les mateixes preguntes**, amb els mateixos nombres, passi el que passi (errors, ajudes…). A, B i C són tres conjunts de preguntes diferents. A dalt de la pantalla hi surt «Sessió fixa A» perquè es vegi que és el mode fix, i **Torna a jugar** repeteix la mateixa sessió. Si es deixa en «Aleatòria», cada alumne té preguntes diferents.

De moment està disponible a **Nombres enters**, **Ordenar enters**, **Diners i canvi**, **Proporcionalitat**, el **Rellotge**, la **Temperatura**, el **MCD i MCM**, **Factoritzar**, **Fraccions**, **Àrea i perímetre**, **Triangle rectangle**, **Coordenades**, **Equacions**, **Potències**, **Escriure nombres**, **Prioritat d'operacions** i **Vocabulari**; cada activitat l'estrenarà quan es migri al motor nou (vegeu [`docs/PLA.md`](docs/PLA.md)).

## Estructura

```
js/                 motor de les activitats (mòduls ES: utils, config, game-core, fixed-sessions, textos), el lèxic
                    (js/lexicon/), una carpeta per activitat migrada (js/a-enters/, js/a-enters-ordenar/, js/a-decimals/, js/a-proporciodirecta/, js/a-rellotge/, js/a-recta-numerica/, js/a-mcd-mcm/, js/a-factoritzar/, js/a-fraccions/, js/a-area-perimetre/, js/a-triangle-rectangle/, js/a-pla-cartesia/, js/a-equacions/, js/a-potencies/, js/a-nombres-lletres/, js/a-prioritat/, js/a-vocabulari/, js/album/, js/targetes/) i el motor antic (js/legacy/)
                    de les que encara no ho són
css/                tokens.css (colors), shared.css, accessibilitat.css, chromebook.css i targetes.css (la pàgina de targetes imprimibles)
docs/               pla de treball i revisió inicial
tools/              servidor de prova (servidor.js), desa.sh, ESLint i Prettier (lint/) i Playwright (proves/)
tests/              comprovacions automàtiques (Node) i tests de navegador (navegador/)
.github/workflows/  les comprovacions que GitHub executa sol a cada canvi
.devcontainer/      configuració del Codespace
```

## Documentació

| Document | Per a què serveix |
|---|---|
| [`docs/PLA.md`](docs/PLA.md) | Objectiu, decisions, full de ruta en pull requests i estat de cada pas. És la memòria del projecte entre sessions. |
| [`docs/LEXIC.md`](docs/LEXIC.md) | El lèxic: el registre de totes les paraules que l'alumne pot llegir, com s'hi afegeix una paraula i com es validen les noves. |
| [`docs/REVISIO-INICIAL.md`](docs/REVISIO-INICIAL.md) | Revisió del codi heretat (errors i millores detectats) i com es resol cada cosa. |
| [`UPSTREAM.md`](UPSTREAM.md) | De quina versió d'`operacions` deriva cada part i què no es porta. |
| [`COM-TREBALLAR.md`](COM-TREBALLAR.md) | Com fer i publicar canvis (pull requests, web de GitHub, Codespace) i què són les comprovacions automàtiques, amb ordres per copiar i enganxar. |

## Llicència

Contingut pedagògic (textos, exercicis, enunciats, imatges…) sota **CC BY-NC-SA 4.0**; codi (`.js`, `.css`, plantilles HTML) sota llicència **MIT**. Detall a [`LLICENCIA.md`](LLICENCIA.md) i al text complet de [`LICENSE`](LICENSE).

<!-- atribucio-centre:inici -->

---

Material desenvolupat per **David Arso Civil** per al Departament de Matemàtiques de l'INS Miquel Tarradell.
Contingut sota CC BY-NC-SA 4.0, codi sota llicència MIT. Vegeu [`LLICENCIA.md`](LLICENCIA.md).

<!-- atribucio-centre:final -->
