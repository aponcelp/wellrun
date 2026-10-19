import type { ZoneKey } from "@/lib/types";
import { DMETA, ZONE_BY_KEY } from "@/lib/rank";

/** Pace: the split in condensed numerals, then the legacy signal bars, the zone tag and the score. */
export function ZoneMark({ zone, score, split, meter }: { zone: ZoneKey; score?: string; split?: boolean; meter?: boolean }) {
  const z = ZONE_BY_KEY[zone];
  return (
    <span className={`zm z-${zone}`}>
      {split && (
        <span className="zm__split">
          {z.split}
          <small>/km</small>
        </span>
      )}
      <span className="zm__line">
        {meter && <Meter on={z.bars} of={5} kind="zone" />}
        <span className="zm__name">{z.name}</span>
        {score != null && <span className="zm__score">{score}</span>}
      </span>
    </span>
  );
}

/** Bars as on the original site: `zone` = rising signal bars in the zone color; `dist` = four flat segments. */
export function Meter({ on, of, kind = "dist" }: { on: number; of: number; kind?: "zone" | "dist" }) {
  return (
    <span className={kind === "zone" ? "zbars" : "dbars"} aria-hidden="true">
      {Array.from({ length: of }, (_, i) => (
        <i key={i} className={i < on ? "on" : ""} />
      ))}
    </span>
  );
}

export function DistMark({ distance, compact }: { distance: string; compact?: boolean }) {
  const m = DMETA[distance];
  if (!m) return <span className="dm dm--none">{compact ? "Not rated" : <>—<small>Not rated</small></>}</span>;
  if (compact) return <span className="dm">{m.km ? `${m.km}km ${distance}` : distance}</span>;
  return (
    <span className={"dm" + (m.km ? "" : " dm--none")}>
      <span className="sr-only">Distance {distance}.</span>
      <span className="dm__km" aria-hidden="true">
        {m.km ? (
          <>
            {m.km}
            <small>km</small>
          </>
        ) : (
          "—"
        )}
      </span>
      <span className="dm__low" aria-hidden="true">
        <Meter on={m.bars} of={4} />
        <span className="dm__name">{distance}</span>
      </span>
    </span>
  );
}
