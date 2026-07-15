import { getCustomIngredients, INGREDIENTS, type NoteKey } from '../data/ingredients';
import type { Percentages } from './blend';
import { type Selected, weightedIngredients } from './selection';

export const TRAIT_AXES = ['fresh', 'floral', 'woody', 'sweet', 'spicy', 'warm'] as const;
export type TraitAxis = (typeof TRAIT_AXES)[number];
export type TraitVector = Record<TraitAxis, number>;

const vec = (
  fresh: number,
  floral: number,
  woody: number,
  sweet: number,
  spicy: number,
  warm: number,
): TraitVector => ({ fresh, floral, woody, sweet, spicy, warm });

/** Hand-tuned character of each built-in ingredient, 0–1 per axis */
const TRAITS: Record<string, TraitVector> = {
  bergamot: vec(0.9, 0.3, 0.1, 0.3, 0.2, 0.1),
  yuzu: vec(1.0, 0.1, 0.0, 0.2, 0.3, 0.0),
  'pink-pepper': vec(0.5, 0.3, 0.1, 0.2, 0.9, 0.3),
  neroli: vec(0.7, 0.7, 0.0, 0.4, 0.1, 0.2),
  'sicilian-lemon': vec(1.0, 0.1, 0.0, 0.3, 0.1, 0.0),
  'rose-de-mai': vec(0.2, 1.0, 0.1, 0.5, 0.1, 0.3),
  'jasmine-sambac': vec(0.2, 0.9, 0.1, 0.5, 0.1, 0.5),
  iris: vec(0.4, 0.7, 0.3, 0.2, 0.0, 0.2),
  tuberose: vec(0.1, 0.9, 0.1, 0.6, 0.1, 0.5),
  lavender: vec(0.6, 0.6, 0.2, 0.3, 0.2, 0.2),
  sandalwood: vec(0.1, 0.1, 1.0, 0.3, 0.1, 0.7),
  'vanilla-bourbon': vec(0.0, 0.1, 0.2, 1.0, 0.2, 0.8),
  amber: vec(0.0, 0.1, 0.4, 0.6, 0.3, 1.0),
  oud: vec(0.0, 0.1, 1.0, 0.2, 0.4, 0.8),
  'white-musk': vec(0.4, 0.3, 0.2, 0.4, 0.0, 0.5),
};

/** Custom notes without hand-tuned traits inherit their layer's general character */
const LAYER_DEFAULTS: Record<NoteKey, TraitVector> = {
  top: vec(0.8, 0.3, 0.1, 0.2, 0.2, 0.1),
  heart: vec(0.3, 0.8, 0.1, 0.4, 0.1, 0.3),
  base: vec(0.1, 0.1, 0.7, 0.4, 0.2, 0.8),
};

function traitsFor(note: NoteKey, id: string): TraitVector {
  return TRAITS[id] ?? LAYER_DEFAULTS[note];
}

const AXIS_WORDS: Record<TraitAxis, [string, string]> = {
  fresh: ['bright', 'dewy'],
  floral: ['blooming', 'petal-soft'],
  woody: ['grounded', 'forested'],
  sweet: ['honeyed', 'gourmand'],
  spicy: ['sparked', 'peppery'],
  warm: ['velvet', 'sun-warmed'],
};

const CLOSERS: Record<TraitAxis, string> = {
  fresh: 'like open windows at dawn',
  floral: 'like a garden after rain',
  woody: 'like a cedar room in winter',
  sweet: 'like dessert by candlelight',
  spicy: 'with a mischievous bite',
  warm: 'lingering on the skin for hours',
};

export interface ScentProfile {
  values: TraitVector;
  character: string;
}

export function computeProfile(selected: Selected, percentages: Percentages): ScentProfile {
  const values = vec(0, 0, 0, 0, 0, 0);
  for (const { note, id, weight } of weightedIngredients(selected, percentages)) {
    const traits = traitsFor(note, id);
    for (const axis of TRAIT_AXES) values[axis] += traits[axis] * weight;
  }

  const ranked = [...TRAIT_AXES].sort((a, b) => values[b] - values[a]);
  const [first, second] = ranked;
  const character = `${cap(AXIS_WORDS[first][0])} and ${AXIS_WORDS[second][1]}, ${CLOSERS[first]}.`;

  return { values, character };
}

function cap(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** exported for the surprise-me feature: is this id a known built-in or custom note */
export function allIngredientIds(note: NoteKey): string[] {
  return [...INGREDIENTS[note], ...getCustomIngredients(note)].map((i) => i.id);
}
