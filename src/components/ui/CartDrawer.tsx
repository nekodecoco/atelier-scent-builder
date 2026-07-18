import { useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { NOTE_KEYS } from '../../data/ingredients';
import { noteColor } from '../../lib/color';
import { normalizeSelected } from '../../lib/selection';
import { formatPeso } from '../../lib/pricing';
import { isSupabaseConfigured } from '../../lib/supabase';
import { cartSubtotal, useCartStore, type CartItem } from '../../store/useCartStore';
import { SupabaseSetupNotice } from './SupabaseSetupNotice';

function FormulaDots({ item }: { item: CartItem }) {
  const selected = normalizeSelected(item.formula.selected);
  return (
    <span className="flex gap-1" aria-hidden>
      {NOTE_KEYS.map((note) => (
        <span
          key={note}
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: noteColor(note, selected[note]) }}
        />
      ))}
    </span>
  );
}

function CartLine({ item }: { item: CartItem }) {
  const changeQty = useCartStore((s) => s.changeQty);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <li className="flex gap-4 border-b border-ivory-line/70 py-4 dark:border-night-line">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <FormulaDots item={item} />
          <span className="font-display text-lg italic text-neutral-900 dark:text-cream">
            {item.name}
          </span>
        </div>
        <div className="mt-1 font-sans text-[10px] uppercase tracking-wider text-stone-dim">
          {item.kind === 'custom' ? 'Custom blend' : 'House blend'} · {item.bottleSize} mL ·{' '}
          {item.concentration ?? 15}% oil · {formatPeso(item.unitPrice)} each
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => changeQty(item.id, -1)}
            aria-label={`Decrease quantity of ${item.name}`}
            className="rounded border border-ivory-line p-1 text-stone hover:border-stone dark:border-night-line"
          >
            <Minus size={11} aria-hidden />
          </button>
          <span className="min-w-[2ch] text-center font-sans text-xs text-neutral-900 dark:text-cream">
            {item.qty}
          </span>
          <button
            type="button"
            onClick={() => changeQty(item.id, 1)}
            aria-label={`Increase quantity of ${item.name}`}
            className="rounded border border-ivory-line p-1 text-stone hover:border-stone dark:border-night-line"
          >
            <Plus size={11} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => removeItem(item.id)}
            aria-label={`Remove ${item.name} from cart`}
            className="ml-2 p-1 text-stone-dim transition-colors hover:text-red-400"
          >
            <Trash2 size={13} aria-hidden />
          </button>
        </div>
      </div>
      <div className="font-display text-lg text-neutral-900 dark:text-cream">
        {formatPeso(item.unitPrice * item.qty)}
      </div>
    </li>
  );
}

export function CartDrawer() {
  const items = useCartStore((s) => s.items);
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const navigate = useNavigate();

  const subtotal = cartSubtotal(items);

  const goToCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <div aria-hidden={!isOpen} className={isOpen ? '' : 'pointer-events-none'}>
      <div
        onClick={closeCart}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <aside
        role="dialog"
        aria-label="Shopping cart"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-ivory shadow-2xl transition-transform duration-300 dark:bg-night ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-ivory-line px-6 py-5 dark:border-night-line">
          <h2 className="font-display text-2xl text-neutral-900 dark:text-cream">Your cart</h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="rounded-full border border-ivory-line p-2 text-stone transition-colors hover:text-neutral-900 dark:border-night-line dark:hover:text-cream"
          >
            <X size={14} aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {items.length === 0 ? (
            <div className="mt-16 text-center">
              <ShoppingBag size={22} className="mx-auto text-stone-dim" aria-hidden />
              <p className="mt-3 font-display text-xl italic text-stone">Your cart is empty</p>
              <p className="mt-1 font-sans text-xs text-stone-dim">
                Compose a blend or pick from the collection.
              </p>
            </div>
          ) : (
            <ul>
              {items.map((item) => (
                <CartLine key={item.id} item={item} />
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-ivory-line px-6 py-5 dark:border-night-line">
            <div className="flex items-baseline justify-between">
              <span className="font-sans text-[10px] uppercase tracking-luxe text-stone-dim">
                Subtotal
              </span>
              <span className="font-display text-2xl text-neutral-900 dark:text-cream">
                {formatPeso(subtotal)}
              </span>
            </div>

            {!isSupabaseConfigured ? (
              <div className="mt-4">
                <SupabaseSetupNotice />
              </div>
            ) : (
              <button
                type="button"
                onClick={goToCheckout}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded bg-gold-deep px-4 py-3.5 font-sans text-[10px] tracking-luxe text-ivory transition-opacity hover:opacity-90 dark:bg-gold dark:text-night"
              >
                {`CHECKOUT · ${formatPeso(subtotal)}`}
              </button>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
