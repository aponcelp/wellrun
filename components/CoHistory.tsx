import type { HistPoint } from "@/lib/chart";

const W = 520, H = 150, L = 40, R = 16, T = 16, B = 26;

function Line({ pts, get, lo, hi, invert, fmt, ticks, label }: {
  pts: HistPoint[]; get: (p: HistPoint) => number; lo: number; hi: number; invert?: boolean;
  fmt: (v: number) => string; ticks: number[]; label: string;
}) {
  const n = pts.length;
  const x = (i: number) => (n === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (n - 1));
  const y = (v: number) => {
    const t = hi === lo ? 0.5 : (v - lo) / (hi - lo);
    return invert ? T + t * (H - T - B) : H - B - t * (H - T - B);
  };
  const d = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(get(p)).toFixed(1)}`).join(" ");
  return (
    <figure className="cohist__fig">
      <figcaption>{label}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}: ${pts.map((p) => `${p.short} ${fmt(get(p))}`).join(", ")}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className="cohist__grid" />
            <text x={L - 8} y={y(t) + 4} textAnchor="end" className="cohist__ax">{fmt(t)}</text>
          </g>
        ))}
        {n > 1 && <path d={d} className="cohist__line" />}
        {pts.map((p, i) => (
          <g key={p.week}>
            <circle cx={x(i)} cy={y(get(p))} r={4} className="cohist__dot" />
            <text x={x(i)} y={y(get(p)) - 9} textAnchor="middle" className="cohist__val">{fmt(get(p))}</text>
            <text x={x(i)} y={H - 6} textAnchor="middle" className="cohist__ax">{p.short}</text>
          </g>
        ))}
      </svg>
    </figure>
  );
}

/** Collapsible weekly history on a company page: rank and Pace score, one point per Sunday. */
export default function CoHistory({ pts }: { pts: HistPoint[] }) {
  if (!pts.length) return null;
  const ranks = pts.map((p) => p.rank);
  const rLo = Math.max(1, Math.min(...ranks) - 10), rHi = Math.max(...ranks) + 10;
  const rTicks = [rLo, Math.round((rLo + rHi) / 2), rHi];
  return (
    <details className="cohist">
      <summary>Rank and score over time</summary>
      <div className="cohist__body">
        <Line pts={pts} get={(p) => p.rank} lo={rLo} hi={rHi} invert fmt={(v) => `#${v}`} ticks={rTicks} label="Board rank" />
        <Line pts={pts} get={(p) => p.score} lo={0} hi={6} fmt={(v) => v.toFixed(1).replace(/\.0$/, "")} ticks={[0, 2, 4, 6]} label="Pace score" />
        <p className="cohist__note">
          One point per Sunday re-rank{pts.length < 4 ? `, tracking since ${pts[0].short}. The lines fill in week by week.` : "."}
        </p>
      </div>
    </details>
  );
}
