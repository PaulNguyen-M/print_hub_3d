import type { FC } from 'react';
import { PerspectiveCamera } from '@react-three/drei';
import { useStlViewer } from './hook/useStlViewer';
import { StlModel } from './StlModel';

interface StlSceneProps {
  url: string;
}

export const StlScene: FC<StlSceneProps> = ({ url }) => {
  const { state } = useStlViewer();

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 100]} fov={50} />

      {/* Ambient Light - Soft overall illumination */}
      <ambientLight intensity={state.lightIntensity * 0.6} color="#ffffff" />

      {/* Directional Light 1 */}
      <directionalLight
        position={[10, 20, 10]}
        intensity={state.lightIntensity}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={500}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />

      {/* Directional Light 2 - Fill light */}
      <directionalLight
        position={[-10, -20, -10]}
        intensity={state.lightIntensity * 0.4}
        color="#ffffff"
      />

      {/* Point Light for additional highlights */}
      <pointLight
        position={[50, 50, 50]}
        intensity={state.lightIntensity * 0.3}
        color="#ffffff"
      />

      {/* Model */}
      <StlModel url={url} />

      {/* Background */}
      <color attach="background" args={['#000000']} />
    </>
  );
};
