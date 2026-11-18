/*
 * modulos/admin/pantalla-provisional.js — Cuerpo PROVISIONAL del Panel admin (ruta #/admin).
 *
 * PROVISIONAL HASTA EL PROMPT 9: lo reemplaza el panel real (cuentas de lectores y espacio
 * usado). Existe para que "Panel admin" de la hoja "Cuenta" (EP1) lleve a algún lado.
 * La ruta es solo para admin: el router manda a un lector a #/.
 */

import { crearTitulo } from '../../ui/titulo.js';

/**
 * Monta el cuerpo provisional en la zona de contenido.
 * @param {HTMLElement} contenedor
 */
export function montarPanelProvisional(contenedor) {
  const texto = document.createElement('p');
  texto.className = 'provisional';
  texto.textContent = 'Panel admin — llega en el prompt 9';
  contenedor.append(crearTitulo({ texto: 'Panel admin', volver: { href: '#/' } }), texto);
}
