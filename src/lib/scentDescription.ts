import { getIngredient, type NoteKey } from '../data/ingredients';
import type { Percentages } from './blend';
import { concentrationTier } from './recipe';
import { computeProfile } from './scentProfile';
import type { Selected } from './selection';

/** Editorial lead-in for each layer of the "scent journey". */
const NOTE_LEADS: Record<NoteKey, string> = {
  top: 'First impression',
  heart: 'The heart',
  base: 'The drydown',
};

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * One layer's phrase: the primary ingredient's evocative description, with any
 * additional ingredients named as accents. Placed after an em-dash so each
 * description keeps its natural capitalization.
 */
function notePhrase(note: NoteKey, ids: string[]): string {
  const primary = getIngredient(note, ids[0]);
  let phrase = primary.description;
  if (ids.length > 1) {
    const accents = ids.slice(1).map((id) => getIngredient(note, id).name.toLowerCase());
    phrase += `, with ${joinNames(accents)} woven in`;
  }
  return phrase;
}

/** Longevity closer keyed off the oil concentration / tier. */
function longevityLine(concentration: number): string {
  const tier = concentrationTier(concentration);
  if (concentration >= 20) return `An ${tier} that lingers for hours.`;
  if (concentration >= 17) return `An ${tier} with steady, lasting presence.`;
  return `A soft ${tier} that stays close to the skin.`;
}

/**
 * A 2–3 sentence "scent journey" — how the blend opens, blooms, and dries down,
 * closed with its trait character and longevity. Fully deterministic: built from
 * ingredient descriptions, the note proportions, and the concentration.
 */
export function describeScent(
  selected: Selected,
  percentages: Percentages,
  concentration: number,
): string {
  const journey = (['top', 'heart', 'base'] as NoteKey[])
    .map((note) => `${NOTE_LEADS[note]} — ${notePhrase(note, selected[note])}.`)
    .join(' ');
  const { character } = computeProfile(selected, percentages);
  return `${journey} ${character} ${longevityLine(concentration)}`;
}
