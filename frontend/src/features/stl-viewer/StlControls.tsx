import type { FC } from 'react';
import { useStlViewer } from './hook/useStlViewer';
import { Sun, Download, RotateCw, Grid3x3, Eye, EyeOff } from 'lucide-react';

interface StlControlsProps {
  onDownload?: () => void;
  onReset?: () => void;
}

export const StlControls: FC<StlControlsProps> = ({ onDownload, onReset }) => {
  const { state, updateConfig } = useStlViewer();

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
      <div className="flex flex-wrap gap-2 justify-center items-center">
        {/* Auto Rotate Toggle */}
        <button
          onClick={() => updateConfig({ autoRotate: !state.autoRotate })}
          className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${
            state.autoRotate
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-700 text-gray-100 hover:bg-gray-600'
          }`}
          title="Toggle auto-rotation"
        >
          <RotateCw size={16} />
          <span>Rotate</span>
        </button>

        {/* Wireframe Toggle */}
        <button
          onClick={() => updateConfig({ wireframe: !state.wireframe })}
          className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${
            state.wireframe
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-gray-700 text-gray-100 hover:bg-gray-600'
          }`}
          title="Toggle wireframe mode"
        >
          {state.wireframe ? <EyeOff size={16} /> : <Eye size={16} />}
          <span>Wireframe</span>
        </button>

        {/* Grid Toggle */}
        <button
          onClick={() => updateConfig({ showGrid: !state.showGrid })}
          className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${
            state.showGrid
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'bg-gray-700 text-gray-100 hover:bg-gray-600'
          }`}
          title="Toggle grid"
        >
          <Grid3x3 size={16} />
          <span>Grid</span>
        </button>

        {/* Light Intensity Control */}
        <div className="flex items-center gap-2 bg-gray-700 px-3 py-2 rounded-lg">
          <Sun size={16} className="text-yellow-400" />
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={state.lightIntensity}
            onChange={(e) =>
              updateConfig({ lightIntensity: parseFloat(e.target.value) })
            }
            className="w-24 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            title="Adjust light intensity"
          />
          <span className="text-xs text-gray-300 w-8 text-right">
            {state.lightIntensity.toFixed(1)}
          </span>
        </div>

        {/* Reset Button */}
        {onReset && (
          <button
            onClick={onReset}
            className="px-3 py-2 rounded-lg bg-gray-700 text-gray-100 hover:bg-gray-600 transition-all text-sm font-medium"
            title="Reset viewer"
          >
            Reset
          </button>
        )}

        {/* Download Button */}
        {onDownload && (
          <button
            onClick={onDownload}
            className="px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-all text-sm font-medium flex items-center gap-2"
            title="Download STL file"
          >
            <Download size={16} />
            <span>Download</span>
          </button>
        )}
      </div>
    </div>
  );
};
