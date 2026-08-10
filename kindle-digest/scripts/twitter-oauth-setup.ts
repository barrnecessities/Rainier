import "dotenv/config";
import crypto from "crypto";
import http from "http";
import { URL } from "url";

const CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3333/callback";
const PORT = 3333;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET must be set in your .env file"
  );
  process.exit(1);
}

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function generateCodeVerifier(): string {
  return base64url(crypto.randomBytes(48));
}

function generateCodeChallenge(verifier: string): string {
  return base64url(crypto.createHash("sha256").update(verifier).digest());
}

async function exchangeCode(code: string, verifier: string): Promise<void> {
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const res = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
  };

  console.log("\n========================================");
  console.log("  Twitter OAuth Setup Complete!");
  console.log("========================================");
  console.log("\nAdd this as a GitHub Secret:");
  console.log(`  TWITTER_REFRESH_TOKEN = ${data.refresh_token}`);
  console.log("\nOr run:");
  console.log(`  echo "${data.refresh_token}" | gh secret set TWITTER_REFRESH_TOKEN`);
  console.log("\nScopes granted:", data.scope);
  console.log("========================================\n");
}

async function main(): Promise<void> {
  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);
  const state = base64url(crypto.randomBytes(16));

  const authUrl = new URL("https://twitter.com/i/oauth2/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", CLIENT_ID!);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("scope", "bookmark.read tweet.read users.read offline.access");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  console.log("\n========================================");
  console.log("  Twitter OAuth Setup");
  console.log("========================================");
  console.log("\nOpen this URL in your browser to authorize:\n");
  console.log(authUrl.toString());
  console.log("\nWaiting for callback on http://localhost:3333/callback ...\n");

  await new Promise<void>((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      if (!req.url?.startsWith("/callback")) return;

      const callbackUrl = new URL(req.url, `http://localhost:${PORT}`);
      const code = callbackUrl.searchParams.get("code");
      const returnedState = callbackUrl.searchParams.get("state");

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(
        "<html><body><h2>Authorization complete — you can close this tab.</h2></body></html>"
      );
      server.close();

      if (returnedState !== state) {
        reject(new Error("State mismatch — possible CSRF"));
        return;
      }
      if (!code) {
        reject(new Error("No code in callback"));
        return;
      }

      try {
        await exchangeCode(code, verifier);
        resolve();
      } catch (err) {
        reject(err);
      }
    });

    server.listen(PORT);
    server.on("error", reject);
  });
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
