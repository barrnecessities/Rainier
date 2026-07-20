#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pLimit from "p-limit";
import { env } from "./config.js";
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
// --bookmarks-dump: skip news, send a digest of saved tweets/articles only.
// Default window = last 7 days (weekly digest); add --all for the full library (one-off).
const dumpMode = process.argv.includes("--bookmarks-dump");
const dumpAll = process.argv.includes("--all");

// For each saved bookmark: Claude writes a TL;DR + easy-read rewrite, then we
// attach related articles. Bounded concurrency to respect API rate limits.
async function processBookmarks(fetchOpts = {}) {
  const raw = await fetchBookmarks(fetchOpts);
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

// Bookmarks-only digest: weekly cron (last 7 days) or --all one-off full send.
async function bookmarksDump() {
  const dateStr = briefDate();
  const scope = dumpAll ? "full library" : `last ${Math.round(env.bookmarkDumpLookbackHours / 24)} days`;
  console.log(`\n== X Bookmarks Digest (${scope}) — ${dateStr} ==`);

  console.log("1/3 Reading your X bookmarks (Readwise)…");
  const bookmarks = await processBookmarks({
    all: dumpAll,
    lookbackHours: env.bookmarkDumpLookbackHours,
    max: env.maxBookmarksDump,
  });
  if (!bookmarks.length) {
    console.log("No bookmarks found. Connect X to Readwise (Settings > Integrations) or save tweets to Reader, then re-run.");
    return;
  }

  console.log("2/3 Rendering EPUB + email…");
  const heading = "X Bookmarks Digest";
  const chapters = buildEpubChapters({ summary: null, items: [], dateStr, bookmarks, heading });
  const epubBuffer = await buildEpubBuffer({ title: `${heading} — ${dateStr}`, chapters });
  const emailHtml = buildEmailHtml({ summary: null, items: [], dateStr, bookmarks, heading });
  const epubFilename = `x-bookmarks-${new Date().toISOString().slice(0, 10)}.epub`;

  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, epubFilename), epubBuffer);
  writeFileSync(join(outDir, "bookmarks-digest.html"), emailHtml);

  console.log("3/3 Delivering…");
  await deliver({
    subject: `🔖 ${heading} — ${dateStr} (${bookmarks.length} saves)`,
    emailHtml,
    epubBuffer,
    epubFilename,
    dryRun,
  });
  if (!dryRun) await archiveBookmarks(bookmarks.map((b) => b.id).filter(Boolean));
  console.log("Done.\n");
}

async function main() {
  if (dumpMode) return bookmarksDump();

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
