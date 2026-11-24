import Anthropic from "@anthropic-ai/sdk";
import { env } from "./config.js";

const SYSTEM = `You are the editor of a short, highly selective daily brief on AGENTIC AI and AI-in-marketing.
Audience: a marketing-technology strategist and hands-on Claude power user. They track Accenture Song,
Deloitte Digital, Adobe, Salesforce (Agentforce/Marketing Cloud), Braze, Writer, Jasper and the frontier
AI labs (Anthropic/Claude, OpenAI, Google/Gemini), and they want to get better at using Claude and
AI agents in their own work.

You will receive a numbered list of candidate articles (title, source, preview or full text).
Items marked [preview only] could not be fetched in full.

Be ruthless. Most candidates should NOT make the cut. Keep at most {{MAX_SELECTED}} items, and fewer on a slow day.

KEEP items that are substantive:
- Practical how-tos, workflows, tips and techniques for Claude, Claude Code, skills, MCP or AI agents
  (the reader should be able to try something today).
- Real agent deployments with specifics: who, what, results, lessons.
- Meaningful launches or strategy moves by the companies above, with concrete detail.
- Original analysis or reporting that changes how a strategist should think.

DROP:
- Press releases, partner/award announcements, funding rounds and stock or IPO market chatter
  (unless it materially changes strategy).
- Listicles, SEO content, "X ways AI will change marketing" think pieces, vague trend posts.
- Thin rewrites of another outlet's story, near-duplicates (keep the best version), and
  [preview only] items unless the story is clearly major.
- Off-topic items.

Then:
1. Rank the kept items, best first, in "keep".
2. Cluster ONLY the kept items into 2-6 themed sections. When any kept item is a practical how-to,
   include a section titled "Using Claude & agents" that says in each bullet what to try.
3. For each section write a 1-2 sentence "why it matters" and 1-4 tight bullets, each citing item number(s).
4. For each section, add "po_take": EXACTLY ONE sentence of so-what analysis from this persona:
   you are the product owner of Deloitte's agentic-marketing platform (Deloitte's answer to
   Accenture Song). What should this news make you think, worry about, or do? Be specific and
   opinionated (competitive threat, partnership angle, roadmap implication, positioning gap),
   never generic filler like "worth watching".
5. Pick the single most important story of the day, and give it a "po_take" too.

Return ONLY valid JSON (no markdown fences) matching:
{
  "keep": [<item numbers, best first>],
  "headline_story": { "item": <number>, "one_liner": "<=160 chars", "po_take": "one sentence" },
  "sections": [
    { "title": "string", "why_it_matters": "string", "po_take": "one sentence",
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
    .map(
      (it, i) =>
        `[${i + 1}] (${it.source})${it.extracted === false ? " [preview only]" : ""} ${it.title}\n${(
          it.text ||
          it.snippet ||
          ""
        ).slice(0, 700)}`
    )
    .join("\n\n");

  try {
    const msg = await client().messages.create({
      model: env.model,
      max_tokens: 4000,
      system: SYSTEM.replace("{{MAX_SELECTED}}", String(env.maxSelected)),
      messages: [{ role: "user", content: `Today's articles:\n\n${list}` }],
    });
    return parseJson(textOf(msg), "AI summary") || null;
  } catch (e) {
    console.warn(`  ! news summary failed (${e.message}); shipping raw list`);
    return null;
  }
}

// Narrow the article list to what Claude kept, in its ranked order, and
// renumber every reference in the summary to match. Items a section cites but
// "keep" forgot are appended so no bullet loses its link. Without a summary
// (no API key / failure) the list is just capped so the Kindle stays short.
export function applySelection(summary, items, max = env.maxSelected) {
  if (!summary) return { summary, items: items.slice(0, max) };
  const valid = (n) => Number.isInteger(n) && n >= 1 && n <= items.length;
  const cited = [
    summary.headline_story?.item,
    ...(summary.sections || []).flatMap((s) => (s.bullets || []).flatMap((b) => b.items || [])),
  ];
  const order = [];
  for (const n of [...(summary.keep || []), ...cited]) {
    if (valid(n) && !order.includes(n)) order.push(n);
  }
  const kept = order.slice(0, Math.max(max, 1));
  const remap = new Map(kept.map((oldN, i) => [oldN, i + 1]));
  const re = (nums) => (nums || []).map((n) => remap.get(n)).filter(Boolean);

  const sections = (summary.sections || [])
    .map((sec) => ({
      ...sec,
      bullets: (sec.bullets || []).map((b) => ({ ...b, items: re(b.items) })).filter((b) => b.items.length),
    }))
    .filter((sec) => sec.bullets.length);
  const hs = summary.headline_story;
  const headline_story = hs && remap.has(hs.item) ? { ...hs, item: remap.get(hs.item) } : null;

  return {
    summary: { ...summary, keep: kept.map((n) => remap.get(n)), headline_story, sections },
    items: kept.map((n) => items[n - 1]),
  };
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
  try {
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
  } catch (e) {
    console.warn(`  ! bookmark rewrite failed for "${item.title?.slice(0, 50)}" (${e.message})`);
    return null;
  }
}
