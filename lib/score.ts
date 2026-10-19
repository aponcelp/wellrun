// "How this score was built": rebuilds a company's Pace score line by line from its stored fields,
// following the Pace model (insights SPEC, v2 points + v3 zone thresholds + the Seed / Stealth / Cool-down rules).
// Pure functions only: safe on the server and in the browser.
//
// Hiring and funding points come straight from stored fields (open roles, round, date, amount).
// Traction level and the number of significant red flags are researcher judgments that are not stored
// as points, so they are read back from the stored score: the model's possible values make that split
// unique (traction is 0, 0.75 or 1.5; each flag is −1). A score only "reconciles" when that split is
// valid (flags ≥ 0, and no flag points without a written red flag). Otherwise the card shows the parts
// it can compute and says so, rather than showing math that doesn't add up.
import type { Company } from "./types";

export type Line = { key: "hiring" | "funding" | "traction" | "flags"; label: string; pts: number | null; why: string };
export type Breakdown = {
  lines: Line[];
  score: number;
  /** "exact": the lines add up to the stored score; "floor": they go below 0 and the total is floored; "partial": can't be split from the fields. */
  status: "exact" | "floor" | "partial";
  zone: string;
  zoneWhy: string;
  override: string;
  note: string;
};

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH_NAME = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Oct 2026" / "October 2026" / "2026-10" / "2026-10-15" → months since year 0, or null. */
export function ym(s: unknown): number | null {
  const t = String(s ?? "");
  let m = t.match(/\b([A-Za-z]{3})[a-z]*\.?\s+(?:\d{1,2},\s*)?(\d{4})\b/);
  if (m && MONTHS.includes(m[1].toLowerCase())) return +m[2] * 12 + MONTHS.indexOf(m[1].toLowerCase());
  m = t.match(/\b(\d{4})-(\d{2})\b/);
  if (m) return +m[1] * 12 + (+m[2] - 1);
  return null;
}
export const ymLabel = (n: number) => `${MONTH_NAME[n % 12]} ${Math.floor(n / 12)}`;
/** "2026-07" → "Jul 2026"; anything else is returned as given. */
export const monthLabel = (s: string) => {
  const m = String(s || "").match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
  return m ? `${MONTH_NAME[+m[2] - 1]} ${m[1]}` : String(s || "");
};

/** First dollar amount in a round string, in $M. "$1.85B" → 1850. */
export function amountM(s: unknown): number | null {
  const m = String(s ?? "").match(/\$\s?([\d.,]+)\s*(billion|bn|b|million|mm|m|k)?\b/i);
  if (!m) return null;
  const v = parseFloat(m[1].replace(/,/g, ""));
  if (!isFinite(v)) return null;
  const u = (m[2] || "m").toLowerCase();
  return u.startsWith("b") ? v * 1000 : u === "k" ? v / 1000 : v;
}

const fmt = (n: number) => (Math.round(n * 100) / 100).toString();
export const signed = (n: number) => (n > 0 ? "+" + fmt(n) : n < 0 ? "−" + fmt(-n) : "0");

/** Zone from score alone (v3 thresholds). */
export function zoneFromScore(s: number) {
  return s >= 4.75 ? "Sprint" : s >= 4.25 ? "Race" : s >= 3.5 ? "Tempo" : s >= 1.5 ? "Steady" : "Warm-up";
}
const ZONE_RANGE: Record<string, string> = {
  Sprint: "4.75 or more",
  Race: "4.25–4.74",
  Tempo: "3.5–4.24",
  Steady: "1.5–3.49",
  "Warm-up": "under 1.5",
};

/** Rounds that aren't new primary money don't count as funding momentum. */
const NOT_PRIMARY = /secondary|tender|acquired|acquisition|\bdebt\b|share allotment|unannounced|\bIPO\b/i;

