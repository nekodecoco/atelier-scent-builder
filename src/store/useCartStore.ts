import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ScentFormula } from '../data/premadeScents';
import { normalizeSelected } from '../lib/selection';
import type { BottleSize, Solvent } from '../lib/recipe';

export interface CartItem {
  id: string;
  kind: 'custom' | 'premade';
  name: string;
  bottleSize: BottleSize;
  /** Fragrance oil %, absent on items carted before this field existed (= 15) */
  concentration?: number;
  /** Solvent base, absent on older items (= alcohol) */
  solvent?: Solvent;
  qty: number;
  unitPrice: number;
  formula: ScentFormula;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, 'id' | 'qty'>) => void;
  /** Re-add a past order's lines, preserving quantities (used by Reorder) */
  addOrderItems: (items: CartItem[]) => void;
  removeItem: (id: string) => void;
  changeQty: (id: string, delta: number) => void;
  clear: () => void;
  setItems: (items: CartItem[]) => void;
  openCart: () => void;
  closeCart: () => void;
}

/** Two cart lines are the same product when everything but id/qty matches */
function sameLine(a: Omit<CartItem, 'id' | 'qty'>, b: Omit<CartItem, 'id' | 'qty'>): boolean {
  return (
    a.kind === b.kind &&
    a.name === b.name &&
    a.bottleSize === b.bottleSize &&
    (a.concentration ?? 15) === (b.concentration ?? 15) &&
    (a.solvent ?? 'alcohol') === (b.solvent ?? 'alcohol') &&
    JSON.stringify(a.formula) === JSON.stringify(b.formula)
  );
}

/**
 * Fold `incoming` lines into `base`, summing quantities on matching products.
 * Formulas are normalized (legacy shapes from older orders/server carts) at this
 * load boundary. Shared by Reorder and the cross-device cart sync.
 */
export function mergeCartItems(base: CartItem[], incoming: CartItem[]): CartItem[] {
  const items = base.map((i) => ({ ...i }));
  for (const raw of incoming) {
    const item: CartItem = {
      ...raw,
      formula: { ...raw.formula, selected: normalizeSelected(raw.formula.selected) },
    };
    const existing = items.find((i) => sameLine(i, item));
    if (existing) {
      existing.qty += Math.max(1, item.qty);
    } else {
      items.push({ ...item, id: item.id || crypto.randomUUID(), qty: Math.max(1, item.qty) });
    }
  }
  return items;
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,

      addItem: (item) =>
        set((s) => {
          const existing = s.items.find((i) => sameLine(i, item));
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.id === existing.id ? { ...i, qty: i.qty + 1 } : i,
              ),
              isOpen: true,
            };
          }
          return {
            items: [...s.items, { ...item, id: crypto.randomUUID(), qty: 1 }],
            isOpen: true,
          };
        }),

      addOrderItems: (incoming) =>
        set((s) => ({ items: mergeCartItems(s.items, incoming), isOpen: true })),

      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      changeQty: (id, delta) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i,
          ),
        })),

      clear: () => set({ items: [] }),
      setItems: (items) => set({ items }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: 'atelier-cart',
      partialize: (s) => ({ items: s.items }),
    },
  ),
);
