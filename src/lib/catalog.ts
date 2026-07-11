import { NOTE_KEYS, type Ingredient, type NoteKey } from '../data/ingredients';
import type { PremadeScent, ScentFormula } from '../data/premadeScents';
import type { OrderRecord } from './orders';
import { DEFAULT_PRICING, type PremadePriceMap, type PricingConfig } from './pricing';
import type { BottleSize } from './recipe';
import { supabase } from './supabase';

export type StockMap = Record<string, number>;
export type AvailabilityMap = Record<string, boolean>;
export type HiddenMap = Record<string, boolean>;

export const ORDER_STATUSES = ['pending', 'mixing', 'shipped', 'delivered', 'cancelled'] as const;

export interface AdminOrderRecord extends OrderRecord {
  email: string | null;
}

/**
 * No row means "in stock". The `hidden` column arrives with the phase-4
 * migration, so fall back to the narrower select on older databases.
 */
export async function fetchStock(): Promise<{ stock: StockMap; hidden: HiddenMap }> {
  if (!supabase) return { stock: {}, hidden: {} };
  let { data, error } = await supabase.from('premade_stock').select('scent_id, stock, hidden');
  if (error && /hidden/.test(error.message)) {
    ({ data, error } = await supabase.from('premade_stock').select('scent_id, stock'));
  }
  if (error || !data) return { stock: {}, hidden: {} };
  const stock: StockMap = {};
  const hidden: HiddenMap = {};
  for (const row of data as { scent_id: string; stock: number; hidden?: boolean }[]) {
    stock[row.scent_id] = row.stock;
    if (row.hidden) hidden[row.scent_id] = true;
  }
  return { stock, hidden };
}

/** No row means "available". */
export async function fetchAvailability(): Promise<AvailabilityMap> {
  if (!supabase) return {};
  const { data, error } = await supabase
    .from('ingredient_availability')
    .select('ingredient_id, available');
  if (error || !data) return {};
  return Object.fromEntries(
    data.map((row) => [row.ingredient_id as string, row.available as boolean]),
  );
}

export async function checkIsAdmin(userId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  return !error && data !== null;
}

export async function upsertStock(scentId: string, stock: number): Promise<string | null> {
  if (!supabase) return 'Supabase is not configured.';
  const { error } = await supabase
    .from('premade_stock')
    .upsert({ scent_id: scentId, stock: Math.max(0, Math.round(stock)) });
  return error ? error.message : null;
}

export async function setIngredientAvailability(
  ingredientId: string,
  available: boolean,
): Promise<string | null> {
  if (!supabase) return 'Supabase is not configured.';
  const { error } = await supabase
    .from('ingredient_availability')
    .upsert({ ingredient_id: ingredientId, available });
  return error ? error.message : null;
}

export async function setPremadeHidden(scentId: string, hidden: boolean): Promise<string | null> {
  if (!supabase) return 'Supabase is not configured.';
  const { data } = await supabase
    .from('premade_stock')
    .select('stock')
    .eq('scent_id', scentId)
    .maybeSingle();
  const { error } = await supabase
    .from('premade_stock')
    .upsert({ scent_id: scentId, stock: data?.stock ?? 0, hidden });
  return error ? error.message : null;
}

interface CustomIngredientRow {
  id: string;
  note: NoteKey;
  name: string;
  description: string;
  color: string;
  scent_twins: Ingredient['scentTwins'];
}

export async function fetchCustomIngredients(): Promise<Record<NoteKey, Ingredient[]>> {
  const empty: Record<NoteKey, Ingredient[]> = { top: [], heart: [], base: [] };
  if (!supabase) return empty;
  const { data, error } = await supabase
    .from('custom_ingredients')
    .select('id, note, name, description, color, scent_twins')
    .order('created_at', { ascending: true });
  if (error || !data) return empty;
  for (const row of data as CustomIngredientRow[]) {
    if (!NOTE_KEYS.includes(row.note)) continue;
    empty[row.note].push({
      id: row.id,
      name: row.name,
      description: row.description,
      color: row.color,
      scentTwins: Array.isArray(row.scent_twins) ? row.scent_twins : [],
    });
  }
  return empty;
}

export async function upsertCustomIngredient(input: {
  id?: string;
  note: NoteKey;
  name: string;
  description: string;
  color: string;
  scentTwins: Ingredient['scentTwins'];
}): Promise<string | null> {
  if (!supabase) return 'Supabase is not configured.';
  const row: Record<string, unknown> = {
    note: input.note,
    name: input.name,
    description: input.description,
    color: input.color,
    scent_twins: input.scentTwins,
  };
  if (input.id) row.id = input.id;
  const { error } = await supabase.from('custom_ingredients').upsert(row);
  return error ? error.message : null;
}

export async function deleteCustomIngredient(id: string): Promise<string | null> {
  if (!supabase) return 'Supabase is not configured.';
  const { error } = await supabase.from('custom_ingredients').delete().eq('id', id);
  return error ? error.message : null;
}

