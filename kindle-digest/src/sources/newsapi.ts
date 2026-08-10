import { z } from "zod";
import { DigestConfig, DigestItem } from "../types";

const ArticleSchema = z.object({
  title: z.string(),
  url: z.string(),
  description: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
  publishedAt: z.string().optional(),
  source: z.object({ name: z.string() }).optional(),
});

const ResponseSchema = z.object({
  status: z.literal("ok"),
  articles: z.array(ArticleSchema),
});

export async function fetchNewsApi(config: DigestConfig): Promise<DigestItem[]> {
  const params = new URLSearchParams({
    language: "en",
    pageSize: String(config.maxItemsPerSource),
    apiKey: config.newsApiKey,
  });

  const res = await fetch(
    `https://newsapi.org/v2/top-headlines?${params}`
  );
  if (!res.ok) throw new Error(`NewsAPI failed: ${res.status}`);

  const raw = await res.json();
  const parsed = ResponseSchema.parse(raw);

  return parsed.articles
    .filter((a) => a.title && a.title !== "[Removed]")
    .map((a) => ({
      source: "newsapi" as const,
      title: a.title,
      url: a.url,
      description: a.description ?? undefined,
      author: a.author ?? a.source?.name ?? undefined,
      publishedAt: a.publishedAt,
    }));
}
