# Agentic Marketing Daily Brief

A daily, ad-free brief on **agentic marketing & AI-in-marketing** — plus **your saved X (Twitter) bookmarks, rewritten for calm reading** — delivered as:

- **EPUB → your Kindle** (full documents, ads stripped), and
- **HTML → your inbox** (Claude-written executive summary).

Two pipelines in one:

1. **Marketing news** — RSS + Google News ingestion → full-text extraction (Readability, ad-free) → Claude clustering & summaries.
2. **Your X bookmarks** — pulled from **Readwise Reader** → each saved tweet/article gets a **2-sentence TL;DR**, an **easy-to-consume rewrite** (threads merged into prose, filler stripped), and **related articles**.

Both merge into one EPUB + email. Runs on a daily GitHub Actions cron.

Every section of the news brief includes a **"PO lens"** — one sentence of so-what analysis from the perspective of the product owner of Deloitte's agentic-marketing platform (Deloitte's answer to Accenture Song).

There is also a **bookmarks-only digest** (`node src/index.js --bookmarks-dump`): a weekly Sunday cron sends everything you saved in the last 7 days as its own Kindle EPUB, and running the workflow manually with scope `all` does a one-off full send of your entire Reader library (`.github/workflows/weekly-bookmarks.yml`).

Topics tracked out of the box: Accenture Song, Deloitte Digital, Adobe (agentic), Salesforce Agentforce / Marketing Cloud, SIP, Braze, Writer, Jasper, Anthropic/Claude, OpenAI/Codex/GPT, Google/Gemini, and "agentic marketing" generally. Edit [`config/sources.json`](config/sources.json) to change them — no code changes needed.

---

## How it works

| Stage | File | What it does |
|---|---|---|
| Ingest | `src/ingest.js` | Pulls curated RSS feeds + a Google News RSS query per topic, filters to the last ~28h, dedupes by URL + title. |
| Extract | `src/extract.js` | Resolves Google News redirects, fetches each article, runs Mozilla **Readability** to get clean full text (no ads/nav). Paywalled items fall back to the RSS preview. |
| Bookmarks | `src/readwise.js` | Pulls saved tweets + bookmarked articles from **Readwise Reader** (v3 API) using the full ad-free body Reader already extracted. |
| Summarize | `src/summarize.js` | One Claude call clusters news into themed sections; a per-bookmark call writes a TL;DR + easy-read rewrite + a related-topic query. |
| Related | `src/related.js` | For each bookmark, finds a few related articles via a Google News search on Claude's suggested query. |
| Render | `src/render.js` | Builds the HTML email (summaries + bookmark TL;DRs) and EPUB chapters (full articles + full bookmark rewrites with Related links). |
| Deliver | `src/deliver.js` | Emails the brief and sends the EPUB to your Send-to-Kindle address via SMTP. Optionally archives processed bookmarks in Reader. |

Artifacts are always written to `out/` (also uploaded by the GitHub Action), so you can inspect a run even if email isn't configured.

---

## Setup

### 1. Get your Kindle email + approve the sender
1. Amazon → **Manage Your Content & Devices → Preferences → Personal Document Settings**.
2. Copy your **Send-to-Kindle e-mail** (e.g. `yourname_a1b2c3@kindle.com`). Use the one with the random suffix so docs auto-approve.
3. Under **Approved Personal Document E-mail List**, add the `FROM_EMAIL` you'll send from (your Gmail). **Amazon silently drops mail from un-approved senders** — this step is mandatory.
4. Send-to-Kindle accepts **EPUB** natively (Amazon dropped MOBI in 2022); this pipeline sends EPUB.

### 2. Gmail (or any SMTP) for sending
- Gmail: turn on 2-Step Verification, then create an **App Password** at <https://myaccount.google.com/apppasswords>. Use that 16-char password as `SMTP_PASS` (not your normal password).
- Any other SMTP provider works too (set `SMTP_HOST`/`SMTP_PORT`).

### 3. Anthropic API key
Create a key at <https://console.anthropic.com>. Default model is `claude-sonnet-4-6`; set `BRIEF_MODEL=claude-opus-4-8` for best editorial quality or `claude-haiku-4-5-20251001` to minimize cost.

### 4. Readwise Reader (your X bookmarks)
This is how your saved tweets/articles get into the brief.

