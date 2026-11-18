/*
 * modulos/auth/hoja-cuenta.js — Hoja "Cuenta" (EP1).
 * Responsabilidad: al tocar el botón de persona del encabezado, mostrar a cualquier usuario
 * su email y su rol, "Panel admin" (solo admin, lleva a #/admin) y "Cerrar sesión" (estilo
 * peligro). "Cerrar sesión" vive acá y no en el Panel admin de la maqueta (EP1).
 *
 * Ocultar "Panel admin" a un lector es solo comodidad: la protección real es RLS (AT5) y
 * la guardia del router.
 * No habla con Supabase: usa el servicio. SEGURIDAD: el email se escribe con textContent
 * (lo hace hoja.js).
 */

import { obtenerPerfil, cerrarSesion, ErrorAuth } from './servicio.js';
import { abrirHoja } from '../../ui/hoja.js';
import { mostrarAviso } from '../../ui/aviso.js';
import { crearIcono } from '../../ui/iconos.js';

/** Nombre visible de cada rol. */
const NOMBRE_ROL = Object.freeze({ admin: 'Administrador', lector: 'Lector' });

/** true mientras la hoja está abierta o cargando, para no abrir dos con dos toques. */
let abierta = false;

/**
 * Abre la hoja "Cuenta". El foco vuelve solo al botón que la abrió (hoja.js).
 */
export async function abrirHojaCuenta() {
  if (abierta) return;
  abierta = true;
  try {
    let perfil;
    try {
      perfil = await obtenerPerfil();
    } catch (error) {
      mostrarAviso(
        error instanceof ErrorAuth ? error.message : 'No se pudo leer tu cuenta.',
        { tipo: 'error' },
      );
      return;
    }
    if (!perfil) return;

    const icono = document.createElement('span');
    icono.className = 'cuenta__icono';
    icono.setAttribute('aria-hidden', 'true');
    icono.append(crearIcono('persona', { tamano: 22 }));

    const acciones = [];
    if (perfil.rol === 'admin') {
      acciones.push({ id: 'panel-admin', etiqueta: 'Panel admin', icono: 'escudo' });
    }
    acciones.push({ id: 'cerrar-sesion', etiqueta: 'Cerrar sesión', icono: 'salir', tipo: 'peligro' });

    const elegida = await abrirHoja({
      encabezado: {
        titulo: perfil.email,
        detalle: NOMBRE_ROL[perfil.rol] ?? 'Sin rol',
        icono,
      },
      acciones,
    });

    if (elegida === 'panel-admin') {
      window.location.hash = '#/admin';
    } else if (elegida === 'cerrar-sesion') {
      // El router lleva al login al enterarse del cierre (solo este dispositivo, LS5).
      await cerrarSesion('usuario');
    }
  } finally {
    abierta = false;
  }
}
