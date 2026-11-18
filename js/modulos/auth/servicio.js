/*
 * modulos/auth/servicio.js — Servicio de sesión del módulo "auth".
 * Responsabilidad: iniciar y cerrar sesión (RF1), leer la sesión y el rol, avisar cuando la
 * sesión cambia y aplicar el cierre por inactividad (RNF6, LS3). Es la única parte del
 * módulo que habla con Supabase: las pantallas solo llaman a estas funciones.
 */

import {
  supabase,
  recordarmeActivo,
  guardarPreferenciaRecordarme,
  borrarSesionGuardada,
} from '../../core/supabase.js';
import { MINUTOS_INACTIVIDAD } from '../../core/config.js';
import {
  iniciarVigilancia,
  detenerVigilancia,
  registrarActividad,
  olvidarActividad,
  inactividadVencida,
} from './inactividad.js';

/**
 * Mensajes de error en español que ve el usuario.
 * Existen para no mostrar nunca los mensajes en inglés de Supabase y para no revelar si un
 * email existe: cualquier rechazo de credenciales da el mismo texto.
 */
const MENSAJES_ERROR = Object.freeze({
  credenciales: 'El email o la contraseña no son correctos.',
  demasiadosIntentos: 'Hubo demasiados intentos. Esperá unos minutos y volvé a probar.',
  sinConexion: 'No hay conexión a internet. Revisá tu conexión y volvé a intentar.',
  generico: 'No se pudo completar la operación. Probá de nuevo en un rato.',
});

/**
 * Avisos que muestra la pantalla de login según por qué se cerró la sesión.
 * El cierre pedido por el usuario no lleva aviso.
 */
const AVISOS_CIERRE = Object.freeze({
  inactividad: 'Tu sesión se cerró por inactividad.',
  externo: 'Tu sesión se cerró. Ingresá de nuevo para seguir.',
});

/**
 * Clave en sessionStorage del aviso pendiente para la pantalla de login.
 * Existe en sessionStorage para que el aviso sobreviva a la recarga de emergencia de
 * cerrarSesion y se muestre una sola vez.
 */
const CLAVE_AVISO_CIERRE = 'banco-apuntes:aviso-cierre';

/** Funciones registradas con alCambiarSesion. */
const suscriptores = new Set();

/**
 * Si la última vez que se miró había sesión. Existe para detectar cierres hechos por fuera
 * (otra pestaña, token que no se pudo renovar) y avisar al usuario.
 * @type {boolean | null}
 */
let habiaSesion = null;

/** true mientras esta pestaña está cerrando la sesión a propósito. */
let cierrePropio = false;

/**
 * Error con un mensaje ya traducido, listo para mostrar.
 * Existe para que la UI distinga errores propios de fallas inesperadas.
 */
export class ErrorAuth extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorAuth';
  }
}

/**
 * Indica si un error es por falta de conexión.
 * supabase-js usa AuthRetryableFetchError con status 0 cuando la red falla; fetch lanza
 * TypeError cuando no puede conectar.
 */
function esSinConexion(error) {
  if (!navigator.onLine) return true;
  if (error?.name === 'AuthRetryableFetchError' && !error.status) return true;
  return error instanceof TypeError;
}

/**
 * Traduce un error de inicio de sesión a un mensaje en español.
 * Todo rechazo 400 (credenciales inválidas, email sin confirmar, cuenta bloqueada) da el
 * mismo mensaje, para no revelar si el email existe.
 * @returns {string}
 */
function traducirErrorLogin(error) {
  if (esSinConexion(error)) return MENSAJES_ERROR.sinConexion;
  if (error?.status === 429 || String(error?.code ?? '').includes('rate_limit')) {
    return MENSAJES_ERROR.demasiadosIntentos;
  }
  if (error?.code === 'invalid_credentials' || error?.status === 400) {
    return MENSAJES_ERROR.credenciales;
  }
  return MENSAJES_ERROR.generico;
}

/** Traduce un error al leer datos (perfil) a un mensaje en español. */
function traducirErrorDatos(error) {
  return esSinConexion(error) ? MENSAJES_ERROR.sinConexion : MENSAJES_ERROR.generico;
}

