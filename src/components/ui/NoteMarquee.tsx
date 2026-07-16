import { INGREDIENTS, NOTE_KEYS, NOTE_LABELS, type NoteKey } from '../../data/ingredients';

/**
 * Three full-bleed lanes — one per note layer — whose ingredient names slide
 * forever. Adjacent lanes run in opposite directions at different speeds, so
 * the section reads as continuously alive without a 3D scene.
 *
 * Built on the house palette's built-in ingredients only (not the admin-added
 * `getCustomIngredients`): this is brand texture, so it stays free of catalog
 * store plumbing. See `.marquee-track` in index.css for the loop + the
 * reduced-motion stop.
 */

/**
 * Copies of the ingredient list per half-track. The loop animates the track by
 * -50% (exactly one half), so a half MUST be wider than the visible lane or the
 * wrap drags empty space into view. Five names run ~1.2k px at desktop size, so
 * four copies (~4.7k px) clears a lane on displays past 4K.
 */
const COPIES_PER_HALF = 4;

/** Seconds for one full pass, per lane — slow and staggered so they never sync. */
const LANE_SECONDS: Record<NoteKey, number> = { top: 60, heart: 48, base: 72 };

/** The heart lane runs against the other two. */
const REVERSED: Record<NoteKey, boolean> = { top: false, heart: true, base: false };

function LaneNames({ note }: { note: NoteKey }) {
  return (
    <>
      {INGREDIENTS[note].map((ingredient) => (
        <span key={ingredient.id} className="flex shrink-0 items-center">
          <span className="font-caslon text-2xl text-white sm:text-3xl lg:text-4xl">
            {ingredient.name}
          </span>
          <span className="px-6 font-hanken text-sm text-lime lg:px-8">◆</span>
        </span>
      ))}
    </>
  );
}

function LaneHalf({ note }: { note: NoteKey }) {
  return (
    <div className="flex">
      {Array.from({ length: COPIES_PER_HALF }, (_, i) => (
        <LaneNames key={i} note={note} />
      ))}
    </div>
  );
}

function Lane({ note }: { note: NoteKey }) {
  return (
    <div className="marquee-lane flex items-stretch border-t border-white/10">
      <div className="flex w-24 shrink-0 items-center border-r border-white/10 px-3 sm:w-36 lg:w-44 lg:px-6">
        <span className="font-jetbrains text-[9px] font-medium uppercase leading-tight tracking-[0.1em] text-white/45 lg:text-[10px]">
          {NOTE_LABELS[note]}
        </span>
      </div>

      {/* overflow-hidden also drops the flex item's automatic min-width, which
          is what keeps the oversized track from stretching the page */}
      <div className="flex-1 overflow-hidden py-5 lg:py-7">
        {/* Decorative: a marquee can't be read linearly, and the real,
            selectable ingredient list lives in the builder. The lane label
            above carries the meaning for assistive tech. */}
        <div
          aria-hidden
          className="marquee-track flex w-max"
          style={{
            animationDuration: `${LANE_SECONDS[note]}s`,
            animationDirection: REVERSED[note] ? 'reverse' : 'normal',
          }}
        >
          <LaneHalf note={note} />
          <LaneHalf note={note} />
        </div>
      </div>
    </div>
  );
}

export function NoteMarquee() {
  return (
    <div className="border-b border-white/10">
      {NOTE_KEYS.map((note) => (
        <Lane key={note} note={note} />
      ))}
    </div>
  );
}
