import { create } from 'zustand';
import { fetchAvailability, fetchStock, type AvailabilityMap, type StockMap } from '../lib/catalog';
import { INGREDIENTS, NOTE_KEYS } from '../data/ingredients';
import { useScentStore } from './useScentStore';

interface CatalogState {
  /** scent_id → units; missing key = in stock */
  stock: StockMap;
  /** ingredient_id → available; missing key = available */
  availability: AvailabilityMap;
  loaded: boolean;
  load: () => Promise<void>;
  isInStock: (scentId: string) => boolean;
  isAvailable: (ingredientId: string) => boolean;
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  stock: {},
  availability: {},
  loaded: false,

  load: async () => {
    const [stock, availability] = await Promise.all([fetchStock(), fetchAvailability()]);
    set({ stock, availability, loaded: true });

    // if a currently selected ingredient just became unavailable, move the
    // selection to the first available option in that layer
    const { selected, selectIngredient } = useScentStore.getState();
    for (const note of NOTE_KEYS) {
      if (availability[selected[note]] === false) {
        const fallback = INGREDIENTS[note].find((i) => availability[i.id] !== false);
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
