import { useCallback, useEffect } from 'react';
import type { FC } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { useStlViewer } from './hook/useStlViewer';
import { StlScene } from './StlScene';
import { StlControls } from './StlControls';

interface StlViewerProps {
  url?: string;
  fileName?: string;
  autoRotate?: boolean;
  onDownload?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export const StlViewerContent: FC<StlViewerProps> = ({
  url,
  fileName,
  autoRotate = false,
  onDownload,
  onError,
  className = '',
}) => {
  const { state, setFileName, updateConfig, setError } = useStlViewer();

  useEffect(() => {
    if (fileName) {
      setFileName(fileName);
    }
  }, [fileName, setFileName]);

  useEffect(() => {
    if (autoRotate && !state.autoRotate) {
      updateConfig({ autoRotate: true });
    }
  }, [autoRotate, state.autoRotate, updateConfig]);

  useEffect(() => {
    if (state.error && onError) {
      onError(state.error);
    }
  }, [state.error, onError]);

  const handleReset = useCallback(() => {
    // Reset camera and controls by reloading the model
    if (url) {
      window.location.reload();
    }
  }, [url]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Error Message */}
      {state.error && (
        <div className="absolute top-4 left-4 right-4 z-50 bg-red-500/90 text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between">
          <span>{state.error}</span>
          <button
            onClick={() => setError(null)}
            className="text-xl font-bold hover:text-gray-200"
          >
            ×
          </button>
        </div>
      )}

      {/* Canvas */}
      <Canvas
        camera={{ position: [0, 0, 100], fov: 50 }}
        onCreated={({ gl }) => {
          gl.setPixelRatio(window.devicePixelRatio);
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = 1; // THREE.PCFShadowMap
        }}
      >
        {url && <StlScene url={url} />}
      </Canvas>

      {/* File Name Display */}
      {state.fileName && (
        <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-2 rounded-lg text-sm backdrop-blur">
          {state.fileName}
        </div>
      )}

      {/* Loading Indicator */}
      {state.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur z-40">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-white text-sm">Loading STL file...</p>
          </div>
        </div>
      )}

      {/* Controls */}
      {url && (
        <>
          <StlControls onDownload={onDownload} onReset={handleReset} />

          {/* Instructions */}
          <div className="absolute top-4 right-4 bg-black/50 text-white text-xs p-3 rounded-lg backdrop-blur max-w-xs">
            <p className="font-semibold mb-2">Controls:</p>
            <ul className="space-y-1 text-gray-200">
              <li>• Left Mouse: Rotate</li>
              <li>• Right Mouse / Pan: Move</li>
              <li>• Scroll: Zoom</li>
            </ul>
          </div>

          {/* Loader Component */}
          <Loader />
        </>
      )}

      {/* Empty State */}
      {!url && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
          <div className="text-center">
            <div className="text-6xl mb-4">🎯</div>
            <p className="text-white text-lg font-semibold">Load an STL file to view</p>
            <p className="text-gray-400 text-sm mt-2">Drag and drop or select a file to begin</p>
          </div>
        </div>
      )}
    </div>
  );
};

export const StlViewer: FC<StlViewerProps> = (props) => {
  return (
    <div className="w-full h-full">
      <StlViewerContent {...props} />
    </div>
  );
};
