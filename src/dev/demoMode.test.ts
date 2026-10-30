import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

async function load() {
  vi.resetModules();
  return import('./demoMode');
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllEnvs());

describe('demo mode', () => {
  it('is off by default and on when the flag is stored (DEV)', async () => {
    expect((await load()).isDemoMode()).toBe(false);
    localStorage.setItem('ojj.demo', '1');
    expect((await load()).isDemoMode()).toBe(true);
  });

  it('is always off outside DEV, even with the flag stored', async () => {
    localStorage.setItem('ojj.demo', '1');
    vi.stubEnv('DEV', false);
    expect((await load()).isDemoMode()).toBe(false);
  });

  it('picks the database name from the mode', async () => {
    const mod = await load();
    expect(mod.databaseName(false)).toBe('openjiujitsu');
    expect(mod.databaseName(true)).toBe('openjiujitsu-demo');
  });

  it('db.ts exports both names and opens the real one when demo mode is off', async () => {
    vi.resetModules();
    const mod = await import('../db/db');
    expect(mod.DB_NAME).toBe('openjiujitsu');
    expect(mod.DEMO_DB_NAME).toBe('openjiujitsu-demo');
    expect(mod.db.name).toBe('openjiujitsu');
  });

  it('db.ts opens the demo database when the flag is on', async () => {
    localStorage.setItem('ojj.demo', '1');
    vi.resetModules();
    const mod = await import('../db/db');
    expect(mod.db.name).toBe('openjiujitsu-demo');
  });
});
