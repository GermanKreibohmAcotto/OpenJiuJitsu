import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import '../../i18n';
import { SettingsProvider } from '../../app/settings';
import { db } from '../../db/db';
import { InjuriesRoutes } from './index';

function renderAt(path: string) {
  return render(
    <SettingsProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/injuries/*" element={<InjuriesRoutes />} />
          <Route path="*" element={<p>elsewhere</p>} />
        </Routes>
      </MemoryRouter>
    </SettingsProvider>,
  );
}

beforeEach(async () => {
  await db.delete();
  await db.open();
});

const rows = () => screen.getAllByRole('listitem');

describe('injury log', () => {
  it('creates an injury and shows it in the list', async () => {
    renderAt('/injuries/new');
    fireEvent.change(await screen.findByLabelText('Zona del cuerpo'), { target: { value: 'knee' } });
    fireEvent.change(screen.getByLabelText(/Intensidad/), { target: { value: '7' } });
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2026-10-20' } });
    fireEvent.change(screen.getByLabelText('Notas'), { target: { value: 'menisco' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('menisco')).toBeTruthy();
    const stored = await db.injuries.toArray();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ zone: 'knee', intensity: 7, date: '2026-10-20', notes: 'menisco', status: 'active' });
  });

  it('moves a recovered injury after the active ones and back', async () => {
    const base = { intensity: 4, notes: '', createdAt: 'x', updatedAt: 'x' } as const;
    await db.injuries.bulkPut([
      { ...base, id: 'a', zone: 'knee', date: '2026-10-10', status: 'active' },
      { ...base, id: 'b', zone: 'shoulder', date: '2026-10-01', status: 'active' },
    ]);
    renderAt('/injuries');
    await screen.findAllByRole('listitem');
    expect(within(rows()[0]).getByText('Rodilla')).toBeTruthy();

    fireEvent.click(within(rows()[0]).getByRole('button', { name: 'Marcar recuperada' }));

    await waitFor(() => expect(within(rows()[0]).getByText('Hombro')).toBeTruthy());
    expect(within(rows()[1]).getByText('Rodilla')).toBeTruthy();
    expect((await db.injuries.get('a'))?.status).toBe('recovered');

    fireEvent.click(within(rows()[1]).getByRole('button', { name: 'Marcar activa' }));
    await waitFor(() => expect(within(rows()[0]).getByText('Rodilla')).toBeTruthy());
  });

  it('edits an injury', async () => {
    await db.injuries.put({ id: 'a', zone: 'knee', intensity: 4, date: '2026-10-10', notes: '', status: 'active', createdAt: 'x', updatedAt: 'x' });
    renderAt('/injuries');
    fireEvent.click(await screen.findByRole('link', { name: 'Editar' }));
    fireEvent.change(await screen.findByLabelText('Zona del cuerpo'), { target: { value: 'elbow' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('Codo')).toBeTruthy();
    expect((await db.injuries.get('a'))?.zone).toBe('elbow');
    expect(await db.injuries.count()).toBe(1);
  });

  it('deletes an injury only after confirming', async () => {
    await db.injuries.put({ id: 'a', zone: 'knee', intensity: 4, date: '2026-10-10', notes: '', status: 'active', createdAt: 'x', updatedAt: 'x' });
    renderAt('/injuries');
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar' }));
    expect(await db.injuries.count()).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: '¿Eliminar definitivamente?' }));

    await waitFor(async () => expect(await db.injuries.count()).toBe(0));
    expect(await screen.findByText(/Todavía no hay lesiones/)).toBeTruthy();
  });
});
