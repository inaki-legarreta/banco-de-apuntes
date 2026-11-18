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
  - `docs/prompts-claude-code.md` todavía dice "región São Paulo" en la Preparación y cita
    rutas `claude/...`; AT9 ya registra us-west-2 (Oregón). No se tocó porque es un documento
    del proyecto de claude.ai.
  - El commit no se subió a GitHub (no se hizo push).
