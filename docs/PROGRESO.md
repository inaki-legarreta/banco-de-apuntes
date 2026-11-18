# Progreso — Banco de Apuntes

## Estado actual
- Último prompt ejecutado: 0 — Base del proyecto
- Qué funciona hoy: esqueleto del proyecto con la estructura de AT4. `index.html` muestra
  "Banco de Apuntes" centrado, con fondo azul oscuro y tipografía Manrope, usando los tokens
  DS5. Reglas permanentes en `CLAUDE.md`, arquitectura en `docs/arquitectura.md` y un doc por
  módulo en `docs/modulos/`. Sin lógica de negocio.
- Qué falta / próximo paso: prompt 1 — Base de datos (tablas `items` y `perfiles`, RLS,
  primera migración en `supabase/migraciones/`).

## Bitácora (más reciente arriba)

### 2026-11-17 — CLAUDE.md: forma de trabajo y regla de .env
- Hecho: se agregó a `CLAUDE.md` la sección "Forma de trabajo": leer `docs/PROGRESO.md` al
  iniciar cada sesión, hacer solo lo que pide el prompt actual (lo demás se anota como
  pendiente) y hacer push a `origin` al cerrar cada prompt. En "Seguridad" se sumó: nunca
  leer, mostrar ni copiar el contenido de `.env`.
- Archivos: `CLAUDE.md`, `docs/PROGRESO.md`.
- Decisiones o cambios: reglas nuevas de proceso para Claude Code; no cambia ninguna decisión
  de `docs/decisiones.md`.
- Pendientes / dudas para Iñaki: siguen abiertos los de la entrada anterior (`README.md` en
  UTF-16 y los restos de la carpeta padre).

### 2026-11-17 — Cierre del prompt 0: unión con el remoto y primer push
- Hecho: se unió la historia local con `origin/main` (`git pull origin main
  --allow-unrelated-histories`, merge `6223d01`), sin conflictos. El remoto solo tenía
  `0471733 first commit` con un `README.md`; no había duplicados de archivos movidos (por
  ejemplo `docs/docs/`), así que no hizo falta un commit de borrado. Primer push a `origin`.
- Archivos: `README.md` (llega desde el remoto; está en UTF-16 y solo dice
  `# banco-de-apuntes`), `docs/PROGRESO.md`.
- Decisiones o cambios: se conserva la historia del remoto (se descartó el force push).
- Pendientes / dudas para Iñaki:
  - `README.md` está en UTF-16: GitHub lo muestra raro y git lo trata como binario. Se
    puede reescribir en UTF-8 con una descripción real del proyecto.
  - La carpeta padre (`Banco de apuntes/`) todavía tiene su `.git`, su `README.md` y su `.env`
    vacío. Ahora que todo está en este repo, se pueden borrar.

### 2026-11-17 — Cierre del prompt 0: quitar copia de prompts
- Hecho: se eliminó `docs/prompts-claude-code.md` del repo. La fuente de verdad de los
  prompts es el proyecto de claude.ai y se pasan de a uno.
- Archivos: `docs/prompts-claude-code.md` (eliminado), `docs/PROGRESO.md`.
- Decisiones o cambios: el repo ya no guarda copia de los prompts. Se quitó el pendiente sobre
  "región São Paulo" (ya resuelto en AT9).
- Pendientes / dudas para Iñaki:
  - La carpeta padre (`Banco de apuntes/`) tiene su propio `.git` con el **mismo remoto**
    (`inaki-legarreta/banco-de-apuntes`), y GitHub `main` apunta a su commit `0471733`
    ("first commit", solo un README). No se borró nada. La historia de este repo no tiene
    relación con ese commit, así que el push necesita una decisión: sobrescribir `main` o
    unir las dos historias. (Resuelto: se unieron, ver la entrada siguiente.)

### 2026-11-17 — Prompt 0: base del proyecto
- Hecho:
  - Estructura de carpetas de AT4: `css/`, `js/core/`, `js/modulos/{auth, explorador,
    archivos, busqueda, admin}/`, `js/ui/`, `api/`, `supabase/migraciones/`, `docs/modulos/`.
  - `CLAUDE.md` con las reglas permanentes (stack, prohibiciones, convenciones, comentarios,
    separación de responsabilidades, módulos, seguridad, mobile-first, trazabilidad).
  - `css/tokens.css` con los tokens DS5 (se agregó `--degrade-dorado`, derivado de los
    dorados, para no repetir el degradé en cada componente). `css/base.css` (reset y
    globales) y `css/componentes.css` (solo la portada provisional).
  - `index.html` mínimo: Manrope desde Google Fonts, los tres CSS y `js/core/router.js` como
    módulo.
  - Esqueletos comentados de `js/core/config.js`, `supabase.js`, `router.js` y de cada
    `js/modulos/<nombre>/index.js`.
  - `package.json` solo para `/api`, sin dependencias. `.gitignore` y `.env.example` con las
    siete variables vacías y comentadas.
  - READMEs en `api/`, `supabase/migraciones/` y `js/ui/` (explican qué va en cada carpeta y
    permiten versionarlas aunque estén vacías).
  - `docs/arquitectura.md` (resumen AT1–AT9 y diagrama en texto) y docs de los 5 módulos.
- Archivos: `CLAUDE.md`, `index.html`, `package.json`, `.gitignore`, `.env.example`,
  `css/tokens.css`, `css/base.css`, `css/componentes.css`, `js/core/config.js`,
  `js/core/supabase.js`, `js/core/router.js`, `js/modulos/*/index.js`, `js/ui/README.md`,
  `api/README.md`, `supabase/migraciones/README.md`, `docs/arquitectura.md`,
  `docs/PROGRESO.md`, `docs/modulos/*.md`, `docs/decisiones.md` (movido),
  `docs/prompts-claude-code.md` (movido).
- Decisiones o cambios:
  - El registro de decisiones estaba en `docs/docs/registro-decisiones.md`; se movió a
    `docs/decisiones.md`, que es la ruta que indican la Preparación (paso 5) y este prompt.
    El doc de prompts se movió de `docs/docs/` a `docs/prompts-claude-code.md`. Sin cambios
    de contenido. No se modificó ninguna decisión.
  - Asignación de prompts a módulos documentada en `docs/modulos/`: la gestión de carpetas
    (prompt 5, RF6) vive en `explorador`; renombrar/mover/borrar archivos (RF8) y el .zip
    (prompt 7) viven en `archivos`.
- Pendientes / dudas para Iñaki:
  - En la carpeta padre (`Banco de apuntes/`) hay otro repo git con un commit "first commit"
    (solo un README) y un `.env` vacío sin trackear. El proyecto real es este repo
    (`banco-de-apuntes/`, remoto `inaki-legarreta/banco-de-apuntes`). Conviene decidir si el
    repo de la carpeta padre se borra para evitar confusiones. El `.env` real debería vivir
    dentro de `banco-de-apuntes/` (ya está en `.gitignore`).
  - El commit no se subió a GitHub (no se hizo push). (Resuelto en el cierre del prompt 0.)
