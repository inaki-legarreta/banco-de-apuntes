/*
 * ui/lista.js — Lista de carpetas y archivos estilo Drive (DS5).
 * Responsabilidad: dibujar las filas que recibe, en el orden en que llegan (el orden
 * natural con carpetas arriba lo resuelve quien trae los datos, RF9):
 * - carpeta: ícono dorado, nombre y detalle (cantidad de elementos);
 * - archivo: cuadro con la extensión (PDF, JPG, DOCX…), nombre y detalle (peso).
 * Cada fila puede tener un botón ⋮ de 44 px para sus acciones. Los nombres largos se cortan
 * con "…" sin romper la fila (CSS), y el nombre completo queda como title.
 *
 * SEGURIDAD: nombres, detalles y extensiones se escriben con textContent.
 */

import { crearIcono } from './iconos.js';

/** Largo máximo de la extensión que entra en el cuadro del archivo. */
const LARGO_MAXIMO_EXTENSION = 4;

/**
 * Extensión de un nombre de archivo, en mayúsculas ("Parcial1_2025.pdf" → "PDF").
 * Existe para que quien llama no tenga que calcularla; si no hay extensión, devuelve "".
 */
function extensionDe(nombre) {
  const punto = nombre.lastIndexOf('.');
  if (punto <= 0 || punto === nombre.length - 1) return '';
  return nombre.slice(punto + 1).toUpperCase();
}

/**
 * Ícono de una fila según su tipo.
 * @param {'carpeta' | 'archivo'} tipo
 * @param {string} nombre
 * @param {string} [extension]
 * @returns {HTMLElement}
 */
export function crearIconoItem(tipo, nombre, extension) {
  const marco = document.createElement('span');
  marco.setAttribute('aria-hidden', 'true');
  if (tipo === 'carpeta') {
    marco.className = 'item-icono item-icono--carpeta';
    marco.append(crearIcono('carpeta', { tamano: 20, grosor: 2 }));
  } else {
    marco.className = 'item-icono item-icono--archivo';
    const texto = (extension ?? extensionDe(nombre)).slice(0, LARGO_MAXIMO_EXTENSION);
    marco.textContent = texto || '•';
  }
  return marco;
}

/**
 * Crea la lista.
 * @param {Array<{ id: string, tipo: 'carpeta' | 'archivo', nombre: string,
 *   detalle?: string, extension?: string, href?: string, menu?: boolean }>} items filas ya
 *   ordenadas. href: si está, tocar la fila navega (carpetas); si no, llama a alAbrir.
 *   menu: false para que esa fila no lleve ⋮ aunque la lista tenga alMenu (por ejemplo,
 *   carpetas que todavía no tienen acciones).
 * @param {object} [opciones]
 * @param {(item: object) => void} [opciones.alAbrir] al tocar una fila sin href.
 * @param {(item: object, boton: HTMLButtonElement) => void} [opciones.alMenu] al tocar ⋮.
 *   Sin esta opción, ninguna fila muestra el botón ⋮.
 * @param {string} [opciones.etiqueta] nombre accesible de la lista.
 * @returns {HTMLUListElement}
 */
export function crearLista(items, { alAbrir, alMenu, etiqueta = 'Contenido de la carpeta' } = {}) {
  const lista = document.createElement('ul');
  lista.className = 'lista';
  lista.setAttribute('aria-label', etiqueta);

  for (const item of items) {
    const fila = document.createElement('li');
    fila.className = `fila fila--${item.tipo}`;

    let principal;
    if (item.href) {
      principal = document.createElement('a');
      principal.href = item.href;
    } else {
      principal = document.createElement('button');
      principal.type = 'button';
      principal.addEventListener('click', () => alAbrir?.(item));
    }
    principal.className = 'fila__principal';

    const textos = document.createElement('span');
    textos.className = 'fila__textos';
    const nombre = document.createElement('span');
    nombre.className = 'fila__nombre';
    nombre.textContent = item.nombre;
    nombre.title = item.nombre;
    textos.append(nombre);
    if (item.detalle) {
      const detalle = document.createElement('span');
      detalle.className = 'fila__detalle';
      detalle.textContent = item.detalle;
      textos.append(detalle);
    }
    principal.append(crearIconoItem(item.tipo, item.nombre, item.extension), textos);
    fila.append(principal);

    if (alMenu && item.menu !== false) {
      const menu = document.createElement('button');
      menu.type = 'button';
      menu.className = 'fila__menu';
      menu.setAttribute('aria-label', `Acciones de ${item.nombre}`);
      menu.setAttribute('aria-haspopup', 'dialog');
      menu.append(crearIcono('puntos', { tamano: 20 }));
      menu.addEventListener('click', () => alMenu(item, menu));
      fila.append(menu);
    }

    lista.append(fila);
  }

  return lista;
}
