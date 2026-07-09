import type { BottleSize } from './recipe';

export const PRICE_BY_SIZE: Record<BottleSize, number> = {
  30: 1450,
  50: 2150,
  100: 3600,
};

const peso = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
});

export function formatPeso(amount: number): string {
  return peso.format(amount);
}
