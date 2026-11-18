/*
 * config.js — Configuración pública del frontend.
 * Responsabilidad: centralizar los valores que el navegador necesita conocer (URL de
 * Supabase, clave pública anon, rutas de /api). Solo valores PÚBLICOS: la service role key
 * y las claves de R2 nunca llegan acá (viven solo en /api).
 *
 * Esqueleto (prompt 0): se completa en el prompt 2 (login y sesión).
 */

/**
 * Configuración compartida por todos los módulos.
 * Existe para que ningún módulo tenga URLs o claves desparramadas en su código.
 */
export const config = Object.freeze({
  // URL del proyecto de Supabase (pública). Se completa en el prompt 2.
  supabaseUrl: '',
  // Clave anon/publishable de Supabase (pública, protegida por RLS). Se completa en el prompt 2.
  supabaseAnonKey: '',
  // Prefijo de las funciones de servidor en Vercel.
  rutaApi: '/api',
});
