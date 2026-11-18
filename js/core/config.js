/*
 * config.js — Configuración pública del frontend.
 * Responsabilidad: centralizar los valores que el navegador necesita conocer (URL de
 * Supabase, publishable key, tiempo de inactividad, rutas de /api), para que ningún módulo
 * tenga URLs, claves o tiempos desparramados en su código.
 *
 * Por qué la publishable key puede estar en el repo (LS1): Supabase la diseñó para vivir en
 * el navegador. Cualquiera que abra la app la puede ver, así que esconderla no protege nada.
 * Lo que protege los datos es RLS en la base: sin sesión no se lee nada y solo el admin
 * escribe (docs/base-de-datos.md).
 *
 * La SECRET KEY de Supabase (sb_secret_...) y las claves de R2 NUNCA van en este archivo
 * ni en ningún otro del frontend: saltean RLS y viven solo en /api (servidor).
 */

/**
 * URL del proyecto de Supabase (pública).
 * Existe para que el cliente de Supabase sepa a qué proyecto conectarse.
 * Se copia de Supabase → Project Settings → API (o Data API) → Project URL.
 */
export const SUPABASE_URL = 'https://otqczdfmvqcssxomnoup.supabase.co';

/**
 * Publishable key de Supabase (sb_publishable_..., pública, protegida por RLS).
 * Existe para identificar a la app ante Supabase; no da permisos por sí sola (LS1).
 * Se copia de Supabase → Project Settings → API Keys → Publishable key.
 */
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_dvCwAJ82U71Wzr9vRaLLEw_4SLfdDme';

/**
 * Minutos sin uso tras los que la sesión se cierra sola, si "Recordarme" está desactivado
 * (RNF6, LS3). Con "Recordarme" activo no hay cierre por inactividad.
 * Para probar el cierre se puede poner en 1 temporalmente; el valor acordado es 30.
 */
export const MINUTOS_INACTIVIDAD = 30;

/**
 * Prefijo de las funciones de servidor en Vercel (AT1).
 * Existe para que los módulos que llamen a /api no escriban la ruta a mano.
 */
export const RUTA_API = '/api';

/**
 * Valores de ejemplo que trae el repo antes de pegar los reales.
 * Existen para poder detectar que la configuración no se completó.
 */
const MARCADORES = ['PEGAR_URL_AQUI', 'PEGAR_PUBLISHABLE_KEY_AQUI'];

/**
 * Indica si la URL y la publishable key ya tienen valores reales.
 * Existe para que la app muestre un mensaje claro en lugar de romperse cuando siguen los
 * marcadores de ejemplo.
 * @returns {boolean}
 */
export function configuracionCompleta() {
  const valores = [SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY];
  const sinMarcadores = valores.every((valor) => valor && !MARCADORES.includes(valor));
  return sinMarcadores && SUPABASE_URL.startsWith('https://');
}
