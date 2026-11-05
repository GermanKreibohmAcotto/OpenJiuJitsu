import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SEED_TECHNIQUES } from '../db/seedData';
import { Landing } from './Landing';

describe('Landing', () => {
  beforeEach(() => localStorage.setItem('ojj.lang', 'es'));
  afterEach(() => {
    localStorage.setItem('ojj.lang', 'es');
    document.documentElement.lang = 'es';
  });

  it('renders a single h1 with the pitch', () => {
    render(<Landing />);
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('Entrena. Anota. Mejora.');
  });

  it('points every "open the app" link to /app/', () => {
    render(<Landing />);
    const links = screen.getAllByRole('link', { name: /^Abrir/ });
    expect(links.length).toBeGreaterThanOrEqual(2);
    for (const link of links) expect(link).toHaveAttribute('href', '/app/');
    expect(screen.getByRole('link', { name: 'Abrir la app' })).toHaveAttribute('href', '/app/');
  });

  it('shows the real technique count from the seed library', () => {
    render(<Landing />);
    const title = screen.getByRole('heading', { level: 3, name: /técnicas listas desde el primer día/ });
    expect(title).toHaveTextContent(`${SEED_TECHNIQUES.length} técnicas listas`);
  });

  it('links the in-page sections and the repository', () => {
    render(<Landing />);
    const nav = screen.getByRole('navigation', { name: 'Principal' });
    expect(within(nav).getByRole('link', { name: 'Funciones' })).toHaveAttribute('href', '#funciones');
    expect(within(nav).getByRole('link', { name: 'Preguntas' })).toHaveAttribute('href', '#faq');
    expect(within(nav).getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/GermanKreibohmAcotto/OpenJiuJitsu');
    expect(document.getElementById('funciones')).not.toBeNull();
    expect(document.getElementById('faq')).not.toBeNull();
  });

  it('switches to English, stores the language for the app and updates the document', async () => {
    const user = userEvent.setup();
    render(<Landing />);
    expect(screen.getByRole('button', { name: 'ES' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'EN' }));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Train. Log. Improve.');
    expect(screen.getByRole('link', { name: 'Open the app' })).toHaveAttribute('href', '/app/');
    expect(screen.queryByRole('link', { name: 'Abrir la app' })).toBeNull();
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'ES' })).toHaveAttribute('aria-pressed', 'false');
    expect(localStorage.getItem('ojj.lang')).toBe('en');
    expect(document.documentElement.lang).toBe('en');

    await user.click(screen.getByRole('button', { name: 'ES' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Entrena. Anota. Mejora.');
    expect(localStorage.getItem('ojj.lang')).toBe('es');
  });

  it('starts in the language stored by the app', () => {
    localStorage.setItem('ojj.lang', 'en');
    render(<Landing />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Train. Log. Improve.');
    expect(document.documentElement.lang).toBe('en');
  });

  it('takes the accent from custom properties on its root, not from the app stylesheet', () => {
    const { container } = render(<Landing />);
    const root = container.querySelector<HTMLElement>('#top')!;
    expect(root.style.getPropertyValue('--color-accent')).toBe('#ef4444');
    expect(root.style.getPropertyValue('--color-accent-ink')).toBe('#0b0d10');
  });
});
