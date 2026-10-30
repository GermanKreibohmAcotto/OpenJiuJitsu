import { isDemoMode } from './dev/demoMode';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/dela-gothic-one/latin-400.css';
import '@fontsource/barlow/latin-400.css';
import '@fontsource/barlow/latin-500.css';
import '@fontsource/barlow/latin-600.css';
import '@fontsource/barlow/latin-700.css';
import './i18n';
import './index.css';
import App from './App';

// Dev only: `?demo` turns demo mode on (see dev/demoMode). The app then runs on the separate
// `openjiujitsu-demo` database, which gets the built-in library and fictional data when it has none yet.
async function loadDemoIfEnabled() {
  if (!import.meta.env.DEV || !isDemoMode()) return;
  const { ensureDemoData } = await import('./dev/demoData');
  await ensureDemoData();
}

loadDemoIfEnabled()
  .catch((error: unknown) => console.error('Loading demo data failed', error))
  .finally(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
