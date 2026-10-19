"use client";
import { useEffect, useRef } from "react";
import { ZONES } from "@/lib/rank";

export type Runner = { name: string; host: string; score: number };

const esc = (s: string) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

/** The pace track from the original site: one lane per zone, led by its fastest companies. Hidden at 640px and below, as on the original site. */
export default function Track({ pool }: { pool: Record<string, Runner[]> }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    let tick = 0;
    const cx1 = 160, cx2 = 400, cy = 156, r0 = 62, lw = 15, n = ZONES.length;
    const L = cx2 - cx1;
    const stad = (r: number) => `M ${cx1} ${cy + r} L ${cx2} ${cy + r} A ${r} ${r} 0 0 0 ${cx2} ${cy - r} L ${cx1} ${cy - r} A ${r} ${r} 0 0 0 ${cx1} ${cy + r} Z`;
    const at = (r: number, t: number): [number, number] => {
      const P = 2 * L + 2 * Math.PI * r;
      let d = ((((t % 1) + 1) % 1) * P);
      if (d < L) return [cx1 + d, cy + r];
      d -= L;
      if (d < Math.PI * r) { const a = d / r; return [cx2 + r * Math.sin(a), cy + r * Math.cos(a)]; }
      d -= Math.PI * r;
      if (d < L) return [cx2 - d, cy - r];
      d -= L;
      const a = d / r;
      return [cx1 - r * Math.sin(a), cy - r * Math.cos(a)];
    };
    const rOut = r0 + lw * n;
    const ZC: Record<string, string> = { sprint: "#b9ff00", race: "#0a2119", tempo: "#258b66", steady: "#a9b3a6", "warm-up": "#e8dcc8", "cool-down": "#d6e1e8" };
    const T = [0.93, 0.79, 0.66, 0.53, 0.4, 0.29];
    const target = (i: number, k: string) => {
      const a = pool[k];
      if (!a || !a.length) return T[i];
      const c = a[tick % a.length], sc = a.map((x) => x.score);
      const hi = Math.max(...sc), lo = Math.min(...sc);
      const norm = hi > lo ? (c.score - lo) / (hi - lo) : 1;
      const jit = ((((tick * 37 + i * 13) % 7) - 3) * 0.006);
      return T[i] - 0.11 * (1 - norm) + jit;
    };
    let bg = `<path d="${stad(rOut + 4)}" fill="#0a2119"/>`;
    bg += `<path d="${stad(rOut)}" fill="#c4572f"/>`;
    bg += `<path d="${stad(r0)}" fill="#258b66"/>`;
    bg += `<path d="${stad(r0 - 8)}" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>`;
    for (let i = 0; i <= n; i++) bg += `<path d="${stad(r0 + lw * i)}" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1.5"/>`;
    bg += `<rect x="${cx1 - 3}" y="${cy + r0}" width="6" height="${lw * n}" fill="#fbf8f4"/>`;
    for (let j = 0; j < n * 2; j++) bg += `<rect x="${cx1 - 3 + (j % 2) * 3}" y="${cy + r0 + (j * lw) / 2}" width="3" height="${lw / 2}" fill="#0a2119"/>`;
    bg += `<text x="${(cx1 + cx2) / 2}" y="${cy - 4}" text-anchor="middle" fill="#fbf8f4" class="tk-in">LAP 01</text>`;
    bg += `<text x="${(cx1 + cx2) / 2}" y="${cy + 16}" text-anchor="middle" fill="rgba(251,248,244,0.8)" class="tk-sub">start / finish ↙</text>`;
    let lbl = "";
    ZONES.forEach((z, i) => {
      const y = cy + r0 + lw * (i + 0.5) + 4;
      lbl += `<text x="${cx1 + 12}" y="${y}" fill="#fbf8f4" class="tk-lbl">${esc(z.name)} <tspan class="tk-pace">${z.split}/km</tspan></text>`;
    });
    const cur = ZONES.map((z, i) => target(i, z.key));
    const runners = (tv: number[]) => {
      let s = "";
      ZONES.forEach((z, i) => {
        const r = r0 + lw * (i + 0.5);
        const [x, y] = at(r, tv[i]);
        const [bx, by] = at(r, tv[i] - 0.05);
        s += `<line x1="${bx}" y1="${by}" x2="${x}" y2="${y}" stroke="${ZC[z.key]}" stroke-width="4" stroke-linecap="round" opacity="0.55"/>`;
        const a = pool[z.key];
        const ld = a && a.length ? a[tick % a.length] : null;
        if (!ld) { s += `<circle cx="${x}" cy="${y}" r="7" fill="${ZC[z.key]}" stroke="#0a2119" stroke-width="2"/>`; return; }
        const right = x >= (cx1 + cx2) / 2, up = y < cy;
        const tx = x + (right ? -14 : 14), ty = y + (up ? -12 : 18);
        s += `<g class="tk-run"><title>${esc(ld.name)} in ${esc(z.name)} (${z.split}/km)</title>`;
        s += `<clipPath id="tkc${i}"><circle cx="${x}" cy="${y}" r="9"/></clipPath>`;
        s += `<circle cx="${x}" cy="${y}" r="11" fill="#fbf8f4" stroke="${ZC[z.key] === "#0a2119" ? "#b9ff00" : "#0a2119"}" stroke-width="2.5"/>`;
        s += `<text x="${x}" y="${y + 4}" text-anchor="middle" fill="#0a2119" class="tk-n">${esc(ld.name.charAt(0))}</text>`;
        if (ld.host) s += `<image href="https://www.google.com/s2/favicons?domain=${encodeURIComponent(ld.host)}&sz=64" x="${x - 9}" y="${y - 9}" width="18" height="18" clip-path="url(#tkc${i})"/>`;
        s += `<text x="${tx}" y="${ty}" text-anchor="${right ? "end" : "start"}" class="tk-name">${esc(ld.name)}</text></g>`;
      });
      return s;
    };
    svg.innerHTML = bg + `<g id="tk-runners">${runners(cur)}</g>` + lbl;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0, to = 0;
    const iv = window.setInterval(() => {
      // Same 5s rotation as the original; also skip while the track is hidden (phones, 640px and below).
      if (document.hidden || !svg.getClientRects().length) return;
      svg.classList.add("tk-swap");
      to = window.setTimeout(() => {
        tick++;
        const from = cur.slice(), next = ZONES.map((z, i) => target(i, z.key));
        svg.classList.remove("tk-swap");
        const t0 = performance.now(), dur = 1100;
        const step = (now: number) => {
          const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
          for (let i = 0; i < cur.length; i++) cur[i] = from[i] + (next[i] - from[i]) * e;
          const g = svg.querySelector("#tk-runners");
          if (g) g.innerHTML = runners(cur);
          if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      }, 250);
    }, 5000);
    return () => {
      clearInterval(iv);
      clearTimeout(to);
      cancelAnimationFrame(raf);
    };
  }, [pool]);
  return (
    <figure className="track" aria-label="Pace track: each lane is a pace zone, and faster companies are further around the lap">
      <svg ref={ref} viewBox="0 0 560 312" role="img" aria-hidden="true" />
      <figcaption>One lane per pace zone, led by its fastest company. More momentum, further down the lap.</figcaption>
    </figure>
  );
}
