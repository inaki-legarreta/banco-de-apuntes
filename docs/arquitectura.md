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
1. **Leer el árbol / buscar:** navegador → Supabase directo, con la publishable key y la sesión
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
7. **Login y sesión:** ver la sección siguiente.

## Login y sesión (prompt 2, LS1–LS4)

```
index.html ─► js/core/router.js
                 │ 1. ¿config.js completo?  no ─► mensaje "Falta configurar la app"
                 │ 2. import del módulo auth (trae supabase-js de jsDelivr, versión fija)
                 │      falla ─► mensaje "No se pudo cargar la app"
                 │ 3. auth.restaurarSesion(): sesión guardada, salvo vencida por inactividad
                 │ 4. recién ahí resuelve la ruta (antes #app está vacío: sin parpadeo)
                 ▼
          ┌─ sin sesión ─► #/login ─► pantalla-login ─► servicio.iniciarSesion
          │                                               └─► Supabase Auth (email + contraseña)
          └─ con sesión ─► #/ (inicio, dentro de la estructura de pantalla)

Cambios de sesión (login, logout, otra pestaña, token vencido, inactividad):
supabase-js ─► servicio (re-lee la sesión) ─► router: vacía #app y vuelve a aplicar la guardia
```

- **Sesión:** la guarda supabase-js mediante un adaptador: `sessionStorage` sin
  "Recordarme" (se cierra con el navegador y por 30 minutos de inactividad) y `localStorage`
  con "Recordarme" (dura hasta cerrar sesión). Detalle en
  [`modulos/auth.md`](modulos/auth.md).
- **Cerrar sesión** (hoja "Cuenta", EP1) cierra solo la sesión de este dispositivo
  (`scope: 'local'`, LS5).

## Estructura de pantalla (prompt 3)

Todas las rutas privadas se ven dentro de la misma estructura (`js/ui/pantalla.js`); el
login va sin ella. Detalle de cada componente en [`ui.md`](ui.md).

```
┌──────────────────────────────┐  100dvh, columna centrada (máx. 560 px hasta el prompt 10)
│ [libro] Banco de Apuntes  (👤)│  encabezado fijo: marca → #/, botón de cuenta → hoja "Cuenta"
│ [🔍 Buscar en el banco      ] │  buscador SOLO VISUAL hasta el prompt 8
├──────────────────────────────┤  borde dorado suave
│                              │
│  contenido de la vista       │  lo único que scrollea
│  (título, ruta, lista…)      │
│                              │
├──────────────────────────────┤
│ [Secundario]  [ Principal ]  │  pie opcional (si la vista lo pide), + safe-area-inset-bottom
└──────────────────────────────┘
   hojas, diálogos y avisos se montan al final de <body>, encima de todo
```

- El router crea la estructura una vez y la reutiliza entre rutas privadas (`reiniciar()`
  vacía el contenido y oculta el pie). Cada vista recibe `(contenido, { parametros,
  pantalla })` y puede pedir el pie con `pantalla.definirPie(...)`.
- El botón de cuenta llama a `auth.abrirHojaCuenta()` (el router hace la conexión, así
  `js/ui/` no depende de ningún módulo).
- En cada cambio de ruta se cierran las hojas o diálogos abiertos. Al perder la sesión
  además se borran los avisos y la estructura (RNF5).

## Ruteo por hash

El hosting es estático y sin compilación (AT1, AT4): el servidor siempre entrega
`index.html` y la ruta va después del `#` (`#/login`, `#/`, `#/admin`, `#/muestrario`, y
más adelante `#/carpeta/<id>` y `#/buscar`).

| Ruta | Pantalla | Acceso |
|---|---|---|
| `#/login` | Login (`auth`), sin estructura de pantalla | Pública; con sesión lleva a `#/` |
| `#/` | Inicio: home de carreras (`explorador`) | Con sesión |
| `#/admin` | Panel admin: **provisional hasta el prompt 9** (`admin`) | Solo admin |
| `#/muestrario` | Muestrario de componentes: **provisional, se borra en el prompt 11** (`js/muestrario/`) | Solo admin | `js/core/router.js` tiene una **tabla de rutas** (patrón, si es
pública y qué pantalla carga); sumar una pantalla es sumar una entrada.

Guardia (RNF5), aplicada en cada cambio de ruta y de sesión:
- Sin sesión, cualquier ruta privada lleva a `#/login`. Todas las rutas son privadas salvo
  que se marquen `publica`.
- Con sesión, `#/login` lleva a `#/`.
- Una ruta `soloAdmin`, para quien no es admin (o si no se pudo leer el rol), lleva a `#/`.
  Es comodidad: la protección real de los datos es RLS. El rol se lee una vez por sesión
  (`auth.esAdmin()`, con caché).
- Una ruta desconocida lleva a `#/`.
- Las redirecciones reemplazan la entrada del historial (`location.replace`), así el botón
  Atrás no vuelve a una pantalla rechazada. Al perder la sesión, `#app` se vacía antes de
  navegar.
- Cada pantalla se importa recién cuando se necesita (`import()` dinámico).

## Dónde vive cada secreto

| Valor | Navegador | `/api` |
|---|---|---|
| URL de Supabase y publishable key (`sb_publishable_...`) | Sí, en `js/core/config.js` (públicas por diseño, protegidas por RLS, LS1) | Sí (`SUPABASE_URL`, `SUPABASE_ANON_KEY` en `.env`) |
| Secret key (`sb_secret_...`, `SUPABASE_SERVICE_ROLE_KEY`) | **Nunca** | Sí |
| `R2_*` | **Nunca** | Sí |

## Estructura del repo (AT4)

```
index.html                 Punto de entrada; carga estilos y js/core/router.js
css/                       tokens.css (DS5), base.css, componentes.css
js/core/                   config.js, supabase.js, router.js (transversal)
js/modulos/<nombre>/       auth, explorador, archivos, busqueda, admin
js/ui/                     componentes de interfaz compartidos (docs/ui.md)
js/muestrario/             muestrario de componentes (provisional, se borra en el prompt 11)
api/                       funciones serverless de Vercel (secretos)
supabase/migraciones/      SQL versionado del esquema
docs/                      decisiones, arquitectura, progreso, doc por módulo
```
