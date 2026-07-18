import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
  selected: { top: ['bergamot'], heart: ['rose-de-mai'], base: ['sandalwood'] },
  percentages: { ...MASTER_BLEND },
};

const ctaDark =
  'inline-block border border-black px-7 py-3 font-jetbrains text-[10px] font-medium uppercase tracking-[0.1em] text-black transition-colors hover:bg-black hover:text-white';
const ctaLight =
  'inline-block border border-white px-7 py-3 font-jetbrains text-[10px] font-medium uppercase tracking-[0.1em] text-white transition-colors hover:bg-white hover:text-black';

/**
 * One hero slide. When `image` is set it fills full-bleed with a scrim and a
 * slow zoom on the active slide; otherwise it renders the generative `background`
 * fallback. `tone` flips the overlay text/CTA between dark (light surfaces) and
 * light (photos and the dark featured wash).
 */
function HeroSlide({
  image,
  background,
  tone,
  active,
  eyebrow,
  title,
  children,
}: {
  image?: string;
  background: ReactNode;
  tone: 'dark' | 'light';
  active: boolean;
  eyebrow: string;
  title: ReactNode;
  children: ReactNode;
}) {
  const light = tone === 'light' || Boolean(image);
  return (
    <div className="relative h-full overflow-hidden">
      {image ? (
        <>
          <img
            src={image}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[7000ms] ease-out ${
              active ? 'scale-105' : 'scale-100'
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/5" />
        </>
      ) : (
        background
      )}

      <div className="absolute inset-x-0 bottom-0 px-5 pb-14 lg:px-8">
        <p
          className={`font-jetbrains text-[10px] font-medium uppercase tracking-[0.1em] ${
            light ? 'text-white/80' : 'text-graphite'
          }`}
        >
          {eyebrow}
        </p>
        <div
          className={`mt-3 max-w-3xl font-caslon text-[13vw] leading-[1.02] tracking-[-0.02em] sm:text-7xl lg:text-8xl ${
            light ? 'text-white drop-shadow' : 'text-black'
          }`}
        >
          {title}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-6">{children}</div>
      </div>
    </div>
  );
}

export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const hiddenPremades = useCatalogStore((s) => s.hiddenPremades);
  const premadeImages = useCatalogStore((s) => s.premadeImages);
  const heroImages = useCatalogStore((s) => s.heroImages);
  useCatalogStore((s) => s.premadePrices);
  useCatalogStore((s) => s.pricing);

  // Guarded because this runs at render time, which also executes in Node
  // during the build prerender (src/prerender.tsx) where window doesn't exist.
  const reducedMotion = useMemo(
    () =>
      typeof window === 'undefined'
        ? false
        : window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % SLIDE_COUNT), INTERVAL_MS);
    return () => clearInterval(timer);
  }, [paused, reducedMotion]);

  const featured = PREMADE_SCENTS.find((s) => !hiddenPremades[s.id]) ?? PREMADE_SCENTS[0];

  // the featured slide is always dark; brand/builder are dark only once a photo is set
  const darkAtBottom = [Boolean(heroImages['hero-1']), true, Boolean(heroImages['hero-3'])][index];

  const slides = [
    <HeroSlide
      key="brand"
      image={heroImages['hero-1']}
      active={index === 0}
      tone="dark"
      eyebrow="ATELIER N°9"
      title={
        <>
          Radical
          <br />
          Perfumery
        </>
      }
      background={
        <>
          <div className="absolute inset-0 bg-bone" />
          <div className="absolute bottom-[22%] right-[22%] hidden sm:block">
            <ProductBottle formula={HOUSE_FORMULA} name="Golden Hour" className="h-56 w-auto" />
          </div>
        </>
      }
    >
      <p
        className={`max-w-xs font-hanken text-sm leading-relaxed ${
          heroImages['hero-1'] ? 'text-white/90' : 'text-graphite'
        }`}
      >
        Hand-mixed in Manila. Composed by you in 3D, or curated by our AI concierge.
      </p>
      <Link to="/collection" className={heroImages['hero-1'] ? ctaLight : ctaDark}>
        DISCOVER THE COLLECTION
      </Link>
    </HeroSlide>,

    <HeroSlide
      key="featured"
      image={heroImages['hero-2']}
      active={index === 1}
      tone="light"
      eyebrow={`FEATURED · ${featured.tagline.toUpperCase()}`}
      title={featured.name}
      background={
        <div className="absolute inset-0">
          <ScentWash formula={featured.formula} imageUrl={premadeImages[featured.id]} className="h-full">
            <div className="absolute bottom-[18%] right-[16%] hidden sm:block">
              <ProductBottle formula={featured.formula} name={featured.name} className="h-60 w-auto" />
            </div>
          </ScentWash>
        </div>
      }
    >
      <span className="font-hanken text-sm text-white">{formatPeso(premadePriceFor(featured.id, 50))}</span>
      <Link to="/collection" className={ctaLight}>
        DISCOVER
      </Link>
    </HeroSlide>,

    <HeroSlide
      key="builder"
      image={heroImages['hero-3']}
      active={index === 2}
      tone="dark"
      eyebrow="THE 3D SCENT BUILDER"
      title={
        <>
          Composed
          <br />
          by you
        </>
      }
      background={
        <>
          <div className="absolute inset-0 bg-bone-dim" />
          <div aria-hidden className="absolute right-[14%] top-[16%] hidden gap-3 sm:flex">
            <span className="h-24 w-8 bg-black" />
            <span className="h-24 w-8 bg-graphite" />
            <span className="h-24 w-8 bg-lime" />
          </div>
        </>
      }
    >
      <p
        className={`max-w-xs font-hanken text-sm leading-relaxed ${
          heroImages['hero-3'] ? 'text-white/90' : 'text-graphite'
        }`}
      >
        Balance three layers in a live 3D bottle — or describe a feeling and let the concierge compose it.
      </p>
      <Link to="/builder" className={heroImages['hero-3'] ? ctaLight : ctaDark}>
        START COMPOSING
      </Link>
    </HeroSlide>,
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
          className={`p-1 transition-colors ${
            darkAtBottom ? 'text-white/70 hover:text-white' : 'text-black/70 hover:text-black'
          }`}
        >
          <ChevronLeft size={16} aria-hidden />
        </button>
        <span className="flex items-center gap-1.5" aria-hidden>
          {Array.from({ length: SLIDE_COUNT }, (_, i) => (
            <span
              key={i}
              className={`h-0.5 w-4 ${
                i === index
                  ? darkAtBottom
                    ? 'bg-white'
                    : 'bg-black'
                  : darkAtBottom
                    ? 'bg-white/30'
                    : 'bg-black/25'
              }`}
            />
          ))}
        </span>
        <span
          className={`font-jetbrains text-[9px] tracking-[0.1em] ${
            darkAtBottom ? 'text-white/80' : 'text-graphite'
          }`}
        >
          0{index + 1} / 0{SLIDE_COUNT}
        </span>
        <button
          type="button"
          onClick={() => setIndex((i) => (i + 1) % SLIDE_COUNT)}
          aria-label="Next slide"
          className={`p-1 transition-colors ${
            darkAtBottom ? 'text-white/70 hover:text-white' : 'text-black/70 hover:text-black'
          }`}
        >
          <ChevronRight size={16} aria-hidden />
        </button>
      </div>
    </section>
  );
}
