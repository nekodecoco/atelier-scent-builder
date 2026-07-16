import type { CartItem } from '../store/useCartStore';
import { supabase } from './supabase';

/**
 * The signed-in customer's cart, persisted server-side so it follows them
 * across devices. One row per user; guest carts stay in localStorage only.
 *
 * Follows the data-layer conventions: guards `if (!supabase)`, and the write
 * returns `string | null` (an error message or null) instead of throwing.
 */

/**
 * A read either succeeded (and `items` is the truth — an empty array genuinely
 * means "this account has no cart") or it failed. Callers MUST distinguish the
 * two: treating a failed read as an empty cart would overwrite a real cart with
 * nothing.
 */
export type ServerCartResult = { ok: true; items: CartItem[] } | { ok: false };

export async function fetchServerCart(): Promise<ServerCartResult> {
  if (!supabase) return { ok: false };

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return { ok: false };

    const { data, error } = await supabase
      .from('carts')
      .select('items')
      .eq('user_id', userData.user.id)
      .maybeSingle();

    // table missing / RLS / network — unknown, not empty
    if (error) return { ok: false };

    // no row is a real answer: this account simply has no saved cart yet
    return { ok: true, items: (data?.items ?? []) as CartItem[] };
  } catch {
    return { ok: false };
  }
}

export async function saveServerCart(items: CartItem[]): Promise<string | null> {
  if (!supabase) return 'Supabase is not configured.';

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return 'You need to sign in to save your cart.';

    const { error } = await supabase
      .from('carts')
      .upsert({ user_id: userData.user.id, items, updated_at: new Date().toISOString() });

    return error ? error.message : null;
  } catch (e) {
    return e instanceof Error ? e.message : 'Could not save your cart.';
  }
}
