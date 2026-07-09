export type NoteKey = 'top' | 'heart' | 'base';

export interface ScentTwin {
  fragrance: string;
  house: string;
}

export interface Ingredient {
  id: string;
  name: string;
  description: string;
  /** Gemstone-like liquid color rendered in the 3D bottle */
  color: string;
  scentTwins: ScentTwin[];
}

export const NOTE_KEYS: NoteKey[] = ['top', 'heart', 'base'];

export const NOTE_LABELS: Record<NoteKey, string> = {
  top: 'Top note',
  heart: 'Heart note',
  base: 'Base note',
};

export const NOTE_TAGLINES: Record<NoteKey, string> = {
  top: 'The opening impression — bright, volatile, first to greet the skin',
  heart: 'The soul of the blend — blooms as the top fades',
  base: 'The lasting foundation — deep, warm, hours on the skin',
};

export const INGREDIENTS: Record<NoteKey, Ingredient[]> = {
  top: [
    {
      id: 'bergamot',
      name: 'Bergamot',
      description: 'Sparkling Calabrian citrus with a bitter-floral edge',
      color: '#c9a53a',
      scentTwins: [
        { fragrance: 'Colonia', house: 'Acqua di Parma' },
        { fragrance: 'Wood Sage & Sea Salt', house: 'Jo Malone' },
      ],
    },
    {
      id: 'yuzu',
      name: 'Yuzu',
      description: 'Electric Japanese citrus, greener and sharper than lemon',
      color: '#b9cc3f',
      scentTwins: [
        { fragrance: 'Un Jardin Après la Mousson', house: 'Hermès' },
        { fragrance: 'Yuzu Man', house: 'Caron' },
      ],
    },
    {
      id: 'pink-pepper',
      name: 'Pink pepper',
      description: 'Rosy spice with a champagne-like fizz',
      color: '#d97b6c',
      scentTwins: [
        { fragrance: 'Baccarat Rouge 540', house: 'Maison Francis Kurkdjian' },
        { fragrance: 'Flowerbomb', house: 'Viktor & Rolf' },
      ],
    },
    {
      id: 'neroli',
      name: 'Neroli',
      description: 'Orange blossom distilled — honeyed, green, luminous',
      color: '#e2bd5f',
      scentTwins: [
        { fragrance: 'Neroli Portofino', house: 'Tom Ford' },
        { fragrance: 'Eau de Néroli Doré', house: 'Hermès' },
      ],
    },
    {
      id: 'sicilian-lemon',
      name: 'Sicilian lemon',
      description: 'Sun-drenched zest, crystalline and effervescent',
      color: '#e0d24a',
      scentTwins: [
        { fragrance: 'Light Blue', house: 'Dolce & Gabbana' },
        { fragrance: 'Eau de Sicile', house: 'Fragonard' },
      ],
    },
  ],
  heart: [
    {
      id: 'rose-de-mai',
      name: 'Rose de Mai',
      description: 'Grasse May rose — velvety, jammy, unapologetically romantic',
      color: '#c14a6e',
      scentTwins: [
        { fragrance: 'Portrait of a Lady', house: 'Frédéric Malle' },
        { fragrance: 'Rose Prick', house: 'Tom Ford' },
      ],
    },
    {
      id: 'jasmine-sambac',
      name: 'Jasmine sambac',
      description: 'Indolic night-blooming jasmine, heady and narcotic',
      color: '#e3d49a',
      scentTwins: [
        { fragrance: "J'adore", house: 'Dior' },
        { fragrance: 'Jasmin Rouge', house: 'Tom Ford' },
      ],
    },
    {
      id: 'iris',
      name: 'Iris',
      description: 'Powdery orris butter — cool, suede-like, aristocratic',
      color: '#8a7bbf',
      scentTwins: [
        { fragrance: 'Infusion d’Iris', house: 'Prada' },
        { fragrance: 'Dior Homme', house: 'Dior' },
      ],
    },
    {
      id: 'tuberose',
      name: 'Tuberose',
      description: 'Creamy white petals with a buttery, carnal warmth',
      color: '#dcd2ae',
      scentTwins: [
        { fragrance: 'Fracas', house: 'Robert Piguet' },
        { fragrance: 'Do Son', house: 'Diptyque' },
      ],
    },
    {
      id: 'lavender',
      name: 'Lavender',
      description: 'Provence lavender absolute — herbal calm with a sweet core',
      color: '#9a86c9',
      scentTwins: [
        { fragrance: 'Libre', house: 'Yves Saint Laurent' },
        { fragrance: 'Mon Guerlain', house: 'Guerlain' },
      ],
    },
  ],
  base: [
    {
      id: 'sandalwood',
      name: 'Sandalwood',
      description: 'Milky Mysore-style wood — smooth, meditative, addictive',
      color: '#a5713d',
      scentTwins: [
        { fragrance: 'Santal 33', house: 'Le Labo' },
        { fragrance: 'Tam Dao', house: 'Diptyque' },
      ],
    },
    {
      id: 'vanilla-bourbon',
      name: 'Vanilla bourbon',
      description: 'Dark Madagascan pod — boozy, smoky, gourmand',
      color: '#c1913f',
      scentTwins: [
        { fragrance: 'Shalimar', house: 'Guerlain' },
        { fragrance: 'Tobacco Vanille', house: 'Tom Ford' },
      ],
    },
    {
      id: 'amber',
      name: 'Amber',
      description: 'Golden resinous warmth — labdanum, benzoin, glow',
      color: '#b3652c',
      scentTwins: [
        { fragrance: 'Grand Soir', house: 'Maison Francis Kurkdjian' },
        { fragrance: 'Ambre Sultan', house: 'Serge Lutens' },
      ],
    },
    {
      id: 'oud',
      name: 'Oud',
      description: 'Precious agarwood — dense, animalic, ancient',
      color: '#6b4a2f',
      scentTwins: [
        { fragrance: 'Oud Wood', house: 'Tom Ford' },
        { fragrance: 'Oud Ispahan', house: 'Dior' },
      ],
    },
    {
      id: 'white-musk',
      name: 'White musk',
      description: 'Clean skin-scent — soft, powdery, second-skin intimacy',
      color: '#c9bfd4',
      scentTwins: [
        { fragrance: 'For Her', house: 'Narciso Rodriguez' },
        { fragrance: 'Glossier You', house: 'Glossier' },
      ],
    },
  ],
};

/**
 * Admin-created ingredients live in Supabase and are registered here at
 * runtime so non-React code (3D liquid colors, recipe math, previews) can
 * resolve them through the same lookup as the built-ins.
 */
const customRegistry: Record<NoteKey, Ingredient[]> = { top: [], heart: [], base: [] };

export function registerCustomIngredients(byNote: Record<NoteKey, Ingredient[]>): void {
  for (const note of NOTE_KEYS) customRegistry[note] = byNote[note] ?? [];
}

export function getCustomIngredients(note: NoteKey): Ingredient[] {
  return customRegistry[note];
}

export function getIngredient(note: NoteKey, id: string): Ingredient {
  return (
    INGREDIENTS[note].find((i) => i.id === id) ??
    customRegistry[note].find((i) => i.id === id) ??
    INGREDIENTS[note][0]
  );
}
