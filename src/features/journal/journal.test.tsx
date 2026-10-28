import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import '../../i18n';
import { SettingsProvider } from '../../app/settings';
import { db } from '../../db/db';
import { savePlan } from '../../db/plans';
import { ensureSeeded } from '../../db/seed';
import { listSessions, saveSession, type SessionInput } from '../../db/sessions';
import { JournalRoutes } from './index';

function renderAt(path: string) {
  return render(
    <SettingsProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/journal/*" element={<JournalRoutes />} />
          <Route path="*" element={<p>elsewhere</p>} />
        </Routes>
      </MemoryRouter>
    </SettingsProvider>,
  );
}

const baseSession: SessionInput = {
  date: '2026-10-20',
  durationMin: 60,
  mode: 'gi',
  physicalDifficulty: 5,
  technicalDifficulty: 5,
  feelings: [],
  sparringRounds: 0,
  subsAchieved: [],
  subsSuffered: [],
  notes: '',
};

const NOTES_PLACEHOLDER = 'ej. esconder más el codo en la americana';

async function pickSubmission(groupName: string, optionName: RegExp) {
  const group = await screen.findByRole('group', { name: groupName });
  const option = await within(group).findByRole('option', { name: optionName });
  fireEvent.click(within(option).getByRole('button'));
}

beforeEach(async () => {
  await db.delete();
  await db.open();
  await ensureSeeded();
});

describe('journal form', () => {
  it('stores a session with difficulty, feelings and counted submissions', async () => {
    renderAt('/journal/new');
    fireEvent.change(await screen.findByLabelText(/Dificultad física/), { target: { value: '7' } });
    fireEvent.change(screen.getByLabelText(/Dificultad técnica/), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Fluido' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fuerte' }));
    fireEvent.change(screen.getByLabelText('Otra sensación'), { target: { value: 'inspirado' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar sensación' }));
    fireEvent.change(screen.getByLabelText('Rounds de sparring'), { target: { value: '5' } });
    await pickSubmission('Sumisiones logradas', /Americana/);
    fireEvent.click(screen.getByRole('button', { name: /Una más: Americana/ }));
    await pickSubmission('Sumisiones sufridas', /Mata león/);
    fireEvent.change(screen.getByPlaceholderText(NOTES_PLACEHOLDER), { target: { value: 'esconder el codo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(async () => expect(await listSessions()).toHaveLength(1));
    const [saved] = await listSessions();
    expect(saved).toMatchObject({
      physicalDifficulty: 7,
      technicalDifficulty: 4,
      feelings: ['fluid', 'strong', 'inspirado'],
      sparringRounds: 5,
      subsAchieved: ['americana-side-control', 'americana-side-control'],
      subsSuffered: ['rear-naked-choke'],
      notes: 'esconder el codo',
      mode: 'gi',
    });
    await screen.findByText('Detalles de oro');
  });

  it('stores takedowns landed and taken, and shows them in the detail', async () => {
    renderAt('/journal/new');
    await pickSubmission('Derribos logrados', /Doble pierna/);
    await pickSubmission('Derribos recibidos', /Uchi-mata/);
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(async () => expect(await listSessions()).toHaveLength(1));
    const [session] = await listSessions();
    expect(session.takedownsAchieved).toEqual(['double-leg']);
    expect(session.takedownsSuffered).toEqual(['uchi-mata']);
    expect(session.subsAchieved).toEqual([]);

    const detail = await screen.findByRole('heading', { name: 'Derribos logrados' });
    expect(await within(detail.closest('section')!).findByRole('link', { name: 'Doble pierna' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Uchi-mata' })).toBeInTheDocument();
  });

  it('shows sessions saved before takedowns were tracked with empty takedown counts', async () => {
    await saveSession(baseSession);
    renderAt('/journal');
    expect(await screen.findByText('Derribos logrados: 0')).toBeInTheDocument();
    expect(screen.getByText('Derribos recibidos: 0')).toBeInTheDocument();
  });

  it('prefills duration, mode and plan from ?planId=', async () => {
    const plan = await savePlan({
      name: 'Pasajes y rolada',
      mode: 'nogi',
      objectives: [],
      blocks: [
        { id: 'a', kind: 'drill', title: 'Drills', minutes: 15, techniqueIds: [] },
        { id: 'b', kind: 'technique', title: 'Pasajes', minutes: 20, techniqueIds: [] },
        { id: 'c', kind: 'sparring', title: 'Rolada', minutes: 30, techniqueIds: [] },
      ],
    });
    renderAt(`/journal/new?planId=${plan.id}`);
    await waitFor(() => expect(screen.getByLabelText('Duración (minutos)')).toHaveValue(65));
    expect(screen.getByRole('radio', { name: 'NoGI' })).toHaveAttribute('aria-checked', 'true');
    await waitFor(() => expect(screen.getByLabelText('Plan seguido')).toHaveValue(plan.id));
  });

  it('shows the validation message and keeps the input when the date is invalid', async () => {
    renderAt('/journal/new');
    const notes = await screen.findByPlaceholderText(NOTES_PLACEHOLDER);
    fireEvent.change(notes, { target: { value: 'no perder esto' } });
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Ingresar una fecha válida.');
    expect(notes).toHaveValue('no perder esto');
    expect(await listSessions()).toHaveLength(0);
  });

  it('edits an existing session', async () => {
    const session = await saveSession({ ...baseSession, notes: 'viejo' });
    renderAt(`/journal/${session.id}/edit`);
    const notes = await screen.findByDisplayValue('viejo');
    fireEvent.change(notes, { target: { value: 'nuevo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(async () => expect((await listSessions())[0].notes).toBe('nuevo'));
    expect(await listSessions()).toHaveLength(1);
  });
});

describe('journal list', () => {
  it('lists sessions newest first with plan name and counts', async () => {
    const plan = await savePlan({ name: 'Plan de guardia', mode: 'gi', objectives: [], blocks: [] });
    await saveSession({ ...baseSession, date: '2026-10-01' });
    await saveSession({
      ...baseSession,
      date: '2026-10-25',
      planId: plan.id,
      feelings: ['fluid'],
      subsAchieved: ['americana-side-control', 'americana-side-control'],
      subsSuffered: ['rear-naked-choke'],
    });
    await saveSession({ ...baseSession, date: '2026-10-10' });
    const { container } = renderAt('/journal');
    await screen.findByText('Plan: Plan de guardia');
    const dates = [...container.querySelectorAll('time')].map((el) => el.getAttribute('datetime'));
    expect(dates).toEqual(['2026-10-25', '2026-10-10', '2026-10-01']);
    expect(screen.getByText('Fluido')).toBeInTheDocument();
    expect(screen.getByText('Logradas: 2')).toBeInTheDocument();
    expect(screen.getByText('Sufridas: 1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nueva sesión' })).toHaveAttribute('href', '/journal/new');
  });
});

describe('journal detail', () => {
  it('renders notes and links to the plan and submissions', async () => {
    const plan = await savePlan({ name: 'Plan X', mode: 'gi', objectives: [], blocks: [] });
    const session = await saveSession({
      ...baseSession,
      planId: plan.id,
      notes: 'esconder más el codo en la americana',
      subsAchieved: ['americana-side-control', 'americana-side-control'],
      subsSuffered: ['ghost-technique'],
    });
    renderAt(`/journal/${session.id}`);
    expect(await screen.findByText('esconder más el codo en la americana')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Plan X' })).toHaveAttribute('href', `/plans/${plan.id}`);
    expect(await screen.findByRole('link', { name: /Americana/ })).toHaveAttribute('href', '/library/americana-side-control');
    expect(screen.getByText('×2')).toBeInTheDocument();
    expect(screen.getByText('Técnica eliminada')).toBeInTheDocument();
  });

  it('deletes after confirmation', async () => {
    const session = await saveSession(baseSession);
    renderAt(`/journal/${session.id}`);
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar' }));
    expect(await listSessions()).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: '¿Eliminar definitivamente?' }));
    await waitFor(async () => expect(await listSessions()).toHaveLength(0));
  });
});
