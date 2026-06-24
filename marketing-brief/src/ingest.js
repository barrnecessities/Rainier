import Parser from "rss-parser";
import { allFeeds, env } from "./config.js";

const parser = new Parser({
  timeout: 20000,
  headers: { "User-Agent": "marketing-brief/1.0 (+daily news digest)" },
});

function normalizeUrl(u) {
  if (!u) return u;
  try {
    const url = new URL(u);
    // Google News wraps links; the real article is usually fine to keep as-is,
    // but strip common tracking params for dedupe stability.
    [...url.searchParams.keys()]
      .filter((k) => /^utm_|^fbclid$|^gclid$/i.test(k))
      .forEach((k) => url.searchParams.delete(k));
    url.hash = "";
    return url.toString();
  } catch {
    return u;
  }
}

function withinLookback(item, sinceMs) {
  const d = item.isoDate || item.pubDate;
  if (!d) return true; // keep undated items; better to over-include
  const t = Date.parse(d);
  return Number.isNaN(t) ? true : t >= sinceMs;
}

// Pull every feed, normalize items, drop stale ones, dedupe by URL then title.
export async function ingest() {
  const sinceMs = Date.now() - env.lookbackHours * 3600 * 1000;
  const settled = await Promise.allSettled(
    allFeeds.map(async (f) => {
      const feed = await parser.parseURL(f.url);
      return (feed.items || []).map((it) => ({
        title: (it.title || "").trim(),
        url: normalizeUrl(it.link),
        source: f.name,
        kind: f.kind,
        publishedAt: it.isoDate || it.pubDate || null,
        snippet: (it.contentSnippet || it.content || it.summary || "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 600),
      }));
    })
  );

  const items = [];
  for (let i = 0; i < settled.length; i++) {
    const r = settled[i];
    if (r.status === "fulfilled") items.push(...r.value);
    else console.warn(`  ! feed failed: ${allFeeds[i].name} (${r.reason?.message || r.reason})`);
  }

  const fresh = items.filter((it) => it.url && it.title && withinLookback(it, sinceMs));

  const seenUrl = new Set();
  const seenTitle = new Set();
  const deduped = [];
  for (const it of fresh) {
    const tKey = it.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (seenUrl.has(it.url) || seenTitle.has(tKey)) continue;
    seenUrl.add(it.url);
    seenTitle.add(tKey);
    deduped.push(it);
  }

  // Prefer most recent; cap to keep extraction + token cost bounded.
  deduped.sort((a, b) => (Date.parse(b.publishedAt || 0) || 0) - (Date.parse(a.publishedAt || 0) || 0));
  const capped = deduped.slice(0, env.maxArticles);

  console.log(`  ingested ${items.length} raw -> ${fresh.length} fresh -> ${deduped.length} unique -> ${capped.length} kept`);
  return capped;
}
