# Módulo `admin`

**Ubicación:** `js/modulos/admin/` · **Prompt de implementación:** 9 · **Estado:** cuerpo provisional de `#/admin` (prompt 3).

## Qué hace
Panel del admin (DS1): crea y da de baja cuentas de lectores (RF2, D5) y muestra el espacio
usado del banco (RF12, R2). Solo accesible con rol admin (D14). La gestión de carpetas y
archivos no vive acá: está en las mismas pantallas del lector con botones extra (DS2).

## Qué expone
- `nombreModulo`.
- `montarPanelProvisional(contenido)` — **provisional hasta el prompt 9**: cuerpo de
  `#/admin` con "Panel admin — llega en el prompt 9". Se llega desde "Panel admin" de la
  hoja "Cuenta" (EP1). La ruta es `soloAdmin`: un lector va a `#/`.
- "Cerrar sesión" ya no vive en el Panel admin: está en la hoja "Cuenta" del módulo `auth`
  (EP1).
- Previsto: pantalla de panel admin, servicios de alta y baja de lectores, servicio de
  espacio usado.

## De qué depende
- `/api` (alta y baja de cuentas con la service role key).
- `js/core/supabase.js` (espacio usado, calculado en la base, AT5).
- `auth` (verificar rol admin).

## Decisiones relacionadas
D5, D14, RF2, RF12, DS1, DS2, AT2, AT5, EP1.
