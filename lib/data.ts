// The single data loader. Today it reads the JSON snapshot at build time;
// switching to Supabase means changing only this file (keep the function signatures).
import raw from "@/data/companies.json";
import type { Company } from "./types";
import { paceSorted } from "./rank";

const ALL: Company[] = (Array.isArray(raw) ? raw : (raw as { companies: Company[] }).companies) as Company[];

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
