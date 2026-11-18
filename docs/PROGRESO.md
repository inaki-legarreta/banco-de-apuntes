# Progreso — Banco de Apuntes

## Estado actual
- Último prompt ejecutado: 2 — Login y sesión
- Prompt 1: **cerrado** el 2026-11-17.
- Prompt 2: **implementado** el 2026-11-17; esperando que Iñaki pegue los valores en
  `js/core/config.js` y pruebe los criterios de terminado.
- Qué funciona hoy: esqueleto del proyecto (prompt 0); base de datos en Supabase (prompt 1:
  `perfiles`, `items`, triggers y RLS, aplicadas y verificadas; registro público desactivado
  y primer admin creado); login con email y contraseña, "Recordarme", cierre por
  inactividad, guardia de rutas por hash e inicio provisional con email y rol (prompt 2).
- Qué falta / próximo paso: criterios de terminado del prompt 2; después, prompt 3.

## Dependencias

| Dependencia | Dónde | Versión | Por qué |
|---|---|---|---|
| `@supabase/supabase-js` | Frontend, por CDN (jsDelivr `+esm`), solo en `js/core/supabase.js` | **2.119.0** (exacta; última 2.x estable al 2026-11-17, verificada con `npm view`) | Cliente oficial de Supabase Auth y Postgres (AT2). Única dependencia del frontend (LS2). |

## Migraciones aplicadas
Se anota cada migración cuando Iñaki la ejecuta en el SQL Editor de Supabase.

| Migración | Fecha de aplicación | Verificación |
|---|---|---|
| `001-perfiles.sql` | 2026-11-17 | `verificacion-001-002.sql`: todo `ok = true` |
| `002-items.sql` | 2026-11-17 | `verificacion-001-002.sql`: todo `ok = true` |
| Primer admin (`supabase/manual/hacer-admin.sql`) | 2026-11-17 | Devolvió una fila con `rol = admin` |

## Bitácora (más reciente arriba)

