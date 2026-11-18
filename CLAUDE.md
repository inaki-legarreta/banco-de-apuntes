# CLAUDE.md — Reglas permanentes de Banco de Apuntes

## Qué es el proyecto
"Banco de Apuntes" es una app web privada donde Iñaki guarda y encuentra los apuntes de la
carrera, ordenados como un Drive (árbol genérico de carpetas y archivos), accesible desde
cualquier dispositivo. No tiene lógica académica ni de negocio (D28).

**`docs/decisiones.md` es la fuente de verdad.** Si algo pedido contradice una decisión
registrada ahí, **frenar y avisar antes de implementar**. Nunca resolver la contradicción en
silencio.

## Forma de trabajo
- Al iniciar cada sesión, **leer `docs/PROGRESO.md`** antes de hacer cualquier cosa.
- **Alcance:** hacer solo lo que pide el prompt actual. Lo que surja fuera de eso se anota
  como pendiente en `docs/PROGRESO.md`, no se implementa.
- Al cerrar cada prompt (criterios de terminado cumplidos), **hacer push a `origin`**.

## Stack y prohibiciones
- Hosting y funciones de servidor: **Vercel** (frontend estático + funciones en `/api`) — AT1.
- Login y base de datos: **Supabase** (Auth + Postgres; la base guarda solo metadatos) — AT2.
- Archivos: **Cloudflare R2** (bucket privado, links firmados de corta duración) — AT3, AT6.
- Frontend: **HTML + CSS + JavaScript puro con módulos nativos (`import`/`export`)** — AT4.
- **Prohibido:** frameworks, bundlers o cualquier paso de compilación, TypeScript, librerías
  de UI. El frontend no usa npm; `package.json` existe solo para las funciones de `/api`.
- **Toda dependencia nueva** (frontend o `/api`) se justifica en `docs/PROGRESO.md`.
- **supabase-js** se carga por CDN (jsDelivr) con **versión fija** (LS2) y es la **única
  dependencia del frontend**. Solo la importa `js/core/supabase.js`. Cambiar la versión se
  anota en `docs/PROGRESO.md`.

## Convenciones
- Archivos y carpetas: en **español** y en **kebab-case** (`arbol-carpetas.js`).
- Variables y funciones: en **español** y en **camelCase** (`cargarCarpeta`).
- Comentarios: en **español**.
- Commits: en español, con formato `tipo(módulo): descripción`.
  Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `chore`.

## Comentarios (P3)
- **Cada archivo empieza con un bloque de comentario** que dice qué es y qué responsabilidad
  tiene.
- **Cada función y estructura** (objeto de configuración, constante, tabla, regla) dice
  **para qué existe**.
- Comentar el "para qué", no repetir el "qué" que ya se lee en el código.

## Separación de responsabilidades
- La UI (`js/ui/` y las vistas de cada módulo) **no habla directo con Supabase ni con R2**:
  pasa siempre por las funciones de servicio de cada módulo.
- Los datos **nunca se escriben a mano en el HTML**: siempre se renderizan desde lo que
  devuelven los servicios.
- `js/core/` contiene lo transversal (configuración, cliente de Supabase, router); no contiene
  lógica de ningún módulo.

## Módulos (P1 / P2)
- Cada módulo vive en `js/modulos/<nombre>/` con un `index.js` como punto de entrada público.
- Cada módulo tiene su documento en `docs/modulos/<nombre>.md` con: qué hace, qué expone y de
  qué depende. Si cambia lo que expone o de qué depende, se actualiza el doc en el mismo commit.
- Lo que no es núcleo va en un módulo separable.

## Seguridad
- La URL de Supabase y la publishable key viven en `js/core/config.js` (son públicas por
  diseño; la protección es RLS, LS1). La **secret key** y las **claves de R2** existen
  **solo en `/api`** (servidor), nunca en el frontend ni en el repo.
- Los valores de `/api` van solo en `.env` local (ignorado por git) y en las variables de
  entorno de Vercel.
- **Nunca leer, mostrar ni copiar el contenido de `.env`.**
- Sin sesión no se ve nada (RNF5): toda lectura de datos requiere usuario autenticado y toda
  escritura requiere rol admin, validado en la base (RLS) y en `/api`.

## Mobile-first
- Diseñar primero a **390 px** de ancho y después adaptar a escritorio (D7, DS6).
- Objetivos táctiles de **44 px como mínimo** (`--toque-min`).
- Usar siempre los tokens de `css/tokens.css`; no escribir colores ni radios sueltos.

## TRAZABILIDAD (P4) — REGLA OBLIGATORIA
- Ante **CUALQUIER** cambio, por mínimo que sea, actualizar `docs/PROGRESO.md` **en el mismo
  commit**: qué se hizo, archivos tocados, decisiones nuevas o cambios, pendientes.
- Si un cambio modifica una decisión, actualizar también `docs/decisiones.md` y anotarlo en
  la bitácora de `docs/PROGRESO.md`.
- Commits **pequeños y descriptivos**, en español, con el formato `tipo(módulo): descripción`.
- Sin atajos que escondan datos o comportamiento.
