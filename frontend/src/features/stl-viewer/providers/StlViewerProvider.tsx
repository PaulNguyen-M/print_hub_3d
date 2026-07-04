import {
  useState,
  useCallback,
} from 'react';

import type {
  ReactNode,
  FC,
} from 'react';

import {
  StlViewerContext,
} from '../context/StlViewerContext';

import type {
  StlViewerState,
  StlViewerConfig,
} from '../types';

const defaultConfig: StlViewerConfig = {
  autoRotate: false,
  wireframe: false,
  showGrid: true,
  lightIntensity: 1.5,
  cameraDistance: 100,
};

const defaultState: StlViewerState = {
  ...defaultConfig,
  isLoading: false,
  error: null,
  fileName: null,
};

interface Props {
  children: ReactNode;
}

export const StlViewerProvider: FC<Props> = ({
  children,
}) => {

  const [state, setState] =
    useState<StlViewerState>(defaultState);

  const updateConfig = useCallback(
    (
      config: Partial<StlViewerConfig>
    ) => {
      setState(prev => ({
        ...prev,
        ...config,
      }));
    },
    []
  );

  const setLoading = useCallback(
    (loading: boolean) => {
      setState(prev => ({
        ...prev,
        isLoading: loading,
      }));
    },
    []
  );

  const setError = useCallback(
    (error: string | null) => {
      setState(prev => ({
        ...prev,
        error,
      }));
    },
    []
  );

  const setFileName = useCallback(
    (fileName: string | null) => {
      setState(prev => ({
        ...prev,
        fileName,
      }));
    },
    []
  );

  const resetState = useCallback(() => {
    setState(defaultState);
  }, []);

  return (
    <StlViewerContext.Provider
      value={{
        state,
        setState,
        updateConfig,
        setLoading,
        setError,
        setFileName,
        resetState,
      }}
    >
      {children}
    </StlViewerContext.Provider>
  );
};