import { useEffect, useState } from 'react';
import { Check, Eye, EyeOff, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { INGREDIENTS, NOTE_KEYS, NOTE_LABELS, type NoteKey } from '../../../data/ingredients';
import { PREMADE_SCENTS } from '../../../data/premadeScents';
import type { Percentages } from '../../../lib/blend';
import {
  deleteCustomPremade,
  setPremadeHidden,
  upsertCustomPremade,
  upsertPremadePrice,
} from '../../../lib/catalog';
import { priceFor } from '../../../lib/pricing';
import type { BottleSize } from '../../../lib/recipe';
import { useCatalogStore } from '../../../store/useCatalogStore';
import { BottlePreview } from '../BottlePreview';

interface FormState {
  id?: string;
  name: string;
  tagline: string;
  description: string;
  selected: Record<NoteKey, string>;
  percentages: Percentages;
}

const EMPTY: FormState = {
  name: '',
  tagline: '',
  description: '',
  selected: {
    top: INGREDIENTS.top[0].id,
    heart: INGREDIENTS.heart[0].id,
    base: INGREDIENTS.base[0].id,
  },
  percentages: { top: 30, heart: 50, base: 20 },
};

const inputClass =
  'w-full rounded border border-ivory-line bg-white/70 px-3 py-2.5 font-sans text-sm text-neutral-900 outline-none placeholder:text-stone/50 focus:border-gold-deep dark:border-night-line dark:bg-night-card dark:text-cream dark:focus:border-gold';
const labelClass = 'font-sans text-[10px] uppercase tracking-luxe text-stone-dim';

/** Per-perfume price inputs — blank falls back to the builder size price */
function PremadePriceFields({ scentId }: { scentId: string }) {
  const saved = useCatalogStore((s) => s.premadePrices[scentId]);
  useCatalogStore((s) => s.pricing);
  const reload = useCatalogStore((s) => s.load);

  const toForm = (prices?: Partial<Record<BottleSize, number>>) => ({
    30: prices?.[30] !== undefined ? String(prices[30]) : '',
    50: prices?.[50] !== undefined ? String(prices[50]) : '',
    100: prices?.[100] !== undefined ? String(prices[100]) : '',
  });
  const [values, setValues] = useState(toForm(saved));
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setValues(toForm(saved)), [saved]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    setState('saving');
    const prices: Partial<Record<BottleSize, number>> = {};
    for (const size of [30, 50, 100] as BottleSize[]) {
      const price = Number(values[size]);
      if (values[size] !== '' && Number.isFinite(price) && price > 0) prices[size] = Math.round(price);
    }
    const err = await upsertPremadePrice(scentId, prices);
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
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {([30, 50, 100] as BottleSize[]).map((size) => (
        <label
          key={size}
          className="flex items-center gap-1.5 font-sans text-[9px] uppercase tracking-luxe text-stone-dim"
        >
          {size}mL ₱
          <input
            type="number"
            min={1}
            value={values[size]}
            placeholder={String(priceFor(size))}
            onChange={(e) => setValues((v) => ({ ...v, [size]: e.target.value }))}
            aria-label={`Price for ${size} mL`}
            className="w-20 rounded border border-ivory-line bg-white/70 px-2 py-1.5 font-sans text-xs tracking-normal text-neutral-900 outline-none placeholder:text-stone/40 focus:border-gold-deep dark:border-night-line dark:bg-night-card dark:text-cream dark:focus:border-gold"
          />
        </label>
      ))}
      <button
        type="button"
        onClick={save}
        disabled={state === 'saving'}
        className="flex items-center gap-1 rounded border border-gold-deep px-3 py-1.5 font-sans text-[9px] tracking-luxe text-gold-deep transition-colors hover:bg-gold-deep hover:text-ivory disabled:opacity-50 dark:border-gold dark:text-gold dark:hover:bg-gold dark:hover:text-night"
      >
        {state === 'saving' && <Loader2 size={10} className="animate-spin" aria-hidden />}
        {state === 'saved' && <Check size={10} aria-hidden />}
        {state === 'saved' ? 'SAVED' : 'SAVE PRICE'}
      </button>
      {error && <span className="font-sans text-[10px] text-red-400">{error}</span>}
    </div>
  );
}

