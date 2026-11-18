/*
 * modulos/explorador/pantalla-inicio.js — Inicio de la app (ruta #/): home de carreras (DS4).
 * Responsabilidad: mostrar el título "Carreras", su subtítulo y, debajo, las carreras
 * (carpetas raíz del banco).
 *
 * Prompt 3: solo la estructura. Todavía no se consultan items (prompt 4) ni hay botones de
 * admin como "Nueva carrera" (prompt 5), así que se ve el estado vacío.
 */

import { crearTitulo } from '../../ui/titulo.js';
import { crearEstadoVacio } from '../../ui/estados.js';

/**
 * Monta el inicio dentro de la zona de contenido de la estructura de pantalla.
 * @param {HTMLElement} contenedor
 */
export function montarPantallaInicio(contenedor) {
  contenedor.append(
    crearTitulo({ texto: 'Carreras', subtitulo: 'Elegí tu carrera para entrar al banco' }),
    // PENDIENTE (prompt 4): cargar las carpetas raíz y mostrar una tarjeta por carrera.
    crearEstadoVacio({ titulo: 'Todavía no hay carreras' }),
  );
}
