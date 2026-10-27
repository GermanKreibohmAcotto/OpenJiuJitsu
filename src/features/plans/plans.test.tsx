import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import '../../i18n';
import { SettingsProvider } from '../../app/settings';
import { db } from '../../db/db';
import { getPlan, listPlans, savePlan } from '../../db/plans';
import { ensureSeeded } from '../../db/seed';
import { PlansRoutes } from './index';

function renderAt(path: string) {
  return render(
    <SettingsProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/plans/*" element={<PlansRoutes />} />
        </Routes>
      </MemoryRouter>
    </SettingsProvider>,
  );
}

beforeEach(async () => {
  await db.delete();
  await db.open();
  await ensureSeeded();
});

describe('plan builder', () => {
  it('builds and stores a plan through the non-drag fallback', async () => {
    const user = userEvent.setup({ delay: null });
    renderAt('/plans/new');

    await user.type(screen.getByLabelText('Nombre del plan'), 'Martes de pasajes');
    await user.type(screen.getByLabelText('Nuevo objetivo'), 'Mejorar la presión de hombro');
    await user.click(screen.getByRole('button', { name: 'Agregar objetivo' }));

    await user.type(screen.getByLabelText('Título del bloque nuevo'), 'Drills');
    await user.clear(screen.getByLabelText('Minutos del bloque nuevo'));
    await user.type(screen.getByLabelText('Minutos del bloque nuevo'), '15');
    await user.click(screen.getByRole('button', { name: 'Agregar bloque' }));

    const block = await screen.findByRole('group', { name: 'Bloque 1' });
    await user.click(within(block).getByRole('button', { name: 'Agregar técnica' }));
    await user.type(within(block).getByRole('searchbox'), 'Puente');
    const option = await within(block).findByRole('option', { name: /Puente/ });
    await user.click(within(option).getByRole('button'));
    expect(within(block).getByRole('button', { name: 'Quitar técnica: Puente' })).toBeInTheDocument();

    expect(screen.getByText('15 min', { selector: '[data-testid="total"]' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Guardar plan' }));

    await waitFor(async () => expect(await listPlans()).toHaveLength(1));
    const plans = await listPlans();
    const stored = (await getPlan(plans[0].id))!;
    expect(stored.name).toBe('Martes de pasajes');
    expect(stored.objectives).toEqual(['Mejorar la presión de hombro']);
    expect(stored.blocks).toHaveLength(1);
    expect(stored.blocks[0]).toMatchObject({ title: 'Drills', minutes: 15, techniqueIds: ['bridge-drill'] });
  });

  it('loads the example template as three blocks', async () => {
    const user = userEvent.setup({ delay: null });
    renderAt('/plans/new');
    await user.click(await screen.findByRole('button', { name: 'Usar plantilla de ejemplo' }));
    expect(await screen.findByRole('group', { name: 'Bloque 3' })).toBeInTheDocument();
    expect(screen.getByTestId('total')).toHaveTextContent('65 min');
  });

  it('reorders blocks with the move buttons', async () => {
    const user = userEvent.setup({ delay: null });
    renderAt('/plans/new');
    await user.click(await screen.findByRole('button', { name: 'Usar plantilla de ejemplo' }));
    await user.click(await screen.findByRole('button', { name: 'Bajar bloque 1' }));
    expect(screen.getByLabelText('Título (bloque 2)')).toHaveValue('Drills de cadera');
  });
});

describe('plan index and detail', () => {
  it('lists, duplicates and shows the detail with a journal link', async () => {
    const user = userEvent.setup({ delay: null });
    const plan = await savePlan({
      name: 'Plan A',
      mode: 'gi',
      objectives: ['Uno', 'Dos'],
      blocks: [{ id: 'b1', kind: 'drill', title: 'Calentar', minutes: 12, techniqueIds: ['bridge-drill', 'gone'] }],
    });
    renderAt('/plans');
    expect(await screen.findByText('Plan A')).toBeInTheDocument();
    expect(screen.getByText('12 min')).toBeInTheDocument();
    expect(screen.getByText('2 objetivos')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Duplicar Plan A' }));
    expect(await screen.findByText('Plan A (copia)')).toBeInTheDocument();
    expect(await listPlans()).toHaveLength(2);
    expect(plan.id).toBeTruthy();
  });

  it('renders the read-only detail', async () => {
    const plan = await savePlan({
      name: 'Plan B',
      mode: 'nogi',
      objectives: ['Salir de la montada'],
      blocks: [{ id: 'b1', kind: 'drill', title: 'Calentar', minutes: 12, techniqueIds: ['bridge-drill', 'gone'] }],
    });
    renderAt(`/plans/${plan.id}`);
    expect(await screen.findByText('Salir de la montada')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Puente' })).toHaveAttribute('href', '/library/bridge-drill');
    expect(screen.getByText('Técnica eliminada')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Registrar esta sesión' })).toHaveAttribute(
      'href',
      `/journal/new?planId=${plan.id}`,
    );
  });
});
