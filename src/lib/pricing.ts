import { DEFAULT_CONCENTRATION, type BottleSize } from './recipe';

export interface PricingConfig {
  /** Builder price at the standard 15% oil concentration, per bottle size */
  bySize: Record<BottleSize, number>;
  /** Surcharge per extra mL of fragrance oil above the 15% standard */
  oilSurchargePerMl: number;
}

export const DEFAULT_PRICING: PricingConfig = {
  bySize: { 30: 1450, 50: 2150, 100: 3600 },
  oilSurchargePerMl: 25,
};

export type PremadePriceMap = Record<string, Partial<Record<BottleSize, number>>>;

/**
 * Admin-set prices live in Supabase and are registered here at runtime
 * (same pattern as the ingredient registry) so pure functions like the
 * costing math can resolve them without React plumbing.
 */
let pricing: PricingConfig = DEFAULT_PRICING;
let premadePrices: PremadePriceMap = {};

export function registerPricing(config: PricingConfig): void {
  pricing = config;
}

export function registerPremadePrices(map: PremadePriceMap): void {
  premadePrices = map;
}

export function getPricing(): PricingConfig {
  return pricing;
}

export function priceFor(
  size: BottleSize,
  concentrationPct: number = DEFAULT_CONCENTRATION,
): number {
  const extraOilMl = (size * Math.max(0, concentrationPct - DEFAULT_CONCENTRATION)) / 100;
  return pricing.bySize[size] + Math.round(extraOilMl * pricing.oilSurchargePerMl);
}

/** A premade's admin-set price; falls back to the builder size price when unset. */
export function premadePriceFor(scentId: string, size: BottleSize): number {
  return premadePrices[scentId]?.[size] ?? priceFor(size);
}

const peso = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
});

export function formatPeso(amount: number): string {
  return peso.format(amount);
}
