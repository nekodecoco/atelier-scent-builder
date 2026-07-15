import { getIngredient, type NoteKey } from '../data/ingredients';
import type { Percentages } from './blend';
import { type Selected, weightedIngredients } from './selection';

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
 * lightness toward readable ink on the paper background.
 */
export function inkFor(hex: string): string {
  const [h, s, l] = hexToHsl(hex);
  return l > 0.42 ? hslToHex(h, Math.min(s + 0.08, 1), 0.38) : hex;
}

/**
 * Blend hex colors in gamma-corrected space so mid-tones don't go muddy.
 * Weights need not sum to 1 — they are normalized to their own total.
 */
export function mixHexColors(hexes: string[], weights?: number[]): string {
  if (hexes.length === 0) return '#000000';
  const w = weights ?? hexes.map(() => 1);
  const total = w.reduce((sum, x) => sum + x, 0) || 1;
  const channels = [0, 0, 0];
  hexes.forEach((hex, idx) => {
    const share = w[idx] / total;
    const n = parseInt(hex.slice(1), 16);
    const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    for (let i = 0; i < 3; i++) channels[i] += share * Math.pow(rgb[i] / 255, 2.2);
  });
  return `#${channels
    .map((c) =>
      Math.round(Math.pow(Math.min(c, 1), 1 / 2.2) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/** The blended color for one note's ingredients, mixed in equal parts. */
export function noteColor(note: NoteKey, ids: string[]): string {
  const hexes = (ids.length ? ids : ['']).map((id) => getIngredient(note, id).color);
  return mixHexColors(hexes);
}

/**
 * The single color the finished perfume settles into: the weighted mix of every
 * ingredient across all notes (note% split equally within each note).
 */
export function mixFormulaColor(selected: Selected, percentages: Percentages): string {
  const parts = weightedIngredients(selected, percentages);
  return mixHexColors(
    parts.map((p) => getIngredient(p.note, p.id).color),
    parts.map((p) => p.weight),
  );
}
