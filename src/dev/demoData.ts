import { db } from '../db/db';
import { todayIso } from '../db/ids';
import type {
  Graduation,
  Injury,
  PlanBlock,
  MatchEvent,
  SparringMatch,
  TrainingPlan,
  TrainingSession,
} from '../domain/types';

/** Local date `daysAgo` days before today, as yyyy-mm-dd. */
function dayOffset(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return todayIso(d);
}

const stamp = (date: string) => `${date}T19:00:00.000Z`;

const block = (id: string, kind: PlanBlock['kind'], title: string, minutes: number, techniqueIds: string[] = [], notes?: string): PlanBlock =>
  ({ id, kind, title, minutes, techniqueIds, notes });

function buildPlans(): TrainingPlan[] {
  return [
    {
      id: 'demo-plan-closed-guard',
      name: 'Closed guard attacks',
      mode: 'gi',
      date: dayOffset(-2),
      objectives: ['Hit the triangle setup cleanly', 'Chain armbar to triangle', 'Stay relaxed in the guard'],
      blocks: [
        block('demo-b1', 'warmup', 'Mobility and shrimps', 10, ['hip-escape-drill', 'bridge-drill']),
        block('demo-b2', 'technique', 'Triangle and armbar chain', 25, ['triangle-closed-guard', 'armbar-closed-guard'], 'Focus on angle before squeezing.'),
        block('demo-b3', 'drill', 'Flow drilling', 15, ['kimura-closed-guard']),
        block('demo-b4', 'sparring', 'Positional sparring from closed guard', 20),
      ],
      createdAt: stamp(dayOffset(5)),
      updatedAt: stamp(dayOffset(5)),
    },
    {
      id: 'demo-plan-passing',
      name: 'Passing fundamentals',
      mode: 'nogi',
      objectives: ['Pressure passing', 'Keep chest heavy'],
      blocks: [
        block('demo-b5', 'warmup', 'Solo drills', 10, ['guard-retention-drill']),
        block('demo-b6', 'technique', 'Knee slice and over-under', 30, ['knee-slice', 'over-under-pass']),
        block('demo-b7', 'sparring', 'Open mat rounds', 25),
      ],
      createdAt: stamp(dayOffset(9)),
      updatedAt: stamp(dayOffset(9)),
    },
    {
      id: 'demo-plan-escapes',
      name: 'Survive and escape',
      mode: 'gi',
      date: dayOffset(1),
      objectives: ['Mount escape under pressure', 'Back escape fundamentals'],
      blocks: [
        block('demo-b8', 'warmup', 'Bridge drills', 8, ['bridge-drill']),
        block('demo-b9', 'technique', 'Upa and elbow-knee escape', 20, ['mount-escape-upa', 'side-control-escape']),
        block('demo-b10', 'technique', 'Back escape', 20, ['back-escape']),
        block('demo-b11', 'other', 'Cooldown and notes', 7),
      ],
      createdAt: stamp(dayOffset(3)),
      updatedAt: stamp(dayOffset(3)),
    },
  ];
}

interface SessionDef {
  ago: number;
  mode: 'gi' | 'nogi';
  min: number;
  phys: number;
  tech: number;
  feelings: string[];
  rounds: number;
  achieved: string[];
  suffered: string[];
  takedowns?: [landed: string[], taken: string[]];
  notes: string;
  planId?: string;
}

