import { createContext } from 'react';

import type {
  Dispatch,
  SetStateAction,
} from 'react';

import type {
  StlViewerState,
  StlViewerConfig,
} from '../types';

export interface StlViewerContextType {
  state: StlViewerState;

  setState:
    Dispatch<SetStateAction<StlViewerState>>;

  updateConfig: (
    config: Partial<StlViewerConfig>
  ) => void;

  setLoading: (loading: boolean) => void;

  setError: (
    error: string | null
  ) => void;

  setFileName: (
    fileName: string | null
  ) => void;

  resetState: () => void;
}

export const StlViewerContext =
  createContext<
    StlViewerContextType | undefined
  >(undefined);