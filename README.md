# a — Operacions manipulatives adaptades

Activitats d'operacions matemàtiques amb suport visual, pensades per a alumnat amb adaptació. Cada bloc té una activitat i un tutorial.

Web: https://a.step-quiz.net

## Contingut

| Fitxer | Bloc |
|---|---|
| `index.html` | Portada i accés a les activitats |
| `a-enters.html` · `a-enters-tutorial.html` | Nombres enters |
| `a-decimals.html` · `a-decimals-tutorial.html` | Decimals |
| `a-diners.html` | Diners |
| `a-equacions.html` · `a-equacions-tutorial.html` | Equacions |
| `a-proporciodirecta.html` · `a-proporciodirecta-tutorial.html` | Proporcionalitat directa |
| `a-rellotge.html` · `a-rellotge-tutorial.html` | El rellotge |
| `a-equacions-debug.html` | Eina de proves |

## Estructura

```
js/     motor de les activitats (utils, config, game-core) i mòduls de decimals
css/    shared.css i chromebook.css
```

## Relació amb el projecte «operacions»

Aquestes activitats van sortir del projecte [`operacions`](https://github.com/step-quiz/operacions), on vivien dins de la carpeta `a/`. En separar-les, els fitxers de `js/` i `css/` se'n van copiar per fer el repositori autònom.

**Això vol dir que hi ha còpies duplicades.** Si corregeixes un error a `js/game-core.js`, `js/utils.js`, `js/config.js` o als fitxers de `css/`, mira si cal fer el mateix canvi a `operacions`. Els mòduls de `js/decimals/` també són compartits.

<!-- atribucio-centre:inici -->

---

Material desenvolupat per **David Arso Civil** per al Departament de Matemàtiques de l'INS Miquel Tarradell.
Contingut sota CC BY-SA 4.0, codi sota llicència MIT. Vegeu [`LLICENCIA.md`](LLICENCIA.md).

<!-- atribucio-centre:final -->
