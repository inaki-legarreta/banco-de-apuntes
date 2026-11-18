# Base de datos — Banco de Apuntes

Este documento describe el esquema de Postgres en Supabase: tablas, restricciones, triggers y
seguridad a nivel de fila (RLS). Decisiones de origen: AT2, AT5, D14–D16, D25, RNF5 y
BD1–BD4 (en `docs/decisiones.md`, "Detalle de AT5").

La base guarda **solo metadatos** (el árbol y los roles). El contenido de los archivos vive
en Cloudflare R2 (AT3).

Migraciones: `supabase/migraciones/001-perfiles.sql`, `002-items.sql` y `003-explorador.sql`.
Pendiente para más adelante: búsqueda aproximada (prompt 8) y espacio usado (prompt 9).

---

## Relaciones

```
auth.users  (tabla de Supabase Auth: email, contraseña, sesiones)
    │ 1
    │      perfiles.id = auth.users.id   (on delete cascade)
    │ 1    trigger crear_perfil_al_registrar → crea el perfil como 'lector'
    ▼
public.perfiles  (rol: admin | lector)


public.items  (árbol de carpetas y archivos)
    ▲ 1  (padre)
    │      items.padre_id = items.id     (on delete cascade)
    │ N  (hijos)
    └── public.items

Ejemplo del árbol (padre_id null = carpeta raíz = una carrera en la home, DS4):

ISI                         carpeta  padre_id = null
├── 1º año                  carpeta  padre_id = ISI
│   └── Análisis I          carpeta  padre_id = 1º año
│       └── Parcial1_2025.pdf archivo padre_id = Análisis I, tamano_bytes, clave_r2
└── Carrera                 carpeta  padre_id = ISI
```

`perfiles` e `items` no se relacionan entre sí: los permisos dependen del rol del usuario,
no de quién creó cada elemento (D16: no hay permisos por carpeta).

---

## Tabla `public.perfiles`

Una fila por cuenta de Supabase Auth, con su rol (D14).

| Columna | Tipo | Restricciones | Para qué |
|---|---|---|---|
| `id` | uuid | PK, FK → `auth.users(id)` on delete cascade | Une el perfil con la cuenta. Borrar la cuenta borra el perfil. |
| `rol` | text | not null, default `'lector'`, check `perfiles_rol_valido`: `admin` o `lector` | Qué puede hacer el usuario (D14, D16). |
| `creado_en` | timestamptz | not null, default `now()` | Cuándo se creó el perfil. |

**Alta automática (BD3):** el trigger `crear_perfil_al_registrar` (after insert en
`auth.users`) ejecuta `public.crear_perfil()`, que inserta el perfil con rol `lector`. La
migración 001 también crea el perfil de las cuentas que ya existían antes de aplicarla.

**`public.es_admin()`:** devuelve `true` si el usuario de la sesión (`auth.uid()`) tiene rol
`admin`. La usan las políticas de ambas tablas. Es `security definer` para leer `perfiles`
salteando RLS (si no, la política "el admin lee todos" se llamaría a sí misma en bucle) y
`stable` para que Postgres no la recalcule fila por fila. Solo la puede ejecutar
`authenticated`.

---

## Tabla `public.items`

Árbol genérico de carpetas y archivos (AT5, D25). La app no sabe de años, materias ni
secciones: eso es convención de nombres (D10–D13).

