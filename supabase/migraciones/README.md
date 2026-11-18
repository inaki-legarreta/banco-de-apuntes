# supabase/migraciones — Esquema de la base de datos

Esta carpeta guarda, **en orden y versionados**, los scripts SQL que crean y modifican la
base de Postgres de Supabase (AT2, AT5). Existe para que el esquema sea trazable (P4): la
base se puede reconstruir desde cero ejecutando los archivos en orden.

El detalle del esquema (tablas, restricciones, políticas) está en `docs/base-de-datos.md`.

## Convención
- Nombre: `NNN-descripcion-corta.sql`, con un número de tres cifras correlativo
  (`001-perfiles.sql`, `002-items.sql`, …). El número define el orden de aplicación.
- Cada archivo empieza con un bloque de comentario que explica qué cambia y por qué, y usa
  `comment on` en cada tabla, columna, función y política.
- Idempotente cuando es razonable (`create ... if not exists`, `create or replace`,
  `drop policy if exists`), para poder volver a correrla sin romper nada.
- **Una migración aplicada no se edita**: los cambios posteriores van en una migración nueva.

## Procedimiento para aplicar una migración
1. Aplicar **en orden numérico**, sin saltear ninguna: cada una puede depender de las
   anteriores (por ejemplo, `002-items.sql` usa `public.es_admin()` de `001-perfiles.sql`).
2. En el panel de Supabase: **SQL Editor** → **New query** → pegar el archivo completo →
   **Run**. No se usa la CLI de Supabase.
3. Si existe un script de verificación para esa migración en `supabase/manual/`
   (por ejemplo `verificacion-001-002.sql`), correrlo y confirmar que todo da `ok`.
4. Anotar la migración aplicada **con la fecha** en la tabla "Migraciones aplicadas" de
   `docs/PROGRESO.md`, y commitear ese cambio.

## supabase/manual/
Scripts que **no** son migraciones: se corren a mano solo cuando hace falta
(`hacer-admin.sql`, una sola vez) o para comprobar el estado (`verificacion-*.sql`).

## Migraciones
| Archivo | Qué crea |
|---|---|
| `001-perfiles.sql` | Tabla `perfiles`, trigger de alta como lector, `es_admin()`, RLS. |
| `002-items.sql` | Tabla `items` (árbol), índice de nombre único, triggers de fecha e integridad, RLS. |

Próximas: búsqueda aproximada (prompt 8) y espacio usado (prompt 9).
