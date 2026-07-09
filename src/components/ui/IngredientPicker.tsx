import { INGREDIENTS, type NoteKey } from '../../data/ingredients';
import { useScentStore } from '../../store/useScentStore';

export function IngredientPicker({ note }: { note: NoteKey }) {
  const selectedId = useScentStore((s) => s.selected[note]);
  const selectIngredient = useScentStore((s) => s.selectIngredient);

  return (
    <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={`${note} note ingredients`}>
      {INGREDIENTS[note].map((ingredient) => {
        const selected = ingredient.id === selectedId;
        return (
          <button
            key={ingredient.id}
            type="button"
            aria-pressed={selected}
            title={ingredient.description}
            onClick={() => selectIngredient(note, ingredient.id)}
            className={`rounded-full border px-3.5 py-1.5 font-sans text-[11px] transition-all ${
              selected
                ? 'border-transparent font-medium text-night'
                : 'border-ivory-line text-stone hover:border-stone dark:border-night-line dark:hover:border-stone-dim'
            }`}
            style={selected ? { backgroundColor: ingredient.color } : undefined}
          >
            {ingredient.name}
          </button>
        );
      })}
    </div>
  );
}
