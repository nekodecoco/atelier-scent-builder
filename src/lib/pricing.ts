import { DEFAULT_CONCENTRATION, type BottleSize } from './recipe';

/** Base price at the standard 15% oil concentration */
export const PRICE_BY_SIZE: Record<BottleSize, number> = {
  30: 1450,
  50: 2150,
  100: 3600,
};

/** Surcharge per extra mL of fragrance oil above the 15% standard */
export const OIL_SURCHARGE_PER_ML = 25;

export function priceFor(
  size: BottleSize,
  concentrationPct: number = DEFAULT_CONCENTRATION,
): number {
  const extraOilMl = (size * Math.max(0, concentrationPct - DEFAULT_CONCENTRATION)) / 100;
  return PRICE_BY_SIZE[size] + Math.round(extraOilMl * OIL_SURCHARGE_PER_ML);
}

const peso = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
});

export function formatPeso(amount: number): string {
  return peso.format(amount);
}
