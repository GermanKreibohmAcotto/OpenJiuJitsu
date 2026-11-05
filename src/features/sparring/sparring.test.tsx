import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import '../../i18n';
import { SettingsProvider } from '../../app/settings';
import { db } from '../../db/db';
import { listMatches } from '../../db/matches';
import { ensureSeeded } from '../../db/seed';
import { listSessions } from '../../db/sessions';
import { SparringRoutes } from '.';

function renderSparring() {
  return render(
    <SettingsProvider>
      <MemoryRouter initialEntries={['/sparring']}>
        <Routes>
          <Route path="/sparring/*" element={<SparringRoutes />} />
        </Routes>
      </MemoryRouter>
    </SettingsProvider>,
  );
}

async function startMatch(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Iniciar combate' }));
}

beforeEach(async () => {
  localStorage.removeItem('ojj.mode');
  await db.delete();
  await db.open();
  await ensureSeeded();
});

describe('sparring mini-app', () => {
  it('scores points, supports undo and saves a match won on points', async () => {
    const user = userEvent.setup();
    renderSparring();
    expect(screen.getByLabelText('Atleta 1')).toHaveValue('Yo');
    expect(screen.getByLabelText('Atleta 2')).toHaveValue('Compañero');
    await startMatch(user);

    await user.click(screen.getByRole('button', { name: 'Yo: Derribo (+2)' }));
    await user.click(screen.getByRole('button', { name: 'Yo: Montada (+4)' }));
    await user.click(screen.getByRole('button', { name: 'Compañero: Pasaje de guardia (+3)' }));
    await user.click(screen.getByRole('button', { name: 'Compañero: Ventaja' }));
    expect(screen.getByTestId('points-0')).toHaveTextContent('6');
    expect(screen.getByTestId('points-1')).toHaveTextContent('3');

    await user.click(screen.getByRole('button', { name: 'Deshacer último evento' }));
    expect(screen.getByTestId('advantages-1')).toHaveTextContent('0');
    await user.click(screen.getByRole('button', { name: 'Yo: Penalización' }));

    await user.click(screen.getByRole('button', { name: 'Terminar combate' }));
    expect(screen.getByText('Gana Yo por puntos')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Guardar combate' }));

    await waitFor(async () => expect(await listMatches()).toHaveLength(1));
    const [match] = await listMatches();
    expect(match).toMatchObject({ method: 'points', winner: 0, mode: 'gi' });
    expect(match.athletes[0]).toEqual({ name: 'Yo', points: 6, advantages: 0, penalties: 1 });
    expect(match.events).toEqual([
      { athlete: 0, kind: 'takedown' },
      { athlete: 0, kind: 'mount' },
      { athlete: 1, kind: 'guardPass' },
      { athlete: 0, kind: 'penalty' },
    ]);
    expect(match.athletes[1]).toEqual({ name: 'Compañero', points: 3, advantages: 0, penalties: 0 });
    expect(await listSessions()).toHaveLength(0);
    expect(await screen.findByText(/Ganador: Yo/)).toBeInTheDocument();
  });

  it('finishes by submission and records it in the journal as achieved', async () => {
    const user = userEvent.setup();
    renderSparring();
    await startMatch(user);
    await user.click(screen.getByRole('button', { name: 'Terminar combate' }));
    await user.click(screen.getByRole('radio', { name: 'Por sumisión' }));
    await user.click(screen.getByRole('radio', { name: 'Yo' }));
    await user.click(within(await screen.findByRole('option', { name: /Kimura desde guardia cerrada/ })).getByRole('button'));
    await user.click(screen.getByRole('button', { name: 'Guardar combate' }));

    await waitFor(async () => expect(await listMatches()).toHaveLength(1));
    const [match] = await listMatches();
    const kimura = await db.techniques.filter((t) => t.name.es === 'Kimura desde guardia cerrada').first();
    expect(match).toMatchObject({ method: 'submission', winner: 0, submissionId: kimura?.id });
    const [session] = await listSessions();
    expect(session.subsAchieved).toEqual([kimura?.id]);
    expect(session.subsSuffered).toEqual([]);
    expect(session.sparringRounds).toBe(1);
  });

  it('records a suffered submission and skips the journal when unchecked', async () => {
    const user = userEvent.setup();
    renderSparring();
    await startMatch(user);
    await user.click(screen.getByRole('button', { name: 'Terminar combate' }));
    await user.click(screen.getByRole('radio', { name: 'Por sumisión' }));
    await user.click(screen.getByRole('radio', { name: 'Compañero' }));
    await user.click(within(await screen.findByRole('option', { name: /Triángulo desde guardia cerrada/ })).getByRole('button'));
    await user.click(screen.getByRole('button', { name: 'Guardar combate' }));
    await waitFor(async () => expect(await listSessions()).toHaveLength(1));
    expect((await listSessions())[0].subsSuffered).toHaveLength(1);
    expect((await listMatches())[0].winner).toBe(1);

    await startMatch(user);
    await user.click(screen.getByRole('button', { name: 'Terminar combate' }));
    await user.click(screen.getByRole('radio', { name: 'Por sumisión' }));
    await user.click(screen.getByRole('radio', { name: 'Yo' }));
    await user.click(within(await screen.findByRole('option', { name: /Kimura desde guardia cerrada/ })).getByRole('button'));
    await user.click(screen.getByRole('checkbox', { name: 'Guardar en la bitácora' }));
    await user.click(screen.getByRole('button', { name: 'Guardar combate' }));
    await waitFor(async () => expect(await listMatches()).toHaveLength(2));
    expect((await listSessions())[0].subsAchieved).toEqual([]);
  });

  it('records which takedown it was, shows it in the detail and logs it in the journal', async () => {
    const user = userEvent.setup();
    renderSparring();
    await startMatch(user);
    await user.click(screen.getByRole('button', { name: 'Yo: Derribo (+2)' }));
    await user.click(screen.getByRole('button', { name: 'Compañero: Derribo (+2)' }));
    await user.click(screen.getByRole('button', { name: 'Terminar combate' }));

    await user.selectOptions(await screen.findByRole('combobox', { name: /Derribo 1 de Yo/ }), 'double-leg');
    await user.selectOptions(screen.getByRole('combobox', { name: /Derribo 1 de Compañero/ }), 'uchi-mata');
    await user.click(screen.getByRole('button', { name: 'Guardar combate' }));

    await waitFor(async () => expect(await listMatches()).toHaveLength(1));
    const [match] = await listMatches();
    expect(match.events).toEqual([
      { athlete: 0, kind: 'takedown', techniqueId: 'double-leg' },
      { athlete: 1, kind: 'takedown', techniqueId: 'uchi-mata' },
    ]);
    await waitFor(async () => expect(await listSessions()).toHaveLength(1));
    const [session] = await listSessions();
    expect(session.takedownsAchieved).toEqual(['double-leg']);
    expect(session.takedownsSuffered).toEqual(['uchi-mata']);
    expect(session.sparringRounds).toBe(0);

    await user.click(await screen.findByRole('link', { name: 'Ver detalle' }));
    expect(await screen.findByRole('link', { name: '(Doble pierna)' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '(Uchi-mata)' })).toBeInTheDocument();
  });

  it('saves a takedown without technique and leaves the journal alone', async () => {
    const user = userEvent.setup();
    renderSparring();
    await startMatch(user);
    await user.click(screen.getByRole('button', { name: 'Yo: Derribo (+2)' }));
    await user.click(screen.getByRole('button', { name: 'Terminar combate' }));
    await user.click(screen.getByRole('button', { name: 'Guardar combate' }));

    await waitFor(async () => expect(await listMatches()).toHaveLength(1));
    expect((await listMatches())[0].events).toEqual([{ athlete: 0, kind: 'takedown' }]);
    expect(await listSessions()).toHaveLength(0);
  });

  it('opens the detail of a saved match from the history', async () => {
    const user = userEvent.setup();
    await db.matches.add({
      id: 'm2',
      date: '2026-10-25',
      mode: 'nogi',
      durationSec: 305,
      athletes: [
        { name: 'Yo', points: 0, advantages: 0, penalties: 0 },
        { name: 'Marco', points: 0, advantages: 0, penalties: 1 },
      ],
      winner: 0,
      method: 'submission',
      submissionId: 'kimura-closed-guard',
      createdAt: '2026-10-25T10:00:00.000Z',
    });
    renderSparring();
    await user.click(await screen.findByRole('link', { name: 'Ver detalle' }));
    expect(await screen.findByText('Duración 5:05')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Kimura desde guardia cerrada/ })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Marco' })).toBeInTheDocument();
    expect(screen.getByText('No se guardó el registro de puntos de este combate.')).toBeInTheDocument();
  });

  it('lists the scoring actions of a match in the detail', async () => {
    const user = userEvent.setup();
    await db.matches.add({
      id: 'm3',
      date: '2026-10-25',
      mode: 'nogi',
      durationSec: 300,
      athletes: [
        { name: 'Yo', points: 6, advantages: 1, penalties: 0 },
        { name: 'Marco', points: 0, advantages: 0, penalties: 0 },
      ],
      winner: 0,
      method: 'points',
      events: [
        { athlete: 0, kind: 'takedown' },
        { athlete: 0, kind: 'advantage' },
        { athlete: 0, kind: 'guardPass' },
        { athlete: 0, kind: 'sweep' },
      ],
      createdAt: '2026-10-25T10:00:00.000Z',
    });
    renderSparring();
    await user.click(await screen.findByRole('link', { name: 'Ver detalle' }));
    const log = await screen.findByRole('list');
    const items = within(log).getAllByRole('listitem');
    expect(items).toHaveLength(4);
    expect(items[0]).toHaveTextContent('Yo · Derribo+2');
    expect(items[1]).toHaveTextContent('Yo · Ventaja');
    expect(items[2]).toHaveTextContent('Yo · Pasaje de guardia+3');
    expect(items[3]).toHaveTextContent('Yo · Raspaje+2');
  });

  it('deletes a match from the history after confirmation', async () => {
    const user = userEvent.setup();
    await db.matches.add({
      id: 'm1',
      date: '2026-10-26',
      mode: 'gi',
      durationSec: 300,
      athletes: [
        { name: 'Yo', points: 2, advantages: 0, penalties: 0 },
        { name: 'Compañero', points: 0, advantages: 0, penalties: 0 },
      ],
      winner: 0,
      method: 'points',
      createdAt: '2026-10-26T10:00:00.000Z',
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderSparring();
    const row = await screen.findByRole('listitem');
    expect(within(row).getByText(/Ganador: Yo/)).toBeInTheDocument();
    await user.click(within(row).getByRole('button', { name: 'Eliminar combate' }));
    await waitFor(async () => expect(await listMatches()).toHaveLength(0));
  });
});

describe('standalone round timer', () => {
  it('shows the mode tabs on both pages with the current one selected', async () => {
    const user = userEvent.setup();
    renderSparring();
    expect(screen.getByRole('link', { name: 'Combate' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Solo temporizador' })).not.toHaveAttribute('aria-current');
    await user.click(screen.getByRole('link', { name: 'Solo temporizador' }));
    await screen.findByRole('timer');
    expect(screen.getByRole('link', { name: 'Solo temporizador' })).toHaveAttribute('aria-current', 'page');
    await user.click(screen.getByRole('link', { name: 'Combate' }));
    expect(await screen.findByRole('button', { name: 'Iniciar combate' })).toBeInTheDocument();
  });


  it('is reachable from the sparring setup and renders the timer page', async () => {
    const user = userEvent.setup();
    renderSparring();
    await user.click(screen.getByRole('link', { name: 'Solo temporizador' }));
    expect(await screen.findByRole('timer')).toHaveTextContent('05:00');
    expect(screen.getByRole('button', { name: 'Iniciar' })).toBeInTheDocument();
    expect(screen.queryByTestId('points-0')).not.toBeInTheDocument();
  });

  it('uses the configured round length', async () => {
    const user = userEvent.setup();
    renderSparring();
    await user.click(screen.getByRole('link', { name: 'Solo temporizador' }));
    const minutes = await screen.findByLabelText('Minutos por round');
    await user.clear(minutes);
    await user.type(minutes, '3');
    expect(screen.getByRole('timer')).toHaveTextContent('03:00');
  });
});
