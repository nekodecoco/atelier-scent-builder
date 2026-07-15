import { Fingerprint } from 'lucide-react';
import { computeProfile, TRAIT_AXES } from '../../lib/scentProfile';
import { useScentStore } from '../../store/useScentStore';

const SIZE = 140;
const CENTER = SIZE / 2;
const RADIUS = 52;

function point(axisIndex: number, value: number): [number, number] {
  const angle = (Math.PI * 2 * axisIndex) / TRAIT_AXES.length - Math.PI / 2;
  return [CENTER + Math.cos(angle) * RADIUS * value, CENTER + Math.sin(angle) * RADIUS * value];
}

export function ScentProfileCard() {
  const selected = useScentStore((s) => s.selected);
  const percentages = useScentStore((s) => s.percentages);
  const profile = computeProfile(selected, percentages);

  const max = Math.max(...TRAIT_AXES.map((axis) => profile.values[axis]), 0.001);
  const polygon = TRAIT_AXES.map((axis, i) =>
    point(i, 0.25 + 0.75 * (profile.values[axis] / max)).join(','),
  ).join(' ');

  return (
    <div className="rounded-lg border border-ivory-line bg-white/60 p-5 dark:border-night-line dark:bg-night-card">
      <div className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-luxe text-stone-dim">
        <Fingerprint size={12} className="text-gold-deep dark:text-gold" aria-hidden />
        Scent profile
      </div>

      <div className="mt-2 flex items-center gap-3">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="h-44 w-44 flex-shrink-0"
          role="img"
          aria-label="Radar chart of the blend's character"
        >
          {[0.5, 1].map((ring) => (
            <polygon
              key={ring}
              points={TRAIT_AXES.map((_, i) => point(i, ring).join(',')).join(' ')}
              fill="none"
              strokeWidth="0.75"
              className="stroke-stone/30 dark:stroke-night-line"
            />
          ))}
          {TRAIT_AXES.map((_, i) => {
            const [x, y] = point(i, 1);
            return (
              <line
                key={i}
                x1={CENTER}
                y1={CENTER}
                x2={x}
                y2={y}
                strokeWidth="0.5"
                className="stroke-stone/30 dark:stroke-night-line"
              />
            );
          })}
          <polygon
            points={polygon}
            className="fill-gold-deep/25 stroke-gold-deep dark:fill-gold/20 dark:stroke-gold"
            strokeWidth="1.25"
            style={{ transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
          {TRAIT_AXES.map((axis, i) => {
            const [x, y] = point(i, 1.28);
            return (
              <text
                key={axis}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="8.5"
                className="fill-stone-dim"
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.06em' }}
              >
                {axis}
              </text>
            );
          })}
        </svg>

        <p className="flex-1 font-display text-base italic leading-relaxed text-neutral-800 dark:text-cream">
          {profile.character}
        </p>
      </div>
    </div>
  );
}
