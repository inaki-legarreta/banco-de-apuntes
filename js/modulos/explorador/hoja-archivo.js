/*
 * modulos/explorador/hoja-archivo.js — Hoja de un archivo (prompt 4: solo información).
 * Responsabilidad: al tocar un archivo o su ⋮, mostrar su nombre completo, su peso y dónde
 * está (la ruta de carpetas), con la nota "La descarga llega pronto.".
 *
 * PENDIENTE: las acciones llegan después: Descargar en el prompt 6 (RF4) y, para el admin,
 * Renombrar, Mover y Borrar en los prompts 5 y 6 (RF8, DS2). Por ahora la única acción es
 * "Cerrar", para que en el celular haya algo que tocar además del velo.
 * No habla con Supabase: recibe todo resuelto.
 */

import { abrirHoja } from '../../ui/hoja.js';
import { crearIconoItem } from '../../ui/lista.js';
import { formatearPeso } from './formato.js';

/** Separador de la ruta en texto, el mismo que muestra ruta.js entre tramos. */
const SEPARADOR_RUTA = ' › ';

/** Nota fija mientras no exista la descarga (prompt 6). */
const NOTA_DESCARGA = 'La descarga llega pronto.';

/**
 * Abre la hoja de un archivo. El foco vuelve solo al elemento que la abrió (hoja.js).
 * @param {{ nombre: string, tamanoBytes: number | null }} archivo
 * @param {string[]} ruta nombres de las carpetas, desde "Banco" hasta la que lo contiene.
 * @returns {Promise<void>} cuando la hoja terminó de cerrarse.
 */
export async function abrirHojaArchivo(archivo, ruta) {
  await abrirHoja({
    encabezado: {
      titulo: archivo.nombre,
      detalle: formatearPeso(archivo.tamanoBytes),
      icono: crearIconoItem('archivo', archivo.nombre),
    },
    datos: [{ etiqueta: 'Ubicación', valor: ruta.join(SEPARADOR_RUTA) }],
    nota: NOTA_DESCARGA,
    acciones: [{ id: 'cerrar', etiqueta: 'Cerrar' }],
  });
}
