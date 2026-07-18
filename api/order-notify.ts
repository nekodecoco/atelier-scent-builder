/**
 * Order notifications — emails the customer a confirmation and the owner an alert.
 *
 * Deliberately a single file, like api/curate.ts: Vercel runs these as ESM and
 * cannot resolve extensionless relative imports, so this must not import from
 * `src/`. It also uses raw fetch rather than the Resend or Supabase SDKs, matching
 * curate.ts's hand-rolled Gemini call — no dependencies to install or keep current.
 *
 * The client POSTs only `{ orderId }`, fire-and-forget. This function re-reads that
 * order with the service-role key and emails what the *database* says — never what
 * the request body says. That is what makes the open endpoint safe: the body carries
 * no recipient, no address and no totals, so the worst a forged call can do is
 * re-send a real order's own notification to its real owner, and `notified_at`
 * makes even that a no-op.
 *
 * Env (all server-side; SUPABASE_SERVICE_ROLE_KEY must never be VITE_-prefixed —
 * that would ship a full RLS bypass in the browser bundle):
 *   RESEND_API_KEY             required
 *   SUPABASE_URL               required
 *   SUPABASE_SERVICE_ROLE_KEY  required
 *   ORDER_FROM_EMAIL           optional, defaults to Resend's test sender
 *   OWNER_EMAIL                optional, defaults to the shop owner
 *
 * NOTE ON DELIVERABILITY: Resend's default sender (onboarding@resend.dev) only
 * delivers to the address that owns the Resend account. Until a real domain is
 * DNS-verified and set as ORDER_FROM_EMAIL, the owner alert arrives but the
 * customer confirmation silently goes nowhere. That is a known, accepted state —
 * not a bug to chase.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'Atelier N°9 <onboarding@resend.dev>';
const DEFAULT_OWNER = 'nikko.alferez@gmail.com';

const peso = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
});

interface Req {
  method?: string;
  body?: unknown;
}

interface Res {
  status: (code: number) => Res;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

interface OrderItem {
  name?: string;
  kind?: string;
  scentId?: string;
  bottleSize?: number;
  concentration?: number;
  solvent?: string;
  qty?: number;
  unitPrice?: number;
  formula?: { selected?: Record<string, string[]> };
}

interface OrderRow {
  id: string;
  created_at: string;
  total: number;
  currency: string;
  email: string | null;
  items: OrderItem[] | null;
  shipping: Record<string, string> | null;
  /** Delivery fee frozen at placement; total already includes it. Absent on old DBs. */
  shipping_fee?: number | null;
  notified_at: string | null;
}

