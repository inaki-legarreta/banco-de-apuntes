/*
 * ui/hoja.js — Hoja inferior (bottom sheet) de acciones.
 * Responsabilidad: mostrar, desde abajo de la pantalla, una lista de acciones de 52 px
 * (normal, destacada en dorado o peligrosa en rojo) con un encabezado, datos y una nota
 * opcionales, y avisar cuál se eligió. No sabe qué hace cada acción: lo decide quien la abre.
 *
 * Accesibilidad (vía capa-modal.js): role="dialog" + aria-modal, foco atrapado, Escape y el
 * velo la cierran, el foco vuelve al botón que la abrió.
 * SEGURIDAD: títulos, detalles, datos, nota y etiquetas se escriben con textContent.
 */

import { abrirCapa } from './capa-modal.js';
import { crearIcono } from './iconos.js';

/** Contador para ids únicos del título (aria-labelledby). */
let contadorHojas = 0;

/**
 * Tipos de acción y su clase CSS.
 * Existe para limitar los estilos a los tres de la maqueta.
 */
const CLASE_POR_TIPO = Object.freeze({
  normal: '',
  destacada: 'hoja__accion--destacada',
  peligro: 'hoja__accion--peligro',
});

/**
 * Abre una hoja inferior y espera a que el usuario elija una acción o la cierre.
 * @param {object} opciones
 * @param {{ titulo: string, detalle?: string, icono?: HTMLElement }} [opciones.encabezado]
 *   encabezado opcional (por ejemplo, nombre y peso del archivo con su ícono).
 * @param {Array<{ etiqueta: string, valor: string }>} [opciones.datos] pares etiqueta-valor
 *   que se muestran debajo del encabezado (por ejemplo, "Ubicación" y la ruta).
 * @param {string} [opciones.nota] aviso breve debajo de los datos (por ejemplo, "La
 *   descarga llega pronto.").
 * @param {string} [opciones.etiqueta] nombre accesible si no hay encabezado.
 * @param {Array<{ id: string, etiqueta: string, icono?: string,
 *   tipo?: 'normal' | 'destacada' | 'peligro' }>} opciones.acciones
 * @returns {Promise<string | null>} el id de la acción elegida, o null si se cerró sin
 *   elegir. La promesa resuelve recién cuando la hoja terminó de cerrarse y el foco volvió.
 */
export function abrirHoja({ encabezado, datos, nota, etiqueta = 'Acciones', acciones }) {
  const idTitulo = `hoja-titulo-${++contadorHojas}`;

  const raiz = document.createElement('div');
  raiz.className = 'hoja';

  const velo = document.createElement('div');
  velo.className = 'hoja__velo';

  const panel = document.createElement('section');
  panel.className = 'hoja__panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');

  const manija = document.createElement('div');
  manija.className = 'hoja__manija';
  manija.setAttribute('aria-hidden', 'true');
  panel.append(manija);

  if (encabezado) {
    const cabecera = document.createElement('header');
    cabecera.className = 'hoja__encabezado';
    if (encabezado.icono) cabecera.append(encabezado.icono);

    const textos = document.createElement('div');
    textos.className = 'hoja__textos';
    const titulo = document.createElement('h2');
    titulo.className = 'hoja__titulo';
    titulo.id = idTitulo;
    titulo.textContent = encabezado.titulo;
    textos.append(titulo);
    if (encabezado.detalle) {
      const detalle = document.createElement('p');
      detalle.className = 'hoja__detalle';
      detalle.textContent = encabezado.detalle;
      textos.append(detalle);
    }
    cabecera.append(textos);
    panel.append(cabecera);
    panel.setAttribute('aria-labelledby', idTitulo);
  } else {
    panel.setAttribute('aria-label', etiqueta);
  }

  if (datos?.length) {
    const tabla = document.createElement('dl');
    tabla.className = 'hoja__datos';
    for (const dato of datos) {
      const termino = document.createElement('dt');
      termino.textContent = dato.etiqueta;
      const valor = document.createElement('dd');
      valor.textContent = dato.valor;
      tabla.append(termino, valor);
    }
    panel.append(tabla);
  }

  if (nota) {
    const elNota = document.createElement('p');
    elNota.className = 'hoja__nota';
    elNota.textContent = nota;
    panel.append(elNota);
  }

  const lista = document.createElement('ul');
  lista.className = 'hoja__acciones';
  const botones = acciones.map((accion) => {
    const item = document.createElement('li');
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = `hoja__accion ${CLASE_POR_TIPO[accion.tipo ?? 'normal'] ?? ''}`.trim();
    boton.dataset.accion = accion.id;
    if (accion.icono) boton.append(crearIcono(accion.icono, { tamano: 22 }));
    const texto = document.createElement('span');
    texto.textContent = accion.etiqueta;
    boton.append(texto);
    item.append(boton);
    lista.append(item);
    return boton;
  });
  panel.append(lista);

  raiz.append(velo, panel);

  return new Promise((resolver) => {
    let capa;
    /** Cierra la hoja y resuelve con la acción elegida (o null). */
    async function terminar(idAccion) {
      await capa.cerrar();
      resolver(idAccion);
    }
    capa = abrirCapa({
      elemento: raiz,
      panel,
      velo,
      focoInicial: botones[0],
      alEscape: () => terminar(null),
      alTocarVelo: () => terminar(null),
      alCancelar: () => terminar(null),
    });
    lista.addEventListener('click', (evento) => {
      const boton = evento.target.closest('.hoja__accion');
      if (boton) terminar(boton.dataset.accion);
    });
  });
}
