// Static JSON for one company's card, fetched when a row on the board is opened.
import { getCompanies, getCompany } from "@/lib/data";

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getCompanies()).map((c) => ({ slug: c.slug }));
}

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const hit = await getCompany(slug);
  if (!hit) return new Response("Not found", { status: 404 });
  return Response.json(hit.company);
}
