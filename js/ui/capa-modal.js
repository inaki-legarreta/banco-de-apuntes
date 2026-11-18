/*
 * ui/capa-modal.js — Comportamiento común de las capas modales (hoja inferior y diálogo).
 * Responsabilidad: abrir y cerrar una capa encima de la pantalla con las reglas de
 * accesibilidad del proyecto, para que hoja.js y dialogo.js no las repitan:
 * - el foco queda atrapado adentro (el resto de la página pasa a `inert` y Tab da la vuelta);
 * - Escape y el velo avisan a quien abrió la capa, que decide si cierra;
 * - al cerrar, el foco vuelve al elemento que la abrió;
 * - entrada y salida animadas, sin animación con prefers-reduced-motion.
 * No dibuja nada propio: recibe el elemento ya armado.
 */

/**
 * Selector de los elementos que pueden recibir foco con Tab.
 * Existe para calcular el primero y el último al atrapar el foco.
 */
const SELECTOR_ENFOCABLES = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Clase que lleva la región de avisos (aviso.js). Existe para no volverla `inert` mientras
 * hay una capa abierta: si no, los lectores de pantalla no anunciarían los avisos.
 */
const CLASE_AVISOS = 'avisos';

/**
 * Capas abiertas, de la más vieja a la más nueva.
 * Existe para poder cerrarlas todas de golpe (cambio de ruta o de sesión).
 * @type {Set<{ cancelar: () => void }>}
 */
const capasAbiertas = new Set();

/** Duración de la animación en ms, leída del token (0 con reduced-motion). */
function duracionAnimacion() {
  const valor = getComputedStyle(document.documentElement)
    .getPropertyValue('--duracion-animacion')
    .trim();
  const ms = Number.parseFloat(valor);
  return Number.isFinite(ms) ? ms : 0;
}

/** Elementos enfocables visibles dentro de un contenedor. */
function enfocables(contenedor) {
  return [...contenedor.querySelectorAll(SELECTOR_ENFOCABLES)].filter(
    (elemento) => elemento.getClientRects().length > 0,
  );
}

/**
 * Abre una capa modal.
 * @param {object} opciones
 * @param {HTMLElement} opciones.elemento raíz de la capa (contiene el velo y el panel); se
 *   agrega al final de <body>.
 * @param {HTMLElement} opciones.panel parte que contiene el foco (role="dialog").
 * @param {HTMLElement} [opciones.velo] fondo oscuro; tocarlo llama a alTocarVelo.
 * @param {HTMLElement} [opciones.focoInicial] dónde arranca el foco (por defecto, el panel).
 * @param {() => void} opciones.alEscape qué hacer con Escape.
 * @param {() => void} [opciones.alTocarVelo] qué hacer al tocar el velo (sin esto, no hace
 *   nada).
 * @param {() => void} opciones.alCancelar cierre forzado desde afuera (cerrarCapasAbiertas).
 * @returns {{ cerrar: () => Promise<void> }}
 */
export function abrirCapa({ elemento, panel, velo, focoInicial, alEscape, alTocarVelo, alCancelar }) {
  const origen = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  // Todo lo que está afuera de la capa pasa a inert: no recibe foco, clics ni lectura.
  const hechosInertes = [...document.body.children].filter(
    (hijo) => !hijo.inert && !hijo.classList.contains(CLASE_AVISOS),
  );
  hechosInertes.forEach((hijo) => {
    hijo.inert = true;
  });
  document.body.append(elemento);

  /** Atrapa Tab adentro del panel y deriva Escape. */
  function alPresionarTecla(evento) {
    if (evento.key === 'Escape') {
      evento.preventDefault();
      evento.stopPropagation();
      alEscape();
      return;
    }
    if (evento.key !== 'Tab') return;
    const lista = enfocables(panel);
    if (lista.length === 0) {
      evento.preventDefault();
      panel.focus();
      return;
    }
    const primero = lista[0];
    const ultimo = lista[lista.length - 1];
    const activo = document.activeElement;
    if (evento.shiftKey && (activo === primero || activo === panel)) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && activo === ultimo) {
      evento.preventDefault();
      primero.focus();
    }
  }

  function alClicVelo(evento) {
    if (evento.target === velo) alTocarVelo?.();
  }

  elemento.addEventListener('keydown', alPresionarTecla);
  velo?.addEventListener('click', alClicVelo);

  // Un cuadro después de insertarla, para que la transición de entrada se vea.
  requestAnimationFrame(() => elemento.classList.add('esta-abierta'));
  if (!panel.hasAttribute('tabindex')) panel.setAttribute('tabindex', '-1');
  (focoInicial ?? panel).focus({ preventScroll: true });

  let cerrada = false;
  const registro = { cancelar: alCancelar };
  capasAbiertas.add(registro);

  /** Cierra la capa con su animación y devuelve el foco a quien la abrió. */
  async function cerrar() {
    if (cerrada) return;
    cerrada = true;
    capasAbiertas.delete(registro);
    elemento.removeEventListener('keydown', alPresionarTecla);
    velo?.removeEventListener('click', alClicVelo);
    elemento.classList.remove('esta-abierta');

    const espera = duracionAnimacion();
    if (espera > 0) await new Promise((listo) => window.setTimeout(listo, espera));

    elemento.remove();
    hechosInertes.forEach((hijo) => {
      hijo.inert = false;
    });
    if (origen?.isConnected) origen.focus({ preventScroll: true });
  }

  return { cerrar };
}

/**
 * Cierra todas las capas abiertas, como si se hubieran cancelado.
 * Existe para que el router no deje una hoja o un diálogo encima de otra pantalla al
 * navegar, ni a la vista al cerrarse la sesión (RNF5).
 */
export function cerrarCapasAbiertas() {
  [...capasAbiertas].reverse().forEach((capa) => capa.cancelar());
}
