export type Source = { label?: string; url?: string };

/** One company exactly as stored in the dataset (data/companies.json today, Supabase later). */
export type Company = {
  name: string;
  slug: string;
  site: string;
  careers_url: string;
  status?: string;
  what_they_do: string;
  problem: string;
  industry: string;
  stage: string;
  last_round: string;
  last_round_date: string;
  lead_investors: string;
  total_open_roles: string | number;
  ops_roles: string;
  hiring_trend: string;
  headcount: string;
  latest_news: string;
  latest_news_date: string;
  latest_news_url: string;
  glassdoor_rating: string;
  glassdoor_reviews: string;
  glassdoor_url: string;
  traction: string;
  red_flags: string;
  score: string | number;
  zone: string;
  keep?: string;
  is_new?: boolean;
  red_flags_sources: Source[];
  engine: string;
  distance: string;
  distance_why: string;
  distance_sources: Source[];
  hiring_locations: string[];
  last_checked?: string;
};

export type ZoneKey = "sprint" | "race" | "tempo" | "steady" | "warm-up" | "cool-down";

/** The slim shape the board ships to the browser. Details load per company on open. */
export type Row = {
  slug: string;
  name: string;
  what: string;
  host: string;
  site: string;
  zone: ZoneKey;
  score: number;
  scoreRaw: string;
  distance: string;
  distI: number;
  rev: number;
  ops: number;
  gd: string;
  gdReviews: string;
  locs: string[];
  bucket: string;
  stage: string;
  hay: string;
  /** Default Pace rank, 1-based. */
  rank: number;
};

/** Public, sourced enrichment for a company (data/enrich/<slug>.json, schema in data/enrich/SCHEMA.md). */
export type Sourced = { value: string; as_of: string; source: string };
export type Enrichment = {
  slug: string;
  checked?: string;
  founded?: number | null;
  hq?: string | null;
  headcount_est?: Sourced | null;
  leadership?: { name: string; title: string; founder?: boolean; linkedin?: string | null; source?: string | null }[];
  funding_history?: { round: string; date: string; amount?: string | null; valuation?: string | null; lead?: string | null; source?: string | null }[];
  total_raised?: string | null;
  revenue_est?: (Sourced & { basis?: string }) | null;
  news_timeline?: { date: string; headline: string; url?: string | null }[];
  competitors?: string[];
};

/** A verified preview image from the company's own landing page (data/og.json, written by scripts/fetch-og.mjs). */
export type OgImage = { url: string; kind: "og" | "twitter" | "icon"; type?: string; checked?: string };

/** One marker on the rivals track. */
export type Runner = { slug: string; name: string; host: string; zone: ZoneKey; score: number; rank?: number; me?: boolean };

/** Everything the expanded card and the company page need for one company. */
export type Card = Company & {
  enrich?: Enrichment | null;
  og?: OgImage | null;
  rivals?: { track: Runner[]; off: string[]; hi: number };
};
