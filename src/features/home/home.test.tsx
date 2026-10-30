import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import '../../i18n';
import { SettingsProvider } from '../../app/settings';
import { db } from '../../db/db';
import { todayIso } from '../../db/ids';
import { getProfile, saveProfile } from '../../db/profile';
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

describe('weekly goal', () => {
  it('invites to set a weekly goal and stores it without touching the profile', async () => {
    const user = userEvent.setup();
    await saveProfile({ name: 'Ana', academy: 'GB', belt: 'blue', stripes: 1, startedAt: '2020-01-01' });
    renderHome();

    expect(await screen.findByText(/Define cuántas veces por semana/)).toBeInTheDocument();
    await user.type(screen.getByLabelText('Meta semanal'), '3');
    await user.click(screen.getByRole('button', { name: 'Guardar meta' }));

    expect(await screen.findByText('0 / 3')).toBeInTheDocument();
    expect(await getProfile()).toEqual({
      id: 'me', name: 'Ana', academy: 'GB', belt: 'blue', stripes: 1, startedAt: '2020-01-01', weeklyGoal: 3,
    });
  });

  it('rejects goals outside 1..14', async () => {
    const user = userEvent.setup();
    renderHome();
    await user.type(await screen.findByLabelText('Meta semanal'), '15');
    await user.click(screen.getByRole('button', { name: 'Guardar meta' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('entre 1 y 14');
    expect((await getProfile()).weeklyGoal).toBeUndefined();
  });

  it('shows this week and streaks counting every mode', async () => {
    await saveProfile({ name: '', academy: '', belt: 'white', stripes: 0, weeklyGoal: 1 });
    await saveSession({ ...base, date: todayIso(), durationMin: 60, mode: 'nogi', sparringRounds: 0 });
    localStorage.setItem('ojj.mode', 'gi');
    renderHome();

    expect(await screen.findByText('1 / 1')).toBeInTheDocument();
    expect(screen.getByText(/Racha actual: 1 semana/)).toBeInTheDocument();
    expect(screen.getByText(/Mejor racha: 1 semana/)).toBeInTheDocument();
  });

  it('lets the user change the goal', async () => {
    const user = userEvent.setup();
    await saveProfile({ name: '', academy: '', belt: 'white', stripes: 0, weeklyGoal: 2 });
    renderHome();
    const input = await screen.findByLabelText('Meta semanal');
    await user.clear(input);
    await user.type(input, '5');
    await user.click(screen.getByRole('button', { name: 'Guardar meta' }));
    expect(await screen.findByText('0 / 5')).toBeInTheDocument();
    expect((await getProfile()).weeklyGoal).toBe(5);
  });
});
