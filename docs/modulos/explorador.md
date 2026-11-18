# Módulo `explorador`

**Ubicación:** `js/modulos/explorador/` · **Prompts de implementación:** 4 (navegación) y 5
(gestión de carpetas) · **Estado:** esqueleto.

## Qué hace
Muestra el árbol genérico de carpetas y archivos (D25) y permite navegarlo (RF3): home de
carreras como raíz (DS4), contenido de cada carpeta en orden natural con carpetas arriba y
archivos abajo (RF9), ruta de carpetas. Para el admin, crear, renombrar, mover y borrar
carpetas (RF6), con confirmación de borrado que avisa cuántos elementos contiene (RF10). En
escritorio, barra lateral con el árbol y contenido en tabla (DS6).

## Qué expone
- `nombreModulo` (esqueleto).
- Previsto: pantalla de carpeta, servicios para leer el contenido de una carpeta y su ruta,
  servicios de gestión de carpetas (solo admin).

## De qué depende
- `js/core/supabase.js` (tabla `items`, AT5).
- `auth` (para saber si mostrar los botones de admin, DS2).
- `js/ui/` (lista, ruta, ventanas de confirmación).

## Decisiones relacionadas
D25, RF3, RF6, RF9, RF10, DS2, DS4, DS6, AT5.
