import { normalizeAddress, type ShippingAddress } from './address';
import { supabase } from './supabase';

/**
 * A customer's reusable default shipping address. One row per user, scoped by RLS.
 * Follows the data-layer conventions: guards `if (!supabase)`; writes return
 * `string | null`; nothing throws.
 *
 * Note this is only ever a *convenience* — the address that matters is the snapshot
 * on the order itself. So a missing table or a failed read must degrade to "no
 * prefill", never to a blocked checkout.
 */

export async function fetchMyProfile(): Promise<{ address?: ShippingAddress; error?: string }> {
  if (!supabase) return {};

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return {};

    const { data, error } = await supabase
      .from('profiles')
      .select('address')
      .eq('user_id', userData.user.id)
      .maybeSingle();

    // No row, no table, or no permission: checkout just doesn't prefill.
    if (error || !data) return {};
    return { address: normalizeAddress(data.address) };
  } catch {
    return {};
  }
}

export async function saveMyProfile(address: ShippingAddress): Promise<string | null> {
  if (!supabase) return 'Supabase is not configured.';

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return 'You need to sign in to save your details.';

    const { error } = await supabase
      .from('profiles')
      .upsert(
        { user_id: userData.user.id, address, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      );

    return error ? error.message : null;
  } catch (e) {
    return e instanceof Error ? e.message : 'Could not save your details.';
  }
}
