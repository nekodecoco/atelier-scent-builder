import type { CSSProperties } from 'react';
import { FlaskConical } from 'lucide-react';
import { getIngredient, NOTE_LABELS } from '../../data/ingredients';
import { inkFor, noteColor } from '../../lib/color';
import { formatPeso, priceFor } from '../../lib/pricing';
import {
  BOTTLE_SIZES,
  computeRecipe,
  concentrationTier,
  MAX_CONCENTRATION,
  MIN_CONCENTRATION,
  SOLVENT_LABELS,
  type BottleSize,
  type Solvent,
} from '../../lib/recipe';
import { useCatalogStore } from '../../store/useCatalogStore';
import { useScentStore } from '../../store/useScentStore';

export function RecipeCalculator() {
  // re-render when admin-set pricing loads/changes
  useCatalogStore((s) => s.pricing);
  const percentages = useScentStore((s) => s.percentages);
  const selected = useScentStore((s) => s.selected);
  const bottleSize = useScentStore((s) => s.bottleSize);
  const setBottleSize = useScentStore((s) => s.setBottleSize);
  const concentration = useScentStore((s) => s.concentration);
  const setConcentration = useScentStore((s) => s.setConcentration);
  const solvent = useScentStore((s) => s.solvent);
  const setSolvent = useScentStore((s) => s.setSolvent);

  const recipe = computeRecipe(bottleSize, percentages, concentration);
  const sliderFill =
    ((concentration - MIN_CONCENTRATION) / (MAX_CONCENTRATION - MIN_CONCENTRATION)) * 100;

  return (
    <div className="rounded-lg border border-ivory-line bg-white/60 p-6 dark:border-night-line dark:bg-night-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-luxe text-gold-deep dark:text-gold">
            <FlaskConical size={13} aria-hidden />
            Hand-mixer's formulation
          </div>
          <p className="mt-1 font-sans text-xs text-stone">
            {concentration}% fragrance oil · {concentrationTier(concentration)} · ~20 drops per mL
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1.5 font-sans text-[10px] uppercase tracking-luxe text-stone-dim">
            Bottle size
            <select
              value={bottleSize}
              onChange={(e) => setBottleSize(Number(e.target.value) as BottleSize)}
              className="rounded border border-ivory-line bg-white/70 px-3 py-2 font-sans text-xs tracking-normal text-neutral-900 outline-none focus:border-gold-deep dark:border-night-line dark:bg-night-card dark:text-cream dark:focus:border-gold"
            >
              {BOTTLE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size} mL · {formatPeso(priceFor(size, concentration))}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 font-sans text-[10px] uppercase tracking-luxe text-stone-dim">
            Solvent
            <select
              value={solvent}
              onChange={(e) => setSolvent(e.target.value as Solvent)}
              className="rounded border border-ivory-line bg-white/70 px-3 py-2 font-sans text-xs tracking-normal text-neutral-900 outline-none focus:border-gold-deep dark:border-night-line dark:bg-night-card dark:text-cream dark:focus:border-gold"
            >
              {(Object.keys(SOLVENT_LABELS) as Solvent[]).map((key) => (
                <option key={key} value={key}>
                  {SOLVENT_LABELS[key]}
                </option>
              ))}
            </select>
          </label>

          <div className="flex w-44 flex-col gap-1.5">
            <div className="flex items-baseline justify-between font-sans text-[10px] uppercase tracking-luxe text-stone-dim">
              <span>Oil concentration</span>
              <span className="font-display text-sm normal-case tracking-normal text-neutral-900 dark:text-cream">
                {concentration}%
              </span>
            </div>
            <input
              type="range"
              min={MIN_CONCENTRATION}
              max={MAX_CONCENTRATION}
              step={1}
              value={concentration}
              onChange={(e) => setConcentration(Number(e.target.value))}
              aria-label="Fragrance oil concentration percent"
              className="note-slider"
              style={
                {
                  '--slider-color': '#b8963f',
                  '--slider-fill': `${sliderFill}%`,
                } as CSSProperties
              }
            />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {recipe.notes.map(({ note, ml, drops }) => {
          const ids = selected[note];
          const count = ids.length;
          return (
            <div
              key={note}
              className="rounded border border-ivory-line/70 p-3.5 dark:border-night-line"
            >
              <div className="font-sans text-[9px] uppercase tracking-luxe text-stone-dim">
                {NOTE_LABELS[note]} · {percentages[note]}%
              </div>
              <div className="mt-1.5 font-display text-2xl" style={{ color: inkFor(noteColor(note, ids)) }}>
                {ml} mL
              </div>
              <div className="font-sans text-[10px] text-stone-dim">
                ≈ {drops} drops{count > 1 ? ` · split ${count} ways` : ''}
              </div>
              <div className="mt-2 space-y-0.5">
                {ids.map((id) => {
                  const ingredient = getIngredient(note, id);
                  const partMl = Math.round((ml / count) * 10) / 10;
                  const partDrops = Math.round(drops / count);
                  return (
                    <div key={id} className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-sans text-[11px] text-stone">{ingredient.name}</span>
                      {count > 1 && (
                        <span className="whitespace-nowrap font-sans text-[9px] text-stone-dim">
                          {partMl} mL · ~{partDrops} dr
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
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
            {bottleSize} mL × {concentration}%
          </div>
        </div>

        <div className="rounded border border-ivory-line/70 p-3.5 dark:border-night-line">
          <div className="truncate font-sans text-[9px] uppercase tracking-luxe text-stone-dim">
            {SOLVENT_LABELS[solvent]}
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

      <p className="mt-4 font-sans text-[10px] text-stone-dim">
        Every formula is hand-mixed to order — fragrance oil blended with perfumer's alcohol
        or an oil base, filling your chosen bottle volume.
      </p>
    </div>
  );
}
