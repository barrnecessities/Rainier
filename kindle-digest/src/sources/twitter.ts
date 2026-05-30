import { DigestConfig, DigestItem } from "../types";

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

interface BookmarkResponse {
  data?: Array<{
    id: string;
    text: string;
    created_at?: string;
    author_id?: string;
    entities?: {
      urls?: Array<{ expanded_url: string; title?: string; description?: string }>;
    };
  }>;
}

interface UserResponse {
  data: { id: string; name: string; username: string };
}

async function refreshAccessToken(
  config: DigestConfig
): Promise<{ accessToken: string; refreshToken: string }> {
  const credentials = Buffer.from(
    `${config.twitterClientId}:${config.twitterClientSecret}`
  ).toString("base64");

  const res = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: config.twitterRefreshToken,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Twitter token refresh failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as TokenResponse;
  return { accessToken: data.access_token, refreshToken: data.refresh_token };
}

export async function fetchTwitterBookmarks(
  config: DigestConfig
): Promise<{ items: DigestItem[]; newRefreshToken: string }> {
  const { accessToken, refreshToken } = await refreshAccessToken(config);

  const userRes = await fetch("https://api.twitter.com/2/users/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!userRes.ok) throw new Error(`Twitter /users/me failed: ${userRes.status}`);
  const { data: user } = (await userRes.json()) as UserResponse;

  const params = new URLSearchParams({
    max_results: String(Math.min(config.maxItemsPerSource, 20)),
    "tweet.fields": "created_at,author_id,entities",
    expansions: "attachments.media_keys",
  });

  const bkRes = await fetch(
    `https://api.twitter.com/2/users/${user.id}/bookmarks?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!bkRes.ok) {
    const body = await bkRes.text();
    throw new Error(`Twitter bookmarks failed (${bkRes.status}): ${body}`);
  }

  const bkData = (await bkRes.json()) as BookmarkResponse;
  const tweets = bkData.data ?? [];

  const items: DigestItem[] = tweets.map((tweet) => {
    const expandedUrl = tweet.entities?.urls?.find(
      (u) => !u.expanded_url.includes("t.co")
    );
    const url =
      expandedUrl?.expanded_url ??
      `https://twitter.com/i/web/status/${tweet.id}`;

    return {
      source: "twitter" as const,
      title: expandedUrl?.title ?? tweet.text.slice(0, 100),
      url,
      description: expandedUrl?.description ?? tweet.text,
      publishedAt: tweet.created_at,
    };
  });

  return { items, newRefreshToken: refreshToken };
}
