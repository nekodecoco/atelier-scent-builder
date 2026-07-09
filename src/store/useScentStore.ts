import { create } from 'zustand';
import { INGREDIENTS, type NoteKey } from '../data/ingredients';
import { MASTER_BLEND, rebalance, type Locks, type Percentages } from '../lib/blend';
import type { BottleSize } from '../lib/recipe';

export type Theme = 'dark' | 'light';

interface ScentState {
  percentages: Percentages;
  locks: Locks;
  /** Selected ingredient id per note layer */
  selected: Record<NoteKey, string>;
  /** Note panel the user touched last — drives the Scent Twin card */
  activeNote: NoteKey;
  customName: string;
  bottleSize: BottleSize;
  theme: Theme;

  setPercentage: (note: NoteKey, value: number) => void;
  loadFormula: (formula: { selected: Record<NoteKey, string>; percentages: Percentages }, name?: string) => void;
  toggleLock: (note: NoteKey) => void;
  selectIngredient: (note: NoteKey, id: string) => void;
  setActiveNote: (note: NoteKey) => void;
  setCustomName: (name: string) => void;
  setBottleSize: (size: BottleSize) => void;
  toggleTheme: () => void;
  resetBlend: () => void;
}

export const MAX_NAME_LENGTH = 18;

export const useScentStore = create<ScentState>((set) => ({
  percentages: { ...MASTER_BLEND },
  locks: { top: false, heart: false, base: false },
  selected: {
    top: INGREDIENTS.top[0].id,
    heart: INGREDIENTS.heart[0].id,
    base: INGREDIENTS.base[0].id,
  },
  activeNote: 'heart',
  customName: 'Golden Hour',
  bottleSize: 50,
  theme: 'dark',

  setPercentage: (note, value) =>
    set((s) => ({
      percentages: rebalance(s.percentages, s.locks, note, value),
      activeNote: note,
    })),

  loadFormula: (formula, name) =>
    set((s) => ({
      selected: { ...formula.selected },
      percentages: { ...formula.percentages },
      locks: { top: false, heart: false, base: false },
      customName: (name ?? s.customName).slice(0, MAX_NAME_LENGTH),
    })),

  toggleLock: (note) =>
    set((s) => ({ locks: { ...s.locks, [note]: !s.locks[note] } })),

  selectIngredient: (note, id) =>
    set((s) => ({ selected: { ...s.selected, [note]: id }, activeNote: note })),

  setActiveNote: (note) => set({ activeNote: note }),

  setCustomName: (name) => set({ customName: name.slice(0, MAX_NAME_LENGTH) }),

  setBottleSize: (size) => set({ bottleSize: size }),

  toggleTheme: () =>
    set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

  resetBlend: () =>
    set({
      percentages: { ...MASTER_BLEND },
      locks: { top: false, heart: false, base: false },
    }),
}));
