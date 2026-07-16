import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { HeroSlider } from '../components/ui/HeroSlider';
import { LandingProductCard } from '../components/ui/LandingProductCard';
import { NoteMarquee } from '../components/ui/NoteMarquee';
import { Reveal } from '../components/ui/Reveal';
import { PREMADE_SCENTS } from '../data/premadeScents';
import { useCatalogStore } from '../store/useCatalogStore';

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

      <div
        aria-hidden
        className="flex flex-col items-center gap-2 border-t border-black/10 bg-bone pb-4 pt-10 text-graphite"
      >
        <span className="font-jetbrains text-xs font-medium uppercase tracking-[0.3em]">Scroll</span>
        <ChevronDown size={22} className="motion-safe:animate-bounce" />
      </div>

      <section className="bg-bone px-5 pb-20 pt-6 lg:px-8 lg:pb-28">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="font-caslon text-3xl leading-tight tracking-[-0.02em] text-black sm:text-4xl">
            Discover Atelier N°9
          </h2>
          <Link
            to="/collection"
            className="font-jetbrains text-[10px] font-medium uppercase tracking-[0.1em] text-graphite underline-offset-4 transition-colors hover:text-black hover:underline"
          >
            [ VIEW ALL ]
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:gap-x-6">
          {discover.map((scent, i) => (
            <Reveal key={scent.id} delay={i * 90} className="flex">
              <LandingProductCard scent={scent} tag={i === 0 ? 'BEST SELLER' : undefined} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Black stage: the full width becomes the asset — a long, slow slide of
          the note palette — rather than dead space around a centred object. */}
      <section className="border-t border-white/10 bg-black pb-16 pt-20 lg:pb-24 lg:pt-28">
        <div className="mx-auto max-w-[1400px] px-5 lg:px-16">
          <Reveal>
            <p className="font-jetbrains text-[10px] font-medium uppercase tracking-[0.1em] text-white/45">
              ONE OF ONE
            </p>
            <h2 className="mt-4 font-caslon text-5xl leading-[1.02] tracking-[-0.02em] text-white sm:text-7xl lg:text-8xl">
              Your signature,
              <br />
              distilled
            </h2>
            <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <p className="max-w-md font-hanken text-sm leading-relaxed text-white/60">
                Balance top, heart, and base in a live 3D bottle, watch your name print on the
                label, and have it hand-mixed to your exact formula — or describe a feeling and
                let the AI concierge compose it for you.
              </p>
              <div className="flex items-center gap-3 font-jetbrains text-[10px] uppercase tracking-[0.1em]">
                <span className="text-white">Compose</span>
                <span aria-hidden className="text-lime">
                  →
                </span>
                <span className="text-white">Name</span>
                <span aria-hidden className="text-lime">
                  →
                </span>
                <span className="text-white">Hand-mix</span>
              </div>
            </div>
          </Reveal>
        </div>

        {/* full-bleed — the lanes run edge to edge */}
        <Reveal delay={120} className="mt-14 lg:mt-20">
          <NoteMarquee />
        </Reveal>

        <div className="mx-auto max-w-[1400px] px-5 lg:px-16">
          <Reveal>
            <Link
              to="/builder"
              className="mt-12 inline-block border border-white bg-white px-7 py-3 font-jetbrains text-[10px] font-medium uppercase tracking-[0.1em] text-black transition-colors hover:bg-transparent hover:text-white lg:mt-14"
            >
              OPEN THE SCENT BUILDER
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
