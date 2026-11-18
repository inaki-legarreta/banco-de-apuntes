# Módulo `auth`

**Ubicación:** `js/modulos/auth/` · **Prompt de implementación:** 2 (hoja "Cuenta": 3) · **Estado:** implementado.

## Qué hace
Inicia y cierra sesión con email y contraseña (RF1), mantiene la sesión activa, la cierra
sola después de un tiempo sin uso salvo con "Recordarme" (RNF6, LS3) e informa el rol del
usuario (admin o lector, D14) al resto de la app. Desde el prompt 3 también tiene la hoja
"Cuenta" (EP1), que se abre con el botón de persona del encabezado. No hay registro abierto (D5, BD4) ni
"Olvidé mi contraseña" (LS4): si alguien la olvida, el admin le pone una nueva (prompt 9).

## Archivos

| Archivo | Responsabilidad |
|---|---|
| `index.js` | Punto de entrada público: reexporta lo que el resto de la app puede usar. |
| `servicio.js` | Lo único del módulo que habla con Supabase: login, logout, sesión, perfil, cambios de sesión, avisos de cierre. |
| `inactividad.js` | Cuenta el tiempo sin uso y avisa cuando se vence. No sabe nada de Supabase. |
| `pantalla-login.js` | Pantalla de login (UI). Solo llama al servicio. |
| `hoja-cuenta.js` | Hoja "Cuenta" (EP1): email, rol, "Panel admin" (solo admin) y "Cerrar sesión". Solo llama al servicio y a `js/ui/`. |

## Qué expone (`index.js`)

| Export | Para qué |
|---|---|
| `iniciarSesion(email, contrasena, recordarme)` | Inicia sesión. Si falla lanza `ErrorAuth` con el mensaje en español. |
| `cerrarSesion(motivo)` | Cierra la sesión de **este dispositivo** (`scope: 'local'`). `motivo`: `'usuario'` (sin aviso) o `'inactividad'` (el login muestra "Tu sesión se cerró por inactividad."). |
| `obtenerSesion()` | Sesión actual de supabase-js o `null`. |
| `obtenerPerfil()` | `{ id, email, rol }` leyendo la fila propia de `perfiles`, o `null` sin sesión. Queda en caché mientras dure la sesión de ese usuario (un error no se guarda). |
| `esAdmin()` | `true` si el rol es admin; `false` sin sesión o si no se pudo leer el rol. La usa la guardia de rutas `soloAdmin` del router. |
| `alCambiarSesion(callback)` | Avisa `{ evento, sesion }` en cada cambio de sesión. Devuelve la función para dejar de escuchar. |
| `restaurarSesion()` | La usa el router al arrancar: devuelve la sesión guardada, salvo que se haya vencido por inactividad (en ese caso la cierra y devuelve `null`). |
| `ErrorAuth` | Clase de error con mensaje ya traducido, listo para mostrar. |
| `montarPantallaLogin(contenedor)` | Monta el login (ruta `#/login`). |
| `abrirHojaCuenta()` | Abre la hoja "Cuenta". La llama el botón de persona de la estructura de pantalla (el router la conecta). |
| `nombreModulo` | `'auth'`. |

### Mensajes de error
| Caso | Mensaje |
|---|---|
| Credenciales inválidas (y cualquier otro rechazo 400: email sin confirmar, cuenta bloqueada) | "El email o la contraseña no son correctos." |
| Demasiados intentos (429) | "Hubo demasiados intentos. Esperá unos minutos y volvé a probar." |
| Sin conexión | "No hay conexión a internet. Revisá tu conexión y volvé a intentar." |
| Cualquier otro | "No se pudo completar la operación. Probá de nuevo en un rato." |

Todos los rechazos de credenciales dan el mismo texto para **no revelar si un email existe**.

## De qué depende
- `js/core/supabase.js`: cliente único, preferencia "Recordarme" y limpieza de la sesión.
- `js/core/config.js`: `MINUTOS_INACTIVIDAD`.
- Tabla `perfiles` (AT5): la política "cada usuario lee el suyo" permite leer el rol.
- `js/ui/` (`hoja.js`, `aviso.js`, `iconos.js`): la hoja "Cuenta" y el ícono del login.

## Hoja "Cuenta" (EP1)
- Se abre, para todos, con el botón de persona del encabezado.
- Encabezado con el **email** y el **rol** ("Administrador" o "Lector").
- **"Panel admin"** (solo admin): lleva a `#/admin`, que por ahora muestra "Panel admin —
  llega en el prompt 9" (`js/modulos/admin/pantalla-provisional.js`).
