import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import dotenv from "dotenv";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

export const sources = JSON.parse(
  readFileSync(join(root, "config", "sources.json"), "utf8")
);

function googleNewsRss(query) {
  const q = encodeURIComponent(`${query} when:2d`);
  return `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`;
}

// Curated feeds + topic-derived Google News feeds, normalized to one shape.
export const allFeeds = [
  ...sources.feeds
    .filter((f) => f.enabled !== false)
    .map((f) => ({ name: f.name, url: f.url, kind: "feed" })),
  ...sources.topics
    .filter((t) => t.enabled !== false)
    .map((t) => ({ name: t.name, url: googleNewsRss(t.query), kind: "topic" })),
];

// Trim every value read from env. Secrets pasted into CI often carry a
// trailing newline/space; for values used as HTTP headers (API keys) that
// stray whitespace throws "is not a legal HTTP header value" and kills the run.
const val = (name, dflt = "") => (process.env[name] ?? dflt).toString().trim();

export const env = {
  anthropicKey: val("ANTHROPIC_API_KEY"),
  model: val("BRIEF_MODEL") || "claude-sonnet-4-6",

  smtpHost: val("SMTP_HOST") || "smtp.gmail.com",
  smtpPort: Number(val("SMTP_PORT") || 465),
  smtpUser: val("SMTP_USER"),
  smtpPass: val("SMTP_PASS"),
  fromEmail: val("FROM_EMAIL") || val("SMTP_USER"),

  // Comma-separated lists supported.
  kindleEmail: val("KINDLE_EMAIL"),
  emailTo: val("EMAIL_TO"),

  // Readwise Reader (your saved tweets / bookmarked articles).
  readwiseToken: val("READWISE_TOKEN"),
  // Only pull bookmarks in these Reader locations (comma list): new,later,shortlist,archive,feed.
  readwiseLocations: val("READWISE_LOCATIONS") || "new,later,shortlist",
  // Optional: only bookmarks carrying this Reader tag (e.g. "kindle"). Empty = all.
  readwiseTag: val("READWISE_TAG"),
  // Look back this far for freshly-saved bookmarks (they may be older than news).
  bookmarkLookbackHours: Number(process.env.BOOKMARK_LOOKBACK_HOURS || 30),
  maxBookmarks: Number(process.env.MAX_BOOKMARKS || 15),
  // If true, move processed bookmarks to Reader "archive" so they never repeat.
  readwiseArchiveAfter: /^(1|true|yes)$/i.test(process.env.READWISE_ARCHIVE_AFTER || ""),
  // Related-articles per bookmark (0 disables the "Related" block).
  relatedPerBookmark: Number(process.env.RELATED_PER_BOOKMARK || 3),

  // Tuning knobs.
  maxArticles: Number(process.env.MAX_ARTICLES || 40),
  lookbackHours: Number(process.env.LOOKBACK_HOURS || 28),
  extractConcurrency: Number(process.env.EXTRACT_CONCURRENCY || 5),
  timezone: process.env.BRIEF_TZ || "America/New_York",
};

export function splitList(v) {
  return (v || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
