import { NOTE_KEYS, type NoteKey } from '../data/ingredients';
import type { Percentages } from './blend';

export const CONCENTRATION = 0.15;
export const DROPS_PER_ML = 20;
export const BOTTLE_SIZES = [30, 50, 100] as const;
export type BottleSize = (typeof BOTTLE_SIZES)[number];

export interface NoteVolume {
  note: NoteKey;
  ml: number;
  drops: number;
}

export interface Recipe {
  bottleSize: BottleSize;
  oilTotalMl: number;
  alcoholMl: number;
  notes: NoteVolume[];
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function computeRecipe(bottleSize: BottleSize, percentages: Percentages): Recipe {
  const oilTotalMl = round1(bottleSize * CONCENTRATION);
  const alcoholMl = round1(bottleSize - oilTotalMl);

  const notes: NoteVolume[] = NOTE_KEYS.map((note) => {
    const ml = round1((oilTotalMl * percentages[note]) / 100);
    return { note, ml, drops: Math.round(ml * DROPS_PER_ML) };
  });

  return { bottleSize, oilTotalMl, alcoholMl, notes };
}
