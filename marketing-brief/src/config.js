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

export const env = {
  anthropicKey: process.env.ANTHROPIC_API_KEY || "",
  model: process.env.BRIEF_MODEL || "claude-sonnet-4-6",

  smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
  smtpPort: Number(process.env.SMTP_PORT || 465),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  fromEmail: process.env.FROM_EMAIL || process.env.SMTP_USER || "",

  // Comma-separated lists supported.
  kindleEmail: process.env.KINDLE_EMAIL || "",
  emailTo: process.env.EMAIL_TO || "",

  // Readwise Reader (your saved tweets / bookmarked articles).
  readwiseToken: process.env.READWISE_TOKEN || "",
  // Only pull bookmarks in these Reader locations (comma list): new,later,shortlist,archive,feed.
  readwiseLocations: process.env.READWISE_LOCATIONS || "new,later,shortlist",
  // Optional: only bookmarks carrying this Reader tag (e.g. "kindle"). Empty = all.
  readwiseTag: process.env.READWISE_TAG || "",
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
