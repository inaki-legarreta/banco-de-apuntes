/*
 * ui/tarjeta.js — Tarjeta de carrera, como la de la Home de la maqueta (DS4).
 * Responsabilidad: mostrar una carpeta raíz destacada (ícono dorado, nombre, subtítulo y
 * chevron) como un enlace grande y fácil de tocar.
 *
 * SEGURIDAD: nombre y subtítulo se escriben con textContent.
 */

import { crearIcono } from './iconos.js';

/**
 * Crea una tarjeta.
 * @param {object} opciones
 * @param {string} opciones.nombre por ejemplo, "Ingeniería en Sistemas de Información".
 * @param {string} [opciones.subtitulo] por ejemplo, "5 años · 42 elementos".
 * @param {string} opciones.href adónde lleva al tocarla.
 * @returns {HTMLAnchorElement}
 */
export function crearTarjeta({ nombre, subtitulo, href }) {
  const tarjeta = document.createElement('a');
  tarjeta.className = 'tarjeta';
  tarjeta.href = href;

  const icono = document.createElement('span');
  icono.className = 'tarjeta__icono';
  icono.setAttribute('aria-hidden', 'true');
  // Cada carrera es una carpeta raíz (DS4): lleva el ícono de carpeta.
  icono.append(crearIcono('carpeta', { tamano: 24, grosor: 2 }));

  const textos = document.createElement('span');
  textos.className = 'tarjeta__textos';
  const elNombre = document.createElement('span');
  elNombre.className = 'tarjeta__nombre';
  elNombre.textContent = nombre;
  textos.append(elNombre);
  if (subtitulo) {
    const elSubtitulo = document.createElement('span');
    elSubtitulo.className = 'tarjeta__subtitulo';
    elSubtitulo.textContent = subtitulo;
    textos.append(elSubtitulo);
  }

  const chevron = crearIcono('chevron', { tamano: 20 });
  chevron.classList.add('tarjeta__chevron');

  tarjeta.append(icono, textos, chevron);
  return tarjeta;
}
