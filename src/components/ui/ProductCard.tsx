import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIngredient } from '../../data/ingredients';
import type { PremadeScent } from '../../data/premadeScents';
import { formatPeso, premadePriceFor } from '../../lib/pricing';
import { BOTTLE_SIZES, DEFAULT_CONCENTRATION, type BottleSize } from '../../lib/recipe';
import { useCartStore } from '../../store/useCartStore';
import { useCatalogStore } from '../../store/useCatalogStore';
import { useScentStore } from '../../store/useScentStore';
import { ProductBottle } from './ProductBottle';
import { ScentWash } from './ScentWash';

export function ProductCard({ scent, tag }: { scent: PremadeScent; tag?: string }) {
  const [size, setSize] = useState<BottleSize>(50);
  const addItem = useCartStore((s) => s.addItem);
  const loadFormula = useScentStore((s) => s.loadFormula);
  const inStock = useCatalogStore((s) => s.isInStock(scent.id));
  const imageUrl = useCatalogStore((s) => s.premadeImages[scent.id]);
  useCatalogStore((s) => s.premadePrices);
  useCatalogStore((s) => s.pricing);
  const navigate = useNavigate();

  const price = premadePriceFor(scent.id, size);

  const notes = [
    { label: 'TOP', name: getIngredient('top', scent.formula.selected.top).name },
    { label: 'HEART', name: getIngredient('heart', scent.formula.selected.heart).name },
    { label: 'BASE', name: getIngredient('base', scent.formula.selected.base).name },
  ];

  const quickAdd = () =>
    addItem({
      kind: 'premade',
      name: scent.name,
      bottleSize: size,
      concentration: DEFAULT_CONCENTRATION,
      solvent: 'alcohol',
      unitPrice: price,
      formula: scent.formula,
    });

  const remix = () => {
    loadFormula(scent.formula, scent.name);
    navigate('/builder');
  };

  return (
    <article className="group flex w-full flex-col">
      <ScentWash formula={scent.formula} imageUrl={imageUrl} className="aspect-[4/5]">
        {(tag || !inStock) && (
          <span className="absolute left-3 top-3 font-sans text-[9px] font-medium tracking-[0.18em] text-paper drop-shadow">
            {!inStock ? 'OUT OF STOCK' : tag}
          </span>
        )}
        {!imageUrl && (
          <div className="absolute inset-0 flex items-end justify-center pb-4">
            <ProductBottle
              formula={scent.formula}
              name={scent.name}
              className="h-[72%] w-auto transition-transform duration-500 group-hover:scale-[1.04]"
            />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink/50 opacity-0 backdrop-blur-[1px] transition-opacity duration-300 group-hover:opacity-100">
          {notes.map(({ label, name }) => (
            <div key={label} className="text-center">
              <p className="font-sans text-[8px] font-medium tracking-[0.22em] text-paper/60">{label}</p>
              <p className="font-display text-sm italic text-paper">{name}</p>
            </div>
          ))}
        </div>
      </ScentWash>

      <div className="flex flex-1 flex-col items-center px-2 pb-5 pt-4 text-center">
        <h2 className="font-grotesk text-[13px] font-bold uppercase tracking-[0.14em] text-ink">
          {scent.name}
        </h2>
        <p className="mt-1 font-sans text-[11px] text-muted">{scent.tagline}</p>

        <div className="mt-2 flex items-center gap-2 font-sans text-[10px] text-muted">
          {BOTTLE_SIZES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSize(option)}
              aria-pressed={size === option}
              className={`border-b pb-0.5 transition-colors ${
                size === option
                  ? 'border-ink text-ink'
                  : 'border-transparent hover:text-ink'
              }`}
            >
              {option}mL
            </button>
          ))}
        </div>

        <p className="mt-2 font-sans text-xs text-ink">{formatPeso(price)}</p>

        <button
          type="button"
          disabled={!inStock}
          onClick={quickAdd}
          className="mt-3 w-full border border-ink py-2.5 font-sans text-[10px] font-medium tracking-[0.18em] text-ink transition-colors hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-40"
        >
          {inStock ? 'QUICK ADD' : 'OUT OF STOCK'}
        </button>

        <button
          type="button"
          onClick={remix}
          className="mt-2.5 font-sans text-[9px] tracking-[0.18em] text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
        >
          REMIX IN BUILDER
        </button>
      </div>
    </article>
  );
}
