// The single data loader. Today it reads the JSON snapshots at build time;
// switching to Supabase means changing only this file (keep the function signatures).
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import raw from "@/data/companies.json";
import ogRaw from "@/data/og.json";
import type { Card, Company, Enrichment, OgImage, Runner } from "./types";
import { hostOf, paceSorted, slugify, zoneOf } from "./rank";

const ALL: Company[] = (Array.isArray(raw) ? raw : (raw as { companies: Company[] }).companies) as Company[];
const OG = ogRaw as Record<string, OgImage>;

let ranked: Company[] | null = null;

/** Every company, in the board's default Pace order (rank 1 first). */
export async function getCompanies(): Promise<Company[]> {
  if (!ranked) ranked = paceSorted(ALL);
  return ranked;
}

/** Every company in dataset order (the order the original site's track pooled them in). */
export async function getCompaniesInDataOrder(): Promise<Company[]> {
  return ALL;
}

export async function getCompany(slug: string): Promise<{ company: Company; rank: number } | null> {
  const list = await getCompanies();
  const i = list.findIndex((c) => c.slug === slug);
  return i < 0 ? null : { company: list[i], rank: i + 1 };
}

// Enrichment: one file per company in data/enrich/. Companies without a file simply have none.
let enrich: Map<string, Enrichment> | null = null;
function enrichAll(): Map<string, Enrichment> {
  if (enrich) return enrich;
  enrich = new Map();
  const dir = join(process.cwd(), "data", "enrich");
  if (existsSync(dir)) {
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".json")) continue;
      try {
        const e = JSON.parse(readFileSync(join(dir, f), "utf8")) as Enrichment;
        if (e && e.slug) enrich.set(e.slug, e);
      } catch {
        /* a malformed file never breaks the build; that company just shows no enrichment */
      }
    }
  }
  return enrich;
}

export async function getEnrichment(slug: string): Promise<Enrichment | null> {
  return enrichAll().get(slug) || null;
}

/** Only https preview images that the fetch script verified. */
export async function getOg(slug: string): Promise<OgImage | null> {
  const o = OG[slug];
  return o && /^https:\/\//.test(o.url) ? o : null;
}

const runner = (c: Company, rank: number, me = false): Runner => ({ slug: c.slug, name: c.name, host: hostOf(c.site), zone: zoneOf(c).key, score: Number(c.score) || 0, rank, ...(me ? { me } : {}) });

/** Competitors split into those on the board (placed on the track) and the rest (plain text). */
export async function getRivals(c: Company, e: Enrichment | null) {
  const list = await getCompanies();
  const bySlug = new Map(list.map((x) => [x.slug, x]));
  const byName = new Map(list.map((x) => [x.name.trim().toLowerCase(), x]));
  const on: Company[] = [];
  const off: string[] = [];
  for (const r of e?.competitors || []) {
    const t = String(r || "").trim();
    if (!t) continue;
    const hit = bySlug.get(t) || byName.get(t.toLowerCase()) || bySlug.get(slugify(t));
    if (hit && hit.slug !== c.slug) {
      if (!on.some((x) => x.slug === hit.slug)) on.push(hit);
    } else if (!hit) off.push(t);
  }
  const hi = Math.max(...list.map((x) => Number(x.score) || 0)) || 1;
  // Board (Pace) rank breaks score ties, so the track agrees with the leaderboard.
  const order = new Map(paceSorted(list).map((x, i) => [x.slug, i + 1]));
  const rk = (x: Company) => order.get(x.slug) ?? 9999;
  return { track: [runner(c, rk(c), true), ...on.map((x) => runner(x, rk(x)))], off, hi };
}

/** The full card for one company: stored fields plus enrichment, preview image and rivals. */
export async function getCard(slug: string): Promise<{ card: Card; rank: number } | null> {
  const hit = await getCompany(slug);
  if (!hit) return null;
  const e = await getEnrichment(slug);
  const og = await getOg(slug);
  const rivals = await getRivals(hit.company, e);
  return { card: { ...hit.company, enrich: e, og, rivals }, rank: hit.rank };
}
