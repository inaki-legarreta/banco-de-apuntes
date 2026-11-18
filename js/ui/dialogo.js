/*
 * ui/dialogo.js — Diálogo de confirmación.
 * Responsabilidad: preguntar algo con título, texto y dos botones (cancelar y confirmar) y
 * devolver la respuesta como promesa. Variantes de la maqueta:
 * - "peligro": botón rojo (#C9474A). Para borrados (RF10). Tocar el velo NO lo cierra, así
 *   un toque distraído no decide nada.
 * - "aviso": borde y botón dorados. Para archivo pesado (RNF9) y peso del .zip (AT7).
 *
 * Accesibilidad (vía capa-modal.js): role="dialog" + aria-modal, foco atrapado, Escape
 * cancela, el foco arranca en "Cancelar" (la opción segura) y vuelve al botón que lo abrió.
 * SEGURIDAD: título, texto y etiquetas se escriben con textContent.
 */

import { abrirCapa } from './capa-modal.js';
import { crearIcono } from './iconos.js';

/** Contador para ids únicos de título y texto (aria-labelledby / aria-describedby). */
let contadorDialogos = 0;

/**
 * Abre un diálogo de confirmación.
 * @param {object} opciones
 * @param {string} opciones.titulo
 * @param {string} opciones.texto párrafo explicativo.
 * @param {string} opciones.confirmar etiqueta del botón principal (por ejemplo, "Borrar").
 * @param {string} [opciones.cancelar] etiqueta del botón secundario ("Cancelar").
 * @param {'peligro' | 'aviso'} [opciones.variante]
 * @param {string} [opciones.icono] nombre de un ícono de iconos.js para la cabecera.
 * @returns {Promise<boolean>} true si confirmó; false si canceló, apretó Escape o tocó el
 *   velo (solo en "aviso"). Resuelve cuando el diálogo terminó de cerrarse.
 */
export function confirmar({
  titulo,
  texto,
  confirmar: etiquetaConfirmar,
  cancelar: etiquetaCancelar = 'Cancelar',
  variante = 'aviso',
  icono,
}) {
  const numero = ++contadorDialogos;

  const raiz = document.createElement('div');
  raiz.className = `dialogo dialogo--${variante}`;

  const velo = document.createElement('div');
  velo.className = 'dialogo__velo';

  const panel = document.createElement('section');
  panel.className = 'dialogo__panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', `dialogo-titulo-${numero}`);
  panel.setAttribute('aria-describedby', `dialogo-texto-${numero}`);

  if (icono) {
    const marco = document.createElement('div');
    marco.className = 'dialogo__icono';
    marco.append(crearIcono(icono, { tamano: 22 }));
    panel.append(marco);
  }

  const elTitulo = document.createElement('h2');
  elTitulo.className = 'dialogo__titulo';
  elTitulo.id = `dialogo-titulo-${numero}`;
  elTitulo.textContent = titulo;

  const elTexto = document.createElement('p');
  elTexto.className = 'dialogo__texto';
  elTexto.id = `dialogo-texto-${numero}`;
  elTexto.textContent = texto;

  const botones = document.createElement('div');
  botones.className = 'dialogo__botones';
  const botonCancelar = document.createElement('button');
  botonCancelar.type = 'button';
  botonCancelar.className = 'boton boton--secundario';
  botonCancelar.textContent = etiquetaCancelar;
  const botonConfirmar = document.createElement('button');
  botonConfirmar.type = 'button';
  botonConfirmar.className = `boton ${variante === 'peligro' ? 'boton--peligro' : 'boton--principal'}`;
  botonConfirmar.textContent = etiquetaConfirmar;
  botones.append(botonCancelar, botonConfirmar);

  panel.append(elTitulo, elTexto, botones);
  raiz.append(velo, panel);

  return new Promise((resolver) => {
    let capa;
    /** Cierra el diálogo y resuelve con la respuesta. */
    async function terminar(respuesta) {
      await capa.cerrar();
      resolver(respuesta);
    }
    capa = abrirCapa({
      elemento: raiz,
      panel,
      velo,
      focoInicial: botonCancelar,
      alEscape: () => terminar(false),
      // El diálogo de peligro no se cierra con el velo (ver encabezado).
      alTocarVelo: variante === 'peligro' ? undefined : () => terminar(false),
      alCancelar: () => terminar(false),
    });
    botonCancelar.addEventListener('click', () => terminar(false));
    botonConfirmar.addEventListener('click', () => terminar(true));
  });
}
