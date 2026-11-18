# Banco de Apuntes — Prompts para Claude Code

Cómo se usa este documento:
- Un prompt por vez, en orden. No se pasa al siguiente hasta que el anterior cumpla sus criterios de terminado.
- Antes del prompt 0, completar la **Preparación** (cuentas y claves, a mano).
- Cada prompt le exige a Claude Code actualizar `docs/PROGRESO.md` ante cualquier cambio. Para retomar en otro chat: pasarle a Claude (chat) ese archivo + este documento + `claude/registro-decisiones.md`.

| # | Prompt | Estado |
|---|---|---|
| 0 | Base del proyecto | Listo para ejecutar |
| 1 | Base de datos | Pendiente |
| 2 | Login y sesión | Pendiente |
| 3 | Estilos y estructura de pantalla | Pendiente |
| 4 | Explorador | Pendiente |
| 5 | Gestión de carpetas | Pendiente |
| 6 | Archivos (R2) | Pendiente |
| 7 | .zip | Pendiente |
| 8 | Búsqueda | Pendiente |
| 9 | Panel admin | Pendiente |
| 10 | Escritorio | Pendiente |
| 11 | Puesta en marcha | Pendiente |

---

## Preparación (a mano, antes del prompt 0)

Las claves nunca se pegan en un chat ni se suben al repo: van solo en el archivo `.env` local (que está en `.gitignore`) y en las variables de entorno de Vercel.

1. **GitHub:** crear un repositorio privado `banco-de-apuntes` y clonarlo en tu compu.
2. **Supabase:** crear un proyecto (región São Paulo, la más cercana). Anotar: URL del proyecto, clave pública (anon/publishable) y clave de servicio (service role, secreta).
3. **Cloudflare R2:** crear un bucket privado `banco-de-apuntes`. Crear un token de API de R2 con permiso de lectura y escritura sobre ese bucket. Anotar: Account ID, Access Key ID y Secret Access Key.
4. **Vercel:** crear una cuenta (plan Hobby) y conectar GitHub. El proyecto se importa recién en el prompt 11.
5. **Repo:** copiar `claude/registro-decisiones.md` (de este proyecto de claude.ai) a `docs/decisiones.md` dentro del repo.

---

## Prompt 0 — Base del proyecto

