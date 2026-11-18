/*
 * datos-de-prueba.sql — Carga un árbol de prueba para probar el explorador (prompt 4).
 * NO es una migración. Todo lo que crea se borra con borrar-datos-de-prueba.sql.
 *
 * Qué crea (dos carpetas raíz, claramente de prueba):
 *   - "Prueba — Ingeniería en Sistemas", con la convención D10–D13:
 *       Carrera/                      (D18: plan, correlatividades)
 *       1º año/
 *         Análisis Matemático I/      Planes y requisitos · Temario · Bibliografía · Exámenes
 *           Temario/Clase 1 … Clase 11 (cargadas desordenadas, para ver el orden natural)
 *           Bibliografía/             nombres con tildes, mayúsculas, números y uno muy largo
 *           Exámenes/TP · Parcial · Final
 *         Álgebra y Geometría Analítica/ · Física I/ · Sistemas y Procesos de Negocio/
 *       2º año/                       (vacía)
 *   - "Prueba — Carrera vacía", sin contenido.
 *
 * Los archivos son de mentira: no existen en R2. Su clave_r2 empieza con 'prueba/' (así
 * borrar-datos-de-prueba.sql puede comprobar que no quedó ninguno) y los pesos son
 * variados para ver el formato es-AR: 0 B, 512 B, 980 KB, 1,2 MB, 48 MB, 1,3 GB…
 *
 * Cómo usarlo: con tu usuario admin, en el SQL Editor de Supabase, pegar el archivo
 * completo y ejecutarlo (después de aplicar 003). Si las dos carpetas de prueba ya
 * existían, las borra (con su contenido) y las vuelve a crear: se puede correr las veces
 * que haga falta. No toca ninguna otra carpeta.
 */

do $$
declare
  isi        uuid;  -- Prueba — Ingeniería en Sistemas
  carrera    uuid;
  anio_1     uuid;
  materia    uuid;
  temario    uuid;
  biblio     uuid;
  examenes   uuid;
  carpeta    uuid;
  nombre_materia text;
  numero     integer;
