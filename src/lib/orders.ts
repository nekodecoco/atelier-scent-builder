import type { CartItem } from '../store/useCartStore';
import { supabase } from './supabase';

export interface OrderRecord {
  id: string;
  created_at: string;
  status: string;
  total: number;
  currency: string;
  items: CartItem[];
}

export async function placeOrder(
  items: CartItem[],
  total: number,
): Promise<{ orderId?: string; error?: string }> {
  if (!supabase) return { error: 'Supabase is not configured.' };

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return { error: 'You need to sign in to place an order.' };

  let { data, error } = await supabase
    .from('orders')
    .insert({
      user_id: userData.user.id,
      email: userData.user.email ?? null,
      total,
      currency: 'PHP',
      items,
    })
    .select('id')
    .single();

  // the email column arrives with the admin migration — keep checkout working
  // on databases that haven't run it yet
  if (error && /email/.test(error.message)) {
    ({ data, error } = await supabase
      .from('orders')
      .insert({ user_id: userData.user.id, total, currency: 'PHP', items })
      .select('id')
      .single());
  }

  if (error) return { error: error.message };
  return { orderId: data!.id as string };
}

export async function fetchMyOrders(): Promise<{ orders?: OrderRecord[]; error?: string }> {
  if (!supabase) return { error: 'Supabase is not configured.' };

  const { data, error } = await supabase
    .from('orders')
    .select('id, created_at, status, total, currency, items')
    .order('created_at', { ascending: false });

  if (error) return { error: error.message };
  return { orders: (data ?? []) as OrderRecord[] };
}
