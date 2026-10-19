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
