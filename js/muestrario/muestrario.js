/*
 * muestrario/muestrario.js — Muestrario de componentes (ruta #/muestrario).
 *
 * PROVISIONAL: SE BORRA EN EL PROMPT 11, junto con su ruta y su sección de CSS.
 * Solo para admin: el router manda a un lector a #/.
 *
 * Responsabilidad: mostrar cada componente de js/ui/ con datos de prueba, para revisar a ojo
 * que se ven como en la maqueta (Interior, Acciones y Diálogos) y que su accesibilidad
 * funciona (Escape, velo, foco, Tab).
 *
 * EXCEPCIÓN DOCUMENTADA a "los datos nunca se escriben a mano" (CLAUDE.md): los datos de
 * este archivo son DE EJEMPLO, escritos a mano a propósito y marcados como tales. No salen
 * de ningún servicio, no se guardan en ningún lado y ninguna acción hace nada real.
 * Vive fuera de js/modulos/ y de js/ui/ porque no es un módulo de la app ni un componente.
 */

import { crearRuta } from '../ui/ruta.js';
import { crearTitulo } from '../ui/titulo.js';
import { crearLista, crearIconoItem } from '../ui/lista.js';
import { crearTarjeta } from '../ui/tarjeta.js';
import { abrirHoja } from '../ui/hoja.js';
import { confirmar } from '../ui/dialogo.js';
import { crearEstadoVacio, crearEstadoCargando, crearEstadoError } from '../ui/estados.js';
import { mostrarAviso } from '../ui/aviso.js';

/* ----------------------------------------------------------------------------------------
 * DATOS DE EJEMPLO (escritos a mano, ver encabezado)
 * -------------------------------------------------------------------------------------- */

/** EJEMPLO: ruta larga, para ver cómo colapsa los tramos del medio. */
const EJEMPLO_RUTA = [
  { nombre: 'Banco', href: '#/muestrario' },
  { nombre: 'Ingeniería en Sistemas', href: '#/muestrario' },
  { nombre: '1º año', href: '#/muestrario' },
  { nombre: 'AM I', href: '#/muestrario' },
  { nombre: 'Exámenes', href: '#/muestrario' },
  { nombre: 'Parciales' },
];

/**
 * EJEMPLO: contenido mezclado de una carpeta, ya en orden natural (carpetas arriba).
 * Incluye un nombre muy largo y uno con "<b>prueba</b>", que tiene que verse tal cual,
 * como texto (prueba de que no se usa innerHTML con datos).
 */
const EJEMPLO_ITEMS = [
  { id: 'e1', tipo: 'carpeta', nombre: 'Clase 1', detalle: '6 elementos' },
  { id: 'e2', tipo: 'carpeta', nombre: 'Clase 2', detalle: '4 elementos' },
  { id: 'e3', tipo: 'carpeta', nombre: 'Clase 10', detalle: '1 elemento' },
  {
    id: 'e4',
    tipo: 'carpeta',
    nombre:
      'Resúmenes y apuntes de la cátedra de Análisis Matemático I con ejercicios resueltos 2025',
    detalle: '23 elementos',
  },
  { id: 'e5', tipo: 'archivo', nombre: 'Parcial1_2025.pdf', detalle: '2,4 MB' },
  { id: 'e6', tipo: 'archivo', nombre: 'Foto del pizarrón.jpg', detalle: '3,1 MB' },
  { id: 'e7', tipo: 'archivo', nombre: 'Guía de trabajos prácticos.docx', detalle: '540 KB' },
  { id: 'e8', tipo: 'archivo', nombre: '<b>prueba</b>.pdf', detalle: '12 KB' },
  {
    id: 'e9',
    tipo: 'archivo',
    nombre:
      'Final_2024_diciembre_tema_A_con_resolucion_completa_y_criterios_de_correccion_v3.pdf',
    detalle: '8,7 MB',
  },
];

/** EJEMPLO: tarjeta de carrera de la Home. */
const EJEMPLO_CARRERA = {
  nombre: 'Ingeniería en Sistemas de Información',
  subtitulo: 'Plan 2023 · 5 años',
  href: '#/muestrario',
};

