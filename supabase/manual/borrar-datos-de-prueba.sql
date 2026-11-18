/*
 * borrar-datos-de-prueba.sql — Borra todo lo que cargó datos-de-prueba.sql.
 * NO es una migración.
 *
 * Qué hace: borra las dos carpetas raíz de prueba ("Prueba — Ingeniería en Sistemas" y
 * "Prueba — Carrera vacía"); todo su contenido cae en cascada (BD2). Los archivos de
 * prueba no existen en R2, así que no hay objetos que borrar allá. No toca ninguna otra
 * carpeta.
 *
 * Cómo usarlo: con tu usuario admin, en el SQL Editor de Supabase, pegar el archivo
 * completo y ejecutarlo. Devuelve una lista de chequeo: todas las filas tienen que tener
 * ok = true. Se puede correr aunque los datos de prueba ya no estén.
 */

delete from public.items
 where padre_id is null
   and nombre in ('Prueba — Ingeniería en Sistemas', 'Prueba — Carrera vacía');

select chequeo, ok
from (
  select 1 as orden, 'No quedan las carpetas raíz de prueba' as chequeo,
         not exists (select 1 from public.items
                      where padre_id is null
                        and nombre in ('Prueba — Ingeniería en Sistemas',
                                       'Prueba — Carrera vacía')) as ok
  union all
  select 2, 'No quedan archivos con clave_r2 ''prueba/%''',
         not exists (select 1 from public.items where clave_r2 like 'prueba/%')
) as chequeos
order by orden;
