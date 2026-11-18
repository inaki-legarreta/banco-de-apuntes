# Módulo `archivos`

**Ubicación:** `js/modulos/archivos/` · **Prompts de implementación:** 6 (R2) y 7 (.zip) ·
**Estado:** esqueleto.

## Qué hace
Sube varios archivos a una carpeta elegida (RF7, D24), con alerta si alguno pesa más de
50 MB (RNF9). Descarga archivos (RF4) con links firmados de corta duración (AT6). Renombra,
mueve y borra archivos (RF8, RF10). Descarga una carpeta completa como .zip armado en el
dispositivo, mostrando el peso antes y con tope de 500 MB (RF11, AT7).

## Qué expone
- `nombreModulo` (esqueleto).
- Previsto: subir archivos, descargar archivo, descargar carpeta como .zip, acciones de
  archivo (renombrar, mover, borrar).

## De qué depende
- `/api` (links firmados de subida y descarga; validan sesión y rol).
- `js/core/supabase.js` (registrar y modificar items en la tabla `items`).
- `auth` (token de sesión y rol).
- Cloudflare R2 (solo a través de URLs firmadas; nunca con claves en el navegador).

## Decisiones relacionadas
D20, D24, RF4, RF7, RF8, RF10, RF11, RNF5, RNF9, AT3, AT6, AT7.
