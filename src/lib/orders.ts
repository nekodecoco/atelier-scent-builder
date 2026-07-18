import type { CartItem } from '../store/useCartStore';
import { normalizeAddress, type ShippingAddress } from './address';
import { supabase } from './supabase';

export interface OrderRecord {
  id: string;
  created_at: string;
  status: string;
  total: number;
  currency: string;
  items: CartItem[];
  /** The address this order ships to, snapshotted at checkout. */
  shipping: ShippingAddress | null;
}

/**
 * Note there is deliberately no schema-tolerant retry here. Tolerance is right for
 * admin-optional catalog data, where a missing column has a sensible default — but
 * an order silently written without a shipping address is strictly worse than a
 * failed order, because nobody can ship it and nobody finds out. Fail loudly and
 * let the owner run the SQL.
 *
 * An out-of-stock rejection from the orders_apply_stock trigger also surfaces
 * through `error` here: Postgres puts the raise-exception text into error.message.
 */
export async function placeOrder(
  items: CartItem[],
  total: number,
  shipping: ShippingAddress,
): Promise<{ orderId?: string; error?: string }> {
  if (!supabase) return { error: 'Supabase is not configured.' };

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return { error: 'You need to sign in to place an order.' };

    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: userData.user.id,
        email: userData.user.email ?? null,
        total,
        currency: 'PHP',
        items,
        shipping,
      })
      .select('id')
      .single();

    if (error) return { error: error.message };
    return { orderId: data.id as string };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not place your order.' };
  }
}

/** Load boundary for an order row: the jsonb address is normalized on the way out. */
export function toOrderRecord(row: Record<string, unknown>): OrderRecord {
  return {
    ...(row as unknown as OrderRecord),
    shipping: row.shipping ? normalizeAddress(row.shipping) : null,
  };
}

export async function fetchMyOrders(): Promise<{ orders?: OrderRecord[]; error?: string }> {
  if (!supabase) return { error: 'Supabase is not configured.' };

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return { error: 'You need to sign in to view your orders.' };

    // Scope to the signed-in user explicitly. RLS is the real security boundary,
    // but this filter keeps the account page correct even if RLS is misconfigured
    // and stops admin accounts (which RLS lets read every order) seeing others' here.
    // The `shipping` column arrives with the fulfillment SQL. Unlike placeOrder,
    // this read stays schema-tolerant: past orders without an address line beat no
    // order history at all.
    const read = (columns: string) =>
      supabase!
        .from('orders')
        .select(columns)
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

    let { data, error } = await read('id, created_at, status, total, currency, items, shipping');
    if (error && /shipping/.test(error.message)) {
      ({ data, error } = await read('id, created_at, status, total, currency, items'));
    }

    if (error) return { error: error.message };
    return { orders: ((data ?? []) as unknown as Record<string, unknown>[]).map(toOrderRecord) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not load your orders.' };
  }
}
