import type { OrderRecord } from './orders';
import { supabase } from './supabase';

export type StockMap = Record<string, number>;
export type AvailabilityMap = Record<string, boolean>;

export const ORDER_STATUSES = ['pending', 'mixing', 'shipped', 'delivered', 'cancelled'] as const;

export interface AdminOrderRecord extends OrderRecord {
  email: string | null;
}

/** No row means "in stock" — the shop works before anything is configured. */
export async function fetchStock(): Promise<StockMap> {
  if (!supabase) return {};
  const { data, error } = await supabase.from('premade_stock').select('scent_id, stock');
  if (error || !data) return {};
  return Object.fromEntries(data.map((row) => [row.scent_id as string, row.stock as number]));
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
