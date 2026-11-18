/*
 * router.js — Punto de arranque del frontend y enrutador de pantallas.
 * Responsabilidad: arrancar la app, leer la ruta actual del hash de la URL (#/login, #/...),
 * aplicar las guardias de sesión (RNF5) y de rol, y montar en #app la pantalla que
 * corresponde. Las rutas privadas se montan dentro de la estructura común de pantalla
 * (js/ui/pantalla.js: encabezado, contenido con scroll y pie); el login va sin ella.
 * No contiene lógica de ningún módulo: cada pantalla la monta su módulo.
 *
 * Ruteo por hash porque el hosting es estático y sin compilación (AT1, AT4): el servidor
 * siempre entrega index.html y la parte después de "#" la resuelve el navegador.
 */

import { configuracionCompleta } from './config.js';
import { crearPantalla } from '../ui/pantalla.js';
import { cerrarCapasAbiertas } from '../ui/capa-modal.js';
import { limpiarAvisos } from '../ui/aviso.js';

/** Ruta pública de inicio de sesión. */
const RUTA_LOGIN = '/login';

/** Ruta de inicio, a la que se va con sesión o ante una ruta desconocida. */
const RUTA_INICIO = '/';

/**
 * Forma de un uuid (8-4-4-4-12 dígitos hexadecimales), como los id de items.
 * Existe para validar el id de #/carpeta/<id> ANTES de consultar la base: un id mal
 * formado nunca puede existir, y Postgres respondería con un error en lugar de "no hay
 * filas".
 */
const PATRON_UUID = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';

/**
 * Tabla de rutas. Cada entrada tiene:
 * - patron: expresión regular sobre la ruta (los grupos capturados llegan como parámetros).
 * - publica: true si se puede ver sin sesión. Por defecto todas son privadas (RNF5). Las
 *   públicas se montan sin la estructura de pantalla (sin encabezado).
 * - soloAdmin: true si un lector no la puede ver (lo manda a #/). Es comodidad: la
 *   protección real de los datos es RLS (AT5).
 * - cargarPantalla: importa el módulo (recién cuando hace falta) y devuelve la función que
 *   monta la pantalla. Las privadas reciben (contenido, { parametros, pantalla }), donde
 *   contenido es la zona con scroll y pantalla permite pedir el pie (definirPie).
 *
 * Existe para que sumar una pantalla sea agregar una entrada, sin tocar el resto del router.
 * Gana la primera entrada cuyo patrón coincide. Próxima ruta prevista:
 *   { patron: /^\/buscar$/, cargarPantalla: ... }             búsqueda (prompt 8)
 */
const rutas = [
  {
    patron: /^\/login$/,
    publica: true,
    cargarPantalla: () => import('../modulos/auth/index.js').then((m) => m.montarPantallaLogin),
  },
  {
    // Home de carreras (DS4): una tarjeta por carpeta raíz.
    patron: /^\/$/,
    cargarPantalla: () =>
      import('../modulos/explorador/index.js').then((m) => m.montarPantallaInicio),
  },
  {
    // Vista de una carpeta (RF3). Solo coincide si el id tiene forma de uuid.
    patron: new RegExp(`^/carpeta/(${PATRON_UUID})$`),
    cargarPantalla: () =>
      import('../modulos/explorador/index.js').then((m) => m.montarPantallaCarpeta),
  },
  {
    // #/carpeta/<algo que no es un uuid>: "Esta carpeta no existe", sin consultar la base.
    patron: /^\/carpeta(\/.*)?$/,
    cargarPantalla: () =>
      import('../modulos/explorador/index.js').then((m) => m.montarCarpetaInexistente),
  },
  {
    // Panel admin: PROVISIONAL hasta el prompt 9.
    patron: /^\/admin$/,
    soloAdmin: true,
    cargarPantalla: () =>
      import('../modulos/admin/index.js').then((m) => m.montarPanelProvisional),
  },
  {
    // Muestrario de componentes: PROVISIONAL, se borra en el prompt 11.
    patron: /^\/muestrario$/,
    soloAdmin: true,
    cargarPantalla: () => import('../muestrario/muestrario.js').then((m) => m.montarMuestrario),
  },
];

/** Módulo auth, cargado al arrancar (trae supabase-js desde el CDN). */
let auth = null;

/** Si hay sesión, según la última información del módulo auth. */
let haySesion = false;

/**
 * Estructura de pantalla montada (encabezado, contenido, pie), o null si no hay ninguna.
 * Existe para reutilizarla entre rutas privadas: el encabezado no se vuelve a armar y el
 * botón de cuenta sigue existiendo para recibir el foco al cerrar la hoja "Cuenta".
 */
let pantalla = null;

/**
 * Contador de navegaciones. Existe para descartar una pantalla que terminó de cargar
 * cuando el usuario ya navegó a otra.
 */
let turnoActual = 0;

/** Contenedor donde se montan las pantallas. */
function contenedorApp() {
  return document.getElementById('app');
}

