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
  /**
   * The delivery fee this order was charged, frozen at placement. `total`
   * already includes it — this is only the display breakdown. Null = placed
   * before the fee existed (or on a DB without the column): no fee line.
   */
  shipping_fee: number | null;
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
  shippingFee: number,
): Promise<{ orderId?: string; error?: string }> {
  if (!supabase) return { error: 'Supabase is not configured.' };

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return { error: 'You need to sign in to place an order.' };

    const insert = (row: Record<string, unknown>) =>
      supabase!.from('orders').insert(row).select('id').single();

    const row = {
      user_id: userData.user.id,
      email: userData.user.email ?? null,
      total,
      currency: 'PHP',
      items,
      shipping,
      shipping_fee: shippingFee,
    };
    let { data, error } = await insert(row);
    // Narrow carve-out from the no-retry rule above: shipping_fee is display
    // breakdown only (total already includes it), so an order on a DB without
    // the column is still correct and shippable. The address is never dropped.
    if (error && /shipping_fee/.test(error.message)) {
      const { shipping_fee: _omitted, ...withoutFee } = row;
      ({ data, error } = await insert(withoutFee));
    }

    if (error || !data) return { error: error?.message ?? 'Could not place your order.' };
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
    shipping_fee: row.shipping_fee == null ? null : Number(row.shipping_fee),
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

    // Ordered retries: /shipping/ also matches "shipping_fee", so test the fee
    // column first — otherwise a fee-less DB would needlessly drop the address too.
    let { data, error } = await read('id, created_at, status, total, currency, items, shipping, shipping_fee');
    if (error && /shipping_fee/.test(error.message)) {
      ({ data, error } = await read('id, created_at, status, total, currency, items, shipping'));
    }
    if (error && /shipping/.test(error.message)) {
      ({ data, error } = await read('id, created_at, status, total, currency, items'));
    }

    if (error) return { error: error.message };
    return { orders: ((data ?? []) as unknown as Record<string, unknown>[]).map(toOrderRecord) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not load your orders.' };
  }
}
