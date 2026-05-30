import { DigestConfig, DigestItem } from "../types";

interface HNItem {
  id: number;
  title: string;
  url?: string;
  by: string;
  time: number;
  score: number;
  type: string;
}

export async function fetchHackerNews(config: DigestConfig): Promise<DigestItem[]> {
  const res = await fetch(
    "https://hacker-news.firebaseio.com/v0/topstories.json"
  );
  if (!res.ok) throw new Error(`HN topstories failed: ${res.status}`);

  const ids = (await res.json()) as number[];
  const topIds = ids.slice(0, config.maxItemsPerSource);

  const items = await Promise.all(
    topIds.map(async (id): Promise<DigestItem | null> => {
      try {
        const r = await fetch(
          `https://hacker-news.firebaseio.com/v0/item/${id}.json`
        );
        if (!r.ok) return null;
        const item = (await r.json()) as HNItem;
        if (item.type !== "story" || !item.title) return null;

        return {
          source: "hackernews",
          title: item.title,
          url: item.url ?? `https://news.ycombinator.com/item?id=${item.id}`,
          description: `${item.score} points by ${item.by}`,
          author: item.by,
          publishedAt: new Date(item.time * 1000).toISOString(),
        };
      } catch {
        return null;
      }
    })
  );

  return items.filter((x): x is DigestItem => x !== null);
}
