import Anthropic from "@anthropic-ai/sdk";
import type { PromptCachingBetaTextBlockParam } from "@anthropic-ai/sdk/resources/beta/prompt-caching/messages";
import { DigestConfig, DigestItem } from "./types";

const SYSTEM_PROMPT = `You are a concise news editor. Summarize articles in 2-3 sentences. Focus on the key insight or development. Write for a reader who wants to stay informed quickly. Do not add opinions or editorializing.`;

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function summarizeItems(
  items: DigestItem[],
  config: DigestConfig
): Promise<DigestItem[]> {
  const client = new Anthropic({ apiKey: config.anthropicApiKey });
  const results: DigestItem[] = [];

  for (const item of items) {
    try {
      const contentToSummarize = item.fullContent
        ? `Title: ${item.title}\n\nFull article text:\n${item.fullContent.slice(0, 6000)}`
        : `Title: ${item.title}\nURL: ${item.url}\nDescription: ${item.description ?? "(no description)"}`;

      const systemBlock: PromptCachingBetaTextBlockParam = {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      };

      const response = await client.beta.promptCaching.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: [systemBlock],
        messages: [
          {
            role: "user",
            content: `Summarize this in 2-3 sentences:\n\n${contentToSummarize}`,
          },
        ],
      });

      const summary =
        response.content[0].type === "text"
          ? response.content[0].text.trim()
          : undefined;

      results.push({ ...item, summary });
    } catch (err) {
      console.error(`Summarization failed for "${item.title}":`, err);
      results.push({ ...item, summary: item.description });
    }

    await delay(50);
  }

  return results;
}
