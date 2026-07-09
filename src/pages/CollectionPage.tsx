import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, SlidersHorizontal } from 'lucide-react';
import { BottlePreview } from '../components/ui/BottlePreview';
import { Reveal } from '../components/ui/Reveal';
import { getIngredient, NOTE_KEYS } from '../data/ingredients';
import { PREMADE_SCENTS, type PremadeScent } from '../data/premadeScents';
import { inkFor } from '../lib/color';
import { formatPeso, PRICE_BY_SIZE } from '../lib/pricing';
import { BOTTLE_SIZES, type BottleSize } from '../lib/recipe';
import { useCartStore } from '../store/useCartStore';
import { useCatalogStore } from '../store/useCatalogStore';
import { useScentStore } from '../store/useScentStore';

function PremadeCard({ scent }: { scent: PremadeScent }) {
  const [size, setSize] = useState<BottleSize>(50);
  const addItem = useCartStore((s) => s.addItem);
  const loadFormula = useScentStore((s) => s.loadFormula);
  const theme = useScentStore((s) => s.theme);
  const inStock = useCatalogStore((s) => s.isInStock(scent.id));
  const navigate = useNavigate();

  const remix = () => {
    loadFormula(scent.formula, scent.name);
    navigate('/#builder');
  };

  return (
    <article className="group flex w-full flex-col rounded-lg border border-ivory-line bg-white/60 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold-deep/40 hover:shadow-xl hover:shadow-black/5 dark:border-night-line dark:bg-night-soft dark:hover:border-gold/30 dark:hover:shadow-black/40">
      <div className="flex h-44 items-center justify-center transition-transform duration-500 group-hover:scale-[1.04]">
        <BottlePreview formula={scent.formula} name={scent.name} />
      </div>

      <div className="mt-5 flex items-center justify-between gap-2">
        <p className="font-sans text-[10px] uppercase tracking-luxe text-gold-deep dark:text-gold">
          {scent.tagline}
        </p>
        {!inStock && (
          <span className="rounded-full border border-stone-dim/50 px-2.5 py-0.5 font-sans text-[9px] uppercase tracking-luxe text-stone-dim">
            Out of stock
          </span>
        )}
      </div>
      <h2 className="mt-1 font-display text-2xl text-neutral-900 dark:text-cream">{scent.name}</h2>
      <p className="mt-2 flex-1 font-sans text-xs leading-relaxed text-stone">{scent.description}</p>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-sans text-[10px] uppercase tracking-wider text-stone-dim">
        {NOTE_KEYS.map((note) => {
          const ingredient = getIngredient(note, scent.formula.selected[note]);
          return (
            <span key={note}>
              <span style={{ color: inkFor(ingredient.color, theme) }}>{ingredient.name}</span>{' '}
              {scent.formula.percentages[note]}%
            </span>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-ivory-line pt-4 dark:border-night-line">
        <select
          value={size}
          onChange={(e) => setSize(Number(e.target.value) as BottleSize)}
          aria-label={`Bottle size for ${scent.name}`}
          className="rounded border border-ivory-line bg-white/70 px-2.5 py-2 font-sans text-xs text-neutral-900 outline-none focus:border-gold-deep dark:border-night-line dark:bg-night-card dark:text-cream dark:focus:border-gold"
        >
          {BOTTLE_SIZES.map((s) => (
            <option key={s} value={s}>
              {s} mL
            </option>
          ))}
        </select>
        <span className="font-display text-xl text-neutral-900 dark:text-cream">
          {formatPeso(PRICE_BY_SIZE[size])}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
        <button
          type="button"
          disabled={!inStock}
          onClick={() =>
            addItem({
              kind: 'premade',
              name: scent.name,
              bottleSize: size,
              unitPrice: PRICE_BY_SIZE[size],
              formula: scent.formula,
            })
          }
          className="flex items-center justify-center gap-2 rounded bg-gold-deep px-4 py-3 font-sans text-[10px] tracking-luxe text-ivory transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-gold dark:text-night"
        >
          <ShoppingBag size={13} aria-hidden />
          {inStock ? 'ADD TO CART' : 'OUT OF STOCK'}
        </button>
        <button
          type="button"
          onClick={remix}
          title="Load this formula into the scent builder"
          className="flex items-center justify-center gap-2 rounded border border-gold-deep px-4 py-3 font-sans text-[10px] tracking-luxe text-gold-deep transition-colors hover:bg-gold-deep hover:text-ivory dark:border-gold dark:text-gold dark:hover:bg-gold dark:hover:text-night"
        >
          <SlidersHorizontal size={13} aria-hidden />
          REMIX
        </button>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border border-ivory-line bg-white/40 p-6 dark:border-night-line dark:bg-night-soft">
      <div className="mx-auto h-44 w-24 rounded bg-ivory-soft dark:bg-night-card" />
      <div className="mt-5 h-2.5 w-24 rounded bg-ivory-soft dark:bg-night-card" />
      <div className="mt-3 h-6 w-40 rounded bg-ivory-soft dark:bg-night-card" />
      <div className="mt-3 h-2.5 w-full rounded bg-ivory-soft dark:bg-night-card" />
      <div className="mt-2 h-2.5 w-3/4 rounded bg-ivory-soft dark:bg-night-card" />
      <div className="mt-6 h-11 w-full rounded bg-ivory-soft dark:bg-night-card" />
    </div>
  );
}

export function CollectionPage() {
  const loaded = useCatalogStore((s) => s.loaded);
  const hiddenPremades = useCatalogStore((s) => s.hiddenPremades);
  const customPremades = useCatalogStore((s) => s.customPremades);

  const visible = [
    ...PREMADE_SCENTS.filter((scent) => !hiddenPremades[scent.id]),
    ...customPremades,
  ];

  return (
    <section className="mx-auto max-w-6xl px-5 pb-24 pt-32">
      <p className="font-sans text-[11px] tracking-luxe text-gold-deep dark:text-gold">THE COLLECTION</p>
      <h1 className="mt-3 font-display text-5xl font-medium text-neutral-900 dark:text-cream">
        Premade signatures
      </h1>
      <p className="mt-3 max-w-lg font-sans text-sm leading-relaxed text-stone">
        House blends composed by our perfumers. Take one as it is — or press
        remix and make it yours in the scent builder.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {!loaded
          ? Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)
          : visible.map((scent, i) => (
              <Reveal key={scent.id} delay={(i % 3) * 90} className="flex">
                <PremadeCard scent={scent} />
              </Reveal>
            ))}
      </div>

      {loaded && visible.length === 0 && (
        <p className="mt-12 text-center font-display text-xl italic text-stone">
          The collection is being recomposed — check back soon.
        </p>
      )}
    </section>
  );
}
