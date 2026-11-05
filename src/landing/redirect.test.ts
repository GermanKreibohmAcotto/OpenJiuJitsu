import { describe, expect, it } from 'vitest';
import { appRedirectTarget } from './redirect';

describe('appRedirectTarget', () => {
  it('moves legacy hash routes to the app and keeps the hash', () => {
    expect(appRedirectTarget('#/journal', false)).toBe('/app/#/journal');
    expect(appRedirectTarget('#/library/triangle-closed-guard', false)).toBe('/app/#/library/triangle-closed-guard');
  });

  it('does not redirect a plain or empty hash', () => {
    expect(appRedirectTarget('', false)).toBeNull();
    expect(appRedirectTarget('#', false)).toBeNull();
  });

  it('does not redirect landing anchors', () => {
    expect(appRedirectTarget('#funciones', false)).toBeNull();
    expect(appRedirectTarget('#faq', false)).toBeNull();
  });

  it('sends an installed PWA launch (standalone) to the app', () => {
    expect(appRedirectTarget('', true)).toBe('/app/');
    expect(appRedirectTarget('#funciones', true)).toBe('/app/');
  });

  it('keeps the hash of a legacy route even when standalone', () => {
    expect(appRedirectTarget('#/plans', true)).toBe('/app/#/plans');
  });
});