export function PerfumeEditor() {
  const customIngredients = useCatalogStore((s) => s.customIngredients);
  const customPremades = useCatalogStore((s) => s.customPremades);
  const hiddenPremades = useCatalogStore((s) => s.hiddenPremades);
  const availability = useCatalogStore((s) => s.availability);
  const reload = useCatalogStore((s) => s.load);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  const patch = (fields: Partial<FormState>) => setForm((f) => ({ ...f, ...fields }));

  const sum = form.percentages.top + form.percentages.heart + form.percentages.base;
  const valid = form.name.trim().length > 0 && sum === 100;

  const optionsFor = (note: NoteKey) =>
    [...INGREDIENTS[note], ...customIngredients[note]].filter(
      (i) => availability[i.id] !== false || i.id === form.selected[note],
    );

  const save = async () => {
    if (!valid) return;
    setBusy(true);
    setError(null);
    const err = await upsertCustomPremade({
      id: form.id,
      name: form.name.trim(),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      formula: { selected: { ...form.selected }, percentages: { ...form.percentages } },
    });
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setForm(EMPTY);
    await reload();
  };

  const startEdit = (id: string) => {
    const scent = customPremades.find((p) => p.id === id);
    if (!scent) return;
    setForm({
      id,
      name: scent.name,
      tagline: scent.tagline,
      description: scent.description,
      selected: { ...scent.formula.selected },
      percentages: { ...scent.formula.percentages },
    });
    setError(null);
  };

  const remove = async (id: string) => {
    if (confirmingDelete !== id) {
      setConfirmingDelete(id);
      setTimeout(() => setConfirmingDelete((c) => (c === id ? null : c)), 3000);
      return;
    }
    setConfirmingDelete(null);
    setBusy(true);
    const err = await deleteCustomPremade(id);
    setBusy(false);
    if (err) setError(err);
    else {
      if (form.id === id) setForm(EMPTY);
      setError(null);
      await reload();
    }
  };

  const toggleHidden = async (id: string) => {
    const err = await setPremadeHidden(id, !hiddenPremades[id]);
    if (err) setError(err);
    else await reload();
  };

  return (
    <div className="rounded-lg border border-ivory-line bg-white/60 p-6 dark:border-night-line dark:bg-night-soft">
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Name
              <input
                value={form.name}
                maxLength={18}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder="Manille la Nuit"
                className={`mt-1.5 ${inputClass} font-display text-base italic`}
              />
            </label>
            <label className={labelClass}>
              Tagline
              <input
                value={form.tagline}
                maxLength={40}
                onChange={(e) => patch({ tagline: e.target.value })}
                placeholder="Warm nights in the old city"
                className={`mt-1.5 ${inputClass}`}
              />
            </label>
          </div>
          <label className={labelClass}>
            Description
            <textarea
              value={form.description}
              maxLength={160}
              rows={2}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="What does it smell like? Customers read this on the card."
              className={`mt-1.5 ${inputClass} resize-none`}
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {NOTE_KEYS.map((note) => (
              <div key={note}>
                <span className={labelClass}>{NOTE_LABELS[note]}</span>
                <select
                  value={form.selected[note]}
                  onChange={(e) => patch({ selected: { ...form.selected, [note]: e.target.value } })}
                  aria-label={`${NOTE_LABELS[note]} ingredient`}
                  className={`mt-1.5 ${inputClass}`}
                >
                  {optionsFor(note).map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.percentages[note]}
                  onChange={(e) =>
                    patch({
                      percentages: { ...form.percentages, [note]: Math.max(0, Math.min(100, Math.round(Number(e.target.value) || 0))) },
                    })
                  }
                  aria-label={`${NOTE_LABELS[note]} percentage`}
                  className={`mt-2 ${inputClass} text-center`}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span
              className={`font-sans text-[11px] ${
                sum === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-400'
              }`}
            >
              {sum === 100 ? '✓ totals 100%' : `totals ${sum}% — must equal 100%`}
            </span>
            <div className="flex items-center gap-3">
              {form.id && (
                <button
                  type="button"
                  onClick={() => setForm(EMPTY)}
                  className="font-sans text-[10px] tracking-luxe text-stone-dim hover:text-stone"
                >
                  CANCEL EDIT
                </button>
              )}
              <button
                type="button"
                onClick={save}
                disabled={busy || !valid}
                className="flex items-center gap-2 rounded bg-gold-deep px-5 py-2.5 font-sans text-[10px] tracking-luxe text-ivory transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-gold dark:text-night"
              >
                {busy ? <Loader2 size={12} className="animate-spin" aria-hidden /> : <Plus size={12} aria-hidden />}
                {form.id ? 'UPDATE PERFUME' : 'SAVE PERFUME'}
              </button>
            </div>
          </div>

          {error && (
            <p className="font-sans text-xs text-red-400" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-ivory-line/70 bg-ivory-soft/50 p-4 dark:border-night-line dark:bg-night-card">
          <div className="h-48">
            <BottlePreview
              formula={{ selected: form.selected, percentages: form.percentages }}
              name={form.name.trim() || 'Unnamed'}
            />
          </div>
          <span className="mt-3 font-sans text-[9px] uppercase tracking-luxe text-stone-dim">
            Live preview
          </span>
        </div>
      </div>

      <div className="mt-6 border-t border-ivory-line/70 pt-4 dark:border-night-line">
        <div className={labelClass}>
          Your perfumes · {customPremades.length} custom + {PREMADE_SCENTS.length} house
        </div>
        <ul className="mt-2">
          {customPremades.map((scent) => (
            <li
              key={scent.id}
              className="border-b border-ivory-line/50 py-2.5 dark:border-night-line/70"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-display text-base italic text-neutral-900 dark:text-cream">
                  {scent.name}{' '}
                  <span className="font-sans text-[9px] uppercase not-italic tracking-luxe text-gold-deep dark:text-gold">
                    · Custom
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(scent.id)}
                    aria-label={`Edit ${scent.name}`}
                    className="p-1 text-stone-dim transition-colors hover:text-gold-deep dark:hover:text-gold"
                  >
                    <Pencil size={13} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(scent.id)}
                    aria-label={`Delete ${scent.name}`}
                    className={`flex items-center gap-1 p-1 font-sans text-[9px] tracking-luxe transition-colors ${
                      confirmingDelete === scent.id ? 'text-red-400' : 'text-stone-dim hover:text-red-400'
                    }`}
                  >
                    <Trash2 size={13} aria-hidden />
                    {confirmingDelete === scent.id && 'SURE?'}
                  </button>
                </span>
              </div>
              <PremadePriceFields scentId={scent.id} />
            </li>
          ))}
          {PREMADE_SCENTS.map((scent) => {
            const hidden = !!hiddenPremades[scent.id];
            return (
              <li
                key={scent.id}
                className="border-b border-ivory-line/50 py-2.5 last:border-b-0 dark:border-night-line/70"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`font-display text-base italic ${
                      hidden ? 'text-stone-dim' : 'text-neutral-900 dark:text-cream'
                    }`}
                  >
                    {scent.name}{' '}
                    <span className="font-sans text-[9px] uppercase not-italic tracking-luxe text-stone-dim">
                      · House{hidden ? ' · Hidden' : ''}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleHidden(scent.id)}
                    className="flex items-center gap-1.5 p-1 font-sans text-[9px] tracking-luxe text-stone-dim transition-colors hover:text-gold-deep dark:hover:text-gold"
                  >
                    {hidden ? <Eye size={13} aria-hidden /> : <EyeOff size={13} aria-hidden />}
                    {hidden ? 'SHOW' : 'HIDE'}
                  </button>
                </div>
                {!hidden && <PremadePriceFields scentId={scent.id} />}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
