import { afterEach, describe, expect, it, vi } from 'vitest';
import { newId } from './ids';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

afterEach(() => vi.unstubAllGlobals());

describe('newId', () => {
  it('returns a v4 UUID', () => {
    expect(newId()).toMatch(UUID_V4);
  });

  // Over plain http on a LAN address (e.g. a phone opening the dev server) the page is not a
  // secure context and browsers do not expose crypto.randomUUID.
  it('still returns unique v4 UUIDs when crypto.randomUUID is unavailable', () => {
    vi.stubGlobal('crypto', { getRandomValues: globalThis.crypto.getRandomValues.bind(globalThis.crypto) });

    const ids = Array.from({ length: 50 }, newId);

    ids.forEach((id) => expect(id).toMatch(UUID_V4));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
