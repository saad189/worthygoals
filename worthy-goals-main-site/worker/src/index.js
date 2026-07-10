// Adds a waitlist email to a Brevo list. Runs on Cloudflare Workers so the
// Brevo API key stays server-side. Different origin from the site, so CORS is on.
const cors = {
  // ponytail: * is fine — CORS can't secure a public write endpoint (curl bypasses it).
  // Real abuse control is rate-limiting/turnstile, add that if spam shows up.
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);

    let email = '';
    try { email = ((await request.json()).email || '').toString().trim(); } catch {}
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'invalid email' }, 400);

    const r = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'api-key': env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
      // updateEnabled: existing contacts return 204 instead of erroring, so re-signups still succeed.
      body: JSON.stringify({ email, listIds: [Number(env.BREVO_LIST_ID)], updateEnabled: true }),
    });

    if (r.ok) return json({ ok: true }, 200);
    console.error('brevo error', r.status, await r.text());
    return json({ error: 'subscribe failed' }, 502);
  },
};

function json(body, status) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...cors } });
}
