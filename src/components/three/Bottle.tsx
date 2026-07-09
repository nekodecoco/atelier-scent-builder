import { Float, MeshTransmissionMaterial, RoundedBox } from '@react-three/drei';
import { LiquidLayers } from './LiquidLayers';
import { BottleLabel } from './BottleLabel';
import { BODY } from './bottleDimensions';

export function Bottle() {
  return (
    <Float speed={1.1} rotationIntensity={0.12} floatIntensity={0.35} floatingRange={[-0.06, 0.06]}>
      <group position={[0, -0.35, 0]}>
        <RoundedBox
          args={[BODY.width, BODY.height, BODY.depth]}
          radius={BODY.radius}
          smoothness={6}
        >
          <MeshTransmissionMaterial
            samples={8}
            resolution={512}
            transmission={1}
            thickness={0.55}
            roughness={0.06}
            ior={1.5}
            chromaticAberration={0.025}
            anisotropy={0.15}
            distortion={0.08}
            distortionScale={0.2}
            color="#ffffff"
            attenuationColor="#f3ecdc"
            attenuationDistance={2.5}
            backside={false}
          />
        </RoundedBox>

        <LiquidLayers />
        <BottleLabel />

        {/* Neck */}
        <mesh position={[0, BODY.height / 2 + 0.11, 0]}>
          <cylinderGeometry args={[0.2, 0.24, 0.22, 32]} />
          <meshStandardMaterial color="#d8d2c2" metalness={0.35} roughness={0.25} />
        </mesh>

        {/* Cap */}
        <mesh position={[0, BODY.height / 2 + 0.46, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.48, 48]} />
          <meshStandardMaterial color="#b9975a" metalness={0.9} roughness={0.28} />
        </mesh>
        <mesh position={[0, BODY.height / 2 + 0.71, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.02, 48]} />
          <meshStandardMaterial color="#8f7440" metalness={0.9} roughness={0.35} />
        </mesh>
      </group>
    </Float>
  );
}
