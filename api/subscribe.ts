// Vercel Function (the site itself is a static export, so this lives outside app/).
// Adds a subscriber to the Well Run Weekly publication on Beehiiv.
// Needs BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID (Vercel env).
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export async function POST(req: Request): Promise<Response> {
  let email = "";
  try {
    const body = await req.json();
    email = String(body?.email || "").trim().toLowerCase();
  } catch {}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
    return json({ ok: false, error: "Enter a valid email." }, 400);
  }
  const key = process.env.BEEHIIV_API_KEY;
  const pub = process.env.BEEHIIV_PUBLICATION_ID;
  if (!key || !pub) return json({ ok: false, error: "Signup isn't open yet." }, 503);
  const r = await fetch(`https://api.beehiiv.com/v2/publications/${pub}/subscriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      reactivate_existing: false,
      send_welcome_email: true,
      utm_source: "wellrun.so",
      utm_medium: "site",
      referring_site: "https://www.wellrun.so",
    }),
  });
  if (!r.ok) return json({ ok: false, error: "Something went wrong. Try again." }, 502);
  return json({ ok: true });
}
