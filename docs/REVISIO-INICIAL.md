# Revisió inicial d'a2 (2026-10-10)

> Revisió del codi heretat (`step-quiz2/a2` al commit `70007d9`, còpia de les activitats adaptades per a necessitats educatives especials) feta **abans** de convertir-lo en el projecte per a l'aula d'acollida. Les línies citades són del commit `70007d9` i poden haver canviat. Cada troballa indica quin pas del [pla](PLA.md) la resol; quan es resolgui, s'hi afegeix «✅ PR n».

## Mètode

- Lectura de tot el codi (HTML, JS i CSS) i comparació amb `operacions` al commit `3bb77b6` (només lectura).
- Proves amb Chromium (Playwright) a 1366×768 i a 360×700 tàctil: càrrega de totes les pàgines, partides completes de cada activitat, 4.000 mostres de cada generador de problemes, tutorials executats fins al final i navegació només amb teclat.
- Els scripts de prova **no són al repositori**; es convertiran en proves automàtiques a la PR 4.
- **No** s'ha provat amb Chromebooks ni mòbils reals.

## Què està bé

- Sintaxi JavaScript correcta (20 blocs en línia i 5 fitxers externs).
- Cap `eval` ni risc d'XSS: tot el que escriu l'usuari passa per `escapeHtml`, `textContent` o enters validats.
- Generadors matemàticament correctes: solucions enteres, divisions exactes, canvi sempre positiu i cap bucle infinit (comprovat per a tots els rangs de proporcionalitat).
- Cap `id` duplicat ni enllaç intern trencat (llevat de R9).

## Troballes

### Crítiques

- **R1 · Doble enviament de la resposta** (`a-enters`, `a-equacions`, `a-proporciodirecta`, `a-diners`). Durant la pausa posterior a un encert, `isTransitioning` continua a `false`; un segon Intro o un doble clic a «OK» torna a executar `finishOperation()` / `finishEquation()`: duplica resultat i punts i salta preguntes. `a-rellotge` (comentari `[FIX]` a `finishOperation()`) i `a-decimals` (`showInlineFeedback()`) ja ho eviten, i `operacions` fa `state.isTransitioning = true`.
  **Arreglament:** primera instrucció de `finish*()`: `isTransitioning = true;` (validat en una còpia). Llocs: `a-enters.html:741`, `a-equacions.html:791`, `a-proporciodirecta.html:985`, `a-diners.html:912`. → ✅ **PR 2** (guarda afegida a `a-enters`, `a-equacions` i `a-proporciodirecta`; `a-diners` retirada); es manté al motor nou (PR 5).
- **R2 · `a-rellotge` genera el codi d'exercici `XX`.** Falta `'a-rellotge': 'AR'` a `EXERCISE_CODES` de `js/game-core.js` (l'analitzador d'`operacions` ja el té). → ✅ **PR 2** (desapareix tot el sistema de codis).
- **R3 · Llicència contradictòria.** `LICENSE` i `LLICENCIA.md`: CC BY-NC-SA 4.0 + MIT. El README deia «CC BY-SA»; el peu d'`index.html` (l.314-319) mostra la insígnia BY-SA, enllaça a `by-sa` i diu «CC BY-NC-ND 4.0» (i alhora «es pot adaptar», incompatible amb ND). El peu correcte és a `index.html` d'`operacions`. → README: ✅ **PR 1**; peu d'`index.html`: ✅ **PR 3** (CC BY-NC-SA 4.0 per al contingut i MIT per al codi, amb enllaç a `LLICENCIA.md` i sense la insígnia de tercers).
- **R4 · Es perden els paràmetres anant al tutorial i tornant-ne.** Cinc activitats naveguen sense `location.search` (`a-enters.html:784`, `a-equacions.html:829`, `a-proporciodirecta.html:1023`, `a-decimals.html:1108`, `a-diners.html:951`, i els tutorials de retorn). Només `a-rellotge` el conserva. L'alumne que obre el tutorial torna amb els valors per defecte (sessions, preguntes, intents, nivell) i no amb els del professor.
  **Arreglament:** afegir `+ window.location.search` a cada redirecció. → ✅ **PR 3** (les 8 redireccions de les quatre activitats i els seus tutorials; comprovat anant i tornant amb sessions, preguntes, intents i nivell).

### Mitjanes

