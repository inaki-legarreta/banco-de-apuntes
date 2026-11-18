/*
 * verificacion-003.sql — Comprueba que 003-explorador.sql quedó bien aplicada.
 * NO es una migración: no crea ni modifica nada de forma permanente.
 *
 * Cómo usarlo: pegar el archivo completo en el SQL Editor de Supabase y ejecutarlo.
 *   Parte 1 (pruebas de comportamiento): si algo falla, el editor muestra un error que
 *     empieza con "FALLÓ:" y el script se detiene. Los datos de prueba se crean y se
 *     deshacen dentro del mismo bloque, así que nunca quedan en la base.
 *   Parte 2 (lista de chequeo): devuelve una tabla con una fila por cosa que tiene que
 *     cumplirse. Todas las filas tienen que tener ok = true.
 *
 * Si aparece 'function public.contenido_carpeta(uuid) does not exist', falta aplicar 003.
 * Se puede correr las veces que haga falta, con o sin los datos de prueba cargados.
 */

-- ===========================================================================
-- Parte 1 — Pruebas de comportamiento
-- ===========================================================================
-- El usuario del SQL Editor (postgres) saltea RLS. Para probar lo que ve la app, el
-- bloque cambia de rol con "set local role": authenticated (un usuario con sesión, admin
-- o lector: los dos leen igual, D16) y anon (sin sesión, RNF5).

do $$
declare
  raiz      uuid;  -- __verificacion_003_raiz
  clase_2   uuid;  --   ├── Clase 2         (carpeta: 1 subcarpeta y 1 archivo)
  sub       uuid;  --   │   ├── Sub         (carpeta vacía)
  archivo_c uuid;  --   │   └── apunte.pdf  (archivo)
  clase_10  uuid;  --   ├── Clase 10        (carpeta vacía)
  archivo_r uuid;  --   └── programa.pdf    (archivo de 2048 bytes)
  fila      record;
  cantidad  integer;
  nombres   text;
