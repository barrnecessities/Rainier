import "dotenv/config";
import fs from "fs";
import path from "path";
import { DigestConfig, PreferencesConfig } from "./types";

export function loadConfig(): DigestConfig {
  const required = [
    "TWITTER_CLIENT_ID",
    "TWITTER_CLIENT_SECRET",
    "TWITTER_REFRESH_TOKEN",
    "NEWS_API_KEY",
    "ECONOMIST_SESSION_COOKIE",
    "ANTHROPIC_API_KEY",
    "GMAIL_USER",
    "GMAIL_APP_PASSWORD",
    "KINDLE_EMAIL",
  ];

  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return {
    twitterClientId: process.env.TWITTER_CLIENT_ID!,
    twitterClientSecret: process.env.TWITTER_CLIENT_SECRET!,
    twitterRefreshToken: process.env.TWITTER_REFRESH_TOKEN!,
    newsApiKey: process.env.NEWS_API_KEY!,
    economistSessionCookie: process.env.ECONOMIST_SESSION_COOKIE!,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
    gmailUser: process.env.GMAIL_USER!,
    gmailAppPassword: process.env.GMAIL_APP_PASSWORD!,
    kindleEmail: process.env.KINDLE_EMAIL!,
    maxItemsPerSource: Number(process.env.MAX_ITEMS_PER_SOURCE ?? "10"),
  };
}

export function loadPreferences(): PreferencesConfig {
  const prefsPath = path.join(__dirname, "..", "preferences.json");
  try {
    return JSON.parse(fs.readFileSync(prefsPath, "utf-8")) as PreferencesConfig;
  } catch {
    console.warn("Could not load preferences.json, using defaults");
    return {
      interests: [{ topic: "technology and AI", weight: 1.0 }],
      minScore: 5,
      maxArticlesTotal: 20,
      excludeKeywords: [],
      feedback: { enabled: true, historyDays: 14 },
    };
  }
}

export function loadHistory(historyDays: number): import("./types").HistoryEntry[][] {
  const historyDir = path.join(__dirname, "..", "history");
  const results: import("./types").HistoryEntry[][] = [];

  for (let i = 1; i <= historyDays; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const filePath = path.join(historyDir, `${dateStr}.json`);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      results.push(data);
    } catch {
      // no history for this day, skip
    }
  }

  return results;
}
