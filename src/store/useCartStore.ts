import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ScentFormula } from '../data/premadeScents';
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
  removeItem: (id: string) => void;
  changeQty: (id: string, delta: number) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
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
          const existing = s.items.find(
            (i) =>
              i.kind === item.kind &&
              i.name === item.name &&
              i.bottleSize === item.bottleSize &&
              (i.concentration ?? 15) === (item.concentration ?? 15) &&
              (i.solvent ?? 'alcohol') === (item.solvent ?? 'alcohol') &&
              JSON.stringify(i.formula) === JSON.stringify(item.formula),
          );
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

      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      changeQty: (id, delta) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i,
          ),
        })),

      clear: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: 'atelier-cart',
      partialize: (s) => ({ items: s.items }),
    },
  ),
);
