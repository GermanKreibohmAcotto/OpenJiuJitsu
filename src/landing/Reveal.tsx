import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react';

export type RevealState = 'hidden' | 'shown';
export type RevealVariant = 'up' | 'left' | 'right' | 'scale' | 'grow' | 'pop' | 'meter';

/** Hidden styles only make sense when something will lift them again. */
function canAnimate(): boolean {
  if (typeof IntersectionObserver === 'undefined') return false;
  return !(typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
}

/**
 * Scroll reveal state. It stays `undefined` (fully visible) until mounted, and settles on `shown` right
 * away when animating is not possible, so content is never hidden without a way back.
 */
export function useReveal() {
  const ref = useRef<Element | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const [state, setState] = useState<RevealState>();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!canAnimate()) {
      setState('shown');
      return;
    }
    setState('hidden');
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setState('shown');
        io.disconnect();
      },
      { threshold: 0.15, rootMargin: '0px 0px -6% 0px' },
    );
    observer.current = io;
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Tabbing into something still hidden must never land on an invisible element.
  const onFocus = useCallback(() => {
    observer.current?.disconnect();
    setState('shown');
  }, []);

  return { ref, state, onFocus };
}

interface RevealProps {
  as?: ElementType;
  variant?: RevealVariant;
  /** Stagger offset in milliseconds. */
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  /** Anything else is passed to the element (ids, ARIA, SVG attributes, data-*). */
  [attribute: string]: unknown;
}

/** Fades and moves its content into place the first time it scrolls into view (see landing.css). */
export function Reveal({ as: Tag = 'div', variant = 'up', delay = 0, className, style, children, ...rest }: RevealProps) {
  const { ref, state, onFocus } = useReveal();
  return (
    <Tag
      {...rest}
      ref={ref}
      onFocus={onFocus}
      data-reveal={state}
      data-variant={variant}
      className={className}
      style={delay ? { ...style, '--reveal-delay': `${delay}ms` } : style}
    >
      {children}
    </Tag>
  );
}

/** Delay for the `index`-th child of a group, capped so long lists do not drag. */
export const stagger = (index: number, step = 75, base = 0) => base + Math.min(index, 7) * step;
