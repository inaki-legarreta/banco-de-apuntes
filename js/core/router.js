/*
 * router.js — Punto de arranque del frontend y enrutador de pantallas.
 * Responsabilidad: arrancar la app, leer la ruta actual del hash de la URL (#/login, #/...),
 * aplicar la guardia de sesión (RNF5) y montar en #app la pantalla que corresponde.
 * No contiene lógica de ningún módulo: cada pantalla la monta su módulo.
 *
 * Ruteo por hash porque el hosting es estático y sin compilación (AT1, AT4): el servidor
 * siempre entrega index.html y la parte después de "#" la resuelve el navegador.
 */

import { configuracionCompleta } from './config.js';

/** Ruta pública de inicio de sesión. */
const RUTA_LOGIN = '/login';

/** Ruta de inicio, a la que se va con sesión o ante una ruta desconocida. */
const RUTA_INICIO = '/';

/**
 * Tabla de rutas. Cada entrada tiene:
 * - patron: expresión regular sobre la ruta (los grupos capturados llegan como parámetros).
 * - publica: true si se puede ver sin sesión. Por defecto todas son privadas (RNF5).
 * - cargarPantalla: importa el módulo (recién cuando hace falta) y devuelve la función que
 *   monta la pantalla: (contenedor, { parametros }) => void.
 *
 * Existe para que sumar una pantalla sea agregar una entrada, sin tocar el resto del router.
 * Próximas rutas previstas (prompts siguientes):
 *   { patron: /^\/carpeta\/([^/]+)$/, cargarPantalla: ... }   explorador
 *   { patron: /^\/buscar$/, cargarPantalla: ... }             búsqueda
 *   { patron: /^\/admin$/, cargarPantalla: ... }              panel admin
 */
const rutas = [
  {
    patron: /^\/login$/,
    publica: true,
    cargarPantalla: () => import('../modulos/auth/index.js').then((m) => m.montarPantallaLogin),
  },
  {
    // PROVISIONAL hasta el prompt 4: la home de carreras reemplaza este inicio.
    patron: /^\/$/,
    cargarPantalla: () =>
      import('../modulos/auth/index.js').then((m) => m.montarInicioProvisional),
  },
];

/** Módulo auth, cargado al arrancar (trae supabase-js desde el CDN). */
let auth = null;

/** Si hay sesión, según la última información del módulo auth. */
let haySesion = false;

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
 * una pantalla. El texto se escribe con textContent.
 */
function mostrarMensajeArranque(titulo, detalle) {
  const contenedor = contenedorApp();
  contenedor.innerHTML = `
    <section class="arranque">
      <div class="arranque__tarjeta">
        <h1 class="arranque__titulo"></h1>
        <p class="arranque__detalle"></p>
      </div>
    </section>
  `;
  contenedor.querySelector('.arranque__titulo').textContent = titulo;
  contenedor.querySelector('.arranque__detalle').textContent = detalle;
  contenedor.removeAttribute('aria-busy');
}

/**
 * Decide qué se ve según la ruta y la sesión, y monta la pantalla.
 * Existe para tener un único lugar donde se aplica la guardia:
 * - sin sesión, cualquier ruta privada lleva a #/login;
 * - con sesión, #/login lleva a #/;
 * - una ruta desconocida lleva a #/.
 */
async function resolverRuta() {
  const ruta = leerRuta();
  const entrada = rutas.find((r) => r.patron.test(ruta));

  if (!entrada) return redirigir(RUTA_INICIO);
  if (!entrada.publica && !haySesion) return redirigir(RUTA_LOGIN);
  if (ruta === RUTA_LOGIN && haySesion) return redirigir(RUTA_INICIO);

  const turno = ++turnoActual;
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
  contenedor.replaceChildren();
  contenedor.removeAttribute('aria-busy');
  montarPantalla(contenedor, { parametros: ruta.match(entrada.patron).slice(1) });
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
  if (!haySesion) contenedorApp().replaceChildren();
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