### 2026-11-17 — Prompt 2: login y sesión
- Hecho:
  - `js/core/config.js`: `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` con marcadores
    (`PEGAR_URL_AQUI`, `PEGAR_PUBLISHABLE_KEY_AQUI`), `MINUTOS_INACTIVIDAD = 30`, `RUTA_API`
    y `configuracionCompleta()`. Con marcadores, la app muestra "Falta configurar la app".
  - `js/core/supabase.js`: importa `createClient` de supabase-js **2.119.0** desde jsDelivr
    (`+esm`); cliente único con adaptador de almacenamiento: `localStorage` con
    "Recordarme", `sessionStorage` sin él (LS3). Preferencia en `banco-apuntes:recordarme`.
  - `js/modulos/auth/`: `servicio.js` (iniciarSesion, cerrarSesion, obtenerSesion,
    obtenerPerfil, alCambiarSesion, restaurarSesion, errores en español),
    `inactividad.js` (cierre a los 30 minutos sin uso, solo sin "Recordarme"),
    `pantalla-login.js`, `inicio-provisional.js` (provisional hasta el prompt 4) e
    `index.js`.
  - `js/core/router.js`: ruteo por hash con tabla de rutas, guardia de sesión, sin
    parpadeo de pantallas privadas al arrancar, ruta desconocida → `#/`, mensaje si no
    carga la app.
  - `index.html`: `#app` arranca vacío (antes mostraba la portada provisional).
  - `css/componentes.css`: secciones "Login", "Mensaje de arranque" e "Inicio provisional";
    se quitó la portada del prompt 0.
  - Docs: `CLAUDE.md` (Seguridad y Stack), `docs/modulos/auth.md`, `docs/arquitectura.md`
    (flujo de login y ruteo por hash), `docs/decisiones.md` (tabla "Detalle de AT2 — Login
    y sesión" con LS1–LS4).
  - Verificado: todos los JS parsean; en Edge headless, con marcadores aparece el mensaje
    de configuración, y con una URL de prueba supabase-js carga desde el CDN y
    `#/cualquier-cosa` lleva al login; captura a 390 px correcta. El login real lo prueba
    Iñaki con sus valores.
- Archivos: `js/core/config.js`, `js/core/supabase.js`, `js/core/router.js`,
  `js/modulos/auth/{index, servicio, inactividad, pantalla-login, inicio-provisional}.js`,
  `index.html`, `css/componentes.css`, `CLAUDE.md`, `docs/modulos/auth.md`,
  `docs/arquitectura.md`, `docs/decisiones.md`, `docs/PROGRESO.md`.
- Decisiones o cambios:
  - Nuevas LS1–LS4 (detalle de AT2). La regla de claves de `CLAUDE.md` pasa a LS1.
  - Dependencia nueva: supabase-js 2.119.0 por CDN (ver "Dependencias").
  - Criterios de implementación propios (no cambian decisiones): "Cerrar sesión" usa
    `scope: 'local'` (no cierra las sesiones del usuario en otros dispositivos); si el
    cierre falla sin conexión, se borra la sesión guardada a mano y se recarga en el login.
    Cualquier rechazo 400 de Supabase (email sin confirmar, cuenta bloqueada) muestra el
    mismo mensaje que credenciales inválidas, para no revelar si el email existe.
- Pendientes / dudas para Iñaki:
  - Pegar la URL y la publishable key en `js/core/config.js` y probar los criterios de
    terminado.
  - Sin "Recordarme", la sesión es por pestaña: abrir la app en otra pestaña pide login.
    Es consecuencia de LS3 (`sessionStorage`).
  - Si el navegador restaura la sesión anterior al abrir ("Continuar donde lo dejaste"),
    también restaura `sessionStorage` y la sesión sin "Recordarme" puede seguir abierta;
    igual la cierra la inactividad pasados los 30 minutos.

### 2026-11-17 — Criterios de terminado del prompt 1
- Hecho: Iñaki pasó los criterios de terminado del prompt 1, que habían llegado vacíos, y
  confirmó que se cumplen todos:
  - [x] Existen y están comentados los dos archivos de migración (`001-perfiles.sql`,
    `002-items.sql`) y los dos manuales (`hacer-admin.sql`, `verificacion-001-002.sql`).
  - [x] `verificacion-001-002.sql` da todo `ok = true`.
  - [x] Están actualizados `docs/base-de-datos.md`, `supabase/migraciones/README.md`,
    `.env.example` y `docs/decisiones.md`.
  - [x] `docs/PROGRESO.md` registra el prompt.
  - [x] Push hecho.
- Archivos: `docs/PROGRESO.md`.
- Decisiones o cambios: ninguno.
- Pendientes / dudas para Iñaki: ninguno. No quedan pendientes abiertos del prompt 1.

### 2026-11-17 — Cierre del prompt 1: migraciones aplicadas en Supabase
- Hecho: Iñaki aplicó todo a mano en Supabase:
  - Desactivó el registro público de Supabase Auth (BD4).
  - Corrió `001-perfiles.sql` y `002-items.sql` en el SQL Editor, en orden.
  - Corrió `verificacion-001-002.sql`: las pruebas de comportamiento pasaron y todos los
    chequeos dieron `ok = true`.
  - Creó su usuario y corrió `hacer-admin.sql`, que devolvió `rol = admin` (BD3).
- Archivos: `docs/PROGRESO.md` (tabla "Migraciones aplicadas" y estado actual).
- Decisiones o cambios: ninguno. Desde ahora, 001 y 002 están aplicadas y no se editan:
  cualquier cambio al esquema va en una migración nueva (`003-...`).
- Pendientes / dudas para Iñaki: se cierran los de aplicar las migraciones, verificar,
  marcar el primer admin y desactivar el registro público. Sigue abierto que la sección
  "Criterios de terminado" del prompt 1 llegó vacía (solo como registro). (**Resuelto:**
  ver "Criterios de terminado del prompt 1".)

### 2026-11-17 — Ajustes al prompt 1 (antes de aplicar las migraciones)
- Hecho: como 002 todavía no se había aplicado, se editó `002-items.sql` en lugar de crear
  una migración nueva:
  - Se sacó el índice `items_padre_id_idx`: el índice único `(padre_id, lower(nombre))` ya
    empieza por `padre_id` y cubre esas consultas.
  - Nuevo trigger `items_bloquear_cambio_de_tipo` (before update of `tipo`, función
    homónima): si `new.tipo <> old.tipo` lanza "No se puede convertir una carpeta en
    archivo ni un archivo en carpeta.".
  - `verificacion-001-002.sql`: pruebas de carpeta → archivo y archivo → carpeta (tienen
    que fallar) y de update con el mismo tipo (tiene que andar); chequeos de la función y
    el trigger nuevos; se quitó el chequeo del índice eliminado.
- Archivos: `supabase/migraciones/002-items.sql`, `supabase/manual/verificacion-001-002.sql`,
  `docs/base-de-datos.md`, `docs/PROGRESO.md`.
- Decisiones o cambios: el tipo de un item queda fijo al crearlo. Se cierran los dos
  pendientes del prompt 1 sobre el índice y el cambio de tipo.
- Pendientes / dudas para Iñaki: siguen los de aplicar 001 y 002, verificar y marcar el
  primer admin.

### 2026-11-17 — Prompt 1: base de datos
- Hecho:
  - `supabase/migraciones/001-perfiles.sql`: tabla `perfiles` (rol admin/lector), trigger
    `crear_perfil_al_registrar` en `auth.users` que crea el perfil como lector (BD3),
    función `es_admin()` y RLS (cada usuario lee el suyo, el admin lee todos, sin escritura
    desde el cliente). También crea el perfil de cuentas que ya existieran en `auth.users`.
  - `supabase/migraciones/002-items.sql`: tabla `items` (árbol genérico, AT5/D25) con
    restricciones de nombre, tipo y datos según tipo; índice único `(padre_id,
    lower(nombre))` con `NULLS NOT DISTINCT` (BD1); índice por `padre_id`; triggers de
    `actualizado_en` y de integridad del padre (sin ciclos, mensajes en español); RLS (con
    sesión se lee, solo el admin escribe, nada para anon).
  - Además de RLS, se quitaron a `anon` los permisos sobre ambas tablas y la ejecución de
    `es_admin()` (segunda barrera para RNF5).
  - `supabase/manual/hacer-admin.sql` (primer admin, una sola vez) y
    `supabase/manual/verificacion-001-002.sql` (pruebas de comportamiento que se deshacen
    solas + lista de chequeo con `ok = true/false`).
  - `docs/base-de-datos.md`: esquema, diagrama, RLS, cómo aplicar y paso a paso del admin.
  - `supabase/migraciones/README.md`: procedimiento de aplicación.
  - `.env.example`: aclarado que `SUPABASE_ANON_KEY` guarda la publishable key
    (`sb_publishable_...`) y `SUPABASE_SERVICE_ROLE_KEY` la secret key (`sb_secret_...`).
    El archivo figuraba como borrado en el working tree; se recreó a partir de la versión
    del repo con los comentarios nuevos. El `.env` no se tocó ni se leyó.
  - `docs/decisiones.md`: tabla "Detalle de AT5" con BD1–BD4, ubicada inmediatamente
    después de la tabla de la Etapa 5 (después de AT9), para no partir esa tabla.
- Archivos: `supabase/migraciones/001-perfiles.sql`, `supabase/migraciones/002-items.sql`,
  `supabase/migraciones/README.md`, `supabase/manual/hacer-admin.sql`,
  `supabase/manual/verificacion-001-002.sql`, `docs/base-de-datos.md`, `docs/decisiones.md`,
  `.env.example`, `docs/PROGRESO.md`.
- Decisiones o cambios:
  - Nuevas BD1–BD4 (detalle de AT5).
  - La convención de nombres de migraciones pasa de `AAAAMMDD-NN-descripcion.sql` a
    `NNN-descripcion.sql`, como pide el prompt 1. Los scripts que no son migraciones van en
    `supabase/manual/`.
  - Se agregó `actualizado_en` a `items` (lo pide el prompt 1; AT5 decía "fecha").
- Pendientes / dudas para Iñaki:
  - Aplicar 001 y 002, correr la verificación y marcar el primer admin; anotar las fechas
    en "Migraciones aplicadas".
  - Desactivar el registro público en Supabase Auth (BD4), si no se hizo.
  - `items_padre_id_idx` es redundante con el índice único `(padre_id, lower(nombre))`, que
    ya empieza por `padre_id`. (**Resuelto:** se sacó de `002-items.sql`, ver "Ajustes al
    prompt 1".)
  - El trigger de integridad no cubre un cambio de `tipo` (por ejemplo, una carpeta con
    hijos que pasa a `archivo`). (**Resuelto:** trigger `items_bloquear_cambio_de_tipo`,
    ver "Ajustes al prompt 1".)
  - La sección "Criterios de terminado" del prompt 1 llegó vacía. (**Resuelto:** ver
    "Criterios de terminado del prompt 1".)

### 2026-11-17 — README.md reescrito en UTF-8
- Hecho: se reescribió `README.md` en UTF-8 (antes estaba en UTF-16, git lo trataba como
  binario y GitHub lo mostraba mal). Contiene qué es el proyecto, el stack, cómo levantarlo en
  local con `npx serve` y dónde está la documentación (`decisiones.md` como fuente de verdad).
- Archivos: `README.md`, `docs/PROGRESO.md`.
- Decisiones o cambios: ninguno.
- Pendientes / dudas para Iñaki: ninguno nuevo.

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
    puede reescribir en UTF-8 con una descripción real del proyecto. (Resuelto: reescrito en
    UTF-8, ver "README.md reescrito en UTF-8".)
  - La carpeta padre (`Banco de apuntes/`) todavía tiene su `.git`, su `README.md` y su `.env`
    vacío. Ahora que todo está en este repo, se pueden borrar. (**Resuelto:** Iñaki confirmó y
    se borraron `.git`, `README.md` y `.env` de la carpeta padre. Su remoto era el mismo repo
    del proyecto y su único commit, `0471733`, ya forma parte de nuestra historia (se unió en
    el merge `6223d01`). No tenía otras ramas, stashes ni cambios aparte del `.env` vacío, así
    que no se perdió nada.)

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
