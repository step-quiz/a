# Com treballar amb el repositori

Guia pas a pas per fer canvis al web **sense perdre el fil** de què s'ha canviat. Les ordres dels requadres grisos es poden copiar i enganxar tal qual.

> Aquesta guia és la d'[`operacions`](https://github.com/step-quiz/operacions/blob/main/COM-TREBALLAR.md) adaptada a `step-quiz/a`. Les eines que s'hi expliquen (`tools/servidor.js`, `tools/desa.sh` i les comprovacions automàtiques) són de la PR 4a del [pla](docs/PLA.md); ESLint i Prettier, de la PR 5a.

## Per què

Els canvis que arriben com a fitxers pujats per la web de GitHub, amb el missatge automàtic *«Add files via upload»*, deixen un historial on:

- no es veu **què** ha canviat ni **per què**;
- és difícil **desfer** un canvi concret si alguna cosa s'espatlla.

La idea és senzilla: **cada canvi amb un missatge que expliqui què fa**. A GitHub, a la pestanya **Commits**, l'historial es veu com una llista llegible; qualsevol canvi es pot consultar línia per línia i desfer amb una sola ordre.

## On es publica el web

El web es publica amb **Cloudflare Pages** des de la branca `main` d'aquest repositori: <https://a.step-quiz.net/>. Cada vegada que `main` canvia (una *pull request* fusionada, un canvi des de la web de GitHub, un zip a `_uploads/` o un `git push`), Cloudflare el torna a publicar al cap d'un minut aproximadament.

Si algun dia s'ha de refer la configuració: al tauler de Cloudflare, **Workers & Pages → el projecte → Settings → Builds** (sense ordre de *build*; carpeta de sortida: l'arrel `/`) i **Custom domains → `a.step-quiz.net`**.

> Només es publica `main`: una *pull request* **no té previsualització** pròpia. Més avall veuràs com provar-la abans de fusionar-la.

## Tres maneres de fer un canvi

