/*
 * modulos/auth/inactividad.js — Vigilancia de inactividad de la sesión (RNF6, LS3).
 * Responsabilidad: registrar cuándo fue la última actividad del usuario y avisar cuando pasa
 * el tiempo máximo sin uso. No sabe nada de Supabase: quien la usa decide qué hacer al
 * vencer (el servicio de auth cierra la sesión).
 *
 * Solo se activa con "Recordarme" desactivado; eso lo decide el servicio.
 */

/**
 * Clave en sessionStorage con el momento (ms) de la última actividad.
 * Existe en sessionStorage para que el tiempo siga contando entre recargas de la página y
 * desaparezca al cerrar el navegador, junto con la sesión.
 */
const CLAVE_ULTIMA_ACTIVIDAD = 'banco-apuntes:ultima-actividad';

/**
 * Mínimo de milisegundos entre dos registros de actividad (throttling).
 * Existe para no escribir en sessionStorage en cada evento de scroll o tecla.
 */
const ESPERA_ENTRE_REGISTROS_MS = 15 * 1000;

/**
 * Cada cuánto se revisa si se venció el tiempo (además de al volver a la pestaña).
 */
const INTERVALO_REVISION_MS = 60 * 1000;

/**
 * Eventos que cuentan como actividad: toques y clics (pointerdown), teclas, scroll y rueda.
 * Volver a la pestaña se maneja aparte, porque antes de contarlo hay que revisar si ya venció.
 */
const EVENTOS_ACTIVIDAD = ['pointerdown', 'keydown', 'scroll', 'wheel'];

/**
 * Estado de la vigilancia en curso, o null si no hay ninguna.
 * Existe para que iniciar sea idempotente y detener sepa qué limpiar.
 * @type {{ minutos: number, alVencer: () => void, temporizador: number } | null}
 */
let vigilancia = null;

/** Momento del último registro escrito, para el throttling. */
let ultimoRegistro = 0;

/** Lee la última actividad guardada (ms) o null si no hay. */
function leerUltimaActividad() {
  try {
    const valor = Number(window.sessionStorage.getItem(CLAVE_ULTIMA_ACTIVIDAD));
    return Number.isFinite(valor) && valor > 0 ? valor : null;
  } catch {
    return null;
  }
}

/**
 * Registra "ahora" como última actividad.
 * Existe para que cualquier uso de la app reinicie la cuenta regresiva.
 * @param {boolean} [forzar] true para escribir aunque no haya pasado la espera del throttling.
 */
export function registrarActividad(forzar = false) {
  const ahora = Date.now();
  if (!forzar && ahora - ultimoRegistro < ESPERA_ENTRE_REGISTROS_MS) return;
  ultimoRegistro = ahora;
  try {
    window.sessionStorage.setItem(CLAVE_ULTIMA_ACTIVIDAD, String(ahora));
  } catch {
    // Sin sessionStorage la vigilancia sigue funcionando con la pestaña abierta.
  }
}

/**
 * Borra la última actividad guardada.
 * Existe para que una sesión nueva no herede el tiempo de una anterior en la misma pestaña.
 */
export function olvidarActividad() {
  ultimoRegistro = 0;
  try {
    window.sessionStorage.removeItem(CLAVE_ULTIMA_ACTIVIDAD);
  } catch {
    // Nada que limpiar si el almacenamiento está bloqueado.
  }
}

/**
 * Indica si pasaron más de `minutos` desde la última actividad guardada.
 * Existe para revisar al arrancar (por ejemplo, tras una recarga) antes de mostrar nada.
 * Si no hay actividad guardada, no está vencida.
 * @param {number} minutos
 * @returns {boolean}
 */
export function inactividadVencida(minutos) {
  const ultima = leerUltimaActividad();
  return ultima !== null && Date.now() - ultima >= minutos * 60 * 1000;
}

/** Handler común de los eventos de actividad (respeta el throttling). */
function alHaberActividad() {
  registrarActividad();
}

/**
 * Revisa si venció el tiempo; si venció, detiene la vigilancia y avisa.
 * @returns {boolean} true si venció.
 */
function revisar() {
  if (!vigilancia) return false;
  if (!inactividadVencida(vigilancia.minutos)) return false;
  const { alVencer } = vigilancia;
  detenerVigilancia();
  alVencer();
  return true;
}

/**
 * Al volver a la pestaña: primero se revisa (si estuvo una hora afuera, se cierra) y solo
 * si sigue vigente, volver cuenta como actividad.
 */
function alVolver() {
  if (document.visibilityState !== 'visible') return;
  if (!revisar()) registrarActividad(true);
}

/**
 * Empieza a vigilar la inactividad. Si ya había una vigilancia, no hace nada.
 * @param {{ minutos: number, alVencer: () => void }} opciones
 */
export function iniciarVigilancia({ minutos, alVencer }) {
  if (vigilancia) return;
  if (leerUltimaActividad() === null) registrarActividad(true);

  vigilancia = {
    minutos,
    alVencer,
    temporizador: window.setInterval(revisar, INTERVALO_REVISION_MS),
  };
  // capture: el scroll no burbujea, así que se escucha en la fase de captura.
  EVENTOS_ACTIVIDAD.forEach((evento) =>
    document.addEventListener(evento, alHaberActividad, { capture: true, passive: true }),
  );
  document.addEventListener('visibilitychange', alVolver);
  window.addEventListener('focus', alVolver);
}

/**
 * Deja de vigilar (al cerrar sesión o si se activa "Recordarme").
 */
export function detenerVigilancia() {
  if (!vigilancia) return;
  window.clearInterval(vigilancia.temporizador);
  EVENTOS_ACTIVIDAD.forEach((evento) =>
    document.removeEventListener(evento, alHaberActividad, { capture: true }),
  );
  document.removeEventListener('visibilitychange', alVolver);
  window.removeEventListener('focus', alVolver);
  vigilancia = null;
}
