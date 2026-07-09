import { ArrowDown } from 'lucide-react';
import { Reveal } from './Reveal';

const STEPS = [
  { number: '01', title: 'Choose your notes', copy: 'Five rare ingredients per layer, curated by our perfumers.' },
  { number: '02', title: 'Balance the blend', copy: 'Shift the ratio of top, heart, and base to your taste.' },
  { number: '03', title: 'Name your creation', copy: 'Watch it appear on the bottle, printed by hand.' },
];

export function Hero() {
  return (
    <section id="top" className="relative flex min-h-screen flex-col justify-center px-5 pt-24">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <p className="font-sans text-[11px] tracking-luxe text-gold-deep dark:text-gold">
            MAISON DE PARFUM · EST. 2026
          </p>
        </Reveal>
        <Reveal delay={100}>
          <h1 className="mt-6 max-w-3xl font-display text-6xl font-medium leading-[1.05] text-neutral-900 dark:text-cream sm:text-7xl lg:text-8xl">
            Your signature,
            <br />
            <em className="text-gold-deep dark:text-gold">distilled.</em>
          </h1>
        </Reveal>
        <Reveal delay={220}>
          <p className="mt-8 max-w-xl font-sans text-sm leading-relaxed text-stone">
            Compose a fragrance no one else owns. Blend three layers of rare ingredients,
            balance them to your skin, and seal it under a name of your choosing —
            hand-mixed to your exact formula.
          </p>
        </Reveal>
        <Reveal delay={340}>
          <a
            href="#builder"
            className="shimmer mt-10 inline-flex items-center gap-3 border border-gold-deep px-8 py-4 font-sans text-[11px] tracking-luxe text-gold-deep transition-colors hover:bg-gold-deep hover:text-ivory dark:border-gold dark:text-gold dark:hover:bg-gold dark:hover:text-night"
          >
            COMPOSE YOUR SIGNATURE
            <ArrowDown size={13} aria-hidden />
          </a>
        </Reveal>

        <div className="mt-24 grid gap-8 border-t border-ivory-line pt-10 dark:border-night-line sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.number} delay={i * 120}>
              <div className="flex items-baseline gap-3">
                <span className="font-display text-2xl italic text-gold-deep dark:text-gold">{step.number}</span>
                <h2 className="font-display text-xl text-neutral-900 dark:text-cream">{step.title}</h2>
              </div>
              <p className="mt-2 font-sans text-xs leading-relaxed text-stone">{step.copy}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
