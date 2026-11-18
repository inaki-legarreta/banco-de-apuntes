/*
 * modulos/explorador/orden.js — Orden natural del contenido de una carpeta (RF9).
 * Responsabilidad: decidir en qué orden se muestran carpetas y archivos, en un solo lugar,
 * para que la home, la vista de carpeta y más adelante la búsqueda ordenen igual.
 *
 * Reglas:
 *   1. Carpetas arriba, archivos abajo.
 *   2. Dentro de cada grupo, por nombre en orden natural en español: los números se
 *      comparan por su valor ("Clase 2" antes que "Clase 10") y no se distinguen tildes
 *      ni mayúsculas ("álgebra" queda junto a "Algebra", "Árbol" junto a "arbol").
 *
 * Se ordena en el navegador (y no en la base) porque Intl.Collator hace el orden natural
 * igual en todos los navegadores modernos, sin depender de las collations que tenga
 * instaladas el servidor de Postgres.
 */

/**
 * Comparador principal: español, numérico y sin distinguir tildes ni mayúsculas
 * (sensitivity 'base': "a", "á" y "A" valen lo mismo).
 * Existe como constante porque crear un Collator es caro y se usa en cada comparación.
 */
const COMPARADOR_NATURAL = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });

/**
 * Comparador de desempate: el mismo orden pero distinguiendo tildes y mayúsculas.
 * Existe para que dos nombres que el principal considera iguales ("Árbol.pdf" y
 * "arbol.pdf") salgan siempre en el mismo orden, y no según cómo los devolvió la base.
 */
const COMPARADOR_DESEMPATE = new Intl.Collator('es', { numeric: true, sensitivity: 'variant' });

/** Posición de cada tipo: las carpetas van antes que los archivos (RF9). */
const POSICION_TIPO = Object.freeze({ carpeta: 0, archivo: 1 });

/**
 * Compara dos elementos según el orden natural. Sirve para Array.prototype.sort.
 * @param {{ tipo: 'carpeta' | 'archivo', nombre: string, id?: string }} a
 * @param {{ tipo: 'carpeta' | 'archivo', nombre: string, id?: string }} b
 * @returns {number}
 */
export function compararNatural(a, b) {
  return (
    (POSICION_TIPO[a.tipo] ?? 2) - (POSICION_TIPO[b.tipo] ?? 2) ||
    COMPARADOR_NATURAL.compare(a.nombre, b.nombre) ||
    COMPARADOR_DESEMPATE.compare(a.nombre, b.nombre) ||
    // Último recurso (no debería pasar por BD1): el id, para que el orden sea estable.
    String(a.id ?? '').localeCompare(String(b.id ?? ''))
  );
}

/**
 * Devuelve una copia ordenada (no modifica el arreglo recibido).
 * @template {{ tipo: 'carpeta' | 'archivo', nombre: string }} T
 * @param {T[]} elementos
 * @returns {T[]}
 */
export function ordenarNatural(elementos) {
  return [...elementos].sort(compararNatural);
}
