import { useId } from 'react';
import { type NoteKey } from '../../data/ingredients';
import type { ScentFormula } from '../../data/premadeScents';
import { noteColor } from '../../lib/color';
import { normalizeSelected } from '../../lib/selection';

const STACK: NoteKey[] = ['base', 'heart', 'top'];
const LIQUID = { x: 22, width: 76, bottom: 148, height: 100 };

export function BottlePreview({ formula, name }: { formula: ScentFormula; name: string }) {
  const clipId = useId();
  const selected = normalizeSelected(formula.selected);
  let cursor = LIQUID.bottom;
  const layers = STACK.map((note) => {
    const h = (formula.percentages[note] / 100) * LIQUID.height;
    cursor -= h;
    return { note, y: cursor, h, color: noteColor(note, selected[note]) };
  });

  return (
    <svg viewBox="0 0 120 168" role="img" aria-label={`${name} bottle preview`} className="h-full w-auto">
      <rect x="48" y="4" width="24" height="16" rx="2.5" className="fill-neutral-400 dark:fill-[#3a342a]" />
      <rect x="53" y="20" width="14" height="12" className="fill-neutral-300 dark:fill-[#26231e]" />
      <clipPath id={clipId}>
        <rect x="19" y="35" width="82" height="118" rx="6" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        {layers.map((l) => (
          <rect key={l.note} x={LIQUID.x} y={l.y} width={LIQUID.width} height={Math.max(l.h, 0)} fill={l.color} opacity="0.85" />
        ))}
      </g>
      <rect
        x="16"
        y="32"
        width="88"
        height="124"
        rx="8"
        fill="none"
        strokeWidth="1.5"
        className="stroke-stone/60 dark:stroke-[#57503f]"
      />
      <rect x="30" y="88" width="60" height="46" rx="3" fill="#f3ecd9" />
      <rect x="34" y="92" width="52" height="38" fill="none" stroke="#3a342a" strokeWidth="0.75" />
      <text
        x="60"
        y="108"
        textAnchor="middle"
        fontSize="8.5"
        fontStyle="italic"
        fill="#2c2820"
        style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
      >
        {name.length > 16 ? `${name.slice(0, 15)}…` : name}
      </text>
      <text x="60" y="121" textAnchor="middle" fontSize="4.5" letterSpacing="1" fill="#8a8272" style={{ fontFamily: 'Inter, sans-serif' }}>
        EAU DE PARFUM
      </text>
      <rect x="20" y="36" width="7" height="116" rx="3.5" fill="#ffffff" opacity="0.12" />
    </svg>
  );
}
