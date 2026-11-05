export interface LandingCopy {
  meta: { title: string; description: string };
  header: { navLabel: string; features: string; faq: string; github: string; language: string };
  hero: {
    eyebrow: string;
    titleLead: string;
    titleAccent: string;
    lead: string;
    openApp: string;
    seeMore: string;
    guarantees: { title: string; text: string }[];
    license: string;
    languages: string;
  };
  phone: { date: string };
  features: {
    eyebrow: string;
    title: string;
    intro: string;
    library: { title: string; text: string; bullets: string[]; steps: string; counterpart: string };
    legality: { kicker: string; title: string; text: string; bullets: string[] };
    plans: { title: string; text: string; rounds: string };
    journal: { title: string; text: string; notes: string };
    sparring: { title: string; text: string; you: string; rival: string; summary: string };
    progress: {
      kicker: string;
      title: string;
      text: string;
      strong: string;
      weak: string;
      radarLabel: string;
      timeline: { white: string; blue: string; today: string };
      injuryNote: string;
    };
  };
  faq: { eyebrow: string; title: string; items: { question: string; answer: string }[] };
  closing: {
    eyebrow: string;
    title: string;
    text: string;
    openApp: string;
    code: string;
    stepsLabel: string;
    steps: { title: string; text: string }[];
  };
  footer: { navLabel: string; license: string };
}

const es: LandingCopy = {
  meta: {
    title: 'OpenJiuJitsu: tu compañero de BJJ',
    description:
      'Biblioteca de técnicas, planes de entrenamiento, bitácora y cronómetro de sparring para BJJ. Gratis, sin cuenta, y todo se guarda en tu dispositivo.',
  },
  header: { navLabel: 'Principal', features: 'Funciones', faq: 'Preguntas', github: 'GitHub', language: 'Idioma' },
  hero: {
    eyebrow: 'Tu compañero de BJJ · GI y NoGI',
    titleLead: 'Entrena. Anota.',
    titleAccent: 'Mejora.',
    lead: 'Biblioteca de técnicas, planes de entrenamiento, bitácora y cronómetro de sparring con puntuación IBJJF, en una app que guarda todo en tu dispositivo.',
    openApp: 'Abrir la app',
    seeMore: 'Ver qué incluye',
    guarantees: [
      { title: 'Sin cuenta', text: 'Abres y empiezas.' },
      { title: 'Sin conexión', text: 'Instálala como app.' },
      { title: 'Tus datos', text: 'Expórtalos en JSON.' },
    ],
    license: 'Gratis y open source (AGPL-3.0)',
    languages: 'Español · English',
  },
  phone: { date: '3 nov' },
  features: {
    eyebrow: 'Qué incluye',
    title: 'Todo lo que pasa en el tatami, en una sola app.',
    intro:
      'Siete áreas pensadas para cómo se entrena de verdad: aprender técnicas, planificar la clase, registrar cada sesión, rolar con marcador y medir tu progreso.',
    library: {
      title: '{{count}} técnicas listas desde el primer día.',
      text: 'Sumisiones, escapes, guardias, raspajes, pasajes y derribos, en español e inglés. Cada técnica tiene pasos, video o imagen y su contraparte enlazada.',
      bullets: ['Agrega tus propias técnicas y detalles', 'Filtro global GI / NoGI', 'Mapa de posiciones para ver cómo se conectan'],
      steps: '{{count}} pasos',
      counterpart: 'Contraparte:',
    },
    legality: {
      kicker: 'Legalidad por cinturón',
      title: 'Sabe qué puedes aplicar antes de competir.',
      text: 'Cada sumisión muestra el cinturón mínimo permitido en GI y en NoGI, según el reglamento IBJJF v6.1 (2024) para adultos.',
      bullets: ['Revisa siempre el reglamento de tu evento: cada organización tiene sus reglas'],
    },
    plans: {
      title: 'Arma la clase en bloques con tiempo.',
      text: 'Arrastra técnicas de tu biblioteca a cada bloque y define los objetivos del día. Al registrar la sesión, eliges el plan que seguiste.',
      rounds: '{{rounds}} rounds de {{minutes}} min',
    },
    journal: {
      title: 'Anota los detalles que el profe dijo una sola vez.',
      text: 'Fecha, duración, plan seguido, dificultad física y técnica del 1 al 10, sensaciones, sumisiones logradas y sufridas, y notas libres.',
      notes: 'En el triángulo, angular el cuerpo antes de apretar las rodillas.',
    },
    sparring: {
      title: 'Cronómetro, puntos y resultado de tus roladas.',
      text: 'Rounds y descanso con la duración de cada cinturón, puntos IBJJF, ventajas, faltas y deshacer. Si termina por sumisión, pasa directo a tu bitácora.',
      you: 'Tú',
      rival: 'Rival',
      summary: '{{advantages}} {{a}} · {{penalties}} {{p}}',
    },
    progress: {
      kicker: 'Tu progreso',
      title: 'Mira cómo evoluciona tu juego.',
      text: 'Todo se calcula con lo que registras en la bitácora y en el sparring. Cuanto más entrenas, más preciso es.',
      strong: 'Punto fuerte',
      weak: 'Para trabajar',
      radarLabel: 'Gráfico radar de siete ejes; el más alto es {{axis}}',
      timeline: { white: 'mar 2023', blue: 'sep 2025', today: 'hoy' },
      injuryNote: 'dolor al flexionar, evitar llaves de rodilla',
    },
  },
  faq: {
    eyebrow: 'Preguntas',
    title: 'Tus datos, en tu dispositivo.',
    items: [
      {
        question: '¿Dónde se guardan mis datos?',
        answer:
          'En el navegador de tu dispositivo (IndexedDB). No hay servidor ni telemetría: nadie más los ve. Si borras los datos del sitio, se pierden, así que exporta una copia desde Ajustes.',
      },
      { question: '¿Necesito crear una cuenta?', answer: 'No. Abres la app y empiezas a usar la biblioteca y a registrar sesiones.' },
      {
        question: '¿Funciona sin internet?',
        answer: 'Sí. Es una PWA: instálala desde el navegador y funciona sin conexión en la academia.',
      },
      {
        question: '¿Puedo pasar mis datos a otro dispositivo?',
        answer:
          'Sí. Exporta todo en un archivo JSON e impórtalo en el otro dispositivo. Los archivos inválidos se rechazan antes de escribir nada.',
      },
    ],
  },
  closing: {
    eyebrow: 'Gratis · Sin cuenta · Sin conexión',
    title: 'Tu próxima clase, ya con plan.',
    text: 'Abre la app y empieza con {{count}} técnicas listas. En tres pasos tienes tu primera sesión en la bitácora.',
    openApp: 'Abrir OpenJiuJitsu',
    code: 'Ver el código',
    stepsLabel: 'Cómo empezar',
    steps: [
      { title: 'Elige tu cinturón', text: 'En {{profile}}: cinturón actual y grados.' },
      { title: 'Arma tu primer plan', text: 'Bloques de drills, pasajes y rolling.' },
      { title: 'Registra la sesión', text: 'Dificultad, sumisiones y los detalles de oro.' },
    ],
  },
  footer: { navLabel: 'Pie de página', license: 'AGPL-3.0 · Español · English' },
};

export default es;
