import { useEffect, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { EMPTY_ADDRESS, normalizePhone, validateAddress, type ShippingAddress } from '../../lib/address';
import { fetchMyProfile, saveMyProfile } from '../../lib/profile';
import { AddressFields } from './AddressFields';

/**
 * The customer's default delivery details. Only ever a convenience — checkout
 * prefills from this, but the address that ships is the snapshot on the order.
 */
export function ProfileForm() {
  const [address, setAddress] = useState<ShippingAddress>(EMPTY_ADDRESS);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void fetchMyProfile().then((result) => {
      if (!live) return;
      if (result.address) setAddress(result.address);
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    const found = validateAddress(address);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const clean = { ...address, phone: normalizePhone(address.phone) ?? address.phone };
    setSaving(true);
    setError(null);
    setInfo(null);
    const err = await saveMyProfile(clean);
    setSaving(false);

    if (err) {
      setError(err);
      return;
    }
    setAddress(clean);
    setInfo('Saved.');
  };

  if (loading) {
    return <p className="font-sans text-xs text-stone-dim">Loading your details…</p>;
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="rounded-lg border border-ivory-line bg-white/60 p-5 dark:border-night-line dark:bg-night-soft"
    >
      <p className="mb-5 font-sans text-xs leading-relaxed text-stone">
        We'll use these to prefill your next checkout. Changing them here doesn't affect orders
        you've already placed.
      </p>

      <AddressFields value={address} errors={errors} onChange={setAddress} disabled={saving} />

      {error && (
        <p className="mt-4 font-sans text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
      {info && <p className="mt-4 font-sans text-xs text-gold-deep dark:text-gold">{info}</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-5 flex items-center justify-center gap-2 rounded bg-gold-deep px-5 py-3 font-sans text-[10px] tracking-luxe text-ivory transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-gold dark:text-night"
      >
        {saving && <Loader2 size={13} className="animate-spin" aria-hidden />}
        SAVE DETAILS
      </button>
    </form>
  );
}
