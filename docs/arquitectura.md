# Arquitectura — Banco de Apuntes

Resumen técnico de las decisiones AT1–AT9 de [`decisiones.md`](decisiones.md) (fuente de
verdad). Si este documento y `decisiones.md` no coinciden, manda `decisiones.md`.

## Piezas

| Decisión | Pieza | Rol |
|---|---|---|
| AT1 | **Vercel (Hobby)** | Sirve el frontend estático y las funciones chicas en `/api`. |
| AT2 | **Supabase (Free)** | Auth con email y contraseña (sin registro abierto) + Postgres con los **metadatos** del árbol. No guarda archivos. |
| AT3 | **Cloudflare R2** | Bucket privado con los archivos. Sin costo de egreso. |
| AT4 | **Frontend** | HTML + CSS + JS puro con módulos nativos, sin framework ni compilación. |
| AT5 | **Datos** | Tabla `items` (árbol genérico: id, padre, nombre, tipo, tamaño, clave en R2, fecha) + tabla `perfiles` (rol). RLS: con sesión se lee, solo el admin escribe. Búsqueda aproximada y espacio usado se resuelven en la base. |
| AT6 | **Links firmados** | `/api` verifica sesión y rol y devuelve URLs firmadas de corta duración; el archivo viaja directo entre el dispositivo y R2. Ping semanal programado para que Supabase no se pause. |
| AT7 | **.zip en el dispositivo** | El navegador descarga los archivos de la carpeta y arma el .zip, con tope de 500 MB. |
| AT8 | **Trazabilidad** | Git con commits descriptivos, doc por módulo en `docs/modulos/` y `decisiones.md` + `PROGRESO.md` actualizados ante cada cambio. |
| AT9 | **Regiones** | Supabase en us-west-2 (Oregón), R2 en ENAM, funciones de Vercel en `pdx1`. CORS de R2: `http://localhost:3000` (GET, PUT); el dominio de Vercel se suma en el prompt 11. |

## Cómo se conectan

```
                         ┌──────────────────────────────────────────┐
                         │               NAVEGADOR                  │
                         │  index.html + css/ + js/ (módulos nativos)│
                         │                                          │
                         │  UI (js/ui, vistas)                      │
                         │     │ solo llama a servicios             │
                         │     ▼                                    │
                         │  Servicios de js/modulos/*               │
                         └──┬───────────────┬──────────────┬────────┘
                            │               │              │
         (1) login, sesión, │  (2) pedir    │              │ (3) PUT / GET del archivo
         leer/escribir      │  link firmado │              │     con el link firmado
         metadatos (anon    │  + token de   │              │     (directo, sin pasar
         key + RLS)         │  sesión       │              │      por /api)
                            ▼               ▼              ▼
              ┌────────────────────┐  ┌──────────────┐  ┌─────────────────────┐
              │     SUPABASE       │  │ VERCEL /api  │  │   CLOUDFLARE R2     │
              │  Auth + Postgres   │◄─┤ (servidor)   ├─►│  bucket privado     │
              │  items, perfiles   │  │ service role │  │  (archivos)         │
              │  RLS por rol       │  │ + claves R2  │  │                     │
              └────────────────────┘  └──────────────┘  └─────────────────────┘
                        ▲                (a) valida token y rol en Supabase
                        │                (b) firma la URL con las claves de R2
                        └──── ping semanal programado (Vercel cron) ────┘
```

### Flujos principales
1. **Leer el árbol / buscar:** navegador → Supabase directo, con la clave anon y la sesión
   del usuario. RLS bloquea todo si no hay sesión (RNF5).
2. **Escribir metadatos (crear, renombrar, mover, borrar):** navegador → Supabase; RLS solo
   lo permite si el perfil es admin.
3. **Subir archivos:** navegador → `/api` (valida sesión y rol admin, firma un PUT) →
   navegador sube directo a R2 → registra el item en Supabase.
4. **Descargar:** navegador → `/api` (valida sesión, firma un GET) → navegador baja directo
   de R2. Sin cuenta, el link no se puede obtener (RNF5).
5. **Descargar carpeta (.zip):** se repite el flujo 4 por cada archivo y el .zip se arma en
   el dispositivo (AT7), avisando el peso antes (RNF9).
6. **Cuentas de lectores:** navegador (admin) → `/api` → API de administración de Supabase
   con la service role key (RF2).

## Dónde vive cada secreto

| Valor | Navegador | `/api` |
|---|---|---|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Sí (públicos, protegidos por RLS) | Sí |
| `SUPABASE_SERVICE_ROLE_KEY` | **Nunca** | Sí |
| `R2_*` | **Nunca** | Sí |

## Estructura del repo (AT4)

```
index.html                 Punto de entrada; carga estilos y js/core/router.js
css/                       tokens.css (DS5), base.css, componentes.css
js/core/                   config.js, supabase.js, router.js (transversal)
js/modulos/<nombre>/       auth, explorador, archivos, busqueda, admin
js/ui/                     componentes de interfaz compartidos
api/                       funciones serverless de Vercel (secretos)
supabase/migraciones/      SQL versionado del esquema
docs/                      decisiones, arquitectura, progreso, doc por módulo
```
