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
npm run dev
```

- Landing page: http://localhost:5173/
- App: http://localhost:5173/app/ (dev demo mode with fictional data: http://localhost:5173/app/?demo)

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm test` | Run the test suite (Vitest) |
| `npm run typecheck` | Type-check the project |
| `npm run build` | Type-check and build the static PWA into `dist/` |
| `npm run preview` | Serve the production build locally |

`dist/` is a static site with two pages: the landing at the site root and the app at `app/`. Hash-based routing inside the app means no rewrite rules are needed. Old `/#/...` app links (and installed PWAs that still launch the root) redirect to `app/`.

## Deploy

The site is deployed to GitHub Pages by [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) on every push to `main` (or manually via **Run workflow**). It typechecks, tests and builds, then publishes `dist/`.

One-time setup: repo **Settings → Pages → Source: GitHub Actions**.

- Landing: https://germankreibohmacotto.github.io/OpenJiuJitsu/
- App: https://germankreibohmacotto.github.io/OpenJiuJitsu/app/

The build reads the `BASE_PATH` environment variable (default `/`). The workflow sets it to `/<repository-name>/`; use another subpath for a different project site, or `/` for a custom domain or root hosting:

```bash
BASE_PATH=/OpenJiuJitsu/ npm run build
```

## Project structure

```
src/
  domain/     Types and rules (belts, IBJJF legality)
  db/         Dexie database, repositories, seed library, backup
  landing/    Landing page served at / (reads the real library, legality and timer data)
  i18n/       i18next setup and shared strings (es, en)
  components/ Shared UI (belt bar, GI/NoGI toggle, technique picker)
  features/   One folder per area: library, plans, journal, profile, sparring, injuries, settings, home
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
