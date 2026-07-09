import { create } from 'zustand';
import {
  fetchAvailability,
  fetchCustomIngredients,
  fetchCustomPremades,
  fetchStock,
  type AvailabilityMap,
  type HiddenMap,
  type StockMap,
} from '../lib/catalog';
import {
  getCustomIngredients,
  INGREDIENTS,
  NOTE_KEYS,
  registerCustomIngredients,
  type Ingredient,
  type NoteKey,
} from '../data/ingredients';
import type { PremadeScent } from '../data/premadeScents';
import { useScentStore } from './useScentStore';

interface CatalogState {
  /** scent_id → units; missing key = in stock */
  stock: StockMap;
  /** ingredient_id → available; missing key = available */
  availability: AvailabilityMap;
  /** built-in premade ids hidden from the collection */
  hiddenPremades: HiddenMap;
  customIngredients: Record<NoteKey, Ingredient[]>;
  customPremades: PremadeScent[];
  loaded: boolean;
  load: () => Promise<void>;
  isInStock: (scentId: string) => boolean;
  isAvailable: (ingredientId: string) => boolean;
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  stock: {},
  availability: {},
  hiddenPremades: {},
  customIngredients: { top: [], heart: [], base: [] },
  customPremades: [],
  loaded: false,

  load: async () => {
    const [{ stock, hidden }, availability, customIngredients, customPremades] =
      await Promise.all([
        fetchStock(),
        fetchAvailability(),
        fetchCustomIngredients(),
        fetchCustomPremades(),
      ]);

    // register before set() so 3D/recipe lookups resolve when components re-render
    registerCustomIngredients(customIngredients);
    set({ stock, availability, hiddenPremades: hidden, customIngredients, customPremades, loaded: true });

    // if a selected ingredient is now unavailable or deleted, move the
    // selection to the first selectable option in that layer
    const { selected, selectIngredient } = useScentStore.getState();
    for (const note of NOTE_KEYS) {
      const merged = [...INGREDIENTS[note], ...getCustomIngredients(note)];
      const current = merged.find((i) => i.id === selected[note]);
      const selectable = (i: Ingredient) => availability[i.id] !== false;
      if (!current || !selectable(current)) {
        const fallback = merged.find(selectable);
        if (fallback) selectIngredient(note, fallback.id);
      }
    }
  },

  isInStock: (scentId) => {
    const units = get().stock[scentId];
    return units === undefined || units > 0;
  },

  isAvailable: (ingredientId) => get().availability[ingredientId] !== false,
}));
