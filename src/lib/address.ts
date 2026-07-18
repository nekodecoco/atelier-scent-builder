/**
 * The shipping address, shared by `orders.shipping` (the snapshot the order ships
 * to), `profiles.address` (the customer's reusable default), the checkout form, and
 * the notification email. One shape, one validator, one formatter.
 */

export interface ShippingAddress {
  recipient: string;
  /** Stored normalized as +639XXXXXXXXX */
  phone: string;
  /** House/unit number + street */
  line1: string;
  /** Optional — subdivision, building, floor */
  line2: string;
  barangay: string;
  /** City or municipality */
  city: string;
  province: string;
  /** 4 digits */
  postcode: string;
  /** Optional, but Manila couriers lean on it heavily */
  landmark: string;
}

export const EMPTY_ADDRESS: ShippingAddress = {
  recipient: '',
  phone: '',
  line1: '',
  line2: '',
  barangay: '',
  city: '',
  province: '',
  postcode: '',
  landmark: '',
};

/** The two fields a courier can do without. */
const OPTIONAL_FIELDS = new Set<keyof ShippingAddress>(['line2', 'landmark']);

const LABELS: Record<keyof ShippingAddress, string> = {
  recipient: 'Recipient name',
  phone: 'Mobile number',
  line1: 'Street address',
  line2: 'Apartment, suite, subdivision',
  barangay: 'Barangay',
  city: 'City or municipality',
  province: 'Province',
  postcode: 'Postal code',
  landmark: 'Landmark',
};

/**
 * '0917 123 4567', '+63 917 123 4567' and '639171234567' all normalize to
 * '+639171234567'. Returns null when it isn't a PH mobile number.
 */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[\s()\-.]/g, '');
  const match = /^(?:\+?63|0)(9\d{9})$/.exec(digits);
  return match ? `+63${match[1]}` : null;
}

/** field → message. An empty object means valid. */
export function validateAddress(
  address: ShippingAddress,
): Partial<Record<keyof ShippingAddress, string>> {
  const errors: Partial<Record<keyof ShippingAddress, string>> = {};

  for (const key of Object.keys(EMPTY_ADDRESS) as (keyof ShippingAddress)[]) {
    if (OPTIONAL_FIELDS.has(key)) continue;
    if (!address[key].trim()) errors[key] = `${LABELS[key]} is required.`;
  }

  if (address.phone.trim() && !normalizePhone(address.phone)) {
    errors.phone = 'Enter a PH mobile number, like 0917 123 4567.';
  }
  if (address.postcode.trim() && !/^\d{4}$/.test(address.postcode.trim())) {
    errors.postcode = 'A PH postal code is 4 digits.';
  }

  return errors;
}

/** A courier-ready block — used by the admin copy button and both emails. */
export function formatAddressLines(address: ShippingAddress): string[] {
  const street = [address.line1, address.line2].filter(Boolean).join(', ');
  const area = [address.barangay, address.city].filter(Boolean).join(', ');
  const region = [address.province, address.postcode].filter(Boolean).join(' ');

  return [
    address.recipient,
    address.phone,
    street,
    area,
    region,
    address.landmark ? `Landmark: ${address.landmark}` : '',
  ].filter(Boolean);
}

/**
 * Load boundary for any address read back out of jsonb — the counterpart to
 * `normalizeSelected` in selection.ts. Tolerates a missing, partial, or junk
 * value; every field falls back to ''.
 */
export function normalizeAddress(raw: unknown): ShippingAddress {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_ADDRESS };

  const source = raw as Record<string, unknown>;
  const address = { ...EMPTY_ADDRESS };
  for (const key of Object.keys(EMPTY_ADDRESS) as (keyof ShippingAddress)[]) {
    const value = source[key];
    if (typeof value === 'string') address[key] = value;
  }
  return address;
}

/** True when the address holds nothing at all (a profile that was never filled in). */
export function isEmptyAddress(address: ShippingAddress): boolean {
  return Object.values(address).every((value) => !value.trim());
}
