/*
 * modulos/explorador/index.js — Punto de entrada público del módulo "explorador".
 * Responsabilidad: mostrar y navegar el árbol de carpetas y archivos en orden natural, con
 * carpetas arriba y archivos abajo (RF3, RF9).
 * Todo lo que otros módulos o el router usen de "explorador" se importa desde este archivo.
 * Documentación: docs/modulos/explorador.md
 *
 * Prompt 4: navegación de solo lectura (home de carreras y vista de carpeta). La gestión
 * de carpetas del admin llega en el prompt 5.
 */

/**
 * Nombre del módulo.
 * Existe para identificarlo en logs y en el registro de rutas sin escribir el texto a mano.
 */
export const nombreModulo = 'explorador';

// Pantallas.
export { montarPantallaInicio } from './pantalla-inicio.js';
export { montarPantallaCarpeta, montarCarpetaInexistente } from './pantalla-carpeta.js';

// Servicio (lectura del árbol) y orden natural, para otros módulos (por ejemplo, búsqueda).
export { obtenerContenido, obtenerRuta, ErrorExplorador } from './servicio.js';
export { ordenarNatural, compararNatural } from './orden.js';
