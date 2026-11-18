/*
 * modulos/auth/pantalla-login.js — Pantalla de inicio de sesión (DS1, RF1).
 * Responsabilidad: mostrar el formulario, validar que esté completo y pedirle al servicio
 * que inicie sesión. No habla con Supabase. Cuando el login sale bien no navega: el router
 * se entera del cambio de sesión y lleva al inicio.
 *
 * Sin "Olvidé mi contraseña" ni registro (LS4, BD4): las cuentas y las contraseñas las
 * maneja el admin.
 */

import { iniciarSesion, consumirAvisoCierre, ErrorAuth } from './servicio.js';
import { crearIcono } from '../../ui/iconos.js';

/**
 * Estructura fija de la pantalla. No contiene datos: los textos variables (aviso y error)
 * se escriben con textContent.
 */
const PLANTILLA = `
  <section class="login" aria-labelledby="login-titulo">
    <div class="login__tarjeta">
      <div class="login__marca">
        <span class="login__marca-icono" aria-hidden="true"></span>
        <h1 id="login-titulo" class="login__titulo">Banco de Apuntes</h1>
      </div>
      <p class="login__aviso" role="status" hidden></p>
      <form class="login__formulario" novalidate>
        <div class="campo">
          <label class="campo__etiqueta" for="login-email">Email</label>
          <input class="campo__entrada" id="login-email" name="email" type="email"
            autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false"
            required />
        </div>
        <div class="campo">
          <label class="campo__etiqueta" for="login-contrasena">Contraseña</label>
          <input class="campo__entrada" id="login-contrasena" name="contrasena" type="password"
            autocomplete="current-password" required />
        </div>
        <label class="login__casilla">
          <input class="login__casilla-control" name="recordarme" type="checkbox" />
          <span class="login__casilla-texto">
            Recordarme en este dispositivo
            <span class="login__casilla-ayuda">Solo en dispositivos propios</span>
          </span>
        </label>
        <p class="login__error" aria-live="polite"></p>
        <button class="boton boton--principal" type="submit">Ingresar</button>
      </form>
    </div>
  </section>
`;

/** Textos del botón según el estado del envío. */
const TEXTO_BOTON = Object.freeze({ normal: 'Ingresar', esperando: 'Ingresando…' });

/** Mensaje si falta completar algún campo (no se llega a llamar a Supabase). */
const MENSAJE_INCOMPLETO = 'Completá el email y la contraseña.';

/**
 * Monta la pantalla de login en el contenedor.
 * @param {HTMLElement} contenedor
 */
export function montarPantallaLogin(contenedor) {
  contenedor.innerHTML = PLANTILLA;
  // El ícono de libro sale de iconos.js, igual que en el encabezado de las demás pantallas.
  contenedor
    .querySelector('.login__marca-icono')
    .append(crearIcono('libro', { tamano: 28, grosor: 2.2 }));

  const formulario = contenedor.querySelector('.login__formulario');
  const email = formulario.elements.namedItem('email');
  const contrasena = formulario.elements.namedItem('contrasena');
  const recordarme = formulario.elements.namedItem('recordarme');
  const zonaError = contenedor.querySelector('.login__error');
  const zonaAviso = contenedor.querySelector('.login__aviso');
  const boton = formulario.querySelector('button[type="submit"]');

  // Aviso de por qué se cerró la sesión anterior (por ejemplo, inactividad), una sola vez.
  const aviso = consumirAvisoCierre();
  if (aviso) {
    zonaAviso.textContent = aviso;
    zonaAviso.hidden = false;
  }

  /** Bloquea o libera el formulario mientras se espera a Supabase. */
  function marcarEsperando(esperando) {
    boton.disabled = esperando;
    boton.textContent = esperando ? TEXTO_BOTON.esperando : TEXTO_BOTON.normal;
    formulario.setAttribute('aria-busy', String(esperando));
  }

  // submit cubre el clic en "Ingresar" y la tecla Enter en cualquier campo.
  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (boton.disabled) return;
    zonaError.textContent = '';

    if (!email.value.trim() || !contrasena.value) {
      zonaError.textContent = MENSAJE_INCOMPLETO;
      (email.value.trim() ? contrasena : email).focus();
      return;
    }

    marcarEsperando(true);
    try {
      await iniciarSesion(email.value, contrasena.value, recordarme.checked);
      // Éxito: el router cambia de pantalla al enterarse de la sesión nueva.
    } catch (error) {
      zonaError.textContent =
        error instanceof ErrorAuth ? error.message : 'No se pudo iniciar sesión. Probá de nuevo.';
      contrasena.value = '';
      contrasena.focus();
      marcarEsperando(false);
    }
  });

  email.focus();
}
