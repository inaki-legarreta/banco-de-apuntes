# Módulo `explorador`

**Ubicación:** `js/modulos/explorador/` · **Prompts de implementación:** 4 (navegación) y 5
(gestión de carpetas) · **Estado:** navegación de solo lectura (prompt 4).

## Qué hace
Muestra el árbol genérico de carpetas y archivos (D25) y permite navegarlo (RF3):

- **Home de carreras** (`#/`, DS4): una tarjeta por carpeta raíz, con la cantidad de
  contenido como subtítulo ("3 carpetas", "Vacía"; EP2). Si hubiera archivos sueltos en la
  raíz, se listan debajo de las tarjetas (no se esconden).
- **Vista de carpeta** (`#/carpeta/<id>`): ruta desde "Banco" (cada tramo lleva a su
  carpeta), título con **Volver a la carpeta padre** (o a la home si es raíz; EP3) y el
  contenido en orden natural.
- **Hoja de archivo:** tocar un archivo o su ⋮ muestra su nombre completo, su peso, su
  ubicación y la nota "La descarga llega pronto." (solo "Cerrar" por ahora).

Admin y lector ven exactamente lo mismo (DS2): el módulo no mira el rol. Más adelante: para
el admin, crear, renombrar, mover y borrar carpetas (RF6, prompt 5), con confirmación de
borrado que avisa cuántos elementos contiene (RF10); en escritorio, barra lateral con el
árbol y contenido en tabla (DS6, prompt 10).

## Qué expone (`index.js`)
- `nombreModulo`.
- Pantallas (las monta el router):
  - `montarPantallaInicio(contenido)`: home de carreras.
  - `montarPantallaCarpeta(contenido, { parametros: [id] })`: vista de una carpeta. El
    router ya validó que `id` tenga forma de uuid.
  - `montarCarpetaInexistente(contenido)`: "Esta carpeta no existe" para
    `#/carpeta/<algo que no es un uuid>`, sin consultar la base.
- Servicio (`servicio.js`, lo único que habla con Supabase):
  - `obtenerContenido(idCarpeta | null)` → `Elemento[]` en orden natural. `null` = carpetas
    raíz. Cada `Elemento`: `{ id, nombre, tipo, tamanoBytes, actualizadoEn, subcarpetas,
    archivos }` (los conteos son `null` en archivos). Llama a `contenido_carpeta`.
  - `obtenerRuta(idCarpeta)` → `[{ id, nombre }]` de la raíz a la carpeta, incluida. Vacío
    si el id no existe o es un archivo. Llama a `ruta_carpeta`.
  - `ErrorExplorador`: error con el mensaje ya en español.
- Orden natural (`orden.js`): `ordenarNatural(elementos)` y `compararNatural(a, b)`, para
  que otros módulos (búsqueda, prompt 8) ordenen igual.

Archivos internos: `formato.js` (peso y detalle de carpeta), `filas.js` (elemento → fila
de la lista, enlaces), `hoja-archivo.js` (hoja de un archivo).

## Orden natural (RF9)
`orden.js`, en una sola función comentada:

1. Carpetas arriba, archivos abajo.
2. Dentro de cada grupo, `Intl.Collator('es', { numeric: true, sensitivity: 'base' })`:
   "Clase 2" antes que "Clase 10"; no distingue tildes ni mayúsculas ("Algebra",
   "álgebra" y "Árbol" quedan juntos en orden alfabético).
3. Desempate determinista si dos nombres valen lo mismo para el paso 2 (mismo collator con
   `sensitivity: 'variant'` y, por último, el id).

Se ordena en el navegador y no en la base porque `Intl.Collator` hace el orden numérico
igual en todos los navegadores modernos, sin depender de las collations del servidor.

## Textos (`formato.js`, es-AR)
- Peso de un archivo, de a 1024: menos de 10 en la unidad lleva un decimal ("1,2 MB",
  "5,5 MB"); desde 10, sin decimales ("980 KB", "48 MB"). Bytes sueltos: "512 B", "0 B".
- Detalle de una carpeta: "4 carpetas · 3 archivos", "1 carpeta", "2 archivos" o "Vacía".
  Es también el subtítulo de las tarjetas de la home (EP2).

## Estados
| Estado | Cuándo | Qué se ve |
|---|---|---|
| Cargando | Mientras consulta | Filas esqueleto (`crearEstadoCargando`) |
| Vacía | La carpeta no tiene nada | "Esta carpeta está vacía" (con su ruta y título) |
| Sin carreras | La home no tiene carpetas raíz | "Todavía no hay carreras" |
| Error | Falla la consulta | Mensaje en español + "Reintentar" |
| No existe | Id inexistente, de un archivo o mal formado | "Esta carpeta no existe" + "Ir al inicio" |

- **Una consulta por carpeta abierta** (RNF4): la vista de carpeta pide ruta y contenido
  **en paralelo** (`Promise.all`); los conteos de cada subcarpeta vienen en la misma
  consulta del contenido. Nunca se trae el árbol entero.
- **Todo sale de la URL:** con Atrás, con Volver o al recargar, la vista se rearma desde
  el id. No hay estado guardado entre pantallas.
- **Respuestas tardías:** cada vista dibuja dentro de una zona propia; si el usuario navegó
  mientras se consultaba, esa zona ya no está en la página y la respuesta se descarta.
- Errores traducidos por el servicio: sin conexión, sesión vencida, sin permiso, falta
  aplicar la migración 003 y uno genérico.

## Cómo probar con los datos de prueba
1. Aplicar `supabase/migraciones/003-explorador.sql` y correr
   `supabase/manual/verificacion-003.sql` (todo `ok = true`).
2. Correr `supabase/manual/datos-de-prueba.sql` en el SQL Editor. Crea "Prueba —
   Ingeniería en Sistemas" (Carrera, 1º año con cuatro materias y sus secciones, 2º año
   vacía) y "Prueba — Carrera vacía".
3. `npx serve` y entrar con la cuenta admin; después con una de lector: tiene que verse
   igual.
4. Qué mirar:
   - Home: dos tarjetas ("Vacía" y "3 carpetas").
   - `1º año › Análisis Matemático I › Temario`: Clase 1 a Clase 11 en orden y
     "Cronograma.xlsx" al final; Clase 1 dice "1 carpeta · 3 archivos".
   - `Bibliografía`: tildes, mayúsculas y números mezclados en orden natural, un nombre muy
     largo cortado con "…" (completo en su hoja), "LEEME" sin extensión, pesos de 0 B a
     48 MB. En `Temario › Clase 2`, un video de 1,3 GB.
   - Atrás del navegador, Volver (va al padre), tramos de la ruta y recargar.
   - "Prueba — Carrera vacía" → "Esta carpeta está vacía". `#/carpeta/` + un uuid
     inventado o `#/carpeta/abc` → "Esta carpeta no existe".
5. Al terminar, `supabase/manual/borrar-datos-de-prueba.sql` (todo `ok = true`).

## De qué depende
- `js/core/supabase.js` (solo `servicio.js`): funciones `contenido_carpeta` y
  `ruta_carpeta` de la migración 003 (ver `docs/base-de-datos.md`).
- `js/ui/`: `titulo`, `ruta`, `lista`, `tarjeta`, `hoja`, `estados` (ver `docs/ui.md`).
- No depende de `auth`: no hay botones de admin todavía (llegan en el prompt 5, DS2).

## Decisiones relacionadas
D16, D25, RF3, RF6, RF9, RF10, RNF4, RNF5, DS2, DS4, DS6, AT5, EP2, EP3.
