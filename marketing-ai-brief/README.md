# marketing-ai-brief

A daily, automated **AI-marketing news brief**. Every day a GitHub Actions job runs
fresh, cited web research with the Claude API and commits a Markdown brief to
`briefs/YYYY-MM-DD.md` — perspectives and news from leaders in **agentic marketing**,
focused on a stack of **Salesforce Agentforce, Adobe GenStudio / AEP Agents, and
Hightouch AI Decisioning**.

Each brief covers four areas: **platform agentic features**, **agency operations with
AI**, **thought leaders & founders**, and **tactics & playbooks**.

> Lives in a `marketing-ai-brief/` subfolder of the Rainier repo. The daily workflow is
> at the repo root: `.github/workflows/daily-brief.yml`. To run it on a schedule, merge
> this branch into the repo's default branch and add the `ANTHROPIC_API_KEY` secret.

## How it works

```
config/topics.yaml  +  bookmarks/seed.md   →   generate_brief.py (Claude + web search)   →   briefs/YYYY-MM-DD.md
```

- `generate_brief.py` reads your seed inputs, asks `claude-opus-4-8` to research the last
  ~24–48h via the built-in web search tool, and writes a structured brief.
- `.github/workflows/daily-brief.yml` (repo root) runs it daily (13:00 UTC) and commits the result.

## Setup

1. **Add your API key.** Repo → Settings → Secrets and variables → Actions → new secret
   `ANTHROPIC_API_KEY`.
2. **Tell it what you care about.** Edit `config/topics.yaml` — add the leaders/handles you
   follow, tweak platforms and themes.
3. **Seed it with your bookmarks.** Paste X bookmark links into `bookmarks/seed.md`
   (see below). Optional but makes the brief much more "you".
4. **Run it.** Either wait for the daily schedule, or trigger manually: Actions tab →
   "Daily AI Marketing Brief" → Run workflow.

### Run locally

```bash
cd marketing-ai-brief
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...
python generate_brief.py        # writes briefs/<today>.md
```

## Getting links out of your X / Twitter bookmarks

X has **no one-click export**. Options, easiest first:

1. **Manual (recommended).** Open `x.com/i/bookmarks`, use ••• → "Copy link" on the
   tweets you care about, and paste the links into `bookmarks/seed.md`. A link is enough —
   the script expands it with fresh context.
2. **Browser extension / userscript.** Reputable open-source "Twitter bookmark export"
   tools can dump your bookmarks to CSV/JSON. They run in your logged-in session, so only
   use ones you trust.
3. **X API v2 (full automation, advanced).** `fetch_bookmarks.py` scaffolds the
   `GET /2/users/:id/bookmarks` call. It needs an OAuth 2.0 **user-context** token with the
   `bookmark.read` scope (a bearer/app token will not work). See that file's docstring.
   This is optional — the brief never depends on it.

## Files

| Path | Purpose |
|---|---|
| `generate_brief.py` | Main script: research + brief assembly |
| `config/topics.yaml` | Your seed: platforms, leaders, themes, exclusions |
| `bookmarks/seed.md` | Pasted X bookmark links/notes |
| `briefs/` | Generated daily briefs |
| `fetch_bookmarks.py` | Optional X API bookmark fetcher (off by default) |
| `../.github/workflows/daily-brief.yml` | Daily cron automation (repo root) |
