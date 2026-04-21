import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth";
import { store } from "../lib/store";

export const whoopRouter = Router();

whoopRouter.get("/connect", (_req, res) => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.WHOOP_CLIENT_ID ?? "",
    redirect_uri: process.env.WHOOP_REDIRECT_URI ?? "",
    scope: "read:recovery read:cycles read:sleep",
    state: "rainier-state"
  });
  const authUrl = `${process.env.WHOOP_AUTH_URL}?${params.toString()}`;
  res.redirect(authUrl);
});

whoopRouter.get("/callback", async (req, res) => {
  const code = String(req.query.code ?? "");
  if (!code) return res.status(400).send("Missing code");

  const tokenRes = await fetch(process.env.WHOOP_TOKEN_URL ?? "", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.WHOOP_CLIENT_ID ?? "",
      client_secret: process.env.WHOOP_CLIENT_SECRET ?? "",
      redirect_uri: process.env.WHOOP_REDIRECT_URI ?? ""
    })
  });

  if (!tokenRes.ok) return res.status(502).send("WHOOP token exchange failed");
  const payload = await tokenRes.json() as { access_token: string; refresh_token: string; expires_in: number };

  const user = store.users[0];
  user.whoop = {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + payload.expires_in * 1000
  };

  res.send("WHOOP connected. You can close this tab.");
});

whoopRouter.get("/status", requireAuth, (req: AuthedRequest, res) => {
  const user = store.users.find((u) => u.id === req.userId);
  return res.json({ connected: Boolean(user?.whoop), expiresAt: user?.whoop?.expiresAt ?? null });
});

whoopRouter.post("/refresh", requireAuth, async (req: AuthedRequest, res) => {
  const user = store.users.find((u) => u.id === req.userId);
  if (!user?.whoop) return res.status(400).json({ error: "WHOOP not connected" });

  const tokenRes = await fetch(process.env.WHOOP_TOKEN_URL ?? "", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: user.whoop.refreshToken,
      client_id: process.env.WHOOP_CLIENT_ID ?? "",
      client_secret: process.env.WHOOP_CLIENT_SECRET ?? ""
    })
  });
  if (!tokenRes.ok) return res.status(502).json({ error: "WHOOP refresh failed" });
  const payload = await tokenRes.json() as { access_token: string; refresh_token: string; expires_in: number };
  user.whoop = {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + payload.expires_in * 1000
  };
  return res.json({ ok: true, expiresAt: user.whoop.expiresAt });
});

whoopRouter.post("/ingest", requireAuth, (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const { recovery, strain, sleepPerformance } = req.body as { recovery: number; strain: number; sleepPerformance: number };
  if ([recovery, strain, sleepPerformance].some((value) => typeof value !== "number")) {
    return res.status(400).json({ error: "Invalid WHOOP metrics payload" });
  }
  const metrics = store.whoopMetricsByUser.get(userId) ?? [];
  metrics.unshift({ recovery, strain, sleepPerformance, capturedAt: new Date().toISOString() });
  store.whoopMetricsByUser.set(userId, metrics.slice(0, 30));
  return res.json({ ok: true });
});