interface CustomPremadeRow {
  id: string;
  name: string;
  tagline: string;
  description: string;
  formula: ScentFormula;
}

export async function fetchCustomPremades(): Promise<PremadeScent[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('custom_premades')
    .select('id, name, tagline, description, formula')
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return (data as CustomPremadeRow[]).filter((row) => row.formula?.selected && row.formula?.percentages);
}

export async function upsertCustomPremade(input: {
  id?: string;
  name: string;
  tagline: string;
  description: string;
  formula: ScentFormula;
}): Promise<string | null> {
  if (!supabase) return 'Supabase is not configured.';
  const row: Record<string, unknown> = {
    name: input.name,
    tagline: input.tagline,
    description: input.description,
    formula: input.formula,
  };
  if (input.id) row.id = input.id;
  const { error } = await supabase.from('custom_premades').upsert(row);
  return error ? error.message : null;
}

export async function deleteCustomPremade(id: string): Promise<string | null> {
  if (!supabase) return 'Supabase is not configured.';
  const { error } = await supabase.from('custom_premades').delete().eq('id', id);
  return error ? error.message : null;
}

/** Missing row or table (pre-migration) → current built-in defaults. */
export async function fetchPricing(): Promise<PricingConfig> {
  if (!supabase) return DEFAULT_PRICING;
  const { data, error } = await supabase
    .from('shop_settings')
    .select('value')
    .eq('key', 'pricing')
    .maybeSingle();
  if (error || !data?.value) return DEFAULT_PRICING;
  const value = data.value as { bySize?: Record<string, number>; oilSurchargePerMl?: number };
  const bySize = { ...DEFAULT_PRICING.bySize };
  for (const size of [30, 50, 100] as BottleSize[]) {
    const price = Number(value.bySize?.[String(size)]);
    if (Number.isFinite(price) && price > 0) bySize[size] = price;
  }
  const surcharge = Number(value.oilSurchargePerMl);
  return {
    bySize,
    oilSurchargePerMl: Number.isFinite(surcharge) && surcharge >= 0
      ? surcharge
      : DEFAULT_PRICING.oilSurchargePerMl,
  };
}

export async function upsertPricing(config: PricingConfig): Promise<string | null> {
  if (!supabase) return 'Supabase is not configured.';
  const { error } = await supabase.from('shop_settings').upsert({
    key: 'pricing',
    value: {
      bySize: { '30': config.bySize[30], '50': config.bySize[50], '100': config.bySize[100] },
      oilSurchargePerMl: config.oilSurchargePerMl,
    },
  });
  return error ? error.message : null;
}

export async function fetchPremadePrices(): Promise<PremadePriceMap> {
  if (!supabase) return {};
  const { data, error } = await supabase.from('premade_prices').select('scent_id, prices');
  if (error || !data) return {};
  const map: PremadePriceMap = {};
  for (const row of data as { scent_id: string; prices: Record<string, number> }[]) {
    const entry: Partial<Record<BottleSize, number>> = {};
    for (const size of [30, 50, 100] as BottleSize[]) {
      const price = Number(row.prices?.[String(size)]);
      if (Number.isFinite(price) && price > 0) entry[size] = price;
    }
    if (Object.keys(entry).length > 0) map[row.scent_id] = entry;
  }
  return map;
}

export async function upsertPremadePrice(
  scentId: string,
  prices: Partial<Record<BottleSize, number>>,
): Promise<string | null> {
  if (!supabase) return 'Supabase is not configured.';
  const payload: Record<string, number> = {};
  for (const size of [30, 50, 100] as BottleSize[]) {
    const price = prices[size];
    if (price !== undefined && Number.isFinite(price) && price > 0) payload[String(size)] = price;
  }
  if (Object.keys(payload).length === 0) return deletePremadePrice(scentId);
  const { error } = await supabase
    .from('premade_prices')
    .upsert({ scent_id: scentId, prices: payload });
  return error ? error.message : null;
}

export async function deletePremadePrice(scentId: string): Promise<string | null> {
  if (!supabase) return 'Supabase is not configured.';
  const { error } = await supabase.from('premade_prices').delete().eq('scent_id', scentId);
  return error ? error.message : null;
}

export async function fetchAllOrders(): Promise<{ orders?: AdminOrderRecord[]; error?: string }> {
  if (!supabase) return { error: 'Supabase is not configured.' };
  const { data, error } = await supabase
    .from('orders')
    .select('id, created_at, status, total, currency, items, email')
    .order('created_at', { ascending: false });
  if (error) return { error: error.message };
  return { orders: (data ?? []) as AdminOrderRecord[] };
}

export async function updateOrderStatus(orderId: string, status: string): Promise<string | null> {
  if (!supabase) return 'Supabase is not configured.';
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
  return error ? error.message : null;
}
