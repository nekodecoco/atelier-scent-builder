import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HeroSlider } from '../components/ui/HeroSlider';
import { ProductBottle } from '../components/ui/ProductBottle';
import { ProductCard } from '../components/ui/ProductCard';
import { Reveal } from '../components/ui/Reveal';
import { PREMADE_SCENTS } from '../data/premadeScents';
import { MASTER_BLEND } from '../lib/blend';
import { useCatalogStore } from '../store/useCatalogStore';

const HOUSE_FORMULA = {
  selected: { top: 'yuzu', heart: 'iris', base: 'white-musk' },
  percentages: { ...MASTER_BLEND },
};

export function LandingPage() {
  const { hash } = useLocation();
  const navigate = useNavigate();
  const hiddenPremades = useCatalogStore((s) => s.hiddenPremades);
  const customPremades = useCatalogStore((s) => s.customPremades);

  // old deep links (/#builder) now live on their own page
  useEffect(() => {
    if (hash === '#builder') navigate('/builder', { replace: true });
  }, [hash, navigate]);

  const discover = [
    ...PREMADE_SCENTS.filter((s) => !hiddenPremades[s.id]),
    ...customPremades,
  ].slice(0, 3);

  return (
    <div className="pt-[88px] md:pt-[53px]">
      <HeroSlider />

      <section className="border-t border-line px-5 py-14 lg:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="font-grotesk text-xl font-bold uppercase tracking-tightest text-ink sm:text-2xl">
            Discover Atelier N°9
          </h2>
          <Link
            to="/collection"
            className="font-sans text-[10px] font-medium tracking-[0.18em] text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            [ VIEW ALL ]
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:gap-x-6">
          {discover.map((scent, i) => (
            <Reveal key={scent.id} delay={i * 90} className="flex">
              <ProductCard scent={scent} tag={i === 0 ? 'BEST SELLER' : undefined} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-paper-deep px-5 py-16 lg:px-8">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <Reveal>
            <p className="font-sans text-[10px] font-medium tracking-[0.2em] text-muted">
              ONE OF ONE
            </p>
            <h2 className="mt-3 font-grotesk text-4xl font-extrabold uppercase leading-[0.95] tracking-tightest text-ink sm:text-5xl">
              Your signature,
              <br />
              distilled
            </h2>
            <p className="mt-5 max-w-md font-sans text-sm leading-relaxed text-muted">
              Balance top, heart, and base in a live 3D bottle, watch your name print on the
              label, and have it hand-mixed to your exact formula — or describe a feeling and
              let the AI concierge compose it for you.
            </p>
            <Link
              to="/builder"
              className="mt-7 inline-block border border-ink px-7 py-3 font-sans text-[10px] font-medium tracking-[0.2em] text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              OPEN THE SCENT BUILDER
            </Link>
          </Reveal>
          <Reveal delay={120} className="flex justify-center">
            <ProductBottle formula={HOUSE_FORMULA} name="Yours" className="h-72 w-auto" />
          </Reveal>
        </div>
      </section>
    </div>
  );
}
