/*
 * modulos/auth/inicio-provisional.js — Pantalla de inicio PROVISIONAL (ruta #/).
 *
 * PROVISIONAL HASTA EL PROMPT 4: la reemplaza la home de carreras del explorador (DS4).
 * Cuando eso pase, se borra este archivo y su export en index.js.
 *
 * Responsabilidad: comprobar a ojo que el login funciona, mostrando el email y el rol de
 * quien entró, con un botón para cerrar sesión. No habla con Supabase: usa el servicio.
 */

import { obtenerPerfil, cerrarSesion, ErrorAuth } from './servicio.js';

/** Estructura fija; el email y el rol se escriben con textContent. */
const PLANTILLA = `
  <section class="inicio-provisional">
    <div class="inicio-provisional__tarjeta">
      <p class="inicio-provisional__texto">Cargando…</p>
      <button class="inicio-provisional__boton" type="button">Cerrar sesión</button>
    </div>
  </section>
`;

/**
 * Monta el inicio provisional en el contenedor.
 * @param {HTMLElement} contenedor
 */
export async function montarInicioProvisional(contenedor) {
  contenedor.innerHTML = PLANTILLA;
  const texto = contenedor.querySelector('.inicio-provisional__texto');
  const boton = contenedor.querySelector('.inicio-provisional__boton');

  boton.addEventListener('click', async () => {
    boton.disabled = true;
    // El router lleva al login al enterarse del cierre.
    await cerrarSesion('usuario');
  });

  try {
    const perfil = await obtenerPerfil();
    if (!perfil) return;
    texto.textContent = `Sesión iniciada como ${perfil.email} (${perfil.rol ?? 'sin rol'})`;
  } catch (error) {
    texto.textContent =
      error instanceof ErrorAuth ? error.message : 'No se pudo leer el perfil.';
  }
}