```
# Banco de Apuntes — Prompt 0: Base del proyecto

## Contexto
Vas a construir "Banco de Apuntes": una app web privada para guardar y encontrar apuntes
de la carrera, ordenados como un Drive (árbol de carpetas y archivos), sin lógica académica.
Las decisiones del proyecto están en docs/decisiones.md: leelo completo antes de empezar.
Puntos clave:
- Stack (AT1–AT4): Vercel (hosting + funciones en /api), Supabase (Auth + Postgres),
  Cloudflare R2 (archivos). Frontend en HTML + CSS + JavaScript puro, SIN framework y SIN
  paso de compilación, usando módulos nativos de JS (import/export).
- Mobile-first (D7). Identidad visual DS5: azules oscuros, dorado en degradé solo en acentos,
  tipografía Manrope.
- Principios P1–P4 (reglas de oro): modularización; cada módulo documentado; código
  comentado explicando para qué existe cada estructura; trazabilidad de todo cambio.

## Objetivo de este prompt
Dejar el esqueleto del proyecto listo, sin lógica de negocio todavía.

## Tareas
1. Crear la estructura de carpetas (AT4):
   /index.html
   /css/            (tokens.css, base.css, componentes.css)
   /js/core/        (config.js, supabase.js, router.js) — solo esqueleto comentado
   /js/modulos/auth/ , /js/modulos/explorador/ , /js/modulos/archivos/ ,
   /js/modulos/busqueda/ , /js/modulos/admin/   — cada uno con un index.js esqueleto
   /js/ui/
   /api/            (vacío por ahora, con un README que explique qué va ahí)
   /supabase/migraciones/ (vacío, con README)
   /docs/           (decisiones.md ya existe; crear arquitectura.md, PROGRESO.md y una
                     carpeta docs/modulos/ con un .md por módulo)
2. Crear CLAUDE.md en la raíz con las reglas permanentes del proyecto (ver sección abajo).
3. Crear css/tokens.css con las variables de diseño DS5:
   --azul-900:#08101F; --azul-850:#0A1426; --azul-800:#0F1C36; --azul-panel:#111F3B;
   --texto:#E8ECF4; --texto-suave:#9AA6BD; --texto-tenue:#8D99B1;
   --dorado-claro:#F0D394; --dorado:#D9B46A; --dorado-oscuro:#C99A4B; --acento:#E2C27F;
   --peligro:#C9474A; --peligro-texto:#F2A6A6;
   --radio-sm:10px; --radio-md:14px; --radio-lg:18px; --toque-min:44px;
   --fuente: 'Manrope', system-ui, sans-serif;
4. index.html mínimo: carga Manrope desde Google Fonts, los CSS y js/core/router.js como
   módulo; muestra solo "Banco de Apuntes" centrado con los colores de los tokens.
5. package.json SOLO para las funciones de /api (el frontend no usa npm). Sin dependencias
   todavía.
6. .gitignore (node_modules, .env, .vercel, archivos del sistema) y .env.example con estas
   variables vacías y comentadas: SUPABASE_URL, SUPABASE_ANON_KEY,
   SUPABASE_SERVICE_ROLE_KEY, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
   R2_BUCKET.
7. docs/arquitectura.md: resumen de AT1–AT8 con un diagrama en texto de cómo se conectan
   navegador, /api, Supabase y R2.
8. docs/PROGRESO.md con el formato de la sección "Formato de PROGRESO.md".
9. Primer commit.

## Contenido obligatorio de CLAUDE.md
- Qué es el proyecto (2-3 líneas) y que docs/decisiones.md es la fuente de verdad: si algo
  pedido contradice una decisión, frenar y avisar antes de implementar.
- Stack y prohibiciones: sin frameworks, sin bundlers, sin TypeScript, sin librerías de UI.
  Toda dependencia nueva se justifica en PROGRESO.md.
- Convenciones: archivos y carpetas en español y en kebab-case; variables y funciones en
  español y camelCase; comentarios en español.
- Comentarios (P3): cada archivo empieza con un bloque que dice qué es y qué responsabilidad
  tiene; cada función y estructura dice para qué existe. Comentar el "para qué", no repetir
  el "qué".
- Separación de responsabilidades: la UI no habla directo con Supabase ni con R2; pasa por
  funciones de servicio de cada módulo. Los datos nunca se escriben a mano en el HTML.
- Módulos (P1/P2): cada módulo vive en js/modulos/<nombre>/ y tiene su doc en
  docs/modulos/<nombre>.md (qué hace, qué expone, de qué depende).
- Seguridad: nunca claves en el código ni en el repo; la service role key y las claves de
  R2 solo existen en /api (servidor).
- Mobile-first: diseñar a 390 px de ancho; objetivos táctiles de 44 px como mínimo.
- TRAZABILIDAD (P4) — REGLA OBLIGATORIA: ante CUALQUIER cambio, por mínimo que sea,
  actualizar docs/PROGRESO.md EN EL MISMO COMMIT (qué se hizo, archivos tocados, decisiones
  nuevas o cambios, pendientes). Si un cambio modifica una decisión, actualizar también
  docs/decisiones.md y anotarlo. Commits pequeños y descriptivos en español con el formato
  "tipo(módulo): descripción" (tipos: feat, fix, docs, style, refactor, chore).

## Formato de PROGRESO.md
# Progreso — Banco de Apuntes
## Estado actual
- Último prompt ejecutado: <n> — <nombre>
- Qué funciona hoy: ...
- Qué falta / próximo paso: ...
## Bitácora (más reciente arriba)
### AAAA-MM-DD — <título corto>
- Hecho: ...
- Archivos: ...
- Decisiones o cambios: ...
- Pendientes / dudas para Iñaki: ...

## Qué NO hacer
- No implementar login, base de datos, subida de archivos ni ninguna lógica.
- No instalar frameworks ni herramientas de compilación.
- No crear archivos .env con valores reales.

## Criterios de terminado
- La estructura de carpetas coincide con AT4.
- Abrir index.html con un servidor local (por ejemplo `npx serve`) muestra el título con
  fondo azul oscuro y tipografía Manrope.
- CLAUDE.md, docs/arquitectura.md, docs/PROGRESO.md y un doc por módulo existen y están
  completos.
- Todo archivo .js tiene su bloque de comentario inicial.
- git log muestra el commit inicial y PROGRESO.md registra este prompt.

## Al terminar
Mostrame: el árbol de carpetas, el contenido de CLAUDE.md y la entrada de PROGRESO.md.
```
