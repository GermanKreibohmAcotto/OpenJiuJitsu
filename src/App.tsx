import { useEffect, useState } from 'react';
import { HashRouter, Route, Routes } from 'react-router';
import { Layout } from './app/Layout';
import { SettingsProvider } from './app/settings';
import { ensureSeeded } from './db/seed';
import { HomeRoutes } from './features/home';
import { JournalRoutes } from './features/journal';
import { LibraryRoutes } from './features/library';
import { PlansRoutes } from './features/plans';
import { ProfileRoutes } from './features/profile';
import { SettingsRoutes } from './features/settings';
import { SparringRoutes } from './features/sparring';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/*" element={<HomeRoutes />} />
        <Route path="/library/*" element={<LibraryRoutes />} />
        <Route path="/plans/*" element={<PlansRoutes />} />
        <Route path="/journal/*" element={<JournalRoutes />} />
        <Route path="/sparring/*" element={<SparringRoutes />} />
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
