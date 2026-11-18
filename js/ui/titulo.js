/*
 * ui/titulo.js — Título de pantalla.
 * Responsabilidad: mostrar el título (28 px / 800) con un subtítulo opcional, un botón
 * Volver opcional a la izquierda y una acción opcional a la derecha (como el ".zip" de la
 * maqueta). No sabe adónde vuelve ni qué hace la acción: lo recibe.
 *
 * SEGURIDAD: título, subtítulo y etiquetas se escriben con textContent.
 */

import { crearIcono } from './iconos.js';

/**
 * Crea el título de pantalla.
 * @param {object} opciones
 * @param {string} opciones.texto título (por ejemplo, el nombre de la carpeta).
 * @param {string} [opciones.subtitulo]
 * @param {{ href?: string, alTocar?: () => void, etiqueta?: string }} [opciones.volver]
 *   botón Volver: un enlace (href) o una función. etiqueta es el nombre accesible.
 * @param {{ etiqueta: string, icono?: string, etiquetaAccesible?: string,
 *   alTocar: (boton: HTMLButtonElement) => void }} [opciones.accion] acción a la derecha.
 * @returns {HTMLElement}
 */
export function crearTitulo({ texto, subtitulo, volver, accion }) {
  const cabecera = document.createElement('header');
  cabecera.className = 'titulo';

  if (volver) {
    const etiqueta = volver.etiqueta ?? 'Volver';
    let boton;
    if (volver.href) {
      boton = document.createElement('a');
      boton.href = volver.href;
    } else {
      boton = document.createElement('button');
      boton.type = 'button';
      boton.addEventListener('click', () => volver.alTocar?.());
    }
    boton.className = 'titulo__volver';
    boton.setAttribute('aria-label', etiqueta);
    boton.append(crearIcono('volver', { tamano: 22 }));
    cabecera.append(boton);
  }

  const textos = document.createElement('div');
  textos.className = 'titulo__textos';
  const h1 = document.createElement('h1');
  h1.className = 'titulo__texto';
  h1.textContent = texto;
  textos.append(h1);
  if (subtitulo) {
    const p = document.createElement('p');
    p.className = 'titulo__subtitulo';
    p.textContent = subtitulo;
    textos.append(p);
  }
  cabecera.append(textos);

  if (accion) {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'titulo__accion';
    if (accion.icono) boton.append(crearIcono(accion.icono, { tamano: 18 }));
    const etiqueta = document.createElement('span');
    etiqueta.textContent = accion.etiqueta;
    boton.append(etiqueta);
    if (accion.etiquetaAccesible) boton.setAttribute('aria-label', accion.etiquetaAccesible);
    boton.addEventListener('click', () => accion.alTocar(boton));
    cabecera.append(boton);
  }

  return cabecera;
}
