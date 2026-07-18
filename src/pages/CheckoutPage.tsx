import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, ShoppingBag } from 'lucide-react';
import { AddressFields } from '../components/ui/AddressFields';
import { AuthForm } from '../components/ui/AuthForm';
import { SupabaseSetupNotice } from '../components/ui/SupabaseSetupNotice';
import { EMPTY_ADDRESS, normalizePhone, validateAddress, type ShippingAddress } from '../lib/address';
import { placeOrder } from '../lib/orders';
import { formatPeso } from '../lib/pricing';
import { fetchMyProfile, saveMyProfile } from '../lib/profile';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useCatalogStore } from '../store/useCatalogStore';
import { cartSubtotal, useCartStore } from '../store/useCartStore';

export function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const navigate = useNavigate();

  const [address, setAddress] = useState<ShippingAddress>(EMPTY_ADDRESS);
  const [saveDefault, setSaveDefault] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({});
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedId, setPlacedId] = useState<string | null>(null);

  const subtotal = cartSubtotal(items);

  // Prefill from the saved profile. Best-effort: fetchMyProfile swallows a missing
  // table so a shop without the profiles SQL just starts from a blank form.
  useEffect(() => {
    if (!user) return;
    let live = true;
    void fetchMyProfile().then((result) => {
      if (live && result.address) setAddress(result.address);
    });
    return () => {
      live = false;
    };
  }, [user?.id]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    const found = validateAddress(address);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const clean = { ...address, phone: normalizePhone(address.phone) ?? address.phone };

    setPlacing(true);
    setError(null);
    const result = await placeOrder(items, subtotal, clean);
    setPlacing(false);

    if (result.error) {
      setError(result.error);
      // The stock trigger rejects with customer-facing copy — refresh the catalog so
      // the collection stops offering whatever just ran out.
      if (/out of stock/i.test(result.error)) void useCatalogStore.getState().load();
      return;
    }

    // The order is committed. Everything below is best-effort and deliberately not
    // awaited: a failed profile save or a failed email must never lose an order.
    setPlacedId(result.orderId ?? '');
    clear();
    if (saveDefault) void saveMyProfile(clean);
    void fetch('/api/order-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: result.orderId }),
    }).catch(() => {});
  };

  const body = () => {
    if (!isSupabaseConfigured) {
      return (
        <div className="max-w-md">
          <SupabaseSetupNotice />
        </div>
      );
    }

    if (loading) {
      return <p className="font-sans text-xs text-stone-dim">Checking your session…</p>;
    }

    if (placedId !== null) {
      return (
        <div className="max-w-md rounded-lg border border-gold-deep/40 p-6 text-center dark:border-gold/40">
          <Check size={22} className="mx-auto text-gold-deep dark:text-gold" aria-hidden />
          <h2 className="mt-3 font-display text-2xl text-neutral-900 dark:text-cream">
            Order received
          </h2>
          <p className="mt-2 font-sans text-xs leading-relaxed text-stone">
            Reference{' '}
            <span className="text-neutral-800 dark:text-cream">{placedId.slice(0, 8)}</span>. We'll
            reach out to arrange payment and delivery. You can track it anytime in your account.
          </p>
          <button
            type="button"
            onClick={() => navigate('/account')}
            className="mt-5 rounded border border-gold-deep px-5 py-2.5 font-sans text-[10px] tracking-luxe text-gold-deep hover:bg-gold-deep hover:text-ivory dark:border-gold dark:text-gold dark:hover:bg-gold dark:hover:text-night"
          >
            VIEW MY ORDERS
          </button>
        </div>
      );
    }

    if (!user) {
      return (
        <>
          <p className="mb-8 max-w-md font-sans text-sm leading-relaxed text-stone">
            Sign in to place your order — it keeps your blends and delivery details together.
          </p>
          <AuthForm />
        </>
      );
    }

    if (items.length === 0) {
      return (
        <div className="max-w-md text-center">
          <ShoppingBag size={22} className="mx-auto text-stone-dim" aria-hidden />
          <p className="mt-3 font-display text-xl italic text-stone">Your cart is empty</p>
          <button
            type="button"
            onClick={() => navigate('/collection')}
            className="mt-5 rounded border border-gold-deep px-5 py-2.5 font-sans text-[10px] tracking-luxe text-gold-deep hover:bg-gold-deep hover:text-ivory dark:border-gold dark:text-gold dark:hover:bg-gold dark:hover:text-night"
          >
            BROWSE THE COLLECTION
          </button>
        </div>
      );
    }

    return (
      <div className="grid gap-10 lg:grid-cols-[3fr_2fr]">
        <form onSubmit={submit} noValidate>
          <h2 className="mb-5 font-display text-2xl text-neutral-900 dark:text-cream">
            Where should we deliver?
          </h2>

          <AddressFields
            value={address}
            errors={errors}
            onChange={setAddress}
            disabled={placing}
          />

          <label className="mt-5 flex items-center gap-2.5 font-sans text-xs text-stone">
            <input
              type="checkbox"
              checked={saveDefault}
              onChange={(e) => setSaveDefault(e.target.checked)}
              disabled={placing}
              className="h-3.5 w-3.5 accent-gold-deep"
            />
            Save these details for next time
          </label>

          {error && (
            <p className="mt-4 font-sans text-xs text-red-400" role="alert">
              {error}
            </p>
          )}

          <p className="mt-5 font-sans text-[10px] leading-relaxed text-stone-dim">
            Orders are requests — no payment is taken here. We confirm each blend personally and
            arrange payment (GCash or COD) before mixing.
          </p>

          <button
            type="submit"
            disabled={placing}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded bg-gold-deep px-4 py-3.5 font-sans text-[10px] tracking-luxe text-ivory transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-gold dark:text-night"
          >
            {placing && <Loader2 size={13} className="animate-spin" aria-hidden />}
            {placing ? 'PLACING ORDER…' : `PLACE ORDER · ${formatPeso(subtotal)}`}
          </button>
        </form>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="mb-5 font-display text-2xl text-neutral-900 dark:text-cream">
            Your order
          </h2>
          <ul className="rounded-lg border border-ivory-line bg-white/60 px-5 dark:border-night-line dark:bg-night-soft">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-baseline justify-between gap-4 border-b border-ivory-line/70 py-4 last:border-0 dark:border-night-line"
              >
                <div>
                  <div className="font-display text-lg italic text-neutral-900 dark:text-cream">
                    {item.name}
                  </div>
                  <div className="mt-1 font-sans text-[10px] uppercase tracking-wider text-stone-dim">
                    {item.bottleSize} mL · {item.concentration ?? 15}% oil · ×{item.qty}
                  </div>
                </div>
                <div className="font-display text-lg text-neutral-900 dark:text-cream">
                  {formatPeso(item.unitPrice * item.qty)}
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-baseline justify-between px-5">
            <span className="font-sans text-[10px] uppercase tracking-luxe text-stone-dim">
              Total
            </span>
            <span className="font-display text-2xl text-neutral-900 dark:text-cream">
              {formatPeso(subtotal)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="mx-auto max-w-6xl px-5 pb-24 pt-32">
      <p className="font-sans text-[10px] font-medium tracking-[0.2em] text-muted">YOUR ATELIER</p>
      <h1 className="mt-2 font-grotesk text-4xl font-extrabold uppercase tracking-tightest text-ink sm:text-5xl">
        Checkout
      </h1>

      <div className="mt-12">{body()}</div>
    </section>
  );
}
