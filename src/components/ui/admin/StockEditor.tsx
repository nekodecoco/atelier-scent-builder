import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { PREMADE_SCENTS } from '../../../data/premadeScents';
import { upsertStock } from '../../../lib/catalog';
import { useCatalogStore } from '../../../store/useCatalogStore';

function StockRow({ scentId, name, tagline }: { scentId: string; name: string; tagline: string }) {
  const current = useCatalogStore((s) => s.stock[scentId]);
  const reload = useCatalogStore((s) => s.load);
  const [value, setValue] = useState<string>(current !== undefined ? String(current) : '');
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const qty = Number(value);
    if (!Number.isFinite(qty) || qty < 0) return;
    setState('saving');
    const err = await upsertStock(scentId, qty);
    if (err) {
      setState('error');
      setError(err);
      return;
    }
    await reload();
    setState('saved');
    setError(null);
    setTimeout(() => setState('idle'), 1500);
  };

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border-b border-ivory-line/70 py-3.5 last:border-b-0 dark:border-night-line">
      <div>
        <div className="font-display text-lg text-neutral-900 dark:text-cream">{name}</div>
        <div className="font-sans text-[10px] uppercase tracking-luxe text-stone-dim">
          {tagline} · {current === undefined ? 'not tracked yet — treated as in stock' : `${current} in stock`}
        </div>
        {error && <div className="mt-1 font-sans text-xs text-red-400">{error}</div>}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="0"
          aria-label={`Stock for ${name}`}
          className="w-20 rounded border border-ivory-line bg-white/70 px-3 py-2 font-sans text-sm text-neutral-900 outline-none focus:border-gold-deep dark:border-night-line dark:bg-night-card dark:text-cream dark:focus:border-gold"
        />
        <button
          type="button"
          onClick={save}
          disabled={state === 'saving' || value === ''}
          className="flex items-center gap-1.5 rounded border border-gold-deep px-4 py-2 font-sans text-[10px] tracking-luxe text-gold-deep transition-colors hover:bg-gold-deep hover:text-ivory disabled:opacity-50 dark:border-gold dark:text-gold dark:hover:bg-gold dark:hover:text-night"
        >
          {state === 'saving' && <Loader2 size={11} className="animate-spin" aria-hidden />}
          {state === 'saved' && <Check size={11} aria-hidden />}
          {state === 'saved' ? 'SAVED' : 'SAVE'}
        </button>
      </div>
    </li>
  );
}

export function StockEditor() {
  return (
    <ul className="rounded-lg border border-ivory-line bg-white/60 px-5 dark:border-night-line dark:bg-night-soft">
      {PREMADE_SCENTS.map((scent) => (
        <StockRow key={scent.id} scentId={scent.id} name={scent.name} tagline={scent.tagline} />
      ))}
    </ul>
  );
}
