import Link from "next/link";
import type { ChartRun } from "@/lib/chart";

/** Billboard-style line on a company page: this week, last week, peak, weeks on the Well Run 100. */
export default function CoRun({ run }: { run: ChartRun }) {
  const { rank, lw, peak, wks } = run;
  const d = lw == null ? null : lw - rank;
  const move = lw == null ? "New" : d === 0 ? "Held" : d! > 0 ? `▲ ${d}` : `▼ ${-d!}`;
  const cls = lw == null ? "new" : d === 0 ? "flat" : d! > 0 ? "up" : "down";
  return (
    <div className="corun">
      <p className="corun__k">
        Chart · week of {run.week.short}
        <Link href="/chart?tab=chart" className="corun__all">Full chart →</Link>
      </p>
      <dl className="corun__row">
        <div><dt>This week</dt><dd>#{rank}</dd></div>
        <div><dt>Last week</dt><dd>{lw == null ? "—" : `#${lw}`}</dd></div>
        <div><dt>Move</dt><dd className={"corun__mv corun__mv--" + cls}>{move}</dd></div>
        <div><dt>Peak</dt><dd>#{peak}</dd></div>
        <div><dt>Wks in 100</dt><dd>{wks}</dd></div>
      </dl>
    </div>
  );
}
