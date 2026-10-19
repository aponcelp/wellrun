import { NextResponse } from "next/server";

// Adds a subscriber to the Well Run Weekly publication on Beehiiv.
// Needs BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID (Vercel env).
export async function POST(req: Request) {
  let email = "";
  try {
    const body = await req.json();
    email = String(body?.email || "").trim().toLowerCase();
  } catch {}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
    return NextResponse.json({ ok: false, error: "Enter a valid email." }, { status: 400 });
  }
  const key = process.env.BEEHIIV_API_KEY;
  const pub = process.env.BEEHIIV_PUBLICATION_ID;
  if (!key || !pub) return NextResponse.json({ ok: false, error: "Signup isn't open yet." }, { status: 503 });
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
  if (!r.ok) return NextResponse.json({ ok: false, error: "Something went wrong. Try again." }, { status: 502 });
  return NextResponse.json({ ok: true });
}