- **"Cerrar sesión"** (estilo peligro): cierra la sesión **de este dispositivo** (LS5) y el
  router vuelve al login. Sale del Panel admin de la maqueta y pasa a esta hoja (EP1).
- Si no se puede leer el perfil, en lugar de la hoja se muestra un aviso de error.
- Ocultar "Panel admin" a un lector es solo comodidad: la protección real es RLS, y además
  el router manda a un lector que entra a `#/admin` (o `#/muestrario`) a `#/`.

## Cómo funciona "Recordarme" (LS3)
- La preferencia se guarda en `localStorage` con la clave `banco-apuntes:recordarme`,
  **antes** de iniciar sesión, para que la sesión nueva quede en el lugar correcto.
- `js/core/supabase.js` le pasa a supabase-js un adaptador de almacenamiento: si
  "Recordarme" está activo lee y escribe la sesión (`banco-apuntes:sesion`) en
  `localStorage`; si no, en `sessionStorage`. Al borrar, limpia los dos.
- **Sin "Recordarme":** la sesión vive en `sessionStorage`, así que desaparece al cerrar la
  pestaña o el navegador. Abrir la app en otra pestaña pide login de nuevo (LS6). Además se
  cierra por inactividad.
- **Con "Recordarme":** la sesión vive en `localStorage`, sobrevive al cierre del navegador,
  vale en todas las pestañas y no se cierra por inactividad. Dura hasta "Cerrar sesión".
- Al cerrar sesión la preferencia vuelve a "desactivado", y la casilla arranca siempre
  desmarcada.

**Limitación conocida:** si el navegador tiene activada la opción de restaurar la sesión
anterior al abrir ("Continuar donde lo dejaste" en Chrome/Edge), el navegador restaura
también `sessionStorage` y la sesión sin "Recordarme" puede seguir abierta al reabrirlo.
Igual la protege el cierre por inactividad: pasados los 30 minutos, se cierra al abrir.

## Cómo funciona la inactividad (RNF6)
Solo con "Recordarme" desactivado.
- Cuentan como actividad: toques y clics, teclas, scroll y rueda, y volver a la pestaña.
- La última actividad se guarda en `sessionStorage` (`banco-apuntes:ultima-actividad`), con
  un registro cada 15 segundos como mucho (throttling), así el tiempo sigue contando entre
  recargas.
- Se revisa cada minuto, al volver a la pestaña o al foco, y al arrancar la app (antes de
  mostrar nada). Al volver a la pestaña primero se revisa y después se cuenta como
  actividad: si estuvo más de 30 minutos afuera, se cierra.
- Pasados `MINUTOS_INACTIVIDAD` (30) se cierra la sesión y el login muestra "Tu sesión se
  cerró por inactividad.".

## Cambios de sesión por fuera
Si la sesión se cierra en otra pestaña o supabase-js no puede renovar el token, el servicio
lo detecta (re-leyendo la sesión guardada en cada evento) y el router vuelve al login con el
aviso "Tu sesión se cerró. Ingresá de nuevo para seguir.".

## Cómo probarlo
1. Completar `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` en `js/core/config.js`.
2. `npx serve` y abrir `http://localhost:3000`.
3. Sin sesión, ir a `#/` o `#/cualquier-cosa`: tiene que llevar a `#/login`.
4. Probar un email o una contraseña incorrectos: "El email o la contraseña no son correctos.".
5. Entrar con los datos correctos: se ve el inicio ("Carreras"). El botón de persona abre
   la hoja "Cuenta" con el email y el rol.
6. Recargar: la sesión sigue.
7. Sin "Recordarme": cerrar todas las ventanas y volver a abrir → pide login. Con
   `MINUTOS_INACTIVIDAD = 1`, sin tocar nada, la sesión se cierra entre 1 y 2 minutos
   después (la revisión es cada minuto) con el aviso de inactividad.
8. Con "Recordarme": cerrar y reabrir el navegador → la sesión sigue y no se cierra sola.
9. "Cerrar sesión" (hoja "Cuenta") → login; el botón Atrás no muestra la pantalla privada.
10. Como admin, la hoja muestra "Panel admin", que lleva al cuerpo provisional. Como lector
    (cuenta creada a mano en Supabase → Authentication → Users → Add user, con "Auto
    Confirm User"), no lo muestra, y `#/admin` y `#/muestrario` llevan a `#/`.

## Decisiones relacionadas
D5, D14, RF1, RNF5, RNF6, AT2, BD4, LS1–LS6, EP1.
