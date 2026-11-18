# Componentes de interfaz (`js/ui/`)

**Prompt de implementación:** 3 · **Estilos:** `css/base.css` (estructura de pantalla) y
`css/componentes.css` (una sección comentada por componente) · **Valores:** `css/tokens.css`
(DS5, maqueta "Banco de Apuntes — Maqueta").

Los componentes de `js/ui/` existen para que los prompts 4 a 9 armen pantallas sin repetir
markup ni comportamiento. Reglas comunes:

- **Sin datos propios.** Reciben datos ya resueltos y devuelven elementos del DOM (o una
  promesa con la respuesta del usuario). No hablan con Supabase ni con R2.
- **Seguridad:** todo texto que viene de datos (nombres, emails, detalles) se inserta con
  `textContent`, nunca con `innerHTML`. El único `innerHTML` está en `iconos.js` y solo
  con los SVG fijos de ese archivo. Prueba: en el muestrario, `<b>prueba</b>.pdf` se ve tal
  cual, como texto.
- **Tokens:** los estilos usan solo variables de `tokens.css`; no hay colores ni radios
  sueltos.
- **Táctil:** todo lo tocable mide 44 px como mínimo (`--toque-min`).
- **Movimiento:** las animaciones duran `--duracion-animacion` (200 ms), que vale 0 con
  `prefers-reduced-motion: reduce`.

| Archivo | Para qué existe |
|---|---|
| `pantalla.js` | Estructura común de pantalla: encabezado fijo, contenido con scroll y pie opcional. |
| `iconos.js` | Los SVG de la maqueta, en un solo lugar. |
| `ruta.js` | Ruta de carpetas que colapsa los tramos del medio. |
| `titulo.js` | Título de pantalla con Volver y acción opcionales. |
| `lista.js` | Lista de carpetas y archivos estilo Drive. |
| `tarjeta.js` | Tarjeta de carrera de la Home. |
| `hoja.js` | Hoja inferior de acciones. |
| `dialogo.js` | Diálogo de confirmación (peligro o aviso). |
| `estados.js` | Estados vacío, cargando y error. |
| `aviso.js` | Aviso breve (toast). |
| `capa-modal.js` | Uso interno: accesibilidad compartida por la hoja y el diálogo. |

---

## `pantalla.js` — Estructura de pantalla

Columna de `100dvh` en tres filas: **encabezado** (quieto), **contenido** (lo único que
scrollea) y **pie** opcional (quieto, respeta `env(safe-area-inset-bottom)`). En pantallas
anchas, la columna se centra con un ancho máximo de 560 px (`--ancho-columna`) hasta la
versión de escritorio (prompt 10, DS6).

- **Encabezado:** marca (ícono dorado de libro + "Banco de Apuntes", enlace a `#/`), botón
  de cuenta (ícono de persona, 44 px, abre la hoja "Cuenta", EP1) y buscador.
- **Buscador: solo visual hasta el prompt 8.** Es un campo de solo lectura, fuera del orden
  de Tab, que no hace nada (comentado como PENDIENTE en el código).
- **Pie:** hasta dos botones de 50 px (secundario a la izquierda, principal a la derecha);
  se ve solo si la vista lo pide.

**La monta el router**, una vez, para todas las rutas privadas; el login va sin ella. La
vista recibe el contenedor de contenido y el objeto `pantalla`.

```js
crearPantalla({ alTocarCuenta })
// → { elemento, contenido, definirPie(botones | null), reiniciar() }

// Dentro de una vista (la llama el router):
export function montarMiVista(contenido, { parametros, pantalla }) {
  contenido.append(crearTitulo({ texto: 'Mi vista' }));
  pantalla.definirPie({
    secundario: { etiqueta: 'Nueva carpeta', icono: 'mas', alTocar: (boton) => {} },
    principal: { etiqueta: 'Subir', icono: 'subir', alTocar: (boton) => {} },
  });
}
```

Al cambiar de ruta, el router llama a `reiniciar()`: vacía el contenido, oculta el pie y
vuelve el scroll arriba.

## `iconos.js` — Íconos

```js
crearIcono(nombre, { tamano = 24, grosor = 1.8 }) // → <svg aria-hidden="true">
NOMBRES_ICONOS // libro, persona, lupa, volver, carpeta, descargar, lapiz, mover, papelera,
               // mas, subir, chevron, puntos (⋮), escudo, salir
```

