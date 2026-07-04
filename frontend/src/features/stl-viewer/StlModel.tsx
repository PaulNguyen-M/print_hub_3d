import { useEffect, useRef, useMemo } from 'react';
import type { FC } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { Mesh } from 'three';
import { useStlViewer } from './hook/useStlViewer';
import { parseStl } from './stlParser';

interface StlModelProps {
  url: string;
}

export const StlModel: FC<StlModelProps> = ({ url }) => {
  const { camera } = useThree();
  const meshRef = useRef<Mesh>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const { state, setLoading, setError, updateConfig } = useStlViewer();

  const geometry = useMemo(() => new THREE.BufferGeometry(), []);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buffer) => {
        if (cancelled) return;

        const loadedGeometry = parseStl(buffer);

        const positionAttr = loadedGeometry.getAttribute('position');
        if (!positionAttr || positionAttr.count === 0) {
          // Diagnostics so we can see what was actually fetched
          const headBytes = new Uint8Array(buffer.slice(0, 200));
          const headText = new TextDecoder('utf-8').decode(headBytes);
          const hex = Array.from(headBytes.slice(0, 16)).map((b) => b.toString(16).padStart(2, '0')).join(' ');
          console.warn('[STL] No geometry parsed →', {
            url,
            bytes: buffer.byteLength,
            facesAt80: buffer.byteLength >= 84 ? new DataView(buffer).getUint32(80, true) : null,
            firstHex: hex,
            head: headText,
          });
          throw new Error('Empty geometry');
        }
        if (!loadedGeometry.getAttribute('normal')) {
          loadedGeometry.computeVertexNormals();
        }

        if (meshRef.current) {
          meshRef.current.geometry = loadedGeometry;
          loadedGeometry.center();
          loadedGeometry.computeBoundingBox();

          if (loadedGeometry.boundingBox) {
            const size = loadedGeometry.boundingBox.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
            const cameraDistance = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 2.5;

            camera.position.z = cameraDistance;
            if (controlsRef.current) {
              controlsRef.current.target.set(0, 0, 0);
              controlsRef.current.autoRotateSpeed = 4;
              controlsRef.current.update();
            }
            updateConfig({ cameraDistance });
          }
        }
        setLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('STL loading error:', error);
        setError('Không đọc được file STL. Vui lòng kiểm tra file có hợp lệ không.');
        setLoading(false);
      });

    return () => {
      cancelled = true;
      geometry.dispose();
    };
  }, [url, setLoading, setError, updateConfig, camera, geometry]);

  useFrame(() => {
    if (meshRef.current && state.autoRotate) {
      meshRef.current.rotation.x += 0.005;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        autoRotate={state.autoRotate}
        autoRotateSpeed={4}
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        zoomSpeed={0.5}
        panSpeed={0.5}
      />

      <mesh ref={meshRef} castShadow receiveShadow>
        <bufferGeometry ref={() => geometry} />
        <meshPhongMaterial
          color="#1e40af"
          wireframe={state.wireframe}
          shininess={100}
          side={THREE.DoubleSide}
        />
      </mesh>

      {state.showGrid && (
        <gridHelper args={[200, 20, '#64748b', '#334155']} position={[0, -50, 0]} />
      )}
    </>
  );
};
