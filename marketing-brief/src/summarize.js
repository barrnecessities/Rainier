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

let _client = null;
function client() {
  if (!_client) _client = new Anthropic({ apiKey: env.anthropicKey });
  return _client;
}

function textOf(msg) {
  return msg.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
}

function parseJson(raw, label) {
  const jsonText = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(jsonText);
  } catch (e) {
    console.warn(`  ! could not parse ${label} JSON (${e.message})`);
    return null;
  }
}

export async function summarize(items) {
  if (!env.anthropicKey) {
    console.warn("  ! ANTHROPIC_API_KEY not set — skipping AI summary, shipping raw list");
    return null;
  }

  const list = items
    .map((it, i) => `[${i + 1}] (${it.source}) ${it.title}\n${(it.text || it.snippet || "").slice(0, 700)}`)
    .join("\n\n");

  const msg = await client().messages.create({
    model: env.model,
    max_tokens: 4000,
    system: SYSTEM,
    messages: [{ role: "user", content: `Today's articles:\n\n${list}` }],
  });

  return parseJson(textOf(msg), "AI summary") || null;
}

const BOOKMARK_SYSTEM = `You transform a saved tweet or bookmarked article into a calm, distraction-free read for a Kindle.
Given one item's title and content, produce:
1. "tldr": exactly 1-2 plain sentences a busy reader can absorb in 5 seconds. No hype, no emojis.
2. "rewrite_html": the piece rewritten as clean, easy-to-consume HTML — short paragraphs and, where it helps, a few <ul><li> bullets or <h3> subheads. Preserve the substance, key facts, numbers, names, and any argument. Strip promotional filler, "follow me", threads' "1/", link-shorteners, and clickbait. If it's a Twitter thread, merge it into flowing prose. Do NOT invent facts. Use only <p>, <ul>, <ol>, <li>, <h3>, <strong>, <em>, <blockquote>, <a href>.
3. "related_query": a 3-8 word web-search query to surface related coverage on the same topic.
4. "topic": a 1-3 word category label.

Return ONLY valid JSON (no markdown fences):
{ "tldr": "string", "rewrite_html": "string", "related_query": "string", "topic": "string" }`;

export async function summarizeBookmark(item) {
  if (!env.anthropicKey) return null;
  const body = (item.text || item.readwiseSummary || "").slice(0, 12000);
  const kind = item.category === "tweet" ? "Saved tweet/thread" : "Bookmarked article";
  const msg = await client().messages.create({
    model: env.model,
    max_tokens: 3000,
    system: BOOKMARK_SYSTEM,
    messages: [
      {
        role: "user",
        content: `${kind}\nTitle: ${item.title}\nAuthor: ${item.author || "unknown"}\nURL: ${item.url}\n\nContent:\n${body}`,
      },
    ],
  });
  return parseJson(textOf(msg), "bookmark rewrite");
}
