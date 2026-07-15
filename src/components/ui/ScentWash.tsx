import type { ReactNode } from 'react';
import type { ScentFormula } from '../../data/premadeScents';
import { noteColor } from '../../lib/color';
import { normalizeSelected } from '../../lib/selection';

/**
 * Full-bleed backdrop for product imagery: an admin photo when provided,
 * otherwise a layered color wash built from the formula's ingredient colors.
 */
export function ScentWash({
  formula,
  imageUrl,
  className = '',
  children,
}: {
  formula: ScentFormula;
  imageUrl?: string;
  className?: string;
  children?: ReactNode;
}) {
  const selected = normalizeSelected(formula.selected);
  const top = noteColor('top', selected.top);
  const heart = noteColor('heart', selected.heart);
  const base = noteColor('base', selected.base);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {imageUrl ? (
        <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: [
              `radial-gradient(ellipse 90% 70% at 25% 20%, ${top} 0%, transparent 60%)`,
              `radial-gradient(ellipse 100% 90% at 75% 45%, ${heart} 0%, transparent 70%)`,
              `radial-gradient(ellipse 110% 80% at 50% 95%, ${base} 0%, transparent 75%)`,
              `linear-gradient(165deg, ${heart} 0%, ${base} 100%)`,
            ].join(', '),
          }}
        />
      )}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: 'inset 0 -70px 110px rgba(20, 16, 8, 0.28)' }}
      />
      {children}
    </div>
  );
}
