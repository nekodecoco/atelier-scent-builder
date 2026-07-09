import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import type { Mesh, MeshPhysicalMaterial } from 'three';
import { getIngredient, type NoteKey } from '../../data/ingredients';
import { useScentStore } from '../../store/useScentStore';
import { BODY } from './bottleDimensions';

const WALL = 0.12;
const LIQUID_WIDTH = BODY.width - WALL * 2;
const LIQUID_DEPTH = BODY.depth - WALL * 2;
const LIQUID_BOTTOM = -BODY.height / 2 + WALL;
const LIQUID_TOTAL = BODY.height - WALL * 2 - 0.28; // headspace under the neck

/** Render order bottom-up: base settles first, top floats above */
const STACK: NoteKey[] = ['base', 'heart', 'top'];

export function LiquidLayers() {
  const meshRefs = useRef<Record<NoteKey, Mesh | null>>({ top: null, heart: null, base: null });

  const initial = useScentStore.getState().percentages;
  const heights = useRef<Record<NoteKey, number>>({
    top: (initial.top / 100) * LIQUID_TOTAL,
    heart: (initial.heart / 100) * LIQUID_TOTAL,
    base: (initial.base / 100) * LIQUID_TOTAL,
  });

  useFrame((_, delta) => {
    // transient read — slider drags animate the liquid without re-rendering React
    const { percentages, selected } = useScentStore.getState();

    for (const note of STACK) {
      easing.damp(heights.current, note, (percentages[note] / 100) * LIQUID_TOTAL, 0.28, delta);
    }

    let y = LIQUID_BOTTOM;
    for (const note of STACK) {
      const mesh = meshRefs.current[note];
      if (!mesh) continue;
      const h = Math.max(heights.current[note], 0.001);
      mesh.scale.y = h;
      mesh.position.y = y + h / 2;
      y += h;

      const material = mesh.material as MeshPhysicalMaterial;
      easing.dampC(material.color, getIngredient(note, selected[note]).color, 0.3, delta);
    }
  });

  return (
    <group>
      {STACK.map((note) => (
        <mesh
          key={note}
          ref={(m) => (meshRefs.current[note] = m)}
          position={[0, LIQUID_BOTTOM, 0]}
        >
          <boxGeometry args={[LIQUID_WIDTH, 1, LIQUID_DEPTH]} />
          <meshPhysicalMaterial
            color={getIngredient(note, useScentStore.getState().selected[note]).color}
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
