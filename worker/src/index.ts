/**
 * Cloudflare Worker — form handler for A Resonant Life
 *
 * Routes:
 *   POST /api/subscribe   { email }              → forward to Substack
 *   POST /api/contact     { name, email, message } → email Mike via Resend
 *
 * Deployed as a Pages Function or standalone Worker bound to /api/* on
 * the apex/www domain. See README for setup.
 *
 * Env bindings (set as Cloudflare secrets — see wrangler.toml):
 *   SUBSTACK_PUBLICATION  e.g. "resonantlife"  (the part before .substack.com)
 *   RESEND_API_KEY        Resend.com API key for contact form delivery
 *   CONTACT_TO_EMAIL      where to send contact form submissions
 *   CONTACT_FROM_EMAIL    must be on a verified Resend domain
 *   ALLOWED_ORIGIN        e.g. "https://www.resonantlife.net" (and preview)
 */

export interface Env {
  SUBSTACK_PUBLICATION: string;
  RESEND_API_KEY: string;
  CONTACT_TO_EMAIL: string;
  CONTACT_FROM_EMAIL: string;
  ALLOWED_ORIGIN: string;
}

const json = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

const corsHeaders = (origin: string) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
});

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254;
}

function pickAllowedOrigin(req: Request, env: Env): string {
  const requestOrigin = req.headers.get('Origin') || '';
  const list = (env.ALLOWED_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (list.includes(requestOrigin)) return requestOrigin;
  // Fallback to first configured origin (so CORS still gets a sensible value)
  return list[0] || '*';
}

async function handleSubscribe(req: Request, env: Env): Promise<Response> {
  const origin = pickAllowedOrigin(req, env);
  const cors = corsHeaders(origin);

  let body: { email?: string };
  try {
    body = (await req.json()) as { email?: string };
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400, headers: cors });
  }
  const email = (body.email || '').trim();
  if (!isValidEmail(email)) {
    return json({ error: 'Invalid email address' }, { status: 400, headers: cors });
  }

  const pub = env.SUBSTACK_PUBLICATION;
  if (!pub) {
    return json({ error: 'Newsletter not configured' }, { status: 500, headers: cors });
  }

  // Substack's public subscribe endpoint. This is the same call the embedded
  // signup widget makes from a publication site. It's unofficial but stable —
  // if Substack ever changes it, we update here, not on every page.
  const substackUrl = `https://${pub}.substack.com/api/v1/free?nojs=true`;

  try {
    const res = await fetch(substackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({ email, first_url: 'https://www.resonantlife.net' }).toString(),
    });
    if (!res.ok) {
      // Substack returns 4xx with a body for validation errors
      const text = await res.text();
      console.error('Substack signup failed', res.status, text);
      return json(
        { error: 'Subscription provider rejected the request. Please try again.' },
        { status: 502, headers: cors }
      );
    }
    return json({ ok: true }, { headers: cors });
  } catch (err) {
    console.error('Substack request error', err);
    return json({ error: 'Network error contacting newsletter provider.' }, { status: 502, headers: cors });
  }
}

async function handleContact(req: Request, env: Env): Promise<Response> {
  const origin = pickAllowedOrigin(req, env);
  const cors = corsHeaders(origin);

  let body: { name?: string; email?: string; message?: string; website?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400, headers: cors });
  }

  const name = (body.name || '').trim();
  const email = (body.email || '').trim();
  const message = (body.message || '').trim();
  const honeypot = (body.website || '').trim();

  // Bots almost always fill the honeypot. Drop silently with a fake success.
  if (honeypot) {
    return json({ ok: true }, { headers: cors });
  }
  if (!name || !email || !message) {
    return json({ error: 'All fields are required.' }, { status: 400, headers: cors });
  }
  if (!isValidEmail(email)) {
    return json({ error: 'Invalid email address.' }, { status: 400, headers: cors });
  }
  if (message.length > 5000) {
    return json({ error: 'Message too long.' }, { status: 400, headers: cors });
  }

  const apiKey = env.RESEND_API_KEY;
  const to = env.CONTACT_TO_EMAIL;
  const from = env.CONTACT_FROM_EMAIL;
  if (!apiKey || !to || !from) {
    return json({ error: 'Contact endpoint not configured.' }, { status: 500, headers: cors });
  }

  // Plain-text body, very simple — Mike just needs to receive it.
  const subject = `[resonantlife.net] ${name}`;
  const text = `From: ${name} <${email}>\n\n${message}`;
  const html = `
    <p><strong>From:</strong> ${escapeHtml(name)} &lt;<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>&gt;</p>
    <pre style="white-space: pre-wrap; font-family: ui-sans-serif, system-ui;">${escapeHtml(message)}</pre>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject,
        text,
        html,
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.error('Resend send failed', res.status, errBody);
      return json({ error: 'Could not send your message. Please try again.' }, { status: 502, headers: cors });
    }
    return json({ ok: true }, { headers: cors });
  } catch (err) {
    console.error('Resend request error', err);
    return json({ error: 'Network error sending your message.' }, { status: 502, headers: cors });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = pickAllowedOrigin(request, env);
    const cors = corsHeaders(origin);

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, { status: 405, headers: cors });
    }

    if (url.pathname === '/api/subscribe') return handleSubscribe(request, env);
    if (url.pathname === '/api/contact') return handleContact(request, env);

    return json({ error: 'Not found' }, { status: 404, headers: cors });
  },
};
