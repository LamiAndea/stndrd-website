import type { APIRoute } from 'astro';
import Stripe from 'stripe';

export const prerender = false;

const CANONICAL_ORIGIN = 'https://stndrdhq.com';
const MAX_QUANTITY = 9;

// Per-instance sliding window: 10 checkout attempts per IP per minute.
// Serverless instances don't share this map, so it is a soft limit.
const attempts = new Map<string, number[]>();

const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// Only ever redirect back to an origin we control.
const safeOrigin = (request: Request) => {
  try {
    const origin = new URL(request.url).origin;
    const { hostname } = new URL(origin);
    const allowed =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === 'stndrdhq.com' ||
      hostname === 'www.stndrdhq.com' ||
      hostname.endsWith('.vercel.app');
    return allowed ? origin : CANONICAL_ORIGIN;
  } catch {
    return CANONICAL_ORIGIN;
  }
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let body: { quantity?: unknown };
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'bad_request' });
  }
  if (typeof body !== 'object' || body === null) return json(400, { error: 'bad_request' });

  const quantity = Math.floor(Number(body.quantity));
  if (!Number.isFinite(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    return json(400, { error: 'invalid_quantity' });
  }

  let ip = 'unknown';
  try {
    ip = clientAddress;
  } catch {
    /* clientAddress throws outside a request context on some hosts */
  }
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (recent.length >= 10) return json(429, { error: 'rate_limited' });
  recent.push(now);
  if (attempts.size > 1000) attempts.clear();
  attempts.set(ip, recent);

  const secretKey = import.meta.env.STRIPE_SECRET_KEY;
  const priceId = import.meta.env.STRIPE_PRICE_ID;
  if (!secretKey || !priceId) return json(503, { error: 'not_configured' });

  const origin = safeOrigin(request);
  const stripe = new Stripe(secretKey);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity }],
      // One SKU, physical goods: collect where it ships.
      shipping_address_collection: { allowed_countries: ['US'] },
      phone_number_collection: { enabled: false },
      // The waitlist promises a launch discount; codes are entered here.
      allow_promotion_codes: true,
      success_url: `${origin}/thanks?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop`,
    });

    if (!session.url) return json(502, { error: 'upstream' });
    return json(200, { url: session.url });
  } catch {
    return json(502, { error: 'upstream' });
  }
};
