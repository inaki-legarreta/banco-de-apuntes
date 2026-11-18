# Banco de Apuntes — Registro de Decisiones

Fase de metas — **CERRADA el 2026-11-17**. Documento final: "Visión y metas del Banco de Apuntes" (Claude Docs).
Fase de diseño — **en curso**. Maqueta: "Banco de Apuntes — Maqueta" (canvas de diseño).

## Etapa 1 — Problema y visión (CERRADA · 2026-11-17)

| # | Decisión |
|---|---|
| D1 | **Problema:** el material ordenado solo se puede usar donde está el pendrive. El material de origen está disperso, pero juntarlo no es responsabilidad de la app. |
| D2 | **Visión:** "Todos mis apuntes de la carrera, de cualquier materia, ordenados y accesibles desde cualquier dispositivo, incluso uno ajeno, con una experiencia simple y prolija." |
| D3 | La carga de material es **manual**. La app no se conecta a fuentes externas (campus, drives, grupos). |
| D4 | Se usa desde el **navegador**, sin instalar nada (app web). |
| D5 | El acceso es **privado, con login**. Iñaki puede crearle cuenta a quien quiera; no hay registro abierto. Las cuentas de terceros son secundarias. |
| D6 | La simplicidad y la estética son un **criterio para recortar funciones**: lo que complica la experiencia no entra. |
| D7 | **Mobile-first:** se diseña primero para celular y después se adapta a escritorio. |
| D8 | **No hay lógica de correlatividades.** El plan de estudio se usa solo como lista de materias (los documentos de correlatividades sí se guardan, como archivos). |

### Principios rectores (convertidos en RNF10)
| # | Principio |
|---|---|
| P1 | El núcleo es el banco de apuntes. Todo lo que no sea imprescindible es un **módulo** separable, en la app (secciones, funciones) y en el código. |
| P2 | Cada módulo está **documentado**. |
| P3 | El código está **comentado**: cada estructura dice para qué existe y qué responsabilidad tiene. |
| P4 | **Trazabilidad y buenas prácticas** (regla de oro): todo está sujeto a cambios, así que cada cambio tiene que poder rastrearse (control de versiones, registro de decisiones, documentación actualizada). Sin atajos que escondan datos o comportamiento. |

## Etapa 2 — Usuarios (CERRADA · 2026-11-17)

| # | Decisión |
|---|---|
| D14 | **Dos roles.** **Admin** (Iñaki): carga, organiza y edita el material, y crea y da de baja cuentas. **Lector**: ve el banco completo. |
| D15 | Hay **un solo banco**, el de Iñaki. Los lectores no tienen banco propio. |
| D16 | Los lectores **ven todo** y pueden descargar. **No suben, no editan ni borran.** No hay permisos por carpeta. |
| D17 | Público: grupo chico de amigos de Iñaki. Si crece mucho, se reabren las etapas 2 y 7. |

## Etapa 3 — Inventario (CERRADA · 2026-11-17)

| # | Decisión |
|---|---|
| D9 | Se usa solo el **Plan 2023** (Ord. 1877). El plan 2008 y sus equivalencias quedan afuera. |
| D10 | **Convención de organización** (no es regla de la app, ver D25): Carrera → Año de la carrera (1º–5º) → Materia → secciones. Las electivas van en el año que corresponda. |
| D11 | **Vocabulario:** "Parcial" es el examen. "Integradora" se usa solo para el tipo de materia. |
| D12 | **Convención de secciones por materia:** Planes y requisitos · Temario (carpeta por clase) · Bibliografía (libros, resúmenes, consulta) · Exámenes. |
| D13 | **Exámenes** se separan solo por tipo (TP, Parcial, Final y otros). El año del examen va en el **nombre del archivo** (por ejemplo, "Parcial1_2025.pdf"). |
| D18 | **Convención:** carpeta **"Carrera"** al mismo nivel que los años, con plan de estudio, correlatividades, ordenanzas e info general. |
| D19 | **Volumen:** hoy ~2 GB (todo 1º año). El banco crece a medida que se cursa. Estimación al final de la carrera: **~10 GB** (suposición; la proporción de videos no se conoce). |
| D20 | **Formatos:** PDF, Word, fotos, videos y otros. No hace falta verlos dentro de la app: **alcanza con descargarlos**. |

