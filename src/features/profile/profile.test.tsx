import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import '../../i18n';
import { SettingsProvider } from '../../app/settings';
import { db } from '../../db/db';
import { ensureSeeded } from '../../db/seed';
import { getProfile, listGraduations, saveGraduation } from '../../db/profile';
import { saveSession } from '../../db/sessions';
import { ProfileRoutes } from '.';

beforeAll(() => {
  // Recharts' ResponsiveContainer observes its parent size.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeEach(async () => {
  localStorage.removeItem('ojj.mode');
  await db.delete();
  await db.open();
});

function renderProfile() {
  return render(
    <SettingsProvider>
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route path="/profile/*" element={<ProfileRoutes />} />
        </Routes>
      </MemoryRouter>
    </SettingsProvider>,
  );
}

function sessionInput(overrides: Partial<Parameters<typeof saveSession>[0]> = {}) {
  return {
    date: '2026-03-01',
    durationMin: 90,
    mode: 'gi' as const,
    physicalDifficulty: 5,
    technicalDifficulty: 5,
    feelings: [],
    sparringRounds: 3,
    subsAchieved: [],
    subsSuffered: [],
    notes: '',
    ...overrides,
  };
}

describe('profile editor', () => {
  it('persists the selected belt, stripes, name and academy', async () => {
    const user = userEvent.setup();
    renderProfile();

    await user.click(await screen.findByRole('radio', { name: 'Azul' }));
    await user.click(screen.getByRole('radio', { name: '2 grados' }));
    await user.type(screen.getByLabelText('Nombre'), 'Ana');
    await user.type(screen.getByLabelText('Academia'), 'Gracie Barra');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('Perfil guardado')).toBeInTheDocument();
    expect(await getProfile()).toMatchObject({ name: 'Ana', academy: 'Gracie Barra', belt: 'blue', stripes: 2 });
  });

  it('clamps stripes when switching to a belt with fewer', async () => {
    const user = userEvent.setup();
    renderProfile();

    await user.click(await screen.findByRole('radio', { name: 'Negro' }));
    await user.click(screen.getByRole('radio', { name: '6 grados' }));
    await user.click(screen.getByRole('radio', { name: 'Blanco' }));

    expect(screen.queryByRole('radio', { name: '6 grados' })).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '4 grados' })).toBeChecked();
  });
});

describe('graduation timeline', () => {
  it('shows graduations oldest to newest and deletes after confirmation', async () => {
    await saveGraduation({ belt: 'blue', stripes: 0, date: '2024-06-01' });
    const user = userEvent.setup();
    renderProfile();
    await screen.findByText('1 jun 2024', { exact: false });

    await user.selectOptions(screen.getByLabelText('Cinturón de la graduación'), 'white');
    await user.selectOptions(screen.getByLabelText('Grados de la graduación'), '3');
    await user.clear(screen.getByLabelText('Fecha'));
    await user.type(screen.getByLabelText('Fecha'), '2023-01-10');
    await user.type(screen.getByLabelText('Nota (opcional)'), 'Tercer grado');
    await user.click(screen.getByRole('button', { name: 'Agregar graduación' }));

    const items = await screen.findAllByRole('listitem', { name: /graduación/i });
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('Tercer grado')).toBeInTheDocument();
    expect(within(items[1]).getByRole('img')).toHaveAccessibleName('Azul · 0 grados');
    expect(within(items[1]).getByText(/Tiempo desde la anterior/)).toBeInTheDocument();
    expect((await listGraduations()).map((g) => g.date)).toEqual(['2023-01-10', '2024-06-01']);

    await user.click(within(items[1]).getByRole('button', { name: 'Eliminar' }));
    await user.click(within(items[1]).getByRole('button', { name: 'Eliminar' }));
    expect(await screen.findAllByRole('listitem', { name: /graduación/i })).toHaveLength(1);
    expect(await listGraduations()).toHaveLength(1);
  });

  it('offers to log a graduation after the belt changes', async () => {
    const user = userEvent.setup();
    renderProfile();
    await user.click(await screen.findByRole('radio', { name: 'Morado' }));
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText(/Cambió tu cinturón o grado/)).toBeInTheDocument();
    expect(screen.getByLabelText('Cinturón de la graduación')).toHaveValue('purple');
  });
});

describe('stats dashboard', () => {
  it('shows empty state without sessions', async () => {
    renderProfile();
    expect(await screen.findByText(/Aún no hay sesiones/)).toBeInTheDocument();
  });

  it('shows total mat hours and the escape link for the most suffered submission', async () => {
    await ensureSeeded();
    await saveSession(sessionInput({ durationMin: 90, subsAchieved: ['armbar-closed-guard'], subsSuffered: ['kimura-closed-guard', 'kimura-closed-guard', 'kimura-closed-guard', 'guillotine'] }));
    await saveSession(sessionInput({ date: '2026-03-02', durationMin: 60, mode: 'nogi', sparringRounds: 2, subsSuffered: ['guillotine'] }));
    renderProfile();

    expect(await screen.findByText('2.5 h')).toBeInTheDocument();
    const links = await screen.findAllByRole('link', { name: /Qué entrenar/ });
    expect(links[0]).toHaveAttribute('href', '/library/kimura-escape');
  });

  it('respects the global GI/NoGI filter', async () => {
    await ensureSeeded();
    localStorage.setItem('ojj.mode', 'nogi');
    await saveSession(sessionInput({ durationMin: 90 }));
    await saveSession(sessionInput({ date: '2026-03-02', durationMin: 60, mode: 'nogi' }));
    renderProfile();

    expect(await screen.findByText('1 h')).toBeInTheDocument();
  });

  it('labels unknown techniques', async () => {
    await saveSession(sessionInput({ subsAchieved: ['gone'] }));
    renderProfile();
    expect((await screen.findAllByText('Técnica eliminada')).length).toBeGreaterThan(0);
  });
});
