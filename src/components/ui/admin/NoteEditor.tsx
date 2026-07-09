import { useState } from 'react';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { NOTE_KEYS, NOTE_LABELS, type NoteKey } from '../../../data/ingredients';
import { deleteCustomIngredient, upsertCustomIngredient } from '../../../lib/catalog';
import { useCatalogStore } from '../../../store/useCatalogStore';

interface FormState {
  id?: string;
  note: NoteKey;
  name: string;
  description: string;
  color: string;
  twin1Fragrance: string;
  twin1House: string;
  twin2Fragrance: string;
  twin2House: string;
}

const EMPTY: FormState = {
  note: 'top',
  name: '',
  description: '',
  color: '#c9a53a',
  twin1Fragrance: '',
  twin1House: '',
  twin2Fragrance: '',
  twin2House: '',
};

const inputClass =
  'w-full rounded border border-ivory-line bg-white/70 px-3 py-2.5 font-sans text-sm text-neutral-900 outline-none placeholder:text-stone/50 focus:border-gold-deep dark:border-night-line dark:bg-night-card dark:text-cream dark:focus:border-gold';
const labelClass = 'font-sans text-[10px] uppercase tracking-luxe text-stone-dim';

export function NoteEditor() {
  const customIngredients = useCatalogStore((s) => s.customIngredients);
  const customPremades = useCatalogStore((s) => s.customPremades);
  const reload = useCatalogStore((s) => s.load);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  const patch = (fields: Partial<FormState>) => setForm((f) => ({ ...f, ...fields }));

  const save = async () => {
    if (!form.name.trim()) return;
    setBusy(true);
    setError(null);
    const scentTwins = [
      { fragrance: form.twin1Fragrance.trim(), house: form.twin1House.trim() },
      { fragrance: form.twin2Fragrance.trim(), house: form.twin2House.trim() },
    ].filter((t) => t.fragrance);
    const err = await upsertCustomIngredient({
      id: form.id,
      note: form.note,
      name: form.name.trim(),
      description: form.description.trim(),
      color: form.color,
      scentTwins,
    });
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setForm(EMPTY);
    await reload();
  };

  const startEdit = (note: NoteKey, id: string) => {
    const ingredient = customIngredients[note].find((i) => i.id === id);
    if (!ingredient) return;
    setForm({
      id,
      note,
      name: ingredient.name,
      description: ingredient.description,
      color: ingredient.color,
      twin1Fragrance: ingredient.scentTwins[0]?.fragrance ?? '',
      twin1House: ingredient.scentTwins[0]?.house ?? '',
      twin2Fragrance: ingredient.scentTwins[1]?.fragrance ?? '',
      twin2House: ingredient.scentTwins[1]?.house ?? '',
    });
    setError(null);
  };

  const remove = async (id: string, name: string) => {
    const usedBy = customPremades.find((p) =>
      NOTE_KEYS.some((note) => p.formula.selected[note] === id),
    );
    if (usedBy) {
      setError(`Can't delete ${name} — it's used by your perfume "${usedBy.name}". Edit or delete that perfume first.`);
      setConfirmingDelete(null);
      return;
    }
    if (confirmingDelete !== id) {
      setConfirmingDelete(id);
      setTimeout(() => setConfirmingDelete((c) => (c === id ? null : c)), 3000);
      return;
    }
    setConfirmingDelete(null);
    setBusy(true);
    const err = await deleteCustomIngredient(id);
    setBusy(false);
    if (err) setError(err);
    else {
      setError(null);
      if (form.id === id) setForm(EMPTY);
      await reload();
    }
  };

  const allCustom = NOTE_KEYS.flatMap((note) =>
    customIngredients[note].map((i) => ({ ...i, note })),
  );

  return (
    <div className="rounded-lg border border-ivory-line bg-white/60 p-6 dark:border-night-line dark:bg-night-soft">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Layer
          <select
            value={form.note}
            onChange={(e) => patch({ note: e.target.value as NoteKey })}
            className={`mt-1.5 ${inputClass}`}
          >
            {NOTE_KEYS.map((note) => (
              <option key={note} value={note}>
                {NOTE_LABELS[note]}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Name
          <input
            value={form.name}
            maxLength={24}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="Calamansi"
            className={`mt-1.5 ${inputClass}`}
          />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Description
          <input
            value={form.description}
            maxLength={90}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder="Bright Philippine lime — zesty, green, unmistakably home"
            className={`mt-1.5 ${inputClass}`}
          />
        </label>
        <label className={labelClass}>
          Liquid color
          <span className="mt-1.5 flex items-center gap-3">
            <input
              type="color"
              value={form.color}
              onChange={(e) => patch({ color: e.target.value })}
              aria-label="Liquid color"
              className="h-10 w-14 cursor-pointer rounded border border-ivory-line bg-transparent dark:border-night-line"
            />
            <span className="font-sans text-xs text-stone">{form.color}</span>
          </span>
        </label>
        <div className="flex flex-col gap-2">
          <span className={labelClass}>Scent twins (optional)</span>
          <div className="flex gap-2">
            <input
              value={form.twin1Fragrance}
              onChange={(e) => patch({ twin1Fragrance: e.target.value })}
              placeholder="Fragrance"
              aria-label="Scent twin 1 fragrance"
              className={inputClass}
            />
            <input
              value={form.twin1House}
              onChange={(e) => patch({ twin1House: e.target.value })}
              placeholder="House"
              aria-label="Scent twin 1 house"
              className={inputClass}
            />
          </div>
          <div className="flex gap-2">
            <input
              value={form.twin2Fragrance}
              onChange={(e) => patch({ twin2Fragrance: e.target.value })}
              placeholder="Fragrance"
              aria-label="Scent twin 2 fragrance"
              className={inputClass}
            />
            <input
              value={form.twin2House}
              onChange={(e) => patch({ twin2House: e.target.value })}
              placeholder="House"
              aria-label="Scent twin 2 house"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-3 font-sans text-xs text-red-400" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={busy || !form.name.trim()}
          className="flex items-center gap-2 rounded bg-gold-deep px-5 py-2.5 font-sans text-[10px] tracking-luxe text-ivory transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-gold dark:text-night"
        >
          {busy ? <Loader2 size={12} className="animate-spin" aria-hidden /> : <Plus size={12} aria-hidden />}
          {form.id ? 'UPDATE NOTE' : 'ADD NOTE'}
        </button>
        {form.id && (
          <button
            type="button"
            onClick={() => setForm(EMPTY)}
            className="font-sans text-[10px] tracking-luxe text-stone-dim hover:text-stone"
          >
            CANCEL EDIT
          </button>
        )}
      </div>

      <div className="mt-6 border-t border-ivory-line/70 pt-4 dark:border-night-line">
        <div className={labelClass}>
          Your notes · {allCustom.length} custom
        </div>
        {allCustom.length === 0 ? (
          <p className="mt-2 font-sans text-xs text-stone-dim">
            Nothing yet — your first note will appear in the builder with a ★.
          </p>
        ) : (
          <ul className="mt-2">
            {allCustom.map((ingredient) => (
              <li
                key={ingredient.id}
                className="flex items-center justify-between gap-3 border-b border-ivory-line/50 py-2.5 last:border-b-0 dark:border-night-line/70"
              >
                <span className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: ingredient.color }}
                  />
                  <span className="font-display text-base text-neutral-900 dark:text-cream">
                    {ingredient.name}
                  </span>
                  <span className="font-sans text-[9px] uppercase tracking-luxe text-stone-dim">
                    {NOTE_LABELS[ingredient.note]}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(ingredient.note, ingredient.id)}
                    aria-label={`Edit ${ingredient.name}`}
                    className="p-1 text-stone-dim transition-colors hover:text-gold-deep dark:hover:text-gold"
                  >
                    <Pencil size={13} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(ingredient.id, ingredient.name)}
                    aria-label={`Delete ${ingredient.name}`}
                    className={`flex items-center gap-1 p-1 font-sans text-[9px] tracking-luxe transition-colors ${
                      confirmingDelete === ingredient.id
                        ? 'text-red-400'
                        : 'text-stone-dim hover:text-red-400'
                    }`}
                  >
                    <Trash2 size={13} aria-hidden />
                    {confirmingDelete === ingredient.id && 'SURE?'}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
