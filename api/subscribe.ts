// Vercel Function (the site itself is a static export, so this lives outside app/).
// Adds a subscriber to the Well Run Weekly publication on Beehiiv.
// Needs BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID (Vercel env).
type Req = { method?: string; body?: unknown };
type Res = { status: (n: number) => Res; json: (b: unknown) => void; setHeader: (k: string, v: string) => void };

export default async function handler(req: Req, res: Res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  }
  let body: { email?: unknown } = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : ((req.body as { email?: unknown }) || {});
  } catch {}
  const email = String(body?.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
    return res.status(400).json({ ok: false, error: "Enter a valid email." });
  }
  const key = process.env.BEEHIIV_API_KEY;
  const pub = process.env.BEEHIIV_PUBLICATION_ID;
  if (!key || !pub) return res.status(503).json({ ok: false, error: "Signup isn't open yet." });
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
  if (!r.ok) return res.status(502).json({ ok: false, error: "Something went wrong. Try again." });
  return res.status(200).json({ ok: true });
}
