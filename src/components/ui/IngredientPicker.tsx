import { INGREDIENTS, type NoteKey } from '../../data/ingredients';
import { useCatalogStore } from '../../store/useCatalogStore';
import { useScentStore } from '../../store/useScentStore';

export function IngredientPicker({ note }: { note: NoteKey }) {
  const selectedId = useScentStore((s) => s.selected[note]);
  const selectIngredient = useScentStore((s) => s.selectIngredient);
  const availability = useCatalogStore((s) => s.availability);

  return (
    <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={`${note} note ingredients`}>
      {INGREDIENTS[note].map((ingredient) => {
        const selected = ingredient.id === selectedId;
        const available = availability[ingredient.id] !== false;
        return (
          <button
            key={ingredient.id}
            type="button"
            aria-pressed={selected}
            disabled={!available}
            title={available ? ingredient.description : `${ingredient.name} is currently unavailable`}
            onClick={() => selectIngredient(note, ingredient.id)}
            className={`rounded-full border px-3.5 py-1.5 font-sans text-[11px] transition-all ${
              !available
                ? 'cursor-not-allowed border-ivory-line text-stone-dim opacity-40 line-through dark:border-night-line'
                : selected
                  ? 'border-transparent font-medium text-night'
                  : 'border-ivory-line text-stone hover:border-stone dark:border-night-line dark:hover:border-stone-dim'
            }`}
            style={selected && available ? { backgroundColor: ingredient.color } : undefined}
          >
            {ingredient.name}
          </button>
        );
      })}
    </div>
  );
}
