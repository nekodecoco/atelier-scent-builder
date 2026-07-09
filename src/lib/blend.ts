import { NOTE_KEYS, type NoteKey } from '../data/ingredients';

export type Percentages = Record<NoteKey, number>;
export type Locks = Record<NoteKey, boolean>;

export const MASTER_BLEND: Percentages = { top: 30, heart: 50, base: 20 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Set one note to a requested value and redistribute the difference across
 * the other unlocked notes, proportionally to their current values, so the
 * total is always exactly 100. Locked notes never change. Integer results;
 * rounding leftovers go to the notes with the largest fractional share
 * (largest-remainder method).
 */
export function rebalance(
  current: Percentages,
  locks: Locks,
  changed: NoteKey,
  requested: number,
): Percentages {
  if (locks[changed]) return current;

  const others = NOTE_KEYS.filter((k) => k !== changed);
  const free = others.filter((k) => !locks[k]);
  if (free.length === 0) return current;

  const lockedSum = others
    .filter((k) => locks[k])
    .reduce((sum, k) => sum + current[k], 0);

  const available = 100 - lockedSum;
  const value = clamp(Math.round(requested), 0, available);
  const remainder = available - value;

  const freeSum = free.reduce((sum, k) => sum + current[k], 0);
  const shares: Record<string, number> =
    freeSum === 0
      ? Object.fromEntries(free.map((k) => [k, remainder / free.length]))
      : Object.fromEntries(free.map((k) => [k, (remainder * current[k]) / freeSum]));

  const next: Percentages = { ...current, [changed]: value };
  for (const k of free) next[k] = Math.floor(shares[k]);

  let leftover = remainder - free.reduce((sum, k) => sum + next[k], 0);
  const byFraction = [...free].sort(
    (a, b) => (shares[b] - Math.floor(shares[b])) - (shares[a] - Math.floor(shares[a])),
  );
  for (let i = 0; leftover > 0; i = (i + 1) % byFraction.length) {
    next[byFraction[i]] += 1;
    leftover -= 1;
  }

  return next;
}

/** A note's slider is immovable when it is locked or every other note is locked. */
export function isNoteFrozen(locks: Locks, note: NoteKey): boolean {
  if (locks[note]) return true;
  return NOTE_KEYS.filter((k) => k !== note).every((k) => locks[k]);
}
