import { DigestItem } from "./types";

const SOURCE_LABELS: Record<DigestItem["source"], string> = {
  twitter: "Twitter Bookmarks",
  hackernews: "Hacker News",
  newsapi: "Top News",
  economist: "The Economist",
};

const SOURCE_COLORS: Record<DigestItem["source"], string> = {
  twitter: "#1d9bf0",
  hackernews: "#ff6600",
  newsapi: "#e63946",
  economist: "#cc0000",
};

function formatDate(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function scoreStars(score?: number): string {
  if (!score) return "";
  const s = Math.round(score);
  return `&#9733; ${s}/10`;
}

function renderItem(item: DigestItem): string {
  const color = SOURCE_COLORS[item.source];
  const meta = [
    item.author ? `By ${item.author}` : "",
    formatDate(item.publishedAt),
    item.score ? scoreStars(item.score) : "",
  ]
    .filter(Boolean)
    .join(" &middot; ");

  return `
    <div style="margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid #eeeeee;">
      <h3 style="font-size:1.05em;margin:0 0 5px 0;line-height:1.35;">
        <a href="${item.url}" style="color:#1a0dab;text-decoration:none;">${item.title}</a>
      </h3>
      ${meta ? `<p style="font-size:0.8em;color:#888888;margin:0 0 8px 0;">${meta}</p>` : ""}
      <p style="font-size:0.95em;line-height:1.65;margin:0;color:#222222;">
        ${item.summary ?? item.description ?? ""}
      </p>
    </div>`;
}

export function renderDigest(items: DigestItem[], date: Date): string {
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const sources: DigestItem["source"][] = ["economist", "twitter", "newsapi", "hackernews"];
  const sections = sources
    .map((source) => {
      const sourceItems = items.filter((i) => i.source === source);
      if (sourceItems.length === 0) return "";
      const color = SOURCE_COLORS[source];
      return `
      <h2 style="font-size:1.2em;margin:36px 0 16px 0;padding-bottom:6px;border-bottom:2px solid ${color};color:${color};">
        ${SOURCE_LABELS[source]}
      </h2>
      ${sourceItems.map(renderItem).join("")}`;
    })
    .filter(Boolean)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Digest &mdash; ${dateStr}</title>
</head>
<body style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:24px 20px;color:#1a1a1a;background:#ffffff;">
  <div style="border-bottom:3px solid #1a1a1a;padding-bottom:12px;margin-bottom:8px;">
    <h1 style="font-size:1.7em;margin:0 0 4px 0;letter-spacing:-0.5px;">Daily Digest</h1>
    <p style="font-size:0.85em;color:#666666;margin:0;">${dateStr} &middot; ${items.length} articles</p>
  </div>
  ${sections}
  <hr style="margin-top:40px;border:none;border-top:1px solid #cccccc;">
  <p style="font-size:0.75em;color:#aaaaaa;text-align:center;margin-top:12px;">
    Generated ${date.toISOString()} &middot; Rainier Daily Digest
  </p>
</body>
</html>`;
}
