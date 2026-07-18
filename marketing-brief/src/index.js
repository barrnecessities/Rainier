#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pLimit from "p-limit";
import { ingest } from "./ingest.js";
import { extractAll } from "./extract.js";
import { summarize, summarizeBookmark } from "./summarize.js";
import { fetchBookmarks, archiveBookmarks } from "./readwise.js";
import { findRelated } from "./related.js";
import { buildEmailHtml, buildEpubChapters, fullDocsHtml, bookmarkChapterHtml, briefDate } from "./render.js";
import { buildEpubBuffer, deliver } from "./deliver.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "out");
const dryRun = process.argv.includes("--dry-run");

// For each saved bookmark: Claude writes a TL;DR + easy-read rewrite, then we
// attach related articles. Bounded concurrency to respect API rate limits.
async function processBookmarks() {
  const raw = await fetchBookmarks();
  if (!raw.length) return [];
  const limit = pLimit(3);
  const out = await Promise.all(
    raw.map((b) =>
      limit(async () => {
        const ai = await summarizeBookmark(b);
        if (!ai) {
          // No AI (e.g. missing key / parse fail): still ship the raw item.
          return { ...b, tldr: b.readwiseSummary || "", rewrite_html: b.html, related: [], topic: "" };
        }
        const related = await findRelated(ai.related_query, b.url);
        return { ...b, ...ai, related };
      })
    )
  );
  const ok = out.filter((b) => b.rewrite_html).length;
  console.log(`  processed ${ok}/${out.length} bookmarks (TL;DR + rewrite + related)`);
  return out;
}

async function main() {
  const dateStr = briefDate();
  console.log(`\n== Agentic Marketing Daily Brief — ${dateStr} ==`);

  console.log("1/6 Ingesting feeds…");
  const raw = await ingest();

  console.log("2/6 Extracting full ad-free text…");
  const items = raw.length ? await extractAll(raw) : [];

  console.log("3/6 Reading your X bookmarks (Readwise)…");
  const bookmarks = await processBookmarks();

  if (!items.length && !bookmarks.length) {
    console.log("No fresh stories or bookmarks today. Nothing to send.");
    return;
  }

  console.log("4/6 Summarizing news with Claude…");
  const summary = items.length ? await summarize(items) : null;

  console.log("5/6 Rendering EPUB + email…");
  const chapters = buildEpubChapters({ summary, items, dateStr, bookmarks });
  const epubBuffer = await buildEpubBuffer({ title: `Marketing Brief — ${dateStr}`, chapters });
  const emailHtml = buildEmailHtml({ summary, items, dateStr, bookmarks });
  const epubFilename = `marketing-brief-${new Date().toISOString().slice(0, 10)}.epub`;

  // Always write artifacts locally (handy for GitHub Actions upload + debugging).
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, epubFilename), epubBuffer);
  writeFileSync(join(outDir, "brief.html"), emailHtml);
  writeFileSync(
    join(outDir, "full.html"),
    `<!doctype html><meta charset=utf8><title>${dateStr}</title>${emailHtml}<hr/><h1>Full documents</h1>${fullDocsHtml(
      items
    )}${bookmarks.map((b) => `<hr/><h2>★ ${b.title}</h2>${bookmarkChapterHtml(b)}`).join("")}`
  );
  console.log(`  wrote artifacts to ${outDir}`);

  console.log("6/6 Delivering…");
  await deliver({
    subject: `📈 Agentic Marketing Brief — ${dateStr}`,
    emailHtml,
    epubBuffer,
    epubFilename,
    dryRun,
  });

  if (!dryRun) await archiveBookmarks(bookmarks.map((b) => b.id).filter(Boolean));

  console.log("Done.\n");
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
