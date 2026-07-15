import { Sparkles } from 'lucide-react';
import { getIngredient, NOTE_LABELS } from '../../data/ingredients';
import { useScentStore } from '../../store/useScentStore';

export function ScentTwinCard() {
  const activeNote = useScentStore((s) => s.activeNote);
  const selectedId = useScentStore((s) => s.selected[activeNote]);
  const ingredient = getIngredient(activeNote, selectedId);

  return (
    <div className="rounded-lg border border-ivory-line bg-white/60 p-4 dark:border-night-line dark:bg-night-card">
      <div className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-luxe text-stone-dim">
        <Sparkles size={12} className="text-gold-deep dark:text-gold" aria-hidden />
        Scent twin · {NOTE_LABELS[activeNote]}
      </div>
      <p className="mt-2 font-sans text-xs leading-relaxed text-stone">
        {ingredient.name} carries fragrances like{' '}
        {ingredient.scentTwins.map((twin, i) => (
          <span key={twin.fragrance}>
            <em className="font-display text-sm text-neutral-800 dark:text-cream">{twin.fragrance}</em>
            <span className="text-stone-dim"> by {twin.house}</span>
            {i < ingredient.scentTwins.length - 1 ? ' and ' : '.'}
          </span>
        ))}
      </p>

      {ingredient.localTwins?.length ? (
        <p className="mt-2 font-sans text-xs leading-relaxed text-stone">
          Locally, reach for{' '}
          {ingredient.localTwins.map((twin, i) => (
            <span key={twin.fragrance}>
              <em className="font-display text-sm text-neutral-800 dark:text-cream">{twin.fragrance}</em>
              <span className="text-stone-dim"> by {twin.house}</span>
              {i < ingredient.localTwins!.length - 1 ? ' and ' : '.'}
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}
