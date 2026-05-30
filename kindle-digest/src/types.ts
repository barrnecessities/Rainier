export interface DigestItem {
  source: "twitter" | "hackernews" | "newsapi" | "economist";
  title: string;
  url: string;
  description?: string;
  fullContent?: string;
  summary?: string;
  score?: number;
  scoreReason?: string;
  author?: string;
  publishedAt?: string;
}

export interface Preference {
  topic: string;
  weight: number;
}

export interface PreferencesConfig {
  interests: Preference[];
  minScore: number;
  maxArticlesTotal: number;
  excludeKeywords: string[];
  feedback: {
    enabled: boolean;
    historyDays: number;
  };
}

export interface HistoryEntry {
  source: DigestItem["source"];
  title: string;
  url: string;
  score: number;
  scoreReason: string;
  userRating: number | null;
}

export interface DigestConfig {
  twitterClientId: string;
  twitterClientSecret: string;
  twitterRefreshToken: string;
  newsApiKey: string;
  economistSessionCookie: string;
  anthropicApiKey: string;
  gmailUser: string;
  gmailAppPassword: string;
  kindleEmail: string;
  maxItemsPerSource: number;
}
