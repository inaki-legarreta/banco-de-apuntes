/*
 * 002-items.sql — Árbol genérico de carpetas y archivos (AT5, D25).
 *
 * Qué crea:
 *   - Tabla public.items: cada fila es una carpeta o un archivo; padre_id arma el árbol.
 *     La base guarda solo metadatos; el contenido de los archivos vive en R2 (AT2, AT3).
 *   - Índice único de nombre por carpeta, sin distinguir mayúsculas (BD1). También sirve
 *     para listar el contenido de una carpeta, porque empieza por padre_id.
 *   - Trigger que mantiene actualizado_en.
 *   - Triggers de integridad: el padre es una carpeta, no se forman ciclos y el tipo de
 *     un elemento no cambia después de creado.
 *   - RLS: con sesión se lee; solo el admin escribe. Nada para anon (RNF5).
 *
 * Cómo se aplica: a mano, en el SQL Editor de Supabase, DESPUÉS de 001-perfiles.sql
 * (usa public.es_admin()). Es idempotente: se puede volver a correr.
 */

-- ---------------------------------------------------------------------------
-- Tabla
-- ---------------------------------------------------------------------------

create table if not exists public.items (
  id             uuid        primary key default gen_random_uuid(),
  padre_id       uuid        references public.items (id) on delete cascade,
  nombre         text        not null,
  tipo           text        not null,
  tamano_bytes   bigint,
  clave_r2       text,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),

  constraint items_tipo_valido
    check (tipo in ('carpeta', 'archivo')),

  -- \s cubre espacios, tabs y saltos de línea. Postgres usa expresiones regulares POSIX.
  constraint items_nombre_valido
    check (
      char_length(nombre) between 1 and 255
      and nombre !~ '^\s'
      and nombre !~ '\s$'
      and strpos(nombre, '/') = 0
    ),

  constraint items_clave_r2_unica
    unique (clave_r2),

  constraint items_datos_segun_tipo
    check (
      (tipo = 'archivo' and tamano_bytes is not null and tamano_bytes >= 0 and clave_r2 is not null)
      or
      (tipo = 'carpeta' and tamano_bytes is null and clave_r2 is null)
    )
);

comment on table public.items is
  'Árbol genérico de carpetas y archivos, como un Drive (AT5, D25). La app no sabe de años, '
  'materias ni secciones: eso es convención de nombres (D10–D13). Solo metadatos; los '
  'archivos viven en R2.';
comment on column public.items.id is
  'Identificador del elemento. Lo usan las URLs de la app y padre_id de los hijos.';
comment on column public.items.padre_id is
  'Carpeta que contiene a este elemento. null = carpeta raíz, o sea una carrera en la home '
  '(DS4). Borrar una carpeta borra en cascada todo su contenido en la base (BD2).';
comment on column public.items.nombre is
  'Nombre visible, también para la búsqueda (D23) y el orden natural (RF9). Único dentro de '
  'la misma carpeta sin distinguir mayúsculas (BD1).';
comment on column public.items.tipo is
  'carpeta o archivo. Define qué columnas son obligatorias (ver items_datos_segun_tipo).';
comment on column public.items.tamano_bytes is
  'Peso del archivo en bytes. Sirve para la alerta de 50 MB (RNF9), el peso del .zip (AT7) '
  'y el espacio usado (RF12). null en carpetas: su peso se calcula sumando el contenido.';
comment on column public.items.clave_r2 is
  'Clave del objeto en el bucket de R2 (AT3). /api la usa para firmar los links de subida y '
  'descarga (AT6). Única: dos filas nunca apuntan al mismo objeto. null en carpetas.';
comment on column public.items.creado_en is
  'Cuándo se creó la carpeta o se subió el archivo.';
comment on column public.items.actualizado_en is
  'Última modificación (renombrar, mover). La mantiene el trigger items_actualizar_fecha.';
comment on constraint items_tipo_valido on public.items is
  'Solo hay dos tipos de elemento (AT5).';
comment on constraint items_nombre_valido on public.items is
  'Nombre de 1 a 255 caracteres, sin espacios al inicio o al final y sin "/", que se '
  'reserva para mostrar rutas (RF5).';
comment on constraint items_clave_r2_unica on public.items is
  'Evita que dos elementos compartan el mismo objeto de R2 (borrar uno rompería el otro).';
comment on constraint items_datos_segun_tipo on public.items is
  'Un archivo siempre tiene tamaño (>= 0) y clave en R2; una carpeta no tiene ninguno de los dos.';

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------

-- NULLS NOT DISTINCT (Postgres 15+): sin esto, dos carpetas raíz (padre_id null) con el
-- mismo nombre no chocarían, porque para un índice común null es distinto de null.
-- No hace falta un índice aparte por padre_id: este ya empieza por padre_id, así que
-- Postgres lo usa para "where padre_id = ..." y "where padre_id is null".
create unique index if not exists items_nombre_unico_por_carpeta
  on public.items (padre_id, lower(nombre))
  nulls not distinct;

comment on index public.items_nombre_unico_por_carpeta is
  'BD1: dentro de una misma carpeta (o entre las carpetas raíz) no puede haber dos elementos '
  'con el mismo nombre, sin distinguir mayúsculas. Como empieza por padre_id, también '
  'acelera abrir una carpeta (RNF4) y el borrado en cascada.';

-- ---------------------------------------------------------------------------
-- actualizado_en automático
-- ---------------------------------------------------------------------------

create or replace function public.items_actualizar_fecha()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

