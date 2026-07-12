import { create } from 'zustand';
import {
  fetchAvailability,
  fetchCustomIngredients,
  fetchCustomPremades,
  fetchPremadeImages,
  fetchPremadePrices,
  fetchPricing,
  fetchStock,
  type AvailabilityMap,
  type HiddenMap,
  type PremadeImageMap,
  type StockMap,
} from '../lib/catalog';
import {
  registerPremadePrices,
  registerPricing,
  type PremadePriceMap,
  type PricingConfig,
} from '../lib/pricing';
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
  pricing: PricingConfig;
  premadePrices: PremadePriceMap;
  premadeImages: PremadeImageMap;
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
  pricing: { bySize: { 30: 1450, 50: 2150, 100: 3600 }, oilSurchargePerMl: 25 },
  premadePrices: {},
  premadeImages: {},
  loaded: false,

  load: async () => {
    const [{ stock, hidden }, availability, customIngredients, customPremades, pricing, premadePrices, premadeImages] =
      await Promise.all([
        fetchStock(),
        fetchAvailability(),
        fetchCustomIngredients(),
        fetchCustomPremades(),
        fetchPricing(),
        fetchPremadePrices(),
        fetchPremadeImages(),
      ]);

    // register before set() so 3D/recipe/pricing lookups resolve when components re-render
    registerCustomIngredients(customIngredients);
    registerPricing(pricing);
    registerPremadePrices(premadePrices);
    set({
      stock,
      availability,
      hiddenPremades: hidden,
      customIngredients,
      customPremades,
      pricing,
      premadePrices,
      premadeImages,
      loaded: true,
    });

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
