import { FlaskConical } from 'lucide-react';
import { getIngredient, NOTE_LABELS } from '../../data/ingredients';
import { inkFor } from '../../lib/color';
import { BOTTLE_SIZES, CONCENTRATION, computeRecipe, type BottleSize } from '../../lib/recipe';
import { useScentStore } from '../../store/useScentStore';

export function RecipeCalculator() {
  const percentages = useScentStore((s) => s.percentages);
  const selected = useScentStore((s) => s.selected);
  const bottleSize = useScentStore((s) => s.bottleSize);
  const setBottleSize = useScentStore((s) => s.setBottleSize);
  const theme = useScentStore((s) => s.theme);

  const recipe = computeRecipe(bottleSize, percentages);

  return (
    <div className="rounded-lg border border-ivory-line bg-white/60 p-6 dark:border-night-line dark:bg-night-soft">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-luxe text-gold-deep dark:text-gold">
            <FlaskConical size={13} aria-hidden />
            Hand-mixer's formulation
          </div>
          <p className="mt-1 font-sans text-xs text-stone">
            Fixed at {CONCENTRATION * 100}% fragrance oil concentration · ~20 drops per mL
          </p>
        </div>

        <label className="flex items-center gap-3 font-sans text-[10px] uppercase tracking-luxe text-stone-dim">
          Bottle size
          <select
            value={bottleSize}
            onChange={(e) => setBottleSize(Number(e.target.value) as BottleSize)}
            className="rounded border border-ivory-line bg-white/70 px-3 py-2 font-sans text-xs tracking-normal text-neutral-900 outline-none focus:border-gold-deep dark:border-night-line dark:bg-night-card dark:text-cream dark:focus:border-gold"
          >
            {BOTTLE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} mL
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {recipe.notes.map(({ note, ml, drops }) => {
          const ingredient = getIngredient(note, selected[note]);
          return (
            <div
              key={note}
              className="rounded border border-ivory-line/70 p-3.5 dark:border-night-line"
            >
              <div className="font-sans text-[9px] uppercase tracking-luxe text-stone-dim">
                {NOTE_LABELS[note]} · {percentages[note]}%
              </div>
              <div className="mt-1 truncate font-sans text-[11px] text-stone">{ingredient.name}</div>
              <div className="mt-1.5 font-display text-2xl" style={{ color: inkFor(ingredient.color, theme) }}>
                {ml} mL
              </div>
              <div className="font-sans text-[10px] text-stone-dim">≈ {drops} drops</div>
            </div>
          );
        })}

        <div className="rounded border border-ivory-line/70 p-3.5 dark:border-night-line">
          <div className="font-sans text-[9px] uppercase tracking-luxe text-stone-dim">Total oil</div>
          <div className="mt-1 font-sans text-[11px] text-stone">All three notes</div>
          <div className="mt-1.5 font-display text-2xl text-gold-deep dark:text-gold">
            {recipe.oilTotalMl} mL
          </div>
          <div className="font-sans text-[10px] text-stone-dim">
            {bottleSize} mL × {CONCENTRATION * 100}%
          </div>
        </div>

        <div className="rounded border border-ivory-line/70 p-3.5 dark:border-night-line">
          <div className="font-sans text-[9px] uppercase tracking-luxe text-stone-dim">
            Perfumer's alcohol
          </div>
          <div className="mt-1 font-sans text-[11px] text-stone">Fills the rest</div>
          <div className="mt-1.5 font-display text-2xl text-neutral-900 dark:text-cream">
            {recipe.alcoholMl} mL
          </div>
          <div className="font-sans text-[10px] text-stone-dim">
            {bottleSize} − {recipe.oilTotalMl} mL
          </div>
        </div>
      </div>
    </div>
  );
}
