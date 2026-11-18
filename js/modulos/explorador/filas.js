/*
 * modulos/explorador/filas.js — Piezas compartidas por la home y la vista de carpeta.
 * Responsabilidad: convertir un elemento del árbol (lo que devuelve el servicio) en una
 * fila de js/ui/lista.js, y armar los enlaces a carpetas, para que las dos pantallas lo
 * hagan igual.
 */

import { formatearPeso, detalleCarpeta } from './formato.js';

/**
 * Nombre del primer tramo de la ruta (la home, DS4).
 * Existe para que la ruta de la pantalla y la "Ubicación" de la hoja digan lo mismo.
 */
export const NOMBRE_RAIZ = 'Banco';

/** Ruta de la home. */
export const HREF_INICIO = '#/';

/**
 * Enlace a la vista de una carpeta.
 * @param {string} id
 * @returns {string}
 */
export function hrefCarpeta(id) {
  return `#/carpeta/${id}`;
}

/**
 * Fila de la lista para un elemento:
 * - carpeta: enlace a su vista, detalle con su contenido ("4 carpetas · 3 archivos") y
 *   sin ⋮ (las acciones de carpeta llegan en el prompt 5);
 * - archivo: botón que abre su hoja, detalle con su peso y ⋮.
 * @param {import('./servicio.js').Elemento} elemento
 * @returns {object} fila para crearLista.
 */
export function aFila(elemento) {
  if (elemento.tipo === 'carpeta') {
    return {
      id: elemento.id,
      tipo: 'carpeta',
      nombre: elemento.nombre,
      detalle: detalleCarpeta(elemento.subcarpetas, elemento.archivos),
      href: hrefCarpeta(elemento.id),
      menu: false,
    };
  }
  return {
    id: elemento.id,
    tipo: 'archivo',
    nombre: elemento.nombre,
    detalle: formatearPeso(elemento.tamanoBytes),
    elemento,
  };
}
