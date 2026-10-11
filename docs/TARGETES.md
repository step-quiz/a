# Targetes de vocabulari per imprimir (PR 13c-bis)

> **Document viu.** La pàgina és [`targetes.html`](../targetes.html); el codi, a [`js/targetes/`](../js/targetes/) (`generador.js` la lògica, `vista.js` l'HTML, `targetes.js` la pantalla) i els estils, a [`css/targetes.css`](../css/targetes.css). Les paraules i les imatges surten del lèxic ([`LEXIC.md`](LEXIC.md)): no hi ha cap llista a part, i una paraula nova al lèxic surt sola a les targetes.

## Què és

Una eina **del professorat** per imprimir les paraules del banc del lèxic (la imatge i la paraula amb article: *la poma*, *el triangle rectangle*) com a targetes: **208 targetes en 20 temes**, objectes de cada dia i els 144 termes de matemàtiques ([`VOCABULARI-MATES.md`](VOCABULARI-MATES.md)). Serveixen per **penjar a l'aula**, per **jugar a aparellar** i per fer **targetes de doble cara** (la imatge al davant i la paraula al darrere). S'hi arriba des de la portada («Targetes de vocabulari per imprimir»). No és una activitat: l'alumnat no la fa servir.

## Com es fa servir (1 minut)

1. Obre `targetes.html` i marca els **temes** (o clica «Cap» i marca'n només un).
2. Tria **quantes targetes per pàgina**: 1 (un cartell), 4 o 9.
3. Tria **què porten**: *imatge i paraula*, *només la imatge*, *només la paraula* o *doble cara*.
4. Tria el **color**: *blanc i negre* (per defecte) o *color*.
5. Clica **«Imprimeix»**. A la finestra d'impressió, tria **paper A4** i **escala 100 %** (o desa-ho en PDF).

Es veu a l'instant com quedarà cada pàgina. El que tries queda a l'adreça de la pàgina, i es pot desar o passar a una altra persona:

```
targetes.html?temes=mat-figures,mat-algebra&mida=9&contingut=doblecara&color=bn
```

| Paràmetre | Valors | Per defecte |
|---|---|---|
| `temes` | els temes del lèxic, separats per comes (`mat-figures`, `animals`…); en blanc, cap | tots |
| `mida` | `1`, `4` o `9` targetes per pàgina | `9` |
| `contingut` | `tot` (imatge i paraula), `imatge`, `paraula` o `doblecara` | `tot` |
| `color` | `bn` (blanc i negre) o `color` | `bn` |

## Doble cara: imatge davant, paraula darrere

Amb *doble cara* cada grup de targetes fa **dues pàgines seguides**: el davant, amb les imatges, i el darrere, amb les paraules. S'imprimeix **a dues cares, girant el full per la vora llarga**; després es retalla i, si es vol, es plastifica (com les targetes de consulta de [`step-quiz/pi`](https://github.com/step-quiz/pi)).

Perquè la paraula quedi just darrere de la seva imatge, al darrere **cada fila va girada d'esquerra a dreta**: la targeta de la columna 1 del davant és a la columna 3 del darrere (en una pàgina de 9, la fila *a b c* del davant és *c b a* al darrere). Si un grup no omple la pàgina, les caselles que sobren queden buides al davant i al darrere. El peu de cada pàgina diu «davant» o «darrere».

## Les regles del paper

Vénen del material de [`step-quiz/pi`](https://github.com/step-quiz/pi) (vegeu-ne els [criteris de disseny](https://github.com/step-quiz/pi/blob/main/1eso/docs/CRITERIS-DISSENY.md)), que ja imprimeix tot el que fa. Cada regla és aquí amb la seva comprovació (`tests/navegador/targetes.test.js`):

| Regla | Com es compleix a les targetes | Comprovació |
|---|---|---|
| **Blanc i negre estricte**: les diferències es fan amb grisos, gruix i subratllat; s'imprimeix en B/N al centre | Per defecte, tot en grisos: el color és una opció. La peça destacada d'un mini-exemple (groga en color) es veu en gris **i subratllada**. Un emoji és una imatge en color: es porta a gris | cap color que no sigui un gris |
| **Cos de 14 pt cap amunt** (tot el que llegeix l'alumnat) | La paraula és la més gran que hi cap, a partir de l'amplada del seu tros més llarg, mesurat amb la lletra que té de debò el navegador (`targetes.js`). Per això **no hi ha 16 per pàgina**: a 9, la paraula més petita fa 17 pt; a 16, una paraula com *proporcionalitat* quedaria per sota de 14 | cap paraula per sota de 14 pt, a 1, 4 i 9 per pàgina, amb totes les 208 |
| **La lletra d'impremta del paper**: Verdana (DejaVu Sans on no hi és, gairebé igual d'ampla: el que es mesura és el que s'imprimeix) | `font-family: Verdana, 'DejaVu Sans', sans-serif` als fulls | — |
| **Primer el dibuix, després la paraula** i **molt d'aire, cap paràgraf** | Cada targeta és una imatge i una paraula, res més | — |
| **Cada pàgina cap en un A4** | Un full de 210 × 296 mm (1 mm menys que l'A4, perquè cap navegador hi afegeixi una pàgina en blanc), amb 10 mm de marge dins del full i `@page` sense marge: així el navegador no hi posa la capçalera ni el peu (data i adreça) | el PDF d'1, 4 i 9 per pàgina i a doble cara té exactament les pàgines que toca, en A4; res no surt de la targeta ni de la pàgina |
| **Un peu per a qui ordena les pàgines** (a `pi`, «Targeta de … · cara 1») | «Targetes de vocabulari · 3 / 12» al marge de baix, fora de les targetes (a doble cara, «davant» o «darrere») | — |

Les imatges dels termes de matemàtiques tenen l'escala de les cartes de l'[àlbum](../album.html): tot el que hi cap a l'àlbum hi cap a la targeta, i una imatge no surt mai de la seva targeta.

## Com està fet

- **Pàgina i mida.** Cada targeta és un contenidor (`container-type: inline-size`): tot el que porta a dins té les mides en `cqw`, relatives a la seva amplada. Així una targeta surt igual de ben proporcionada a la vista prèvia (un full de 560 px) que al paper (210 mm), i amb 1, 4 o 9 per pàgina.
- **Impressió.** `@media print` amaga el formulari, posa cada full a 210 × 296 mm i hi talla la pàgina. Qui vulgui un PDF, el pot desar des de la finestra d'impressió.
- **La paraula.** `targetes.js` mesura, amb un `canvas`, quant fa en «em» el tros més llarg de cada paraula i el posa a `--w`; el CSS en treu `font-size: min(12cqw, 88cqw / --w)`.
- **Doble cara.** `pagines()` de `generador.js` reparteix les targetes i `emmirallat()` gira les files del darrere; el test comprova, per a totes les targetes i les tres mides, que cada paraula és darrere de la seva imatge.

## Què no hi ha (encara)

- **PDF ja fets al repositori**, com els de `pi/pdf/` (un per tema, a doble cara, en blanc i negre). Ara el PDF es fa des de la finestra d'impressió. Si es volen, caldria una eina que els generi amb Chromium i una prova que digui que no han quedat vells després de canviar el lèxic.
- **Una lletra manuscrita o de pal** per a l'alumnat que n'aprèn l'escriptura (a `pi` n'hi ha una de pròpia, Caveat). Ara es fa servir una lletra del sistema.
