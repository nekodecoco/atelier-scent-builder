import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, Loader2, Trash2, Wand2 } from 'lucide-react';
import { NOTE_KEYS } from '../../data/ingredients';
import { noteColor } from '../../lib/color';
import {
  deleteSavedBlend,
  fetchSavedBlends,
  type SavedBlend,
} from '../../lib/savedBlends';
import { normalizeSelected } from '../../lib/selection';
import { useScentStore } from '../../store/useScentStore';

function BlendDots({ blend }: { blend: SavedBlend }) {
  const selected = normalizeSelected(blend.formula.selected);
  return (
    <span className="flex gap-1" aria-hidden>
      {NOTE_KEYS.map((note) => (
        <span
          key={note}
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: noteColor(note, selected[note]) }}
        />
      ))}
    </span>
  );
}

export function SavedBlendList() {
  const [blends, setBlends] = useState<SavedBlend[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadFormula = useScentStore((s) => s.loadFormula);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSavedBlends().then((result) => {
      if (result.error) setError(result.error);
      else setBlends(result.blends ?? []);
    });
  }, []);

  const load = (blend: SavedBlend) => {
    loadFormula(blend.formula, blend.name);
    navigate('/builder');
  };

  const remove = async (id: string) => {
    const prev = blends;
    setBlends((b) => (b ? b.filter((x) => x.id !== id) : b));
    const err = await deleteSavedBlend(id);
    if (err) {
      setError(err);
      setBlends(prev ?? null); // roll back on failure
    }
  };

  if (error) {
    return (
      <p className="font-sans text-xs text-red-400" role="alert">
        Couldn't load your saved blends: {error}
      </p>
    );
  }

  if (blends === null) {
    return (
      <div className="flex items-center gap-2 font-sans text-xs text-stone-dim">
        <Loader2 size={14} className="animate-spin" aria-hidden />
        Loading your saved blends…
      </div>
    );
  }

  if (blends.length === 0) {
    return (
      <div className="rounded-lg border border-ivory-line p-8 text-center dark:border-night-line">
        <FlaskConical size={22} className="mx-auto text-stone-dim" aria-hidden />
        <p className="mt-3 font-display text-xl italic text-stone">No saved blends yet</p>
        <p className="mt-1 font-sans text-xs text-stone-dim">
          Save a formula from the builder to revisit it here.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {blends.map((blend) => (
        <li
          key={blend.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-ivory-line bg-white/60 px-5 py-4 dark:border-night-line dark:bg-night-soft"
        >
          <div className="flex items-center gap-3">
            <BlendDots blend={blend} />
            <span className="font-display text-lg italic text-neutral-900 dark:text-cream">
              {blend.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => load(blend)}
              className="flex items-center gap-1.5 rounded border border-ivory-line px-3 py-1.5 font-sans text-[10px] tracking-luxe text-stone transition-colors hover:border-gold-deep hover:text-gold-deep dark:border-night-line dark:hover:border-gold dark:hover:text-gold"
            >
              <Wand2 size={11} aria-hidden />
              LOAD IN BUILDER
            </button>
            <button
              type="button"
              onClick={() => remove(blend.id)}
              aria-label={`Delete saved blend ${blend.name}`}
              className="p-1.5 text-stone-dim transition-colors hover:text-red-400"
            >
              <Trash2 size={13} aria-hidden />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
