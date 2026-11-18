/*
 * supabase.js — Cliente único de Supabase para el navegador.
 * Responsabilidad: crear y exponer una sola instancia del cliente (Auth + Postgres) usando
 * la configuración pública. Solo lo importan las funciones de servicio de los módulos;
 * la UI nunca lo usa directamente.
 *
 * Esqueleto (prompt 0): la creación real del cliente se implementa en el prompt 2.
 */

import { config } from './config.js';

/**
 * Devuelve el cliente de Supabase compartido.
 * Existe para que toda la app use la misma sesión y no se creen clientes duplicados.
 * @returns {null} Por ahora nada; en el prompt 2 devolverá el cliente real.
 */
export function obtenerClienteSupabase() {
  // Se referencia la config para dejar explícita la dependencia que usará el prompt 2.
  void config;
  return null;
}
