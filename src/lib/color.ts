import { getIngredient, NOTE_KEYS, type NoteKey } from '../data/ingredients';
import type { Percentages } from './blend';
import type { Theme } from '../store/useScentStore';

function hexToHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Ingredient colors are tuned as liquid tints, not text ink. Pale notes like
 * jasmine or white musk vanish as text on the ivory background, so clamp
 * lightness toward readable ink for the active theme.
 */
export function inkFor(hex: string, theme: Theme): string {
  const [h, s, l] = hexToHsl(hex);
  if (theme === 'light') return l > 0.42 ? hslToHex(h, Math.min(s + 0.08, 1), 0.38) : hex;
  return l < 0.5 ? hslToHex(h, s, 0.58) : hex;
}

/**
 * The single color the finished perfume settles into: the percentage-weighted
 * mix of the three ingredient colors, blended in gamma-corrected space so
 * mid-tones don't go muddy.
 */
export function mixFormulaColor(
  selected: Record<NoteKey, string>,
  percentages: Percentages,
): string {
  const channels = [0, 0, 0];
  for (const note of NOTE_KEYS) {
    const hex = getIngredient(note, selected[note]).color;
    const weight = percentages[note] / 100;
    const n = parseInt(hex.slice(1), 16);
    const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    for (let i = 0; i < 3; i++) channels[i] += weight * Math.pow(rgb[i] / 255, 2.2);
  }
  return `#${channels
    .map((c) =>
      Math.round(Math.pow(Math.min(c, 1), 1 / 2.2) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}
