/*
 * modulos/explorador/pantalla-carpeta.js — Vista de una carpeta (ruta #/carpeta/<id>, RF3).
 * Responsabilidad: mostrar dónde está el usuario (ruta desde "Banco"), el nombre de la
 * carpeta con Volver a su carpeta padre (EP3) y su contenido en orden natural, con
 * carpetas arriba y archivos abajo (RF9). Tocar una carpeta entra; tocar un archivo o su ⋮
 * abre su hoja con nombre, peso y ruta.
 *
 * Todo sale de la URL: al volver con Atrás, con Volver o al recargar, la vista se rearma
 * igual desde el id (no hay estado guardado entre pantallas).
 *
 * Estados: cargando, vacía ("Esta carpeta está vacía"), error con "Reintentar" y "Esta
 * carpeta no existe" (id inexistente o que es un archivo).
 *
 * Solo lectura y igual para admin y lector (DS2). PENDIENTE: el botón ".zip" del título
 * (prompt 7) y los botones de admin del pie (prompts 5 y 6).
 * No habla con Supabase: usa el servicio.
 */

import { crearRuta } from '../../ui/ruta.js';
import { crearTitulo } from '../../ui/titulo.js';
import { crearLista } from '../../ui/lista.js';
import { crearEstadoVacio, crearEstadoCargando, crearEstadoError } from '../../ui/estados.js';
import { obtenerContenido, obtenerRuta, ErrorExplorador } from './servicio.js';
import { aFila, hrefCarpeta, HREF_INICIO, NOMBRE_RAIZ } from './filas.js';
import { abrirHojaArchivo } from './hoja-archivo.js';

/** Mensaje si falla algo que no es un error conocido del servicio. */
const MENSAJE_ERROR_INESPERADO = 'No se pudo cargar la carpeta. Probá de nuevo.';

/**
 * Estado "Esta carpeta no existe", con un botón para volver a la home.
 * Existe aparte porque lo usan tanto un id que no está en la base como una URL cuyo id
 * ni siquiera tiene forma de uuid (montarCarpetaInexistente).
 */
function crearEstadoInexistente() {
  return crearEstadoVacio({
    titulo: 'Esta carpeta no existe',
    detalle: 'Puede que se haya borrado o que el enlace esté mal.',
    accion: { etiqueta: 'Ir al inicio', href: HREF_INICIO },
  });
}

/**
 * Vista para #/carpeta/<algo que no es un uuid>. El router la usa sin consultar la base:
 * un id mal formado nunca puede existir.
 * @param {HTMLElement} contenedor
 */
export function montarCarpetaInexistente(contenedor) {
  contenedor.append(crearEstadoInexistente());
}

/**
 * Monta la vista de una carpeta.
 * @param {HTMLElement} contenedor zona de contenido de la estructura de pantalla.
 * @param {{ parametros: string[] }} opciones parametros[0] es el id (el router ya validó
 *   que sea un uuid).
 */
export function montarPantallaCarpeta(contenedor, { parametros }) {
  const [idCarpeta] = parametros;

  // Si el usuario navega mientras se consulta, el router vacía el contenedor y esta zona
  // queda desconectada: así la respuesta tardía no se dibuja encima de otra pantalla.
  const zona = document.createElement('div');
  contenedor.append(zona);

  /** Consulta ruta y contenido a la vez (dos pedidos en paralelo, RNF4) y dibuja. */
  async function cargar() {
    zona.replaceChildren(crearEstadoCargando({ texto: 'Cargando carpeta…' }));
    let ruta;
    let contenido;
    try {
      [ruta, contenido] = await Promise.all([obtenerRuta(idCarpeta), obtenerContenido(idCarpeta)]);
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

    // Sin ruta: el id no existe o es un archivo.
    if (ruta.length === 0) {
      zona.replaceChildren(crearEstadoInexistente());
      return;
    }
    dibujar(ruta, contenido);
  }

  /**
   * Arma ruta, título y lista.
   * @param {Array<{ id: string, nombre: string }>} ruta de la raíz a esta carpeta.
   * @param {import('./servicio.js').Elemento[]} contenido ya en orden natural.
   */
  function dibujar(ruta, contenido) {
    const actual = ruta[ruta.length - 1];
    const padre = ruta.length > 1 ? ruta[ruta.length - 2] : null;

    // Ruta: "Banco" (home) › ancestros (enlaces) › carpeta actual (sin enlace).
    const tramos = [
      { nombre: NOMBRE_RAIZ, href: HREF_INICIO },
      ...ruta.map((carpeta, indice) =>
        indice < ruta.length - 1
          ? { nombre: carpeta.nombre, href: hrefCarpeta(carpeta.id) }
          : { nombre: carpeta.nombre },
      ),
    ];

    // Volver va a la carpeta padre, no a la pantalla anterior del historial (EP3); desde
    // una carpeta raíz, a la home.
    const titulo = crearTitulo({
      texto: actual.nombre,
      volver: padre
        ? { href: hrefCarpeta(padre.id), etiqueta: `Volver a ${padre.nombre}` }
        : { href: HREF_INICIO, etiqueta: 'Volver al inicio' },
    });

    let cuerpo;
    if (contenido.length === 0) {
      cuerpo = crearEstadoVacio();
    } else {
      // Ubicación de los archivos de esta carpeta, para su hoja.
      const nombresRuta = [NOMBRE_RAIZ, ...ruta.map((carpeta) => carpeta.nombre)];
      const abrir = (fila) => abrirHojaArchivo(fila.elemento, nombresRuta);
      cuerpo = crearLista(contenido.map(aFila), {
        alAbrir: abrir,
        alMenu: abrir,
        etiqueta: `Contenido de ${actual.nombre}`,
      });
    }

    zona.replaceChildren(crearRuta(tramos), titulo, cuerpo);
  }

  cargar();
}