- **R5 · Punts = 0 en una resposta correcta amb ≥ 5 errors.** La fórmula `10 − errors·2` és idèntica a les sis activitats; amb 6 intents o més (el generador d'enllaços en permet fins a 8) un encert tardà mostra «Intents esgotats ❌ 0 punts». Proposta: mínim d'1 punt si és correcta i que el missatge depengui de l'encert, no dels punts. → ✅ **PR 3** (`puntsPregunta()` a `js/game-core.js`: un encert val sempre ≥ 1 punt, de manera que «Molt bé!» i «Intents esgotats» ja no es confonen; «+1 punt» en singular).
- **R6 · Resultats truncats a 30.** `recordResult()` i `copiarResultats()` limiten a 30 resultats, i `LIMITS` (`js/config.js`) permet 20 sessions i 30 preguntes mentre que el codi només en representa 5 i 10. → ✅ **PR 2** (sense codis, ja no hi ha resultats per pregunta).
- **R7 · Tutorial de decimals amb una funció inexistent.** `a-decimals-tutorial.html:682` crida `svgTwoSteps()`, que no existeix (ni a `a2` ni a `operacions`): `ReferenceError` i el panell visual del pas «Tens dos productes…» queda buit. → ✅ **PR 3** (`svgTwoSteps()` implementada: pas 1 «suma dels dos preus», fletxa i pas 2 «bitllet − total», amb l'estat «resolt»).
- **R8 · `a-rellotge.html`: botó «Tutorial» comentat amb el listener actiu** (l.393-398 i l.955): `TypeError` a cada càrrega, i el tutorial és inaccessible. → ✅ **PR 3** (el listener només s'enllaça si el botó existeix). **El botó continua amagat**: sembla una decisió de l'autor; si es vol tornar a mostrar, cal descomentar-ne l'HTML i el CSS.
- **R9 · `a-diners.html` és una versió antiga duplicada d'`a-decimals.html`.** Mateix títol, script semblant només un 36 %, no surt a l'`index`, no fa servir els mòduls compartits i el botó «Tutorial» porta a `a-diners-tutorial.html`, que no existeix (404). → ✅ **PR 2** (retirada; D4 acceptada).
- **R10 · `a-equacions`: els nivells no coincideixen amb la capçalera.** Mesurat amb 4.000 mostres: el N2 genera 34 % `x−b=c` i 34 % `a·x=b` (la capçalera diu només `x+b=c`); el N3 també inclou `a·x=b`; `x−b=c` té rangs més grans (b≤8, x≤12) que `x+b=c` a tots els nivells. → **Onada C** (decidir la intenció i alinear codi i documentació).
- **R11 · `a-enters`: `?rang=` no fa res.** Està documentat (capçalera i exemple) però `RANG` es declara i no s'usa; la generació fixa `MAX_A = MAX_B = 12`. → ✅ **PR 5a** (`?rang=` arriba al generador, que és a `js/a-enters/generador.js`, amb proves de Node i una de navegador).
- **R12 · `index.html`.**
  (a) El selector d'activitat no rep focus amb Tab (cap `tabindex`, `role` ni `aria-*`).
  (b) «Copia» no té `catch`: si falla el porta-retalls no hi ha cap missatge.
  (c) A 360 px els tres botons circulars flotants se superposen al peu.
  (d) Carrega recursos de tercers (`licensebuttons.net` i `upload.wikimedia.org`).
  → ✅ **PR 3** (a: selector amb Tab, fletxes, Home/End, Intro/Espai i Esc, amb ARIA de *combobox*; b: alternativa amb `execCommand` i, si tampoc funciona, l'enllaç queda seleccionat amb un missatge; c: la icona de Step Quiz és dins del peu, que ja no és fix; d: cap recurs de tercers; el botó d'ajuda és «▶ Tutorial» i obre el tutorial de l'activitat).
- **R13 · Icones.** `icon.png` i `icon-green.png` són idèntics (mateix hash, 1536×1024, 212 KB cadascun) i `icon-green.png` és la sabata **blava**. La verda real és a `app/icon-green.png` d'`operacions` (3,4 KB). → ✅ **PR 3** (`icon-green.png` verda de 3,4 KB i `icon.png` blava de 6,4 KB, tots dos d'`operacions`).
- **R14 · Mòbil de 360 px.** `a-proporciodirecta` desborda uns 22 px (`.title-row` fa 404 px) i «8 €» es parteix en dues línies. → ✅ **PR 3** (a `a-proporciodirecta`, en pantalles estretes el botó «Tutorial» baixa a la línia següent del títol, l'etiqueta «Dada»/«Busca» va a part i cap quantitat ni preu es parteix; comprovat a 320, 360 i 390 px amb tots els productes. La resta d'activitats no canvien).
- **R25 · El generador d'enllaços apuntava a un altre web.** `index.html` construïa els enllaços amb `BASE_URL = 'https://a.step-quiz.net/'` (el web de `step-quiz/a`): qui copiava un enllaç des d'aquest web obria l'altre. Es va veure en saber que `a2` es publica a <https://step-quiz2.github.io/a2/>. **Arreglament:** base calculada a partir de la URL de la pàgina (`new URL('.', window.location.href).href`). → ✅ **PR 2**.

### Menors

- **R15 · Accents que falten a la interfície de l'alumne** (`js/game-core.js`): «Sessio», «Molt be!», «Comencar sessio seguent», «mes alta obte», «La nota mitjana es», «Configuracio invalida». `operacions` ja els té corregits. → ✅ **PR 2** (accents corregits al motor).
- **R16 · Informe.** A `a-equacions` mostra «Equació 1» sense dir quina equació era; el «Copiar codi» de l'Informe no mostra cap confirmació; `console.log` del codi a `game-core.js`. → ✅ **PR 2** (revisió visual en lloc de l'Informe de text; `a-equacions` mostra l'equació; fora el `console.log` i el «Copiar codi»).
- **R17 · Teclat tàctil d'`a-rellotge`:** el «→» no salta d'hores a minuts. → **Onada A**.
- **R18 · `a-decimals`.** Codi mort a la generació del N1 (`availableCoins`, `chosen` i una clau amb `+ 9999`); al N3 el 58 % dels preus surten del rang versemblant del catàleg (p. ex. «Poma 3,80 €»); «Passar al nivell X ›» recarrega la pàgina sense confirmar; el comentari «3 valors únics» és erroni (n'hi ha 12). → **Onada A**.
- **R19 · Comentaris i capçaleres desfasats.** `FITXER: a/a-decimals-v2.html` i `a/a-rellotge.html`; «Default 5, màx 10» quan és 12; el tutorial d'enters diu «−7 a +7» i dibuixa −6..5; `diners-feedback.js` diu «compartit amb diners.html», que ja no existeix. → a mesura que es migrin.
- **R20 · Moviment i eines.** Cap `prefers-reduced-motion`; el TODO-2 del tutorial d'equacions (botó de pausa de 34 px, objectiu de 48 px) continua pendent; `a-equacions-debug.html` era públic i sense `noindex` (✅ retirada a la **PR 2**). → ✅ **PR 4b** (`prefers-reduced-motion` a totes les pàgines i botó de pausa dels tutorials de 48 px amb la icona gran, que era el TODO-2); `a-equacions-debug`: ✅ **PR 2**.
- **R21 · `index.html` incomplet.** Només ofereix 4 de les 6 activitats (falta `a-proporciodirecta`) i l'etiqueta «Nombres decimals» obre «Diners i canvi». → ✅ **PR 3** (`a-proporciodirecta` afegida i etiqueta «Diners i canvi (decimals)»); la portada completa, **PR 13**.
- **R22 · Sense xarxa de seguretat.** Cap CI, prova, lint, `.gitignore` ni Prettier; l'historial és «Initial commit» + «Add files via upload». → ✅ **PR 4a** (CI amb dos treballs, proves de Node i de navegador, `.gitignore`, `.nojekyll`, Codespace i `tools/desa.sh`, que ja no deixa desar amb el missatge «Add files via upload»); ESLint i Prettier, ✅ **PR 5a** (amb els mòduls ES). `COM-TREBALLAR.md`: ✅ **PR 1**.
- **R23 · Contrast WCAG AA** (text normal ≥ 4,5:1 sobre blanc). No hi arriben `--success #10b981` (2,54), `--danger #ef4444` (3,76) ni `.score-text #059669` (3,77). `operacions` usa `#047857` (5,48) i `#dc2626` (4,83). → ✅ **PR 4b** (`css/tokens.css`; també `--text-muted` `#475569`, el botó de fi de sessió, els punts, els errors i els grisos dels glifs i subtítols dels tutorials; comprovat amb axe-core a cada pantalla).
- **R24 · Cobertura matemàtica dels tutorials parcial.** Només es van poder revisar 13 operacions escrites literalment, totes correctes; la resta es calcula per codi. → informatiu: es revisa a cada migració.
