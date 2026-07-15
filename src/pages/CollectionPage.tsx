import { useState } from 'react';
import { ProductCard } from '../components/ui/ProductCard';
import { Reveal } from '../components/ui/Reveal';
import { PREMADE_SCENTS } from '../data/premadeScents';
import { useCatalogStore } from '../store/useCatalogStore';

type Filter = 'all' | 'signatures' | 'custom';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'ALL' },
  { key: 'signatures', label: 'SIGNATURES' },
  { key: 'custom', label: 'YOUR BLENDS' },
];

function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/5] bg-paper-deep" />
      <div className="mx-auto mt-4 h-3 w-28 bg-paper-deep" />
      <div className="mx-auto mt-2 h-2.5 w-36 bg-paper-deep" />
      <div className="mx-auto mt-4 h-9 w-full bg-paper-deep" />
    </div>
  );
}

export function CollectionPage() {
  const loaded = useCatalogStore((s) => s.loaded);
  const hiddenPremades = useCatalogStore((s) => s.hiddenPremades);
  const customPremades = useCatalogStore((s) => s.customPremades);
  const [filter, setFilter] = useState<Filter>('all');

  const signatures = PREMADE_SCENTS.filter((scent) => !hiddenPremades[scent.id]);
  const visible =
    filter === 'signatures' ? signatures : filter === 'custom' ? customPremades : [...signatures, ...customPremades];

  return (
    <section className="px-5 pb-24 pt-28 md:pt-24 lg:px-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-4">
        <h1 className="font-grotesk text-2xl font-bold uppercase tracking-tightest text-ink sm:text-3xl">
          Discover Atelier N°9
        </h1>
        <nav className="flex items-center gap-4 font-sans text-[10px] font-medium tracking-[0.18em] text-muted">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              aria-pressed={filter === key}
              className={`transition-colors hover:text-ink ${filter === key ? 'text-ink' : ''}`}
            >
              {filter === key ? `[ ${label} ]` : label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
        {!loaded
          ? Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)
          : visible.map((scent, i) => (
              <Reveal key={scent.id} delay={(i % 3) * 80} className="flex">
                <ProductCard scent={scent} tag={i === 0 && filter !== 'custom' ? 'BEST SELLER' : undefined} />
              </Reveal>
            ))}
      </div>

      {loaded && visible.length === 0 && (
        <p className="mt-16 text-center font-display text-xl italic text-muted">
          {filter === 'custom'
            ? 'No custom blends yet — compose one in the scent builder.'
            : 'The collection is being recomposed — check back soon.'}
        </p>
      )}
    </section>
  );
}
