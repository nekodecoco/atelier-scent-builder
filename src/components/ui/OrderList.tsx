import { useEffect, useState } from 'react';
import { Loader2, PackageOpen } from 'lucide-react';
import { fetchMyOrders, type OrderRecord } from '../../lib/orders';
import { formatPeso } from '../../lib/pricing';

const dateFormat = new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' });

const STATUS_STYLES: Record<string, string> = {
  pending: 'border-gold-deep/50 text-gold-deep dark:border-gold/50 dark:text-gold',
  mixing: 'border-blue-400/50 text-blue-500 dark:text-blue-300',
  shipped: 'border-emerald-500/50 text-emerald-600 dark:text-emerald-300',
  delivered: 'border-emerald-500/50 text-emerald-600 dark:text-emerald-300',
  cancelled: 'border-red-400/50 text-red-400',
};

export function OrderList() {
  const [orders, setOrders] = useState<OrderRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyOrders().then((result) => {
      if (result.error) setError(result.error);
      else setOrders(result.orders ?? []);
    });
  }, []);

  if (error) {
    return (
      <p className="font-sans text-xs text-red-400" role="alert">
        Couldn't load your orders: {error}
      </p>
    );
  }

  if (orders === null) {
    return (
      <div className="flex items-center gap-2 font-sans text-xs text-stone-dim">
        <Loader2 size={14} className="animate-spin" aria-hidden />
        Loading your orders…
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-ivory-line p-8 text-center dark:border-night-line">
        <PackageOpen size={22} className="mx-auto text-stone-dim" aria-hidden />
        <p className="mt-3 font-display text-xl italic text-stone">No orders yet</p>
        <p className="mt-1 font-sans text-xs text-stone-dim">
          Your placed orders will appear here.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {orders.map((order) => (
        <li
          key={order.id}
          className="rounded-lg border border-ivory-line bg-white/60 p-5 dark:border-night-line dark:bg-night-soft"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-sans text-[10px] uppercase tracking-luxe text-stone-dim">
              {dateFormat.format(new Date(order.created_at))} · Ref {order.id.slice(0, 8)}
            </div>
            <span
              className={`rounded-full border px-2.5 py-0.5 font-sans text-[9px] uppercase tracking-luxe ${
                STATUS_STYLES[order.status] ?? STATUS_STYLES.pending
              }`}
            >
              {order.status}
            </span>
          </div>

          <ul className="mt-3 flex flex-col gap-1.5">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex items-baseline justify-between gap-3 font-sans text-xs text-stone"
              >
                <span>
                  <em className="font-display text-sm text-neutral-800 dark:text-cream">
                    {item.name}
                  </em>{' '}
                  · {item.bottleSize} mL · {item.concentration ?? 15}% oil × {item.qty}
                </span>
                <span>{formatPeso(item.unitPrice * item.qty)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex items-baseline justify-between border-t border-ivory-line/70 pt-3 dark:border-night-line">
            <span className="font-sans text-[10px] uppercase tracking-luxe text-stone-dim">Total</span>
            <span className="font-display text-xl text-neutral-900 dark:text-cream">
              {formatPeso(order.total)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
