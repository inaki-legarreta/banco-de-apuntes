/*
 * router.js — Punto de arranque del frontend y enrutador de pantallas.
 * Responsabilidad: leer la ruta actual (hash de la URL), decidir qué pantalla mostrar y
 * pedirle al módulo correspondiente que la monte en #app. No contiene lógica de ningún módulo.
 *
 * Esqueleto (prompt 0): todavía no hay pantallas; index.html muestra una portada estática.
 * Las rutas reales (login, carpeta, búsqueda, admin) se agregan a partir del prompt 2.
 */

/**
 * Tabla de rutas: asocia cada ruta con la función que monta su pantalla.
 * Existe para que agregar una pantalla sea sumar una entrada, sin tocar el resto del router.
 * @type {Record<string, (contenedor: HTMLElement) => void>}
 */
const rutas = {};

/**
 * Resuelve la ruta actual y monta su pantalla.
 * Existe para tener un único lugar donde se decide qué se ve según la URL.
 */
function resolverRuta() {
  const ruta = window.location.hash.slice(1) || '/';
  const montarPantalla = rutas[ruta];
  // Sin rutas registradas todavía: se deja la portada estática de index.html.
  if (!montarPantalla) return;
  montarPantalla(document.getElementById('app'));
}

/**
 * Arranca el router: resuelve la ruta inicial y escucha los cambios de hash.
 * Existe para que la navegación funcione sin recargar la página ni usar un framework.
 */
function iniciarRouter() {
  window.addEventListener('hashchange', resolverRuta);
  resolverRuta();
}

iniciarRouter();
