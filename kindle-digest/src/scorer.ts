import Anthropic from "@anthropic-ai/sdk";
import type { PromptCachingBetaTextBlockParam } from "@anthropic-ai/sdk/resources/beta/prompt-caching/messages";
import { DigestConfig, DigestItem, HistoryEntry, PreferencesConfig } from "./types";

function buildHistoryContext(history: HistoryEntry[][]): string {
  const highlyRated: string[] = [];

  for (const day of history) {
    for (const entry of day) {
      if (entry.userRating !== null && entry.userRating >= 4) {
        highlyRated.push(`"${entry.title}" (rating: ${entry.userRating}/5)`);
      }
    }
  }

  if (highlyRated.length === 0) return "";
  return `\nThe user previously rated these articles highly:\n${highlyRated.slice(-20).join("\n")}`;
}

const SYSTEM_PROMPT = `You are a news relevance scorer. Given user interests and article metadata, score each article 1-10 for relevance to the user's interests. Be selective — most articles should score 4-7, only genuinely excellent matches get 8-10. Return a JSON array only, no other text.`;

interface ScoreResult {
  index: number;
  score: number;
  reason: string;
}

export async function scoreAndFilterItems(
  items: DigestItem[],
  config: DigestConfig,
  prefs: PreferencesConfig,
  history: HistoryEntry[][]
): Promise<DigestItem[]> {
  if (items.length === 0) return [];

  const client = new Anthropic({ apiKey: config.anthropicApiKey });
  const historyContext = buildHistoryContext(history);

  const interestsList = prefs.interests
    .map((i) => `- ${i.topic} (weight: ${i.weight})`)
    .join("\n");

  const articleList = items
    .map(
      (item, i) =>
        `[${i}] Title: ${item.title}\n    Source: ${item.source}\n    Description: ${item.description ?? "(none)"}`
    )
    .join("\n\n");

  const userPrompt = `User interests:\n${interestsList}${historyContext}

Exclude keywords (score these 1-2): ${prefs.excludeKeywords.join(", ") || "none"}

Articles to score:
${articleList}

Return a JSON array: [{"index": 0, "score": 7, "reason": "brief reason"}, ...]`;

  try {
    const systemBlock: PromptCachingBetaTextBlockParam = {
      type: "text",
      text: SYSTEM_PROMPT,
      cache_control: { type: "ephemeral" },
    };

    const response = await client.beta.promptCaching.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      system: [systemBlock],
      messages: [{ role: "user", content: userPrompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Strip markdown code fences if present
    const jsonStr = text.replace(/```(?:json)?\n?/g, "").trim();
    const scores = JSON.parse(jsonStr) as ScoreResult[];

    const scored = items.map((item, i) => {
      const result = scores.find((s) => s.index === i);
      return {
        ...item,
        score: result?.score ?? 5,
        scoreReason: result?.reason ?? "",
      };
    });

    // Apply interest weights
    const weighted = scored.map((item) => {
      const topicBoost = prefs.interests.find((interest) =>
        item.scoreReason?.toLowerCase().includes(interest.topic.split(" ")[0].toLowerCase())
      );
      return {
        ...item,
        score: Math.min(10, (item.score ?? 5) * (topicBoost?.weight ?? 1)),
      };
    });

    return weighted
      .filter((item) => (item.score ?? 0) >= prefs.minScore)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, prefs.maxArticlesTotal);
  } catch (err) {
    console.error("Scoring failed, returning all items:", err);
    return items.slice(0, prefs.maxArticlesTotal);
  }
}