Íconos de línea sobre una grilla de 24 × 24 con `currentColor`: el color lo da el CSS del
componente. Son decorativos (`aria-hidden`); el nombre accesible lo lleva el botón que los
contiene. `escudo` y `salir` se sumaron para "Panel admin" y "Cerrar sesión" de la hoja
"Cuenta".

## `ruta.js` — Ruta de carpetas

```js
crearRuta([
  { nombre: 'Banco', href: '#/' },
  { nombre: 'AM I', href: '#/carpeta/…' },
  { nombre: 'Parciales' }, // la actual: sin enlace
]) // → <nav aria-label="Ruta de carpetas">
```

- Va en una línea. Si no entra, colapsa los tramos del medio en "…", de izquierda a
  derecha, conservando siempre el primero y el último. Si ni así entra, el último se corta
  con "…". Se reajusta solo cuando cambia el ancho (`ResizeObserver`).
- El último tramo va en dorado, con `aria-current="page"`. El "…" lleva los nombres
  ocultos como `title` y `aria-label`.

## `titulo.js` — Título de pantalla

```js
crearTitulo({
  texto: 'Parciales',
  subtitulo: 'opcional',
  volver: { href: '#/carpeta/…' },      // o { alTocar: () => {} }; etiqueta = "Volver"
  accion: { etiqueta: '.zip', icono: 'descargar',
            etiquetaAccesible: 'Descargar la carpeta como .zip',
            alTocar: (boton) => {} },
}) // → <header class="titulo"> con <h1>
```

Título de 28 px / 800 / −0.6 px. Volver y la acción miden 44 px de alto.

## `lista.js` — Lista estilo Drive

```js
crearLista(items, { alAbrir, alMenu, etiqueta })
// items: [{ id, tipo: 'carpeta' | 'archivo', nombre, detalle?, extension?, href? }]
// → <ul class="lista">

crearIconoItem(tipo, nombre, extension?) // el ícono suelto (lo usa la hoja de acciones)
```

- Dibuja en el orden recibido: el orden natural con carpetas arriba (RF9) lo resuelve quien
  trae los datos.
- **Carpeta:** ícono dorado. **Archivo:** cuadro con la extensión (sale del nombre si no
  viene `extension`; máximo 4 letras).
- Fila: nombre (15 px / 600) y detalle (12 px: peso o cantidad de elementos). Los nombres
  largos se cortan con "…" sin romper la fila; el nombre completo queda en `title`.
- Con `href` la fila es un enlace; sin `href`, un botón que llama a `alAbrir(item)`.
- Con `alMenu`, cada fila suma un botón ⋮ de 44 px (`aria-label="Acciones de <nombre>"`)
  que llama a `alMenu(item, boton)`. Una fila con `menu: false` no lo lleva (prompt 4: las
  carpetas todavía no tienen acciones).

## `tarjeta.js` — Tarjeta de carrera

```js
crearTarjeta({ nombre, subtitulo, href }) // → <a class="tarjeta">
```

Ícono dorado de carpeta, nombre, subtítulo y chevron. Toda la tarjeta es el enlace. Para
apilar varias, van dentro de un contenedor con la clase `tarjetas` (grilla con 10 px de
separación).

## `hoja.js` — Hoja inferior

```js
const elegida = await abrirHoja({
  encabezado: { titulo: 'Parcial1_2025.pdf', detalle: '2,4 MB', icono: crearIconoItem(...) },
  // o, sin encabezado: etiqueta: 'Acciones'
  datos: [{ etiqueta: 'Ubicación', valor: 'Banco › AM I › Parciales' }], // opcional
  nota: 'La descarga llega pronto.',                                     // opcional
  acciones: [
    { id: 'descargar', etiqueta: 'Descargar', icono: 'descargar', tipo: 'destacada' },
    { id: 'renombrar', etiqueta: 'Renombrar', icono: 'lapiz' },
    { id: 'borrar', etiqueta: 'Borrar', icono: 'papelera', tipo: 'peligro' },
  ],
});
// elegida: el id de la acción, o null si se cerró sin elegir.
```

