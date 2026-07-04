import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { Loader2, RotateCw, Maximize2 } from 'lucide-react'
import { parseStl } from './stlParser'

/* ── Parse STL từ ArrayBuffer rồi căn giữa (parser dùng chung, robust) ── */
function parseStlCentered(buffer: ArrayBuffer): THREE.BufferGeometry {
  const geometry = parseStl(buffer)
  if ((geometry.getAttribute('position')?.count ?? 0) === 0) {
    throw new Error('Empty geometry')
  }
  geometry.center()
  geometry.computeBoundingBox()
  return geometry
}

/* ── Mesh hiển thị phôi + auto-fit camera + auto-rotate ── */
function StlMesh({ geometry, autoRotate }: { geometry: THREE.BufferGeometry; autoRotate: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { camera } = useThree()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    if (!geometry.boundingBox) return
    const size = geometry.boundingBox.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z) || 1
    const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180)
    const dist = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 2.2
    camera.position.set(dist * 0.6, dist * 0.5, dist)
    camera.lookAt(0, 0, 0)
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0)
      controlsRef.current.update()
    }
  }, [geometry, camera])

  useFrame(() => {
    if (meshRef.current && autoRotate) {
      meshRef.current.rotation.z += 0.006
    }
  })

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        autoRotate={autoRotate}
        autoRotateSpeed={3}
        enableZoom
        enablePan
        enableDamping
        dampingFactor={0.08}
      />
      {/* STL thường dựng theo trục Z-up → xoay để đứng đúng */}
      <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
        {/* Phôi xám trung tính, không màu */}
        <meshStandardMaterial color="#b8c0cc" metalness={0.15} roughness={0.65} flatShading />
      </mesh>
    </>
  )
}

export default function StlFileViewer({ file }: { file: File }) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRotate, setAutoRotate] = useState(true)

  const isStl = useMemo(() => file.name.toLowerCase().endsWith('.stl'), [file])

  useEffect(() => {
    if (!isStl) { setLoading(false); return }
    let cancelled = false
    setLoading(true); setError(null)
    file.arrayBuffer()
      .then((buf) => {
        if (cancelled) return
        try {
          setGeometry(parseStlCentered(buf))
        } catch {
          setError('Không thể đọc file STL')
        }
      })
      .catch(() => !cancelled && setError('Không thể đọc file'))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [file, isStl])

  if (!isStl) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
        <Maximize2 size={28} className="mb-2" />
        <p className="text-sm">Xem trước 3D chỉ hỗ trợ định dạng STL</p>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 text-slate-400">
          <Loader2 size={20} className="animate-spin" /> Đang dựng mô hình…
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-red-400">{error}</div>
      )}

      {/* Nút bật/tắt auto xoay 360 */}
      <button
        type="button"
        onClick={() => setAutoRotate((v) => !v)}
        className={`absolute right-3 top-3 z-20 flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold backdrop-blur transition ${
          autoRotate ? 'bg-brand-600 text-white' : 'bg-black/40 text-white hover:bg-black/60'
        }`}
        title="Xoay 360°"
      >
        <RotateCw size={14} /> 360°
      </button>

      <Canvas
        shadows
        camera={{ position: [0, 0, 100], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#0f172a']} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={1.4} castShadow />
        <directionalLight position={[-5, -3, -5]} intensity={0.5} />
        {geometry && <StlMesh geometry={geometry} autoRotate={autoRotate} />}
      </Canvas>
    </div>
  )
}
