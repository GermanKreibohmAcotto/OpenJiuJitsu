import type { ReactNode } from 'react';
import { BELT_COLOR } from './landingData';
import type { Belt } from '../domain/types';

export const GITHUB_URL = 'https://github.com/GermanKreibohmAcotto/OpenJiuJitsu';
export const APP_URL = `${import.meta.env.BASE_URL}app/`;

export function Logo({ className = '' }: { className?: string }) {
  return (
    <a href="#top" className={`font-display no-underline ${className}`}>
      Open<span className="text-accent">JiuJitsu</span>
    </a>
  );
}

export function Kicker({ num, children }: { num: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-display text-sm text-accent">{num}</span>
      <span className="label mb-0">{children}</span>
    </div>
  );
}

/** A framed example of an app screen: an image for assistive technology. */
export function Panel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="img" aria-label={label} className="card p-5">
      {children}
    </div>
  );
}

export function PanelHead({ title, aside }: { title: string; aside?: ReactNode }) {
  return (
    <div className="mb-3.5 flex items-center justify-between gap-3">
      <span className="label mb-0">{title}</span>
      {aside}
    </div>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 px-3.5 py-3 text-[15px] [&+&]:mt-2">
      {children}
    </div>
  );
}

export function Small({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <small className={`block text-[13px] text-muted ${className}`}>{children}</small>;
}

export function BeltChip({ belt, label }: { belt: Belt; label: string }) {
  return (
    <span className="chip">
      <span className="inline-block size-2 rounded-full" style={{ background: BELT_COLOR[belt] }} />
      {label}
    </span>
  );
}

/** Ten-step meter, `value` of `max` filled. */
export function Meter({ value, max = 10, className = '' }: { value: number; max?: number; className?: string }) {
  return (
    <span aria-hidden="true" className={`mt-1.5 flex gap-[3px] ${className}`}>
      {Array.from({ length: max }, (_, i) => (
        <i key={i} className={`h-1.5 flex-1 rounded-[2px] ${i < value ? 'bg-accent' : 'bg-line'}`} />
      ))}
    </span>
  );
}

export function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="my-1.5 h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
      <i className="block h-full bg-accent" style={{ width: `${Math.round(percent)}%` }} />
    </div>
  );
}

export const SECTION_X = 'px-6 md:px-12 lg:px-[72px]';
export const SECTION_MX = 'mx-6 md:mx-12 lg:mx-[72px]';
export const BTN = 'btn px-[22px] py-3.5 text-base';
