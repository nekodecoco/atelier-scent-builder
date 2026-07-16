import { deleteHeroImage, uploadHeroImage } from '../../../lib/catalog';
import { useCatalogStore } from '../../../store/useCatalogStore';
import { ImageUploadField } from './ImageUploadField';

const SLOTS: { slot: string; label: string; hint: string }[] = [
  { slot: 'hero-1', label: 'Slide 1 · Brand', hint: 'The "Radical Perfumery" opener.' },
  { slot: 'hero-2', label: 'Slide 2 · Featured', hint: 'The featured-scent slide.' },
  { slot: 'hero-3', label: 'Slide 3 · Builder', hint: 'The "Composed by you" slide.' },
  {
    slot: 'signature-bg',
    label: 'Signature background',
    hint: 'Sits blurred behind "Your signature, distilled". Blank = plain black.',
  },
];

/** Upload the full-bleed landing photos; blank slots fall back to generative visuals. */
export function HeroEditor() {
  const heroImages = useCatalogStore((s) => s.heroImages);
  const reload = useCatalogStore((s) => s.load);

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {SLOTS.map(({ slot, label, hint }) => (
        <div
          key={slot}
          className="rounded-lg border border-ivory-line bg-white/60 p-4 dark:border-night-line dark:bg-night-card"
        >
          <p className="font-sans text-[10px] uppercase tracking-luxe text-stone-dim">{label}</p>
          <p className="mt-1 font-sans text-[11px] text-stone">{hint}</p>
          <ImageUploadField
            url={heroImages[slot] ?? ''}
            label={label}
            onUpload={async (file) => {
              const err = await uploadHeroImage(slot, file);
              if (!err) await reload();
              return err;
            }}
            onClear={async () => {
              const err = await deleteHeroImage(slot);
              if (!err) await reload();
              return err;
            }}
          />
        </div>
      ))}
    </div>
  );
}
