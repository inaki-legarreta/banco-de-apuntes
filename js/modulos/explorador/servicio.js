/*
 * modulos/explorador/servicio.js — Servicio de lectura del árbol (RF3, RF9).
 * Responsabilidad: traer de Supabase el contenido de una carpeta y su ruta, con las
 * funciones de supabase/migraciones/003-explorador.sql, y devolverlos listos para la UI:
 * nombres de campo en camelCase, contenido en orden natural (RF9) y errores en español.
 * Es la única parte del módulo que habla con Supabase: las pantallas solo llaman a estas
 * funciones (CLAUDE.md, "Separación de responsabilidades").
 *
 * Solo lectura. Lo ven igual admin y lector (D16, DS2): acá no se mira el rol.
 * Sin sesión, la base no devuelve nada (RNF5): las funciones son security invoker y anon
 * no puede ejecutarlas.
 */

import { supabase } from '../../core/supabase.js';
import { ordenarNatural } from './orden.js';

/**
 * Mensajes de error en español que ve el usuario.
 * Existen para no mostrar nunca los mensajes en inglés de Supabase o de PostgREST.
 */
const MENSAJES_ERROR = Object.freeze({
  sinConexion: 'No hay conexión a internet. Revisá tu conexión y volvé a intentar.',
  sesionVencida: 'Tu sesión venció. Volvé a ingresar para seguir.',
  sinPermiso: 'No tenés permiso para ver esta carpeta.',
  faltaMigracion:
    'La base de datos no está actualizada (falta aplicar la migración 003). Avisale al administrador.',
  generico: 'No se pudo cargar la carpeta. Probá de nuevo en un rato.',
});

/**
 * Error con un mensaje ya traducido, listo para mostrar.
 * Existe para que la UI distinga errores propios de fallas inesperadas.
 */
export class ErrorExplorador extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorExplorador';
  }
}

/**
 * Traduce un error de supabase-js (o de fetch) a un mensaje en español.
 * - Sin red, supabase-js devuelve el TypeError de fetch dentro del mensaje.
 * - PGRST301 / 401: el token de la sesión venció o no es válido.
 * - 42501: permiso denegado (por ejemplo, sin sesión).
 * - PGRST202: la función no existe (no se aplicó 003).
 * @returns {string}
 */
function traducirError(error) {
  const mensaje = String(error?.message ?? '');
  if (
    !navigator.onLine ||
    error instanceof TypeError ||
    /Failed to fetch|NetworkError|Load failed/i.test(mensaje)
  ) {
    return MENSAJES_ERROR.sinConexion;
  }
  if (error?.code === 'PGRST301' || error?.status === 401 || /JWT/i.test(mensaje)) {
    return MENSAJES_ERROR.sesionVencida;
  }
  if (error?.code === '42501') return MENSAJES_ERROR.sinPermiso;
  if (error?.code === 'PGRST202') return MENSAJES_ERROR.faltaMigracion;
  return MENSAJES_ERROR.generico;
}

/**
 * Llama a una función de la base y devuelve sus filas.
 * Existe para que las dos lecturas manejen los errores de la misma forma.
 * @param {string} nombreFuncion
 * @param {object} argumentos
 * @returns {Promise<object[]>}
 * @throws {ErrorExplorador}
 */
async function llamar(nombreFuncion, argumentos) {
  let respuesta;
  try {
    respuesta = await supabase.rpc(nombreFuncion, argumentos);
  } catch (excepcion) {
    throw new ErrorExplorador(traducirError(excepcion));
  }
  if (respuesta.error) throw new ErrorExplorador(traducirError(respuesta.error));
  return respuesta.data ?? [];
}

/**
 * Elemento del árbol tal como lo usa la UI.
 * @typedef {object} Elemento
 * @property {string} id
 * @property {string} nombre
 * @property {'carpeta' | 'archivo'} tipo
 * @property {number | null} tamanoBytes  peso del archivo (null en carpetas).
 * @property {string} actualizadoEn        fecha ISO de la última modificación.
 * @property {number | null} subcarpetas   subcarpetas directas (null en archivos).
 * @property {number | null} archivos      archivos directos (null en archivos).
 */

/**
 * Contenido directo de una carpeta, en orden natural: carpetas arriba y archivos abajo
 * (RF9). Una sola consulta, con los conteos de cada subcarpeta incluidos (RNF4).
 * @param {string | null} idCarpeta id de la carpeta; null = carpetas raíz (home, DS4).
 * @returns {Promise<Elemento[]>} vacío si la carpeta está vacía o no existe (para saber
 *   cuál de los dos casos es, usar obtenerRuta).
 * @throws {ErrorExplorador}
 */
export async function obtenerContenido(idCarpeta) {
  const filas = await llamar('contenido_carpeta', { p_padre: idCarpeta ?? null });
  return ordenarNatural(
    filas.map((fila) => ({
      id: fila.id,
      nombre: fila.nombre,
      tipo: fila.tipo,
      tamanoBytes: fila.tamano_bytes ?? null,
      actualizadoEn: fila.actualizado_en,
      subcarpetas: fila.subcarpetas ?? null,
      archivos: fila.archivos ?? null,
    })),
  );
}

/**
 * Ruta de una carpeta: sus ancestros de la raíz hacia abajo, incluida ella misma. Sirve
 * para la ruta de la pantalla, el título y el destino de Volver (EP3).
 * @param {string} idCarpeta
 * @returns {Promise<Array<{ id: string, nombre: string }>>} vacío si el id no existe o no
 *   es una carpeta ("Esta carpeta no existe").
 * @throws {ErrorExplorador}
 */
export async function obtenerRuta(idCarpeta) {
  const filas = await llamar('ruta_carpeta', { p_id: idCarpeta });
  // La base ya las devuelve en orden; se reordena por profundidad para no depender de eso.
  return [...filas]
    .sort((a, b) => a.profundidad - b.profundidad)
    .map((fila) => ({ id: fila.id, nombre: fila.nombre }));
}
