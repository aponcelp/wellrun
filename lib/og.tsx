// Share-image helpers for next/og (Satori). Fonts are bundled in assets/fonts so the build never fetches.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Company, ZoneKey } from "./types";
import { ZONES, zoneOf } from "./rank";

export const OG_SIZE = { width: 1200, height: 630 };

export const C = {
  paper: "#f4efe4",
  sheet: "#fffdf8",
  ink: "#0a2119",
  ink2: "#4c5551",
  ink3: "#868c87",
  lime: "#b9ff00",
  clay: "#c4572f",
  forest: "#258b66",
};
export const ZONE_COLOR: Record<ZoneKey, string> = {
  sprint: "#b9ff00", race: "#c4572f", tempo: "#258b66", steady: "#a9b3a6", "warm-up": "#e8dcc8", "cool-down": "#d6e1e8",
};

let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 600; style: "normal" }[]> | null = null;
export function ogFonts() {
  if (!fonts) {
    const dir = join(process.cwd(), "assets", "fonts");
    fonts = Promise.all([
      readFile(join(dir, "Anton-Regular.ttf")),
      readFile(join(dir, "IBMPlexMono-Regular.ttf")),
      readFile(join(dir, "IBMPlexMono-SemiBold.ttf")),
    ]).then(([anton, mono, monoB]) => [
      { name: "Anton", data: anton, weight: 400, style: "normal" },
      { name: "Plex", data: mono, weight: 400, style: "normal" },
      { name: "Plex", data: monoB, weight: 600, style: "normal" },
    ]);
  }
  return fonts;
}

/** Where a company sits in its lane: same idea as the board's track (score within its zone, low to high). */
export function laneSpot(list: Company[], c: Company) {
  const k = zoneOf(c).key;
  const sc = list.filter((x) => zoneOf(x).key === k).map((x) => Number(x.score) || 0);
  const hi = Math.max(...sc), lo = Math.min(...sc);
  const norm = hi > lo ? ((Number(c.score) || 0) - lo) / (hi - lo) : 1;
  return 0.18 + 0.7 * norm;
}

export type StripRunner = { zone: ZoneKey; at: number; label: string; initial: string; hot?: boolean };

/** A flat race-track strip: one lane per pace zone, runners placed along their lane. */
export function TrackStrip({ runners, width, height }: { runners: StripRunner[]; width: number; height: number }) {
  const B = 6;
  const iw = width - B * 2, ih = height - B * 2;
  const lane = ih / ZONES.length;
  return (
    <div style={{ display: "flex", position: "relative", width, height, borderRadius: height / 2, background: C.clay, border: `${B}px solid ${C.ink}`, overflow: "hidden" }}>
      {ZONES.map((z, i) => (
        <div
          key={z.key}
          style={{
            position: "absolute", left: 0, top: i * lane, width: iw, height: lane,
            borderTop: i === 0 ? "none" : "2px solid rgba(255,255,255,0.85)", display: "flex", alignItems: "center", paddingLeft: height / 2 + 6,
          }}
        >
          <div style={{ display: "flex", fontFamily: "Anton", fontSize: Math.max(12, lane * 0.5), color: "#fbf8f4", letterSpacing: 1.5, textTransform: "uppercase" }}>
            {z.name}
            <span style={{ fontFamily: "Plex", fontSize: Math.max(10, lane * 0.36), opacity: 0.75, marginLeft: 8, marginTop: 3 }}>{z.split}/km</span>
          </div>
        </div>
      ))}
      {/* start / finish checker */}
      <div style={{ position: "absolute", left: height / 2 - 14, top: 0, width: 8, height: ih, display: "flex", flexDirection: "column" }}>
        {Array.from({ length: ZONES.length * 2 }, (_, j) => (
          <div key={j} style={{ display: "flex", width: 8, height: ih / (ZONES.length * 2), background: j % 2 ? C.ink : "#fbf8f4" }} />
        ))}
      </div>
      {runners.map((r, i) => {
        const zi = ZONES.findIndex((z) => z.key === r.zone);
        const d = r.hot ? lane * 1.12 : lane * 0.78;
        const cx = r.at * iw;
        const cy = zi * lane + lane / 2;
        return (
          <div key={i} style={{ position: "absolute", left: cx - d / 2, top: cy - d / 2, display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", width: d, height: d, borderRadius: d,
                background: r.hot ? C.lime : "#fbf8f4", border: `${r.hot ? 3 : 2}px solid ${C.ink}`,
                fontFamily: "Anton", fontSize: d * 0.5, color: C.ink, boxShadow: r.hot ? "0 0 0 4px rgba(185,255,0,0.5)" : "none",
              }}
            >
              {r.initial}
            </div>
            {r.label && (
              <div style={{ display: "flex", marginLeft: 8, fontFamily: "Plex", fontWeight: 600, fontSize: r.hot ? Math.max(14, lane * 0.62) : Math.max(11, lane * 0.48), color: r.hot ? C.lime : "#fbf8f4", background: r.hot ? C.ink : "transparent", padding: r.hot ? "2px 8px" : 0, borderRadius: 4 }}>
                {r.label}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Wordmark({ size = 34 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <div style={{ display: "flex", width: size * 0.5, height: size * 0.5, borderRadius: size, background: C.lime, border: `2px solid ${C.ink}`, marginRight: 12 }} />
      <div style={{ display: "flex", fontFamily: "Anton", fontSize: size, color: C.ink, letterSpacing: 0.5, textTransform: "uppercase" }}>Well Run</div>
      <div style={{ display: "flex", marginLeft: 12, fontFamily: "Plex", fontWeight: 600, fontSize: size * 0.34, color: C.lime, background: C.ink, padding: "4px 7px", borderRadius: 4, textTransform: "uppercase", letterSpacing: 1.5 }}>daily</div>
    </div>
  );
}
