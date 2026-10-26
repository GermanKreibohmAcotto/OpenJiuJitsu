Objective: build OpenJiuJitsu, a local-first BJJ web app (technique library, plan builder, training journal, profile/progression, sparring timer), GI and NoGI.
Branch: feat/openjiujitsu-mvp · Delivery strategy: ask-on-risk (no remote yet; PR shape decided when pushing) · Test runner: `npm test` (Vitest + Testing Library), `npm run build` (tsc + vite).

## Specs

S0 (decisions, L2): "Local-first PWA" (IndexedDB, no server, offline, JSON export/import); "React + Vite + TS" (Tailwind, dnd-kit, Recharts, Dexie, Vitest); "Español + Inglés (i18n)" with Spanish as default. Reference style: "estilo https://github.com/DuarteSantos8/openGym". App name: "OpenJiuJitsu".

S1 Technique library — "Biblioteca de Técnicas (La "Wiki" o Diccionario)".
- Categories: "Drilles, Guardias (cerrada, media, araña, de la Riva, etc.), Pasajes, Llaves/Sumisiones, y Escapes/Defensas."
- Technique entity: "Nombre (ej. Triángulo desde guardia cerrada)." · "Tipo (Sumisión, Raspaje, Escape)." · "Pasos detallados o "Checklist" de ejecución (para recordar cómo era)." · "Media: Espacio para un link de YouTube, GIF o imagen."
- Relations: "Toda técnica debe tener su contraparte. Por ejemplo, la sumisión "Kimura" debe tener enlazada la técnica "Escape de Kimura"."
- Users can create/edit/delete techniques (assumption: needed for a wiki), searchable and filterable by category, type, GI/NoGI.
- Seed library ships with the app (assumption).

S2 Belt legality — "que en la biblioteca de sumisiones muestre en que cinto se puede tirar esa llave."
- Per submission, minimum belt in GI and in NoGI, or "not allowed". Source: IBJJF Rule Book v6.1 (June 2024), adult divisions (assumption: adult IBJJF is the reference ruleset; disclaimer shown). White: chokes, armlocks, kimura, americana, omoplata, triangle, straight foot lock, ezekiel. Blue+: wrist lock. Brown/black: kneebar, toe hold, calf slicer, bicep slicer. Heel hook: only brown/black NoGI.

S3 GI and NoGI — "Que sea para GI y NoGI". Techniques carry GI/NoGI applicability; sessions and sparring rounds record GI or NoGI; global mode filter.

S4 Plan builder — "Constructor de Planes de Entrenamiento"
- "Armado de Sesión: Arrastrar y soltar (drag & drop) técnicas de la biblioteca para crear el plan del día. Ej: 15 min de Drills de cadera + 20 min de Pasajes de Guardia + 30 min de Rolada (Sparring)."
- Blocks have minutes; total duration shown; blocks reorderable.
- "Objetivos del día: Definir qué se busca mejorar en esa sesión específica."

S5 Training journal — "Bitácora de Entrenamiento (El Diario / Tracker)"
- "Registro de Sesión: Fecha, duración y el plan que se siguió."
- "Dificultad física (del 1 al 10)." · "Dificultad técnica." (1–10) · "Sensaciones (tags como: cansado, fluido, frustrado, fuerte)."
- "Sumisiones logradas (seleccionadas de la biblioteca)." · "Sumisiones sufridas (para identificar áreas de mejora)."
- "Notas libres: Un textarea para anotar esos "detalles de oro" que corrigió el profesor (ej. "esconder más el codo en la americana")."

S6 Profile & progression — "Perfil y Progresión (Gamificación y Tracking)"
- "Sistema de Cinturones y Grados: Un selector visual del cinturón actual (Blanco, Azul, Morado, Marrón, Negro) y los grados (rayas/stripes)."
- "Timeline de Graduaciones: Registro de fechas de cuándo se obtuvo cada cinturón o grado."
- Dashboard: "Gráficos con las sumisiones que más logra." · "Horas totales en el tatami." · "Las llaves de las que más le cuesta escapar (feedback visual para saber qué entrenar)."

