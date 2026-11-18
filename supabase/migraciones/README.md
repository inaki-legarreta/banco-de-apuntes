# supabase/migraciones — Esquema de la base de datos

Esta carpeta guarda, **en orden y versionados**, los scripts SQL que crean y modifican la
base de Postgres de Supabase (AT2, AT5). Existe para que el esquema sea trazable (P4): la
base se puede reconstruir desde cero ejecutando los archivos en orden.

## Convención
- Nombre: `AAAAMMDD-NN-descripcion-corta.sql` (por ejemplo `20261117-01-tablas-iniciales.sql`).
- Cada archivo empieza con un comentario que explica qué cambia y por qué.
- **Una migración aplicada no se edita**: los cambios posteriores van en una migración nueva.
- Cada migración se registra en `docs/PROGRESO.md`.

## Qué va a haber (AT5)
- Tabla `items`: árbol genérico de carpetas y archivos (id, padre, nombre, tipo, tamaño,
  clave en R2, fecha).
- Tabla `perfiles`: rol de cada usuario (admin o lector).
- Políticas RLS: con sesión se lee; solo el admin escribe.
- Funciones de búsqueda aproximada y de espacio usado.

Estado: vacío (prompt 0). La primera migración llega en el prompt 1.
