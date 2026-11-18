# Módulo `busqueda`

**Ubicación:** `js/modulos/busqueda/` · **Prompt de implementación:** 8 · **Estado:** esqueleto.

## Qué hace
Busca por palabras clave sobre los **nombres** de archivos y carpetas (D23, RF5), tolerando
tildes, errores de tipeo y desorden de palabras. Cada resultado muestra su ruta de carpetas.
Objetivo: con 2–3 palabras, el archivo aparece entre los 5 primeros (C4), en menos de 2 s
(RNF4). La búsqueda se resuelve en la base (AT5). No busca por contenido (D22).

## Qué expone
- `nombreModulo` (esqueleto).
- Previsto: servicio de búsqueda y pantalla de resultados (DS1).

## De qué depende
- `js/core/supabase.js` (función de búsqueda en Postgres).
- `explorador` (para abrir la carpeta de un resultado).

## Decisiones relacionadas
D22, D23, RF5, RNF4, C4, AT5.