const SESSION_DEFS: SessionDef[] = [
  { ago: 0, mode: 'gi', min: 90, phys: 7, tech: 8, feelings: ['focused', 'fluid'], rounds: 5, achieved: ['triangle-closed-guard', 'armbar-closed-guard'], suffered: ['kimura-closed-guard'], takedowns: [['guard-pull'], []], notes: 'Triangle finally clicked once I angled off first.', planId: 'demo-plan-closed-guard' },
  { ago: 2, mode: 'nogi', min: 75, phys: 8, tech: 6, feelings: ['tired', 'sore'], rounds: 6, achieved: ['guillotine'], suffered: ['rear-naked-choke', 'rear-naked-choke'], takedowns: [['double-leg', 'double-leg', 'ankle-pick'], ['uchi-mata']], notes: 'Got taken to the back twice. Work on hand fighting.' },
  { ago: 4, mode: 'gi', min: 90, phys: 6, tech: 7, feelings: ['motivated', 'strong'], rounds: 4, achieved: ['americana-side-control'], suffered: [], notes: 'Good pressure from side control.' },
  { ago: 7, mode: 'gi', min: 60, phys: 5, tech: 9, feelings: ['focused'], rounds: 2, achieved: [], suffered: ['cross-collar-choke'], notes: 'Technical class on passing. Took detailed notes.' },
  { ago: 9, mode: 'nogi', min: 90, phys: 9, tech: 5, feelings: ['frustrated', 'tired'], rounds: 7, achieved: ['straight-ankle-lock'], suffered: ['guillotine', 'inside-heel-hook'], takedowns: [['single-leg'], ['double-leg', 'double-leg', 'osoto-gari']], notes: 'Rough day. Cardio was the limiting factor.' },
  { ago: 12, mode: 'gi', min: 90, phys: 7, tech: 7, feelings: ['fluid', 'motivated'], rounds: 5, achieved: ['omoplata', 'bow-and-arrow'], suffered: [], notes: 'Felt relaxed in rounds.' },
  { ago: 15, mode: 'gi', min: 75, phys: 6, tech: 8, feelings: ['focused'], rounds: 3, achieved: ['triangle-closed-guard'], suffered: ['armbar-closed-guard'], notes: '' },
  { ago: 19, mode: 'nogi', min: 60, phys: 7, tech: 6, feelings: ['slow', 'sore'], rounds: 4, achieved: ['kimura-closed-guard'], suffered: [], notes: 'Shoulder a bit sore, kept it light.' },
  { ago: 23, mode: 'gi', min: 90, phys: 8, tech: 7, feelings: ['strong'], rounds: 6, achieved: ['rear-naked-choke', 'ezekiel-mount'], suffered: ['triangle-closed-guard'], takedowns: [['seoi-nage', 'osoto-gari', 'osoto-gari'], ['ouchi-gari']], notes: 'Competition class.' },
  { ago: 28, mode: 'gi', min: 90, phys: 6, tech: 8, feelings: ['fluid', 'focused'], rounds: 4, achieved: ['wrist-lock'], suffered: [], notes: '' },
  { ago: 34, mode: 'nogi', min: 75, phys: 7, tech: 6, feelings: ['motivated'], rounds: 5, achieved: ['guillotine', 'guillotine'], suffered: ['straight-ankle-lock'], takedowns: [['double-leg', 'body-lock-takedown'], ['single-leg']], notes: 'Guillotine from front headlock works.' },
  { ago: 41, mode: 'gi', min: 90, phys: 5, tech: 7, feelings: ['tired'], rounds: 3, achieved: [], suffered: ['omoplata'], notes: 'Low energy, tried to stay technical.' },
];

function buildSessions(): TrainingSession[] {
  return SESSION_DEFS.map((s, i) => ({
    id: `demo-session-${i + 1}`,
    date: dayOffset(s.ago),
    durationMin: s.min,
    mode: s.mode,
    planId: s.planId,
    physicalDifficulty: s.phys,
    technicalDifficulty: s.tech,
    feelings: s.feelings,
    sparringRounds: s.rounds,
    subsAchieved: s.achieved,
    subsSuffered: s.suffered,
    takedownsAchieved: s.takedowns?.[0] ?? [],
    takedownsSuffered: s.takedowns?.[1] ?? [],
    notes: s.notes,
    createdAt: stamp(dayOffset(s.ago)),
    updatedAt: stamp(dayOffset(s.ago)),
  }));
}

const ev = (athlete: 0 | 1, kind: MatchEvent['kind']): MatchEvent => ({ athlete, kind });

