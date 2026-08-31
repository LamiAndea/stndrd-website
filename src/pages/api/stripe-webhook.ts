import type { APIRoute } from 'astro';
import Stripe from 'stripe';

export const prerender = false;

const ORDER_NOTIFY = ['lami.andea@stndrdhq.com', 'obsabada@stndrdhq.com'];
// Until stndrdhq.com is verified in Resend, sending from it fails and the
// handler degrades to logging. Stripe's own receipt still reaches the buyer.
const ORDER_FROM = 'STNDRD <orders@stndrdhq.com>';

// Best-effort idempotency. Serverless instances don't share this, so a
// retry landing on a cold instance can re-notify; duplicate order emails
// are the worst case, never a duplicate charge.
const handled = new Set<string>();

const money = (amount: number | null, currency: string | null) =>
  amount === null ? '—' : `${(amount / 100).toFixed(2)} ${(currency ?? 'usd').toUpperCase()}`;

type Addr = Stripe.Address | null | undefined;

// Current API versions return the shipping address under
// collected_information; older ones use the top-level shipping_details.
// customer_details.address is the last resort.
function shippingFrom(session: Stripe.Checkout.Session) {
  const collected = (session as unknown as {
    collected_information?: { shipping_details?: { address?: Addr; name?: string | null } | null };
  }).collected_information?.shipping_details;
  const legacy = session.shipping_details as { address?: Addr; name?: string | null } | null | undefined;
  return {
    address: collected?.address ?? legacy?.address ?? session.customer_details?.address,
    name: collected?.name ?? legacy?.name ?? session.customer_details?.name ?? null,
  };
}

async function sendOrderEmail(session: Stripe.Checkout.Session) {
  const apiKey = import.meta.env.RESEND_API_KEY;
  if (!apiKey) return;

  const { address: addr, name } = shippingFrom(session);
  const shipTo = addr
    ? [addr.line1, addr.line2, `${addr.city ?? ''} ${addr.state ?? ''} ${addr.postal_code ?? ''}`.trim(), addr.country]
        .filter(Boolean)
        .join('\n')
    : 'No shipping address on session';

  const lines = [
    `Total: ${money(session.amount_total, session.currency)}`,
    `Email: ${session.customer_details?.email ?? '—'}`,
    `Name: ${name ?? '—'}`,
    '',
    'Ship to:',
    shipTo,
    '',
    `Stripe session: ${session.id}`,
  ].join('\n');

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: ORDER_FROM,
        to: ORDER_NOTIFY,
        subject: `New order — ${money(session.amount_total, session.currency)}`,
        text: lines,
      }),
    });
    if (!res.ok) {
      console.error('order email failed', res.status, await res.text());
    }
  } catch (err) {
    console.error('order email threw', err);
  }
}

export const POST: APIRoute = async ({ request }) => {
  const secretKey = import.meta.env.STRIPE_SECRET_KEY;
  const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) return new Response('not configured', { status: 503 });

  const signature = request.headers.get('stripe-signature');
  if (!signature) return new Response('missing signature', { status: 400 });

  const payload = await request.text();
  const stripe = new Stripe(secretKey);

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, webhookSecret);
  } catch {
    // Unverified payloads are rejected outright — never trust the body.
    return new Response('invalid signature', { status: 400 });
  }

  if (handled.has(event.id)) return new Response('ok', { status: 200 });
  handled.add(event.id);
  if (handled.size > 1000) handled.clear();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === 'paid') {
      // Deliberately not awaited into a failure path: a broken email must
      // never make Stripe retry a payment we already recorded.
      await sendOrderEmail(session);
    }
  }

  return new Response('ok', { status: 200 });
};
