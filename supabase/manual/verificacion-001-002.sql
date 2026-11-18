/*
 * verificacion-001-002.sql — Comprueba que 001-perfiles.sql y 002-items.sql quedaron bien
 * aplicadas. NO es una migración: no crea ni modifica nada de forma permanente.
 *
 * Cómo usarlo: pegar el archivo completo en el SQL Editor de Supabase y ejecutarlo.
 *   Parte 1 (pruebas de comportamiento): si algo falla, el editor muestra un error que
 *     empieza con "FALLÓ:" y el script se detiene. Los datos de prueba se crean y se
 *     deshacen dentro del mismo bloque, así que nunca quedan en la base.
 *   Parte 2 (lista de chequeo): devuelve una tabla con una fila por cosa que tiene que
 *     existir. Todas las filas tienen que tener ok = true.
 *
 * Si aparece un error del tipo 'relation "public.items" does not exist', falta aplicar
 * alguna de las dos migraciones.
 *
 * Se puede correr las veces que haga falta.
 */

-- ===========================================================================
-- Parte 1 — Pruebas de comportamiento sobre public.items
-- ===========================================================================
-- Se ejecutan como el usuario del SQL Editor (postgres), que saltea RLS: acá se prueban
-- restricciones, índices y triggers. RLS se comprueba en la parte 2 (que esté activado y
-- con las políticas correctas) y desde la app con un lector en el prompt 2.

do $$
declare
  carpeta_a uuid;
  carpeta_b uuid;
  archivo_f uuid;
  fecha     timestamptz;
