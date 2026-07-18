import { useEffect, useState } from 'react';
import { Check, Copy, Loader2, PackageOpen } from 'lucide-react';
import { formatAddressLines } from '../../../lib/address';
import {
  fetchAllOrders,
  ORDER_STATUSES,
  updateOrderStatus,
  type AdminOrderRecord,
} from '../../../lib/catalog';
import { orderItemCost } from '../../../lib/costing';
import { formatPeso } from '../../../lib/pricing';

const dateFormat = new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' });

export function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrderRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchAllOrders().then((result) => {
      if (result.error) setError(result.error);
      else setOrders(result.orders ?? []);
    });
  }, []);

  const changeStatus = async (orderId: string, status: string) => {
    setOrders((prev) =>
      prev ? prev.map((o) => (o.id === orderId ? { ...o, status } : o)) : prev,
    );
    const err = await updateOrderStatus(orderId, status);
    if (err) setError(err);
  };

  const copyAddress = async (order: AdminOrderRecord) => {
    if (!order.shipping) return;
    try {
      await navigator.clipboard.writeText(formatAddressLines(order.shipping).join('\n'));
      setCopiedId(order.id);
      setTimeout(() => setCopiedId((id) => (id === order.id ? null : id)), 1500);
    } catch {
      setError('Could not copy — select the address text manually.');
    }
  };

  if (error) {
    return (
      <p className="font-sans text-xs text-red-400" role="alert">
        Couldn't load orders: {error}
      </p>
    );
  }

  if (orders === null) {
    return (
      <div className="flex items-center gap-2 font-sans text-xs text-stone-dim">
        <Loader2 size={14} className="animate-spin" aria-hidden />
        Loading all orders…
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-ivory-line p-8 text-center dark:border-night-line">
        <PackageOpen size={22} className="mx-auto text-stone-dim" aria-hidden />
        <p className="mt-3 font-display text-xl italic text-stone">No orders yet</p>
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-display text-lg text-neutral-900 dark:text-cream">
                {order.email ?? 'Unknown customer'}
              </div>
              <div className="font-sans text-[10px] uppercase tracking-luxe text-stone-dim">
                {dateFormat.format(new Date(order.created_at))} · Ref {order.id.slice(0, 8)}
                {order.shipping?.phone ? ` · ${order.shipping.phone}` : ''}
              </div>
            </div>
            <label className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-luxe text-stone-dim">
              Status
              <select
                value={order.status}
                onChange={(e) => changeStatus(order.id, e.target.value)}
                className="rounded border border-ivory-line bg-white/70 px-2.5 py-1.5 font-sans text-xs tracking-normal text-neutral-900 outline-none focus:border-gold-deep dark:border-night-line dark:bg-night-card dark:text-cream dark:focus:border-gold"
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {order.shipping ? (
            <div className="mt-3 rounded border border-ivory-line/70 bg-white/40 p-3 dark:border-night-line dark:bg-night-card">
              <div className="flex items-start justify-between gap-3">
                <address className="font-sans text-xs not-italic leading-relaxed text-stone">
                  {formatAddressLines(order.shipping).map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </address>
                <button
                  type="button"
                  onClick={() => copyAddress(order)}
                  aria-label={`Copy the shipping address for order ${order.id.slice(0, 8)}`}
                  className="flex flex-shrink-0 items-center gap-1.5 rounded border border-ivory-line px-2.5 py-1.5 font-sans text-[10px] tracking-luxe text-stone transition-colors hover:border-gold-deep hover:text-gold-deep dark:border-night-line dark:hover:border-gold dark:hover:text-gold"
                >
                  {copiedId === order.id ? (
                    <Check size={11} aria-hidden />
                  ) : (
                    <Copy size={11} aria-hidden />
                  )}
                  {copiedId === order.id ? 'COPIED' : 'COPY'}
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-3 font-sans text-xs text-red-400" role="alert">
              No shipping address on this order — contact {order.email ?? 'the customer'}.
            </p>
          )}

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
                  · {item.bottleSize} mL · {item.concentration ?? 15}% oil ·{' '}
                  {(item.solvent ?? 'alcohol') === 'alcohol' ? 'alcohol' : 'Easyblend'} × {item.qty}
                </span>
                <span>{formatPeso(item.unitPrice * item.qty)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 border-t border-ivory-line/70 pt-3 dark:border-night-line">
            {(() => {
              const estCost = order.items.reduce((sum, item) => sum + orderItemCost(item), 0);
              // The fee is passed through to the courier, not blend margin.
              const profit = order.total - estCost - (order.shipping_fee ?? 0);
              return (
                <span className="font-sans text-[10px] uppercase tracking-luxe text-stone-dim">
                  Est. cost {formatPeso(Math.round(estCost))} ·{' '}
                  <span className={profit >= 0 ? 'text-gold-deep dark:text-gold' : 'text-red-400'}>
                    profit {formatPeso(Math.round(profit))}
                  </span>
                </span>
              );
            })()}
            <span className="text-right">
              <span className="flex items-baseline justify-end gap-2">
                <span className="font-sans text-[10px] uppercase tracking-luxe text-stone-dim">Total</span>
                <span className="font-display text-xl text-neutral-900 dark:text-cream">
                  {formatPeso(order.total)}
                </span>
              </span>
              {order.shipping_fee != null && order.shipping_fee > 0 && (
                <span className="block font-sans text-[10px] uppercase tracking-luxe text-stone-dim">
                  incl. shipping {formatPeso(order.shipping_fee)}
                </span>
              )}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