| Columna | Tipo | Restricciones | Para qué |
|---|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` | Identificador del elemento. |
| `padre_id` | uuid | null, FK → `items(id)` on delete cascade | Carpeta contenedora. `null` = carpeta raíz (una carrera, DS4). Cascada: BD2. |
| `nombre` | text | not null, check `items_nombre_valido` | Nombre visible; búsqueda (D23) y orden natural (RF9). |
| `tipo` | text | not null, check `items_tipo_valido`: `carpeta` o `archivo` | Qué es el elemento. |
| `tamano_bytes` | bigint | ver `items_datos_segun_tipo` | Peso del archivo: alerta de 50 MB (RNF9), .zip (AT7), espacio usado (RF12). |
| `clave_r2` | text | unique (`items_clave_r2_unica`), ver `items_datos_segun_tipo` | Clave del objeto en R2, para firmar links (AT6). |
| `creado_en` | timestamptz | not null, default `now()` | Cuándo se creó o subió. |
| `actualizado_en` | timestamptz | not null, default `now()` | Última modificación; la mantiene un trigger. |

### Restricciones (los nombres sirven para traducir errores en `/api` y la UI)

| Nombre | Regla |
|---|---|
| `items_tipo_valido` | `tipo` es `carpeta` o `archivo`. |
| `items_nombre_valido` | 1 a 255 caracteres, sin espacios (ni tabs ni saltos de línea) al inicio o al final, sin `/`. |
| `items_clave_r2_unica` | Dos elementos no comparten objeto de R2. |
| `items_datos_segun_tipo` | Archivo: `tamano_bytes >= 0` y `clave_r2` no nulos. Carpeta: ambos `null`. |
| `items_nombre_unico_por_carpeta` (índice único) | `(padre_id, lower(nombre))` con `NULLS NOT DISTINCT`: no hay dos nombres iguales, sin distinguir mayúsculas, en la misma carpeta ni entre las raíces (BD1). |

Postgres devuelve estas violaciones con código `23514` (check) o `23505` (unique) y el nombre
de la restricción; el mensaje original está en inglés, así que `/api` y la UI deben
traducirlo usando el nombre.

### Índices

- `items_nombre_unico_por_carpeta`: el de BD1 (arriba). Como empieza por `padre_id`,
  también es el que usa Postgres para listar el contenido de una carpeta (RNF4) y para el
  borrado en cascada. Por eso no hay un índice aparte por `padre_id`.

### Triggers

| Trigger | Cuándo | Qué hace |
|---|---|---|
| `items_actualizar_fecha` | before update | Pone `actualizado_en = now()`. |
| `items_validar_padre` | before insert, before update of `padre_id` | Valida el padre (ver abajo). |
| `items_bloquear_cambio_de_tipo` | before update of `tipo` | Rechaza el update si `tipo` cambia (ver abajo). |

Los triggers de integridad rechazan, con mensajes en español pensados para la UI (código
`P0001`):

| Caso | Mensaje |
|---|---|
| Una carpeta se mueve dentro de sí misma | "Una carpeta no puede moverse dentro de sí misma." |
| El padre no existe | "La carpeta de destino no existe (puede que se haya borrado)." |
| El padre es un archivo | "El destino tiene que ser una carpeta, no un archivo." |
| Una carpeta se mueve dentro de un descendiente | "Una carpeta no puede moverse dentro de una de sus subcarpetas." |
| Un update cambia `tipo` (carpeta ↔ archivo) | "No se puede convertir una carpeta en archivo ni un archivo en carpeta." |

El tipo queda fijo al crear el elemento: así una carpeta con contenido nunca pasa a ser
archivo (sus hijos quedarían colgando de un archivo). Mandar el mismo tipo en un update no
da error.

Para detectar ciclos sube por los ancestros del nuevo padre; si aparece la carpeta que se
mueve, el destino es un descendiente suyo. Limitación aceptada: dos movimientos simultáneos
y cruzados podrían, en teoría, formar un ciclo; con un solo admin no ocurre en la práctica.

---

## Funciones de lectura del árbol (migración 003)

Las usa el módulo `explorador` (`js/modulos/explorador/servicio.js`) para navegar (RF3).
No agregan tablas ni columnas.

| Función | Devuelve | Para qué |
|---|---|---|
| `contenido_carpeta(p_padre uuid)` | `id, nombre, tipo, tamano_bytes, actualizado_en, subcarpetas, archivos` | Hijos directos de una carpeta (`p_padre` null = carpetas raíz, la home). `subcarpetas` y `archivos` cuentan el contenido directo de cada carpeta (null en archivos). Una sola consulta por pantalla (RNF4). |
| `ruta_carpeta(p_id uuid)` | `id, nombre, profundidad` | Ancestros de una carpeta, de la raíz (profundidad 0) hacia abajo e incluyendo la propia. Sin filas si el id no existe o es un archivo ("Esta carpeta no existe"). |

- **`language sql`, `stable`, `security invoker`, `set search_path = ''`**, con
  `comment on`. Al ser *security invoker* corren con los permisos de quien llama: RLS de
  `items` sigue aplicando.
- **Permisos:** `execute` solo para `authenticated`; revocado a `public` y a `anon`. Sin
  sesión no devuelven nada (RNF5).
- **Sin orden:** `contenido_carpeta` no ordena; el orden natural (RF9) lo aplica el
  frontend con `Intl.Collator` (ver `docs/modulos/explorador.md`). `ruta_carpeta` sí sale
  ordenada de la raíz hacia abajo, y además trae `profundidad` para no depender de eso.
- **Índices:** las dos usan `items_nombre_unico_por_carpeta` (empieza por `padre_id`) para
  buscar hijos; `ruta_carpeta` usa la clave primaria para subir por los padres. Por eso el
  filtro de `contenido_carpeta` separa la raíz (`padre_id is null`) del resto
  (`padre_id = p_padre`): `is not distinct from` no usaría el índice.
- **Defensa:** `ruta_carpeta` corta la recursión a los 1000 niveles por si alguna vez
  existiera un ciclo (los triggers de 002 ya los impiden).

Verificación: `supabase/manual/verificacion-003.sql` (pruebas que se deshacen solas, con
los roles `authenticated` y `anon`, más una lista de chequeo `ok = true/false`).

### Datos de prueba
`supabase/manual/datos-de-prueba.sql` carga dos carpetas raíz de prueba ("Prueba —
Ingeniería en Sistemas" y "Prueba — Carrera vacía") con archivos de mentira cuya
`clave_r2` empieza con `prueba/` (no existen en R2). `supabase/manual/borrar-datos-de-prueba.sql`
borra las dos raíces (el resto cae en cascada, BD2) y comprueba que no quede ninguna fila
con `clave_r2 like 'prueba/%'`. Las claves reales de R2 nunca tienen que empezar con
`prueba/`.

---

## Seguridad a nivel de fila (RLS)

RLS está activado en ambas tablas. Ninguna política aplica a `anon` y además se le quitaron
los permisos de tabla a `anon` (segunda barrera): **sin sesión no se ve ni un nombre**
(RNF5). La secret key (`/api`) saltea RLS; por eso solo existe en el servidor.

| Tabla | Política | Operación | Para quién | Condición | Por qué |
|---|---|---|---|---|---|
| perfiles | perfiles: cada usuario lee el suyo | select | authenticated | `id = auth.uid()` | La app necesita saber el rol de quien entró (DS2). |
| perfiles | perfiles: el admin lee todos | select | authenticated | `es_admin()` | Administrar cuentas (RF2). |
| perfiles | — | insert, update, delete | nadie | — | Las cuentas se manejan desde `/api` con la secret key (prompt 9). |
| items | items: con sesión se lee | select | authenticated | `true` | Todos los usuarios ven todo (D16). |
| items | items: el admin crea | insert | authenticated | `es_admin()` | RF6, RF7. |
| items | items: el admin modifica | update | authenticated | `es_admin()` (using y with check) | RF6, RF8. |
| items | items: el admin borra | delete | authenticated | `es_admin()` | RF6, RF8; la cascada borra el contenido (BD2). |

El borrado en cascada no pasa por RLS (las acciones de clave foránea no lo hacen): alcanza
con que el admin pueda borrar la carpeta. Los objetos de R2 los borra `/api` antes (BD2).

---

## Cómo se aplican las migraciones

1. Abrir el proyecto en Supabase → **SQL Editor** → **New query**.
2. Pegar el contenido completo de `supabase/migraciones/001-perfiles.sql` y ejecutar (Run).
3. Repetir con `002-items.sql`. **El orden importa**: 002 usa `public.es_admin()` de 001.
4. Pegar y ejecutar `supabase/manual/verificacion-001-002.sql`. No tiene que dar error y
   todas las filas tienen que tener `ok = true`.
5. Anotar en `docs/PROGRESO.md` (tabla "Migraciones aplicadas") la fecha de cada una.

Las migraciones son idempotentes: volver a correrlas no rompe nada. Aun así, una migración
aplicada no se edita; los cambios van en una nueva (ver `supabase/migraciones/README.md`).

---

## Primer admin, paso a paso (BD3, BD4)

1. **Desactivar el registro público (BD4, D5):** Authentication → Sign In / Providers →
   apagar "Allow new users to sign up" → Save. Así nadie puede crearse una cuenta desde
   afuera; las cuentas se crean desde el panel de Supabase o desde `/api` (prompt 9).
2. **Aplicar las migraciones** 001 y 002 (sección anterior).
3. **Crear la cuenta de Iñaki:** Authentication → Users → Add user → Create new user, con
   email y contraseña reales y "Auto Confirm User" marcado. El trigger le crea el perfil
   como `lector`. (Si la cuenta ya existía antes de la migración 001, la migración ya le
   creó el perfil.)
4. **Marcarla como admin:** abrir `supabase/manual/hacer-admin.sql`, reemplazar
   `TU_EMAIL_AQUI` por el email (solo en el SQL Editor; no commitear el email), ejecutar.
   Tiene que devolver **una fila** con `rol = admin`. Si devuelve cero, el email no coincide.
5. **Comprobar:** en el SQL Editor,
   `select p.rol, u.email from public.perfiles p join auth.users u on u.id = p.id;`
6. Anotar en `docs/PROGRESO.md` que el primer admin quedó creado (sin el email).

Se hace una sola vez. Los admins siguientes, si alguna vez hicieran falta, se marcan igual.
