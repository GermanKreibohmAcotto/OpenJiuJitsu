import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import '../../i18n';
import { SettingsProvider } from '../../app/settings';
import { db } from '../../db/db';
import { exportData } from '../../db/backup';
import { saveTechnique } from '../../db/techniques';
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

async function addTechnique(name: string) {
  return saveTechnique({
    name: { es: name },
    category: 'submission',
    type: 'submission',
    description: {},
    steps: [],
    media: [],
    modes: ['gi'],
    counterpartIds: [],
  });
}

function backupFile(content: string) {
  return new File([content], 'backup.json', { type: 'application/json' });
}

beforeEach(async () => {
  await db.delete();
  await db.open();
  vi.restoreAllMocks();
});

describe('settings: backup import', () => {
  it('replaces all data with a valid backup after confirmation', async () => {
    const kept = await addTechnique('Kimura');
    const backup = JSON.stringify(await exportData());
    await db.techniques.clear();
    await addTechnique('Temporal');
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderSettings();
    await userEvent.upload(screen.getByLabelText('Importar copia de seguridad'), backupFile(backup));

    expect(await screen.findByText('Datos importados correctamente.')).toBeInTheDocument();
    expect((await db.techniques.toArray()).map((t) => t.id)).toEqual([kept.id]);
  });

  it('shows the error for an invalid file and keeps stored data', async () => {
    const kept = await addTechnique('Kimura');
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderSettings();
    await userEvent.upload(screen.getByLabelText('Importar copia de seguridad'), backupFile('{"app":"other"}'));

    expect(await screen.findByRole('alert')).toHaveTextContent('El archivo no es una copia de seguridad de OpenJiuJitsu.');
    expect(confirm).not.toHaveBeenCalled();
    expect((await db.techniques.toArray()).map((t) => t.id)).toEqual([kept.id]);
  });

  it('keeps stored data when the user cancels the import', async () => {
    const kept = await addTechnique('Kimura');
    const exported = await exportData();
    const backup = JSON.stringify({ ...exported, data: { ...exported.data, techniques: [] } });
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderSettings();
    await userEvent.upload(screen.getByLabelText('Importar copia de seguridad'), backupFile(backup));

    await waitFor(() => expect(window.confirm).toHaveBeenCalled());
    expect((await db.techniques.toArray()).map((t) => t.id)).toEqual([kept.id]);
  });
});

describe('settings: language', () => {
  it('switches the interface language', async () => {
    renderSettings();
    await userEvent.selectOptions(screen.getByLabelText('Idioma'), 'en');

    expect(await screen.findByLabelText('Language')).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText('Language'), 'es');
  });
});