## Etapa 4 — Alcance del MVP (CERRADA · 2026-11-17)

| # | Decisión |
|---|---|
| D21 | **La v1 incluye:** login con roles · árbol de carpetas y archivos · gestión del admin (crear carpetas, subir, renombrar, mover, borrar, administrar cuentas) · navegación y descarga · búsqueda aproximada · indicador de espacio usado · mobile-first. |
| D22 | **Afuera de la v1:** correlatividades · plan 2008 · fuentes externas · ver archivos dentro de la app · registro abierto · lectores que suben · permisos por carpeta · modo sin conexión · búsqueda por contenido · subir carpetas con subcarpetas · carpetas creadas automáticamente · papelera · respaldo automático · calendario académico (M1) · cobro de suscripciones dentro de la app (M2). |
| D23 | **Búsqueda:** palabras clave sobre **nombres** de archivos y carpetas. Tolera tildes, errores de tipeo y desorden de palabras. La búsqueda por contenido queda como posible módulo futuro. |
| D24 | **Carga:** manual, eligiendo una carpeta destino, con **varios archivos por subida**. |
| D25 | **Todas las carpetas las crea el admin a mano.** La app es un árbol genérico de carpetas y archivos: no tiene conceptos de año, materia ni sección. |

## Etapa 5 — Requisitos funcionales (CERRADA · 2026-11-17)

| RF | Quién | Qué |
|---|---|---|
| RF1 | Todos | Iniciar y cerrar sesión |
| RF2 | Admin | Crear y dar de baja cuentas de lectores |
| RF3 | Todos | Navegar el árbol de carpetas |
| RF4 | Todos | Descargar un archivo |
| RF5 | Todos | Buscar de forma aproximada por palabras clave en nombres. Cada resultado muestra dónde está (la ruta de carpetas). |
| RF6 | Admin | Crear, renombrar, mover y borrar carpetas |
| RF7 | Admin | Subir varios archivos a una carpeta |
| RF8 | Admin | Renombrar, mover y borrar archivos |
| RF9 | Todos | El contenido de cada carpeta se muestra en **orden natural** (Clase 1, 2… 10), con carpetas arriba y archivos abajo |
| RF10 | Admin | Todo borrado **pide confirmación**. Si es una carpeta, avisa cuántos elementos contiene. No hay papelera. |
| RF11 | Todos | **Descargar una carpeta completa** como .zip, con un **tope de 500 MB** (AT7) |
| RF12 | Admin | Ver el **espacio usado** del banco *(agregado en la etapa 7)* |

## Etapa 6 — Requisitos no funcionales (CERRADA · 2026-11-17)

| RNF | Tema | Requisito |
|---|---|---|
| RNF1 | Dispositivos | Funciona en el navegador de cualquier celular y compu modernos. Se diseña primero para celular. |
| RNF2 | Sin conexión | No es necesario. |
| RNF3 | Almacenamiento | Banca unos 10 GB a lo largo de la carrera. |
| RNF4 | Rendimiento | Abrir una carpeta o buscar responde en menos de 2 segundos desde el celular con datos móviles. |
| RNF5 | Privacidad | Sin sesión no se ve nada, ni siquiera los nombres. Los links de descarga no funcionan sin cuenta. |
| RNF6 | Sesión | Se cierra sola después de un tiempo sin uso. "Recordarme" es opcional, para dispositivos propios. |
| RNF7 | Costo | **Arranca en $0.** |
| RNF8 | Escalabilidad | Ampliar almacenamiento o usuarios **pagando, sin migrar el material ni reescribir la app**. |
| RNF9 | Archivos pesados | Si un archivo pesa más de **50 MB**, aparece una alerta al subirlo, pero se permite. Antes de descargar un .zip se muestra su peso. |
| RNF10 | Código | P1–P4: lo que no es núcleo va en módulos, cada módulo está documentado, el código está comentado y todo cambio es trazable. |