1. Save tweets/articles to **[Readwise Reader](https://readwise.io/reader)**. The easiest capture paths:
   - **Reader browser extension / mobile share sheet** — one tap to save any tweet or article.
   - **Readwise's X (Twitter) integration** — connect your X account in Readwise so bookmarked/replied tweets sync automatically (Readwise → Settings → Integrations → Twitter).
2. Get your API token at <https://readwise.io/access_token> and set `READWISE_TOKEN`.
3. Optional controls (see `.env.example`):
   - `READWISE_LOCATIONS` — which Reader shelves to pull (`new,later,shortlist` by default).
   - `READWISE_TAG=kindle` — only send bookmarks you tag `kindle` in Reader (nice for curating exactly what goes to the device).
   - `READWISE_ARCHIVE_AFTER=true` — auto-archive each bookmark after it's sent, so nothing repeats. Left `false` by default; instead a `BOOKMARK_LOOKBACK_HOURS` window (30h) keeps daily runs from re-sending.
   - `MAX_BOOKMARKS` / `RELATED_PER_BOOKMARK` — cost and length knobs.

Each bookmark becomes its own Kindle chapter: **TL;DR (1–2 sentences) → clean rewrite → Related reading → link to the original.**

### 5. Run locally
```bash
cd marketing-brief
npm install
cp .env.example .env     # fill in values
npm run dry-run          # builds EPUB+HTML into out/, does NOT send
npm start                # builds and actually sends
```

### 6. Schedule on GitHub Actions (recommended)
The workflow [`.github/workflows/daily-brief.yml`](../.github/workflows/daily-brief.yml) runs daily at 11:00 UTC (7am ET) and on manual dispatch.

In the GitHub repo, add **Settings → Secrets and variables → Actions**:

Secrets: `ANTHROPIC_API_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`, `KINDLE_EMAIL`, `EMAIL_TO`, `READWISE_TOKEN`
Variables (optional): `BRIEF_MODEL`, `READWISE_LOCATIONS`, `READWISE_TAG`, `READWISE_ARCHIVE_AFTER`

Then trigger once via **Actions → Daily Marketing Brief → Run workflow** to test. The EPUB/HTML are uploaded as a build artifact every run.

> Note: this can't be fully test-run inside Claude Code's web sandbox because its network policy only allows package registries + Anthropic (live news fetches are blocked). The offline stages (render/EPUB) are validated; the fetch stages run for real on GitHub Actions, where outbound is open.

---

## The Economist

The Economist is **paywalled**, so its full text can't be auto-scraped (and doing so violates their ToS). This pipeline includes their **free RSS feeds** for headlines/summaries so you still see what they published. For full Economist reading, use one of these official routes with your subscription:

- **The Economist Kindle edition** — auto-delivers the full weekly issue to your Kindle every Friday (subscribe via Amazon / link your Economist account). This is the cleanest "full documents on Kindle" option.
- **Espresso** (daily) and the **Economist app** — best for daily reading on phone/tablet.
- To read a *specific* Economist article on Kindle, open it in the Economist app and use its share/print path, or paste the URL into a "Send to Kindle" tool while logged in via your browser extension.

If you want, I can wire an official Economist route in (e.g. include the weekly Kindle edition reminder in the brief, or a curated Economist section) — just say the word.

---

## Turnkey alternatives (no code)

If you'd rather not run a pipeline, these do most of this off the shelf:

- **[Readwise Reader](https://readwise.io/)** — save articles/feeds; **Automatic Kindle Delivery** sends a daily digest of everything in your library to Kindle (ad-free). Set the digest to *daily* and add RSS feeds for your topics.
- **[KTool](https://ktool.io/)** — subscribe to RSS feeds, it compiles a daily/weekly "magazine" and sends to Kindle.
- **[SendtoReader](https://sendtoreader.com/)** — RSS → full-text Kindle "Daily Digest."
- **[Push to Kindle](https://www.pushtokindle.com/)** / **[HushRead](https://hushread.app/)** — one-click single-article → ad-free Kindle.

The custom pipeline here exists because none of those do the **Claude clustering/summarization** across your exact topic set — that's the value-add.

---

## Recommended source set

- **Editorial (full text via RSS):** MarTech.org, Salesforce Ben, Marketing AI Institute, Adobe Blog.
- **Company/topic tracking (Google News queries):** the rest, defined in `config/sources.json`. Tune a query by editing its `query` string; mute one with `"enabled": false`.
- **Vendor primary sources** worth adding if you want first-party announcements: Salesforce Newsroom, Adobe Newsroom, Anthropic News, OpenAI Blog, Google "The Keyword", Braze/Writer/Jasper blogs. (Some lack RSS; the Google News queries already capture their news coverage.)
- **⚠️ `SIP`:** you said this is a Salesforce/Adobe product — please confirm the exact product name so I can target the query precisely (right now it's a broad `Salesforce OR Adobe "SIP"` search, which may be noisy).
