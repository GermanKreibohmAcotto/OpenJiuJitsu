Objective: add five training tools to OpenJiuJitsu: round timer, weekly streaks, graduation progress, position map, injury log.
Branch: feat/training-tools · Test runner: `npm test` (Vitest + Testing Library), `npm run build` (tsc + vite) · UI strings in es (default) and en.

## Specs

S1 Round timer — idea 1: "Temporizador de rounds: configurable (por ejemplo 5 min por 6 rounds, descanso entre rounds) con sonido. Se usa en el tatami." Chosen scope "Básico": "Duración de round, descanso y cantidad de rounds; pitido al inicio, aviso a los 30 s finales y al terminar."
- The sparring match screen already has a round/rest timer (`src/features/sparring/timer.ts`) with a beep when a round or rest ends. Assumption: S1 adds a standalone timer (no scoreboard, nothing saved) reachable from the sparring section, reusing `timer.ts`, and both the standalone timer and the match screen get the start beep and the 30 s warning.
- The 30 s warning fires once per round, only when the round is longer than 30 s.

S2 Weekly goal and streak — idea 2: "Rachas y objetivos: meta semanal de clases y racha de entrenamientos, con recordatorios locales." Chosen scope "Meta semanal": "Objetivo de X entrenamientos por semana; la racha cuenta semanas seguidas cumpliendo la meta. Sin notificaciones."
- Weeks start on Monday (ISO weeks), local dates from `TrainingSession.date`.
- Each journal session counts as one training, regardless of mode filter (assumption: the goal is about attendance, not GI/NoGI).
- Current streak: consecutive weeks meeting the goal, ending at the current week when it already meets the goal, otherwise ending at the previous week (the current week is still in progress and never breaks the streak). Also show best streak and "this week n / X".
- Goal is stored in the profile (`Profile.weeklyGoal`, 1..14) so it travels in backups; no goal set → the home card invites to set one.

S3 Graduation progress — idea 3: "Gráfico de progreso por cinturón: horas de mat, clases hasta la próxima graduación y línea de tiempo (ya tenés `GraduationTimeline`)." Chosen scope "Ambos": "Referencia IBJJF por defecto, editable con tu propia meta."
- Since the last graduation (latest `Graduation` record; fallback `Profile.startedAt`; else all sessions): classes, mat hours, time at current belt.
- IBJJF adult minimum time at a belt before the next one: blue 2 years, purple 1.5 years, brown 1 year. White and black have no minimum time in this reference (shown as "no IBJJF minimum").
- The user may set an own goal (`Profile.graduationGoal`: optional classes, hours, months); each set field replaces the reference and shows its own progress bar. Clearing the goal returns to the IBJJF reference.

S4 Position map — idea 4: "Mapa de posiciones: un grafo de transiciones (guardia → pasaje → control → sumisión) navegable desde la biblioteca."
- Techniques store only their starting position, so transitions come from a fixed domain graph of the existing `POSITIONS` (e.g. standing → closed guard/half guard by takedown or pull, guards → side control by pass, side control → mount, mount → back, bottom positions → guard by escape, guards → top by sweep).
- Each position shows the library techniques that start there, grouped by type, linking to the technique detail, respecting the global GI/NoGI filter.
- Reachable from the library list (link) at `/library/map`.

S5 Injury log — idea 7: "Lesiones y estado físico: registro de dolores y de cómo te sentís antes de entrenar, cruzado con el volumen de entrenamiento." Chosen scope "Lesiones simples": "Zona del cuerpo, intensidad 1-10, fecha, notas y estado (activa/recuperada)."
- Create, edit, delete injuries; mark as recovered or active again; list shows active first.
- Stored in a new IndexedDB table (`injuries`), included in JSON export/import. Backups from before the table (version 1) still import, with no injuries.

## Tasks

- [ ] T0 S2,S3 Profile fields `weeklyGoal`, `graduationGoal` + backup validation · route: inline · commit: —
- [ ] T1 S1 Standalone round timer + start beep + 30 s warning · route: writer (src/features/sparring) · commit: —
- [ ] T2 S2 Weekly goal and streak on home · route: writer (home + profile goal form) · commit: —
- [ ] T3 S3 Graduation progress in profile · route: writer (same writer as T2, profile) · commit: —
- [ ] T4 S4 Position map in library · route: writer (src/features/library, src/domain/positionGraph) · commit: —
- [ ] T5 S5 Injury log (new table, backup v2) · route: writer, own commit (Risk item 1: schema/backup format) · commit: —
- [ ] T6 all Verify (independent for T5), full suite + build · route: verify · commit: —

## Log

L1 (user, original request): "Ideas que me gustaria aplicar son: la 1,2,3,4 y 7" — referring to the proposed list: "1. Temporizador de rounds: configurable (por ejemplo 5 min por 6 rounds, descanso entre rounds) con sonido. Se usa en el tatami. 2. Rachas y objetivos: meta semanal de clases y racha de entrenamientos, con recordatorios locales. 3. Gráfico de progreso por cinturón: horas de mat, clases hasta la próxima graduación y línea de tiempo (ya tenés `GraduationTimeline`). 4. Mapa de posiciones: un grafo de transiciones (guardia → pasaje → control → sumisión) navegable desde la biblioteca. 7. Lesiones y estado físico: registro de dolores y de cómo te sentís antes de entrenar, cruzado con el volumen de entrenamiento."
L2 (user decisions): timer "Básico"; streaks "Meta semanal"; graduation "Ambos"; injuries "Lesiones simples".
L3 (discovery): sparring already ships a round/rest timer with end beeps; techniques have no destination position.
