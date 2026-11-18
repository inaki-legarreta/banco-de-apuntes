/*
 * 003-explorador.sql — Funciones de lectura para navegar el árbol (RF3, RF9, RNF4).
 *
 * Qué crea:
 *   - public.contenido_carpeta(p_padre uuid): los hijos directos de una carpeta (o las
 *     carpetas raíz si p_padre es null), con la cantidad de subcarpetas y de archivos
 *     directos de cada carpeta. Es lo que necesita una pantalla de carpeta en UNA sola
 *     consulta, sin pedir los conteos fila por fila (RNF4).
 *   - public.ruta_carpeta(p_id uuid): los ancestros de una carpeta, de la raíz hacia abajo
 *     e incluyendo la propia. Arma la ruta de la pantalla y el destino del botón Volver
 *     (EP3). Si el id no existe o no es una carpeta, no devuelve filas.
 *
 * Seguridad (RNF5):
 *   - Las dos son SECURITY INVOKER: corren con los permisos de quien las llama, así que
 *     RLS de items sigue aplicando. Sin sesión no devuelven nada.
 *   - Execute solo para authenticated. Se revoca a public (el permiso por defecto de toda
 *     función nueva) y a anon (Supabase se lo da explícitamente a las funciones nuevas).
 *   - search_path vacío: todo se nombra con su esquema, así nadie puede "colar" otra
 *     tabla items en el camino.
 *
 * No crea tablas ni columnas. No toca 001 ni 002.
 *
 * Cómo se aplica: a mano, en el SQL Editor de Supabase, DESPUÉS de 001 y 002. Es
 * idempotente (create or replace): se puede volver a correr.
 * Verificación: supabase/manual/verificacion-003.sql.
 */

-- ---------------------------------------------------------------------------
-- contenido_carpeta
-- ---------------------------------------------------------------------------

-- El orden natural (RF9) NO se resuelve acá: lo hace el frontend con Intl.Collator
-- (js/modulos/explorador/orden.js), que ordena "Clase 2" antes que "Clase 10" sin
-- depender de las collations instaladas en el servidor.
--
-- Filtro por padre: "padre_id = p_padre" no encuentra las raíces (null = null no es true)
-- y "is not distinct from" no usa índices. Las dos condiciones separadas sí usan el índice
-- items_nombre_unico_por_carpeta, que empieza por padre_id.
--
-- Conteos: una subconsulta por carpeta que lee solo sus hijos directos por el mismo
-- índice. Para un archivo quedan en null (no tiene contenido).
create or replace function public.contenido_carpeta(p_padre uuid)
returns table (
  id             uuid,
  nombre         text,
  tipo           text,
  tamano_bytes   bigint,
  actualizado_en timestamptz,
  subcarpetas    integer,
  archivos       integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    i.id,
    i.nombre,
    i.tipo,
    i.tamano_bytes,
    i.actualizado_en,
    conteo.subcarpetas,
    conteo.archivos
  from public.items as i
  left join lateral (
    select
      (count(*) filter (where h.tipo = 'carpeta'))::integer as subcarpetas,
      (count(*) filter (where h.tipo = 'archivo'))::integer as archivos
    from public.items as h
    where h.padre_id = i.id
  ) as conteo on i.tipo = 'carpeta'
  where (p_padre is null and i.padre_id is null)
     or (p_padre is not null and i.padre_id = p_padre);
$$;

comment on function public.contenido_carpeta(uuid) is
  'Hijos directos de una carpeta (p_padre null = carpetas raíz, la home de carreras, DS4) '
  'con id, nombre, tipo, tamano_bytes y actualizado_en; para las carpetas, además, la '
  'cantidad de subcarpetas y de archivos directos (null en archivos). Una sola consulta '
  'por pantalla (RNF4). Sin orden: el orden natural (RF9) lo aplica el frontend. Security '
  'invoker: RLS de items sigue aplicando, sin sesión no devuelve nada (RNF5).';

revoke execute on function public.contenido_carpeta(uuid) from public, anon;
grant execute on function public.contenido_carpeta(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- ruta_carpeta
-- ---------------------------------------------------------------------------

-- Sube desde la carpeta pedida hasta la raíz siguiendo padre_id. profundidad cuenta los
-- niveles desde la raíz (0 = carpeta raíz), para que el orden no dependa de cómo
-- devuelve las filas el cliente.
--
-- Defensa: los triggers de 002 impiden ciclos, pero si alguna vez existiera uno, el tope
-- de niveles corta la recursión en lugar de dejarla girando.
create or replace function public.ruta_carpeta(p_id uuid)
returns table (
  id          uuid,
  nombre      text,
  profundidad integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  with recursive ancestros (id, nombre, padre_id, nivel) as (
    -- Punto de partida: solo si p_id existe y es una carpeta. Si no, no hay ruta.
    select i.id, i.nombre, i.padre_id, 0
      from public.items as i
     where i.id = p_id
       and i.tipo = 'carpeta'
    union all
    select p.id, p.nombre, p.padre_id, a.nivel + 1
      from public.items as p
      join ancestros as a on p.id = a.padre_id
     where a.nivel < 1000
  )
  select
    a.id,
    a.nombre,
    ((max(a.nivel) over ()) - a.nivel)::integer as profundidad
  from ancestros as a
  order by a.nivel desc;
$$;

comment on function public.ruta_carpeta(uuid) is
  'Ancestros de una carpeta, de la raíz hacia abajo e incluyendo la propia, con id, nombre '
  'y profundidad (0 = raíz). Arma la ruta de la pantalla de carpeta y el destino de Volver '
  '(EP3). Si el id no existe o es un archivo, no devuelve filas ("Esta carpeta no '
  'existe"). Security invoker: RLS de items sigue aplicando, sin sesión no devuelve nada '
  '(RNF5).';

revoke execute on function public.ruta_carpeta(uuid) from public, anon;
grant execute on function public.ruta_carpeta(uuid) to authenticated;
