#!/usr/bin/env python3
"""Generate a daily AI-marketing news brief.

Reads seed inputs (topics/leaders you care about + pasted X bookmarks), runs fresh
web research via the Claude API's built-in web search tool, and writes a dated
Markdown brief to briefs/YYYY-MM-DD.md.

Env:
  ANTHROPIC_API_KEY  (required)  Anthropic API key.

Usage:
  python generate_brief.py
"""

from __future__ import annotations

import datetime as _dt
import pathlib
import sys

import anthropic

try:
    import yaml
except ImportError:  # pragma: no cover - yaml is in requirements.txt
    yaml = None

MODEL = "claude-opus-4-8"
MAX_TOKENS = 16000
MAX_CONTINUATIONS = 6  # guard for the server-side web-search pause_turn loop

ROOT = pathlib.Path(__file__).resolve().parent
CONFIG_PATH = ROOT / "config" / "topics.yaml"
BOOKMARKS_PATH = ROOT / "bookmarks" / "seed.md"
BRIEFS_DIR = ROOT / "briefs"


def _load_text(path: pathlib.Path) -> str:
    return path.read_text(encoding="utf-8").strip() if path.exists() else ""


def _load_topics() -> dict:
    raw = _load_text(CONFIG_PATH)
    if not raw or yaml is None:
        return {}
    try:
        return yaml.safe_load(raw) or {}
    except yaml.YAMLError as exc:  # pragma: no cover
        print(f"WARNING: could not parse topics.yaml: {exc}", file=sys.stderr)
        return {}


def _fmt_list(items) -> str:
    if not items:
        return "(none specified)"
    return ", ".join(str(i) for i in items)


def build_prompt(today: str) -> str:
    topics = _load_topics()
    bookmarks = _load_text(BOOKMARKS_PATH)

    platforms = _fmt_list(topics.get("platforms"))
    leaders = _fmt_list(topics.get("leaders"))
    themes = _fmt_list(topics.get("themes"))
    exclude = _fmt_list(topics.get("exclude"))

    bookmarks_block = (
        f"\nThe user saved these links/notes (from their X bookmarks). Treat them as "
        f"signals of what they care about; expand on them with fresh context and follow "
        f"the people/companies they reference:\n\n{bookmarks}\n"
        if bookmarks
        else "\n(No bookmark links provided yet — research from the topics below.)\n"
    )

    return f"""You are a research analyst producing a DAILY news brief for someone building a
marketing agency powered by AI agents. Their stack integrates Salesforce (Agentforce),
Adobe (GenStudio / Adobe Experience Platform Agents), and Hightouch (AI Decisioning).

Today is {today}. Use the web_search tool to find news and perspectives from roughly the
LAST 24-48 HOURS (the freshest you can find; clearly note anything older you include and why
it still matters). Prioritize primary sources, leaders/founders, and concrete, applicable detail.

Priorities:
- Platforms to track: {platforms}
- Leaders/founders to prioritize: {leaders}
- Themes: {themes}
- De-prioritize / exclude: {exclude}
{bookmarks_block}
Search thoroughly across the four focus areas, then write the brief in GitHub-flavored
Markdown using EXACTLY this structure:

# AI Marketing Brief — {today}

## TL;DR
- (5 punchy bullets — the most important things to know today)

## Platform agentic features
(Salesforce Agentforce, Adobe GenStudio / AEP Agents, Hightouch AI Decisioning — launches,
capabilities, integrations. Each item: what changed + why it matters to the agency + source link.)

## Agency operations with AI
(How agencies are restructuring, pricing, staffing, and delivering with AI agents.)

## Thought leaders & founders
(Notable takes from marketing/AI leaders. Each: who, a short quote or paraphrase, source link,
and one line on why it matters.)

## Tactics & playbooks you can apply
(Concrete workflows, prompts, GTM tactics, case studies the reader can act on this week.)

## Sources
(Deduplicated list of every source URL cited above.)

Rules:
- Every factual claim needs an inline source link.
- Be specific and useful, not generic. No filler.
- If a section has little genuinely fresh news, say so briefly rather than padding.
- Output ONLY the Markdown brief, starting with the H1 — no preamble."""


def run_research(prompt: str) -> str:
    client = anthropic.Anthropic()
    tools = [{"type": "web_search_20260209", "name": "web_search"}]
    messages = [{"role": "user", "content": prompt}]

    response = client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        thinking={"type": "adaptive"},
        output_config={"effort": "high"},
        tools=tools,
        messages=messages,
    )

    # The web_search server tool runs a server-side loop; if it hits its iteration
    # cap it returns stop_reason == "pause_turn". Re-send to let it resume.
    continuations = 0
    while response.stop_reason == "pause_turn" and continuations < MAX_CONTINUATIONS:
        continuations += 1
        messages = [
            {"role": "user", "content": prompt},
            {"role": "assistant", "content": response.content},
        ]
        response = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            thinking={"type": "adaptive"},
            output_config={"effort": "high"},
            tools=tools,
            messages=messages,
        )

    text = "".join(b.text for b in response.content if b.type == "text").strip()
    if not text:
        raise RuntimeError(
            f"No text returned (stop_reason={response.stop_reason}). "
            "Check API key, model access, and web search availability."
        )
    return text


def main() -> int:
    today = _dt.datetime.now(_dt.timezone.utc).strftime("%Y-%m-%d")
    prompt = build_prompt(today)
    brief = run_research(prompt)

    BRIEFS_DIR.mkdir(parents=True, exist_ok=True)
    out_path = BRIEFS_DIR / f"{today}.md"
    out_path.write_text(brief + "\n", encoding="utf-8")
    print(f"Wrote {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
