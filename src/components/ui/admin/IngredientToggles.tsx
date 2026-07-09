import { useState } from 'react';
import { INGREDIENTS, NOTE_KEYS, NOTE_LABELS } from '../../../data/ingredients';
import { setIngredientAvailability } from '../../../lib/catalog';
import { useCatalogStore } from '../../../store/useCatalogStore';

function Toggle({ ingredientId, name }: { ingredientId: string; name: string }) {
  const available = useCatalogStore((s) => s.availability[ingredientId] !== false);
  const reload = useCatalogStore((s) => s.load);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flip = async () => {
    setBusy(true);
    const err = await setIngredientAvailability(ingredientId, !available);
    if (err) setError(err);
    else {
      setError(null);
      await reload();
    }
    setBusy(false);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={available}
      disabled={busy}
      onClick={flip}
      title={error ?? (available ? 'Available in the builder — click to disable' : 'Hidden from customers — click to enable')}
      className={`flex items-center gap-2.5 rounded-full border px-3.5 py-2 font-sans text-[11px] transition-all disabled:opacity-60 ${
        available
          ? 'border-gold-deep/60 text-neutral-800 dark:border-gold/60 dark:text-cream'
          : 'border-ivory-line text-stone-dim line-through opacity-60 dark:border-night-line'
      }`}
    >
      <span
        aria-hidden
        className={`flex h-3.5 w-7 items-center rounded-full p-0.5 transition-colors ${
          available ? 'justify-end bg-gold-deep dark:bg-gold' : 'justify-start bg-stone-dim/40'
        }`}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-ivory" />
      </span>
      {name}
    </button>
  );
}

export function IngredientToggles() {
  return (
    <div className="flex flex-col gap-5">
      {NOTE_KEYS.map((note) => (
        <div
          key={note}
          className="rounded-lg border border-ivory-line bg-white/60 p-5 dark:border-night-line dark:bg-night-soft"
        >
          <div className="font-sans text-[10px] uppercase tracking-luxe text-stone-dim">
            {NOTE_LABELS[note]}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {INGREDIENTS[note].map((ingredient) => (
              <Toggle key={ingredient.id} ingredientId={ingredient.id} name={ingredient.name} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