export function buildScore(c: Company): Breakdown {
  const score = Number(c.score) || 0;
  const lines: Line[] = [];

  // Hiring
  const rolesRaw = String(c.total_open_roles ?? "").trim();
  const roles = /^\D*\d[\d,]*/.test(rolesRaw) ? parseInt(rolesRaw.replace(/[^\d]/g, ""), 10) : NaN;
  const hire = !isFinite(roles) ? 0 : roles >= 30 ? 2 : roles >= 10 ? 1.5 : roles >= 3 ? 1 : roles >= 1 ? 0.5 : 0;
  const band = !isFinite(roles) ? "" : roles >= 30 ? "30+ roles" : roles >= 10 ? "10–29 roles" : roles >= 3 ? "3–9 roles" : roles >= 1 ? "1–2 roles" : "no roles";
  lines.push({
    key: "hiring",
    label: "Hiring",
    pts: hire,
    why: isFinite(roles) ? `${roles} open ${roles === 1 ? "role" : "roles"} on the live job board (${band} = ${signed(hire)})` : "No public job board count on file",
  });

  // Funding recency
  const ref = ym(c.last_checked) ?? ym("Oct 2026")!;
  const d = ym(c.last_round_date);
  const round = [String(c.stage || "").trim(), String(c.last_round || "").trim()].filter(Boolean).join(" · ");
  let fund = 0;
  let fwhy = "";
  const roundCore = String(c.last_round || "").replace(/\(\+[^)]*\)/g, ""); // "$100M (+$40M venture debt)" → "$100M"
  if (NOT_PRIMARY.test(roundCore) && !/equity|primary/i.test(roundCore)) {
    fwhy = `Latest money (${c.last_round || "n/a"}${c.last_round_date ? ", " + c.last_round_date : ""}) isn't a new primary round, so it doesn't count`;
  } else if (d == null) {
    fwhy = round ? `${round}: no round date on file, so no recency points` : "No funding round on file";
  } else {
    const mo = Math.max(0, ref - d);
    const base = mo <= 6 ? 1.5 : mo <= 12 ? 1 : mo <= 24 ? 0.5 : 0;
    const a = amountM(c.last_round);
    const big = a != null && a >= 100 && mo <= 24 ? 0.5 : 0;
    fund = Math.min(2, base + big);
    const ago = mo === 0 ? "this month" : `${mo} ${mo === 1 ? "month" : "months"} ago`;
    const bandTxt = mo <= 6 ? "6 months or less" : mo <= 12 ? "6–12 months" : mo <= 24 ? "12–24 months" : "over 24 months";
    fwhy = `${round || "Last round"}, ${c.last_round_date} (${ago}): ${bandTxt} = ${signed(base)}` + (big ? `, $100M+ round ${signed(big)}` : "") + (base + big > 2 ? ", capped at +2" : "");
  }
  lines.push({ key: "funding", label: "Funding recency", pts: fund, why: fwhy });

  // Traction + red flags, read back from the stored score.
  const hasFlags = String(c.red_flags || "").trim() !== "";
  const rest = Math.round((score - hire - fund) * 100) / 100;
  const frac = Math.round((((rest % 1) + 1) % 1) * 100) / 100;
  const T = frac === 0.5 ? 1.5 : frac === 0.75 ? 0.75 : frac === 0 ? 0 : null;
  const R = T == null ? null : Math.round((T - rest) * 100) / 100;
  const tractionTxt = String(c.traction || "").trim();
  let status: Breakdown["status"] = "partial";
  let note = "";

  // Floored: the red flags outweigh everything else, so the exact split doesn't matter.
  if (score === 0 && hasFlags) status = "floor";
  if (status !== "floor" && T != null && R != null && R >= 0 && Number.isInteger(R) && !(R > 0 && !hasFlags)) {
    status = "exact";
    lines.push({
      key: "traction",
      label: "Traction",
      pts: T,
      why: (T === 1.5 ? "Strong growth" : T === 0.75 ? "Some growth" : "No growth signal counted") + (tractionTxt ? `: ${tractionTxt}` : ""),
    });
    lines.push({
      key: "flags",
      label: "Red flags",
      pts: -R,
      why:
        R > 0
          ? `${R} significant ${R === 1 ? "flag" : "flags"} in the last 24 months, −1 each`
          : hasFlags
            ? "Watch-outs noted below, none scored as a significant flag"
            : "None found in the last 24 months",
    });
  } else if (status === "floor") {
    lines.push({ key: "traction", label: "Traction", pts: null, why: tractionTxt ? `Judged, but outweighed: ${tractionTxt}` : "No growth signal counted" });
    lines.push({ key: "flags", label: "Red flags", pts: null, why: `Outweigh everything above (−1 each), so the total is floored at 0` });
  } else {
    lines.push({ key: "traction", label: "Traction", pts: null, why: tractionTxt || "No traction figure on file" });
    lines.push({ key: "flags", label: "Red flags", pts: null, why: hasFlags ? "Noted below (−1 each when significant)" : "None on file" });
    note = `Hiring and funding from the stored fields add up to ${signed(hire + fund)}. The stored score of ${fmt(score)} includes a judgment call the fields don't capture (often a boundary month or a round we don't count), so traction and red-flag points can't be split out exactly.`;
  }

  // Zone + overrides
  const stored = String(c.zone || "").trim();
  const natural = zoneFromScore(score);
  let override = "";
  let zoneWhy = natural === stored ? `${ZONE_RANGE[stored] || ""}` : "";
  const stage = String(c.stage || "");
  const roundM = amountM(c.last_round);
  const text = [c.latest_news, c.hiring_trend, c.traction, c.what_they_do].join(" ");
  if (stored === "Cool-down") {
    const old = d == null || ref - d > 24;
    const shrinking = /layoff|shrink|restructur|reduction in force|\bRIF\b|down\s?round|headcount\s*[−-]/i.test(String(c.red_flags || "") + " " + String(c.hiring_trend || ""));
    override = `Cool-down rule: score under 1.5 and ${old && shrinking ? "the last round is over 24 months old, with shrinking headcount or layoffs" : old ? "the last round is over 24 months old" : "headcount is shrinking or there were layoffs"}.`;
    if (score >= 1.5) override = "Cool-down: placed here by the editor despite the score (slowing after a faster stretch).";
    zoneWhy = "";
  } else if (stored === "Warm-up" && natural !== "Warm-up") {
    if (/stealth/i.test(text)) override = `Stealth rule: just out of stealth, so it starts in Warm-up whatever the score (${natural} by score alone).`;
    else if (/seed/i.test(stage) || (/series a/i.test(stage) && (roundM == null || roundM <= 15)))
      override = `Seed rule: ${/seed/i.test(stage) ? "seed-stage" : "a Series A of $15M or less"} without strong traction starts in Warm-up whatever the score (${natural} by score alone).`;
    else if (/series a/i.test(stage)) override = `Seed rule (editor's call): early-stage without strong traction starts in Warm-up (${natural} by score alone).`;
    else override = `Editor's call: placed in Warm-up (${natural} by score alone).`;
  } else if (stored === "Warm-up") {
    zoneWhy = ZONE_RANGE["Warm-up"];
  } else if (natural !== stored) {
    override = `Placed in ${stored} by the editor (${natural} by score alone).`;
  }
  return { lines, score, status, zone: stored, zoneWhy, override, note };
}
