/*
 * modulos/auth/index.js — Punto de entrada público del módulo "auth".
 * Responsabilidad: manejar el inicio y cierre de sesión, la sesión activa, el cierre por
 * inactividad y el rol del usuario (admin o lector).
 * Todo lo que otros módulos o el router usen de "auth" se importa desde este archivo.
 * Documentación: docs/modulos/auth.md
 */

/**
 * Nombre del módulo.
 * Existe para identificarlo en logs y en el registro de rutas sin escribir el texto a mano.
 */
export const nombreModulo = 'auth';

// Servicio: lo único del módulo que habla con Supabase.
export {
  iniciarSesion,
  cerrarSesion,
  obtenerSesion,
  obtenerPerfil,
  esAdmin,
  alCambiarSesion,
  restaurarSesion,
  ErrorAuth,
} from './servicio.js';

// Pantallas.
export { montarPantallaLogin } from './pantalla-login.js';
// Hoja "Cuenta" del botón de persona del encabezado (EP1).
export { abrirHojaCuenta } from './hoja-cuenta.js';