S7 Sparring mini-app — "agregar una mini aplicacion para los sparring con contador, puntos y demas."
- Round timer (preset by belt per IBJJF adult: white 5, blue 6, purple 7, brown 8, black 10 min; custom), rest timer, rounds count.
- Two-athlete scoreboard, IBJJF points: takedown 2, sweep 2, knee on belly 2, guard pass 3, mount 4, back control 4; advantages; penalties; undo; winner by points → advantages → penalties.
- Finish by submission (selected from library), optionally saved into the journal's sparring log.

S8 Data ownership: everything stored locally (IndexedDB); export/import of all data as one JSON file; installable PWA with offline support.

## Tasks

T1 [S0,S3,S8 base] Foundation: scaffold, Tailwind, router + layout/nav, i18n (per-feature namespaces), domain types, Dexie DB + repositories, seed techniques with relations + belt legality, export/import — inline — done (c647e14; RED: repos/seed/backup modules missing → GREEN 20/20; belts tests written after impl, not a true RED; tsc + vite build OK)
T2 [S1,S2,S3] Library UI: list/search/filter, detail with steps checklist, media, counterpart links, belt legality badges, create/edit — background writer — done (a7c548e; RED→GREEN 20 tests + picker excludeIds 1 test)
T3 [S4] Plan builder with drag & drop and objectives — background writer — done (6201d26; RED→GREEN 10 tests; pointer drag not testable in jsdom, fallback tested)
T4 [S5] Training journal — background writer — done (a47b504; RED→GREEN 7 tests; validation messages localized via SessionValidationError)
T5 [S6] Profile, belts/stripes, graduation timeline, stats dashboard — background writer — done (710dcb3; RED→GREEN 17 tests)
T6 [S7] Sparring timer + scoreboard — background writer — done (54d8f75; RED→GREEN 21 tests)
T7 [S8] PWA manifest/offline, settings (export/import, language, GI/NoGI), README — inline — in_progress (e0f3747 settings/README, 26b8735 lazy routes; build OK, PWA precache 23 entries; independent verify of import pending)

## Log

L1 (2026-10-26, user, verbatim):
Quiero desarrollar una aplicacion WEB estilo https://github.com/DuarteSantos8/openGym que sea de jiu jitsu se va a llamar OpenJiuJitsu la idea es que tenga:

1. Biblioteca de Técnicas (La "Wiki" o Diccionario)
Este es el corazón de la app, donde vive el conocimiento estructurado.

Categorías Principales: Drilles, Guardias (cerrada, media, araña, de la Riva, etc.), Pasajes, Llaves/Sumisiones, y Escapes/Defensas.

Estructura de una Técnica (Entidad):

Nombre (ej. Triángulo desde guardia cerrada).

Tipo (Sumisión, Raspaje, Escape).

Pasos detallados o "Checklist" de ejecución (para recordar cómo era).

Media: Espacio para un link de YouTube, GIF o imagen.

Relaciones: Toda técnica debe tener su contraparte. Por ejemplo, la sumisión "Kimura" debe tener enlazada la técnica "Escape de Kimura".
2. Constructor de Planes de Entrenamiento
Permite a los usuarios (o instructores) armar la estructura de la clase o sesión de open mat.

Armado de Sesión: Arrastrar y soltar (drag & drop) técnicas de la biblioteca para crear el plan del día. Ej: 15 min de Drills de cadera + 20 min de Pasajes de Guardia + 30 min de Rolada (Sparring).

Objetivos del día: Definir qué se busca mejorar en esa sesión específica.
3. Bitácora de Entrenamiento (El Diario / Tracker)
Aquí es donde el usuario entra después de entrenar para registrar su progreso.

Registro de Sesión: Fecha, duración y el plan que se siguió.

Métricas de Percepción:

Dificultad física (del 1 al 10).

Dificultad técnica.

