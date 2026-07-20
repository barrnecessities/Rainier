import { env, splitList } from "./config.js";

const API = "https://readwise.io/api/v3";

function headers() {
  return { Authorization: `Token ${env.readwiseToken}`, "Content-Type": "application/json" };
}

// Strip HTML to a plain-text length for token-budgeting the Claude call.
function toText(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

async function listPage(params) {
  const url = new URL(`${API}/list/`);
  for (const [k, v] of Object.entries(params)) if (v != null && v !== "") url.searchParams.set(k, v);
  const res = await fetch(url, { headers: headers(), signal: AbortSignal.timeout(30000) });
  if (res.status === 429) {
    // Reader API rate limit; honor Retry-After once.
    const wait = Number(res.headers.get("Retry-After") || 5) * 1000;
    await new Promise((r) => setTimeout(r, wait));
    return listPage(params);
  }
  if (!res.ok) throw new Error(`Readwise list ${res.status}: ${await res.text().catch(() => "")}`);
  return res.json();
}

// Pull tweets + articles you saved to Reader within the lookback window.
export async function fetchBookmarks() {
  if (!env.readwiseToken) {
    console.warn("  ! READWISE_TOKEN not set — skipping bookmarks section");
    return [];
  }

  const wantLocations = new Set(splitList(env.readwiseLocations));
  const updatedAfter = new Date(Date.now() - env.bookmarkLookbackHours * 3600 * 1000).toISOString();
  const wantTag = env.readwiseTag.trim().toLowerCase();

  const collected = [];
  let cursor = undefined;
  for (let page = 0; page < 20; page++) {
    const data = await listPage({
      updatedAfter,
      withHtmlContent: "true",
      pageCursor: cursor,
    });
    for (const d of data.results || []) {
      if (!["tweet", "article"].includes(d.category)) continue;
      // Fresh Reader accounts ship with "Getting Started" docs; keep them out of the brief.
      if ((d.source || "").toLowerCase() === "readwise onboarding") continue;
      if (wantLocations.size && !wantLocations.has(d.location)) continue;
      const tags = Object.keys(d.tags || {}).map((t) => t.toLowerCase());
      if (wantTag && !tags.includes(wantTag)) continue;

      const html = d.html_content || d.content || "";
      collected.push({
        id: d.id,
        title: (d.title || d.site_name || "Untitled").trim(),
        url: d.source_url || d.url,
        author: d.author || d.site_name || null,
        category: d.category, // "tweet" | "article"
        savedAt: d.saved_at || d.updated_at || d.created_at || null,
        html,
        text: toText(html) || toText(d.summary),
        readwiseSummary: d.summary || null,
      });
    }
    cursor = data.nextPageCursor;
    if (!cursor) break;
  }

  // Newest first, cap for cost.
  collected.sort((a, b) => (Date.parse(b.savedAt || 0) || 0) - (Date.parse(a.savedAt || 0) || 0));
  const capped = collected.slice(0, env.maxBookmarks);
  console.log(`  fetched ${collected.length} bookmarks -> ${capped.length} kept`);
  return capped;
}

// Optionally move processed bookmarks out of the way so they never repeat.
export async function archiveBookmarks(ids) {
  if (!env.readwiseArchiveAfter || !ids.length) return;
  for (const id of ids) {
    try {
      await fetch(`${API}/update/${id}/`, {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ location: "archive" }),
        signal: AbortSignal.timeout(20000),
      });
    } catch (e) {
      console.warn(`  ! could not archive ${id}: ${e.message}`);
    }
  }
  console.log(`  archived ${ids.length} processed bookmarks in Reader`);
}
