import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PREMADE_SCENTS } from '../../data/premadeScents';
import { MASTER_BLEND } from '../../lib/blend';
import { formatPeso, premadePriceFor } from '../../lib/pricing';
import { useCatalogStore } from '../../store/useCatalogStore';
import { ProductBottle } from './ProductBottle';
import { ScentWash } from './ScentWash';

const SLIDE_COUNT = 3;
const INTERVAL_MS = 6000;

const HOUSE_FORMULA = {
  selected: { top: 'bergamot', heart: 'rose-de-mai', base: 'sandalwood' },
  percentages: { ...MASTER_BLEND },
};

const ctaClass =
  'inline-block border border-ink px-7 py-3 font-sans text-[10px] font-medium tracking-[0.2em] text-ink transition-colors hover:bg-ink hover:text-paper';

export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const hiddenPremades = useCatalogStore((s) => s.hiddenPremades);
  const imageMap = useCatalogStore((s) => s.premadeImages);
  useCatalogStore((s) => s.premadePrices);
  useCatalogStore((s) => s.pricing);

  const reducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % SLIDE_COUNT), INTERVAL_MS);
    return () => clearInterval(timer);
  }, [paused, reducedMotion]);

  const featured = PREMADE_SCENTS.find((s) => !hiddenPremades[s.id]) ?? PREMADE_SCENTS[0];

  const slides = [
    <div key="brand" className="relative h-full bg-gradient-to-b from-paper to-paper-deep">
      <div
        aria-hidden
        className="absolute right-[12%] top-0 hidden h-[68%] w-24 opacity-90 sm:block"
        style={{
          background: 'linear-gradient(160deg, #8a6b4a 0%, #5c4632 60%, #3d2e20 100%)',
          clipPath: 'polygon(35% 0, 78% 3%, 100% 62%, 58% 100%, 22% 66%, 40% 30%)',
        }}
      />
      <div className="absolute bottom-[22%] right-[22%] hidden sm:block">
        <ProductBottle formula={HOUSE_FORMULA} name="Golden Hour" className="h-56 w-auto" />
      </div>
      <div className="absolute inset-x-0 bottom-0 px-5 pb-14 lg:px-8">
        <h1 className="max-w-3xl font-grotesk text-[15vw] font-extrabold uppercase leading-[0.9] tracking-tightest text-ink sm:text-7xl lg:text-8xl">
          Radical
          <br />
          Perfumery
        </h1>
        <div className="mt-6 flex flex-wrap items-center gap-6">
          <p className="max-w-xs font-sans text-[10px] uppercase leading-relaxed tracking-[0.14em] text-muted">
            Hand-mixed in Manila. Composed by you in 3D, or curated by our AI concierge.
          </p>
          <Link to="/collection" className={ctaClass}>
            DISCOVER THE COLLECTION
          </Link>
        </div>
      </div>
    </div>,

    <ScentWash key="featured" formula={featured.formula} imageUrl={imageMap[featured.id]} className="h-full">
      <div className="absolute bottom-[18%] right-[16%] hidden sm:block">
        <ProductBottle formula={featured.formula} name={featured.name} className="h-60 w-auto" />
      </div>
      <div className="absolute inset-x-0 bottom-0 px-5 pb-14 lg:px-8">
        <p className="font-sans text-[10px] font-medium tracking-[0.2em] text-paper/80">
          FEATURED · {featured.tagline.toUpperCase()}
        </p>
        <h2 className="mt-3 max-w-3xl font-grotesk text-[13vw] font-extrabold uppercase leading-[0.9] tracking-tightest text-paper drop-shadow sm:text-7xl">
          {featured.name}
        </h2>
        <div className="mt-6 flex items-center gap-6">
          <span className="font-sans text-sm text-paper">{formatPeso(premadePriceFor(featured.id, 50))}</span>
          <Link
            to="/collection"
            className="inline-block border border-paper px-7 py-3 font-sans text-[10px] font-medium tracking-[0.2em] text-paper transition-colors hover:bg-paper hover:text-ink"
          >
            DISCOVER
          </Link>
        </div>
      </div>
    </ScentWash>,

    <div key="builder" className="relative h-full bg-paper-deep">
      <div aria-hidden className="absolute right-[14%] top-[16%] hidden gap-3 sm:flex">
        {['#c9a53a', '#c14a6e', '#a5713d'].map((color) => (
          <span key={color} className="h-24 w-8" style={{ background: color, opacity: 0.8 }} />
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 px-5 pb-14 lg:px-8">
        <p className="font-sans text-[10px] font-medium tracking-[0.2em] text-muted">
          THE 3D SCENT BUILDER
        </p>
        <h2 className="mt-3 max-w-3xl font-grotesk text-[13vw] font-extrabold uppercase leading-[0.9] tracking-tightest text-ink sm:text-7xl">
          Composed
          <br />
          by you
        </h2>
        <div className="mt-6 flex flex-wrap items-center gap-6">
          <p className="max-w-xs font-sans text-[10px] uppercase leading-relaxed tracking-[0.14em] text-muted">
            Balance three layers in a live 3D bottle — or describe a feeling and let the concierge compose it.
          </p>
          <Link to="/builder" className={ctaClass}>
            START COMPOSING
          </Link>
        </div>
      </div>
    </div>,
  ];

  return (
    <section
      className="relative h-[82vh] min-h-[520px] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured"
    >
      {slides.map((slide, i) => (
        <div
          key={i}
          aria-hidden={i !== index}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === index ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          {slide}
        </div>
      ))}

      <div className="absolute bottom-4 right-5 z-10 flex items-center gap-3 lg:right-8">
        <button
          type="button"
          onClick={() => setIndex((i) => (i + SLIDE_COUNT - 1) % SLIDE_COUNT)}
          aria-label="Previous slide"
          className="p-1 text-ink/70 transition-colors hover:text-ink"
        >
          <ChevronLeft size={16} aria-hidden />
        </button>
        <span className="flex items-center gap-1.5" aria-hidden>
          {Array.from({ length: SLIDE_COUNT }, (_, i) => (
            <span key={i} className={`h-0.5 w-4 ${i === index ? 'bg-ink' : 'bg-ink/25'}`} />
          ))}
        </span>
        <span className="font-sans text-[9px] tracking-[0.18em] text-muted">
          0{index + 1} / 0{SLIDE_COUNT}
        </span>
        <button
          type="button"
          onClick={() => setIndex((i) => (i + 1) % SLIDE_COUNT)}
          aria-label="Next slide"
          className="p-1 text-ink/70 transition-colors hover:text-ink"
        >
          <ChevronRight size={16} aria-hidden />
        </button>
      </div>
    </section>
  );
}
