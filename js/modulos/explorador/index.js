/*
 * modulos/explorador/index.js — Punto de entrada público del módulo "explorador".
 * Responsabilidad: mostrar y navegar el árbol de carpetas y archivos en orden natural, con carpetas arriba y archivos abajo.
 * Todo lo que otros módulos o el router usen de "explorador" se importa desde este archivo.
 * Documentación: docs/modulos/explorador.md
 *
 * Prompt 3: solo la estructura del inicio (sin datos). La navegación real llega en el
 * prompt 4.
 */

/**
 * Nombre del módulo.
 * Existe para identificarlo en logs y en el registro de rutas sin escribir el texto a mano.
 */
export const nombreModulo = 'explorador';

// Pantallas.
export { montarPantallaInicio } from './pantalla-inicio.js';
