# /api — Funciones de servidor (Vercel)

Esta carpeta contiene las **funciones serverless** que Vercel publica bajo `/api/*` (AT1).
Es el **único lugar** donde existen los secretos: la service role key de Supabase y las
claves de Cloudflare R2. El navegador nunca los ve.

## Qué va acá
- **Links firmados de R2** (AT6): generar URLs de subida (PUT) y de descarga (GET) de corta
  duración, después de verificar la sesión del usuario y su rol (subir: solo admin).
  Los archivos viajan directo entre el dispositivo y R2, no pasan por estas funciones.
- **Administración de cuentas** (RF2, AT2): crear y dar de baja lectores con la API de
  administración de Supabase (requiere service role key).
- **Ping semanal** (AT6, R8): tarea programada de Vercel que consulta Supabase para que el
  proyecto Free no se pause por inactividad.

## Reglas
- Cada función valida el token de sesión de Supabase antes de hacer cualquier cosa.
- Las dependencias de estas funciones se declaran en el `package.json` de la raíz, que existe
  **solo** para `/api` (el frontend no usa npm). Toda dependencia nueva se justifica en
  `docs/PROGRESO.md`.
- Los valores de las variables salen de `process.env` (ver `.env.example`), nunca del código.

Estado: vacío (prompt 0). Las primeras funciones llegan en los prompts 6 y 9.
