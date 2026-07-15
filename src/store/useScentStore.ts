import { create } from 'zustand';
import { INGREDIENTS, type NoteKey } from '../data/ingredients';
import { MASTER_BLEND, rebalance, type Locks, type Percentages } from '../lib/blend';
import { normalizeSelected, toggleInNote, type Selected } from '../lib/selection';
import {
  DEFAULT_CONCENTRATION,
  MAX_CONCENTRATION,
  MIN_CONCENTRATION,
  type BottleSize,
  type Solvent,
} from '../lib/recipe';

interface ScentState {
  percentages: Percentages;
  locks: Locks;
  /** Selected ingredient ids per note layer — 1..MAX_PER_NOTE, mixed equally */
  selected: Selected;
  /** Note panel the user touched last — drives the Scent Twin card */
  activeNote: NoteKey;
  customName: string;
  bottleSize: BottleSize;
  /** Fragrance oil concentration, percent (15–25) */
  concentration: number;
  solvent: Solvent;
  /** True when the user pressed "Blend my scent" — liquids merge into one color */
  blended: boolean;

  setPercentage: (note: NoteKey, value: number) => void;
  toggleBlended: () => void;
  loadFormula: (formula: { selected: unknown; percentages: Percentages }, name?: string) => void;
  toggleLock: (note: NoteKey) => void;
  /** Add the id to the note (up to the cap) or remove it, never below one */
  toggleIngredient: (note: NoteKey, id: string) => void;
  /** Replace a note's whole selection (used when pruning unavailable ingredients) */
  setNoteIngredients: (note: NoteKey, ids: string[]) => void;
  setActiveNote: (note: NoteKey) => void;
  setCustomName: (name: string) => void;
  setBottleSize: (size: BottleSize) => void;
  setConcentration: (pct: number) => void;
  setSolvent: (solvent: Solvent) => void;
  resetBlend: () => void;
}

export const MAX_NAME_LENGTH = 18;

export const useScentStore = create<ScentState>((set) => ({
  percentages: { ...MASTER_BLEND },
  locks: { top: false, heart: false, base: false },
  selected: {
    top: [INGREDIENTS.top[0].id],
    heart: [INGREDIENTS.heart[0].id],
    base: [INGREDIENTS.base[0].id],
  },
  activeNote: 'heart',
  customName: 'Golden Hour',
  bottleSize: 50,
  concentration: DEFAULT_CONCENTRATION,
  solvent: 'alcohol',
  blended: false,

  setPercentage: (note, value) =>
    set((s) => ({
      percentages: rebalance(s.percentages, s.locks, note, value),
      activeNote: note,
      blended: false,
    })),

  toggleBlended: () => set((s) => ({ blended: !s.blended })),

  loadFormula: (formula, name) =>
    set((s) => ({
      selected: normalizeSelected(formula.selected),
      percentages: { ...formula.percentages },
      locks: { top: false, heart: false, base: false },
      customName: (name ?? s.customName).slice(0, MAX_NAME_LENGTH),
      blended: false,
    })),

  toggleLock: (note) =>
    set((s) => ({ locks: { ...s.locks, [note]: !s.locks[note] } })),

  toggleIngredient: (note, id) =>
    set((s) => ({
      selected: { ...s.selected, [note]: toggleInNote(s.selected[note], id) },
      activeNote: note,
      blended: false,
    })),

  setNoteIngredients: (note, ids) =>
    set((s) => (ids.length ? { selected: { ...s.selected, [note]: ids } } : s)),

  setActiveNote: (note) => set({ activeNote: note }),

  setCustomName: (name) => set({ customName: name.slice(0, MAX_NAME_LENGTH) }),

  setBottleSize: (size) => set({ bottleSize: size }),

  setConcentration: (pct) =>
    set({
      concentration: Math.max(MIN_CONCENTRATION, Math.min(MAX_CONCENTRATION, Math.round(pct))),
    }),

  setSolvent: (solvent) => set({ solvent }),

  resetBlend: () =>
    set({
      percentages: { ...MASTER_BLEND },
      locks: { top: false, heart: false, base: false },
      blended: false,
    }),
}));
