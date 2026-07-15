import { Wind } from 'lucide-react';
import { describeScent } from '../../lib/scentDescription';
import { useScentStore } from '../../store/useScentStore';
import { Reveal } from './Reveal';

/**
 * The payoff after "Blend my scent": an editorial description of how the
 * finished perfume opens, blooms, and dries down. Hidden until the blend is
 * merged; any edit un-blends and removes it again.
 */
export function ScentDescription() {
  const blended = useScentStore((s) => s.blended);
  const selected = useScentStore((s) => s.selected);
  const percentages = useScentStore((s) => s.percentages);
  const concentration = useScentStore((s) => s.concentration);

  if (!blended) return null;

  const description = describeScent(selected, percentages, concentration);

  return (
    <Reveal className="rounded-lg border border-ivory-line bg-white/60 p-5 dark:border-night-line dark:bg-night-card">
      <div className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-luxe text-gold-deep dark:text-gold">
        <Wind size={12} aria-hidden />
        How it wears
      </div>
      <p className="mt-2 font-display text-base italic leading-relaxed text-neutral-800 dark:text-cream">
        {description}
      </p>
    </Reveal>
  );
}
