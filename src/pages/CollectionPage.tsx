import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, SlidersHorizontal } from 'lucide-react';
import { BottlePreview } from '../components/ui/BottlePreview';
import { getIngredient, NOTE_KEYS } from '../data/ingredients';
import { PREMADE_SCENTS, type PremadeScent } from '../data/premadeScents';
import { inkFor } from '../lib/color';
import { formatPeso, PRICE_BY_SIZE } from '../lib/pricing';
import { BOTTLE_SIZES, type BottleSize } from '../lib/recipe';
import { useCartStore } from '../store/useCartStore';
import { useScentStore } from '../store/useScentStore';

function PremadeCard({ scent }: { scent: PremadeScent }) {
  const [size, setSize] = useState<BottleSize>(50);
  const addItem = useCartStore((s) => s.addItem);
  const loadFormula = useScentStore((s) => s.loadFormula);
  const theme = useScentStore((s) => s.theme);
  const navigate = useNavigate();

  const remix = () => {
    loadFormula(scent.formula, scent.name);
    navigate('/#builder');
  };

  return (
    <article className="flex flex-col rounded-lg border border-ivory-line bg-white/60 p-6 dark:border-night-line dark:bg-night-soft">
      <div className="flex h-44 items-center justify-center">
        <BottlePreview formula={scent.formula} name={scent.name} />
      </div>

      <p className="mt-5 font-sans text-[10px] uppercase tracking-luxe text-gold-deep dark:text-gold">
        {scent.tagline}
      </p>
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
          onClick={() =>
            addItem({
              kind: 'premade',
              name: scent.name,
              bottleSize: size,
              unitPrice: PRICE_BY_SIZE[size],
              formula: scent.formula,
            })
          }
          className="flex items-center justify-center gap-2 rounded bg-gold-deep px-4 py-3 font-sans text-[10px] tracking-luxe text-ivory transition-opacity hover:opacity-90 dark:bg-gold dark:text-night"
        >
          <ShoppingBag size={13} aria-hidden />
          ADD TO CART
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

export function CollectionPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-24 pt-32">
      <p className="font-sans text-[11px] tracking-luxe text-gold-deep dark:text-gold">THE COLLECTION</p>
      <h1 className="mt-3 font-display text-5xl font-medium text-neutral-900 dark:text-cream">
        Premade signatures
      </h1>
      <p className="mt-3 max-w-lg font-sans text-sm leading-relaxed text-stone">
        Six house blends, composed by our perfumers. Take one as it is — or press
        remix and make it yours in the scent builder.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PREMADE_SCENTS.map((scent) => (
          <PremadeCard key={scent.id} scent={scent} />
        ))}
      </div>
    </section>
  );
}
