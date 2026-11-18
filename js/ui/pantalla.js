/*
 * ui/pantalla.js — Estructura común de pantalla (todas las rutas privadas).
 * Responsabilidad: armar la columna de la app (encabezado fijo, contenido con scroll propio
 * y pie opcional) para que cada vista solo llene su contenido. El router la monta una vez y
 * la reutiliza entre rutas; la vista recibe el contenedor de contenido y puede pedir el pie.
 *
 * - Encabezado: marca (ícono de libro + "Banco de Apuntes", lleva a #/), botón de cuenta
 *   (44 px, EP1) y buscador. El buscador es SOLO VISUAL hasta el prompt 8 (PENDIENTE).
 * - Pie: hasta dos botones de 50 px (secundario y principal), oculto si la vista no lo pide.
 *   Respeta env(safe-area-inset-bottom) (base.css).
 * No sabe qué hace el botón de cuenta: llama a alTocarCuenta (lo conecta el router con el
 * módulo auth). Los estilos están en css/base.css, sección "Estructura de pantalla".
 */

import { crearIcono } from './iconos.js';

/**
 * Datos de un botón del pie.
 * @typedef {{ etiqueta: string, icono?: string, alTocar: (boton: HTMLButtonElement) => void }}
 *   BotonPie
 */

/** Crea un botón del pie con su clase según sea principal o secundario. */
function crearBotonPie({ etiqueta, icono, alTocar }, clase) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = `boton ${clase}`;
  if (icono) boton.append(crearIcono(icono, { tamano: 20 }));
  const texto = document.createElement('span');
  texto.textContent = etiqueta;
  boton.append(texto);
  boton.addEventListener('click', () => alTocar(boton));
  return boton;
}

/** Arma el encabezado fijo: marca, botón de cuenta y buscador (visual). */
function crearEncabezado(alTocarCuenta) {
  const encabezado = document.createElement('header');
  encabezado.className = 'pantalla__encabezado';

  const barra = document.createElement('div');
  barra.className = 'pantalla__barra';

  const marca = document.createElement('a');
  marca.className = 'pantalla__marca';
  marca.href = '#/';
  const marcaIcono = document.createElement('span');
  marcaIcono.className = 'pantalla__marca-icono';
  marcaIcono.setAttribute('aria-hidden', 'true');
  marcaIcono.append(crearIcono('libro', { tamano: 19, grosor: 2.2 }));
  const marcaTexto = document.createElement('span');
  marcaTexto.textContent = 'Banco de Apuntes';
  marca.append(marcaIcono, marcaTexto);

  const cuenta = document.createElement('button');
  cuenta.type = 'button';
  cuenta.className = 'pantalla__cuenta';
  cuenta.setAttribute('aria-label', 'Cuenta');
  cuenta.setAttribute('aria-haspopup', 'dialog');
  cuenta.append(crearIcono('persona', { tamano: 22 }));
  cuenta.addEventListener('click', () => alTocarCuenta?.(cuenta));

  barra.append(marca, cuenta);

  // PENDIENTE (prompt 8): el buscador es solo visual. Es de solo lectura y no hace nada;
  // la búsqueda real (RF5, D23) la conecta el módulo busqueda.
  const buscador = document.createElement('div');
  buscador.className = 'pantalla__buscador';
  buscador.setAttribute('role', 'search');
  const lupa = crearIcono('lupa', { tamano: 20 });
  lupa.classList.add('pantalla__buscador-icono');
  const campo = document.createElement('input');
  campo.className = 'pantalla__buscador-campo';
  campo.type = 'search';
  campo.readOnly = true;
  campo.placeholder = 'Buscar en el banco';
  campo.setAttribute('aria-label', 'Buscar en el banco (disponible próximamente)');
  campo.tabIndex = -1;
  buscador.append(lupa, campo);

  encabezado.append(barra, buscador);
  return encabezado;
}

/**
 * Crea la estructura de pantalla.
 * @param {object} opciones
 * @param {(boton: HTMLButtonElement) => void} opciones.alTocarCuenta al tocar el botón de
 *   persona; recibe el botón para devolverle el foco al cerrar la hoja.
 * @returns {{
 *   elemento: HTMLElement,
 *   contenido: HTMLElement,
 *   definirPie: (botones: { secundario?: BotonPie, principal?: BotonPie } | null) => void,
 *   reiniciar: () => void,
 * }}
 *   - contenido: donde la vista monta lo suyo.
 *   - definirPie: muestra el pie con esos botones; null lo oculta.
 *   - reiniciar: vacía el contenido, oculta el pie y vuelve el scroll arriba (al cambiar de
 *     ruta).
 */
export function crearPantalla({ alTocarCuenta }) {
  const elemento = document.createElement('div');
  elemento.className = 'pantalla';

  const contenido = document.createElement('div');
  contenido.className = 'pantalla__contenido';
  contenido.id = 'contenido';

  const pie = document.createElement('footer');
  pie.className = 'pantalla__pie';
  pie.hidden = true;

  elemento.append(crearEncabezado(alTocarCuenta), contenido, pie);

  function definirPie(botones) {
    pie.replaceChildren();
    if (!botones || (!botones.secundario && !botones.principal)) {
      pie.hidden = true;
      return;
    }
    if (botones.secundario) pie.append(crearBotonPie(botones.secundario, 'boton--secundario'));
    if (botones.principal) pie.append(crearBotonPie(botones.principal, 'boton--principal'));
    pie.hidden = false;
  }

  function reiniciar() {
    contenido.replaceChildren();
    contenido.scrollTop = 0;
    definirPie(null);
  }

  return { elemento, contenido, definirPie, reiniciar };
}
