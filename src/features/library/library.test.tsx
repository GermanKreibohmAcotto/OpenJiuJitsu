import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import '../../i18n';
import { SettingsProvider } from '../../app/settings';
import { db } from '../../db/db';
import { ensureSeeded } from '../../db/seed';
import { getTechnique } from '../../db/techniques';
import { LibraryRoutes } from './index';

function renderLibrary(path: string) {
  return render(
    <SettingsProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/library/*" element={<LibraryRoutes />} />
        </Routes>
      </MemoryRouter>
    </SettingsProvider>,
  );
}

beforeEach(async () => {
  localStorage.removeItem('ojj.mode');
  await db.delete();
  await db.open();
  await ensureSeeded();
});

describe('library list', () => {
  it('filters by type', async () => {
    renderLibrary('/library');
    expect(await screen.findByText('Triángulo desde guardia cerrada')).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Tipo' }), 'escape');
    expect(screen.getByText('Escape de Kimura')).toBeInTheDocument();
    expect(screen.queryByText('Triángulo desde guardia cerrada')).not.toBeInTheDocument();
  });

  it('searches ignoring accents', async () => {
    renderLibrary('/library');
    await screen.findByText('Guillotina');
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar' }), 'triangulo');
    expect(screen.getByText('Triángulo desde guardia cerrada')).toBeInTheDocument();
    expect(screen.queryByText('Guillotina')).not.toBeInTheDocument();
  });

  it('warns when a technique has no counterpart', async () => {
    await db.techniques.update('guillotine', { counterpartIds: [] });
    renderLibrary('/library');
    const row = (await screen.findByText('Guillotina')).closest('li')!;
    expect(within(row).getByText('Sin contraparte')).toBeInTheDocument();
    const linked = screen.getByText('Triángulo desde guardia cerrada').closest('li')!;
    expect(within(linked).queryByText('Sin contraparte')).not.toBeInTheDocument();
  });
});

describe('technique detail', () => {
  it('shows the heel hook as not allowed in GI and links its counterpart', async () => {
    renderLibrary('/library/inside-heel-hook');
    expect(await screen.findByRole('heading', { name: 'Heel hook interno' })).toBeInTheDocument();
    expect(screen.getAllByText(/No permitida/).length).toBeGreaterThan(0);
    const link = screen.getByRole('link', { name: /Escape de heel hook/ });
    expect(link).toHaveAttribute('href', '/library/heel-hook-escape');
  });

  it('renders YouTube media through the nocookie embed and ignores unsafe urls', async () => {
    await db.techniques.update('guillotine', {
      media: [
        { kind: 'youtube', url: 'https://youtu.be/dQw4w9WgXcQ' },
        { kind: 'image', url: 'javascript:alert(1)' },
      ],
    });
    const { container } = renderLibrary('/library/guillotine');
    await screen.findByRole('heading', { name: 'Guillotina' });
    const frame = container.querySelector('iframe');
    expect(frame).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(container.querySelector('img')).toBeNull();
  });
});

describe('technique form', () => {
  it('creates a technique linked both ways with its counterpart', async () => {
    renderLibrary('/library/new');
    await userEvent.type(await screen.findByLabelText('Nombre'), 'Mi llave');
    await userEvent.click(await screen.findByRole('button', { name: /Escape de Kimura/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(async () => {
      const created = (await db.techniques.toArray()).find((t) => t.name.es === 'Mi llave');
      expect(created?.counterpartIds).toEqual(['kimura-escape']);
    });
    const created = (await db.techniques.toArray()).find((t) => t.name.es === 'Mi llave')!;
    expect((await getTechnique('kimura-escape'))?.counterpartIds).toContain(created.id);
    expect(await screen.findByRole('heading', { name: 'Mi llave' })).toBeInTheDocument();
  });

  it('rejects non http(s) media urls', async () => {
    renderLibrary('/library/new');
    await userEvent.type(await screen.findByLabelText('Nombre'), 'Con media');
    await userEvent.click(screen.getByRole('button', { name: 'Agregar media' }));
    await userEvent.type(screen.getByLabelText('URL'), 'javascript:alert(1)');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('La URL debe empezar con http:// o https://')).toBeInTheDocument();
    expect((await db.techniques.toArray()).some((t) => t.name.es === 'Con media')).toBe(false);
  });
});

describe('position map', () => {
  it('is linked from the library list', async () => {
    renderLibrary('/library');
    const link = await screen.findByRole('link', { name: 'Mapa de posiciones' });
    expect(link).toHaveAttribute('href', '/library/map');
  });

  it('shows techniques and transitions of the selected position', async () => {
    renderLibrary('/library/map');
    await userEvent.click(await screen.findByRole('button', { name: 'Montada' }));
    const detail = await screen.findByRole('region', { name: 'Montada' });
    expect(await within(detail).findByRole('link', { name: 'Ezequiel desde la montada' })).toHaveAttribute(
      'href',
      '/library/ezekiel-mount',
    );
    expect(within(detail).getAllByRole('link', { name: /Espalda · control/ })[0]).toBeInTheDocument();
    expect(within(detail).getAllByRole('link', { name: /100 kilos/ })[0]).toBeInTheDocument();
  });

  it('reads the selected position from the url and navigates through transitions', async () => {
    renderLibrary('/library/map?pos=side_control');
    const detail = await screen.findByRole('region', { name: '100 kilos' });
    await userEvent.click(within(detail).getAllByRole('link', { name: /Montada/ })[0]);
    expect(await screen.findByRole('region', { name: 'Montada' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Montada' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('respects the global mode filter', async () => {
    await db.techniques.update('ezekiel-mount', { modes: ['gi'] });
    localStorage.setItem('ojj.mode', 'nogi');
    renderLibrary('/library/map?pos=mount');
    const detail = await screen.findByRole('region', { name: 'Montada' });
    expect(await within(detail).findByRole('link', { name: 'Escape de montada (upa)' })).toBeInTheDocument();
    expect(within(detail).queryByRole('link', { name: 'Ezequiel desde la montada' })).toBeNull();
    localStorage.removeItem('ojj.mode');
  });
});
