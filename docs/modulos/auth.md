# Módulo `auth`

**Ubicación:** `js/modulos/auth/` · **Prompt de implementación:** 2 · **Estado:** esqueleto.

## Qué hace
Inicia y cierra sesión con email y contraseña (RF1), mantiene la sesión activa, la cierra
sola después de un tiempo sin uso con "Recordarme" opcional (RNF6) e informa el rol del
usuario (admin o lector, D14) al resto de la app. No hay registro abierto (D5).

## Qué expone
- `nombreModulo` (esqueleto).
- Previsto: iniciar sesión, cerrar sesión, obtener la sesión y el rol actuales, avisar cambios
  de sesión, pantalla de login (DS1).

## De qué depende
- `js/core/supabase.js` (Supabase Auth) y `js/core/config.js`.
- Tabla `perfiles` para el rol (AT5).

## Decisiones relacionadas
D5, D14, RF1, RNF5, RNF6, AT2.
