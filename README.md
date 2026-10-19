# Well Run

A curated gallery of well-run startups, with open ops roles as a layer on top. A side project by Alfredo Ponce de León.

Next.js (App Router) site, statically generated. `data/companies.json` is the dataset of record, read once at build time through `lib/data.ts`.

- `/` the board (The Well Run 100 + The Chase Pack)
- `/<slug>` one page per company
- `/sitemap.xml`, `/robots.txt`

`npm run dev` · `npm run build`

## Company profiles (v3)

- **Enrichment** lives in `data/enrich/<slug>.json` (schema: `data/enrich/SCHEMA.md`), loaded by `lib/data.ts`. Companies without a file simply skip those sections.
- **Landing-page images**: `npm run og` (`scripts/fetch-og.mjs`) reads each company site's `og:image` → `twitter:image` → apple-touch-icon / large icon, keeps only https URLs that answer 2xx with an image type, and writes `data/og.json`. Per-request timeout 9s, whole run capped at 10 min; a transient miss keeps the last verified URL. Not part of `next build` (builds stay deterministic); re-run it when the board changes.
- **Score breakdown**: `lib/score.ts` rebuilds each Pace score from stored fields (hiring, funding recency) and reads the traction level and red-flag count back from the stored score; it only shows exact math when that split is valid, otherwise it shows the parts it can and a note.
- **Rivals track**: `components/RivalTrack.tsx`; competitors on the board are placed in their own zone lanes, the rest are listed as text.
