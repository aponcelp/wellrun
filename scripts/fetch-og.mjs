#!/usr/bin/env node
// Fetches each company's landing-page preview image (og:image, then twitter:image,
// then apple-touch-icon / a large icon) and writes the verified URLs to data/og.json.
//
//   node scripts/fetch-og.mjs            # all companies
//   node scripts/fetch-og.mjs ramp brex  # only these slugs (others keep their stored entry)
//
// Rules: https only; every URL is checked with a real request (HEAD, then a ranged GET)
// and must answer 2xx with an image content type. Anything that fails is skipped, never guessed.
// Safe as a build-time step: every request has a timeout and the whole run has a deadline.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "data", "og.json");
const PER_REQ_MS = Number(process.env.OG_TIMEOUT_MS || 9000);
const DEADLINE_MS = Number(process.env.OG_DEADLINE_MS || 10 * 60 * 1000);
const CONCURRENCY = Number(process.env.OG_CONCURRENCY || 16);
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 WellRunBot/1.0 (+https://www.wellrun.so)";

const raw = JSON.parse(readFileSync(join(ROOT, "data", "companies.json"), "utf8"));
const companies = Array.isArray(raw) ? raw : raw.companies;
const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
const only = new Set(process.argv.slice(2));
const started = Date.now();

async function req(url, init = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), PER_REQ_MS);
  try {
    return await fetch(url, { redirect: "follow", ...init, signal: ctl.signal, headers: { "user-agent": UA, accept: "*/*", ...(init.headers || {}) } });
  } finally {
    clearTimeout(t);
  }
}

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#x2F;/gi, "/").replace(/&#47;/g, "/").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? decode(m[2] ?? m[3] ?? m[4] ?? "") : "";
};

/** Candidates in preference order: [url, kind]. */
function candidates(html, base) {
  const head = html.slice(0, 400000);
  const metas = head.match(/<meta\b[^>]*>/gi) || [];
  const links = head.match(/<link\b[^>]*>/gi) || [];
  const out = [];
  const add = (u, kind) => {
    if (!u) return;
    try {
      const abs = new URL(u, base).toString();
      if (abs.startsWith("https://") && !out.some((x) => x[0] === abs)) out.push([abs, kind]);
    } catch {}
  };
  const meta = (keys) => metas.filter((m) => keys.includes((attr(m, "property") || attr(m, "name")).toLowerCase())).map((m) => attr(m, "content"));
  meta(["og:image:secure_url", "og:image", "og:image:url"]).forEach((u) => add(u, "og"));
  meta(["twitter:image", "twitter:image:src"]).forEach((u) => add(u, "twitter"));
  const icons = links
    .map((l) => ({ rel: attr(l, "rel").toLowerCase(), href: attr(l, "href"), sizes: attr(l, "sizes") }))
    .filter((l) => l.href && /icon/.test(l.rel));
  icons.filter((l) => /apple-touch-icon/.test(l.rel)).forEach((l) => add(l.href, "icon"));
  icons
    .filter((l) => !/apple-touch-icon|mask-icon/.test(l.rel))
    .map((l) => ({ ...l, px: parseInt((l.sizes.match(/(\d+)x\d+/) || [])[1] || "0", 10) }))
    .filter((l) => l.px >= 128)
    .sort((a, b) => b.px - a.px)
    .forEach((l) => add(l.href, "icon"));
  return out;
}

/** True when the URL answers 2xx with an image body (HEAD first, then a small ranged GET). */
async function reachable(url) {
  for (const method of ["HEAD", "GET"]) {
    try {
      const r = await req(url, method === "GET" ? { method, headers: { range: "bytes=0-2047" } } : { method });
      const ct = (r.headers.get("content-type") || "").toLowerCase();
      if (method === "GET") r.body?.cancel().catch(() => {});
      if (r.ok && r.url.startsWith("https://") && (ct.startsWith("image/") || (ct === "" && /\.(png|jpe?g|webp|gif|avif|svg)(\?|$)/i.test(url)))) {
        return { ok: true, finalUrl: r.url, type: ct };
      }
      if (r.status !== 405 && r.status !== 403 && r.status !== 400) return { ok: false };
    } catch {
      /* try the next method */
    }
  }
  return { ok: false };
}

async function one(c) {
  if (!c.site || !/^https?:\/\//.test(c.site)) return null;
  let html = "";
  let base = c.site;
  try {
    const r = await req(c.site, { headers: { accept: "text/html,application/xhtml+xml" } });
    if (!r.ok) return null;
    base = r.url;
    html = await r.text();
  } catch {
    return null;
  }
  for (const [url, kind] of candidates(html, base)) {
    if (Date.now() - started > DEADLINE_MS) return null;
    const v = await reachable(url);
    if (v.ok) return { url, kind, type: v.type || undefined };
  }
  return null;
}

const list = companies.filter((c) => !only.size || only.has(c.slug));
const result = only.size ? { ...prev } : {};
let found = 0;
let i = 0;
const today = new Date().toISOString().slice(0, 10);
async function worker() {
  while (i < list.length && Date.now() - started < DEADLINE_MS) {
    const c = list[i++];
    const hit = await one(c);
    if (hit) {
      result[c.slug] = { ...hit, checked: today };
      found++;
    } else if (!only.size && prev[c.slug] && process.env.OG_KEEP_PREVIOUS !== "0") {
      // A transient miss keeps the last verified image rather than blanking it.
      result[c.slug] = prev[c.slug];
    } else {
      delete result[c.slug];
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
const sorted = Object.fromEntries(Object.keys(result).sort().map((k) => [k, result[k]]));
writeFileSync(OUT, JSON.stringify(sorted, null, 1) + "\n");
const kinds = Object.values(sorted).reduce((m, v) => ((m[v.kind] = (m[v.kind] || 0) + 1), m), {});
console.log(`og: ${found} found this run of ${list.length} checked; ${Object.keys(sorted).length} stored`, kinds, `${Math.round((Date.now() - started) / 1000)}s`);
