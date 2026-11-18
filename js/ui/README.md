# js/ui — Componentes de interfaz compartidos

Acá van las piezas de UI reutilizables entre módulos (estructura de pantalla, íconos, ruta,
título, lista, tarjeta, hoja inferior, diálogo, estados y avisos). Existen para no duplicar
markup ni comportamiento en cada módulo.

Reglas:
- La UI **no habla con Supabase ni con R2**: recibe datos ya resueltos por los servicios de
  cada módulo y devuelve elementos del DOM o promesas con la respuesta del usuario.
- Los textos que vienen de datos van con `textContent`; `innerHTML` solo en `iconos.js`,
  con SVG fijos.
- Cada archivo empieza con su bloque de comentario (P3) y usa los tokens de `css/tokens.css`.

Documentación de cada componente: [`docs/ui.md`](../../docs/ui.md).
