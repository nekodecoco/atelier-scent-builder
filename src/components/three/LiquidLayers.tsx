import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import type { Group, Mesh, MeshPhysicalMaterial } from 'three';
import { type NoteKey } from '../../data/ingredients';
import { mixFormulaColor, noteColor } from '../../lib/color';
import { useScentStore } from '../../store/useScentStore';
import { BODY } from './bottleDimensions';

const WALL = 0.12;
const LIQUID_WIDTH = BODY.width - WALL * 2;
const LIQUID_DEPTH = BODY.depth - WALL * 2;
const LIQUID_BOTTOM = -BODY.height / 2 + WALL;
const LIQUID_TOTAL = BODY.height - WALL * 2 - 0.28; // headspace under the neck

/** Render order bottom-up: base settles first, top floats above */
const STACK: NoteKey[] = ['base', 'heart', 'top'];

// slosh spring: liquid tips against drag velocity, wobbles level again.
// MAX_TILT stays under the WALL inset so liquid never pokes through glass.
const MAX_TILT = 0.12;
const STIFFNESS = 60;
const DAMPING = 8;
const YAW_KICK = 1.4;
const PITCH_KICK = 1.8;

export function LiquidLayers() {
  const meshRefs = useRef<Record<NoteKey, Mesh | null>>({ top: null, heart: null, base: null });
  const sloshGroup = useRef<Group>(null);

  const initial = useScentStore.getState().percentages;
  const heights = useRef<Record<NoteKey, number>>({
    top: (initial.top / 100) * LIQUID_TOTAL,
    heart: (initial.heart / 100) * LIQUID_TOTAL,
    base: (initial.base / 100) * LIQUID_TOTAL,
  });

  const prevAngles = useRef<{ azimuth: number; polar: number } | null>(null);
  const spring = useRef({ x: 0, xv: 0, z: 0, zv: 0 });
  const wasBlended = useRef(false);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05); // clamp tab-switch spikes
    // transient read — slider drags animate the liquid without re-rendering React
    const { percentages, selected, blended } = useScentStore.getState();

    for (const note of STACK) {
      easing.damp(heights.current, note, (percentages[note] / 100) * LIQUID_TOTAL, 0.28, delta);
    }

    let y = LIQUID_BOTTOM;
    const mixed = blended ? mixFormulaColor(selected, percentages) : null;
    for (const note of STACK) {
      const mesh = meshRefs.current[note];
      if (!mesh) continue;
      const h = Math.max(heights.current[note], 0.001);
      mesh.scale.y = h;
      mesh.position.y = y + h / 2;
      y += h;

      const material = mesh.material as MeshPhysicalMaterial;
      const target = mixed ?? noteColor(note, selected[note]);
      easing.dampC(material.color, target, blended ? 0.45 : 0.3, delta);
    }

    // camera angular velocity → spring impulse (the "physics" of the slosh)
    const cam = state.camera.position;
    const azimuth = Math.atan2(cam.x, cam.z);
    const polar = Math.atan2(Math.hypot(cam.x, cam.z), cam.y);
    if (prevAngles.current) {
      let dAz = azimuth - prevAngles.current.azimuth;
      if (dAz > Math.PI) dAz -= Math.PI * 2;
      else if (dAz < -Math.PI) dAz += Math.PI * 2;
      const dPol = polar - prevAngles.current.polar;
      spring.current.zv -= dAz * YAW_KICK;
      spring.current.xv += dPol * PITCH_KICK;
    }
    prevAngles.current = { azimuth, polar };

    // a little swirl when the blend merges or separates
    if (blended !== wasBlended.current) {
      spring.current.zv += blended ? 1.5 : -1.0;
      wasBlended.current = blended;
    }

    const s = spring.current;
    s.zv += (-STIFFNESS * s.z - DAMPING * s.zv) * dt;
    s.z += s.zv * dt;
    s.xv += (-STIFFNESS * s.x - DAMPING * s.xv) * dt;
    s.x += s.xv * dt;
    if (sloshGroup.current) {
      sloshGroup.current.rotation.z = Math.max(-MAX_TILT, Math.min(MAX_TILT, s.z));
      sloshGroup.current.rotation.x = Math.max(-MAX_TILT, Math.min(MAX_TILT, s.x));
    }
  });

  return (
    <group ref={sloshGroup}>
      {STACK.map((note) => (
        <mesh
          key={note}
          ref={(m) => (meshRefs.current[note] = m)}
          position={[0, LIQUID_BOTTOM, 0]}
        >
          <boxGeometry args={[LIQUID_WIDTH, 1, LIQUID_DEPTH]} />
          <meshPhysicalMaterial
            color={noteColor(note, useScentStore.getState().selected[note])}
            roughness={0.18}
            metalness={0}
            transparent
            opacity={0.88}
            clearcoat={0.4}
            clearcoatRoughness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}
