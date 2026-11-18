/*
 * modulos/admin/index.js — Punto de entrada público del módulo "admin".
 * Responsabilidad: dar de alta y de baja cuentas de lectores y mostrar el espacio usado del banco.
 * Todo lo que otros módulos o el router usen de "admin" se importa desde este archivo.
 * Documentación: docs/modulos/admin.md
 *
 * Prompt 3: solo el cuerpo provisional de #/admin. El panel real se implementa en el prompt 9.
 */

/**
 * Nombre del módulo.
 * Existe para identificarlo en logs y en el registro de rutas sin escribir el texto a mano.
 */
export const nombreModulo = 'admin';

// PROVISIONAL HASTA EL PROMPT 9: cuerpo de #/admin mientras no existe el panel real.
export { montarPanelProvisional } from './pantalla-provisional.js';
