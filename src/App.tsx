import { lazy, useEffect, useState, type ComponentType } from 'react';
import { HashRouter, Route, Routes } from 'react-router';
import { Layout } from './app/Layout';
import { SettingsProvider } from './app/settings';
import { ensureSeeded } from './db/seed';

// Features load on demand so charts and drag & drop stay out of the initial bundle.
const lazyRoutes = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) =>
  lazy(async () => ({ default: (await load())[name] }));
const HomeRoutes = lazyRoutes(() => import('./features/home'), 'HomeRoutes');
const LibraryRoutes = lazyRoutes(() => import('./features/library'), 'LibraryRoutes');
const PlansRoutes = lazyRoutes(() => import('./features/plans'), 'PlansRoutes');
const JournalRoutes = lazyRoutes(() => import('./features/journal'), 'JournalRoutes');
const SparringRoutes = lazyRoutes(() => import('./features/sparring'), 'SparringRoutes');
const AnalyticsRoutes = lazyRoutes(() => import('./features/analytics'), 'AnalyticsRoutes');
const InjuriesRoutes = lazyRoutes(() => import('./features/injuries'), 'InjuriesRoutes');
const ProfileRoutes = lazyRoutes(() => import('./features/profile'), 'ProfileRoutes');
const SettingsRoutes = lazyRoutes(() => import('./features/settings'), 'SettingsRoutes');

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/*" element={<HomeRoutes />} />
        <Route path="/library/*" element={<LibraryRoutes />} />
        <Route path="/plans/*" element={<PlansRoutes />} />
        <Route path="/journal/*" element={<JournalRoutes />} />
        <Route path="/sparring/*" element={<SparringRoutes />} />
        <Route path="/analytics/*" element={<AnalyticsRoutes />} />
        <Route path="/injuries/*" element={<InjuriesRoutes />} />
        <Route path="/profile/*" element={<ProfileRoutes />} />
        <Route path="/settings/*" element={<SettingsRoutes />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureSeeded()
      .catch((error: unknown) => console.error('Seeding the technique library failed', error))
      .finally(() => setReady(true));
  }, []);

  if (!ready) return null;
  return (
    <SettingsProvider>
      {/* Hash routing keeps the static build working on any host without rewrite rules. */}
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </SettingsProvider>
  );
}
