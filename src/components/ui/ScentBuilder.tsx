import { Suspense, lazy, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookmarkPlus, Dices, Droplets, RotateCcw, ShoppingBag } from 'lucide-react';
import {
  getCustomIngredients,
  INGREDIENTS,
  NOTE_KEYS,
  NOTE_TAGLINES,
  type NoteKey,
} from '../../data/ingredients';
import { formatPeso, priceFor } from '../../lib/pricing';
import { saveBlend } from '../../lib/savedBlends';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { useCatalogStore } from '../../store/useCatalogStore';
import { useScentStore } from '../../store/useScentStore';
import { CustomNameInput } from './CustomNameInput';
import { IngredientPicker } from './IngredientPicker';
import { NoteSlider } from './NoteSlider';
import { RecipeCalculator } from './RecipeCalculator';
import { Reveal } from './Reveal';
import { ScentConcierge } from './ScentConcierge';
import { ScentDescription } from './ScentDescription';
import { ScentProfileCard } from './ScentProfileCard';
import { ScentTwinCard } from './ScentTwinCard';

// Lazy so three.js (+fiber/drei) ships as its own async chunk — /builder is the
// only WebGL entry point, and a static import here would drag the whole 3D stack
// into the main bundle for every route. Keep any import of components/three/*
// dynamic; one static path re-merges it.
const Scene = lazy(() => import('../three/Scene').then((m) => ({ default: m.Scene })));

/** Fills the canvas box while the three chunk loads; bg matches the Canvas clear color. */
function SceneFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#ece7d8]">
      <span className="animate-pulse font-sans text-[10px] tracking-luxe text-stone-dim">
        PREPARING THE BOTTLE
      </span>
    </div>
  );
}

const SURPRISE_NAMES = [
  'Velvet Dawn', 'Midnight Garden', 'Manila Sunrise', 'Golden Monsoon',
  'Silk Ember', 'Moonlit Harbor', 'Paper Crane', 'Wild Orchid',
  'Sunday Linen', 'Dusk Ritual', 'First Rain', 'Isla Verde',
  'Amber Hour', 'Quiet Storm', 'Sampaguita Nights', 'Harana',
];

