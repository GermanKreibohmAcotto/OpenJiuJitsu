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

// Dev only: open the app with `?demo` to fill it with fictional data, then drop the parameter.
async function loadDemoIfRequested() {
  if (!import.meta.env.DEV) return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has('demo')) return;
  const { loadDemoData } = await import('./dev/demoData');
  await loadDemoData();
  url.searchParams.delete('demo');
  window.history.replaceState(null, '', url);
}

loadDemoIfRequested()
  .catch((error: unknown) => console.error('Loading demo data failed', error))
  .finally(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
