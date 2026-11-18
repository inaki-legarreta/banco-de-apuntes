# js/ui — Componentes de interfaz compartidos

Acá van las piezas de UI reutilizables entre módulos (botones, listas, ventanas emergentes,
barra de ruta, avisos). Existen para no duplicar markup ni comportamiento en cada módulo.

Reglas:
- La UI **no habla con Supabase ni con R2**: recibe datos ya resueltos por los servicios de
  cada módulo y emite eventos.
- Cada archivo empieza con su bloque de comentario (P3) y usa los tokens de `css/tokens.css`.

Estado: vacío (prompt 0). Los primeros componentes llegan en el prompt 3.
