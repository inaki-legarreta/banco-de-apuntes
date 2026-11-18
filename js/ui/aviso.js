/*
 * ui/aviso.js — Aviso breve abajo de la pantalla (toast).
 * Responsabilidad: confirmar una acción ("Carpeta creada") o informar un error sin
 * interrumpir, y desaparecer solo. Usa una región aria-live única para que los lectores de
 * pantalla lo anuncien; esa región queda fuera de `inert` cuando hay una hoja o un diálogo
 * abiertos (capa-modal.js).
 *
 * SEGURIDAD: el texto se escribe con textContent.
 */

/** Tiempo en pantalla por defecto, en ms. Los errores se dejan un poco más para leerlos. */
const DURACION_MS = Object.freeze({ exito: 3500, error: 6000, info: 3500 });

/** Región donde se apilan los avisos; se crea la primera vez. */
let region = null;

/**
 * Crea (una sola vez) la región de avisos al final de <body>.
 * Es aria-live="polite": anuncia sin cortar lo que el lector de pantalla está leyendo.
 */
function obtenerRegion() {
  if (region?.isConnected) return region;
  region = document.createElement('div');
  region.className = 'avisos';
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-atomic', 'false');
  document.body.append(region);
  return region;
}

/**
 * Muestra un aviso.
 * @param {string} texto ya en español.
 * @param {object} [opciones]
 * @param {'exito' | 'error' | 'info'} [opciones.tipo]
 * @param {number} [opciones.duracion] ms en pantalla.
 * @returns {() => void} función para cerrarlo antes de tiempo.
 */
export function mostrarAviso(texto, { tipo = 'info', duracion } = {}) {
  const contenedor = obtenerRegion();
  const aviso = document.createElement('p');
  aviso.className = `aviso aviso--${tipo}`;
  aviso.textContent = texto;
  contenedor.append(aviso);
  requestAnimationFrame(() => aviso.classList.add('esta-abierta'));

  let temporizador = 0;
  function cerrar() {
    window.clearTimeout(temporizador);
    if (!aviso.isConnected) return;
    aviso.classList.remove('esta-abierta');
    // Se quita después de la animación de salida (o enseguida con reduced-motion).
    const espera = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--duracion-animacion'),
    );
    window.setTimeout(() => aviso.remove(), Number.isFinite(espera) ? espera : 0);
  }
  temporizador = window.setTimeout(cerrar, duracion ?? DURACION_MS[tipo] ?? DURACION_MS.info);
  return cerrar;
}

/**
 * Borra todos los avisos al instante.
 * Existe para que, al cerrarse la sesión, no quede a la vista ningún texto con datos
 * (RNF5).
 */
export function limpiarAvisos() {
  region?.replaceChildren();
}
