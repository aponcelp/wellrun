import Link from "next/link";
import type { ChartRun } from "@/lib/chart";

/** Compact chart strip on a company page: movement since last Sunday, peak, weeks in the Well Run 100. */
export default function CoRun({ run, rank }: { run: ChartRun; rank: number }) {
  const { lw, wks } = run;
  const peak = Math.min(run.peak, rank);
  const d = lw == null ? null : lw - rank;
  const move = lw == null ? "New" : d === 0 ? "Held" : d! > 0 ? `▲ ${d}` : `▼ ${-d!}`;
  const cls = lw == null ? "new" : d === 0 ? "flat" : d! > 0 ? "up" : "down";
  return (
    <div className="corun" aria-label="Weekly chart">
      <dl className="corun__row">
        <div><dt>Last week</dt><dd>{lw == null ? "—" : `#${lw}`}</dd></div>
        <div><dt>Move</dt><dd className={"corun__mv corun__mv--" + cls}>{move}</dd></div>
        <div><dt>Peak</dt><dd>#{peak}</dd></div>
        <div><dt>Weeks in the 100</dt><dd>{wks}</dd></div>
      </dl>
      <Link href="/chart?tab=chart" className="corun__all">The Chart →</Link>
    </div>
  );
}
