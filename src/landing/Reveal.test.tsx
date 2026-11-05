import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Landing } from './Landing';
import { Reveal } from './Reveal';

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;

let observers: { callback: Callback; options?: IntersectionObserverInit; observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }[];

function mockObserver() {
  observers = [];
  class FakeObserver {
    observe = vi.fn();
    disconnect = vi.fn();
    constructor(
      public callback: Callback,
      public options?: IntersectionObserverInit,
    ) {
      observers.push(this);
    }
  }
  vi.stubGlobal('IntersectionObserver', FakeObserver);
}

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: reduce && query.includes('prefers-reduced-motion'), media: query }));
}

describe('Reveal', () => {
  beforeEach(() => mockReducedMotion(false));
  afterEach(() => vi.unstubAllGlobals());

  it('starts hidden, reveals once the observer reports intersection and stays revealed', () => {
    mockObserver();
    render(<Reveal>Block</Reveal>);
    const el = screen.getByText('Block');
    expect(el).toHaveAttribute('data-reveal', 'hidden');
    expect(observers).toHaveLength(1);
    expect(observers[0].options?.threshold).toBeCloseTo(0.15);

    act(() => observers[0].callback([{ isIntersecting: false }]));
    expect(el).toHaveAttribute('data-reveal', 'hidden');

    act(() => observers[0].callback([{ isIntersecting: true }]));
    expect(el).toHaveAttribute('data-reveal', 'shown');
    expect(observers[0].disconnect).toHaveBeenCalled();

    act(() => observers[0].callback([{ isIntersecting: false }]));
    expect(el).toHaveAttribute('data-reveal', 'shown');
  });

  it('exposes the stagger delay and variant to the styles', () => {
    mockObserver();
    render(
      <Reveal delay={140} variant="left">
        Block
      </Reveal>,
    );
    const el = screen.getByText('Block');
    expect(el.style.getPropertyValue('--reveal-delay')).toBe('140ms');
    expect(el).toHaveAttribute('data-variant', 'left');
  });

  it('is revealed immediately when IntersectionObserver is unavailable', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    render(<Reveal>Block</Reveal>);
    expect(screen.getByText('Block')).toHaveAttribute('data-reveal', 'shown');
  });

  it('is revealed immediately, without observing, when reduced motion is requested', () => {
    mockObserver();
    mockReducedMotion(true);
    render(<Reveal>Block</Reveal>);
    expect(screen.getByText('Block')).toHaveAttribute('data-reveal', 'shown');
    expect(observers).toHaveLength(0);
  });

  it('reveals a hidden element when focus lands inside it', async () => {
    mockObserver();
    const user = userEvent.setup();
    render(
      <Reveal data-testid="box">
        <a href="#x">Link</a>
      </Reveal>,
    );
    expect(screen.getByTestId('box')).toHaveAttribute('data-reveal', 'hidden');
    await user.tab();
    expect(screen.getByRole('link', { name: 'Link' })).toHaveFocus();
    expect(screen.getByTestId('box')).toHaveAttribute('data-reveal', 'shown');
    expect(observers[0].disconnect).toHaveBeenCalled();
  });

  it('only observes HTML elements on the landing, never SVG shapes that mobile browsers may not report', () => {
    mockObserver();
    render(<Landing />);
    const targets = observers.flatMap((o) => o.observe.mock.calls.map(([target]) => target as Element));
    expect(targets.length).toBeGreaterThan(0);
    expect(targets.filter((target) => target instanceof SVGElement).map((target) => target.tagName)).toEqual([]);
  });
});