/** Every value below is customer-typed, so nothing reaches the HTML unescaped. */
function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Mirrors formatAddressLines in src/lib/address.ts (can't import across the boundary). */
function addressLines(shipping: Record<string, string> | null): string[] {
  if (!shipping) return [];
  const street = [shipping.line1, shipping.line2].filter(Boolean).join(', ');
  const area = [shipping.barangay, shipping.city].filter(Boolean).join(', ');
  const region = [shipping.province, shipping.postcode].filter(Boolean).join(' ');
  return [
    shipping.recipient,
    shipping.phone,
    street,
    area,
    region,
    shipping.landmark ? `Landmark: ${shipping.landmark}` : '',
  ].filter(Boolean);
}

function itemRows(items: OrderItem[]): string {
  return items
    .map((item) => {
      const meta = `${item.bottleSize ?? '?'} mL · ${item.concentration ?? 15}% oil · ${
        (item.solvent ?? 'alcohol') === 'alcohol' ? 'alcohol' : 'Easyblend'
      } × ${item.qty ?? 1}`;
      const line = (item.unitPrice ?? 0) * (item.qty ?? 1);
      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">
          <strong>${escapeHtml(item.name)}</strong><br>
          <span style="color:#777;font-size:12px">${escapeHtml(meta)}</span>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">
          ${escapeHtml(peso.format(line))}
        </td>
      </tr>`;
    })
    .join('');
}

/** Formula ids, so the owner can mix straight from the email. */
function formulaLine(item: OrderItem): string {
  const selected = item.formula?.selected;
  if (!selected) return '';
  const parts = (['top', 'heart', 'base'] as const)
    .map((note) => {
      const ids = Array.isArray(selected[note]) ? selected[note] : [];
      return ids.length ? `${note}: ${ids.join(' + ')}` : '';
    })
    .filter(Boolean);
  return parts.length ? `<div style="color:#777;font-size:12px">${escapeHtml(parts.join(' · '))}</div>` : '';
}

function shell(inner: string): string {
  return `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
    ${inner}
  </div>`;
}

/**
 * Subtotal + Shipping rows above Total, only when the order snapshotted a fee.
 * Fee null/0/absent renders nothing, keeping old orders' emails unchanged.
 */
function totalRows(order: OrderRow): string {
  const fee = Number(order.shipping_fee);
  const breakdown =
    Number.isFinite(fee) && fee > 0
      ? `<tr>
        <td style="padding:8px 0;color:#777">Subtotal</td>
        <td style="padding:8px 0;text-align:right;color:#777">${escapeHtml(peso.format(order.total - fee))}</td>
      </tr>
      <tr>
        <td style="padding:0 0 8px;color:#777">Shipping</td>
        <td style="padding:0 0 8px;text-align:right;color:#777">${escapeHtml(peso.format(fee))}</td>
      </tr>`
      : '';
  return `${breakdown}
      <tr>
        <td style="padding:12px 0"><strong>Total</strong></td>
        <td style="padding:12px 0;text-align:right"><strong>${escapeHtml(peso.format(order.total))}</strong></td>
      </tr>`;
}

function customerHtml(order: OrderRow): string {
  const lines = addressLines(order.shipping);
  return shell(`
    <h1 style="font-size:22px;font-weight:600">Thank you — we have your order</h1>
    <p style="color:#555;line-height:1.6">
      Reference <strong>${escapeHtml(order.id.slice(0, 8))}</strong>. Here's what you asked us to mix.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0">
      ${itemRows(order.items ?? [])}
      ${totalRows(order)}
    </table>
    ${
      lines.length
        ? `<h2 style="font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:#777">Delivering to</h2>
           <p style="line-height:1.6">${lines.map(escapeHtml).join('<br>')}</p>`
        : ''
    }
    <p style="color:#555;line-height:1.6;border-top:1px solid #eee;padding-top:16px;margin-top:24px">
      Orders are requests — no payment is taken here. We confirm each blend personally and arrange
      payment (GCash or COD) before mixing.
    </p>
  `);
}

function ownerHtml(order: OrderRow): string {
  const lines = addressLines(order.shipping);
  const items = order.items ?? [];
  return shell(`
    <h1 style="font-size:22px;font-weight:600">New order · ${escapeHtml(peso.format(order.total))}</h1>
    <p style="color:#555">
      Ref ${escapeHtml(order.id.slice(0, 8))} · ${escapeHtml(order.email ?? 'no email on file')}${
        Number.isFinite(Number(order.shipping_fee)) && Number(order.shipping_fee) > 0
          ? ` · incl. shipping ${escapeHtml(peso.format(Number(order.shipping_fee)))}`
          : ''
      }
    </p>
    <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:#777">Ship to</h2>
    <p style="line-height:1.6;background:#faf8f4;padding:12px;border-radius:6px">
      ${lines.length ? lines.map(escapeHtml).join('<br>') : '<em>No address on this order.</em>'}
    </p>
    <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:#777">To mix</h2>
    ${items
      .map(
        (item) => `<div style="padding:8px 0;border-bottom:1px solid #eee">
          <strong>${escapeHtml(item.name)}</strong>
          <span style="color:#777;font-size:12px"> · ${escapeHtml(item.bottleSize ?? '?')} mL · ${escapeHtml(
            item.concentration ?? 15,
          )}% · ×${escapeHtml(item.qty ?? 1)}</span>
          ${formulaLine(item)}
        </div>`,
      )
      .join('')}
  `);
}

async function fetchOrder(id: string, url: string, key: string): Promise<OrderRow | null> {
  const read = async (columns: string) =>
    fetch(
      `${url}/rest/v1/orders?id=eq.${encodeURIComponent(id)}&select=${columns}`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
  // shipping_fee is display-only; a DB without the column must keep emailing.
  let response = await read('id,created_at,total,currency,email,items,shipping,shipping_fee,notified_at');
  if (!response.ok) {
    response = await read('id,created_at,total,currency,email,items,shipping,notified_at');
  }
  if (!response.ok) return null;
  const rows = (await response.json()) as OrderRow[];
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

async function markNotified(id: string, url: string, key: string): Promise<void> {
  await fetch(`${url}/rest/v1/orders?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ notified_at: new Date().toISOString() }),
  });
}

async function sendEmail(
  apiKey: string,
  from: string,
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!response.ok) {
    throw new Error(`resend ${response.status}: ${await response.text()}`);
  }
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const body = (req.body ?? {}) as { orderId?: unknown };
  const orderId = typeof body.orderId === 'string' ? body.orderId : '';
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    res.status(400).json({ error: 'invalid_request' });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!apiKey || !supabaseUrl || !serviceKey) {
    res.status(503).json({ error: 'not_configured' });
    return;
  }

  const from = process.env.ORDER_FROM_EMAIL || DEFAULT_FROM;
  const owner = process.env.OWNER_EMAIL || DEFAULT_OWNER;

  try {
    const order = await fetchOrder(orderId, supabaseUrl, serviceKey);
    if (!order) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    if (order.notified_at) {
      res.status(200).json({ ok: true, skipped: true });
      return;
    }

    const ref = order.id.slice(0, 8);
    const city = order.shipping?.city ? ` · ${order.shipping.city}` : '';

    // allSettled, not all: a bouncing customer address must not suppress the
    // owner's alert, which is the one that actually gets the order mixed.
    const results = await Promise.allSettled([
      order.email
        ? sendEmail(
            apiKey,
            from,
            order.email,
            `Your Atelier N°9 order · Ref ${ref}`,
            customerHtml(order),
          )
        : Promise.resolve(),
      sendEmail(
        apiKey,
        from,
        owner,
        `New order · ${peso.format(order.total)}${city} · Ref ${ref}`,
        ownerHtml(order),
      ),
    ]);

    const failures = results.filter((r) => r.status === 'rejected');
    for (const failure of failures) {
      console.error('order-notify send failed:', (failure as PromiseRejectedResult).reason);
    }

    if (failures.length === results.length) {
      res.status(502).json({ error: 'provider_error' });
      return;
    }

    await markNotified(order.id, supabaseUrl, serviceKey);
    res.status(200).json({ ok: true, sent: results.length - failures.length });
  } catch (error) {
    console.error('order-notify failed:', error);
    res.status(502).json({ error: 'provider_error' });
  }
}
