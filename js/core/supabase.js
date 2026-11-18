/*
 * supabase.js — Cliente único de Supabase para el navegador.
 * Responsabilidad: crear y exponer una sola instancia del cliente (Auth + Postgres) y decidir
 * dónde se guarda la sesión según la preferencia "Recordarme" (LS3).
 *
 * Es el ÚNICO archivo del proyecto que importa supabase-js. Solo lo usan las funciones de
 * servicio de los módulos; la UI nunca lo importa.
 *
 * supabase-js se carga desde jsDelivr con versión EXACTA (LS2): sin npm ni compilación en el
 * frontend (AT4). Cambiar la versión se anota en docs/PROGRESO.md.
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, configuracionCompleta } from './config.js';

/**
 * Clave en localStorage de la preferencia "Recordarme en este dispositivo".
 * Existe para saber, incluso después de cerrar el navegador, en qué almacenamiento buscar la
 * sesión. Vive en localStorage porque tiene que sobrevivir al cierre.
 */
const CLAVE_RECORDARME = 'banco-apuntes:recordarme';

/**
 * Clave con la que supabase-js guarda la sesión (y sus datos auxiliares, con sufijos).
 * Existe para usar un nombre propio del proyecto en lugar del genérico de Supabase.
 */
const CLAVE_SESION = 'banco-apuntes:sesion';

/**
 * Ejecuta un acceso a localStorage/sessionStorage sin romper la app si el navegador lo
 * bloquea (algunos modos privados lanzan excepción).
 * Existe para no repetir try/catch en cada acceso al almacenamiento.
 * @template T
 * @param {() => T} accion
 * @param {T} [porDefecto]
 * @returns {T}
 */
function intentar(accion, porDefecto) {
  try {
    return accion();
  } catch {
    return porDefecto;
  }
}

/**
 * Indica si la preferencia "Recordarme" está activa en este dispositivo.
 * Existe para elegir el almacenamiento de la sesión y para saber si aplica el cierre por
 * inactividad (LS3).
 * @returns {boolean}
 */
export function recordarmeActivo() {
  return intentar(() => window.localStorage.getItem(CLAVE_RECORDARME) === 'si', false);
}

/**
 * Guarda la preferencia "Recordarme". Se llama ANTES de iniciar sesión, para que la sesión
 * nueva se guarde directamente en el almacenamiento correcto.
 * @param {boolean} activo
 */
export function guardarPreferenciaRecordarme(activo) {
  intentar(() => {
    if (activo) window.localStorage.setItem(CLAVE_RECORDARME, 'si');
    else window.localStorage.removeItem(CLAVE_RECORDARME);
  });
}

/**
 * Almacenamiento donde corresponde guardar la sesión según "Recordarme":
 * localStorage sobrevive al cierre del navegador; sessionStorage, no (LS3).
 * @returns {Storage}
 */
function almacenElegido() {
  return recordarmeActivo() ? window.localStorage : window.sessionStorage;
}

/**
 * El almacenamiento que NO corresponde, para limpiar restos de una sesión anterior.
 * @returns {Storage}
 */
function almacenOpuesto() {
  return recordarmeActivo() ? window.sessionStorage : window.localStorage;
}

/**
 * Adaptador de almacenamiento que recibe supabase-js.
 * Existe para que supabase-js no sepa nada de "Recordarme": lee y escribe en el almacén
 * elegido, y al borrar limpia los dos para que no quede ninguna sesión guardada.
 */
const almacenamientoSesion = {
  getItem: (clave) => intentar(() => almacenElegido().getItem(clave), null),
  setItem: (clave, valor) => {
    intentar(() => almacenElegido().setItem(clave, valor));
    intentar(() => almacenOpuesto().removeItem(clave));
  },
  removeItem: (clave) => {
    intentar(() => window.localStorage.removeItem(clave));
    intentar(() => window.sessionStorage.removeItem(clave));
  },
};

/**
 * Borra a mano todo lo que supabase-js haya guardado de la sesión, en ambos almacenes.
 * Existe como último recurso cuando cerrar sesión falla (por ejemplo, sin conexión): el
 * dispositivo tiene que quedar sin sesión igual.
 */
export function borrarSesionGuardada() {
  for (const almacen of [window.localStorage, window.sessionStorage]) {
    intentar(() => {
      Object.keys(almacen)
        .filter((clave) => clave.startsWith(CLAVE_SESION))
        .forEach((clave) => almacen.removeItem(clave));
    });
  }
}

// Defensa: el router no importa este archivo si la configuración está incompleta, pero si
// alguien lo hiciera, el error tiene que explicar qué falta.
if (!configuracionCompleta()) {
  throw new Error('Falta completar SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY en js/core/config.js.');
}

/**
 * Cliente de Supabase compartido por toda la app.
 * Existe una sola instancia para que todos los servicios usen la misma sesión.
 * - storage: el adaptador de "Recordarme" (LS3).
 * - detectSessionInUrl: false, porque no hay magic links ni OAuth (LS4) y el hash de la URL
 *   lo usa el router.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: almacenamientoSesion,
    storageKey: CLAVE_SESION,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