begin
  -- Bloque con "deshacer" al final: al lanzar el error P0999 y atraparlo, Postgres
  -- revierte todo lo que se hizo adentro.
  begin
    -- Árbol de prueba:  A (raíz) → B (carpeta) → F (archivo)
    insert into public.items (nombre, tipo)
    values ('__verificacion_A', 'carpeta') returning id into carpeta_a;
    insert into public.items (padre_id, nombre, tipo)
    values (carpeta_a, '__verificacion_B', 'carpeta') returning id into carpeta_b;
    insert into public.items (padre_id, nombre, tipo, tamano_bytes, clave_r2)
    values (carpeta_b, '__verificacion_F.pdf', 'archivo', 123, '__verificacion/clave-f')
    returning id into archivo_f;

    -- BD1: carpeta raíz con el mismo nombre en otras mayúsculas.
    begin
      insert into public.items (nombre, tipo) values ('__VERIFICACION_a', 'carpeta');
      raise exception using errcode = 'P0900',
        message = 'FALLÓ: se aceptaron dos carpetas raíz con el mismo nombre (BD1).';
    exception when unique_violation then null;
    end;

    -- BD1: mismo nombre dentro de una misma carpeta.
    begin
      insert into public.items (padre_id, nombre, tipo) values (carpeta_a, '__Verificacion_b', 'carpeta');
      raise exception using errcode = 'P0900',
        message = 'FALLÓ: se aceptaron dos elementos con el mismo nombre en una carpeta (BD1).';
    exception when unique_violation then null;
    end;

    -- Nombre con espacio al inicio.
    begin
      insert into public.items (nombre, tipo) values (' __verificacion_espacio', 'carpeta');
      raise exception using errcode = 'P0900',
        message = 'FALLÓ: se aceptó un nombre con espacio al inicio.';
    exception when check_violation then null;
    end;

    -- Nombre con espacio al final.
    begin
      insert into public.items (nombre, tipo) values ('__verificacion_espacio ', 'carpeta');
      raise exception using errcode = 'P0900',
        message = 'FALLÓ: se aceptó un nombre con espacio al final.';
    exception when check_violation then null;
    end;

    -- Nombre con "/".
    begin
      insert into public.items (nombre, tipo) values ('__verificacion/barra', 'carpeta');
      raise exception using errcode = 'P0900',
        message = 'FALLÓ: se aceptó un nombre con "/".';
    exception when check_violation then null;
    end;

    -- Nombre vacío.
    begin
      insert into public.items (nombre, tipo) values ('', 'carpeta');
      raise exception using errcode = 'P0900',
        message = 'FALLÓ: se aceptó un nombre vacío.';
    exception when check_violation then null;
    end;

    -- Carpeta con tamaño (no debería tenerlo).
    begin
      insert into public.items (nombre, tipo, tamano_bytes) values ('__verificacion_C', 'carpeta', 10);
      raise exception using errcode = 'P0900',
        message = 'FALLÓ: se aceptó una carpeta con tamano_bytes.';
    exception when check_violation then null;
    end;

    -- Archivo sin clave de R2.
    begin
      insert into public.items (padre_id, nombre, tipo, tamano_bytes) values (carpeta_a, '__verificacion_G.pdf', 'archivo', 10);
      raise exception using errcode = 'P0900',
        message = 'FALLÓ: se aceptó un archivo sin clave_r2.';
    exception when check_violation then null;
    end;

    -- Tipo inválido.
    begin
      insert into public.items (nombre, tipo) values ('__verificacion_T', 'otro');
      raise exception using errcode = 'P0900',
        message = 'FALLÓ: se aceptó un tipo distinto de carpeta/archivo.';
    exception when check_violation then null;
    end;

    -- clave_r2 repetida.
    begin
      insert into public.items (padre_id, nombre, tipo, tamano_bytes, clave_r2)
      values (carpeta_a, '__verificacion_H.pdf', 'archivo', 1, '__verificacion/clave-f');
      raise exception using errcode = 'P0900',
        message = 'FALLÓ: se aceptaron dos archivos con la misma clave_r2.';
    exception when unique_violation then null;
    end;

    -- Trigger: guardar algo dentro de un archivo.
    begin
      insert into public.items (padre_id, nombre, tipo) values (archivo_f, '__verificacion_X', 'carpeta');
      raise exception using errcode = 'P0900',
        message = 'FALLÓ: se aceptó un elemento dentro de un archivo.';
    exception when raise_exception then null;
    end;

    -- Trigger: mover una carpeta dentro de sí misma.
    begin
      update public.items set padre_id = carpeta_a where id = carpeta_a;
      raise exception using errcode = 'P0900',
        message = 'FALLÓ: se movió una carpeta dentro de sí misma.';
    exception when raise_exception then null;
    end;

    -- Trigger: mover una carpeta dentro de un descendiente (ciclo).
    begin
      update public.items set padre_id = carpeta_b where id = carpeta_a;
      raise exception using errcode = 'P0900',
        message = 'FALLÓ: se movió una carpeta dentro de una subcarpeta suya (ciclo).';
    exception when raise_exception then null;
    end;

    -- Trigger: actualizado_en se pisa con now() aunque se mande otro valor.
    update public.items set actualizado_en = '2000-01-01' where id = carpeta_b;
    select i.actualizado_en into fecha from public.items as i where i.id = carpeta_b;
    if fecha <> now() then
      raise exception using errcode = 'P0900',
        message = 'FALLÓ: el trigger no actualizó actualizado_en.';
    end if;

    -- Un movimiento válido tiene que funcionar: B pasa a ser raíz.
    update public.items set padre_id = null where id = carpeta_b;
    update public.items set padre_id = carpeta_a where id = carpeta_b;

    -- BD2: borrar A borra B y F en cascada.
    delete from public.items where id = carpeta_a;
    if exists (select 1 from public.items where id in (carpeta_b, archivo_f)) then
      raise exception using errcode = 'P0900',
        message = 'FALLÓ: borrar una carpeta no borró su contenido (BD2).';
    end if;

    -- Deshacer todos los datos de prueba.
    raise exception using errcode = 'P0999', message = 'deshacer datos de prueba';
  exception when sqlstate 'P0999' then
    null;
  end;
end;
$$;

-- ===========================================================================
-- Parte 2 — Lista de chequeo: todo lo que tiene que existir
-- ===========================================================================

