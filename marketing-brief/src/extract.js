import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import pLimit from "p-limit";
import { env } from "./config.js";

// Google News links are redirect wrappers. Resolve to the publisher URL so
// Readability sees the real article markup.
async function resolveUrl(url) {
  if (!/news\.google\.com/.test(url)) return url;
  try {
    const res = await fetch(url, { redirect: "follow", headers: ua() });
    return res.url && !/news\.google\.com/.test(res.url) ? res.url : url;
  } catch {
    return url;
  }
}

function ua() {
  return {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml",
  };
}

async function extractOne(item) {
  const resolved = await resolveUrl(item.url);
  try {
    const res = await fetch(resolved, { redirect: "follow", headers: ua(), signal: AbortSignal.timeout(25000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const dom = new JSDOM(html, { url: resolved });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    if (article && article.content && article.textContent.trim().length > 250) {
      return {
        ...item,
        url: resolved,
        fullHtml: article.content, // sanitized, ad-free article body
        text: article.textContent.replace(/\s+\n/g, "\n").trim(),
        byline: article.byline || null,
        extracted: true,
      };
    }
    throw new Error("readability returned thin content (likely paywalled)");
  } catch (e) {
    // Fall back to the RSS snippet so the item still appears in the brief.
    return {
      ...item,
      url: resolved,
      fullHtml: `<p>${escapeHtml(item.snippet || "(no preview available)")}</p>`,
      text: item.snippet || "",
      byline: null,
      extracted: false,
      extractError: e.message,
    };
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

export async function extractAll(items) {
  const limit = pLimit(env.extractConcurrency);
  const out = await Promise.all(items.map((it) => limit(() => extractOne(it))));
  const ok = out.filter((o) => o.extracted).length;
  console.log(`  extracted full text for ${ok}/${out.length} (rest use RSS preview / paywalled)`);
  return out;
}
