import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { Bottle } from './Bottle';

/**
 * Landing-page showcase of the live 3D bottle. Reuses the shared <Bottle/> and
 * lighting from Scene, but is scroll-safe: transparent background, drag-to-spin
 * with auto-rotation, and zoom disabled so the mouse wheel scrolls the page
 * instead of the canvas. Auto-rotation is suppressed under reduced-motion.
 */
export function BottleShowcase() {
  const reducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.6, 6.2], fov: 30 }}
      gl={{ antialias: true, alpha: true }}
      style={{ touchAction: 'pan-y' }}
    >
      <ambientLight intensity={0.4} />
      <Environment resolution={256}>
        <Lightformer intensity={2.2} position={[0, 4, 3]} scale={[7, 3, 1]} color="#ffffff" />
        <Lightformer intensity={1.4} position={[-5, 1, 2]} rotation-y={Math.PI / 4} scale={[3, 5, 1]} color="#f2e2c4" />
        <Lightformer intensity={1.1} position={[5, 0, -2]} rotation-y={-Math.PI / 4} scale={[3, 5, 1]} color="#dfe8f0" />
        <Lightformer intensity={0.6} position={[0, -3, 0]} rotation-x={Math.PI / 2} scale={[6, 6, 1]} color="#f5efe0" />
      </Environment>

      <Bottle />

      <ContactShadows
        position={[0, -1.9, 0]}
        opacity={0.3}
        scale={9}
        blur={2.4}
        far={3.5}
        color="#000000"
      />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={!reducedMotion}
        autoRotateSpeed={0.6}
        minPolarAngle={Math.PI / 3.4}
        maxPolarAngle={Math.PI / 1.85}
      />
    </Canvas>
  );
}
