/*
 * ui/iconos.js — Íconos SVG de la app, en un solo lugar.
 * Responsabilidad: guardar los trazos de los íconos de la maqueta y devolverlos como
 * elementos SVG listos para insertar. Ningún otro archivo escribe SVG a mano.
 *
 * SEGURIDAD: es el ÚNICO componente de js/ui/ que usa innerHTML, y solo con estos textos
 * fijos. Nunca se mezcla con datos (nombres, emails): esos van siempre con textContent.
 */

/**
 * Trazos de cada ícono (contenido del <svg>, sobre una grilla de 24 × 24).
 * Existe para que todos los íconos compartan el mismo estilo de línea y se cambien en un
 * solo lugar. Usan currentColor: el color lo decide el CSS del componente.
 */
const TRAZOS = Object.freeze({
  libro:
    '<path d="M5 5a2 2 0 0 1 2-2h12v15H7a2 2 0 0 0-2 2z"/>' +
    '<path d="M5 20a2 2 0 0 0 2 2h12v-4"/><path d="M9 7.5h6"/>',
  persona: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
  lupa: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  volver: '<path d="M15 5l-7 7 7 7"/>',
  carpeta:
    '<path d="M3.5 7.5A2 2 0 0 1 5.5 5.5h4l2 2.5h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13' +
    'a2 2 0 0 1-2-2z"/>',
  descargar: '<path d="M12 4v11"/><path d="m7 10.5 5 5 5-5"/><path d="M5 20h14"/>',
  lapiz: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  mover:
    '<path d="M3.5 7.5A2 2 0 0 1 5.5 5.5h4l2 2.5h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13' +
    'a2 2 0 0 1-2-2z"/><path d="M9 13.5h6.5"/><path d="m13 11 2.5 2.5L13 16"/>',
  papelera:
    '<path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/>' +
    '<path d="M6 7l1 13h10l1-13"/><path d="M10 11v5.5M14 11v5.5"/>',
  mas: '<path d="M12 5v14M5 12h14"/>',
  subir: '<path d="M12 16V5"/><path d="m7 9.5 5-5 5 5"/><path d="M5 20h14"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  puntos:
    '<circle cx="12" cy="5.5" r="1.4" fill="currentColor" stroke="none"/>' +
    '<circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/>' +
    '<circle cx="12" cy="18.5" r="1.4" fill="currentColor" stroke="none"/>',
  escudo: '<path d="M12 3 5 6v5.5c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6z"/>',
  salir:
    '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 16.5 5.5 12 10 7.5"/>' +
    '<path d="M5.5 12H15"/>',
});

/**
 * Nombres válidos de íconos.
 * Existe para que otros componentes puedan validar o documentar qué íconos hay.
 */
export const NOMBRES_ICONOS = Object.freeze(Object.keys(TRAZOS));

/**
 * Devuelve un ícono como elemento SVG, decorativo (aria-hidden): el texto accesible lo pone
 * el botón o la fila que lo contiene.
 * @param {keyof typeof TRAZOS} nombre
 * @param {{ tamano?: number, grosor?: number }} [opciones] tamaño en px (24 por defecto) y
 *   grosor de línea (1.8 por defecto).
 * @returns {SVGSVGElement}
 */
export function crearIcono(nombre, { tamano = 24, grosor = 1.8 } = {}) {
  const trazos = TRAZOS[nombre];
  if (!trazos) throw new Error(`Ícono desconocido: ${nombre}`);

  const plantilla = document.createElement('template');
  // innerHTML solo con texto fijo de este archivo (ver SEGURIDAD arriba).
  plantilla.innerHTML =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ` +
    `stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${trazos}</svg>`;
  const svg = plantilla.content.firstElementChild;
  svg.setAttribute('width', String(tamano));
  svg.setAttribute('height', String(tamano));
  svg.setAttribute('stroke-width', String(grosor));
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.classList.add('icono');
  return svg;
}
