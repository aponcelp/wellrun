"use client";
import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cap } from "@/lib/track";
import type { WeekLabel } from "@/lib/chart";

type Tab = "chart" | "week";

/** Week picker (prev/next + a select) for the chart pages. */
export function WeekPicker({ week, weeks }: { week: string; weeks: WeekLabel[] }) {
  const router = useRouter();
  const i = weeks.findIndex((w) => w.week === week); // weeks are newest first
  const newer = i > 0 ? weeks[i - 1] : null;
  const older = i >= 0 && i < weeks.length - 1 ? weeks[i + 1] : null;
  const go = (to: string, via: string) => cap("chart_week_changed", { from: week, to, via });
  return (
    <nav className="wkpick" aria-label="Chart weeks">
      {older ? (
        <Link className="wkpick__b" href={`/chart/${older.week}`} onClick={() => go(older.week, "prev")}>
          ← <span>Prev week</span>
        </Link>
      ) : (
        <span className="wkpick__b is-off" aria-hidden="true">← <span>Prev week</span></span>
      )}
      <label className="wkpick__sel">
        <span className="sr-only">Pick a week</span>
        <select
          value={week}
          onChange={(e) => {
            go(e.target.value, "select");
            router.push(`/chart/${e.target.value}`);
          }}
        >
          {weeks.map((w) => (
            <option key={w.week} value={w.week}>
              {w.title}
            </option>
          ))}
        </select>
      </label>
      {newer ? (
        <Link className="wkpick__b" href={`/chart/${newer.week}`} onClick={() => go(newer.week, "next")}>
          <span>Next week</span> →
        </Link>
      ) : (
        <span className="wkpick__b is-off" aria-hidden="true"><span>Next week</span> →</span>
      )}
    </nav>
  );
}

/** Two tabs: This Week (default, the insights) then The Chart. Both panels are server-rendered. */
export function ChartTabs({ week, chart, article }: { week: string; chart: React.ReactNode; article: React.ReactNode }) {
  // This Week (the insights) comes first; ?tab=chart opens the chart directly.
  const [tab, setTab] = useState<Tab>("week");
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t === "chart") setTab("chart");
  }, []);
  const pick = (t: Tab) => {
    if (t === tab) return;
    setTab(t);
    cap("chart_tab_changed", { tab: t === "chart" ? "The Chart" : "This Week", week });
  };
  return (
    <>
      <div className="wktabs" role="tablist" aria-label="Chart views">
        <button type="button" role="tab" id="tab-week" aria-controls="panel-week" aria-selected={tab === "week"} className="wktabs__b" onClick={() => pick("week")}>
          This Week
        </button>
        <button type="button" role="tab" id="tab-chart" aria-controls="panel-chart" aria-selected={tab === "chart"} className="wktabs__b" onClick={() => pick("chart")}>
          The Chart
        </button>
      </div>
      <div role="tabpanel" id="panel-chart" aria-labelledby="tab-chart" hidden={tab !== "chart"}>
        {chart}
      </div>
      <div role="tabpanel" id="panel-week" aria-labelledby="tab-week" hidden={tab !== "week"}>
        {article}
      </div>
    </>
  );
}
