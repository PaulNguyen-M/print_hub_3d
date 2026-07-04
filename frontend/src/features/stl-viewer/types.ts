export interface StlViewerConfig {
  autoRotate: boolean;
  wireframe: boolean;
  showGrid: boolean;
  lightIntensity: number;
  cameraDistance: number;
}

export interface StlViewerState extends StlViewerConfig {
  isLoading: boolean;
  error: string | null;
  fileName: string | null;
}

export interface CameraPosition {
  x: number;
  y: number;
  z: number;
}
