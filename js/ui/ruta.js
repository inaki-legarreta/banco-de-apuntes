/*
 * ui/ruta.js — Ruta de carpetas ("Banco › … › AM I › Exámenes › Parciales").
 * Responsabilidad: mostrar dónde está el usuario dentro del árbol, con un enlace por tramo
 * y el último (la carpeta actual) en dorado. Si no entra en una línea, colapsa los tramos
 * del medio en "…", conservando siempre el primero y el último.
 *
 * SEGURIDAD: los nombres de carpeta se escriben con textContent.
 */

/** Separador visual entre tramos (decorativo, oculto para lectores de pantalla). */
const SEPARADOR = '›';

/**
 * Crea la ruta.
 * @param {Array<{ nombre: string, href?: string }>} tramos del primero (raíz) al último
 *   (carpeta actual). El último no lleva enlace: es donde ya se está.
 * @returns {HTMLElement} un <nav> que se ajusta solo al ancho disponible.
 */
export function crearRuta(tramos) {
  const nav = document.createElement('nav');
  nav.className = 'ruta';
  nav.setAttribute('aria-label', 'Ruta de carpetas');

  const lista = document.createElement('ol');
  lista.className = 'ruta__lista';
  nav.append(lista);

  /**
   * Arma la lista; los tramos cuyos índices están en "ocultos" se reemplazan por un único
   * "…".
   * @param {Set<number>} ocultos índices de tramos colapsados.
   */
  function dibujar(ocultos) {
    lista.replaceChildren();
    let puntosPuestos = false;
    tramos.forEach((tramo, indice) => {
      if (ocultos.has(indice)) {
        if (puntosPuestos) return;
        puntosPuestos = true;
        const item = crearItem(indice);
        const puntos = document.createElement('span');
        puntos.className = 'ruta__colapsado';
        puntos.textContent = '…';
        // El nombre completo de lo colapsado queda disponible como ayuda y para lectores.
        const nombres = tramos.filter((_, i) => ocultos.has(i)).map((t) => t.nombre);
        puntos.title = nombres.join(` ${SEPARADOR} `);
        puntos.setAttribute('aria-label', `Carpetas intermedias: ${nombres.join(', ')}`);
        item.append(puntos);
        lista.append(item);
        return;
      }
      const item = crearItem(indice);
      const esUltimo = indice === tramos.length - 1;
      let texto;
      if (esUltimo || !tramo.href) {
        texto = document.createElement('span');
        if (esUltimo) {
          texto.className = 'ruta__actual';
          texto.setAttribute('aria-current', 'page');
        } else {
          texto.className = 'ruta__tramo';
        }
      } else {
        texto = document.createElement('a');
        texto.className = 'ruta__tramo';
        texto.href = tramo.href;
      }
      texto.textContent = tramo.nombre;
      item.append(texto);
      lista.append(item);
    });
  }

  /** Crea un <li> con el separador antes, salvo el primero. */
  function crearItem(indice) {
    const item = document.createElement('li');
    item.className = 'ruta__item';
    if (indice > 0) {
      const separador = document.createElement('span');
      separador.className = 'ruta__separador';
      separador.setAttribute('aria-hidden', 'true');
      separador.textContent = SEPARADOR;
      item.append(separador);
    }
    return item;
  }

  /**
   * Colapsa tramos del medio, de a uno y de izquierda a derecha, hasta que la ruta entre.
   * Existe para que se lean siempre la raíz y las carpetas más cercanas a la actual.
   */
  function ajustar() {
    if (!nav.isConnected || nav.clientWidth === 0) return;
    // Mientras mide, el último tramo no se achica: si no, nunca "sobra" ancho y el último
    // se cortaría antes de colapsar los del medio.
    nav.classList.add('ruta--midiendo');
    const ocultos = new Set();
    dibujar(ocultos);
    for (let indice = 1; indice < tramos.length - 1; indice++) {
      if (lista.scrollWidth <= lista.clientWidth) break;
      ocultos.add(indice);
      dibujar(ocultos);
    }
    // Si aun así no entra, el último tramo se corta con "…" (CSS).
    nav.classList.remove('ruta--midiendo');
  }

  dibujar(new Set());
  // Se reajusta al montarse y cada vez que cambia el ancho (rotar el celular, por ejemplo).
  let anchoAnterior = 0;
  const observador = new ResizeObserver(() => {
    if (nav.clientWidth === anchoAnterior) return;
    anchoAnterior = nav.clientWidth;
    ajustar();
  });
  observador.observe(nav);

  return nav;
}
