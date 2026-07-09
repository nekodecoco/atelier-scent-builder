import type { CartItem } from '../store/useCartStore';
import { priceFor } from './pricing';
import { DEFAULT_CONCENTRATION, type BottleSize, type Solvent } from './recipe';

/**
 * Supplier rates from the Chemworld Fragrance Factory template (PHP).
 * Oil: ₱5.6/mL regular, ₱10/mL premium (net of discounts). Solvents:
 * alcohol ≈ ₱0.39/mL, Easyblend ≈ ₱1.0/mL. Frosted glass bottles at
 * 30/50/100 mL SRP, label ₱1, labor 5%, VAT 12%. Alcohol-based perfume
 * carries 20% excise tax in their costing; oil-based carries none.
 */
export type OilGrade = 'regular' | 'premium';

export const OIL_RATES: Record<OilGrade, number> = { regular: 5.6, premium: 10 };
export const SOLVENT_RATES: Record<Solvent, number> = { alcohol: 0.39, easyblend: 1.0 };
export const BOTTLE_COSTS: Record<BottleSize, number> = { 30: 26, 50: 28, 100: 40 };
export const LABEL_COST = 1;
export const LABOR_PCT = 5;
export const VAT_PCT = 12;
export const EXCISE_PCT = 20;

export interface CostBreakdown {
  oilMl: number;
  solventMl: number;
  oilCost: number;
  solventCost: number;
  bottleCost: number;
  labelCost: number;
  productCost: number;
  laborCost: number;
  vat: number;
  excise: number;
  totalCost: number;
  price: number;
  profit: number;
  marginPct: number;
}

const r2 = (v: number) => Math.round(v * 100) / 100;

export function computeCost(
  size: BottleSize,
  concentrationPct: number,
  solvent: Solvent,
  oilGrade: OilGrade,
): CostBreakdown {
  const oilMl = (size * concentrationPct) / 100;
  const solventMl = size - oilMl;
  const oilCost = oilMl * OIL_RATES[oilGrade];
  const solventCost = solventMl * SOLVENT_RATES[solvent];
  const bottleCost = BOTTLE_COSTS[size];
  const productCost = oilCost + solventCost + bottleCost + LABEL_COST;
  const laborCost = productCost * (LABOR_PCT / 100);
  const beforeTax = productCost + laborCost;
  const vat = beforeTax * (VAT_PCT / 100);
  const excise = solvent === 'alcohol' ? (beforeTax + vat) * (EXCISE_PCT / 100) : 0;
  const totalCost = beforeTax + vat + excise;
  const price = priceFor(size, concentrationPct);
  const profit = price - totalCost;

  return {
    oilMl: r2(oilMl),
    solventMl: r2(solventMl),
    oilCost: r2(oilCost),
    solventCost: r2(solventCost),
    bottleCost,
    labelCost: LABEL_COST,
    productCost: r2(productCost),
    laborCost: r2(laborCost),
    vat: r2(vat),
    excise: r2(excise),
    totalCost: r2(totalCost),
    price,
    profit: r2(profit),
    marginPct: price > 0 ? Math.round((profit / price) * 100) : 0,
  };
}

/** Estimated cost of one order line (qty included), regular-grade oil assumed. */
export function orderItemCost(item: CartItem): number {
  const breakdown = computeCost(
    item.bottleSize,
    item.concentration ?? DEFAULT_CONCENTRATION,
    item.solvent ?? 'alcohol',
    'regular',
  );
  return r2(breakdown.totalCost * item.qty);
}