| Quan | Com |
|------|-----|
| Un canvi que em demanes a mi (Claude) | Jo preparo una *pull request*; tu només l'has de fusionar (vegeu [Les pull requests de Claude](#les-pull-requests-de-claude)). |
| Un canvi petit (un text, una xifra) | Directament a la web de GitHub (vegeu [Des de la web de GitHub](#des-de-la-web-de-github)). |
| Canvis més grans, diversos fitxers o un pegat en zip | Amb el **Codespace** (vegeu [El Codespace](#el-codespace)). |

---

## Les pull requests de Claude

Quan et faig una *pull request*, et passo l'enllaç. Només n'hi ha **una d'oberta alhora**: fins que no la fusiones, no en preparo cap altra.

1. **Mirar-la** (opcional): a la pestanya **Files changed** hi veus els canvis línia per línia.
2. **Provar-la abans de fusionar-la** (opcional): com que només es publica `main`, cal fer-ho al Codespace (vegeu [El Codespace](#el-codespace)). Escriu al terminal:
   ```
   git fetch origin
   git checkout claude/loving-clarke-9ip43l
   ```
   El servidor de prova ja hi és engegat (vegeu [Veure les activitats mentre les canvies](#veure-les-activitats-mentre-les-canvies)): obre el port 8000 i prova-ho. Quan acabis, torna a `main`:
   ```
   git checkout main
   ```
   **Abans de fusionar**, mira també que la PR tingui la ✓ verda de les [comprovacions automàtiques](#comprovacions-automàtiques): a la pestanya **Conversation**, a sobre del botó de fusionar, hi surt «All checks have passed».
3. **Fusionar-la**: pestanya **Conversation**, a baix de tot → **Merge pull request** → **Confirm merge**.
4. **Comprovar la publicació**: al cap d'un minut, obre <https://a.step-quiz.net/> (si no veus el canvi, prem `Ctrl+F5`). Si alguna cosa no et convenç, digue-m'ho: ho corregeixo a la pull request següent o ho desfem.
5. **No cal fer res amb la branca** `claude/…`: la reutilitzo per a la pull request següent (si GitHub t'ofereix **Delete branch**, és igual).
6. Si tens el Codespace obert, porta-hi els canvis:
   ```
   git checkout main
   git pull
   ```

---

## Des de la web de GitHub

**Editar un fitxer**

1. Obre el fitxer a GitHub i clica el llapis ✏️ (a dalt a la dreta).
2. Fes el canvi.
3. Clica el botó verd **Commit changes…**.
4. Al quadre **Commit message**, esborra el text proposat i **escriu què has canviat**, per exemple: `Enters: corregit l'enunciat del nivell 2`.
5. Deixa marcat *Commit directly to the main branch* i clica **Commit changes**.

**Pujar fitxers**

Fes **Add file → Upload files** i, abans de clicar **Commit changes**, escriu també aquí el missatge al primer quadre. Evita deixar-hi *«Add files via upload»*.

---

## El Codespace

Un Codespace és un ordinador al núvol, amb un editor (VS Code) dins del navegador, que ja té el repositori a dins. Té dues parts que farem servir:

- **L'explorador de fitxers**, a l'esquerra.
- **El terminal**, a baix: és on s'escriuen (o s'enganxen) les ordres. Si no el veus, menú ☰ → **Terminal → New Terminal**.

### Obrir-lo

1. Ves a <https://github.com/step-quiz/a>.
2. Botó verd **Code** → pestanya **Codespaces**.
3. La primera vegada: **Create codespace on main**. Les altres vegades: clica el nom del codespace que ja tens.

La primera vegada triga un parell de minuts.

### Veure les activitats mentre les canvies

Quan s'obre un Codespace **nou**, el servidor de prova s'engega sol (ho fa la configuració de la carpeta `.devcontainer`). A baix a la dreta surt un avís: *«Your application running on port 8000 is available»*. Clica **Open in Browser** i s'obrirà el web en una pestanya nova.

- Si no veus l'avís: pestanya **PORTS** (a la part de baix) → fila del port **8000** → icona del globus 🌐.
- Si el servidor no hi és (per exemple, en un Codespace que ja tenies d'abans), escriu al terminal:
  ```
  node tools/servidor.js
  ```
  Per aturar-lo: `Ctrl+C`. Si surt *«El port 8000 ja està ocupat»* és que ja el tens engegat: no cal fer res més. També funciona l'ordre de sempre, `python3 -m http.server 8000`.

Cada vegada que desis un fitxer, torna a carregar la pestanya del web (`F5`) i veuràs el canvi (el servidor no guarda res a la memòria cau).

### Abans de començar a treballar (cada vegada)

Porta al Codespace els canvis que hi hagi a GitHub (per exemple, les *pull requests* que has fusionat):

```
git checkout main
git pull
```

### Fer els canvis

- **Editar**: obre el fitxer a l'explorador de l'esquerra, fes el canvi i desa'l amb `Ctrl+S`.
- **Un pegat en zip**: arrossega el fitxer `.zip` a l'explorador de l'esquerra (a sota de tot, fora de qualsevol carpeta). Mira què conté:
  ```
  unzip -l nom-del-pegat.zip
  ```
  Si els camins que surten són com `js/game-core.js` o `a-enters.html` (**sense** cap carpeta al davant), descomprimeix-lo sobre el repositori i **esborra el zip** (el `.gitignore` ja evita que es publiqui, però no cal guardar-lo):
  ```
  unzip -o nom-del-pegat.zip
  rm nom-del-pegat.zip
  ```
  Si hi ha una carpeta al davant (per exemple `a2/js/…`), no el descomprimeixis: pregunta-m'ho.

### Desar i publicar

Quan el canvi funcioni, escriu al terminal (amb el teu missatge entre cometes):

```
tools/desa.sh "Enters: el nivell 3 arriba fins a 20"
```

L'script fa quatre coses i **et demana confirmació** abans de publicar res:

1. **Posa el codi en format** (Prettier). Només toca el JavaScript de `js/` i `tests/`. Si les eines no estan instal·lades, t'ho diu i continua (per instal·lar-les: `npm ci --prefix tools/lint`).
2. **Passa els tests i la revisió del codi** (ESLint; uns segons). Si en falla algun, t'ho diu i et pregunta si vols desar igualment: si ho fas, GitHub mostrarà una ✗ vermella al costat del canvi.
3. **Ensenya la llista de fitxers que canvien** (`M` = modificat, `??` = nou, `D` = esborrat) i et pregunta si els vols desar amb aquest missatge. Contesta `s` (sí) o `n` (no).
4. **Els desa i els publica a GitHub.** Si algú altre havia publicat alguna cosa abans, primer la porta i ho ajunta; si no es poden ajuntar (heu canviat les mateixes línies), t'ho diu i **no publica res** (vegeu [Si alguna cosa surt malament](#si-alguna-cosa-surt-malament)).

El missatge ha de tenir almenys 10 lletres i no pot portar cap etiqueta com `[skip ci]` (vegeu més avall). Al cap d'un minut el canvi es veu a <https://a.step-quiz.net/> (l'estat de la publicació és al tauler de Cloudflare, a **Workers & Pages → el projecte → Deployments**).

**Si prefereixes fer-ho a mà**, aquestes són les ordres que fa l'script:

```
git status
git add -A
git commit -m "Enters: el nivell 3 arriba fins a 20"
git push
```

1. `git status` ensenya quins fitxers has canviat. Mira que siguin només els que esperes.
2. `git add -A` els prepara tots per publicar-los.
3. `git commit -m "…"` els desa amb el teu missatge.
4. `git push` els publica a GitHub.

**Bons missatges** (què + on):

- `Enters: el feedback de la resta diu quin signe cal`
- `Índex: afegeix l'enllaç a l'activitat del rellotge`
- `Enters: el nivell 3 arriba fins a 20`

**Missatges que no ajuden**: `canvis`, `arreglat`, `Add files via upload`.

> **Mai** hi posis `[skip ci]`, `[ci skip]` ni `[cf-pages-skip]` al missatge: el web podria no publicar-se (Cloudflare Pages no publica cap commit que les porti; GitHub Pages podria fer el mateix). `tools/desa.sh` no deixa desar un missatge amb aquestes etiquetes, i les comprovacions de les *pull requests* les detecten al títol, a la descripció i als missatges.

### Veure què has canviat

| Per veure… | Ordre |
|---|---|
| quins fitxers has canviat i encara no has desat | `git status` |
| les línies exactes que has canviat (surt amb la tecla `q`) | `git diff` |
| els últims canvis desats | `git log --oneline -15` |

A GitHub, la pestanya **Commits** mostra el mateix historial, i clicant un canvi es veuen les línies en verd (afegides) i vermell (tretes).

### Desfer

**Un canvi que encara no has desat** (torna el fitxer com estava):

```
git restore nom-del-fitxer.html
```

**Un canvi ja publicat**: busca'n el codi (les 7 lletres del principi) amb `git log --oneline -15`, i després (canviant `1a2b3c4` pel codi):

```
git revert --no-edit 1a2b3c4
git push
```

Això crea un canvi nou que desfà l'antic, de manera que l'historial queda sencer.

### Comprovacions automàtiques

Cada vegada que es puja alguna cosa a `main` o s'obre una *pull request*, GitHub executa sol unes comprovacions i hi deixa un **✓ verd** (tot correcte) o una **✗ vermella** (alguna cosa s'ha trencat). Les veus:

- al costat de cada canvi, a la pestanya **Commits**;
- a una *pull request*, a la pestanya **Conversation**, a sobre del botó de fusionar;
- a la pestanya **Actions** del repositori (workflow *Tests*).

Són dues:

| Comprovació | Què fa | Quant triga |
|---|---|---|
| **Comprovacions** | Mira la sintaxi de tot el codi, que no hi hagi enllaços trencats ni «id» repetits, que cada `import` dels mòduls porti a un fitxer i a un nom que existeixen, que no es descarregui res de tercers, que no tornin errors que ja s'havien corregit, i les funcions del motor i de les activitats. Passa **ESLint** (variables sense definir, codi que no s'executa mai…). Vigila el **vocabulari**: cada paraula que llegeix l'alumne ha de ser al lèxic ([`docs/LEXIC.md`](docs/LEXIC.md)). A les *pull requests* també mira el format (**Prettier**) i que ni el títol ni els missatges portin `[skip ci]` ni etiquetes semblants (farien que GitHub no publiqués el web). | Uns segons |
| **Navegador (Chromium)** | Obre les activitats en un navegador de debò i hi juga: partides senceres, punts, la targeta «Aprèn la paraula», «Diners i canvi» (la botiga, els imports i les respostes), tutorials, la portada i els mòbils estrets. També revisa l'**accessibilitat** de cada pantalla (contrast dels colors, ús només amb teclat, moviment reduït, camps i botons prou grans en mòbil). | Uns 4 minuts |

**Si surt una ✗:** clica **Details** (o la pestanya **Actions**), obre la comprovació que falla i busca les línies que comencen per `✗`. Copia'n el text i enganxa'l a la conversa amb mi.

**Provar-ho al Codespace** (opcional): les «Comprovacions» es poden executar quan vulguis, sense instal·lar res:

```
node tests/run-all.js
```

Les del navegador necessiten instal·lar Playwright i el navegador **una sola vegada** (uns 150 MB):

```
npm ci --prefix tools/proves
tools/proves/node_modules/.bin/playwright install chromium
node tests/navegador/run.js
```

Per passar només un bloc: `node tests/navegador/run.js portada` (els blocs són `jocs`, `targeta`, `decimals`, `proporcio`, `ordenar`, `rellotge`, `recta`, `mcdmcm`, `factoritzar`, `fraccions`, `areaperimetre`, `triangle`, `placartesia`, `equacions`, `potencies`, `nombres`, `prioritat`, `vocabulari`, `album`, `targetes`, `tutorials`, `portada`, `mobil` i `accessibilitat`).

Per veure les **paraules noves** d'una branca respecte de `main` (és el que va a l'apartat «Paraules noves per validar» de cada pull request):

```
git fetch origin main
node tools/paraules-noves.js
```

La revisió del codi i el format (ESLint i Prettier) s'instal·len **una sola vegada** (un Codespace nou ho fa sol) i després es fan servir així:

```
npm ci --prefix tools/lint
tools/lint/node_modules/.bin/eslint -c tools/lint/eslint.config.mjs .
tools/lint/node_modules/.bin/prettier --write .
```

Els tests de Node necessiten **Node 22** o més nou (el Codespace i GitHub en tenen); amb una versió més antiga els tests dels mòduls ES et diran què cal.

### Si alguna cosa surt malament

- **`git push` diu que s'ha rebutjat** (algú, o una *pull request*, ha canviat coses a GitHub mentrestant): porta-les i torna-ho a provar.
  ```
  git pull
  git push
  ```
- **`git pull` diu que no ha pogut ajuntar els canvis** (s'han tocat les mateixes línies): escriu `git merge --abort` i demana-m'ho enganxant el que surt amb `git status`.
- **Et surt una pantalla estranya plena de `~`**: és l'editor *vim*. Escriu `:q` i prem Enter per sortir.
- **Qualsevol altre missatge d'error**: copia'l sencer i enganxa'l a la conversa amb mi.

### En acabar

No cal tancar res: el Codespace s'atura sol al cap d'una estona sense fer-lo servir. Recorda, però, que **el que no hagis publicat amb `git push` només és al Codespace**, i GitHub esborra els Codespaces que fa setmanes que no s'obren.
