import type { APIRoute } from 'astro';

export const prerender = false;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Per-instance sliding window: 5 attempts per IP per minute. Serverless
// instances don't share this map, so it is a soft limit against bursts,
// not a guarantee.
const attempts = new Map<string, number[]>();

const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let body: { email?: unknown; company?: unknown };
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'bad_request' });
  }
  if (typeof body !== 'object' || body === null) return json(400, { error: 'bad_request' });

  // Honeypot: real visitors never see this field. Claim success, store nothing.
  if (body.company) return json(200, { ok: true });

  const email = String(body.email ?? '').trim().toLowerCase();
  // 254 is the practical upper bound for a deliverable address
  if (email.length > 254 || !emailRegex.test(email)) return json(400, { error: 'invalid_email' });

  let ip = 'unknown';
  try {
    ip = clientAddress;
  } catch {
    /* clientAddress throws outside a request context on some hosts */
  }
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (recent.length >= 5) return json(429, { error: 'rate_limited' });
  recent.push(now);
  // keep the per-instance map from growing without bound
  if (attempts.size > 1000) attempts.clear();
  attempts.set(ip, recent);

  const apiKey = import.meta.env.RESEND_API_KEY;
  const audienceId = import.meta.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audienceId) return json(503, { error: 'not_configured' });

  let res: Response;
  try {
    res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, unsubscribed: false }),
    });
  } catch {
    return json(502, { error: 'upstream' });
  }

  // 409 = already on the list; that is success from the visitor's side.
  if (!res.ok && res.status !== 409) return json(502, { error: 'upstream' });
  return json(200, { ok: true });
};