select chequeo, ok
from (
  -- Tablas y RLS
  select 1 as orden, 'Tabla public.perfiles existe' as chequeo,
         to_regclass('public.perfiles') is not null as ok
  union all
  select 2, 'Tabla public.items existe',
         to_regclass('public.items') is not null
  union all
  select 3, 'RLS activado en public.perfiles',
         coalesce((select c.relrowsecurity from pg_class c where c.oid = to_regclass('public.perfiles')), false)
  union all
  select 4, 'RLS activado en public.items',
         coalesce((select c.relrowsecurity from pg_class c where c.oid = to_regclass('public.items')), false)

  -- Funciones (security definer y search_path vacío donde corresponde)
  union all
  select 10, 'Función crear_perfil(): security definer, search_path vacío',
         exists (select 1 from pg_proc p
                 where p.oid = to_regprocedure('public.crear_perfil()')
                   and p.prosecdef and p.proconfig @> array['search_path=""'])
  union all
  select 11, 'Función es_admin(): stable, security definer, search_path vacío',
         exists (select 1 from pg_proc p
                 where p.oid = to_regprocedure('public.es_admin()')
                   and p.prosecdef and p.provolatile = 's'
                   and p.proconfig @> array['search_path=""'])
  union all
  select 12, 'Función items_actualizar_fecha() existe',
         to_regprocedure('public.items_actualizar_fecha()') is not null
  union all
  select 13, 'Función items_validar_padre() existe',
         to_regprocedure('public.items_validar_padre()') is not null
  union all
  select 14, 'anon NO puede ejecutar es_admin()',
         to_regprocedure('public.es_admin()') is not null
         and not has_function_privilege('anon', 'public.es_admin()', 'execute')
  union all
  select 15, 'authenticated puede ejecutar es_admin()',
         to_regprocedure('public.es_admin()') is not null
         and has_function_privilege('authenticated', 'public.es_admin()', 'execute')

  -- Triggers
  union all
  select 20, 'Trigger crear_perfil_al_registrar en auth.users',
         exists (select 1 from pg_trigger t
                 where t.tgrelid = 'auth.users'::regclass
                   and t.tgname = 'crear_perfil_al_registrar' and t.tgenabled <> 'D')
  union all
  select 21, 'Trigger items_actualizar_fecha en public.items',
         exists (select 1 from pg_trigger t
                 where t.tgrelid = to_regclass('public.items')
                   and t.tgname = 'items_actualizar_fecha' and t.tgenabled <> 'D')
  union all
  select 22, 'Trigger items_validar_padre en public.items',
         exists (select 1 from pg_trigger t
                 where t.tgrelid = to_regclass('public.items')
                   and t.tgname = 'items_validar_padre' and t.tgenabled <> 'D')

  -- Índices y restricciones
  union all
  select 30, 'Índice único items_nombre_unico_por_carpeta con NULLS NOT DISTINCT (BD1)',
         exists (select 1 from pg_index i
                 where i.indexrelid = to_regclass('public.items_nombre_unico_por_carpeta')
                   and i.indisunique and i.indnullsnotdistinct)
  union all
  select 31, 'Índice items_padre_id_idx',
         to_regclass('public.items_padre_id_idx') is not null
  union all
  select 32, 'Restricciones de items (tipo, nombre, clave_r2 única, datos según tipo)',
         (select count(*) from pg_constraint c
          where c.conrelid = to_regclass('public.items')
            and c.conname in ('items_tipo_valido', 'items_nombre_valido',
                              'items_clave_r2_unica', 'items_datos_segun_tipo')) = 4
  union all
  select 33, 'Restricción perfiles_rol_valido',
         exists (select 1 from pg_constraint c
                 where c.conrelid = to_regclass('public.perfiles')
                   and c.conname = 'perfiles_rol_valido')

  -- Políticas
  union all
  select 40, 'Políticas de perfiles: 2 de select, ninguna de escritura',
         (select count(*) from pg_policies p
          where p.schemaname = 'public' and p.tablename = 'perfiles' and p.cmd = 'SELECT'
            and p.policyname in ('perfiles: cada usuario lee el suyo', 'perfiles: el admin lee todos')) = 2
         and not exists (select 1 from pg_policies p
                         where p.schemaname = 'public' and p.tablename = 'perfiles' and p.cmd <> 'SELECT')
  union all
  select 41, 'Políticas de items: select, insert, update y delete',
         (select count(*) from pg_policies p
          where p.schemaname = 'public' and p.tablename = 'items'
            and (p.policyname, p.cmd) in (('items: con sesión se lee', 'SELECT'),
                                          ('items: el admin crea', 'INSERT'),
                                          ('items: el admin modifica', 'UPDATE'),
                                          ('items: el admin borra', 'DELETE'))) = 4
  union all
  select 42, 'Todas las políticas son solo para authenticated (nada para anon)',
         not exists (select 1 from pg_policies p
                     where p.schemaname = 'public' and p.tablename in ('perfiles', 'items')
                       and p.roles <> array['authenticated']::name[])
  union all
  select 43, 'anon sin permisos sobre perfiles e items (RNF5)',
         to_regclass('public.items') is not null and to_regclass('public.perfiles') is not null
         and not has_table_privilege('anon', 'public.items', 'select, insert, update, delete')
         and not has_table_privilege('anon', 'public.perfiles', 'select, insert, update, delete')

  -- Datos
  union all
  select 50, 'Toda cuenta de auth.users tiene perfil',
         to_regclass('public.perfiles') is not null
         and not exists (select 1 from auth.users u
                         where not exists (select 1 from public.perfiles p where p.id = u.id))
) as chequeos
order by orden;
