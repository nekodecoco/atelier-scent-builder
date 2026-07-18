import { NOTE_KEYS, type Ingredient, type NoteKey } from '../data/ingredients';
import type { PremadeScent, ScentFormula } from '../data/premadeScents';
import { toOrderRecord, type OrderRecord } from './orders';
import {
  DEFAULT_PRICING,
  DEFAULT_SHIPPING,
  type PremadePriceMap,
  type PricingConfig,
  type ShippingConfig,
} from './pricing';
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

/** Missing row or table → free shipping, same shape as fetchPricing. */
export async function fetchShippingConfig(): Promise<ShippingConfig> {
  if (!supabase) return DEFAULT_SHIPPING;
  const { data, error } = await supabase
    .from('shop_settings')
    .select('value')
    .eq('key', 'shipping')
    .maybeSingle();
  if (error || !data?.value) return DEFAULT_SHIPPING;
  const fee = Number((data.value as { flatFee?: number }).flatFee);
  return Number.isFinite(fee) && fee >= 0 ? { flatFee: fee } : DEFAULT_SHIPPING;
}

export async function upsertShippingConfig(config: ShippingConfig): Promise<string | null> {
  if (!supabase) return 'Supabase is not configured.';
  const { error } = await supabase.from('shop_settings').upsert({
    key: 'shipping',
    value: { flatFee: config.flatFee },
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

export type PremadeImageMap = Record<string, string>;

/** Optional product photo per perfume; missing row/table → generative wash. */
export async function fetchPremadeImages(): Promise<PremadeImageMap> {
  if (!supabase) return {};
  const { data, error } = await supabase.from('premade_images').select('scent_id, url');
  if (error || !data) return {};
  const map: PremadeImageMap = {};
  for (const row of data as { scent_id: string; url: string }[]) {
    if (typeof row.url === 'string' && /^https?:\/\//.test(row.url)) map[row.scent_id] = row.url;
  }
  return map;
}

export async function upsertPremadeImage(scentId: string, url: string): Promise<string | null> {
  if (!supabase) return 'Supabase is not configured.';
  const trimmed = url.trim();
  if (!trimmed) return deletePremadeImage(scentId);
  if (!/^https?:\/\//.test(trimmed)) return 'Image must be an http(s) URL.';
  const { error } = await supabase.from('premade_images').upsert({ scent_id: scentId, url: trimmed });
  return error ? error.message : null;
}

export async function deletePremadeImage(scentId: string): Promise<string | null> {
  if (!supabase) return 'Supabase is not configured.';
  const { error } = await supabase.from('premade_images').delete().eq('scent_id', scentId);
  return error ? error.message : null;
}

/** Public Storage bucket that holds all admin-uploaded imagery. */
const IMAGE_BUCKET = 'product-images';

/**
 * Upload a file to the shared image bucket and return its public URL.
 * Fixed path + upsert overwrites in place (no orphaned objects); a `?t=`
 * cache-buster makes the CDN serve the fresh image after a replace.
 */
export async function uploadImage(
  path: string,
  file: File,
): Promise<{ url?: string; error?: string }> {
  if (!supabase) return { error: 'Supabase is not configured.' };
  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) return { error: error.message };
  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) return { error: 'Could not resolve the uploaded image URL.' };
  return { url: `${data.publicUrl}?t=${Date.now()}` };
}

/** Upload a perfume photo, then point its `premade_images` row at the new URL. */
export async function uploadPremadeImage(scentId: string, file: File): Promise<string | null> {
  const { url, error } = await uploadImage(`premades/${scentId}`, file);
  if (error || !url) return error ?? 'Upload failed.';
  return upsertPremadeImage(scentId, url);
}

export type HeroImageMap = Record<string, string>;

/** Optional full-bleed photo per hero slot; missing row/table → generative slide. */
export async function fetchHeroImages(): Promise<HeroImageMap> {
  if (!supabase) return {};
  const { data, error } = await supabase.from('hero_images').select('slot, url');
  if (error || !data) return {};
  const map: HeroImageMap = {};
  for (const row of data as { slot: string; url: string }[]) {
    if (typeof row.url === 'string' && /^https?:\/\//.test(row.url)) map[row.slot] = row.url;
  }
  return map;
}

export async function upsertHeroImage(slot: string, url: string): Promise<string | null> {
  if (!supabase) return 'Supabase is not configured.';
  const trimmed = url.trim();
  if (!trimmed) return deleteHeroImage(slot);
  if (!/^https?:\/\//.test(trimmed)) return 'Image must be an http(s) URL.';
  const { error } = await supabase.from('hero_images').upsert({ slot, url: trimmed });
  return error ? error.message : null;
}

/** Upload a hero photo, then point its `hero_images` row at the new URL. */
export async function uploadHeroImage(slot: string, file: File): Promise<string | null> {
  const { url, error } = await uploadImage(`hero/${slot}`, file);
  if (error || !url) return error ?? 'Upload failed.';
  return upsertHeroImage(slot, url);
}

export async function deleteHeroImage(slot: string): Promise<string | null> {
  if (!supabase) return 'Supabase is not configured.';
  const { error } = await supabase.from('hero_images').delete().eq('slot', slot);
  return error ? error.message : null;
}

export async function fetchAllOrders(): Promise<{ orders?: AdminOrderRecord[]; error?: string }> {
  if (!supabase) return { error: 'Supabase is not configured.' };
  // Schema-tolerant like fetchMyOrders: the address is worth showing, but not at
  // the cost of the whole order queue on a database that hasn't run the SQL yet.
  const read = (columns: string) =>
    supabase!.from('orders').select(columns).order('created_at', { ascending: false });

  // Ordered retries: /shipping/ also matches "shipping_fee", so test the fee
  // column first — otherwise a fee-less DB would needlessly drop the address too.
  let { data, error } = await read('id, created_at, status, total, currency, items, email, shipping, shipping_fee');
  if (error && /shipping_fee/.test(error.message)) {
    ({ data, error } = await read('id, created_at, status, total, currency, items, email, shipping'));
  }
  if (error && /shipping/.test(error.message)) {
    ({ data, error } = await read('id, created_at, status, total, currency, items, email'));
  }
  if (error) return { error: error.message };
  return {
    orders: ((data ?? []) as unknown as Record<string, unknown>[]).map((row) => ({
      ...toOrderRecord(row),
      email: (row.email ?? null) as string | null,
    })),
  };
}

export async function updateOrderStatus(orderId: string, status: string): Promise<string | null> {
  if (!supabase) return 'Supabase is not configured.';
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
  return error ? error.message : null;
}
