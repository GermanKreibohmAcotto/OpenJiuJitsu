import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Tests run in the default language (Spanish) regardless of the jsdom navigator language.
localStorage.setItem('ojj.lang', 'es');

afterEach(() => cleanup());