export function ScentBuilder() {
  const resetBlend = useScentStore((s) => s.resetBlend);
  const bottleSize = useScentStore((s) => s.bottleSize);
  const concentration = useScentStore((s) => s.concentration);
  const blended = useScentStore((s) => s.blended);
  const toggleBlended = useScentStore((s) => s.toggleBlended);
  const addItem = useCartStore((s) => s.addItem);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  // re-render when admin-set pricing loads/changes
  useCatalogStore((s) => s.pricing);

  const surpriseMe = () => {
    const { availability } = useCatalogStore.getState();
    const { loadFormula } = useScentStore.getState();
    const pick = (note: NoteKey) => {
      const options = [...INGREDIENTS[note], ...getCustomIngredients(note)].filter(
        (i) => availability[i.id] !== false,
      );
      return options[Math.floor(Math.random() * options.length)].id;
    };
    const top = 15 + Math.floor(Math.random() * 26); // 15–40
    const heart = 30 + Math.floor(Math.random() * 26); // 30–55
    const base = 100 - top - heart; // 5–55, always positive
    loadFormula(
      {
        selected: { top: pick('top'), heart: pick('heart'), base: pick('base') },
        percentages: { top, heart, base },
      },
      SURPRISE_NAMES[Math.floor(Math.random() * SURPRISE_NAMES.length)],
    );
  };

  const addBlendToCart = () => {
    const { customName, selected, percentages, solvent } = useScentStore.getState();
    addItem({
      kind: 'custom',
      name: customName.trim() || 'Unnamed Blend',
      bottleSize,
      concentration,
      solvent,
      unitPrice: priceFor(bottleSize, concentration),
      formula: { selected: { ...selected }, percentages: { ...percentages } },
    });
  };

  const saveCurrentBlend = async () => {
    if (!user) {
      navigate('/account'); // prompt sign-in — no account, nowhere to save
      return;
    }
    const { customName, selected, percentages } = useScentStore.getState();
    setSaveState('saving');
    setSaveError(null);
    const err = await saveBlend(customName.trim() || 'Unnamed Blend', {
      selected: { ...selected },
      percentages: { ...percentages },
    });
    if (err) {
      setSaveState('idle');
      setSaveError(err);
      return;
    }
    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 2500);
  };

  return (
    <section id="builder" className="mx-auto max-w-6xl px-5 py-16">
      <p className="font-sans text-[10px] font-medium tracking-[0.2em] text-muted">THE ATELIER</p>
      <h2 className="mt-2 font-grotesk text-4xl font-extrabold uppercase tracking-tightest text-ink sm:text-5xl">
        The Scent Builder
      </h2>
      <p className="mt-3 max-w-lg font-sans text-sm leading-relaxed text-muted">
        Every blend totals exactly 100%. Shift one note and the others rebalance —
        lock a note to hold it in place.
      </p>

      <div className="mt-12 grid gap-8 lg:grid-cols-[5fr_6fr]">
        <div className="relative h-[420px] overflow-hidden rounded-lg border border-ivory-line dark:border-night-line sm:h-[520px] lg:sticky lg:top-20 lg:h-[600px] lg:self-start">
          <Suspense fallback={<SceneFallback />}>
            <Scene />
          </Suspense>
          <span className="pointer-events-none absolute left-4 top-4 font-sans text-[10px] tracking-luxe text-stone-dim">
            DRAG TO ROTATE
          </span>
          <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap font-sans text-[10px] tracking-luxe text-stone-dim">
            LIVE LABEL PREVIEW
          </span>
        </div>

        <div className="flex flex-col gap-5">
          <ScentConcierge />
          <CustomNameInput />

          {NOTE_KEYS.map((note) => (
            <div
              key={note}
              className="rounded-lg border border-ivory-line bg-white/60 p-5 dark:border-night-line dark:bg-night-soft"
            >
              <NoteSlider note={note} />
              <p className="mt-3 font-sans text-[11px] italic leading-relaxed text-stone-dim">
                {NOTE_TAGLINES[note]}
              </p>
              <IngredientPicker note={note} />
            </div>
          ))}

          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={resetBlend}
              className="flex items-center justify-center gap-2 rounded border border-gold-deep px-4 py-3 font-sans text-[10px] tracking-luxe text-gold-deep transition-colors hover:bg-gold-deep hover:text-ivory dark:border-gold dark:text-gold dark:hover:bg-gold dark:hover:text-night"
            >
              <RotateCcw size={13} aria-hidden />
              RESET TO MASTER BLEND
            </button>
            <button
              type="button"
              onClick={surpriseMe}
              className="flex items-center justify-center gap-2 rounded border border-ivory-line px-4 py-3 font-sans text-[10px] tracking-luxe text-stone transition-colors hover:border-gold-deep hover:text-gold-deep dark:border-night-line dark:hover:border-gold dark:hover:text-gold"
            >
              <Dices size={13} aria-hidden />
              SURPRISE ME
            </button>
          </div>

          <div className="grid gap-4">
            <ScentTwinCard />
            <ScentProfileCard />
          </div>

          <button
            type="button"
            onClick={toggleBlended}
            aria-pressed={blended}
            className={`flex items-center justify-center gap-2 rounded border px-4 py-3.5 font-sans text-[11px] tracking-luxe transition-colors ${
              blended
                ? 'border-gold-deep bg-gold-deep/10 text-gold-deep dark:border-gold dark:bg-gold/10 dark:text-gold'
                : 'border-ivory-line text-stone hover:border-gold-deep hover:text-gold-deep dark:border-night-line dark:hover:border-gold dark:hover:text-gold'
            }`}
          >
            <Droplets size={14} aria-hidden />
            {blended ? 'BLENDED — ADJUST ANYTHING TO SEPARATE' : 'BLEND MY SCENT'}
          </button>

          <ScentDescription />

          <button
            type="button"
            onClick={addBlendToCart}
            className="flex items-center justify-center gap-2 rounded bg-gold-deep px-4 py-4 font-sans text-[11px] tracking-luxe text-ivory transition-opacity hover:opacity-90 dark:bg-gold dark:text-night"
          >
            <ShoppingBag size={14} aria-hidden />
            ADD TO CART · {bottleSize} ML · {concentration}% · {formatPeso(priceFor(bottleSize, concentration))}
          </button>

          <button
            type="button"
            onClick={saveCurrentBlend}
            disabled={saveState === 'saving'}
            className="flex items-center justify-center gap-2 rounded border border-ivory-line px-4 py-3 font-sans text-[10px] tracking-luxe text-stone transition-colors hover:border-gold-deep hover:text-gold-deep disabled:opacity-50 dark:border-night-line dark:hover:border-gold dark:hover:text-gold"
          >
            <BookmarkPlus size={13} aria-hidden />
            {saveState === 'saving'
              ? 'SAVING…'
              : saveState === 'saved'
                ? 'SAVED TO YOUR ACCOUNT'
                : user
                  ? 'SAVE THIS BLEND'
                  : 'SIGN IN TO SAVE THIS BLEND'}
          </button>
          {saveError && (
            <p className="font-sans text-xs text-red-400" role="alert">
              Couldn't save: {saveError}
            </p>
          )}
        </div>
      </div>

      <Reveal className="mt-8">
        <RecipeCalculator />
      </Reveal>
    </section>
  );
}
