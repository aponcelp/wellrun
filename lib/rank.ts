// Scoring labels and ordering, ported 1:1 from the original index.html.
// Pure functions only: safe to import on the server and in the browser.
import type { Company, Row, ZoneKey } from "./types";

export type Zone = { bars: number; key: ZoneKey; name: string; split: string; range: string; desc?: string };

// Pace zones, fastest first.
export const ZONES: Zone[] = [
  { bars: 5, key: "sprint", name: "Sprint", split: "3:30", range: "score ≥ 4.75" },
  { bars: 4, key: "race", name: "Race", split: "4:05", range: "4.25–4.74" },
  { bars: 3, key: "tempo", name: "Tempo", split: "4:40", range: "3.5–4.24" },
  { bars: 2, key: "steady", name: "Steady", split: "5:20", range: "1.5–3.49" },
  { bars: 1, key: "warm-up", name: "Warm-up", split: "6:00", range: "under 1.5", desc: "early, still building speed" },
  { bars: 1, key: "cool-down", name: "Cool-down", split: "6:30", range: "under 1.5", desc: "slowing after a faster stretch" },
];
export const ZONE_BY_KEY = Object.fromEntries(ZONES.map((z) => [z.key, z])) as Record<ZoneKey, Zone>;
export const zoneOf = (c: Pick<Company, "zone">): Zone =>
  ZONES.find((z) => z.name.toLowerCase() === String(c.zone).trim().toLowerCase()) || ZONES[ZONES.length - 1];
export const zoneIndex = (k: ZoneKey) => ZONES.findIndex((z) => z.key === k);

export const DISTS = ["Marathon", "Half", "10K", "Unproven"] as const;
export const DMETA: Record<string, { km: string; bars: number; blurb: string }> = {
  Marathon: { km: "42", bars: 4, blurb: "Built to last. A real edge, public proof it's working, and little that could knock it out." },
  Half: { km: "21", bars: 3, blurb: "The edge is forming. Some proof, but not locked in yet." },
  "10K": { km: "10", bars: 2, blurb: "Fast, but easy to catch. Rivals can copy it, or it depends on someone else." },
  Unproven: { km: "", bars: 0, blurb: "Too early to tell. No lasting edge visible yet." },
};

const ENGINE_PLAIN: Record<string, string> = {
  "Lock-in": "hard to leave",
  Network: "grows with users",
  Scale: "cheaper at size",
  Data: "learns from use",
  "None yet": "no edge yet",
};
export const plainEngine = (e: string) =>
  String(e || "").split("+").map((x) => ENGINE_PLAIN[x.trim()] || x.trim()).filter(Boolean).join(" + ");

export const has = (v: unknown): boolean =>
  v != null && String(v).trim() !== "" && String(v).trim().toLowerCase() !== "n.a.";

export const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, "").replace(/\+/g, "-plus").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Broad industry buckets: the first rule that matches the industry text wins.
const BUCKET_RULES: [string, RegExp][] = [
  ["Health", /health|mental|\brcm\b|diagnos|behavioral|virtual care/i],
  ["Insurance", /insur/i],
  ["Travel & Hospitality", /travel|hospitality|restaurant/i],
  ["Real estate & Mortgage", /mortgage|real estate|property/i],
  ["Finance & Accounting", /accounting|fp&a|\berp\b|audit|\btax\b|spend|procurement|finance software|banking software/i],
  ["Legal & Compliance", /legal|security|grc|regtech|privacy|compliance/i],
  ["HR & People", /\bhr\b|payroll|recruit|compensation|benefits/i],
  ["Fintech", /fintech|payment|banking|payout|crypto/i],
  ["Sales & CX", /customer|\bcx\b|sales|crm|support|martech|marketing|email|voice/i],
  ["Design & Productivity", /design|productivity|presentation|collaboration|workflow|no-code|website|content management|developer tools/i],
  ["Logistics & Commerce", /logistics|retail|commerce|fashion|grocery|construction/i],
  ["AI & Data", /analytics|\bai\b|data|intelligence|agents|automation/i],
];
export const BUCKET_ORDER = ["Fintech", "Health", "HR & People", "Finance & Accounting", "Legal & Compliance", "Sales & CX", "Design & Productivity", "Real estate & Mortgage", "Insurance", "Travel & Hospitality", "Logistics & Commerce", "AI & Data", "Other"];
export const bucketOf = (c: Pick<Company, "industry">) => (BUCKET_RULES.find((r) => r[1].test(c.industry || "")) || ["Other"])[0];

export const STAGES = ["All", "Seed", "Series A", "Series B", "Series C", "Series D", "Series E+", "Growth / PE", "Bootstrapped"];
export const stageKey = (c: Pick<Company, "stage">) => {
  const s = String(c.stage || "");
  const m = s.match(/Series ([A-Z])/i);
  if (m) return m[1].toUpperCase() <= "D" ? "Series " + m[1].toUpperCase() : "Series E+";
  if (/seed/i.test(s)) return "Seed";
  if (/\bPE\b|growth/i.test(s)) return "Growth / PE";
  if (/bootstrap/i.test(s)) return "Bootstrapped";
  return "";
};