## Etapa 7 — Restricciones y riesgos (CERRADA · 2026-11-17)

| # | Riesgo | Resolución |
|---|---|---|
| R1 | Derechos del material (apuntes y libros) | **Aceptado por Iñaki.** Repositorio privado, de uso personal con compañeros, sin restricciones por tipo de material. |
| R2 | Se acaba el espacio gratuito | RNF8 (pasar a pago sin migrar) + RF12 (indicador de espacio usado). |
| R3 | Pérdida de material (no hay papelera) | Confirmación al borrar (RF10). **El respaldo es responsabilidad de Iñaki, fuera de la app.** Recomendado: bajar el contenido completo al cerrar cada cuatrimestre. |
| R4 | El servicio cambia sus condiciones o cierra | Los archivos se pueden exportar completos. |
| R5 | Mantenimiento a largo plazo | RNF10 + alcance chico (D22). |
| R6 | Un lector comparte su usuario | **Aceptado.** Se puede dar de baja la cuenta (RF2). |
| R7 | El orden depende de la convención de nombres | **Aceptado.** Mantener D10–D13. |
| R8 | Pausa de Supabase Free tras 7 días sin actividad | Ping automático semanal (AT6). |
| R9 | Vercel Hobby es solo para uso no comercial | Mientras no se cobre, se mantiene. Si se cobra (M2), pasar a Vercel Pro. |

| # | Decisión |
|---|---|
| D26 | **La app no sabe de dónde vienen los archivos.** Recibe archivos, igual que un Drive. |
| D27 | **El respaldo queda fuera de la app**, a cargo de Iñaki. |

## Etapa 8 — Criterios de éxito (CERRADA · 2026-11-17)

| # | Criterio de éxito |
|---|---|
| C1 | **Migración completa:** todo el material de 1º año (~2 GB) está cargado siguiendo la convención D10–D13. |
| C2 | **Chau pendrive:** un cuatrimestre entero estudiando sin necesitarlo. |
| C3 | **Desde una compu ajena:** iniciar sesión y descargar un archivo de cualquier materia en menos de 1 minuto. |
| C4 | **Búsqueda:** con 2 o 3 palabras clave, sin el nombre exacto, el archivo aparece entre los primeros 5 resultados. |
| C5 | **Celular primero:** todo lo del lector se hace desde el celular sin zoom. |
| C6 | **Rápida:** se cumple RNF4 (menos de 2 segundos). |
| C7 | **Costo cero:** el primer año cuesta $0. |
| C8 | **Mantenimiento liviano:** preparar una materia nueva lleva menos de 5 minutos. |

| # | Decisión |
|---|---|
| D28 | **En una frase:** repositorio de archivos ordenados al estilo Drive, privado y multidispositivo. **Sin lógica académica ni de negocio.** |

## Módulos futuros

| # | Módulo |
|---|---|
| M1 | **Calendario académico.** Cada usuario arma su calendario (eventos con fecha, materia, tipo, estado y nota), similar al de Notion. Vista de mes completo, eventos pasados atenuados y nota cargable sobre el evento. El estado podría pasar solo a "rendido" cuando vence la fecha. No entra en la v1 ni es prioridad. Al activarlo: reabrir etapas 2, 4 y 5 (contradice D15, D16 y D28). Campos del Notion actual: Evento, Fecha, Materia, Tipo (Parcial · Entrega · Recuperatorio · Evaluación de seguimiento), Estado (Próximo · Rendido · Desaprobado), Notas/Resultado. |
| M2 | **Varias carreras y suscripción.** El cobro se hace manualmente por fuera de la app; dentro de la app solo se da de alta o de baja al usuario (ya cubierto por RF2). Cada carrera es una carpeta raíz. Sigue siendo privado y de acceso restringido. |

---

# Fase de diseño

## Etapas 1–4 — Pantallas, identidad, wireframes y maqueta (CERRADAS · 2026-11-17)

