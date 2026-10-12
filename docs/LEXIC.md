# El lèxic: vocabulari controlat

L'alumnat de l'aula d'acollida només ha de llegir paraules que el professorat ha vist i validat, i les mateixes paraules han de tornar d'una activitat a l'altra (principi 5 del [pla](PLA.md)). Per això hi ha un **registre de totes les paraules que l'alumne pot llegir**: el lèxic.

> Estat: PR 13c (el vocabulari matemàtic). Abans, PR 13b (l'àlbum de paraules). Abans, PR 13a (el banc de paraules de «Vocabulari»: 65 paraules amb imatge) i PR 7. El registre, els textos centralitzats i el control són de la PR 6a; les **imatges** de les paraules (emojis i pictogrames) i `paraula()`, de la PR 6b; la targeta **«Aprèn la paraula»** i el distintiu de «paraula nova», d'aquesta PR 7.

## On és cada cosa

| Fitxer | Què hi ha |
|---|---|
| `js/lexicon/dades.js` | **El lèxic**: la llista de paraules (`LEXIC`), els temes (`TEMES`) i les paraules gramaticals (`FUNCIONALS`). Només dades. |
| `js/lexicon/lexicon.js` | L'API: posa una paraula en català correcte (`forma`, `ambArticle`, `preposicio`, `quantitat`). |
| `js/lexicon/mates.js` | Les **imatges dels termes de matemàtiques** (mini-exemples en HTML i dibuixos SVG propis), per al camp `imatge: { mates: 'id' }` (PR 13c). |
| `js/lexicon/relacions.js` | Quan la imatge d'una paraula **també és un exemple d'una altra** (un triangle rectangle també és un polígon): perquè les opcions equivocades de **Vocabulari** mai no siguin també certes (PR 13c). |
| `js/lexicon/pictogrames.js` | Els **pictogrames SVG propis** (de moment, els de l'edifici —pis, planta baixa, soterrani— i la moneda de «canvi»). |
| `js/lexicon/paraula.js` | `paraula()`: una paraula **amb la seva imatge**, en HTML, per posar dins d'un text; i `textParaula()`, només el text. |
| `js/lexicon/targeta.js` | **Aprèn la paraula** (sense DOM): què mostra la targeta d'una paraula i quines paraules l'alumne ja ha vist. |
| `js/targeta-paraula.js` | **Aprèn la paraula** (DOM): la targeta, el toc, el teclat, el focus i el distintiu «paraula nova». |
| `js/textos.js` | Els textos del **motor comú** (puntuació, fi de sessió, pantalla final…) i `format()`. |
| `js/<activitat>/textos.js` | Els textos de **cada activitat** (p. ex. `js/a-enters/textos.js`). |
| `css/shared.css` | Els estils de les paraules amb imatge (`.paraula`, `.paraula-img`, `.pict`, `.pict-*`) i de la targeta (`.targeta-paraula`, `.paraula-nova`). |
| `tests/check-lexicon.js` | **El control**: falla si algun text porta una paraula que no és al lèxic. |
| `tools/paraules-noves.js` | Llista les **paraules** i les **imatges noves** d'una PR, per enganxar-les a la descripció. |

Els textos que no canvien mai (el títol d'una pàgina, el text d'un botó fix…) són a l'HTML de l'activitat; la prova també els comprova.

## Com s'afegeix una paraula

Es fa a `js/lexicon/dades.js`, a la llista `LEXIC`, dins del tema que toqui. Segons el tipus:

**Un nom** (una cosa): singular, plural, gènere i article. `concret: true` si es pot dibuixar: aleshores **ha de portar `imatge`** (vegeu «Les imatges de les paraules»).

```js
{ id: 'poma', tipus: 'nom', singular: 'poma', plural: 'pomes', genere: 'f', article: 'la', tema: 'botiga', concret: true, imatge: { emoji: '🍎' } },
{ id: 'inici', tipus: 'nom', singular: 'inici', plural: 'inicis', genere: 'm', article: "l'", tema: 'joc' },
```

- `article`: `'el'`, `'la'` o `"l'"` (davant de vocal o *h*). La prova avisa si no encaixa amb el gènere o amb la primera lletra. Si l'article no s'apostrofa tot i començar per vocal (*la unitat*), afegeix `elisio: false`.
- El plural de l'article (*els*, *les*) surt sol del gènere.

**Un verb, un adjectiu o una altra paraula:** totes les formes que poden sortir als textos, **l'infinitiu inclòs**.

```js
{ id: 'pujar', tipus: 'verb', formes: ['pujar', 'pujo'], tema: 'moviment' },
{ id: 'correcte', tipus: 'adjectiu', formes: ['correcte', 'correcta', 'correctes'], tema: 'nombres' },
```

L'`id` és estable: en minúscules, sense accents ni espais (`'planta-baixa'`). No es reutilitza mai.

**Una paraula gramatical** (article, preposició, enllaç): s'afegeix a `FUNCIONALS`. Cada paraula gramatical nova també és una paraula nova per validar.

**Un tema nou:** s'afegeix a `TEMES`.

## Com es fa servir en un text

Els textos són a `textos.js`, amb les parts que canvien entre `{claus}`:

```js
sessio: 'Sessió {n} de {total}',
ajudaFrase: 'Si estic {lloc} i {accio}, en quin {pis} acabo?',
```

```js
import { format } from '../textos.js';
import { preposicio, quantitat } from '../lexicon/lexicon.js';

format(TEXTOS.sessio, { n: 1, total: 3 });   // «Sessió 1 de 3»
preposicio('a', 'pis');                      // «al pis»      (a + el = al)
preposicio('a', 'planta-baixa');             // «a la planta baixa»
preposicio('de', 'inici');                   // «de l'inici»
quantitat(1, 'pis');                         // «1 pis»
quantitat(2, 'pis');                         // «2 pisos»
```

`format()` falla si falta algun valor, i el lèxic falla si l'`id` no hi és: una errada de lletra no arriba mai a l'alumne.

## La instrucció de cada pregunta

Cada activitat diu què cal fer amb **una frase molt curta** (D13), sota la capçalera i sempre al mateix lloc. Es posa amb `mostraInstruccio(text)` de `js/game-core.js` (el segon paràmetre és una nota més petita, només a Factoritzar). El text és a `textos.js` com qualsevol altre i passa pel mateix control del lèxic:

```js
// js/a-equacions/textos.js
instruccio: 'Escriu el valor de {x}.',
// js/a-equacions/a-equacions.js, a buildLevel()
mostraInstruccio(format(TEXTOS.instruccio, { x: 'x' }));
```

Regles: màxim sis paraules, una sola ordre i els verbs de sempre (*Escriu*, *Tria*, *Toca*, *Marca*; *Escull* a «Prioritat d'operacions»). Una lletra o un símbol que canvia (la lletra del punt, `x`, `<`, `>`) es passa com a valor `{entre claus}`, perquè no compta com a paraula. Si la frase depèn del tipus de pregunta, la tria és lògica pura al generador (`formaInstruccio()` a Coordenades i Temperatura) i es prova des de Node. `tests/navegador/instruccions.test.js` comprova la frase de cada activitat, nivell i tipus.

## Les imatges de les paraules

Cada paraula concreta porta la seva imatge, al camp `imatge` de la mateixa entrada. Decisió D7: **un emoji del sistema** i, a la mínima sospita que no n'hi hagi cap de bo (que es vegi diferent segons el dispositiu, que sigui ambigu o que no existeixi), **un pictograma SVG propi**.

```js
{ id: 'pujar', tipus: 'verb', formes: ['pujar', 'pujo'], tema: 'moviment', imatge: { emoji: '⬆️' } },
{ id: 'pis', tipus: 'nom', /* … */ concret: true, imatge: { pictograma: 'pis' } },
```

Una entrada porta **o bé** `emoji` **o bé** `pictograma` (el nom d'un dels de `js/lexicon/pictogrames.js`), mai tots dos. Els verbs i les altres paraules també en poden portar (⬆️ per a *pujar*); només les paraules `concret` ho han de fer.

### Posar una paraula amb imatge en un text

`paraula()` torna l'HTML de la paraula amb la seva imatge davant, dins d'una «píndola». `textParaula()` torna només el text, amb les mateixes opcions:

```js
import { paraula, textParaula } from '../lexicon/paraula.js';

textParaula('pis', { prep: 'a' });   // «al pis»
paraula('pis', { prep: 'a' });
// <span class="paraula" data-paraula="pis"><span class="paraula-img" aria-hidden="true"><svg …/></span><span class="paraula-text">al pis</span></span>
```

| Paraula | Opcions |
|---|---|
| Un nom | per defecte, amb article («el pis»); `plural: true` («els pisos»); `article: false` («pis»); `prep: 'a' \| 'de' \| 'per'` («al pis», «del pis», «pel pis») |
| Un verb, un adjectiu o una altra paraula | `forma` (una de les seves formes; per defecte, la primera: `forma: 'pujo'`) |

Si una opció no té sentit (el plural d'un verb, una forma que la paraula no té) o el pictograma no existeix, **falla** en lloc de mostrar res d'estrany a l'alumne.

Quan una activitat munta una frase, convé escriure-la **una sola vegada** i fer-li rebre la funció que escriu les paraules, perquè el text i l'HTML no puguin divergir (és el que fa `a-enters`: `fraseAjuda(a, op, b, p)`, amb `textAjuda` = `textParaula` i `htmlAjuda` = `paraula`):

```js
function fraseAjuda(a, op, b, p) {
    const lloc = a > 0 ? `${p('pis', { prep: 'a' })} ${a}` : /* … */;
    return format(TEXTOS.ajudaFrase, { lloc, accio: /* … */, pis: p('pis', { article: false }) });
}
export const textAjuda = (a, op, b) => fraseAjuda(a, op, b, textParaula);
export const htmlAjuda = (a, op, b) => fraseAjuda(a, op, b, paraula);
```

El text surt de `textos.js` i continua sent el que controla la prova de vocabulari; la imatge només s'hi afegeix en pintar-lo (`element.innerHTML = htmlAjuda(…)`).

`a-decimals` (PR 8b) ho fa encara amb menys frases: `js/a-decimals/vista.js` construeix la botiga (cada producte, «el bitllet», «total» i «canvi» són `paraula()` i la resta són xifres i símbols) i `exemplesDeText()` de `js/a-decimals/generador.js` en llista els noms (els 16 productes, en plural els que es compren en plural, «total», «canvi» i «el bitllet») perquè la prova de vocabulari els comprovi.

### Accessibilitat

- La **imatge és decorativa** (`aria-hidden="true"`): el text ja diu la paraula i és el que llegeix un lector de pantalla («Si estic al pis 5 i baixo 2 pisos, en quin pis acabo?»). Els pictogrames són `aria-hidden` i `focusable="false"`.
- `data-paraula` porta l'`id` de la paraula: és el que fa servir la targeta «Aprèn la paraula» (vegeu més avall).
- Els colors són a `css/shared.css` i es poden canviar des de cada activitat amb `--paraula-vora`, `--paraula-fons` i `--paraula-destac`. Amb l'alt contrast del sistema (`forced-colors`) els pictogrames fan servir els colors del sistema.

### Com s'afegeix un pictograma

1. A `js/lexicon/pictogrames.js`, una funció que torni un `<svg class="pict" viewBox="0 0 32 32" aria-hidden="true" focusable="false">…</svg>` i una entrada a `PICTOGRAMES` (el nom és l'`id` que es posarà a `imatge`).
2. Sense colors a l'SVG: només les classes `pict-fons` (el que no es destaca), `pict-destac` (el que la paraula nomena), `pict-negre`, `pict-apagat` i `pict-linia` (un traç sense farcit), que pinta el CSS. Sense `<script>`, `style`, imatges externes ni gestors d'esdeveniments (la prova ho comprova).
3. A l'entrada del lèxic: `imatge: { pictograma: 'el-nom' }`.
4. Mirar-lo a 17, 32 i 80 px; **la prova de navegador** comprova que es veu i que no surt de la píndola.

## Aprèn la paraula: la targeta

Tota paraula amb imatge feta amb `paraula()` es pot **tocar**: s'obre una **targeta** amb la imatge gran i la paraula (amb l'article i, als noms, el plural), **sense àudio** (D8: la professora, que parla català, és qui diu la paraula). Per a l'alumne és un botó; per a l'activitat no cal fer res, perquè ho posa en marxa `injectSharedHTML()` de `game-core.js`: les activitats que es migrin ho tindran de sèrie.

**Com funciona**

- Un clic, un toc o Intro/Espai amb el teclat a una paraula obre la targeta: la imatge (uns 144 px), «el soterrani», «els soterranis» i un botó «OK». Un verb porta l'infinitiu («pujar») i la fletxa, sense plural. Una paraula **sense imatge** no és un botó: la targeta només tindria el text.
- És un `<dialog>` modal. Es tanca amb «OK», amb Esc o tocant fora. El focus hi entra i, en tancar-la, torna on era: al camp de resposta, si l'alumne hi escrivia, o a la paraula, si hi havia arribat amb el teclat.
- Mentre és oberta, **cap tecla no arriba al joc**: Intro a «OK» no envia la resposta escrita al camp. Obrir targetes no gasta intents, ni punts, ni canvia la pregunta.
- **Distintiu «paraula nova»**: la paraula que l'alumne encara no ha obert porta una vora d'un altre color i un **punt** a la cantonada (sense text: no cal llegir res). En obrir-ne la targeta, el distintiu desapareix de totes les paraules iguals, també de les preguntes següents, i es recorda al navegador (`localStorage`, clau `a2-paraules-vistes`). Si el navegador no deixa desar res (mode privat), la paraula només es dona per vista mentre la pàgina és oberta, però res no falla.

**Per al professorat.** Les paraules vistes es recorden **per navegador**, no per alumne: en un ordinador compartit, una paraula que un alumne ja ha obert ja no és «nova» per al següent. Per veure-ho tot com a nou, obre l'activitat en una finestra privada o, a la consola del navegador, escriu `localStorage.removeItem('a2-paraules-vistes')`.

**Accessibilitat.** Cada paraula és un botó (`role="button"`, `tabindex="0"`): s'hi arriba amb el tabulador i el focus es veu (contorn de 3 px). A les pantalles tàctils fa 44 px d'alt com a mínim (zona de toc de `css/accessibilitat.css`). La targeta té nom accessible (la paraula) i la imatge és `aria-hidden`. Amb l'alt contrast del sistema, el punt de «paraula nova» i els pictogrames passen als colors del sistema.

**Proves.** `tests/lexicon.test.js` (què mostra la targeta de cada paraula i les paraules vistes, amb un emmagatzematge de mentida: dades trencades, bloquejat…), `tests/navegador/targeta.test.js` (bloc `targeta`: ratolí, teclat, toc en mòbils de 320 a 390 px, focus, distintiu, `localStorage` bloquejat) i la guarda de `tests/check-repo.js` (`game-core.js` posa en marxa la targeta i les activitats carreguen `css/shared.css`).

## Què comprova `tests/check-lexicon.js`

Només a les pàgines de l'alumne que ja van amb el motor nou (les altres hi entraran quan es migrin): les activitats, l'[àlbum de paraules](../album.html) i la [portada d'icones de l'alumnat](PORTADA.md) (`alumnat.html` i `js/portada/textos.js`, que té el títol i el nom de cada fitxa). Les pàgines del professorat (`index.html`, `targetes.html`) hi són exemptes, i també el **peu legal** d'una pàgina de l'alumne (`<footer data-legal>`: l'autoria i la llicència, que són per als adults). Per això el peu és l'únic text de l'alumne que no passa pel control: no hi poseu res més.


1. Cada paraula dels textos, de les frases que genera l'activitat i del text fix de la seva pàgina HTML és al lèxic o a `FUNCIONALS`.
2. Cada `TEXTOS.clau` que el codi fa servir existeix, i cap text queda sense fer servir.
3. Cap text porta `<`, `>`, `&` ni cometes dobles (es posen tal qual a l'HTML).

Un error té aquest aspecte i diu quina paraula falta i on és:

```
✗ 62 textos
    js/a-enters/textos.js → ajudaFrase: «acabo»   (text: «Si estic {lloc} i …»)
```

La solució és afegir la paraula al lèxic (vegeu més amunt) o canviar el text.

`tests/lexicon.test.js` comprova, a més, que les dades són coherents (cap `id` repetit, articles que encaixen amb el gènere i amb la primera lletra, cada paraula concreta amb imatge, cada pictograma existent i ben format: SVG amb `viewBox` i `aria-hidden`, sense `<script>`, `style` ni imatges externes…), que l'API fa bé els articles, les contraccions (*al*, *del*, *pel*) i els apòstrofs, i que `paraula()` escapa el text i marca la imatge com a decorativa. Als tests de navegador, les píndoles i els pictogrames es miren pintats: mida, color, que no sobresurtin i el que llegiria un lector de pantalla, també amb l'ajuda oberta a 320, 360 i 390 px.

## Com es validen les paraules noves

Cada pull request que afegeixi paraules ha de llistar-les a la descripció, a l'apartat **Paraules noves per validar**. Les treu l'eina:

```
git fetch origin main
node tools/paraules-noves.js
```

Surt una taula per tema amb la paraula, el tipus, les formes i la imatge (o «cal imatge», si és concreta i encara no en té) i, a part, les **imatges noves o canviades** de paraules que ja hi eren. El professorat, en fusionar la PR, valida aquestes paraules i imatges.

## Pendent

- **A cada activitat que es migri:** els seus textos a `js/<activitat>/textos.js` i les seves paraules al lèxic.

## El banc de paraules («Vocabulari»)

L'activitat [`a-vocabulari`](../a-vocabulari.html) treballa **tots els noms concrets amb imatge** del lèxic (`concret: true` i `imatge`), per temes (`?tema=`). Per afegir-hi una paraula n'hi ha prou d'afegir-la al lèxic amb la seva imatge (vegeu més amunt): surt sola a «Vocabulari», perquè no hi ha cap llista a part. Cal que no repeteixi la imatge d'una altra paraula (la prova ho vigila: els distractors no poden tenir la mateixa imatge). Temes del banc: escola, animals, natura, menjar, transport, casa, la botiga i l'edifici. Sense àudio (D8).

Les [targetes de vocabulari per imprimir](TARGETES.md) (PR 13c-bis) també surten del mateix banc: una paraula nova amb imatge hi surt sola.

L'[àlbum de paraules](../album.html) (PR 13b) mostra el mateix banc, per temes: n'hi ha prou de posar una paraula nova al lèxic perquè hi surti. **Un tema nou amb paraules amb imatge necessita la seva icona** a `ICONES_TEMES` de `js/album/logica.js` (la prova ho comprova). Els textos de l'àlbum són a `js/album/textos.js` i també els vigila `tests/check-lexicon.js`.

### Escriure una paraula (nivell 3): tolerància i solucions curtes (PR 13c-ter)

**Tolerància.** Com a `vocabulari` d'`operacions`, una errada petita no és un error: `avaluaEscrita` (`js/a-vocabulari/generador.js`) diu si el que s'ha escrit és `correcta`, `general` (✔ 🔍), `propera` (cap intent perdut: surt lletra a lletra i es pot corregir) o `mal` (un intent menys).

| Què s'ha escrit | Veredicte | Marques |
|---|---|---|
| la paraula, amb o sense l'article, en majúscula o minúscula, amb o sense el punt volat («parallelogram») | correcta | tota ✔ (amb la paraula bona) |
| un accent equivocat («tomaquet») | propera | ´ a la lletra |
| una lletra equivocada, de més o que falta («tomquet»), fins a 1 lletra en una paraula de 5 lletres o menys i fins a 2 en una de més llarga | propera | ✖ al lloc (una lletra que falta surt com a «_» i no desplaça les altres) |
| dues lletres seguides al revés («trinagle») | propera | ⇄ a les dues |
| les paraules d'un terme en un altre ordre («enter nombre») | propera | ⇄ a l'espai |
| una paraula que falta («nombre» per a «nombre enter») | propera | una «_» per lletra de la que falta |
| una paraula més general que també és certa («triangle») | general | ✔ 🔍 |
| una altra paraula del banc, tot i ser molt semblant («quadrant» per a un quadrat; «MCM» per a «MCD») | mal | com qualsevol error |
| qualsevol altra cosa | mal | lletra a lletra |

**Solucions curtes.** Al nivell 3 no es pregunta cap paraula que s'hagi d'escriure amb més de `LLARGADA_MAXIMA_ESCRITA` (14) caràcters: «propietat commutativa» (21) o «simplificar una fracció» (23) són massa llargues per escriure-les sense tenir-les davant. En queden fora 20 de les 208 paraules del banc ([`VOCABULARI-MATES.md`](VOCABULARI-MATES.md)); als nivells de triar, hi surten totes. Si en un banc no queda cap paraula curta (un tema amb només termes llargs), es pregunta una de llarga en lloc de quedar-se sense preguntes. Per canviar el límit n'hi ha prou de canviar aquest número (les proves el diuen: `tests/activitats.test.js`).

## El vocabulari matemàtic (PR 13c)

Els termes de matemàtiques no es poden dibuixar amb un emoji. Tenen la seva pròpia imatge, un **mini-exemple o un dibuix**: `imatge: { mates: 'id' }`, amb la imatge a `js/lexicon/mates.js` (HTML o SVG propis; la peça que el terme anomena, destacada amb `.mat-dest`). Qui afegeix un terme:

1. L'afegeix a `dades.js` en un dels temes `mat-…` (vegeu [`VOCABULARI-MATES.md`](VOCABULARI-MATES.md)): un nom amb `concret: true` i `imatge: { mates: 'id' }`; una frase o una sigla amb `banc: true` (els que no són noms no entren al banc sols). Una sigla, a més, amb `sigla: true` i la forma en majúscula (`formes: ['MCD']`): és l'única excepció a la regla que les formes van en minúscula.
2. Hi posa la imatge a `MATES` de `mates.js`, amb les peces de dalt del fitxer (`fr`, `D`, `pw`, `svg`, `poligon`…). Les expressions llargues, amb `matp()` (més petites).
3. Mira si la seva imatge **també és un exemple d'una altra paraula** i, si és que sí, ho diu a `js/lexicon/relacions.js` (vegeu més avall).
4. Passa `node tests/run-all.js`: comprova que la imatge existeix, és única i no porta res extern.

**Atenció amb els articles:** davant de vocal, un nom femení que comença per *i* o *u* àtones no s'apostrofa (*la incògnita*, *la igualtat*, *la hipotenusa*): `elisio: false`.

### Que cap opció equivocada no sigui també certa

La imatge d'un triangle rectangle també és la d'**un triangle**, **un polígon** i **una figura**. Si «el polígon» sortís com a opció equivocada, l'alumne que el triï tindria raó. Per evitar-ho, [`js/lexicon/relacions.js`](../js/lexicon/relacions.js) diu quines paraules també són certes per a la imatge d'una altra. Té dues taules:

- **`PARE`**: la jerarquia («és un»), que es transmet: un triangle rectangle → un triangle → un polígon → una figura.
- **`TAMBE`**: fets d'una imatge concreta, que no es transmeten: la imatge de la hipotenusa és un triangle rectangle; la del dividend és una divisió sencera; el 5 de la imatge del nombre positiu també és natural, senar i primer.

I `tambeEs(id)` en torna el conjunt (pares + fets + els pares dels fets). **Vocabulari** (`js/a-vocabulari/generador.js`) l'aplica així:

| Nivell | Què es vigila |
|---|---|
| 1 · imatge → paraula | cap opció equivocada és `tambeEs` de la imatge preguntada |
| 2 · paraula → imatge | cap imatge equivocada és d'una paraula que tingui la preguntada a `tambeEs` (a «el polígon», cap triangle ni quadrat) |
| 3 · escriure | si l'alumne escriu una d'aquestes paraules («triangle» per a un triangle rectangle) és certa però no la que es busca: surt **✔ 🔍** («n'hi ha una de més concreta») i **no costa cap intent** |

Els distractors, a més, es trien **del mateix tema**; si no n'hi ha prou, **de la mateixa família de temes** (`FAMILIES_DE_TEMES`: línies, figures, elements i cossos; nombres, operacions i fraccions; àlgebra i funcions; mesura i estadística; els objectes del dia a dia; animals, natura i transport); i només al final, de qualsevol altre. Així a «el polígon» no li toca una poma, ni a «el pis» un quocient.

**En cas de dubte, afegiu la relació.** Treu una opció possible de les moltes que hi ha; una relació que falta fa que l'alumne trobi dues respostes correctes. Quan una imatge ensenya una part destacada d'un tot (el dividend dins de `12 ÷ 3 = 4`), el que es pregunta és la part destacada; per això el *divisor* o el *quocient* no hi són a `TAMBE` (la peça destacada és una altra), però la *divisió* sí. `tests/activitats.test.js` comprova que totes les paraules de les taules existeixen al banc, que la jerarquia no té cicles, que cada tema del banc és a una família i que, per a cada paraula del banc i als dos nivells de triar, hi ha 3 distractors i cap d'ells és també cert.
