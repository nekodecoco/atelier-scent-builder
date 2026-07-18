import type { ShippingAddress } from '../../lib/address';

/**
 * The shipping address inputs, shared by /checkout and the account profile.
 * Styling matches AuthForm — the same label and input treatment.
 */

const inputClass =
  'mt-1.5 w-full rounded border border-ivory-line bg-white/70 px-3.5 py-2.5 font-sans text-sm tracking-normal text-neutral-900 outline-none placeholder:text-stone/50 focus:border-gold-deep dark:border-night-line dark:bg-night-card dark:text-cream dark:focus:border-gold';

const labelClass = 'font-sans text-[10px] uppercase tracking-luxe text-stone-dim';

interface FieldProps {
  name: keyof ShippingAddress;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: 'text' | 'tel' | 'numeric';
  disabled?: boolean;
}

function Field({
  name,
  label,
  value,
  error,
  onChange,
  placeholder,
  autoComplete,
  inputMode,
  disabled,
}: FieldProps) {
  const errorId = `${name}-error`;
  return (
    <label className={labelClass}>
      {label}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`${inputClass} ${error ? 'border-red-400 dark:border-red-400' : ''}`}
      />
      {error && (
        // normal-case: this <p> sits inside the label, which is uppercase
        <p
          id={errorId}
          className="mt-1 font-sans text-xs normal-case tracking-normal text-red-400"
          role="alert"
        >
          {error}
        </p>
      )}
    </label>
  );
}

interface AddressFieldsProps {
  value: ShippingAddress;
  errors: Partial<Record<keyof ShippingAddress, string>>;
  onChange: (next: ShippingAddress) => void;
  disabled?: boolean;
}

export function AddressFields({ value, errors, onChange, disabled }: AddressFieldsProps) {
  const set = (key: keyof ShippingAddress) => (next: string) =>
    onChange({ ...value, [key]: next });

  const shared = (key: keyof ShippingAddress) => ({
    name: key,
    value: value[key],
    error: errors[key],
    onChange: set(key),
    disabled,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          {...shared('recipient')}
          label="Recipient name"
          autoComplete="name"
          placeholder="Who receives it"
        />
        <Field
          {...shared('phone')}
          label="Mobile number"
          autoComplete="tel"
          inputMode="tel"
          placeholder="0917 123 4567"
        />
      </div>

      <Field
        {...shared('line1')}
        label="Street address"
        autoComplete="address-line1"
        placeholder="House / unit number and street"
      />
      <Field
        {...shared('line2')}
        label="Apartment, suite, subdivision (optional)"
        autoComplete="address-line2"
        placeholder="Building, floor, subdivision"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field {...shared('barangay')} label="Barangay" autoComplete="address-level3" />
        <Field
          {...shared('city')}
          label="City or municipality"
          autoComplete="address-level2"
          placeholder="Makati"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          {...shared('province')}
          label="Province"
          autoComplete="address-level1"
          placeholder="Metro Manila"
        />
        <Field
          {...shared('postcode')}
          label="Postal code"
          autoComplete="postal-code"
          inputMode="numeric"
          placeholder="1210"
        />
      </div>

      <Field
        {...shared('landmark')}
        label="Landmark (optional)"
        placeholder="Helps couriers find you"
      />
    </div>
  );
}