begin
  begin
    insert into public.items (nombre, tipo)
    values ('__verificacion_003_raiz', 'carpeta') returning id into raiz;
    insert into public.items (padre_id, nombre, tipo)
    values (raiz, 'Clase 2', 'carpeta') returning id into clase_2;
    insert into public.items (padre_id, nombre, tipo)
    values (raiz, 'Clase 10', 'carpeta') returning id into clase_10;
    insert into public.items (padre_id, nombre, tipo, tamano_bytes, clave_r2)
    values (raiz, 'programa.pdf', 'archivo', 2048, '__verificacion_003/programa')
    returning id into archivo_r;
    insert into public.items (padre_id, nombre, tipo)
    values (clase_2, 'Sub', 'carpeta') returning id into sub;
    insert into public.items (padre_id, nombre, tipo, tamano_bytes, clave_r2)
    values (clase_2, 'apunte.pdf', 'archivo', 10, '__verificacion_003/apunte')
    returning id into archivo_c;

    -- contenido_carpeta: solo los hijos directos (3), no los nietos.
    select count(*) into cantidad from public.contenido_carpeta(raiz);
    if cantidad <> 3 then
      raise exception using errcode = 'P0900',
        message = format('FALLÓ: contenido_carpeta devolvió %s filas en lugar de 3.', cantidad);
    end if;

    -- Conteos de una carpeta con contenido.
    select * into fila from public.contenido_carpeta(raiz) as c where c.id = clase_2;
    if fila.tipo <> 'carpeta' or fila.subcarpetas <> 1 or fila.archivos <> 1
       or fila.tamano_bytes is not null then
      raise exception using errcode = 'P0900',
        message = 'FALLÓ: los conteos de "Clase 2" no son 1 subcarpeta y 1 archivo.';
    end if;

    -- Conteos de una carpeta vacía: 0 y 0 (no null).
    select * into fila from public.contenido_carpeta(raiz) as c where c.id = clase_10;
    if fila.subcarpetas is distinct from 0 or fila.archivos is distinct from 0 then
      raise exception using errcode = 'P0900',
        message = 'FALLÓ: una carpeta vacía no devolvió 0 subcarpetas y 0 archivos.';
    end if;

    -- Un archivo trae su peso y conteos null.
    select * into fila from public.contenido_carpeta(raiz) as c where c.id = archivo_r;
    if fila.tipo <> 'archivo' or fila.tamano_bytes <> 2048
       or fila.subcarpetas is not null or fila.archivos is not null
       or fila.actualizado_en is null or fila.nombre <> 'programa.pdf' then
      raise exception using errcode = 'P0900',
        message = 'FALLÓ: el archivo no trae su peso, nombre y fecha, o trae conteos.';
    end if;

    -- p_padre null: las carpetas raíz, entre ellas la de prueba, y nada que no sea raíz.
    if not exists (select 1 from public.contenido_carpeta(null) as c where c.id = raiz)
       or exists (select 1 from public.contenido_carpeta(null) as c where c.id = clase_2) then
      raise exception using errcode = 'P0900',
        message = 'FALLÓ: contenido_carpeta(null) no devuelve solo las carpetas raíz.';
    end if;

    -- Carpeta vacía y id inexistente: sin filas.
    if exists (select 1 from public.contenido_carpeta(sub))
       or exists (select 1 from public.contenido_carpeta(gen_random_uuid())) then
      raise exception using errcode = 'P0900',
        message = 'FALLÓ: contenido_carpeta devolvió filas para una carpeta vacía o inexistente.';
    end if;

    -- ruta_carpeta: de la raíz hacia abajo, incluida la propia, con profundidad 0, 1, 2.
    select string_agg(r.nombre || ':' || r.profundidad, ' > ' order by r.profundidad)
      into nombres
      from public.ruta_carpeta(sub) as r;
    if nombres is distinct from '__verificacion_003_raiz:0 > Clase 2:1 > Sub:2' then
      raise exception using errcode = 'P0900',
        message = format('FALLÓ: ruta_carpeta devolvió "%s".', nombres);
    end if;

    -- ruta_carpeta: las filas ya salen en orden (raíz primero).
    select r.nombre into nombres from public.ruta_carpeta(sub) as r limit 1;
    if nombres <> '__verificacion_003_raiz' then
      raise exception using errcode = 'P0900',
        message = 'FALLÓ: ruta_carpeta no devuelve la raíz en la primera fila.';
    end if;

    -- ruta_carpeta de una raíz: una sola fila.
    select count(*) into cantidad from public.ruta_carpeta(raiz);
    if cantidad <> 1 then
      raise exception using errcode = 'P0900',
        message = 'FALLÓ: la ruta de una carpeta raíz no tiene exactamente un tramo.';
    end if;

    -- ruta_carpeta de un archivo o de un id inventado: sin filas ("no existe").
    if exists (select 1 from public.ruta_carpeta(archivo_c))
       or exists (select 1 from public.ruta_carpeta(gen_random_uuid())) then
      raise exception using errcode = 'P0900',
        message = 'FALLÓ: ruta_carpeta devolvió filas para un archivo o un id inexistente.';
    end if;

    -- Con sesión (rol authenticated): ve lo mismo que el SQL Editor.
    set local role authenticated;
    select count(*) into cantidad from public.contenido_carpeta(raiz);
    if cantidad <> 3 then
      raise exception using errcode = 'P0900',
        message = 'FALLÓ: un usuario con sesión no ve el contenido de la carpeta.';
    end if;
    select count(*) into cantidad from public.ruta_carpeta(sub);
    if cantidad <> 3 then
      raise exception using errcode = 'P0900',
        message = 'FALLÓ: un usuario con sesión no ve la ruta de la carpeta.';
    end if;
    reset role;

    -- Sin sesión (rol anon): no puede ejecutar ninguna de las dos (RNF5).
    begin
      set local role anon;
      perform * from public.contenido_carpeta(raiz);
      raise exception using errcode = 'P0900',
        message = 'FALLÓ: anon pudo ejecutar contenido_carpeta (RNF5).';
    exception when insufficient_privilege then null;
    end;
    reset role;

    begin
      set local role anon;
      perform * from public.ruta_carpeta(sub);
      raise exception using errcode = 'P0900',
        message = 'FALLÓ: anon pudo ejecutar ruta_carpeta (RNF5).';
    exception when insufficient_privilege then null;
    end;
    reset role;

    -- Security invoker: aunque anon tuviera permiso de ejecutar (se le da solo dentro de
    -- este bloque, que se deshace), la función corre con sus permisos y no puede leer
    -- items. Una función security definer sí devolvería filas.
    begin
      grant execute on function public.contenido_carpeta(uuid) to anon;
      grant execute on function public.ruta_carpeta(uuid) to anon;
      set local role anon;
      begin
        perform * from public.contenido_carpeta(raiz);
        raise exception using errcode = 'P0900',
          message = 'FALLÓ: contenido_carpeta leyó items con los permisos de anon (no es security invoker).';
      exception when insufficient_privilege then null;
      end;
      begin
        perform * from public.ruta_carpeta(sub);
        raise exception using errcode = 'P0900',
          message = 'FALLÓ: ruta_carpeta leyó items con los permisos de anon (no es security invoker).';
      exception when insufficient_privilege then null;
      end;
      reset role;
      -- Deshace el permiso dado a anon.
      raise exception using errcode = 'P0998', message = 'deshacer permiso temporal';
    exception when sqlstate 'P0998' then null;
    end;
    reset role;

    -- Deshacer todos los datos de prueba.
    raise exception using errcode = 'P0999', message = 'deshacer datos de prueba';
  exception when sqlstate 'P0999' then
    null;
  end;
