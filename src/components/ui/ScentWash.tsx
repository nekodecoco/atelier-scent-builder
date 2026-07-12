import type { ReactNode } from 'react';
import { getIngredient } from '../../data/ingredients';
import type { ScentFormula } from '../../data/premadeScents';

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
  const top = getIngredient('top', formula.selected.top).color;
  const heart = getIngredient('heart', formula.selected.heart).color;
  const base = getIngredient('base', formula.selected.base).color;

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
