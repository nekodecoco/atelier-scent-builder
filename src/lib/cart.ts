import type { CartItem } from '../store/useCartStore';
import { supabase } from './supabase';

/**
 * The signed-in customer's cart, persisted server-side so it follows them
 * across devices. One row per user; guest carts stay in localStorage only.
 *
 * Follows the data-layer conventions: guards `if (!supabase)`, and the write
 * returns `string | null` (an error message or null) instead of throwing.
 */

export async function fetchServerCart(): Promise<CartItem[] | null> {
  if (!supabase) return null;

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    const { data, error } = await supabase
      .from('carts')
      .select('items')
      .eq('user_id', userData.user.id)
      .maybeSingle();

    if (error || !data) return null;
    return (data.items ?? []) as CartItem[];
  } catch {
    // network failure / table missing — fall back to the local cart silently
    return null;
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
