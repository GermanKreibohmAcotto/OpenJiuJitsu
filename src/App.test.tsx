import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import './i18n';
import { AppRoutes } from './App';
import { SettingsProvider } from './app/settings';

describe('app shell', () => {
  it('renders the navigation and the GI/NoGI filter', () => {
    render(
      <SettingsProvider>
        <MemoryRouter initialEntries={['/library']}>
          <AppRoutes />
        </MemoryRouter>
      </SettingsProvider>,
    );
    expect(screen.getAllByRole('link', { name: /Biblioteca/ }).length).toBeGreaterThan(0);
    expect(screen.getByRole('radio', { name: 'NoGI' })).toBeInTheDocument();
  });
});
