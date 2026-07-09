import { NOTE_KEYS, type NoteKey } from '../data/ingredients';
import type { Percentages } from './blend';

export const MIN_CONCENTRATION = 15;
export const MAX_CONCENTRATION = 25;
export const DEFAULT_CONCENTRATION = 15;
export const DROPS_PER_ML = 20;
export const BOTTLE_SIZES = [30, 50, 100] as const;
export type BottleSize = (typeof BOTTLE_SIZES)[number];

/** Chemworld sells both solvents — perfume-grade alcohol or their Easyblend oil complex */
export type Solvent = 'alcohol' | 'easyblend';

export const SOLVENT_LABELS: Record<Solvent, string> = {
  alcohol: "Perfumer's alcohol",
  easyblend: 'Easyblend (oil base)',
};

/** Industry naming: 15–20% oil is an eau de parfum, 20%+ an extrait */
export function concentrationTier(concentrationPct: number): string {
  return concentrationPct >= 20 ? 'Extrait de Parfum' : 'Eau de Parfum';
}

export interface NoteVolume {
  note: NoteKey;
  ml: number;
  drops: number;
}

export interface Recipe {
  bottleSize: BottleSize;
  concentrationPct: number;
  oilTotalMl: number;
  /** Solvent volume — perfumer's alcohol or Easyblend, whichever is selected */
  alcoholMl: number;
  notes: NoteVolume[];
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function computeRecipe(
  bottleSize: BottleSize,
  percentages: Percentages,
  concentrationPct: number = DEFAULT_CONCENTRATION,
): Recipe {
  const oilTotalMl = round1((bottleSize * concentrationPct) / 100);
  const alcoholMl = round1(bottleSize - oilTotalMl);

  const notes: NoteVolume[] = NOTE_KEYS.map((note) => {
    const ml = round1((oilTotalMl * percentages[note]) / 100);
    return { note, ml, drops: Math.round(ml * DROPS_PER_ML) };
  });

  return { bottleSize, concentrationPct, oilTotalMl, alcoholMl, notes };
}