/** Guarda el aviso que tiene que mostrar el login. */
function guardarAvisoCierre(motivo) {
  const aviso = AVISOS_CIERRE[motivo];
  if (!aviso) return;
  try {
    window.sessionStorage.setItem(CLAVE_AVISO_CIERRE, aviso);
  } catch {
    // Sin almacenamiento no hay aviso, pero la sesión se cierra igual.
  }
}

/**
 * Devuelve el aviso pendiente de cierre de sesión (o null) y lo borra.
 * Existe para que la pantalla de login lo muestre una sola vez.
 * @returns {string | null}
 */
export function consumirAvisoCierre() {
  try {
    const aviso = window.sessionStorage.getItem(CLAVE_AVISO_CIERRE);
    window.sessionStorage.removeItem(CLAVE_AVISO_CIERRE);
    return aviso;
  } catch {
    return null;
  }
}

/**
 * Prende o apaga la vigilancia de inactividad según haya sesión y "Recordarme" (LS3).
 */
function actualizarVigilancia(haySesion) {
  if (haySesion && !recordarmeActivo()) {
    iniciarVigilancia({
      minutos: MINUTOS_INACTIVIDAD,
      alVencer: () => cerrarSesion('inactividad'),
    });
  } else {
    detenerVigilancia();
  }
}

/**
 * Devuelve la sesión actual o null.
 * La sesión sirve para decidir qué pantalla mostrar; la protección real de los datos es RLS.
 * @returns {Promise<object | null>} la sesión de supabase-js (con `user.email`, `user.id`).
 */
export async function obtenerSesion() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session ?? null;
  } catch {
    return null;
  }
}

/**
 * Al arrancar la app: devuelve la sesión guardada, salvo que se haya vencido por
 * inactividad mientras la pestaña estaba cerrada o recargándose; en ese caso la cierra y
 * devuelve null. Existe para que el router no muestre ni un instante una pantalla privada
 * de una sesión vencida.
 */
export async function restaurarSesion() {
  let sesion = await obtenerSesion();
  if (sesion && !recordarmeActivo() && inactividadVencida(MINUTOS_INACTIVIDAD)) {
    await cerrarSesion('inactividad');
    sesion = null;
  }
  habiaSesion = Boolean(sesion);
  actualizarVigilancia(habiaSesion);
  return sesion;
}

/**
 * Inicia sesión con email y contraseña (RF1).
 * La preferencia "Recordarme" se guarda ANTES de llamar a Supabase, para que la sesión
 * nueva quede en el almacenamiento que corresponde (LS3).
 * @param {string} email
 * @param {string} contrasena
 * @param {boolean} recordarme
 * @throws {ErrorAuth} con el mensaje en español si no se pudo.
 */
export async function iniciarSesion(email, contrasena, recordarme) {
  guardarPreferenciaRecordarme(recordarme);
  olvidarActividad();

  let error;
  try {
    ({ error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: contrasena,
    }));
  } catch (excepcion) {
    error = excepcion;
  }
  if (error) throw new ErrorAuth(traducirErrorLogin(error));

  registrarActividad(true);
}

/**
 * Cierra la sesión de este dispositivo (RF1).
 * Usa scope "local": cerrar sesión en una compu ajena no cierra las demás sesiones del
 * usuario. Si Supabase no responde (por ejemplo, sin conexión), se borra la sesión guardada
 * a mano y se recarga en el login: el dispositivo nunca queda con sesión.
 * @param {'usuario' | 'inactividad'} [motivo] define el aviso que muestra el login.
 */
export async function cerrarSesion(motivo = 'usuario') {
  detenerVigilancia();
  olvidarActividad();
  guardarAvisoCierre(motivo);
  cierrePropio = true;
  perfilEnCache = null;

  let error;
  try {
    ({ error } = await supabase.auth.signOut({ scope: 'local' }));
  } catch (excepcion) {
    error = excepcion;
  }
  // Después del signOut: antes, el adaptador buscaría la sesión en el almacén equivocado.
  guardarPreferenciaRecordarme(false);

  if (error) {
    borrarSesionGuardada();
    window.location.replace(`${window.location.pathname}${window.location.search}#/login`);
    window.location.reload();
  }
}

