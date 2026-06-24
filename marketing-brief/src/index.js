#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ingest } from "./ingest.js";
import { extractAll } from "./extract.js";
import { summarize } from "./summarize.js";
import { buildEmailHtml, buildEpubChapters, fullDocsHtml, briefDate } from "./render.js";
import { buildEpubBuffer, deliver } from "./deliver.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "out");
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const dateStr = briefDate();
  console.log(`\n== Agentic Marketing Daily Brief — ${dateStr} ==`);

  console.log("1/5 Ingesting feeds…");
  const raw = await ingest();
  if (!raw.length) {
    console.log("No fresh stories today. Nothing to send.");
    return;
  }

  console.log("2/5 Extracting full ad-free text…");
  const items = await extractAll(raw);

  console.log("3/5 Summarizing with Claude…");
  const summary = await summarize(items);

  console.log("4/5 Rendering EPUB + email…");
  const chapters = buildEpubChapters({ summary, items, dateStr });
  const epubBuffer = await buildEpubBuffer({
    title: `Marketing Brief — ${dateStr}`,
    chapters,
  });
  const emailHtml = buildEmailHtml({ summary, items, dateStr });
  const epubFilename = `marketing-brief-${new Date().toISOString().slice(0, 10)}.epub`;

  // Always write artifacts locally (handy for GitHub Actions upload + debugging).
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, epubFilename), epubBuffer);
  writeFileSync(join(outDir, "brief.html"), emailHtml);
  writeFileSync(
    join(outDir, "full.html"),
    `<!doctype html><meta charset=utf8><title>${dateStr}</title>${emailHtml}<hr/><h1>Full documents</h1>${fullDocsHtml(items)}`
  );
  console.log(`  wrote artifacts to ${outDir}`);

  console.log("5/5 Delivering…");
  await deliver({
    subject: `📈 Agentic Marketing Brief — ${dateStr}`,
    emailHtml,
    epubBuffer,
    epubFilename,
    dryRun,
  });

  console.log("Done.\n");
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
