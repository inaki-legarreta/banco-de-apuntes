/*
 * ui/estados.js — Estados de una zona de contenido: vacío, cargando y error.
 * Responsabilidad: mostrar de forma uniforme qué pasa cuando todavía no hay datos, cuando
 * se están trayendo o cuando falló el pedido, para que cada pantalla no invente el suyo.
 *
 * SEGURIDAD: los textos se escriben con textContent.
 */

import { crearIcono } from './iconos.js';

/**
 * Estado vacío ("Esta carpeta está vacía").
 * @param {object} [opciones]
 * @param {string} [opciones.titulo]
 * @param {string} [opciones.detalle] texto secundario opcional.
 * @param {string} [opciones.icono] nombre de un ícono de iconos.js (carpeta por defecto).
 * @param {{ etiqueta: string, href: string }} [opciones.accion] enlace con forma de botón
 *   debajo del texto (por ejemplo, "Ir al inicio" cuando la carpeta no existe).
 * @returns {HTMLElement}
 */
export function crearEstadoVacio({
  titulo = 'Esta carpeta está vacía',
  detalle,
  icono = 'carpeta',
  accion,
} = {}) {
  const caja = document.createElement('div');
  caja.className = 'estado estado--vacio';

  const marco = document.createElement('span');
  marco.className = 'estado__icono';
  marco.setAttribute('aria-hidden', 'true');
  marco.append(crearIcono(icono, { tamano: 26 }));

  const elTitulo = document.createElement('p');
  elTitulo.className = 'estado__titulo';
  elTitulo.textContent = titulo;
  caja.append(marco, elTitulo);

  if (detalle) {
    const elDetalle = document.createElement('p');
    elDetalle.className = 'estado__detalle';
    elDetalle.textContent = detalle;
    caja.append(elDetalle);
  }

  if (accion) {
    const enlace = document.createElement('a');
    enlace.className = 'boton boton--secundario estado__accion';
    enlace.href = accion.href;
    enlace.textContent = accion.etiqueta;
    caja.append(enlace);
  }
  return caja;
}

/**
 * Estado cargando: filas esqueleto sobrias, con un texto solo para lectores de pantalla.
 * @param {object} [opciones]
 * @param {number} [opciones.filas] cuántas filas esqueleto dibujar.
 * @param {string} [opciones.texto] lo que anuncia el lector de pantalla.
 * @returns {HTMLElement}
 */
export function crearEstadoCargando({ filas = 4, texto = 'Cargando…' } = {}) {
  const caja = document.createElement('div');
  caja.className = 'estado estado--cargando';
  caja.setAttribute('role', 'status');

  const anuncio = document.createElement('span');
  anuncio.className = 'solo-lector';
  anuncio.textContent = texto;
  caja.append(anuncio);

  for (let i = 0; i < filas; i++) {
    const fila = document.createElement('div');
    fila.className = 'esqueleto';
    fila.setAttribute('aria-hidden', 'true');
    const icono = document.createElement('span');
    icono.className = 'esqueleto__icono';
    const lineas = document.createElement('span');
    lineas.className = 'esqueleto__lineas';
    const linea1 = document.createElement('span');
    linea1.className = 'esqueleto__linea';
    const linea2 = document.createElement('span');
    linea2.className = 'esqueleto__linea esqueleto__linea--corta';
    lineas.append(linea1, linea2);
    fila.append(icono, lineas);
    caja.append(fila);
  }
  return caja;
}

/**
 * Estado de error con botón "Reintentar".
 * @param {object} opciones
 * @param {string} opciones.mensaje ya en español (lo traduce el servicio).
 * @param {() => void} [opciones.alReintentar] sin esto, no se muestra el botón.
 * @returns {HTMLElement}
 */
export function crearEstadoError({ mensaje, alReintentar }) {
  const caja = document.createElement('div');
  caja.className = 'estado estado--error';
  caja.setAttribute('role', 'alert');

  const elMensaje = document.createElement('p');
  elMensaje.className = 'estado__titulo';
  elMensaje.textContent = mensaje;
  caja.append(elMensaje);

  if (alReintentar) {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'boton boton--secundario';
    boton.textContent = 'Reintentar';
    boton.addEventListener('click', () => alReintentar());
    caja.append(boton);
  }
  return caja;
}
