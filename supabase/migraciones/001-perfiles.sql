/*
 * 001-perfiles.sql — Perfiles de usuario y rol (admin o lector).
 *
 * Qué crea:
 *   - Tabla public.perfiles: una fila por cuenta de Supabase Auth con su rol (D14, AT5).
 *   - Función + trigger que crean el perfil (rol 'lector') al dar de alta una cuenta (BD3).
 *   - Función public.es_admin(), que usan las políticas RLS de esta tabla y de items.
 *   - RLS: cada usuario lee su propio perfil; el admin lee todos. Sin escritura desde el
 *     cliente: las altas, bajas y cambios de rol se hacen desde /api con la secret key
 *     (prompt 9), que saltea RLS.
 *
 * Cómo se aplica: a mano, en el SQL Editor de Supabase, ANTES de 002-items.sql.
 * Es idempotente: se puede volver a correr sin romper nada ni duplicar datos.
 */

-- ---------------------------------------------------------------------------
-- Tabla
-- ---------------------------------------------------------------------------

create table if not exists public.perfiles (
  id        uuid        primary key references auth.users (id) on delete cascade,
  rol       text        not null default 'lector',
  creado_en timestamptz not null default now(),
  constraint perfiles_rol_valido check (rol in ('admin', 'lector'))
);

comment on table public.perfiles is
  'Rol de cada cuenta de Supabase Auth (D14). Existe para que la base sepa quién es admin y '
  'pueda validar las escrituras con RLS (AT5). Una fila por usuario de auth.users.';
comment on column public.perfiles.id is
  'Mismo id que auth.users. Al borrar la cuenta se borra su perfil (on delete cascade).';
comment on column public.perfiles.rol is
  'admin: carga, organiza y administra cuentas. lector: solo ve y descarga (D14, D16). '
  'Toda cuenta nace como lector (BD3).';
comment on column public.perfiles.creado_en is
  'Cuándo se creó el perfil (en la práctica, cuándo se dio de alta la cuenta).';
comment on constraint perfiles_rol_valido on public.perfiles is
  'Solo existen dos roles (D14); cualquier otro valor es un error.';

-- ---------------------------------------------------------------------------
-- Alta automática del perfil (BD3)
-- ---------------------------------------------------------------------------

-- security definer: el trigger lo dispara el servicio de Auth (rol supabase_auth_admin),
-- que no tiene permisos sobre public.perfiles. search_path vacío: obliga a nombrar todo
-- con su esquema y evita que alguien "suplante" tablas o funciones.
create or replace function public.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, rol)
  values (new.id, 'lector')
  on conflict (id) do nothing;
  return new;
end;
$$;

comment on function public.crear_perfil() is
  'Trigger de auth.users: crea el perfil de cada cuenta nueva con rol lector (BD3), para que '
  'ninguna cuenta quede sin rol. El primer admin se marca a mano (supabase/manual/hacer-admin.sql).';

-- No es una función para llamar desde el cliente: solo la usa el trigger.
revoke execute on function public.crear_perfil() from anon, authenticated;

-- El trigger vive en auth.users (tabla de Supabase, no nuestra). No se le pone
-- "comment on trigger" porque eso exige ser dueño de auth.users y fallaría.
drop trigger if exists crear_perfil_al_registrar on auth.users;
create trigger crear_perfil_al_registrar
  after insert on auth.users
  for each row execute function public.crear_perfil();

-- Cuentas que ya existían antes de esta migración (por ejemplo, la de Iñaki si se creó a
-- mano en el panel): se les crea el perfil como lector, igual que a una cuenta nueva.
insert into public.perfiles (id, rol)
select u.id, 'lector'
from auth.users as u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- ¿El usuario de la sesión es admin?
-- ---------------------------------------------------------------------------

-- security definer: lee perfiles salteando RLS. Sin esto, la política "el admin lee todos"
-- consultaría perfiles desde dentro de una política de perfiles (recursión infinita).
-- stable: dentro de una misma consulta devuelve siempre lo mismo, así Postgres no la
-- recalcula por cada fila.
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.perfiles as p
    where p.id = (select auth.uid())
      and p.rol = 'admin'
  );
$$;

comment on function public.es_admin() is
  'true si el usuario de la sesión (auth.uid()) tiene rol admin. Existe para que las políticas '
  'RLS de perfiles e items validen en la base que solo el admin escribe (AT5, D16).';

-- Sin sesión no hay nada que preguntar (RNF5): solo la usan usuarios autenticados.
revoke execute on function public.es_admin() from public, anon;
grant execute on function public.es_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Seguridad a nivel de fila (RLS)
-- ---------------------------------------------------------------------------

alter table public.perfiles enable row level security;

-- Sin sesión no se ve nada (RNF5). RLS ya lo bloquea; quitar los permisos es una segunda
-- barrera por si algún día se agrega una política por error.
revoke all on table public.perfiles from anon;

drop policy if exists "perfiles: cada usuario lee el suyo" on public.perfiles;
create policy "perfiles: cada usuario lee el suyo"
  on public.perfiles
  for select
  to authenticated
  using (id = (select auth.uid()));

comment on policy "perfiles: cada usuario lee el suyo" on public.perfiles is
  'Permite que la app sepa el rol de quien inició sesión (para mostrar o no los botones de '
  'admin, DS2). Un lector no ve los perfiles de los demás.';

drop policy if exists "perfiles: el admin lee todos" on public.perfiles;
create policy "perfiles: el admin lee todos"
  on public.perfiles
  for select
  to authenticated
  using (public.es_admin());

comment on policy "perfiles: el admin lee todos" on public.perfiles is
  'El admin necesita ver todas las cuentas para administrarlas (RF2).';

-- Sin políticas de insert, update ni delete: con RLS activado, eso significa que ningún
-- cliente (ni siquiera el admin desde el navegador) puede escribir perfiles. Las cuentas
-- se crean y se borran desde /api con la secret key (prompt 9).
