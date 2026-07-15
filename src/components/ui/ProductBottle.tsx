import { useId } from 'react';
import type { ScentFormula } from '../../data/premadeScents';
import { mixFormulaColor } from '../../lib/color';
import { normalizeSelected } from '../../lib/selection';

/**
 * Editorial product shot: a tall cream-glass bottle with the blend's single
 * mixed color as liquid, echoing the reference photography.
 */
export function ProductBottle({
  formula,
  name,
  className = '',
}: {
  formula: ScentFormula;
  name: string;
  className?: string;
}) {
  const clipId = useId();
  const liquid = mixFormulaColor(normalizeSelected(formula.selected), formula.percentages);

  return (
    <svg viewBox="0 0 90 150" className={className} role="img" aria-label={`${name} bottle`}>
      <rect x="36" y="4" width="18" height="14" rx="2" fill="#b9b3a4" />
      <rect x="39" y="18" width="12" height="7" fill="#d8d3c4" />
      <clipPath id={clipId}>
        <rect x="21" y="26" width="48" height="112" rx="5" />
      </clipPath>
      <rect x="20" y="25" width="50" height="114" rx="6" fill="#f5f2e8" opacity="0.92" />
      <g clipPath={`url(#${clipId})`}>
        <rect x="21" y="58" width="48" height="80" fill={liquid} opacity="0.75" />
      </g>
      <rect
        x="20"
        y="25"
        width="50"
        height="114"
        rx="6"
        fill="none"
        stroke="#c9c3b2"
        strokeWidth="1"
      />
      <rect x="27" y="84" width="36" height="30" fill="#f7f4ea" stroke="#b9b3a4" strokeWidth="0.5" />
      <text
        x="45"
        y="97"
        textAnchor="middle"
        fontSize="6"
        fontStyle="italic"
        fill="#3a3830"
        style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
      >
        {name.length > 14 ? `${name.slice(0, 13)}…` : name}
      </text>
      <text
        x="45"
        y="106"
        textAnchor="middle"
        fontSize="3.2"
        letterSpacing="0.6"
        fill="#8a867a"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        EAU DE PARFUM
      </text>
      <rect x="23" y="30" width="6" height="104" rx="3" fill="#ffffff" opacity="0.35" />
      <ellipse cx="45" cy="144" rx="28" ry="3.5" fill="#1c1b18" opacity="0.12" />
    </svg>
  );
}
