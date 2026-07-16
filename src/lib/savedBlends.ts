import type { ScentFormula } from '../data/premadeScents';
import { supabase } from './supabase';

/**
 * A customer's saved builder formulas ("favorite blends"). One row per saved
 * blend, scoped to the signed-in user by RLS. Follows the data-layer
 * conventions: guards `if (!supabase)`; writes return `string | null`.
 */

export interface SavedBlend {
  id: string;
  created_at: string;
  name: string;
  formula: ScentFormula;
}

export async function fetchSavedBlends(): Promise<{ blends?: SavedBlend[]; error?: string }> {
  if (!supabase) return { error: 'Supabase is not configured.' };

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return { error: 'You need to sign in to view saved blends.' };

    const { data, error } = await supabase
      .from('saved_blends')
      .select('id, created_at, name, formula')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) return { error: error.message };
    return { blends: (data ?? []) as SavedBlend[] };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not load saved blends.' };
  }
}

export async function saveBlend(name: string, formula: ScentFormula): Promise<string | null> {
  if (!supabase) return 'Supabase is not configured.';

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return 'You need to sign in to save a blend.';

    const { error } = await supabase
      .from('saved_blends')
      .insert({ user_id: userData.user.id, name, formula });

    return error ? error.message : null;
  } catch (e) {
    return e instanceof Error ? e.message : 'Could not save your blend.';
  }
}

export async function deleteSavedBlend(id: string): Promise<string | null> {
  if (!supabase) return 'Supabase is not configured.';

  try {
    const { error } = await supabase.from('saved_blends').delete().eq('id', id);
    return error ? error.message : null;
  } catch (e) {
    return e instanceof Error ? e.message : 'Could not delete your blend.';
  }
}
