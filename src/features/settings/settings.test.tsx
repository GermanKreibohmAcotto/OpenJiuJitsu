import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

  it('changes the main color from a preset or the color picker and remembers it', async () => {
    const user = userEvent.setup();
    localStorage.removeItem('ojj.accent');
    renderSettings();

    await user.click(await screen.findByRole('radio', { name: 'Azul' }));
    expect(screen.getByRole('radio', { name: 'Azul' })).toBeChecked();
    expect(document.documentElement.style.getPropertyValue('--color-accent')).toBe('#3b82f6');
    expect(localStorage.getItem('ojj.accent')).toBe('#3b82f6');

    fireEvent.change(screen.getByLabelText('Elegir cualquier color'), { target: { value: '#12ab34' } });
    expect(document.documentElement.style.getPropertyValue('--color-accent')).toBe('#12ab34');
    expect(localStorage.getItem('ojj.accent')).toBe('#12ab34');
    for (const radio of screen.getAllByRole('radio', { name: /Lima|Rojo|Naranja|Ámbar|Cian|Azul|Violeta|Rosa/ })) {
      expect(radio).not.toBeChecked();
    }

    await user.click(screen.getByRole('radio', { name: 'Rojo' }));
    expect(document.documentElement.style.getPropertyValue('--color-accent')).toBe('');
    localStorage.removeItem('ojj.accent');
  });

  it('can follow the belt in the profile and returns to manual when a color is picked', async () => {
    const user = userEvent.setup();
    localStorage.removeItem('ojj.accent');
    localStorage.removeItem('ojj.accentSource');
    await db.profile.put({ id: 'me', name: '', academy: '', belt: 'purple', stripes: 0 });
    renderSettings();

    await user.click(await screen.findByRole('radio', { name: 'Según mi cinturón' }));
    expect(screen.getByRole('radio', { name: 'Según mi cinturón' })).toBeChecked();
    expect(document.documentElement.style.getPropertyValue('--color-accent')).toBe('#a855f7');
    expect(localStorage.getItem('ojj.accentSource')).toBe('belt');
    expect(screen.getByRole('radio', { name: 'Rojo' })).not.toBeChecked();

    await db.profile.put({ id: 'me', name: '', academy: '', belt: 'brown', stripes: 0 });
    await waitFor(() => expect(document.documentElement.style.getPropertyValue('--color-accent')).toBe('#c2813b'));

    await user.click(screen.getByRole('radio', { name: 'Lima' }));
    expect(screen.getByRole('radio', { name: 'Según mi cinturón' })).not.toBeChecked();
    expect(document.documentElement.style.getPropertyValue('--color-accent')).toBe('#a3e635');
    expect(localStorage.getItem('ojj.accentSource')).toBe('manual');

    localStorage.removeItem('ojj.accent');
    localStorage.removeItem('ojj.accentSource');
  });
});
