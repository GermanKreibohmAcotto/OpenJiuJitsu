import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/dela-gothic-one/latin-400.css';
import '@fontsource/barlow/latin-400.css';
import '@fontsource/barlow/latin-500.css';
import '@fontsource/barlow/latin-600.css';
import '@fontsource/barlow/latin-700.css';
import '../index.css';
import { Landing, LANDING_THEME } from './Landing';
import { appRedirectTarget } from './redirect';

// Old app links (`/#/journal`) and installed PWAs (start_url `/`) belong in the app.
const target = appRedirectTarget(location.hash, matchMedia('(display-mode: standalone)').matches);

if (target) {
  location.replace(target);
} else {
  // The scrollbar is themed from the root element, so it gets the landing accent too.
  for (const [name, value] of Object.entries(LANDING_THEME)) document.documentElement.style.setProperty(name, String(value));
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Landing />
    </StrictMode>,
  );
}
