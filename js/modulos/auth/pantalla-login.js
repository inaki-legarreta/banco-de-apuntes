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

/** Textos del botón según el estado del envío. */
const TEXTO_BOTON = Object.freeze({ normal: 'Ingresar', esperando: 'Ingresando…' });

/** Mensaje si falta completar algún campo (no se llega a llamar a Supabase). */
const MENSAJE_INCOMPLETO = 'Completá el email y la contraseña.';

/**
 * Crea un elemento con clase y atributos.
 * Existe para que la estructura del login se lea como un árbol y no como una lista larga
 * de setAttribute. Los textos se escriben con textContent.
 * @param {string} etiqueta
 * @param {{ clase?: string, texto?: string, atributos?: Record<string, string> }} [opciones]
 * @param {Node[]} [hijos]
 * @returns {HTMLElement}
 */
function crear(etiqueta, { clase, texto, atributos = {} } = {}, hijos = []) {
  const elemento = document.createElement(etiqueta);
  if (clase) elemento.className = clase;
  if (texto) elemento.textContent = texto;
  for (const [nombre, valor] of Object.entries(atributos)) elemento.setAttribute(nombre, valor);
  elemento.append(...hijos);
  return elemento;
}

/**
 * Arma la estructura fija de la pantalla. No contiene datos: los textos variables (aviso y
 * error) se escriben después con textContent.
 * @returns {{ seccion: HTMLElement, marcaIcono: HTMLElement, formulario: HTMLFormElement,
 *   zonaAviso: HTMLElement, zonaError: HTMLElement }}
 */
function crearEstructura() {
  const marcaIcono = crear('span', { clase: 'login__marca-icono', atributos: { 'aria-hidden': 'true' } });
  const marca = crear('div', { clase: 'login__marca' }, [
    marcaIcono,
    crear('h1', { clase: 'login__titulo', texto: 'Banco de Apuntes', atributos: { id: 'login-titulo' } }),
  ]);

  const zonaAviso = crear('p', { clase: 'login__aviso', atributos: { role: 'status' } });
  zonaAviso.hidden = true;

  const campoEmail = crear('div', { clase: 'campo' }, [
    crear('label', { clase: 'campo__etiqueta', texto: 'Email', atributos: { for: 'login-email' } }),
    crear('input', {
      clase: 'campo__entrada',
      atributos: {
        id: 'login-email',
        name: 'email',
        type: 'email',
        autocomplete: 'email',
        inputmode: 'email',
        autocapitalize: 'off',
        spellcheck: 'false',
        required: '',
      },
    }),
  ]);

  const campoContrasena = crear('div', { clase: 'campo' }, [
    crear('label', {
      clase: 'campo__etiqueta',
      texto: 'Contraseña',
      atributos: { for: 'login-contrasena' },
    }),
    crear('input', {
      clase: 'campo__entrada',
      atributos: {
        id: 'login-contrasena',
        name: 'contrasena',
        type: 'password',
        autocomplete: 'current-password',
        required: '',
      },
    }),
  ]);

  const textoCasilla = crear('span', { clase: 'login__casilla-texto' }, [
    document.createTextNode('Recordarme en este dispositivo'),
    crear('span', { clase: 'login__casilla-ayuda', texto: 'Solo en dispositivos propios' }),
  ]);
  const casilla = crear('label', { clase: 'login__casilla' }, [
    crear('input', {
      clase: 'login__casilla-control',
      atributos: { name: 'recordarme', type: 'checkbox' },
    }),
    textoCasilla,
  ]);

  const zonaError = crear('p', { clase: 'login__error', atributos: { 'aria-live': 'polite' } });

  const formulario = crear('form', { clase: 'login__formulario', atributos: { novalidate: '' } }, [
    campoEmail,
    campoContrasena,
    casilla,
    zonaError,
    crear('button', {
      clase: 'boton boton--principal',
      texto: TEXTO_BOTON.normal,
      atributos: { type: 'submit' },
    }),
  ]);

  const seccion = crear(
    'section',
    { clase: 'login', atributos: { 'aria-labelledby': 'login-titulo' } },
    [crear('div', { clase: 'login__tarjeta' }, [marca, zonaAviso, formulario])],
  );

  return { seccion, marcaIcono, formulario, zonaAviso, zonaError };
}

/**
 * Monta la pantalla de login en el contenedor.
 * @param {HTMLElement} contenedor
 */
export function montarPantallaLogin(contenedor) {
  const { seccion, marcaIcono, formulario, zonaAviso, zonaError } = crearEstructura();
  contenedor.replaceChildren(seccion);
  // El ícono de libro sale de iconos.js, igual que en el encabezado de las demás pantallas.
  marcaIcono.append(crearIcono('libro', { tamano: 28, grosor: 2.2 }));

  const email = formulario.elements.namedItem('email');
  const contrasena = formulario.elements.namedItem('contrasena');
  const recordarme = formulario.elements.namedItem('recordarme');
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
