import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import '../../i18n';
import { SettingsProvider } from '../../app/settings';
import { db } from '../../db/db';
import { loadDemoData } from '../../dev/demoData';
import { SettingsRoutes } from '.';

function renderSettings() {
  return render(
    <SettingsProvider>
      <MemoryRouter>
        <SettingsRoutes />
      </MemoryRouter>
    </SettingsProvider>,
  );
}

beforeEach(async () => {
  await db.delete();
  await db.open();
  vi.restoreAllMocks();
});

describe('settings: demo mode (DEV)', () => {
  it('renders the switch and the real-database cleanup button while demo mode is off', async () => {
    renderSettings();
    expect(await screen.findByRole('switch', { name: 'Modo demo' })).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Quitar datos de demo de la base real' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Restablecer demo' })).not.toBeInTheDocument();
  });

  it('asks for confirmation, removes demo data and reports the count', async () => {
    await loadDemoData();
    const demoRecords =
      (await db.plans.count()) + (await db.sessions.count()) + (await db.matches.count()) +
      (await db.graduations.count()) + (await db.injuries.count());
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderSettings();
    await userEvent.click(await screen.findByRole('button', { name: 'Quitar datos de demo de la base real' }));

    expect(confirm).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(`Se quitaron ${demoRecords} registros de demo.`)).toBeInTheDocument();
    expect(await db.plans.count()).toBe(0);
    expect(await db.sessions.count()).toBe(0);
  });

  it('leaves data unchanged when the confirmation is cancelled', async () => {
    await loadDemoData();
    const plans = await db.plans.count();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderSettings();
    await userEvent.click(await screen.findByRole('button', { name: 'Quitar datos de demo de la base real' }));

    expect(await db.plans.count()).toBe(plans);
    expect(await db.profile.get('me')).toMatchObject({ name: 'Alex Silva' });
    expect(screen.queryByText(/Se quitaron/)).not.toBeInTheDocument();
  });
});
