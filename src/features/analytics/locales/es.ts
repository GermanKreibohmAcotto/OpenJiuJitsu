export default {
  title: 'Analíticas de rendimiento',
  subtitle: 'Tu estilo de juego en seis ejes, calculado con tus combates y tu bitácora.',
  dominant: 'Tu eje más fuerte',
  empty: 'Todavía no hay datos suficientes. Registrá combates y sesiones para ver tu perfil.',
  chart: 'Gráfico hexagonal de estilo de juego',
  breakdown: 'Detalle por eje',
  noData: 'Sin datos',
  axes: {
    pressure: {
      name: 'Presión / Pasaje',
      basis: 'Puntos por combate de pasajes, rodilla en el abdomen y montada (registro de combates).',
    },
    wrestling: {
      name: 'Lucha / Ritmo',
      basis: 'Puntos por combate de derribos, derribos logrados por round (bitácora) y rounds por sesión como medida de cardio.',
    },
    submission: {
      name: 'Sumisión',
      basis: 'Sumisiones logradas por round de sparring (bitácora).',
    },
    defense: {
      name: 'Control / Defensa',
      basis: 'Pocas sumisiones recibidas por round y pocos puntos concedidos por combate.',
    },
    consistency: {
      name: 'Constancia',
      basis: 'Sesiones por semana en las últimas 8 semanas (bitácora). 4 por semana es el máximo.',
    },
    transitions: {
      name: 'Inversiones / Transiciones',
      basis: 'Puntos por combate de raspajes y tomas de espalda (registro de combates).',
    },
    flexibility: {
      name: 'Flexibilidad / Guardia',
      basis: 'Autoevaluación: no hay datos registrados que lo midan.',
    },
  },
  rating: {
    label: 'Tu autoevaluación de flexibilidad y guardia',
    help: 'Del 1 al 10. Es el único eje que puntuás vos.',
    unset: 'Sin puntuar',
  },
} as const;
