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

export function buildEmailHtml({ summary, items, dateStr }) {
  return `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:680px;margin:auto;line-height:1.5;color:#111">
<h1 style="margin-bottom:0">Agentic Marketing Daily Brief</h1>
<p style="color:#666;margin-top:4px">${esc(dateStr)} · ${items.length} stories</p>
${summaryHtml(summary, items)}
<hr/><p style="color:#999"><small>Full ad-free articles delivered to your Kindle. Built by your marketing-brief pipeline.</small></p>
</body></html>`;
}

// epub-gen-memory takes a chapters array. Chapter 1 = the brief; then one chapter per article.
export function buildEpubChapters({ summary, items, dateStr }) {
  const chapters = [
    {
      title: `Daily Brief — ${dateStr}`,
      content: summaryHtml(summary, items),
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
  return chapters;
}

export { fullDocsHtml };