/** EJEMPLO: archivo para la hoja de acciones abierta desde un botón suelto. */
const EJEMPLO_ARCHIVO = EJEMPLO_ITEMS[4];

/** Aviso que acompaña a toda acción del muestrario: nada es real. */
const AVISO_EJEMPLO = 'Ejemplo: no se hizo ningún cambio.';

/* ----------------------------------------------------------------------------------------
 * Acciones de ejemplo
 * -------------------------------------------------------------------------------------- */

/** Abre la hoja de acciones de un item de ejemplo (como en la maqueta "Acciones"). */
async function abrirAccionesDe(item) {
  const esCarpeta = item.tipo === 'carpeta';
  const elegida = await abrirHoja({
    encabezado: {
      titulo: item.nombre,
      detalle: item.detalle,
      icono: crearIconoItem(item.tipo, item.nombre),
    },
    acciones: [
      esCarpeta
        ? { id: 'zip', etiqueta: 'Descargar .zip', icono: 'descargar', tipo: 'destacada' }
        : { id: 'descargar', etiqueta: 'Descargar', icono: 'descargar', tipo: 'destacada' },
      { id: 'renombrar', etiqueta: 'Renombrar', icono: 'lapiz' },
      { id: 'mover', etiqueta: 'Mover', icono: 'mover' },
      { id: 'borrar', etiqueta: 'Borrar', icono: 'papelera', tipo: 'peligro' },
    ],
  });
  if (elegida === 'borrar') await dialogoBorrado(item);
  else if (elegida === 'zip') await dialogoZip();
  else if (elegida) mostrarAviso(AVISO_EJEMPLO);
}

/** Diálogo de borrado (peligro, RF10). */
async function dialogoBorrado(item = EJEMPLO_ITEMS[0]) {
  const esCarpeta = item.tipo === 'carpeta';
  const ok = await confirmar({
    variante: 'peligro',
    icono: 'papelera',
    titulo: `¿Borrar "${item.nombre}"?`,
    texto: esCarpeta
      ? `Esta carpeta contiene ${item.detalle}. Se borra todo su contenido y no hay papelera.`
      : 'El archivo se borra para siempre: no hay papelera.',
    confirmar: 'Borrar',
  });
  mostrarAviso(ok ? `Ejemplo: confirmaste el borrado. ${AVISO_EJEMPLO}` : 'Cancelaste.', {
    tipo: ok ? 'exito' : 'info',
  });
}

/** Diálogo de archivo pesado (aviso, RNF9). */
async function dialogoArchivoPesado() {
  const ok = await confirmar({
    variante: 'aviso',
    icono: 'subir',
    titulo: 'Archivo pesado',
    texto:
      '"Clase 7 - grabación.mp4" pesa 184 MB. Puede tardar en subir y ocupa espacio del banco. ¿Subirlo igual?',
    confirmar: 'Subir igual',
  });
  mostrarAviso(ok ? `Ejemplo: elegiste subir. ${AVISO_EJEMPLO}` : 'Cancelaste.');
}

/** Diálogo del peso del .zip (aviso, AT7). */
async function dialogoZip() {
  const ok = await confirmar({
    variante: 'aviso',
    icono: 'descargar',
    titulo: 'Descargar "Parciales" como .zip',
    texto: 'La carpeta pesa 86 MB (14 archivos). El .zip se arma en tu dispositivo.',
    confirmar: 'Descargar',
  });
  mostrarAviso(ok ? `Ejemplo: elegiste descargar. ${AVISO_EJEMPLO}` : 'Cancelaste.');
}

/* ----------------------------------------------------------------------------------------
 * Armado de la pantalla
 * -------------------------------------------------------------------------------------- */

/** Sección con su subtítulo. */
function seccion(nombre, ...hijos) {
  const caja = document.createElement('section');
  caja.className = 'muestrario__seccion';
  const subtitulo = document.createElement('h2');
  subtitulo.className = 'muestrario__subtitulo';
  subtitulo.textContent = nombre;
  caja.append(subtitulo, ...hijos);
  return caja;
}

