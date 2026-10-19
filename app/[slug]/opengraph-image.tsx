import { ImageResponse } from "next/og";
import { getCompanies, getCompany } from "@/lib/data";
import { C, OG_SIZE, TrackStrip, Wordmark, ZONE_COLOR, laneSpot, ogFonts, type StripRunner } from "@/lib/og";
import { DMETA, ZONES, fmtScore, has, zoneOf } from "@/lib/rank";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Well Run share card";

export async function generateStaticParams() {
  return (await getCompanies()).map((c) => ({ slug: c.slug }));
}

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hit = await getCompany(slug);
  const all = await getCompanies();
  const fonts = await ogFonts();
  if (!hit) return new ImageResponse(<div style={{ display: "flex", width: "100%", height: "100%", background: C.paper }} />, { ...size, fonts });
  const { company: c, rank } = hit;
  const z = zoneOf(c);
  const chart = rank <= 100 ? "The Well Run 100" : "The Chase Pack";
  const dm = DMETA[String(c.distance || "").trim()];
  const nameSize = c.name.length > 22 ? 60 : c.name.length > 14 ? 76 : 92;
  // Runners: this company highlighted, plus every other lane's leader (the board's track shows lane leaders too).
  const runners: StripRunner[] = ZONES.filter((x) => x.key !== z.key).map((x) => {
    const lead = all.find((o) => zoneOf(o).key === x.key);
    return { zone: x.key, at: lead ? laneSpot(all, lead) : 0.5, label: "", initial: lead ? lead.name.charAt(0).toUpperCase() : "" };
  });
  runners.push({ zone: z.key, at: Math.min(0.8, laneSpot(all, c)), label: clip(c.name, 18), initial: c.name.charAt(0).toUpperCase(), hot: true });

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: C.paper, padding: "40px 60px 44px", color: C.ink, fontFamily: "Plex" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, borderBottom: `5px solid ${C.ink}` }}>
          <Wordmark size={40} />
          <div style={{ display: "flex", fontSize: 24, fontWeight: 600, color: C.ink }}>wellrun.so</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", marginTop: 18, flex: 1 }}>
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", minWidth: 196, height: 196, padding: "0 18px",
              fontFamily: "Anton", fontSize: rank > 99 ? 118 : 156, lineHeight: 1, color: C.ink,
              background: rank === 1 ? C.lime : "transparent", border: rank === 1 ? "none" : `4px solid ${C.ink}`,
            }}
          >
            {rank}
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 40, flex: 1 }}>
            <div style={{ display: "flex", fontSize: 22, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: C.ink2 }}>
              #{rank} in {chart}
            </div>
            <div style={{ display: "flex", fontFamily: "Anton", fontSize: nameSize, lineHeight: 1.02, textTransform: "uppercase", marginTop: 4 }}>{clip(c.name, 30)}</div>
            {has(c.what_they_do) && <div style={{ display: "flex", fontSize: 22, color: C.ink2, marginTop: 4 }}>{clip(c.what_they_do, 54)}</div>}
            <div style={{ display: "flex", marginTop: 16, alignItems: "flex-end" }}>
              <div style={{ display: "flex", flexDirection: "column", marginRight: 54 }}>
                <div style={{ display: "flex", fontSize: 16, letterSpacing: 2.5, color: C.ink3, textTransform: "uppercase" }}>Pace</div>
                <div style={{ display: "flex", alignItems: "center", marginTop: 6 }}>
                  <div style={{ display: "flex", width: 26, height: 26, borderRadius: 7, background: ZONE_COLOR[z.key], border: `2px solid ${C.ink}`, marginRight: 12 }} />
                  <div style={{ display: "flex", fontFamily: "Anton", fontSize: 44, textTransform: "uppercase" }}>{z.name}</div>
                  <div style={{ display: "flex", fontSize: 26, marginLeft: 14, color: C.ink2 }}>{fmtScore(Number(c.score) || 0)} · {z.split}/km</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", fontSize: 16, letterSpacing: 2.5, color: C.ink3, textTransform: "uppercase" }}>Distance</div>
                <div style={{ display: "flex", alignItems: "flex-end", marginTop: 6 }}>
                  <div style={{ display: "flex", fontFamily: "Anton", fontSize: 44 }}>{dm ? (dm.km ? `${dm.km}KM` : "—") : "—"}</div>
                  <div style={{ display: "flex", fontSize: 24, marginLeft: 12, marginBottom: 6, color: C.ink2, textTransform: "uppercase" }}>{dm ? (c.distance === "10K" ? "" : c.distance) : "Not rated"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 18 }}>
          <TrackStrip runners={runners} width={1080} height={150} />
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
