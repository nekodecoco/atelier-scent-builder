import { INGREDIENTS, NOTE_KEYS, type NoteKey } from '../data/ingredients';
import type { Percentages } from './blend';

/** Most ingredients a single note may hold. Beyond this the blend muddies. */
export const MAX_PER_NOTE = 3;

/** Selected ingredient ids per note — 1..MAX_PER_NOTE, mixed in equal parts. */
export type Selected = Record<NoteKey, string[]>;

const defaultId = (note: NoteKey) => INGREDIENTS[note][0].id;

/**
 * Coerce any stored/loaded formula selection into the array shape. Accepts the
 * legacy `Record<NoteKey, string>` (one id per note) as well as the current
 * `Record<NoteKey, string[]>`, so old carts, saved orders, Supabase premades,
 * and the AI concierge output all keep working. Guarantees 1..MAX_PER_NOTE
 * de-duped ids per note, falling back to the layer default when empty/invalid.
 */
export function normalizeSelected(raw: unknown): Selected {
  const source = (raw ?? {}) as Record<string, unknown>;
  const out = {} as Selected;
  for (const note of NOTE_KEYS) {
    const value = source[note];
    const ids = (Array.isArray(value) ? value : [value]).filter(
      (id): id is string => typeof id === 'string' && id.length > 0,
    );
    const unique = [...new Set(ids)].slice(0, MAX_PER_NOTE);
    out[note] = unique.length > 0 ? unique : [defaultId(note)];
  }
  return out;
}

/** Add the id (up to the cap) or remove it, never dropping below one ingredient. */
export function toggleInNote(ids: string[], id: string): string[] {
  if (ids.includes(id)) {
    return ids.length > 1 ? ids.filter((i) => i !== id) : ids;
  }
  return ids.length < MAX_PER_NOTE ? [...ids, id] : ids;
}

export interface WeightedIngredient {
  note: NoteKey;
  id: string;
  /** 0–1 share of the whole formula: note% × equal split within the note. */
  weight: number;
}

/**
 * Flatten a selection into per-ingredient weights across the whole formula.
 * A note's share (`percentages[note]`) is split equally among its ingredients.
 * Shared by the color mixer and the scent-profile math.
 */
export function weightedIngredients(
  selected: Selected,
  percentages: Percentages,
): WeightedIngredient[] {
  const out: WeightedIngredient[] = [];
  for (const note of NOTE_KEYS) {
    const ids = selected[note];
    if (!ids?.length) continue;
    const weight = percentages[note] / 100 / ids.length;
    for (const id of ids) out.push({ note, id, weight });
  }
  return out;
}
