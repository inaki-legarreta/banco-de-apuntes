/*
 * modulos/explorador/formato.js — Textos que se arman a partir de los datos del árbol.
 * Responsabilidad: convertir números en los textos que ve el usuario, en formato es-AR:
 *   - el peso de un archivo ("980 KB", "1,2 MB");
 *   - el detalle de una carpeta ("4 carpetas · 3 archivos", "1 carpeta", "Vacía"), que
 *     también es el subtítulo de las tarjetas de la home (EP2).
 * No sabe de pantallas ni de Supabase.
 */

/**
 * Unidades de peso, de a 1024 (como el Explorador de Windows o Drive).
 * Existe para no escribir los nombres de unidad en cada cálculo.
 */
const UNIDADES = Object.freeze(['B', 'KB', 'MB', 'GB', 'TB']);

/**
 * Formateadores es-AR: coma decimal y punto de miles ("1,2"; "1.024").
 * Se crean una vez porque se usan en cada fila.
 */
const NUMERO_ENTERO = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
const NUMERO_UN_DECIMAL = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });

/**
 * Peso legible de un archivo. Menos de 10 en la unidad elegida lleva un decimal ("1,2 MB",
 * "5,5 MB"); de 10 en adelante, sin decimales ("48 MB", "980 KB").
 * @param {number | null | undefined} bytes
 * @returns {string} "" si no hay dato.
 */
export function formatearPeso(bytes) {
  if (bytes === null || bytes === undefined || !Number.isFinite(Number(bytes))) return '';
  let valor = Math.max(0, Number(bytes));
  let unidad = 0;
  while (valor >= 1024 && unidad < UNIDADES.length - 1) {
    valor /= 1024;
    unidad++;
  }
  if (unidad === 0) return `${NUMERO_ENTERO.format(valor)} B`;

  const formateador = valor < 10 ? NUMERO_UN_DECIMAL : NUMERO_ENTERO;
  // Si al redondear llega a 1024 (por ejemplo 1023,7 KB), se pasa a la unidad siguiente.
  if (Number(valor.toFixed(valor < 10 ? 1 : 0)) >= 1024 && unidad < UNIDADES.length - 1) {
    return `1 ${UNIDADES[unidad + 1]}`;
  }
  return `${formateador.format(valor)} ${UNIDADES[unidad]}`;
}

/**
 * "1 carpeta", "4 carpetas", "1 archivo", "3 archivos".
 * Existe para resolver el singular y el plural en un solo lugar.
 */
function contar(cantidad, singular, plural) {
  return `${NUMERO_ENTERO.format(cantidad)} ${cantidad === 1 ? singular : plural}`;
}

/**
 * Detalle de una carpeta según su contenido directo.
 * @param {number | null | undefined} subcarpetas
 * @param {number | null | undefined} archivos
 * @returns {string} "4 carpetas · 3 archivos", "1 carpeta", "2 archivos" o "Vacía".
 */
export function detalleCarpeta(subcarpetas, archivos) {
  const partes = [];
  if (subcarpetas > 0) partes.push(contar(subcarpetas, 'carpeta', 'carpetas'));
  if (archivos > 0) partes.push(contar(archivos, 'archivo', 'archivos'));
  return partes.length ? partes.join(' · ') : 'Vacía';
}
