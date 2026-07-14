import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PremadeScent } from '../../data/premadeScents';
import { formatPeso, premadePriceFor } from '../../lib/pricing';
import { BOTTLE_SIZES, DEFAULT_CONCENTRATION, type BottleSize } from '../../lib/recipe';
import { useCartStore } from '../../store/useCartStore';
import { useCatalogStore } from '../../store/useCatalogStore';
import { useScentStore } from '../../store/useScentStore';
import { ProductBottle } from './ProductBottle';
import { ScentWash } from './ScentWash';

export function LandingProductCard({ scent, tag }: { scent: PremadeScent; tag?: string }) {
  const [size, setSize] = useState<BottleSize>(50);
  const addItem = useCartStore((s) => s.addItem);
  const loadFormula = useScentStore((s) => s.loadFormula);
  const inStock = useCatalogStore((s) => s.isInStock(scent.id));
  const imageUrl = useCatalogStore((s) => s.premadeImages[scent.id]);
  useCatalogStore((s) => s.premadePrices);
  useCatalogStore((s) => s.pricing);
  const navigate = useNavigate();

  const price = premadePriceFor(scent.id, size);

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
          <span className="absolute left-3 top-3 font-jetbrains text-[9px] font-medium uppercase tracking-[0.1em] text-white drop-shadow">
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
      </ScentWash>

      <div className="flex flex-1 flex-col items-center px-2 pb-5 pt-4 text-center">
        <h2 className="font-hanken text-[13px] font-bold uppercase tracking-[0.08em] text-black">
          {scent.name}
        </h2>
        <p className="mt-1 font-hanken text-[11px] text-graphite">{scent.tagline}</p>

        <div className="mt-3 flex items-center gap-1.5">
          {BOTTLE_SIZES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSize(option)}
              aria-pressed={size === option}
              className={`h-7 w-11 border font-jetbrains text-[9px] transition-colors ${
                size === option
                  ? 'border-black bg-black text-white'
                  : 'border-black/30 text-graphite hover:border-black hover:text-black'
              }`}
            >
              {option}mL
            </button>
          ))}
        </div>

        <p className="mt-2 font-jetbrains text-xs text-black">{formatPeso(price)}</p>

        <button
          type="button"
          disabled={!inStock}
          onClick={quickAdd}
          className="mt-3 w-full border border-black py-2.5 font-jetbrains text-[10px] font-medium uppercase tracking-[0.1em] text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {inStock ? 'QUICK ADD' : 'OUT OF STOCK'}
        </button>

        <button
          type="button"
          onClick={remix}
          className="mt-2.5 font-jetbrains text-[9px] uppercase tracking-[0.1em] text-graphite underline-offset-4 transition-colors hover:text-black hover:underline"
        >
          REMIX IN BUILDER
        </button>
      </div>
    </article>
  );
}