/** Ruta actual a partir del hash ("" y "#" cuentan como inicio). */
function leerRuta() {
  return window.location.hash.replace(/^#/, '') || RUTA_INICIO;
}

/**
 * Cambia a otra ruta reemplazando la entrada del historial, para que el botón Atrás no
 * vuelva a una ruta que la guardia ya rechazó. El cambio de hash vuelve a llamar a
 * resolverRuta.
 */
function redirigir(ruta) {
  window.location.replace(`#${ruta}`);
}

/**
 * Muestra un mensaje de arranque (configuración incompleta o error de carga) en lugar de
 * una pantalla. Se arma con createElement y los textos van con textContent.
 */
function mostrarMensajeArranque(titulo, detalle) {
  const seccion = document.createElement('section');
  seccion.className = 'arranque';
  const tarjeta = document.createElement('div');
  tarjeta.className = 'arranque__tarjeta';
  const elTitulo = document.createElement('h1');
  elTitulo.className = 'arranque__titulo';
  elTitulo.textContent = titulo;
  const elDetalle = document.createElement('p');
  elDetalle.className = 'arranque__detalle';
  elDetalle.textContent = detalle;
  tarjeta.append(elTitulo, elDetalle);
  seccion.append(tarjeta);

  const contenedor = contenedorApp();
  contenedor.replaceChildren(seccion);
  contenedor.removeAttribute('aria-busy');
}

/**
 * Decide qué se ve según la ruta y la sesión, y monta la pantalla.
 * Existe para tener un único lugar donde se aplica la guardia:
 * - sin sesión, cualquier ruta privada lleva a #/login;
 * - con sesión, #/login lleva a #/;
 * - una ruta soloAdmin, para quien no es admin, lleva a #/;
 * - una ruta desconocida lleva a #/.
 */
async function resolverRuta() {
  // Ninguna hoja ni diálogo queda abierto encima de otra pantalla (por ejemplo, con Atrás).
  cerrarCapasAbiertas();
  const ruta = leerRuta();
  const entrada = rutas.find((r) => r.patron.test(ruta));

  if (!entrada) return redirigir(RUTA_INICIO);
  if (!entrada.publica && !haySesion) return redirigir(RUTA_LOGIN);
  if (ruta === RUTA_LOGIN && haySesion) return redirigir(RUTA_INICIO);

  const turno = ++turnoActual;
  if (entrada.soloAdmin) {
    const admin = await auth.esAdmin();
    if (turno !== turnoActual) return;
    if (!admin) return redirigir(RUTA_INICIO);
  }

  let montarPantalla;
  try {
    montarPantalla = await entrada.cargarPantalla();
  } catch {
    if (turno === turnoActual) {
      mostrarMensajeArranque(
        'No se pudo cargar la pantalla',
        'Revisá tu conexión a internet y recargá la página.',
      );
    }
    return;
  }
  // Si mientras cargaba se navegó a otra ruta o cambió la sesión, esta pantalla ya no va.
  if (turno !== turnoActual) return;

  const contenedor = contenedorApp();
  contenedor.removeAttribute('aria-busy');
  const parametros = ruta.match(entrada.patron).slice(1);

  if (entrada.publica) {
    pantalla = null;
    contenedor.replaceChildren();
    montarPantalla(contenedor, { parametros });
    return;
  }

  if (pantalla?.elemento.isConnected) {
    pantalla.reiniciar();
  } else {
    pantalla = crearPantalla({ alTocarCuenta: () => auth.abrirHojaCuenta() });
    contenedor.replaceChildren(pantalla.elemento);
  }
  montarPantalla(pantalla.contenido, { parametros, pantalla });
}

/**
 * Reacciona a un cambio de sesión (inicio, cierre, cierre en otra pestaña, token vencido).
 * Al perder la sesión vacía la pantalla en el acto, antes de navegar, para que no quede
 * nada privado a la vista.
 */
function alCambiarSesion({ sesion }) {
  const ahora = Boolean(sesion);
  if (ahora === haySesion) return;
  haySesion = ahora;
  turnoActual++;
  if (!haySesion) {
    // Nada privado a la vista: ni la pantalla, ni hojas o diálogos, ni avisos (RNF5).
    cerrarCapasAbiertas();
    limpiarAvisos();
    pantalla = null;
    contenedorApp().replaceChildren();
  }
  resolverRuta();
}

/**
 * Arranca la app. No muestra ninguna pantalla hasta saber si hay sesión, para que no
 * parpadee una pantalla privada (RNF5).
 */
async function iniciarRouter() {
  if (!configuracionCompleta()) {
    mostrarMensajeArranque(
      'Falta configurar la app',
      'Completá SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY en js/core/config.js y recargá la página.',
    );
    return;
  }

  try {
    auth = await import('../modulos/auth/index.js');
  } catch {
    mostrarMensajeArranque(
      'No se pudo cargar la app',
      'Revisá tu conexión a internet y recargá la página.',
    );
    return;
  }

  haySesion = Boolean(await auth.restaurarSesion());
  auth.alCambiarSesion(alCambiarSesion);
  window.addEventListener('hashchange', resolverRuta);
  resolverRuta();
}

iniciarRouter();