Velo `rgba(3,7,15,0.62)`, panel `#111F3B` con esquinas de arriba de 26 px, manija y
acciones de 52 px: **normal**, **destacada** (dorado) y **peligro** (`#F2A6A6`). La promesa
resuelve cuando la hoja terminó de cerrarse y el foco ya volvió.

- El título del encabezado muestra el nombre **completo**: si es largo, baja de línea.
- `datos`: pares etiqueta-valor (`<dl>`) debajo del encabezado.
- `nota`: aviso breve con borde dorado suave, debajo de los datos.

## `dialogo.js` — Diálogo de confirmación

```js
const ok = await confirmar({
  titulo: '¿Borrar "Clase 1"?',
  texto: 'Esta carpeta contiene 6 elementos…',
  confirmar: 'Borrar',
  cancelar: 'Cancelar',          // opcional
  variante: 'peligro',           // o 'aviso'
  icono: 'papelera',             // opcional
}); // true si confirmó; false si canceló, Escape o (solo aviso) el velo
```

- **peligro:** botón `#C9474A`. Para borrados (RF10). **Tocar el velo no lo cierra.**
- **aviso:** borde y botón dorados. Para archivo pesado (RNF9) y peso del .zip (AT7).
- Panel de 22 px, título de 18 px / 800, texto `#B5BFD2`. El foco arranca en "Cancelar",
  la opción segura.

## `estados.js` — Vacío, cargando y error

```js
crearEstadoVacio({ titulo = 'Esta carpeta está vacía', detalle?, icono = 'carpeta',
                   accion?: { etiqueta, href } })  // accion: enlace con forma de botón
crearEstadoCargando({ filas = 4, texto = 'Cargando…' }) // filas esqueleto, role="status"
crearEstadoError({ mensaje, alReintentar? })            // role="alert" + "Reintentar"
```

El esqueleto pulsa suave y se queda quieto con reduced-motion. El mensaje de error llega ya
traducido por el servicio.

## `aviso.js` — Aviso breve (toast)

```js
const cerrar = mostrarAviso('Carpeta creada', { tipo: 'exito' }); // 'exito' | 'error' | 'info'
limpiarAvisos(); // lo usa el router al cerrarse la sesión
```

Aparece abajo, por encima del pie, y se va solo (3,5 s; los errores, 6 s). Una sola región
`aria-live="polite"` para toda la app, que queda fuera de `inert` mientras hay una hoja o un
diálogo abiertos para que se siga anunciando.

## `capa-modal.js` — Accesibilidad de hoja y diálogo (interno)

No se usa directo desde las vistas. Concentra lo que comparten `hoja.js` y `dialogo.js`:

- `role="dialog"` y `aria-modal="true"` en el panel, con nombre accesible
  (`aria-labelledby` o `aria-label`).
- **Foco atrapado:** el resto de la página pasa a `inert` y Tab / Shift+Tab dan la vuelta
  dentro del panel.
- **Escape** cierra (la hoja, sin elegir; el diálogo, como "Cancelar").
- **Velo:** cierra la hoja y el diálogo de aviso; **no** el de peligro.
- **Foco de vuelta:** al cerrar, el foco vuelve al elemento que la abrió.
- `cerrarCapasAbiertas()`: el router la llama en cada cambio de ruta y al perder la sesión,
  así nada queda abierto encima de otra pantalla (RNF5).

## Muestrario (`#/muestrario`) — provisional

`js/muestrario/muestrario.js` muestra cada componente con datos de ejemplo: ruta larga (y
en un espacio angosto, para ver el "…"), título con Volver y ".zip", lista mezclada de
carpetas y archivos (con un nombre muy largo y `<b>prueba</b>.pdf`), tarjeta, hojas de
acciones de archivo y de carpeta, los tres diálogos de la maqueta (borrado, archivo pesado,
peso del .zip), los estados, avisos y un pie de ejemplo.

- **Única excepción** a "los datos nunca se escriben a mano": sus datos son de ejemplo,
  están escritos a mano a propósito, marcados como tales en el código y en pantalla, y
  ninguna acción hace cambios.
- Solo para admin (un lector va a `#/`).
- Vive en `js/muestrario/`, fuera de `js/modulos/` y de `js/ui/`, porque no es un módulo
  ni un componente.
- **Se borra en el prompt 11**, junto con su ruta en `js/core/router.js` y su sección en
  `css/componentes.css`.
