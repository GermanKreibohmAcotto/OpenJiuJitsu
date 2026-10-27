# OpenJiuJitsu

**A local-first Brazilian Jiu-Jitsu companion you actually own.**

Keep your technique library, plan classes and open mats, log every session and roll, track your
belt progression, and run sparring rounds with an IBJJF-style scoreboard. GI and NoGI.
Everything stays in your browser: no account, no server, no telemetry.

Inspired by [openGym](https://github.com/DuarteSantos8/openGym).

## Features

| Area | What it does |
| --- | --- |
| **Technique library** | Drills, guards, passes, submissions and escapes. Each technique has a type, position, step-by-step checklist, media (YouTube, GIF, image) and linked counterparts (e.g. Kimura ↔ Kimura escape). Ships with a bilingual starter library. |
| **Belt legality** | Every submission shows the minimum belt allowed to use it in GI and NoGI (IBJJF adult rules, v6.1 2024), e.g. heel hooks only for brown/black in NoGI. |
| **Plan builder** | Drag and drop techniques into timed blocks (15 min drills + 20 min passes + 30 min rolling) and set the goals of the day. |
| **Training journal** | Date, duration, followed plan, physical and technical difficulty (1–10), feelings, submissions achieved and suffered, and free notes for the coach's "golden details". |
| **Profile and progression** | Visual belt and stripe selector, graduation timeline and a dashboard: top submissions, total mat hours and the submissions you struggle to escape (with a link to the escape to train). |
| **Sparring timer** | Round and rest timer with belt presets, IBJJF points, advantages, penalties, undo, and finish by submission straight into your journal. |
| **Your data** | Stored in IndexedDB on your device. Export and import everything as one JSON file. Installable PWA that works offline. |

The interface is available in Spanish (default) and English.

## Getting started

Requirements: Node.js 20+.

```bash
npm install
npm run dev       # http://localhost:5173
```

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm test` | Run the test suite (Vitest) |
| `npm run typecheck` | Type-check the project |
| `npm run build` | Type-check and build the static PWA into `dist/` |
| `npm run preview` | Serve the production build locally |

`dist/` is a static site. Host it anywhere (Nginx, GitHub Pages, Netlify, a NAS); hash-based
routing means no rewrite rules are needed.

## Project structure

```
src/
  domain/     Types and rules (belts, IBJJF legality)
  db/         Dexie database, repositories, seed library, backup
  i18n/       i18next setup and shared strings (es, en)
  components/ Shared UI (belt bar, GI/NoGI toggle, technique picker)
  features/   One folder per area: library, plans, journal, profile, sparring, settings, home
```

Each feature owns its routes and its strings (`features/<name>/locales/{es,en}.ts`), registered
automatically as an i18next namespace. See [`src/features/README.md`](src/features/README.md).

## Data and privacy

All data lives in your browser's IndexedDB. Clearing site data deletes it, so export a backup
regularly from **Settings → Your data**, and request persistent storage there. Importing a backup
replaces all current data after a confirmation; invalid files are rejected before anything is
written.

## Belt legality disclaimer

Legality data follows the IBJJF Rule Book v6.1 (June 2024) for adult divisions. Rules differ
between organizations (ADCC, NAGA, local events) and change over time: always check the rules of
the event you compete in.

## License

[AGPL-3.0-or-later](https://www.gnu.org/licenses/agpl-3.0.html).
