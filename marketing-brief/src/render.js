import { env } from "./config.js";

export function briefDate() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: env.timezone,
  }).format(new Date());
}

function esc(s) {
  return String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

// ---- The executive-summary section, shared by EPUB + email ----
function summaryHtml(summary, items) {
  if (!summary) {
    return `<h2>Today's stories</h2><ul>${items
      .map((it, i) => `<li><a href="${esc(it.url)}">${esc(it.title)}</a> <em>(${esc(it.source)})</em></li>`)
      .join("")}</ul>`;
  }
  const ref = (nums) =>
    (nums || [])
      .map((n) => items[n - 1])
      .filter(Boolean)
      .map((it) => ` <a href="${esc(it.url)}">[${esc(it.source)}]</a>`)
      .join("");

  let html = "";
  const hs = summary.headline_story;
  if (hs && items[hs.item - 1]) {
    html += `<p style="font-size:1.05em"><strong>📌 Top story:</strong> ${esc(hs.one_liner)} <a href="${esc(
      items[hs.item - 1].url
    )}">→</a></p><hr/>`;
  }
  for (const sec of summary.sections || []) {
    html += `<h2>${esc(sec.title)}</h2>`;
    if (sec.why_it_matters) html += `<p><em>${esc(sec.why_it_matters)}</em></p>`;
    html += "<ul>";
    for (const b of sec.bullets || []) html += `<li>${esc(b.text)}${ref(b.items)}</li>`;
    html += "</ul>";
  }
  return html;
}

// ---- Bookmarks: compact list for the email (TL;DRs only) ----
function bookmarksEmailHtml(bookmarks) {
  if (!bookmarks || !bookmarks.length) return "";
  let html = `<hr/><h2>📑 From your X bookmarks (${bookmarks.length})</h2>`;
  for (const b of bookmarks) {
    html += `<p style="margin:14px 0"><strong>${esc(b.title)}</strong>${
      b.topic ? ` <span style="color:#888">· ${esc(b.topic)}</span>` : ""
    }<br/><span>${esc(b.tldr || "")}</span><br/><a href="${esc(b.url)}">original</a></p>`;
  }
  html += `<p style="color:#999"><small>Full rewrites + related reading are on your Kindle.</small></p>`;
  return html;
}

// ---- Bookmarks: one full chapter each for the EPUB ----
function bookmarkChapterHtml(b) {
  const meta = [b.category === "tweet" ? "Saved tweet" : "Bookmarked article", b.author]
    .filter(Boolean)
    .join(" · ");
  const tldr = b.tldr
    ? `<blockquote style="border-left:4px solid #888;padding-left:12px;margin:0 0 16px"><strong>TL;DR.</strong> ${esc(
        b.tldr
      )}</blockquote>`
    : "";
  const related =
    b.related && b.related.length
      ? `<h3>Related reading</h3><ul>${b.related
          .map((r) => `<li><a href="${esc(r.url)}">${esc(r.title)}</a>${r.source ? ` <em>(${esc(r.source)})</em>` : ""}</li>`)
          .join("")}</ul>`
      : "";
  return `<p style="color:#666"><small>${esc(meta)} — <a href="${esc(b.url)}">source</a></small></p>
${tldr}${b.rewrite_html || `<p>${esc(b.tldr || "")}</p>`}${related}`;
}

// ---- Full ad-free documents, EPUB only (keeps email light) ----
function fullDocsHtml(items) {
  return items
    .map((it, i) => {
      const meta = [it.source, it.byline, it.publishedAt && new Date(it.publishedAt).toDateString()]
        .filter(Boolean)
        .join(" · ");
      const note = it.extracted
        ? ""
        : `<p style="color:#a00"><em>Full text unavailable (paywalled or blocked); preview only. Read at source.</em></p>`;
      return `<hr/><h2 id="art${i + 1}">${esc(it.title)}</h2>
<p style="color:#666"><small>${esc(meta)} — <a href="${esc(it.url)}">${esc(it.url)}</a></small></p>
${note}${it.fullHtml || ""}`;
    })
    .join("\n");
}

export function buildEmailHtml({ summary, items, dateStr, bookmarks = [] }) {
  return `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:680px;margin:auto;line-height:1.5;color:#111">
<h1 style="margin-bottom:0">Agentic Marketing Daily Brief</h1>
<p style="color:#666;margin-top:4px">${esc(dateStr)} · ${items.length} stories · ${bookmarks.length} bookmarks</p>
${summaryHtml(summary, items)}
${bookmarksEmailHtml(bookmarks)}
<hr/><p style="color:#999"><small>Full ad-free articles + rewrites delivered to your Kindle. Built by your marketing-brief pipeline.</small></p>
</body></html>`;
}

// epub-gen-memory takes a chapters array. Ch.1 = brief; then news articles; then bookmarks.
export function buildEpubChapters({ summary, items, dateStr, bookmarks = [] }) {
  const chapters = [
    {
      title: `Daily Brief — ${dateStr}`,
      content: summaryHtml(summary, items) + bookmarksEmailHtml(bookmarks),
    },
  ];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const note = it.extracted
      ? ""
      : `<p><em>Full text unavailable (paywalled or blocked); preview only.</em></p>`;
    chapters.push({
      title: it.title.slice(0, 120),
      content: `<p><small>${esc(it.source)}${it.byline ? " · " + esc(it.byline) : ""} — <a href="${esc(
        it.url
      )}">source</a></small></p>${note}${it.fullHtml || ""}`,
    });
  }
  if (bookmarks.length) {
    chapters.push({ title: "— From your X bookmarks —", content: "<p>Your saved tweets and articles, rewritten for easy reading.</p>" });
    for (const b of bookmarks) {
      chapters.push({ title: `★ ${b.title.slice(0, 118)}`, content: bookmarkChapterHtml(b) });
    }
  }
  return chapters;
}

export { fullDocsHtml, bookmarksEmailHtml, bookmarkChapterHtml };