| # | Decisión |
|---|---|
| DS1 | **Pantallas de la v1:** Login · Home de carreras · Carpeta · Búsqueda · Panel admin, más ventanas emergentes (acciones de archivo, confirmación de borrado, alerta de 50 MB, peso del .zip). |
| DS2 | **El admin usa las mismas pantallas que el lector, con botones extra.** No hay modo edición. |
| DS3 | El nombre final es **"Banco de Apuntes"**. |
| DS4 | **Al entrar se ve la home de carreras**, que es la raíz del banco con una carpeta por carrera (en la v1, solo ISI). La home con calendario (M1) queda como referencia futura. |
| DS5 | **Identidad visual: variante A "Sobrio".** Azules oscuros (#0A1426–#0F1C36), dorado en degradé (#F0D394 → #C99A4B) solo en acentos (íconos de carpeta, ruta, botón principal), tipografía Manrope, lista estilo Drive, botones de admin fijos al pie. |
| DS6 | **Escritorio:** barra lateral con el árbol de carpetas y contenido en tabla. |

## Etapa 5 — Arquitectura técnica (CERRADA · 2026-11-17)

| # | Decisión |
|---|---|
| AT1 | **Hosting: Vercel (Hobby).** Sirve el frontend estático y funciones chicas en `/api`. |
| AT2 | **Login y base de datos: Supabase (Free).** Auth con **email y contraseña reales**, sin registro abierto: las cuentas las crea el admin desde la app. Postgres guarda solo el árbol (metadatos), no los archivos. |
| AT3 | **Archivos: Cloudflare R2.** Bucket privado; 10 GB gratis por mes (no vence), sin costo de egreso y después ~$0.015/GB-mes, sin migrar nada. Se descartó Supabase Storage Free (1 GB, máximo 50 MB por archivo, 5 GB de egreso por mes). |
| AT4 | **Frontend: HTML + CSS + JS sin framework y sin compilación**, con módulos nativos de JS. Estructura: `css/`, `js/core`, `js/modulos/{auth, explorador, archivos, busqueda, admin}`, `js/ui`, `api/`, `docs/`. |
| AT5 | **Datos:** tabla `items` (árbol genérico de carpetas y archivos: id, padre, nombre, tipo, tamaño, clave en R2, fecha) + tabla `perfiles` (rol admin o lector). Seguridad a nivel de base: con sesión se lee, solo el admin escribe. La búsqueda aproximada y el espacio usado se resuelven en la base. |
| AT6 | **Subida y descarga con links firmados de corta duración**, generados en `/api` previa verificación de la sesión y el rol. Los archivos viajan directo entre el dispositivo y R2. **Ping semanal automático** (tarea programada de Vercel) para que Supabase no se pause. |
| AT7 | **El .zip se arma en el dispositivo, con tope de 500 MB.** Si una carpeta pesa más, la app avisa y sugiere bajar sus subcarpetas por separado. |
| AT8 | **Trazabilidad (P4):** el código vive en un repositorio git, con commits descriptivos, documentación por módulo en `docs/` y este registro de decisiones actualizado ante cada cambio. |
| AT9 | **Regiones (2026-11-17, al crear la infraestructura):** Supabase en **us-west-2 (Oregón)**, porque São Paulo no estaba disponible. R2 en **ENAM** (Este de Norteamérica, lo más cerca de Argentina; los archivos viajan directo entre el dispositivo y R2). Funciones de Vercel en **`pdx1`** (Portland), junto a Supabase, para reducir la latencia de `/api`; se configura en el prompt 11. El CORS de R2 permite `http://localhost:3000` (GET y PUT); el dominio de Vercel se agrega en el prompt 11. RNF4 se valida en la puesta en marcha. |

## Etapa 6 — Prompts para Claude Code (EN CURSO)

| # | Decisión |
|---|---|
| PC1 | **Preparación de infraestructura completa (2026-11-17):** repo privado en GitHub, Supabase Free, bucket R2 con token Object Read & Write y CORS, cuenta de Vercel Hobby conectada a GitHub. Detalle en `claude/prompts-claude-code.md`. |
