# SimFútbol — Simulador de Partidos (Evaluación 1)

Proyecto académico que cumple con los requisitos de HTML, CSS y JavaScript para la evaluación:

- Estructura semántica con HTML5 (nav, main, section, footer).
- Navegación con hipervínculos, botones e imágenes (puedes agregar el escudo de tu equipo en /assets).
- Formulario de configuración con validaciones y mensajes personalizados.
- Simulación simple con registro de eventos y almacenamiento local.
- Hoja de estilos externa y diseño responsive.
- 3 páginas HTML mínimas: index, simulate, stats.

## Uso
1. Abre `index.html` en un navegador moderno.
2. Ve a **Simular** para configurar un partido y generar el resultado.
3. Guarda y consulta el historial en **Resultados**.

## Estructura
```
futbol-sim/
├─ index.html
├─ simulate.html
├─ stats.html
├─ style.css
├─ app.js
└─ assets/
```

## Validaciones incluidas
- Nombres de equipos: requeridos, 2–30 caracteres, solo letras/espacios/guiones.
- Ratings: números 1–100.
- Duración: 30–120 minutos.
- Sugerencias dinámicas (p.ej., equipos con el mismo nombre).

## Ideas de mejora
- Ajuste fino del motor de simulación.
- Configurar estadio/árbitro.
- Exportar resultados a CSV/JSON.
- Panel de métricas (posesión, tiros, xG aproximado).
