import { INGREDIENTS, type NoteKey } from '../../data/ingredients';
import { MAX_PER_NOTE } from '../../lib/selection';
import { useCatalogStore } from '../../store/useCatalogStore';
import { useScentStore } from '../../store/useScentStore';

export function IngredientPicker({ note }: { note: NoteKey }) {
  const selectedIds = useScentStore((s) => s.selected[note]);
  const toggleIngredient = useScentStore((s) => s.toggleIngredient);
  const availability = useCatalogStore((s) => s.availability);
  const custom = useCatalogStore((s) => s.customIngredients[note]);

  const merged = [
    ...INGREDIENTS[note].map((i) => ({ ...i, isCustom: false })),
    ...custom.map((i) => ({ ...i, isCustom: true })),
  ];

  const atCap = selectedIds.length >= MAX_PER_NOTE;

  return (
    <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={`${note} note ingredients`}>
      {merged.map((ingredient) => {
        const selected = selectedIds.includes(ingredient.id);
        const available = availability[ingredient.id] !== false;
        // block adding a new one past the cap, but always allow toggling off
        const disabled = !available || (atCap && !selected);
        const title = !available
          ? `${ingredient.name} is currently unavailable`
          : atCap && !selected
            ? `Up to ${MAX_PER_NOTE} ingredients per note`
            : ingredient.description;
        return (
          <button
            key={ingredient.id}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            title={title}
            onClick={() => toggleIngredient(note, ingredient.id)}
            className={`rounded-full border px-3.5 py-1.5 font-sans text-[11px] transition-all ${
              !available
                ? 'cursor-not-allowed border-ivory-line text-stone-dim opacity-40 line-through dark:border-night-line'
                : disabled
                  ? 'cursor-not-allowed border-ivory-line text-stone-dim opacity-40 dark:border-night-line'
                  : selected
                    ? 'border-transparent font-medium text-night'
                    : 'border-ivory-line text-stone hover:border-stone dark:border-night-line dark:hover:border-stone-dim'
            }`}
            style={selected && available ? { backgroundColor: ingredient.color } : undefined}
          >
            {ingredient.isCustom && (
              <span aria-hidden className="mr-1 text-[9px] text-gold-deep dark:text-gold">
                ★
              </span>
            )}
            {ingredient.name}
          </button>
        );
      })}
    </div>
  );
}
