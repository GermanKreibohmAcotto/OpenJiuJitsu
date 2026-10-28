import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import '../../i18n';
import { SettingsProvider } from '../../app/settings';
import { db } from '../../db/db';
import { getProfile } from '../../db/profile';
import { AnalyticsRoutes } from '.';

function renderAnalytics() {
  return render(
    <SettingsProvider>
      <MemoryRouter initialEntries={['/analytics']}>
        <Routes>
          <Route path="/analytics/*" element={<AnalyticsRoutes />} />
        </Routes>
      </MemoryRouter>
    </SettingsProvider>,
  );
}

beforeEach(async () => {
  localStorage.removeItem('ojj.mode');
  await db.delete();
  await db.open();
});

describe('analytics page', () => {
  it('shows an empty state and every axis without data when nothing is logged', async () => {
    renderAnalytics();
    expect(await screen.findByText(/Todavía no hay datos suficientes/)).toBeInTheDocument();
    expect(screen.getByText('Presión / Pasaje')).toBeInTheDocument();
    expect(screen.getByText('Flexibilidad / Guardia')).toBeInTheDocument();
    expect(screen.getAllByText('Sin datos')).toHaveLength(7);
  });

  it('computes axes from matches and sessions and names the strongest one', async () => {
    await db.matches.add({
      id: 'm1',
      date: '2026-10-25',
      mode: 'gi',
      durationSec: 300,
      athletes: [
        { name: 'Yo', points: 7, advantages: 0, penalties: 0 },
        { name: 'Marco', points: 0, advantages: 0, penalties: 0 },
      ],
      winner: 0,
      method: 'points',
      events: [
        { athlete: 0, kind: 'guardPass' },
        { athlete: 0, kind: 'mount' },
      ],
      createdAt: '2026-10-25T10:00:00.000Z',
    });
    renderAnalytics();
    expect(await screen.findByText(/Tu eje más fuerte/)).toBeInTheDocument();
    expect(screen.getAllByText('100/100').length).toBeGreaterThan(0);
  });

  it('saves the flexibility self rating in the profile', async () => {
    renderAnalytics();
    const slider = await screen.findByLabelText('Tu autoevaluación de flexibilidad y guardia');
    fireEvent.change(slider, { target: { value: '8' } });
    await waitFor(async () => expect((await getProfile()).selfRatings).toEqual({ flexibility: 8 }));
    expect(await screen.findByText('80/100')).toBeInTheDocument();
  });
});
