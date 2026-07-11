import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { upsertPricing } from '../../../lib/catalog';
import type { BottleSize } from '../../../lib/recipe';
import { useCatalogStore } from '../../../store/useCatalogStore';

const inputClass =
  'w-full rounded border border-ivory-line bg-white/70 px-3 py-2.5 font-sans text-sm text-neutral-900 outline-none focus:border-gold-deep dark:border-night-line dark:bg-night-card dark:text-cream dark:focus:border-gold';
const labelClass = 'font-sans text-[10px] uppercase tracking-luxe text-stone-dim';

export function PricingEditor() {
  const pricing = useCatalogStore((s) => s.pricing);
  const reload = useCatalogStore((s) => s.load);

  const [values, setValues] = useState({
    30: String(pricing.bySize[30]),
    50: String(pricing.bySize[50]),
    100: String(pricing.bySize[100]),
    surcharge: String(pricing.oilSurchargePerMl),
  });
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);

  // refresh the form when the catalog (re)loads
  useEffect(() => {
    setValues({
      30: String(pricing.bySize[30]),
      50: String(pricing.bySize[50]),
      100: String(pricing.bySize[100]),
      surcharge: String(pricing.oilSurchargePerMl),
    });
  }, [pricing]);

  const valid =
    ([30, 50, 100] as const).every((size) => Number(values[size]) > 0) &&
    Number(values.surcharge) >= 0;

  const save = async () => {
    if (!valid) return;
    setState('saving');
    const err = await upsertPricing({
      bySize: {
        30: Math.round(Number(values[30])),
        50: Math.round(Number(values[50])),
        100: Math.round(Number(values[100])),
      },
      oilSurchargePerMl: Math.round(Number(values.surcharge)),
    });
    if (err) {
      setState('idle');
      setError(err);
      return;
    }
    setError(null);
    await reload();
    setState('saved');
    setTimeout(() => setState('idle'), 1500);
  };

  return (
    <div className="rounded-lg border border-ivory-line bg-white/60 p-6 dark:border-night-line dark:bg-night-soft">
      <div className="grid gap-4 sm:grid-cols-4">
        {([30, 50, 100] as BottleSize[]).map((size) => (
          <label key={size} className={labelClass}>
            {size} mL bottle · ₱
            <input
              type="number"
              min={1}
              value={values[size]}
              onChange={(e) => setValues((v) => ({ ...v, [size]: e.target.value }))}
              className={`mt-1.5 ${inputClass}`}
            />
          </label>
        ))}
        <label className={labelClass}>
          Oil surcharge · ₱/extra mL
          <input
            type="number"
            min={0}
            value={values.surcharge}
            onChange={(e) => setValues((v) => ({ ...v, surcharge: e.target.value }))}
            className={`mt-1.5 ${inputClass}`}
          />
        </label>
      </div>

      <p className="mt-3 font-sans text-[10px] leading-relaxed text-stone-dim">
        These price the custom scent builder at 15% oil. Stronger blends add the surcharge per
        extra mL of fragrance oil — e.g. a 50 mL bottle at 25% adds 5 mL ×
        ₱{values.surcharge || 0}.
      </p>

      {error && (
        <p className="mt-2 font-sans text-xs text-red-400" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={save}
        disabled={state === 'saving' || !valid}
        className="mt-4 flex items-center gap-2 rounded bg-gold-deep px-5 py-2.5 font-sans text-[10px] tracking-luxe text-ivory transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-gold dark:text-night"
      >
        {state === 'saving' && <Loader2 size={12} className="animate-spin" aria-hidden />}
        {state === 'saved' && <Check size={12} aria-hidden />}
        {state === 'saved' ? 'SAVED' : 'SAVE PRICES'}
      </button>
    </div>
  );
}
