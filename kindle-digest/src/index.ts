import { loadConfig, loadHistory, loadPreferences } from "./config";
import { fetchTwitterBookmarks } from "./sources/twitter";
import { fetchHackerNews } from "./sources/hackernews";
import { fetchNewsApi } from "./sources/newsapi";
import { fetchEconomist } from "./sources/economist";
import { scoreAndFilterItems } from "./scorer";
import { summarizeItems } from "./summarizer";
import { renderDigest } from "./renderer";
import { sendDigest } from "./mailer";
import { writeHistory } from "./history";
import { DigestItem } from "./types";

async function main(): Promise<void> {
  const config = loadConfig();
  const prefs = loadPreferences();
  const history = prefs.feedback.enabled ? loadHistory(prefs.feedback.historyDays) : [];
  const now = new Date();

  console.log("Fetching sources...");
  const [twitterResult, hnResult, newsResult, economistResult] =
    await Promise.allSettled([
      fetchTwitterBookmarks(config),
      fetchHackerNews(config),
      fetchNewsApi(config),
      fetchEconomist(config),
    ]);

  const items: DigestItem[] = [];

  if (twitterResult.status === "fulfilled") {
    items.push(...twitterResult.value.items);
    const newToken = twitterResult.value.newRefreshToken;
    if (newToken && newToken !== config.twitterRefreshToken) {
      // Printed first so the workflow step captures it before any failure
      console.log(`NEW_TWITTER_REFRESH_TOKEN=${newToken}`);
    }
  } else {
    console.error("Twitter fetch failed:", twitterResult.reason);
  }

  if (hnResult.status === "fulfilled") {
    items.push(...hnResult.value);
  } else {
    console.error("Hacker News fetch failed:", hnResult.reason);
  }

  if (newsResult.status === "fulfilled") {
    items.push(...newsResult.value);
  } else {
    console.error("NewsAPI fetch failed:", newsResult.reason);
  }

  if (economistResult.status === "fulfilled") {
    items.push(...economistResult.value);
  } else {
    console.error("Economist fetch failed:", economistResult.reason);
  }

  if (items.length === 0) {
    throw new Error("All sources failed — nothing to send.");
  }

  console.log(`Fetched ${items.length} items. Scoring...`);
  const scored = await scoreAndFilterItems(items, config, prefs, history);
  console.log(`${scored.length} items passed scoring threshold. Summarizing...`);

  const summarized = await summarizeItems(scored, config);

  console.log("Rendering HTML...");
  const html = renderDigest(summarized, now);

  console.log("Sending to Kindle...");
  await sendDigest(html, now, config);

  if (prefs.feedback.enabled) {
    writeHistory(summarized, now);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
