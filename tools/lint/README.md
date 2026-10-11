# tools/lint — revisió i format del codi

Eines de desenvolupament. **El web no les fa servir**: només GitHub (a la revisió automàtica) i qui programa.

| Eina | Què fa | Configuració |
|------|--------|--------------|
| **ESLint** | Busca errors al JavaScript: variables no definides, codi que no s'executa mai, claus repetides… | `tools/lint/eslint.config.mjs` |
| **Prettier** | Deixa el codi de `js/` i `tests/` amb el mateix format (sagnat, cometes, salts de línia) | `.prettierrc.json` i `.prettierignore` (a l'arrel) |

Són en aquesta carpeta, i no a l'arrel, perquè un `package.json` a l'arrel faria que Node avisés (`MODULE_TYPELESS_PACKAGE_JSON`) cada vegada que els tests carreguen un mòdul ES de `js/`. Les versions són exactes (sense `^`) i el `package-lock.json` les fixa: el CI i el Codespace fan exactament el mateix.

## Ús (des de l'arrel del repositori)

```
npm ci --prefix tools/lint                                            # instal·lar (un sol cop)
tools/lint/node_modules/.bin/eslint -c tools/lint/eslint.config.mjs .  # revisar
tools/lint/node_modules/.bin/prettier --write .                        # formatar
tools/lint/node_modules/.bin/prettier --check .                        # comprovar el format
```

## A GitHub

- ESLint s'executa a cada pujada a `main` i a cada pull request. Els **errors** fan sortir la ✗ vermella; els **avisos** (p. ex. una variable que no es fa servir) no.
- Prettier només es comprova a les pull requests, perquè pujar un fitxer a mà no faci sortir una ✗ vermella per una qüestió de format.

## Què es revisa i què no

- **ESLint** revisa `js/` (mòduls ES), `tests/` i `tools/servidor.js`. No revisa `js/legacy/` (el motor antic són scripts clàssics que comparteixen variables globals: ESLint hi veuria centenars de «no definit»; s'esborra a la PR 15) ni el JavaScript que encara va a dins dels HTML.
- **Prettier** formata només `js/` (sense `js/legacy/`) i `tests/`. No toca els HTML ni els CSS (porten estils i, en alguns casos, JS a dins; reformatar-los faria canvis enormes i difícils de revisar), ni els documents, ni les eines.
- Als **tests de navegador** hi ha funcions que s'executen dins de la pàgina (`page.evaluate(…)`) i hi llegeixen alguns noms interns (`ACTIVITIES_ESO`, `PRODUCTS`, `svgTwoSteps`…). Estan declarats a `eslint.config.mjs`: si una pàgina els canvia, el test falla i s'ha d'adaptar.

## Des del Codespace

El Codespace instal·la aquestes eines la primera vegada que es crea (`postCreateCommand` de `.devcontainer/devcontainer.json`), i `tools/desa.sh` les fa servir abans de publicar cada canvi (vegeu [`COM-TREBALLAR.md`](../../COM-TREBALLAR.md)). En un Codespace que ja existia, instal·la-les amb l'ordre de dalt (`npm ci --prefix tools/lint`).
