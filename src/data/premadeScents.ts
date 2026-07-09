import type { NoteKey } from './ingredients';
import type { Percentages } from '../lib/blend';

export interface ScentFormula {
  selected: Record<NoteKey, string>;
  percentages: Percentages;
}

export interface PremadeScent {
  id: string;
  name: string;
  tagline: string;
  description: string;
  formula: ScentFormula;
}

export const PREMADE_SCENTS: PremadeScent[] = [
  {
    id: 'premiere-lumiere',
    name: 'Première Lumière',
    tagline: 'The house signature',
    description:
      'Our master blend — sparkling bergamot over a velvet heart of May rose, settling into milky sandalwood.',
    formula: {
      selected: { top: 'bergamot', heart: 'rose-de-mai', base: 'sandalwood' },
      percentages: { top: 30, heart: 50, base: 20 },
    },
  },
  {
    id: 'nuit-d-oud',
    name: "Nuit d'Oud",
    tagline: 'Dark and ceremonial',
    description:
      'Rose and agarwood in near-equal measure, struck with a flint of pink pepper. For evenings that mean it.',
    formula: {
      selected: { top: 'pink-pepper', heart: 'rose-de-mai', base: 'oud' },
      percentages: { top: 20, heart: 40, base: 40 },
    },
  },
  {
    id: 'jardin-blanc',
    name: 'Jardin Blanc',
    tagline: 'A white garden at dusk',
    description:
      'Luminous neroli opening onto creamy tuberose, grounded by the quiet intimacy of white musk.',
    formula: {
      selected: { top: 'neroli', heart: 'tuberose', base: 'white-musk' },
      percentages: { top: 35, heart: 45, base: 20 },
    },
  },
  {
    id: 'velours-dore',
    name: 'Velours Doré',
    tagline: 'Golden-hour gourmand',
    description:
      'Sicilian lemon cut through narcotic jasmine, melting into dark bourbon vanilla. Sunlight you can wear.',
    formula: {
      selected: { top: 'sicilian-lemon', heart: 'jasmine-sambac', base: 'vanilla-bourbon' },
      percentages: { top: 25, heart: 45, base: 30 },
    },
  },
  {
    id: 'brume-d-iris',
    name: "Brume d'Iris",
    tagline: 'Cool powder and rain',
    description:
      'Electric yuzu dissolving into suede-like orris, resting on smooth sandalwood. Quietly aristocratic.',
    formula: {
      selected: { top: 'yuzu', heart: 'iris', base: 'sandalwood' },
      percentages: { top: 30, heart: 45, base: 25 },
    },
  },
  {
    id: 'ambre-sauvage',
    name: 'Ambre Sauvage',
    tagline: 'Warmth with teeth',
    description:
      'Herbal lavender and rosy spice over a deep resinous amber that lasts from dusk until morning.',
    formula: {
      selected: { top: 'pink-pepper', heart: 'lavender', base: 'amber' },
      percentages: { top: 25, heart: 35, base: 40 },
    },
  },
];