// Revenue tie-break: biggest $ figure tied to ARR/revenue/run-rate in the traction line (0 if none).
export function revOf(t: string) {
  let best = 0;
  String(t || "").split(/[;|]/).forEach((seg) => {
    if (!/(ARR|revenue|run[- ]?rate|bookings)/i.test(seg) || /valuation|valued|raised|funding|GMV|for customers|generated|volume/i.test(seg)) return;
    const monthly = /monthly|MRR|\/mo\b/i.test(seg) && !/ARR|annual/i.test(seg);
    const re = /\$\s?([\d.,]+)\s*(billion|bn|B|million|mm|M|K|k)?/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(seg))) {
      let v = parseFloat(m[1].replace(/,/g, "")) || 0;
      const u = (m[2] || "").toLowerCase();
      v *= u.startsWith("b") ? 1e9 : u.startsWith("m") ? 1e6 : u === "k" ? 1e3 : 1;
      if (monthly) v *= 12;
      if (v > best) best = v;
    }
  });
  return best;
}

const distIndex = (d: string) => {
  const i = (DISTS as readonly string[]).indexOf(String(d || "").trim());
  return i < 0 ? 9 : i;
};
const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, "en", { sensitivity: "base" });

export const opsOf = (c: Pick<Company, "ops_roles">) => String(c.ops_roles || "").split(";").map((t) => t.trim()).filter(Boolean);
export const gdOf = (c: Pick<Company, "glassdoor_rating">) =>
  /^\d+(\.\d+)?$/.test(String(c.glassdoor_rating).trim()) ? String(c.glassdoor_rating).trim() : "";
export const hostOf = (site: string) => {
  try {
    return new URL(site).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};
export const fmtScore = (n: number) => n.toFixed(2).replace(/0$/, "");

// Default "Pace" order: zone, score, distance, revenue, name.
export function paceSorted(list: Company[]): Company[] {
  const k = list.map((c) => ({
    c,
    name: c.name,
    zi: zoneIndex(zoneOf(c).key),
    s: Number(c.score) || 0,
    d: distIndex(c.distance),
    r: revOf(c.traction),
  }));
  k.sort((a, b) => (a.zi - b.zi) || (b.s - a.s) || (a.d - b.d) || (b.r - a.r) || byName(a, b));
  return k.map((x) => x.c);
}

/** Companies must already be in Pace order. */
export function toRows(paced: Company[]): Row[] {
  return paced.map((c, i) => ({
    slug: c.slug,
    name: c.name,
    what: c.what_they_do || "",
    host: hostOf(c.site),
    site: c.site,
    zone: zoneOf(c).key,
    score: Number(c.score) || 0,
    scoreRaw: String(c.score),
    distance: String(c.distance || "").trim(),
    distI: distIndex(c.distance),
    rev: revOf(c.traction),
    ops: opsOf(c).length,
    gd: gdOf(c),
    gdReviews: has(c.glassdoor_reviews) ? String(c.glassdoor_reviews) : "",
    locs: c.hiring_locations || [],
    bucket: bucketOf(c),
    stage: stageKey(c),
    hay: [c.name, c.what_they_do, c.problem, c.industry, (c.hiring_locations || []).join(" ")].join(" ").toLowerCase(),
    rank: i + 1,
  }));
}

export type SortKey = "fastest" | "distance";
export const SORT_KEYS: SortKey[] = ["fastest", "distance"];
/** Anything that is not a current sort (e.g. the retired "hiring") falls back to Pace. */
export const toSortKey = (v: unknown): SortKey => (SORT_KEYS as unknown[]).includes(v) ? (v as SortKey) : "fastest";
const tie = (a: Row, b: Row) => (b.score - a.score) || (a.distI - b.distI) || (b.rev - a.rev) || byName(a, b);
export const SORTS: Record<SortKey, (a: Row, b: Row) => number> = {
  fastest: (a, b) => (zoneIndex(a.zone) - zoneIndex(b.zone)) || tie(a, b),
  distance: (a, b) => (a.distI - b.distI) || (zoneIndex(a.zone) - zoneIndex(b.zone)) || (b.score - a.score) || (b.rev - a.rev) || byName(a, b),
};
export const SORT_NOTE: Record<SortKey, string> = {
  fastest: "fastest first, ties a–z",
  distance: "longest distance first, then fastest",
};

// "Last checked" date: the per-company field when present, else the board-wide date the original site showed.
const LAST_CHECKED = "Oct 11, 2026";
const CHECKED_ON: Record<string, string> = { stuut: "Oct 12, 2026", flai: "Oct 12, 2026", siena: "Oct 12, 2026", melius: "Oct 12, 2026", "santé": "Oct 12, 2026", sante: "Oct 12, 2026" };
export const checkedOf = (c: Pick<Company, "name" | "last_checked">) =>
  (has(c.last_checked) ? String(c.last_checked) : "") || CHECKED_ON[String(c.name).trim().toLowerCase()] || LAST_CHECKED;

export const SITE = "https://www.wellrun.so";
