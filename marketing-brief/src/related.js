import Parser from "rss-parser";
import { env } from "./config.js";

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "marketing-brief/1.0 (+daily news digest)" },
});

// Find a few related articles for a bookmark via a Google News search query.
export async function findRelated(query, excludeUrl) {
  const n = env.relatedPerBookmark;
  if (!n || !query) return [];
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
    query
  )}&hl=en-US&gl=US&ceid=US:en`;
  try {
    const feed = await parser.parseURL(url);
    const seen = new Set();
    const out = [];
    for (const it of feed.items || []) {
      if (!it.link || !it.title) continue;
      if (excludeUrl && it.link === excludeUrl) continue;
      const key = it.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        title: it.title.trim(),
        url: it.link,
        source: (it.creator || (it.title.split(" - ").pop() || "")).trim(),
      });
      if (out.length >= n) break;
    }
    return out;
  } catch (e) {
    console.warn(`  ! related lookup failed (${query}): ${e.message}`);
    return [];
  }
}
