import type { LandingCopy } from './es';

const en: LandingCopy = {
  meta: {
    title: 'OpenJiuJitsu: your BJJ companion',
    description:
      'Technique library, training planner, journal and sparring timer for BJJ. Free, no account, and everything stays on your device.',
  },
  header: { navLabel: 'Main', features: 'Features', faq: 'FAQ', github: 'GitHub', language: 'Language' },
  hero: {
    eyebrow: 'Your BJJ companion · GI and NoGI',
    titleLead: 'Train. Log.',
    titleAccent: 'Improve.',
    lead: 'A technique library, training plans, a journal and a sparring timer with IBJJF scoring, in an app that keeps everything on your device.',
    openApp: 'Open the app',
    seeMore: 'See what is inside',
    guarantees: [
      { title: 'No account', text: 'Open it and start.' },
      { title: 'Offline', text: 'Install it as an app.' },
      { title: 'Your data', text: 'Export it as JSON.' },
    ],
    license: 'Free and open source (AGPL-3.0)',
    languages: 'Español · English',
  },
  phone: { date: 'Nov 3' },
  features: {
    eyebrow: 'What is inside',
    title: 'Everything that happens on the mat, in one app.',
    intro:
      'Seven areas built around how people really train: learn techniques, plan the class, log every session, roll with a scoreboard and measure your progress.',
    library: {
      title: '{{count}} techniques ready from day one.',
      text: 'Submissions, escapes, guards, sweeps, passes and takedowns, in Spanish and English. Every technique has steps, a video or image and its linked counterpart.',
      bullets: ['Add your own techniques and details', 'Global GI / NoGI filter', 'Position map to see how they connect'],
      steps: '{{count}} steps',
      counterpart: 'Counterpart:',
    },
    legality: {
      kicker: 'Legality by belt',
      title: 'Know what you can use before you compete.',
      text: 'Every submission shows the minimum belt allowed in GI and in NoGI, following the IBJJF v6.1 (2024) rules for adults.',
      bullets: ['Always check the rules of your event: every organization has its own'],
    },
    plans: {
      title: 'Build the class in timed blocks.',
      text: 'Drag techniques from your library into each block and set the goals of the day. When you log the session, pick the plan you followed.',
      rounds: '{{rounds}} rounds of {{minutes}} min',
    },
    journal: {
      title: 'Write down the details the coach said only once.',
      text: 'Date, duration, plan followed, physical and technical difficulty from 1 to 10, feelings, submissions achieved and suffered, and free notes.',
      notes: 'On the triangle, angle your body before squeezing the knees.',
    },
    sparring: {
      title: 'Timer, points and result of your rolls.',
      text: 'Rounds and rest with the length of each belt, IBJJF points, advantages, penalties and undo. If it ends by submission, it goes straight to your journal.',
      you: 'You',
      rival: 'Rival',
      summary: '{{advantages}} {{a}} · {{penalties}} {{p}}',
    },
    progress: {
      kicker: 'Your progress',
      title: 'See how your game evolves.',
      text: 'Everything is computed from what you log in the journal and in sparring. The more you train, the more accurate it gets.',
      strong: 'Strength',
      weak: 'To work on',
      radarLabel: 'Seven-axis radar chart; the highest is {{axis}}',
      timeline: { white: 'Mar 2023', blue: 'Sep 2025', today: 'today' },
      injuryNote: 'pain when bending, avoid knee locks',
    },
  },
  faq: {
    eyebrow: 'FAQ',
    title: 'Your data, on your device.',
    items: [
      {
        question: 'Where is my data stored?',
        answer:
          'In your device browser (IndexedDB). There is no server and no telemetry: nobody else sees it. If you clear the site data it is gone, so export a copy from Settings.',
      },
      { question: 'Do I need an account?', answer: 'No. Open the app and start using the library and logging sessions.' },
      {
        question: 'Does it work offline?',
        answer: 'Yes. It is a PWA: install it from the browser and it works without a connection at the gym.',
      },
      {
        question: 'Can I move my data to another device?',
        answer: 'Yes. Export everything to a JSON file and import it on the other device. Invalid files are rejected before anything is written.',
      },
    ],
  },
  closing: {
    eyebrow: 'Free · No account · Offline',
    title: 'Your next class, already planned.',
    text: 'Open the app and start with {{count}} techniques ready. In three steps your first session is in the journal.',
    openApp: 'Open OpenJiuJitsu',
    code: 'See the code',
    stepsLabel: 'How to start',
    steps: [
      { title: 'Pick your belt', text: 'In {{profile}}: current belt and stripes.' },
      { title: 'Build your first plan', text: 'Blocks of drills, passes and rolling.' },
      { title: 'Log the session', text: 'Difficulty, submissions and the golden details.' },
    ],
  },
  footer: { navLabel: 'Footer', license: 'AGPL-3.0 · Español · English' },
};

export default en;
