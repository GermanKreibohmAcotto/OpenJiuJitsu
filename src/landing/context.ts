import { createContext, useContext } from 'react';
import type { Lang } from '../domain/types';
import type { AppStrings } from './landingData';
import type { LandingCopy } from './locales/es';

export interface LandingView {
  lang: Lang;
  copy: LandingCopy;
  app: AppStrings;
}

export const LandingContext = createContext<LandingView | null>(null);

export function useLanding(): LandingView {
  const view = useContext(LandingContext);
  if (!view) throw new Error('useLanding needs a LandingContext provider');
  return view;
}

