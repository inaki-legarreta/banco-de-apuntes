/*
 * modulos/explorador/pantalla-inicio.js — Inicio de la app (ruta #/): home de carreras (DS4).
 * Responsabilidad: mostrar el título "Carreras" y, debajo, una tarjeta por carpeta raíz
 * (cada carrera), con la cantidad de contenido como subtítulo (EP2). Mientras consulta
 * muestra el estado cargando; si no hay carreras, "Todavía no hay carreras"; si falla, el
 * error con "Reintentar".
 *
 * Admin y lector ven lo mismo (DS2). Sin botones de admin ("Nueva carrera" llega en el
 * prompt 5). No habla con Supabase: usa el servicio.
 */

import { crearTitulo } from '../../ui/titulo.js';
import { crearTarjeta } from '../../ui/tarjeta.js';
import { crearLista } from '../../ui/lista.js';
import { crearEstadoVacio, crearEstadoCargando, crearEstadoError } from '../../ui/estados.js';
import { obtenerContenido, ErrorExplorador } from './servicio.js';
import { detalleCarpeta } from './formato.js';
import { aFila, hrefCarpeta, NOMBRE_RAIZ } from './filas.js';
import { abrirHojaArchivo } from './hoja-archivo.js';

/** Mensaje si falla algo que no es un error conocido del servicio. */
const MENSAJE_ERROR_INESPERADO = 'No se pudieron cargar las carreras. Probá de nuevo.';

/**
 * Monta el inicio dentro de la zona de contenido de la estructura de pantalla.
 * @param {HTMLElement} contenedor
 */
export function montarPantallaInicio(contenedor) {
  contenedor.append(
    crearTitulo({ texto: 'Carreras', subtitulo: 'Elegí tu carrera para entrar al banco' }),
  );

  // Zona que cambia según el estado. Si el usuario navega mientras se consulta, el router
  // vacía el contenedor y esta zona queda desconectada: así la respuesta tardía no se
  // dibuja encima de otra pantalla.
  const zona = document.createElement('div');
  contenedor.append(zona);

  /** Consulta las carpetas raíz y dibuja el resultado. */
  async function cargar() {
    zona.replaceChildren(crearEstadoCargando({ filas: 2, texto: 'Cargando carreras…' }));
    let elementos;
    try {
      elementos = await obtenerContenido(null);
    } catch (error) {
      if (!zona.isConnected) return;
      zona.replaceChildren(
        crearEstadoError({
          mensaje: error instanceof ErrorExplorador ? error.message : MENSAJE_ERROR_INESPERADO,
          alReintentar: cargar,
        }),
      );
      return;
    }
    if (!zona.isConnected) return;

    const carreras = elementos.filter((elemento) => elemento.tipo === 'carpeta');
    // Archivos sueltos en la raíz: no son carreras, pero tampoco se esconden (P4).
    const archivosSueltos = elementos.filter((elemento) => elemento.tipo === 'archivo');

    if (carreras.length === 0 && archivosSueltos.length === 0) {
      zona.replaceChildren(crearEstadoVacio({ titulo: 'Todavía no hay carreras' }));
      return;
    }

    const partes = [];
    if (carreras.length) {
      const tarjetas = document.createElement('div');
      tarjetas.className = 'tarjetas';
      tarjetas.append(
        ...carreras.map((carrera) =>
          crearTarjeta({
            nombre: carrera.nombre,
            subtitulo: detalleCarpeta(carrera.subcarpetas, carrera.archivos),
            href: hrefCarpeta(carrera.id),
          }),
        ),
      );
      partes.push(tarjetas);
    }
    if (archivosSueltos.length) {
      const abrir = (fila) => abrirHojaArchivo(fila.elemento, [NOMBRE_RAIZ]);
      partes.push(
        crearLista(archivosSueltos.map(aFila), {
          alAbrir: abrir,
          alMenu: abrir,
          etiqueta: 'Archivos sueltos del banco',
        }),
      );
    }
    zona.replaceChildren(...partes);
  }

  cargar();
}
