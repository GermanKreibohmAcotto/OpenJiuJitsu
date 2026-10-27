import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import '../../i18n';
import { SettingsProvider } from '../../app/settings';
import { db } from '../../db/db';
import { saveProfile } from '../../db/profile';
import { saveSession } from '../../db/sessions';
import { HomeRoutes } from '.';

beforeEach(async () => {
  localStorage.removeItem('ojj.mode');
  await db.delete();
  await db.open();
});

function renderHome(path = '/') {
  return render(
    <SettingsProvider>
      <MemoryRouter initialEntries={[path]}>
        <HomeRoutes />
      </MemoryRouter>
    </SettingsProvider>,
  );
}

const base = {
  physicalDifficulty: 5,
  technicalDifficulty: 5,
  feelings: [],
  subsAchieved: [],
  subsSuffered: [],
  notes: '',
};

describe('home', () => {
  it('shows quick actions and an empty last session', async () => {
    renderHome();
    expect(await screen.findByText(/Aún no registraste/)).toBeInTheDocument();
    const href = (name: RegExp) => screen.getByRole('link', { name }).getAttribute('href');
    expect(href(/Registrar sesión/)).toBe('/journal/new');
    expect(href(/Sparring/)).toBe('/sparring');
    expect(href(/Crear plan/)).toBe('/plans/new');
    expect(href(/Biblioteca/)).toBe('/library');
  });

  it('shows belt, mat hours and the last session', async () => {
    await saveProfile({ name: 'Ana', academy: '', belt: 'purple', stripes: 2 });
    await saveSession({ ...base, date: '2026-03-01', durationMin: 90, mode: 'gi', sparringRounds: 3 });
    await saveSession({ ...base, date: '2026-03-05', durationMin: 60, mode: 'nogi', sparringRounds: 2, subsAchieved: ['x'] });
    renderHome();

    expect(await screen.findByRole('img', { name: 'Morado · 2 grados' })).toBeInTheDocument();
    expect(await screen.findByText('2.5 h')).toBeInTheDocument();
    expect(screen.getByText(/2026-03-05/)).toBeInTheDocument();
  });

  it('renders the dashboard for unknown paths', async () => {
    renderHome('/nope');
    expect(await screen.findByText(/Aún no registraste/)).toBeInTheDocument();
  });
});
