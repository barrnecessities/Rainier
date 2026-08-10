import { DigestConfig, DigestItem } from "../types";

interface RssItem {
  title: string;
  url: string;
  description: string;
  pubDate?: string;
}

function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = (/<title><!\[CDATA\[(.*?)\]\]><\/title>/.exec(block) ??
      /<title>(.*?)<\/title>/.exec(block))?.[1]?.trim();
    const link = (/<link>(.*?)<\/link>/.exec(block) ??
      /<guid[^>]*>(.*?)<\/guid>/.exec(block))?.[1]?.trim();
    const desc = (/<description><!\[CDATA\[(.*?)\]\]><\/description>/.exec(block) ??
      /<description>(.*?)<\/description>/.exec(block))?.[1]?.trim();
    const pubDate = /<pubDate>(.*?)<\/pubDate>/.exec(block)?.[1]?.trim();

    if (title && link && link.startsWith("http")) {
      items.push({
        title,
        url: link,
        description: desc ? stripHtml(desc) : "",
        pubDate,
      });
    }
  }

  return items;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractArticleContent(html: string): string {
  // Try known Economist article body selectors in order
  const selectors = [
    /<div[^>]*class="[^"]*article__body[^"]*"[^>]*>([\s\S]*?)<\/div>/,
    /<div[^>]*class="[^"]*article-body[^"]*"[^>]*>([\s\S]*?)<\/div>/,
    /<section[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/section>/,
  ];

  for (const selector of selectors) {
    const m = selector.exec(html);
    if (m) {
      return stripHtml(m[1]).slice(0, 8000);
    }
  }

  // Fallback: extract all <p> text within <article> tag
  const articleMatch = /<article[^>]*>([\s\S]*?)<\/article>/.exec(html);
  if (articleMatch) {
    const paragraphs: string[] = [];
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/g;
    let pMatch;
    while ((pMatch = pRegex.exec(articleMatch[1])) !== null) {
      const text = stripHtml(pMatch[1]);
      if (text.length > 40) paragraphs.push(text);
    }
    if (paragraphs.length > 0) return paragraphs.join(" ").slice(0, 8000);
  }

  return "";
}

export async function fetchEconomist(config: DigestConfig): Promise<DigestItem[]> {
  const rssRes = await fetch("https://www.economist.com/rss/", {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; KindleDigest/1.0)",
      Cookie: config.economistSessionCookie,
    },
  });
  if (!rssRes.ok) throw new Error(`Economist RSS failed: ${rssRes.status}`);

  const xml = await rssRes.text();
  const rssItems = parseRssItems(xml).slice(0, 5);

  const items = await Promise.all(
    rssItems.map(async (rss): Promise<DigestItem> => {
      let fullContent: string | undefined;
      try {
        const articleRes = await fetch(rss.url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; KindleDigest/1.0)",
            Cookie: config.economistSessionCookie,
            Accept: "text/html",
          },
        });
        if (articleRes.ok) {
          const html = await articleRes.text();
          fullContent = extractArticleContent(html) || undefined;
        }
      } catch (err) {
        console.error(`Could not fetch Economist article ${rss.url}:`, err);
      }

      return {
        source: "economist",
        title: rss.title,
        url: rss.url,
        description: rss.description,
        fullContent,
        publishedAt: rss.pubDate
          ? new Date(rss.pubDate).toISOString()
          : undefined,
      };
    })
  );

  return items;
}
