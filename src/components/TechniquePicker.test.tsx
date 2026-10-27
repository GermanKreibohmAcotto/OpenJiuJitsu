import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import '../i18n';
import { SettingsProvider } from '../app/settings';
import { db } from '../db/db';
import { ensureSeeded } from '../db/seed';
import { TechniquePicker } from './TechniquePicker';

beforeEach(async () => {
  await db.delete();
  await db.open();
  await ensureSeeded();
});

describe('TechniquePicker', () => {
  it('hides excluded techniques and filters by type', async () => {
    render(
      <SettingsProvider>
        <TechniquePicker value={[]} onChange={() => {}} types={['submission']} excludeIds={['kimura-closed-guard']} mode="all" />
      </SettingsProvider>,
    );
    expect(await screen.findByRole('button', { name: /Omoplata/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Kimura desde guardia cerrada/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Escape de Kimura/ })).not.toBeInTheDocument();
  });
});