end;
$$;

-- ===========================================================================
-- Parte 2 — Lista de chequeo
-- ===========================================================================

select chequeo, ok
from (
  select 1 as orden, 'Función contenido_carpeta(uuid) existe' as chequeo,
         to_regprocedure('public.contenido_carpeta(uuid)') is not null as ok
  union all
  select 2, 'Función ruta_carpeta(uuid) existe',
         to_regprocedure('public.ruta_carpeta(uuid)') is not null

  -- Security invoker (prosecdef = false), sql, stable y search_path vacío.
  union all
  select 10, 'contenido_carpeta: security invoker, language sql, stable, search_path vacío',
         exists (select 1 from pg_proc p join pg_language l on l.oid = p.prolang
                 where p.oid = to_regprocedure('public.contenido_carpeta(uuid)')
                   and not p.prosecdef and l.lanname = 'sql' and p.provolatile = 's'
                   and p.proconfig @> array['search_path=""'])
  union all
  select 11, 'ruta_carpeta: security invoker, language sql, stable, search_path vacío',
         exists (select 1 from pg_proc p join pg_language l on l.oid = p.prolang
                 where p.oid = to_regprocedure('public.ruta_carpeta(uuid)')
                   and not p.prosecdef and l.lanname = 'sql' and p.provolatile = 's'
                   and p.proconfig @> array['search_path=""'])

  -- Permisos de ejecución.
  union all
  select 20, 'anon NO puede ejecutar contenido_carpeta (RNF5)',
         to_regprocedure('public.contenido_carpeta(uuid)') is not null
         and not has_function_privilege('anon', 'public.contenido_carpeta(uuid)', 'execute')
  union all
  select 21, 'anon NO puede ejecutar ruta_carpeta (RNF5)',
         to_regprocedure('public.ruta_carpeta(uuid)') is not null
         and not has_function_privilege('anon', 'public.ruta_carpeta(uuid)', 'execute')
  union all
  select 22, 'public NO tiene execute sobre ninguna de las dos',
         to_regprocedure('public.contenido_carpeta(uuid)') is not null
         and to_regprocedure('public.ruta_carpeta(uuid)') is not null
         and not exists (
           select 1
             from pg_proc p, aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) as a
            where p.oid in (to_regprocedure('public.contenido_carpeta(uuid)'),
                            to_regprocedure('public.ruta_carpeta(uuid)'))
              and a.grantee = 0 and a.privilege_type = 'EXECUTE')
  union all
  select 23, 'authenticated puede ejecutar las dos',
         to_regprocedure('public.contenido_carpeta(uuid)') is not null
         and to_regprocedure('public.ruta_carpeta(uuid)') is not null
         and has_function_privilege('authenticated', 'public.contenido_carpeta(uuid)', 'execute')
         and has_function_privilege('authenticated', 'public.ruta_carpeta(uuid)', 'execute')

  -- Documentación en la base.
  union all
  select 30, 'Las dos funciones tienen comment on',
         obj_description(to_regprocedure('public.contenido_carpeta(uuid)'), 'pg_proc') is not null
         and obj_description(to_regprocedure('public.ruta_carpeta(uuid)'), 'pg_proc') is not null

  -- Sin cambios de esquema: items sigue con sus 8 columnas.
  union all
  select 40, 'public.items sigue con sus 8 columnas (003 no agrega columnas)',
         (select count(*) from information_schema.columns
           where table_schema = 'public' and table_name = 'items') = 8
) as chequeos
order by orden;
