import { ImageResponse } from "next/og";
import { getCompanies } from "@/lib/data";
import { C, OG_SIZE, TrackStrip, Wordmark, ZONE_COLOR, laneSpot, ogFonts, type StripRunner } from "@/lib/og";
import { ZONES, fmtScore, zoneOf } from "@/lib/rank";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Well Run · Startups that run well";

export default async function Image() {
  const all = await getCompanies();
  const fonts = await ogFonts();
  const top = all.slice(0, 5);
  const runners: StripRunner[] = ZONES.map((z) => {
    const lead = all.find((o) => zoneOf(o).key === z.key);
    return { zone: z.key, at: lead ? Math.min(0.78, laneSpot(all, lead)) : 0.5, label: lead ? lead.name : "", initial: lead ? lead.name.charAt(0).toUpperCase() : "", hot: z.key === "sprint" };
  });
  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: C.paper, padding: "40px 60px 44px", color: C.ink, fontFamily: "Plex" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, borderBottom: `5px solid ${C.ink}` }}>
          <Wordmark size={40} />
          <div style={{ display: "flex", fontSize: 24, fontWeight: 600 }}>wellrun.so</div>
        </div>
        <div style={{ display: "flex", flex: 1, marginTop: 22 }}>
          <div style={{ display: "flex", flexDirection: "column", width: 560 }}>
            <div style={{ display: "flex", fontFamily: "Anton", fontSize: 92, lineHeight: 0.98, textTransform: "uppercase" }}>The Well Run 100</div>
            <div style={{ display: "flex", fontSize: 22, color: C.ink2, marginTop: 12 }}>Startups that run well. Private companies only, paced by funding and buzz.</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 50, flex: 1 }}>
            {top.map((c, i) => {
              const z = zoneOf(c);
              return (
                <div key={c.slug} style={{ display: "flex", alignItems: "center", height: 46, borderBottom: "1.5px solid rgba(10,33,25,0.18)" }}>
                  <div style={{ display: "flex", width: 54, height: 44, alignItems: "center", justifyContent: "center", fontFamily: "Anton", fontSize: 34, background: i === 0 ? C.lime : "transparent" }}>{i + 1}</div>
                  <div style={{ display: "flex", flex: 1, marginLeft: 16, fontSize: 26, fontWeight: 600 }}>{c.name}</div>
                  <div style={{ display: "flex", width: 16, height: 16, borderRadius: 4, background: ZONE_COLOR[z.key], border: `1.5px solid ${C.ink}`, marginRight: 10 }} />
                  <div style={{ display: "flex", fontSize: 20, textTransform: "uppercase" }}>{z.name} {fmtScore(Number(c.score) || 0)}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 20 }}>
          <TrackStrip runners={runners} width={1080} height={150} />
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