function buildMatches(): SparringMatch[] {
  const me = (points: number, advantages: number, penalties: number) => ({ name: 'You', points, advantages, penalties });
  const rival = (name: string, points: number, advantages: number, penalties: number) => ({ name, points, advantages, penalties });
  return [
    { id: 'demo-match-1', date: dayOffset(2), mode: 'nogi', durationSec: 300, athletes: [me(6, 1, 0), rival('Marco', 2, 0, 1)], winner: 0, method: 'points', events: [{ ...ev(0, 'takedown'), techniqueId: 'double-leg' }, ev(1, 'sweep'), ev(0, 'advantage'), ev(0, 'sweep'), ev(0, 'kneeOnBelly'), ev(1, 'penalty')], createdAt: stamp(dayOffset(2)) },
    { id: 'demo-match-2', date: dayOffset(4), mode: 'gi', durationSec: 420, athletes: [me(0, 0, 0), rival('Lucía', 0, 0, 0)], winner: 0, method: 'submission', submissionId: 'armbar-closed-guard', events: [], createdAt: stamp(dayOffset(4)) },
    { id: 'demo-match-3', date: dayOffset(9), mode: 'nogi', durationSec: 360, athletes: [me(2, 0, 0), rival('Diego', 4, 1, 0)], winner: 1, method: 'points', events: [{ ...ev(1, 'takedown'), techniqueId: 'uchi-mata' }, ev(0, 'sweep'), ev(1, 'advantage'), ev(1, 'sweep')], createdAt: stamp(dayOffset(9)) },
    { id: 'demo-match-4', date: dayOffset(12), mode: 'gi', durationSec: 300, athletes: [me(4, 2, 0), rival('Marco', 4, 1, 0)], winner: 0, method: 'advantages', createdAt: stamp(dayOffset(12)) },
    { id: 'demo-match-5', date: dayOffset(19), mode: 'gi', durationSec: 300, athletes: [me(3, 0, 0), rival('Sofía', 3, 0, 0)], winner: null, method: 'draw', createdAt: stamp(dayOffset(19)) },
    { id: 'demo-match-6', date: dayOffset(23), mode: 'gi', durationSec: 480, athletes: [me(0, 0, 0), rival('Diego', 0, 0, 0)], winner: 1, method: 'submission', submissionId: 'cross-collar-choke', createdAt: stamp(dayOffset(23)) },
  ];
}

function buildGraduations(): Graduation[] {
  return [
    { id: 'demo-grad-1', belt: 'white', stripes: 0, date: dayOffset(900), notes: 'First day on the mats.' },
    { id: 'demo-grad-2', belt: 'white', stripes: 2, date: dayOffset(540) },
    { id: 'demo-grad-3', belt: 'white', stripes: 4, date: dayOffset(300), notes: 'Four stripes after the winter season.' },
    { id: 'demo-grad-4', belt: 'blue', stripes: 0, date: dayOffset(160), notes: 'Promoted to blue belt.' },
    { id: 'demo-grad-5', belt: 'blue', stripes: 1, date: dayOffset(20) },
  ];
}

function buildInjuries(): Injury[] {
  const injury = (id: string, zone: Injury['zone'], intensity: number, daysAgo: number, status: Injury['status'], notes: string): Injury =>
    ({ id, zone, intensity, date: dayOffset(daysAgo), notes, status, createdAt: stamp(dayOffset(daysAgo)), updatedAt: stamp(dayOffset(daysAgo)) });
  return [
    injury('demo-injury-1', 'knee', 4, 6, 'active', 'Tweaked it defending a heel hook entry. Ice after training.'),
    injury('demo-injury-2', 'neck', 3, 25, 'active', 'Stiff after a lot of guillotine defense.'),
    injury('demo-injury-3', 'elbow', 6, 120, 'recovered', 'Late tap on an armbar. Two weeks off sparring.'),
  ];
}

/**
 * Adds fictional profile (with weekly and graduation goals), plans, sessions, matches,
 * graduations and injuries on top of the built-in library. Fixed ids make it safe to
 * run more than once. Dev only.
 */
export async function loadDemoData(): Promise<void> {
  await db.transaction('rw', [db.profile, db.plans, db.sessions, db.matches, db.graduations, db.injuries], async () => {
    await db.profile.put({
      id: 'me',
      name: 'Alex Silva',
      academy: 'Open Mat Academy',
      belt: 'blue',
      stripes: 1,
      startedAt: dayOffset(900),
      weeklyGoal: 3,
      graduationGoal: { classes: 150 },
    });
    await db.injuries.bulkPut(buildInjuries());
    await db.plans.bulkPut(buildPlans());
    await db.sessions.bulkPut(buildSessions());
    await db.matches.bulkPut(buildMatches());
    await db.graduations.bulkPut(buildGraduations());
  });
}
