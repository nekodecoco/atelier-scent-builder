import type { CSSProperties } from 'react';
import { Lock, LockOpen } from 'lucide-react';
import { getIngredient, NOTE_LABELS, type NoteKey } from '../../data/ingredients';
import { isNoteFrozen } from '../../lib/blend';
import { inkFor, noteColor } from '../../lib/color';
import { useScentStore } from '../../store/useScentStore';

export function NoteSlider({ note }: { note: NoteKey }) {
  const percentage = useScentStore((s) => s.percentages[note]);
  const locks = useScentStore((s) => s.locks);
  const selectedIds = useScentStore((s) => s.selected[note]);
  const setPercentage = useScentStore((s) => s.setPercentage);
  const toggleLock = useScentStore((s) => s.toggleLock);

  const ingredientName = selectedIds.map((id) => getIngredient(note, id).name).join(' + ');
  const ink = inkFor(noteColor(note, selectedIds));
  const locked = locks[note];
  const frozen = isNoteFrozen(locks, note);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="font-sans text-[10px] uppercase tracking-luxe text-stone">
          {NOTE_LABELS[note]} · <span style={{ color: ink }}>{ingredientName}</span>
        </span>
        <div className="flex items-center gap-2.5">
          <span className="min-w-[3ch] text-right font-display text-lg text-neutral-900 dark:text-cream">
            {percentage}%
          </span>
          <button
            type="button"
            onClick={() => toggleLock(note)}
            aria-pressed={locked}
            aria-label={locked ? `Unlock ${NOTE_LABELS[note]}` : `Lock ${NOTE_LABELS[note]} at ${percentage}%`}
            title={locked ? 'Unlock this note' : 'Lock this note'}
            className={`rounded-full border p-1.5 transition-colors ${
              locked
                ? 'border-gold-deep text-gold-deep dark:border-gold dark:text-gold'
                : 'border-ivory-line text-stone-dim hover:text-stone dark:border-night-line'
            }`}
          >
            {locked ? <Lock size={12} aria-hidden /> : <LockOpen size={12} aria-hidden />}
          </button>
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={percentage}
        disabled={frozen}
        onChange={(e) => setPercentage(note, Number(e.target.value))}
        aria-label={`${NOTE_LABELS[note]} percentage`}
        className="note-slider mt-3"
        style={
          {
            '--slider-color': ink,
            '--slider-fill': `${percentage}%`,
          } as CSSProperties
        }
      />
    </div>
  );
}