comment on function public.items_actualizar_fecha() is
  'Pone actualizado_en = now() en cada update de items, para que la fecha no dependa de que '
  'el cliente o /api se acuerden de mandarla.';

revoke execute on function public.items_actualizar_fecha() from anon, authenticated;

drop trigger if exists items_actualizar_fecha on public.items;
create trigger items_actualizar_fecha
  before update on public.items
  for each row execute function public.items_actualizar_fecha();

comment on trigger items_actualizar_fecha on public.items is
  'Mantiene actualizado_en en cada modificación de un elemento.';

-- ---------------------------------------------------------------------------
-- Integridad del árbol
-- ---------------------------------------------------------------------------

-- Los mensajes están pensados para mostrarse tal cual en la UI.
create or replace function public.items_validar_padre()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  tipo_del_padre text;
begin
  -- Carpeta raíz: no hay padre que validar.
  if new.padre_id is null then
    return new;
  end if;

  if new.padre_id = new.id then
    raise exception 'Una carpeta no puede moverse dentro de sí misma.';
  end if;

  select i.tipo
    into tipo_del_padre
    from public.items as i
   where i.id = new.padre_id;

  if not found then
    raise exception 'La carpeta de destino no existe (puede que se haya borrado).';
  end if;

  if tipo_del_padre <> 'carpeta' then
    raise exception 'El destino tiene que ser una carpeta, no un archivo.';
  end if;

  -- Ciclos: solo pueden aparecer al MOVER una carpeta que ya existe. Se suben los
  -- ancestros del nuevo padre; si en el camino aparece la propia carpeta, el destino es
  -- un descendiente suyo. "union" (no "union all") corta el recorrido aunque hubiera un
  -- ciclo previo, así la consulta nunca queda en un bucle.
  if tg_op = 'UPDATE' and new.tipo = 'carpeta' then
    if exists (
      with recursive ancestros (id, padre_id) as (
        select i.id, i.padre_id
          from public.items as i
         where i.id = new.padre_id
        union
        select i.id, i.padre_id
          from public.items as i
          join ancestros as a on i.id = a.padre_id
      )
      select 1 from ancestros where ancestros.id = new.id
    ) then
      raise exception 'Una carpeta no puede moverse dentro de una de sus subcarpetas.';
    end if;
  end if;

  return new;
end;
$$;

comment on function public.items_validar_padre() is
  'Integridad del árbol: el padre de un elemento tiene que existir y ser una carpeta, y una '
  'carpeta no puede moverse dentro de sí misma ni de un descendiente (evita ciclos, que '
  'dejarían carpetas inalcanzables desde la home).';

revoke execute on function public.items_validar_padre() from anon, authenticated;

drop trigger if exists items_validar_padre on public.items;
create trigger items_validar_padre
  before insert or update of padre_id on public.items
  for each row execute function public.items_validar_padre();

comment on trigger items_validar_padre on public.items is
  'Valida el padre al crear un elemento y al moverlo (cambio de padre_id).';

-- "update of tipo" dispara aunque se mande el mismo valor; por eso se compara con old.
create or replace function public.items_bloquear_cambio_de_tipo()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.tipo <> old.tipo then
    raise exception 'No se puede convertir una carpeta en archivo ni un archivo en carpeta.';
  end if;
  return new;
end;
$$;

comment on function public.items_bloquear_cambio_de_tipo() is
  'Integridad del árbol: el tipo de un elemento queda fijo al crearlo. Así una carpeta con '
  'contenido nunca pasa a ser archivo (dejaría hijos colgando de un archivo).';

revoke execute on function public.items_bloquear_cambio_de_tipo() from anon, authenticated;

drop trigger if exists items_bloquear_cambio_de_tipo on public.items;
create trigger items_bloquear_cambio_de_tipo
  before update of tipo on public.items
  for each row execute function public.items_bloquear_cambio_de_tipo();

comment on trigger items_bloquear_cambio_de_tipo on public.items is
  'Rechaza cualquier update que cambie tipo.';

-- ---------------------------------------------------------------------------
-- Seguridad a nivel de fila (RLS)
-- ---------------------------------------------------------------------------

alter table public.items enable row level security;

-- RNF5: sin sesión no se ve ni un nombre. Sin políticas para anon RLS ya lo bloquea;
-- quitar los permisos es una segunda barrera.
revoke all on table public.items from anon;

drop policy if exists "items: con sesión se lee" on public.items;
create policy "items: con sesión se lee"
  on public.items
  for select
  to authenticated
  using (true);

comment on policy "items: con sesión se lee" on public.items is
  'Cualquier usuario con sesión ve el banco completo (D16): no hay permisos por carpeta.';

drop policy if exists "items: el admin crea" on public.items;
create policy "items: el admin crea"
  on public.items
  for insert
  to authenticated
  with check (public.es_admin());

comment on policy "items: el admin crea" on public.items is
  'Solo el admin crea carpetas y registra archivos subidos (RF6, RF7).';

drop policy if exists "items: el admin modifica" on public.items;
create policy "items: el admin modifica"
  on public.items
  for update
  to authenticated
  using (public.es_admin())
  with check (public.es_admin());

comment on policy "items: el admin modifica" on public.items is
  'Solo el admin renombra y mueve carpetas y archivos (RF6, RF8).';

drop policy if exists "items: el admin borra" on public.items;
create policy "items: el admin borra"
  on public.items
  for delete
  to authenticated
  using (public.es_admin());

comment on policy "items: el admin borra" on public.items is
  'Solo el admin borra (RF6, RF8). El contenido de una carpeta se borra en cascada (BD2).';
