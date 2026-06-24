import Anthropic from "@anthropic-ai/sdk";
import { env } from "./config.js";

const SYSTEM = `You are the editor of a daily executive brief on AGENTIC MARKETING and AI-in-marketing.
Audience: a marketing-technology strategist tracking Accenture Song, Deloitte Digital, Adobe, Salesforce
(Agentforce/Marketing Cloud), Braze, Writer, Jasper, and the frontier AI labs (Anthropic/Claude,
OpenAI/Codex/GPT, Google/Gemini) as they relate to marketing.

You will receive a numbered list of today's articles (title, source, preview text).
Your job:
1. Drop items that are off-topic, pure SEO spam, or near-duplicates.
2. Cluster the rest into 3-7 themed sections (e.g. "Salesforce / Agentforce", "Frontier labs", "Agencies").
3. For each section write a 1-2 sentence "why it matters" and 2-5 tight bullets, each citing the item number(s).
4. Pick the single most important story of the day.

Return ONLY valid JSON (no markdown fences) matching:
{
  "headline_story": { "item": <number>, "one_liner": "<=160 chars" },
  "sections": [
    { "title": "string", "why_it_matters": "string",
      "bullets": [ { "text": "string", "items": [<numbers>] } ] }
  ]
}`;

export async function summarize(items) {
  if (!env.anthropicKey) {
    console.warn("  ! ANTHROPIC_API_KEY not set — skipping AI summary, shipping raw list");
    return null;
  }
  const client = new Anthropic({ apiKey: env.anthropicKey });

  const list = items
    .map((it, i) => `[${i + 1}] (${it.source}) ${it.title}\n${(it.text || it.snippet || "").slice(0, 700)}`)
    .join("\n\n");

  const msg = await client.messages.create({
    model: env.model,
    max_tokens: 4000,
    system: SYSTEM,
    messages: [{ role: "user", content: `Today's articles:\n\n${list}` }],
  });

  const raw = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
  const jsonText = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(jsonText);
  } catch (e) {
    console.warn(`  ! could not parse AI summary JSON (${e.message}); shipping raw list`);
    return null;
  }
}
