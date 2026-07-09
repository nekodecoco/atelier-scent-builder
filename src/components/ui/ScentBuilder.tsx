import { Droplets, RotateCcw, ShoppingBag } from 'lucide-react';
import { NOTE_KEYS, NOTE_TAGLINES } from '../../data/ingredients';
import { formatPeso, PRICE_BY_SIZE } from '../../lib/pricing';
import { useCartStore } from '../../store/useCartStore';
import { useScentStore } from '../../store/useScentStore';
import { Scene } from '../three/Scene';
import { CustomNameInput } from './CustomNameInput';
import { IngredientPicker } from './IngredientPicker';
import { NoteSlider } from './NoteSlider';
import { RecipeCalculator } from './RecipeCalculator';
import { Reveal } from './Reveal';
import { ScentTwinCard } from './ScentTwinCard';

export function ScentBuilder() {
  const resetBlend = useScentStore((s) => s.resetBlend);
  const bottleSize = useScentStore((s) => s.bottleSize);
  const blended = useScentStore((s) => s.blended);
  const toggleBlended = useScentStore((s) => s.toggleBlended);
  const addItem = useCartStore((s) => s.addItem);

  const addBlendToCart = () => {
    const { customName, selected, percentages } = useScentStore.getState();
    addItem({
      kind: 'custom',
      name: customName.trim() || 'Unnamed Blend',
      bottleSize,
      unitPrice: PRICE_BY_SIZE[bottleSize],
      formula: { selected: { ...selected }, percentages: { ...percentages } },
    });
  };

  return (
    <section id="builder" className="mx-auto max-w-6xl px-5 py-24">
      <p className="font-sans text-[11px] tracking-luxe text-gold-deep dark:text-gold">THE ATELIER</p>
      <h2 className="mt-3 font-display text-5xl font-medium text-neutral-900 dark:text-cream">
        Scent builder
      </h2>
      <p className="mt-3 max-w-lg font-sans text-sm leading-relaxed text-stone">
        Every blend totals exactly 100%. Shift one note and the others rebalance —
        lock a note to hold it in place.
      </p>

      <div className="mt-12 grid gap-8 lg:grid-cols-[5fr_6fr]">
        <div className="relative h-[420px] overflow-hidden rounded-lg border border-ivory-line dark:border-night-line sm:h-[520px] lg:h-auto lg:min-h-[560px]">
          <Scene />
          <span className="pointer-events-none absolute left-4 top-4 font-sans text-[10px] tracking-luxe text-stone-dim">
            DRAG TO ROTATE
          </span>
          <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap font-sans text-[10px] tracking-luxe text-stone-dim">
            LIVE LABEL PREVIEW
          </span>
        </div>

        <div className="flex flex-col gap-5">
          <CustomNameInput />

          {NOTE_KEYS.map((note) => (
            <div
              key={note}
              className="rounded-lg border border-ivory-line bg-white/60 p-5 dark:border-night-line dark:bg-night-soft"
            >
              <NoteSlider note={note} />
              <p className="mt-3 font-sans text-[11px] italic leading-relaxed text-stone-dim">
                {NOTE_TAGLINES[note]}
              </p>
              <IngredientPicker note={note} />
            </div>
          ))}

          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={resetBlend}
              className="flex items-center justify-center gap-2 rounded border border-gold-deep px-4 py-3 font-sans text-[10px] tracking-luxe text-gold-deep transition-colors hover:bg-gold-deep hover:text-ivory dark:border-gold dark:text-gold dark:hover:bg-gold dark:hover:text-night"
            >
              <RotateCcw size={13} aria-hidden />
              RESET TO MASTER BLEND
            </button>
            <ScentTwinCard />
          </div>

          <button
            type="button"
            onClick={toggleBlended}
            aria-pressed={blended}
            className={`flex items-center justify-center gap-2 rounded border px-4 py-3.5 font-sans text-[11px] tracking-luxe transition-colors ${
              blended
                ? 'border-gold-deep bg-gold-deep/10 text-gold-deep dark:border-gold dark:bg-gold/10 dark:text-gold'
                : 'border-ivory-line text-stone hover:border-gold-deep hover:text-gold-deep dark:border-night-line dark:hover:border-gold dark:hover:text-gold'
            }`}
          >
            <Droplets size={14} aria-hidden />
            {blended ? 'BLENDED — ADJUST ANYTHING TO SEPARATE' : 'BLEND MY SCENT'}
          </button>

          <button
            type="button"
            onClick={addBlendToCart}
            className="flex items-center justify-center gap-2 rounded bg-gold-deep px-4 py-4 font-sans text-[11px] tracking-luxe text-ivory transition-opacity hover:opacity-90 dark:bg-gold dark:text-night"
          >
            <ShoppingBag size={14} aria-hidden />
            ADD TO CART · {bottleSize} ML · {formatPeso(PRICE_BY_SIZE[bottleSize])}
          </button>
        </div>
      </div>

      <Reveal className="mt-8">
        <RecipeCalculator />
      </Reveal>
    </section>
  );
}
