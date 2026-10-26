# Features

Each folder owns one area of the app:

- `index.tsx` exports `<Name>Routes`, mounted by `src/App.tsx` under `/<feature>/*`.
- `locales/es.ts` and `locales/en.ts` default-export the feature's strings. They are
  registered automatically as the i18next namespace named after the folder
  (`useTranslation('library')`).

Shared building blocks live outside features: `src/domain` (types and rules),
`src/db` (Dexie database and repositories), `src/components`, `src/hooks`, `src/app/settings.tsx`.
