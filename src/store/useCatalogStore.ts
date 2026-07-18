import { create } from 'zustand';
import {
  fetchAvailability,
  fetchCustomIngredients,
  fetchCustomPremades,
  fetchHeroImages,
  fetchPremadeImages,
  fetchPremadePrices,
  fetchPricing,
  fetchShippingConfig,
  fetchStock,
  type AvailabilityMap,
  type HeroImageMap,
  type HiddenMap,
  type PremadeImageMap,
  type StockMap,
} from '../lib/catalog';
import {
  registerPremadePrices,
  registerPricing,
  registerShipping,
  type PremadePriceMap,
  type PricingConfig,
  type ShippingConfig,
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
  shipping: ShippingConfig;
  premadeImages: PremadeImageMap;
  heroImages: HeroImageMap;
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
  shipping: { flatFee: 0 },
  premadeImages: {},
  heroImages: {},
  loaded: false,

  load: async () => {
    const [{ stock, hidden }, availability, customIngredients, customPremades, pricing, premadePrices, shipping, premadeImages, heroImages] =
      await Promise.all([
        fetchStock(),
        fetchAvailability(),
        fetchCustomIngredients(),
        fetchCustomPremades(),
        fetchPricing(),
        fetchPremadePrices(),
        fetchShippingConfig(),
        fetchPremadeImages(),
        fetchHeroImages(),
      ]);

    // register before set() so 3D/recipe/pricing lookups resolve when components re-render
    registerCustomIngredients(customIngredients);
    registerPricing(pricing);
    registerPremadePrices(premadePrices);
    registerShipping(shipping);
    set({
      stock,
      availability,
      hiddenPremades: hidden,
      customIngredients,
      customPremades,
      pricing,
      premadePrices,
      shipping,
      premadeImages,
      heroImages,
      loaded: true,
    });

    // if any selected ingredient is now unavailable or deleted, drop it; if a
    // note is left empty, fall back to the first selectable option in that layer
    const { selected, setNoteIngredients } = useScentStore.getState();
    for (const note of NOTE_KEYS) {
      const merged = [...INGREDIENTS[note], ...getCustomIngredients(note)];
      const selectable = (id: string) => {
        const ing = merged.find((i) => i.id === id);
        return !!ing && availability[ing.id] !== false;
      };
      const kept = selected[note].filter(selectable);
      if (kept.length === selected[note].length) continue;
      if (kept.length > 0) {
        setNoteIngredients(note, kept);
      } else {
        const fallback = merged.find((i) => availability[i.id] !== false);
        if (fallback) setNoteIngredients(note, [fallback.id]);
      }
    }
  },

  isInStock: (scentId) => {
    const units = get().stock[scentId];
    return units === undefined || units > 0;
  },

  isAvailable: (ingredientId) => get().availability[ingredientId] !== false,
}));
