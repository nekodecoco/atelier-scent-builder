import { useState, type CSSProperties } from 'react';
import { computeCost, OIL_RATES, type OilGrade } from '../../../lib/costing';
import { formatPeso } from '../../../lib/pricing';
import {
  BOTTLE_SIZES,
  concentrationTier,
  MAX_CONCENTRATION,
  MIN_CONCENTRATION,
  SOLVENT_LABELS,
  type BottleSize,
  type Solvent,
} from '../../../lib/recipe';

const selectClass =
  'rounded border border-ivory-line bg-white/70 px-3 py-2 font-sans text-xs text-neutral-900 outline-none focus:border-gold-deep dark:border-night-line dark:bg-night-card dark:text-cream dark:focus:border-gold';
const labelClass = 'flex flex-col gap-1.5 font-sans text-[10px] uppercase tracking-luxe text-stone-dim';

function peso2(value: number): string {
  return `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function CostingCalculator() {
  const [size, setSize] = useState<BottleSize>(50);
  const [concentration, setConcentration] = useState(15);
  const [solvent, setSolvent] = useState<Solvent>('alcohol');
  const [oilGrade, setOilGrade] = useState<OilGrade>('regular');

  const cost = computeCost(size, concentration, solvent, oilGrade);
  const sliderFill =
    ((concentration - MIN_CONCENTRATION) / (MAX_CONCENTRATION - MIN_CONCENTRATION)) * 100;

  const lines: [string, string][] = [
    [`Fragrance oil · ${cost.oilMl} mL × ₱${OIL_RATES[oilGrade]}/mL`, peso2(cost.oilCost)],
    [`${SOLVENT_LABELS[solvent]} · ${cost.solventMl} mL`, peso2(cost.solventCost)],
    ['Bottle (frosted glass)', peso2(cost.bottleCost)],
    ['Label', peso2(cost.labelCost)],
    ['Labor & risk · 5%', peso2(cost.laborCost)],
    ['VAT · 12%', peso2(cost.vat)],
    [`Excise · ${solvent === 'alcohol' ? '20% (alcohol-based)' : 'none (oil-based)'}`, peso2(cost.excise)],
  ];

  return (
    <div className="rounded-lg border border-ivory-line bg-white/60 p-6 dark:border-night-line dark:bg-night-soft">
      <div className="flex flex-wrap items-end gap-4">
        <label className={labelClass}>
          Bottle size
          <select value={size} onChange={(e) => setSize(Number(e.target.value) as BottleSize)} className={selectClass}>
            {BOTTLE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s} mL
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Solvent
          <select value={solvent} onChange={(e) => setSolvent(e.target.value as Solvent)} className={selectClass}>
            {(Object.keys(SOLVENT_LABELS) as Solvent[]).map((key) => (
              <option key={key} value={key}>
                {SOLVENT_LABELS[key]}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Oil grade
          <select value={oilGrade} onChange={(e) => setOilGrade(e.target.value as OilGrade)} className={selectClass}>
            <option value="regular">Regular · ₱{OIL_RATES.regular}/mL</option>
            <option value="premium">Premium · ₱{OIL_RATES.premium}/mL</option>
          </select>
        </label>

        <div className="flex w-44 flex-col gap-1.5">
          <div className="flex items-baseline justify-between font-sans text-[10px] uppercase tracking-luxe text-stone-dim">
            <span>Concentration</span>
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
            aria-label="Costing concentration percent"
            className="note-slider"
            style={{ '--slider-color': '#b8963f', '--slider-fill': `${sliderFill}%` } as CSSProperties}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <ul className="rounded border border-ivory-line/70 px-4 dark:border-night-line">
          {lines.map(([label, value]) => (
            <li
              key={label}
              className="flex items-baseline justify-between gap-3 border-b border-ivory-line/50 py-2 font-sans text-xs text-stone last:border-b-0 dark:border-night-line/70"
            >
              <span>{label}</span>
              <span className="text-neutral-800 dark:text-cream">{value}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col justify-center gap-3 rounded border border-gold-deep/40 p-5 dark:border-gold/40">
          <div className="flex items-baseline justify-between">
            <span className="font-sans text-[10px] uppercase tracking-luxe text-stone-dim">Total cost</span>
            <span className="font-display text-xl text-neutral-900 dark:text-cream">{peso2(cost.totalCost)}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-sans text-[10px] uppercase tracking-luxe text-stone-dim">
              Selling price · {concentrationTier(concentration)}
            </span>
            <span className="font-display text-xl text-neutral-900 dark:text-cream">{formatPeso(cost.price)}</span>
          </div>
          <div className="flex items-baseline justify-between border-t border-ivory-line/70 pt-3 dark:border-night-line">
            <span className="font-sans text-[10px] uppercase tracking-luxe text-gold-deep dark:text-gold">
              Profit · {cost.marginPct}% margin
            </span>
            <span
              className={`font-display text-2xl ${
                cost.profit >= 0 ? 'text-gold-deep dark:text-gold' : 'text-red-400'
              }`}
            >
              {peso2(cost.profit)}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-4 font-sans text-[10px] text-stone-dim">
        Rates from the Chemworld Fragrance Factory template: regular oil ₱5.6/mL, premium ₱10/mL,
        alcohol ₱0.39/mL, Easyblend ₱1/mL, bottles ₱26–40, label ₱1. Taxes are estimates — confirm
        with your accountant before pricing decisions.
      </p>
    </div>
  );
}