begin
  -- Si ya existían, se borran (el contenido cae en cascada, BD2) para empezar de cero.
  delete from public.items
   where padre_id is null
     and nombre in ('Prueba — Ingeniería en Sistemas', 'Prueba — Carrera vacía');

  -- -------------------------------------------------------------------------
  -- Raíces
  -- -------------------------------------------------------------------------
  insert into public.items (nombre, tipo)
  values ('Prueba — Ingeniería en Sistemas', 'carpeta') returning id into isi;

  insert into public.items (nombre, tipo) values ('Prueba — Carrera vacía', 'carpeta');

  -- -------------------------------------------------------------------------
  -- Carrera (D18) y años
  -- -------------------------------------------------------------------------
  insert into public.items (padre_id, nombre, tipo)
  values (isi, 'Carrera', 'carpeta') returning id into carrera;

  insert into public.items (padre_id, nombre, tipo, tamano_bytes, clave_r2)
  select carrera, a.nombre, 'archivo', a.bytes, 'prueba/' || gen_random_uuid()
    from (values
      ('Plan de estudio 2023.pdf',     1258291),   -- 1,2 MB
      ('Correlatividades.pdf',          348160),   -- 340 KB
      ('Ordenanza 1877.pdf',            512)       -- 512 B
    ) as a (nombre, bytes);

  insert into public.items (padre_id, nombre, tipo)
  values (isi, '1º año', 'carpeta') returning id into anio_1;

  -- 2º año queda vacía: su fila tiene que decir "Vacía".
  insert into public.items (padre_id, nombre, tipo) values (isi, '2º año', 'carpeta');

  -- -------------------------------------------------------------------------
  -- Materias de 1º año, cada una con las cuatro secciones (D12)
  -- -------------------------------------------------------------------------
  foreach nombre_materia in array array[
    'Análisis Matemático I',
    'Álgebra y Geometría Analítica',
    'Física I',
    'Sistemas y Procesos de Negocio'
  ] loop
    insert into public.items (padre_id, nombre, tipo)
    values (anio_1, nombre_materia, 'carpeta') returning id into materia;

    insert into public.items (padre_id, nombre, tipo)
    values (materia, 'Planes y requisitos', 'carpeta') returning id into carpeta;
    insert into public.items (padre_id, nombre, tipo, tamano_bytes, clave_r2)
    values (carpeta, 'Programa analítico.pdf', 'archivo', 1003520, 'prueba/' || gen_random_uuid()); -- 980 KB

    insert into public.items (padre_id, nombre, tipo)
    values (materia, 'Temario', 'carpeta') returning id into temario;
    insert into public.items (padre_id, nombre, tipo)
    values (materia, 'Bibliografía', 'carpeta') returning id into biblio;
    insert into public.items (padre_id, nombre, tipo)
    values (materia, 'Exámenes', 'carpeta') returning id into examenes;

    -- Las demás materias tienen un temario corto (Clase 1 a 3) y el resto vacío.
    if nombre_materia <> 'Análisis Matemático I' then
      for numero in 1..3 loop
        insert into public.items (padre_id, nombre, tipo)
        values (temario, 'Clase ' || numero, 'carpeta');
      end loop;
    end if;
  end loop;

  -- -------------------------------------------------------------------------
  -- Análisis Matemático I: la materia "completa" para probar orden y detalles
  -- -------------------------------------------------------------------------
  select i.id into materia from public.items as i
   where i.padre_id = anio_1 and i.nombre = 'Análisis Matemático I';
  select i.id into temario from public.items as i
   where i.padre_id = materia and i.nombre = 'Temario';
  select i.id into biblio from public.items as i
   where i.padre_id = materia and i.nombre = 'Bibliografía';
  select i.id into examenes from public.items as i
   where i.padre_id = materia and i.nombre = 'Exámenes';

  -- Temario: Clase 1 … Clase 11 cargadas en un orden mezclado. Con orden alfabético
  -- común quedaría "Clase 1, Clase 10, Clase 11, Clase 2…"; con orden natural, 1 a 11.
  foreach numero in array array[10, 2, 11, 1, 7, 3, 9, 5, 4, 8, 6] loop
    insert into public.items (padre_id, nombre, tipo)
    values (temario, 'Clase ' || numero, 'carpeta') returning id into carpeta;

    -- Algunas clases con contenido, para ver "N carpetas · N archivos".
    if numero = 1 then
      insert into public.items (padre_id, nombre, tipo, tamano_bytes, clave_r2)
      select carpeta, a.nombre, 'archivo', a.bytes, 'prueba/' || gen_random_uuid()
        from (values
          ('Diapositivas.pdf',         2516582),  -- 2,4 MB
          ('Foto del pizarrón.jpg',    3250585),  -- 3,1 MB
          ('Ejercicios.docx',           552960)   -- 540 KB
        ) as a (nombre, bytes);
      insert into public.items (padre_id, nombre, tipo) values (carpeta, 'Resueltos', 'carpeta');
    elsif numero = 2 then
      insert into public.items (padre_id, nombre, tipo, tamano_bytes, clave_r2)
      values (carpeta, 'Grabación de la clase.mp4', 'archivo', 1395864371, 'prueba/' || gen_random_uuid()); -- 1,3 GB
    elsif numero = 10 then
      insert into public.items (padre_id, nombre, tipo) values (carpeta, 'Práctica', 'carpeta');
      insert into public.items (padre_id, nombre, tipo) values (carpeta, 'Teoría', 'carpeta');
    end if;
  end loop;

  -- Un archivo suelto en Temario: tiene que quedar abajo de todas las carpetas.
  insert into public.items (padre_id, nombre, tipo, tamano_bytes, clave_r2)
  values (temario, 'Cronograma.xlsx', 'archivo', 24576, 'prueba/' || gen_random_uuid()); -- 24 KB

  -- Bibliografía: orden natural sin distinguir tildes ni mayúsculas.
  --   Esperado: Algebra lineal.pdf, álgebra resumida.pdf, Árbol de derivadas.pdf,
  --   ejercicio 1.pdf, Ejercicio 2.pdf, EJERCICIO 10.pdf, Éxito garantizado.txt,
  --   LEEME, Resumen completo… (el largo), resumen de límites.pdf, Stewart - Cálculo.pdf
  insert into public.items (padre_id, nombre, tipo, tamano_bytes, clave_r2)
  select biblio, a.nombre, 'archivo', a.bytes, 'prueba/' || gen_random_uuid()
    from (values
      ('Stewart - Cálculo.pdf',            50331648),  -- 48 MB
      ('resumen de límites.pdf',             819200),  -- 800 KB
      ('EJERCICIO 10.pdf',                   102400),  -- 100 KB
      ('Ejercicio 2.pdf',                     98304),  -- 96 KB
      ('ejercicio 1.pdf',                     51200),  -- 50 KB
      ('Árbol de derivadas.pdf',             716800),  -- 700 KB
      ('álgebra resumida.pdf',               204800),  -- 200 KB
      ('Algebra lineal.pdf',                5767168),  -- 5,5 MB
      ('Éxito garantizado.txt',                   0),  -- 0 B
      ('LEEME',                                1536),  -- 1,5 KB, sin extensión
      ('Resumen completo de la unidad 3 de límites y continuidad con todos los ejercicios '
       || 'resueltos paso a paso, notas de clase y correcciones del parcial (versión final '
       || 'definitiva revisada).pdf',          1572864)  -- 1,5 MB, nombre muy largo
    ) as a (nombre, bytes);

  -- Exámenes: separados solo por tipo (D13); el año va en el nombre.
  insert into public.items (padre_id, nombre, tipo)
  values (examenes, 'TP', 'carpeta');
  insert into public.items (padre_id, nombre, tipo)
  values (examenes, 'Parcial', 'carpeta') returning id into carpeta;
  insert into public.items (padre_id, nombre, tipo, tamano_bytes, clave_r2)
  select carpeta, a.nombre, 'archivo', a.bytes, 'prueba/' || gen_random_uuid()
    from (values
      ('Parcial2_2025.pdf',   1153434),  -- 1,1 MB
      ('Parcial1_2025.pdf',   2516582),  -- 2,4 MB
      ('Parcial1_2024.pdf',    921600)   -- 900 KB
    ) as a (nombre, bytes);
  insert into public.items (padre_id, nombre, tipo)
  values (examenes, 'Final', 'carpeta') returning id into carpeta;
  insert into public.items (padre_id, nombre, tipo, tamano_bytes, clave_r2)
  values (carpeta, 'Final_2024-12.pdf', 'archivo', 3355443, 'prueba/' || gen_random_uuid()); -- 3,2 MB
end;
$$;

-- Resumen de lo que quedó cargado (las dos raíces y todo lo que cuelga de ellas).
with recursive arbol as (
  select i.id, i.tipo
    from public.items as i
   where i.padre_id is null
     and i.nombre in ('Prueba — Ingeniería en Sistemas', 'Prueba — Carrera vacía')
  union all
  select i.id, i.tipo
    from public.items as i
    join arbol as a on i.padre_id = a.id
)
select
  count(*) filter (where tipo = 'carpeta') as carpetas_de_prueba,
  count(*) filter (where tipo = 'archivo') as archivos_de_prueba
from arbol;