/**
 * Perfil ya leído de la sesión actual, para no consultar la base en cada navegación (la
 * guardia de rutas de admin y la hoja "Cuenta" lo piden seguido).
 * Se descarta cuando cambia el usuario de la sesión o se cierra (procesarCambio).
 * @type {{ idUsuario: string, promesa: Promise<object> } | null}
 */
let perfilEnCache = null;

/**
 * Devuelve el perfil del usuario de la sesión: email y rol (leído de su fila en perfiles,
 * que RLS deja leer solo a su dueño). Devuelve null si no hay sesión. Se guarda en caché
 * mientras dure la sesión de ese usuario; un error no queda en caché.
 * @returns {Promise<{ id: string, email: string, rol: 'admin' | 'lector' | null } | null>}
 * @throws {ErrorAuth} si no se pudo leer.
 */
export async function obtenerPerfil() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;

  if (perfilEnCache?.idUsuario !== sesion.user.id) {
    const promesa = leerPerfil(sesion);
    perfilEnCache = { idUsuario: sesion.user.id, promesa };
    promesa.catch(() => {
      if (perfilEnCache?.promesa === promesa) perfilEnCache = null;
    });
  }
  return perfilEnCache.promesa;
}

/**
 * Indica si el usuario de la sesión es admin. Si no hay sesión o no se pudo leer el rol,
 * devuelve false (ante la duda, sin botones ni pantallas de admin).
 * Ocultar cosas según el rol es solo comodidad: la protección real es RLS (AT5).
 * @returns {Promise<boolean>}
 */
export async function esAdmin() {
  try {
    const perfil = await obtenerPerfil();
    return perfil?.rol === 'admin';
  } catch {
    return false;
  }
}

/** Lee el rol de la fila propia en perfiles (la consulta real detrás de obtenerPerfil). */
async function leerPerfil(sesion) {
  let respuesta;
  try {
    respuesta = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', sesion.user.id)
      .maybeSingle();
  } catch (excepcion) {
    throw new ErrorAuth(traducirErrorDatos(excepcion));
  }
  if (respuesta.error) throw new ErrorAuth(traducirErrorDatos(respuesta.error));

  return { id: sesion.user.id, email: sesion.user.email, rol: respuesta.data?.rol ?? null };
}

/**
 * Registra una función que se llama cada vez que la sesión cambia (inicio, cierre, cierre
 * en otra pestaña, token que no se pudo renovar).
 * @param {(cambio: { evento: string, sesion: object | null }) => void} callback
 * @returns {() => void} función para dejar de escuchar.
 */
export function alCambiarSesion(callback) {
  suscriptores.add(callback);
  return () => suscriptores.delete(callback);
}

/**
 * Procesa un cambio de sesión informado por supabase-js.
 * Vuelve a leer la sesión del almacenamiento en lugar de confiar en el evento: un evento que
 * llega desde otra pestaña puede no corresponder a lo que esta pestaña tiene guardado (por
 * ejemplo, con la sesión en sessionStorage).
 */
async function procesarCambio(evento) {
  const sesion = await obtenerSesion();
  const haySesion = Boolean(sesion);

  if (habiaSesion && !haySesion && !cierrePropio) guardarAvisoCierre('externo');
  if (perfilEnCache && perfilEnCache.idUsuario !== sesion?.user?.id) perfilEnCache = null;
  if (!haySesion) cierrePropio = false;
  habiaSesion = haySesion;

  actualizarVigilancia(haySesion);
  suscriptores.forEach((callback) => callback({ evento, sesion }));
}

// Una sola suscripción a supabase-js para todo el módulo. Se difiere con setTimeout porque
// supabase-js recomienda no llamar a otros métodos de auth dentro del callback (bloqueo).
supabase.auth.onAuthStateChange((evento) => {
  window.setTimeout(() => procesarCambio(evento), 0);
});
