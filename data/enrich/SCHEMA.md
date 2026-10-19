# Company enrichment (one file per company: work/enrich/data/<slug>.json)
Public, sourced facts only. Every list item carries a source URL. Unknown = null or [] (never guess).
{
  "slug": "ramp",
  "checked": "Oct 19, 2026",
  "founded": 2019,                         // year or null
  "hq": "New York, NY",
  "headcount_est": {"value": "~1,200", "as_of": "Sep 2026", "source": "url"} | null,
  "leadership": [ {"name":"Eric Glyman","title":"Co-founder & CEO","founder":true,"linkedin":"url or null","source":"url"} ],   // founders + up to 6 C-suite/key execs (COO, CFO, CRO, CTO, CPO, Head of Ops/People). Current only.
  "funding_history": [ {"round":"Series G","date":"2026-07","amount":"$500M","valuation":"$32B" | null,"lead":"Founders Fund","source":"url"} ],  // oldest -> newest, every priced round you can verify incl. seed; note debt separately with round "Debt"
  "total_raised": "$2.3B" | null,
  "revenue_est": {"value":"~$1B ARR","as_of":"Aug 2026 (REQUIRED: month+year the figure was true; site shows it as \"as of\")","basis":"company-stated | press report | estimate","source":"url"} | null,
  "news_timeline": [ {"date":"2026-09","headline":"short, factual, <=90 chars","url":"url"} ],   // 4-6 most important items, last ~18 months, newest first (launches, rounds, acquisitions, exec moves, layoffs, lawsuits)
  "competitors": ["slug-or-name", "..."]   // 3-5 direct rivals; use the board slug if the company is on Well Run
}
Rules: US-focused public sources (company site/about/leadership page, press releases, TechCrunch, Bloomberg, Reuters, The Information headlines, Crunchbase/PitchBook public snippets, LinkedIn public titles). No personal info beyond name/title/public LinkedIn URL. Revenue: prefer company-stated or reputable press; label estimates. Never invent.
