import { NOTE_KEYS, type Ingredient, type NoteKey } from '../data/ingredients';
import type { PremadeScent, ScentFormula } from '../data/premadeScents';
import type { OrderRecord } from './orders';
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