Sensaciones (tags como: cansado, fluido, frustrado, fuerte).

Log de Sparring (Roladas):

Sumisiones logradas (seleccionadas de la biblioteca).

Sumisiones sufridas (para identificar áreas de mejora).

Notas libres: Un textarea para anotar esos "detalles de oro" que corrigió el profesor (ej. "esconder más el codo en la americana").

4. Perfil y Progresión (Gamificación y Tracking)
El panel personal del usuario.

Sistema de Cinturones y Grados: Un selector visual del cinturón actual (Blanco, Azul, Morado, Marrón, Negro) y los grados (rayas/stripes).

Timeline de Graduaciones: Registro de fechas de cuándo se obtuvo cada cinturón o grado.

Estadísticas (Dashboard):

Gráficos con las sumisiones que más logra.

Horas totales en el tatami.

Las llaves de las que más le cuesta escapar (feedback visual para saber qué entrenar).

Que sea para GI y NoGI tambien agregar una mini aplicacion para los sparring con contador, puntos y demas. y que en la biblioteca de sumisiones muestre en que cinto se puede tirar esa llave.

L2 (2026-10-26, user answers): Arquitectura — "Local-first PWA (Recomendado)"; Stack — "React + Vite + TS (Recomendado)"; Idioma UI — "Español + Inglés (i18n)".

L3: Research for S2 — IBJJF Rule Book v6.1 (June 2024) https://www.ligabjj.com/ibjjfrules/2024JUN_IBJJF_Rules_EN.pdf ; heel hooks/reaping legal for adult brown/black NoGi since 2021 https://ibjjf.com/news/new-rules-updates ; per-belt summary https://www.open-bjj.com/articles/ibjjf-illegal-moves-by-belt-and-age. Forecast: ~5–6k authored lines, well over the 400-line slice heuristic; work-unit commits per task, PR shape (chain vs single) decided by the user when a remote exists.
Routing: T1 inline (everything depends on it). After T1 the data layer makes T2–T6 independent behaviors under disjoint `src/features/<name>/**` surfaces → parallel background writers (Writer rule: 2+ independent units each several files). T7 inline after the seam check.

L4: T1 committed c647e14 (63 files, includes package-lock). Native assess on root commit: unavailable (no base commit to compare). Seed Spanish strings normalized to neutral infinitives (artifact language rule). Tests pin lang=es in setup. Launching T2–T6 as parallel background writers with disjoint surfaces src/features/<name>/**.

L4: T1 committed c647e14 (63 files, includes package-lock). Native assess on root commit: unavailable (no base commit to compare). Seed Spanish strings normalized to neutral infinitives (artifact language rule). Tests pin lang=es in setup. Launching T2–T6 as parallel background writers with disjoint surfaces src/features/<name>/**.
L5: T7 slice committed e0f3747 (settings export/import with translated BackupError codes, language + mode, storage persistence, README, .gitattributes). RED: settings tests 4 failed (no UI) → GREEN 24/24 (db, domain, settings, shell). Risk: item 1 (import replaces all stored data) → assess escalated: tier high, independent verifier required; native assess unavailable while writers' untracked files exist — run native review + gentle-ai-verify after T2–T6 land and the tree is clean. PWA build/offline check pending until all features land.
L6: Seam check after T2–T6: full suite 17 files / 100 tests passed, tsc -b clean, vite build OK. Fixes at the seam: SessionValidationError with per-field translated messages (journal showed English RangeError text), TechniquePicker excludeIds (library form listed the edited technique as its own counterpart candidate), lazy feature routes (bundle 945 kB → initial ~256 kB). Writer notes kept as follow-ups: penalties only tie-break (no IBJJF advantage/points to opponent), points accumulate across rounds, result screen needs "Terminar combate" tap, GI/NoGI split in stats ignores the global filter by design. Native review of e0f3747 (high) not started: native assess was blocked by untracked writer files at that time; reviewing that commit alone now needs a separate worktree outside the project root.
