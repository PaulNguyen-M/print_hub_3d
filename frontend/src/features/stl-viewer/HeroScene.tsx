import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Torus, Box, Sphere, Octahedron, Environment } from '@react-three/drei'
import * as THREE from 'three'

function FloatingShape({
  position,
  color,
  shape = 'box',
  speed = 1,
}: {
  position: [number, number, number]
  color: string
  shape?: 'box' | 'torus' | 'sphere' | 'octahedron'
  speed?: number
}) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime * speed
    ref.current.rotation.x = t * 0.4
    ref.current.rotation.y = t * 0.6
    ref.current.position.y = position[1] + Math.sin(t * 0.8) * 0.18
  })

  const mat = (
    <meshStandardMaterial
      color={color}
      metalness={0.6}
      roughness={0.2}
      envMapIntensity={1}
    />
  )

  return (
    <mesh ref={ref} position={position} castShadow>
      {shape === 'torus' && <Torus args={[0.5, 0.15, 16, 64]}>{mat}</Torus>}
      {shape === 'box' && <Box args={[0.8, 0.8, 0.8]}>{mat}</Box>}
      {shape === 'sphere' && <Sphere args={[0.5, 32, 32]}>{mat}</Sphere>}
      {shape === 'octahedron' && <Octahedron args={[0.6]}>{mat}</Octahedron>}
    </mesh>
  )
}

function Scene() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1
    }
  })

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} castShadow />
      <pointLight position={[-4, 4, 0]} color="#3b82f6" intensity={3} />
      <pointLight position={[4, -4, 0]} color="#06b6d4" intensity={2} />
      <Environment preset="city" />

      {/* Trung tâm + 4 vệ tinh bố trí chéo (hình X) → cân đều trọng lượng trên/dưới */}
      <group ref={groupRef}>
        <FloatingShape position={[0, 0, 0]} color="#2563eb" shape="torus" speed={0.8} />
        <FloatingShape position={[0.95, 0.95, 0.3]} color="#06b6d4" shape="octahedron" speed={1.2} />
        <FloatingShape position={[-0.95, 0.95, -0.3]} color="#f59e0b" shape="box" speed={0.9} />
        <FloatingShape position={[-0.95, -0.95, 0.3]} color="#6366f1" shape="box" speed={0.6} />
        <FloatingShape position={[0.95, -0.95, -0.3]} color="#22c55e" shape="sphere" speed={1} />
      </group>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.8}
        target={[0, 0, 0]}
      />
    </>
  )
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.6], fov: 50 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ background: 'transparent' }}
    >
      <Scene />
    </Canvas>
  )
}