/** Fila de botones secundarios de prueba. */
function botones(definiciones) {
  const fila = document.createElement('div');
  fila.className = 'muestrario__botones';
  for (const { etiqueta, alTocar, clase = 'boton--secundario' } of definiciones) {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = `boton ${clase}`;
    boton.textContent = etiqueta;
    boton.addEventListener('click', alTocar);
    fila.append(boton);
  }
  return fila;
}

/**
 * Monta el muestrario en la zona de contenido.
 * @param {HTMLElement} contenedor
 * @param {{ pantalla: { definirPie: Function } }} contexto la estructura de pantalla, para
 *   mostrar el pie de ejemplo.
 */
export function montarMuestrario(contenedor, { pantalla }) {
  const raiz = document.createElement('div');
  raiz.className = 'muestrario';

  const nota = document.createElement('p');
  nota.className = 'muestrario__nota';
  nota.textContent =
    'Muestrario provisional (se borra en el prompt 11). Todos los datos son de ejemplo y ' +
    'ninguna acción hace cambios.';

  const rutaAngosta = document.createElement('div');
  rutaAngosta.className = 'muestrario__angosto';
  rutaAngosta.append(crearRuta(EJEMPLO_RUTA));

  raiz.append(
    nota,
    seccion(
      'Interior: ruta, título y lista',
      crearRuta(EJEMPLO_RUTA),
      crearTitulo({
        texto: 'Parciales',
        volver: { href: '#/' },
        accion: {
          etiqueta: '.zip',
          icono: 'descargar',
          etiquetaAccesible: 'Descargar la carpeta como .zip',
          alTocar: () => dialogoZip(),
        },
      }),
      crearLista(EJEMPLO_ITEMS, {
        alAbrir: (item) => mostrarAviso(`Ejemplo: abrirías "${item.nombre}".`),
        alMenu: (item) => abrirAccionesDe(item),
      }),
    ),
    seccion('Ruta en un espacio angosto (colapsa con "…")', rutaAngosta),
    seccion('Tarjeta de carrera', crearTarjeta(EJEMPLO_CARRERA)),
    seccion(
      'Acciones (hoja inferior)',
      botones([
        { etiqueta: 'Acciones de archivo', alTocar: () => abrirAccionesDe(EJEMPLO_ARCHIVO) },
        { etiqueta: 'Acciones de carpeta', alTocar: () => abrirAccionesDe(EJEMPLO_ITEMS[0]) },
      ]),
    ),
    seccion(
      'Diálogos',
      botones([
        { etiqueta: 'Borrado', alTocar: () => dialogoBorrado() },
        { etiqueta: 'Archivo pesado', alTocar: () => dialogoArchivoPesado() },
        { etiqueta: 'Peso del .zip', alTocar: () => dialogoZip() },
      ]),
    ),
    seccion('Estado vacío', crearEstadoVacio()),
    seccion('Estado cargando', crearEstadoCargando({ filas: 3 })),
    seccion(
      'Estado de error',
      crearEstadoError({
        mensaje: 'No se pudo cargar la carpeta. Revisá tu conexión.',
        alReintentar: () => mostrarAviso('Ejemplo: reintentarías la carga.'),
      }),
    ),
    seccion(
      'Avisos',
      botones([
        {
          etiqueta: 'Aviso de éxito',
          alTocar: () => mostrarAviso('Ejemplo: carpeta creada.', { tipo: 'exito' }),
        },
        {
          etiqueta: 'Aviso de error',
          alTocar: () =>
            mostrarAviso('Ejemplo: no se pudo subir el archivo.', { tipo: 'error' }),
        },
      ]),
    ),
  );

  contenedor.append(raiz);

  // Pie de ejemplo (en la app real, solo con botones de admin: DS2, DS5).
  pantalla.definirPie({
    secundario: { etiqueta: 'Nueva carpeta', icono: 'mas', alTocar: () => mostrarAviso(AVISO_EJEMPLO) },
    principal: { etiqueta: 'Subir', icono: 'subir', alTocar: () => dialogoArchivoPesado() },
  });
}
