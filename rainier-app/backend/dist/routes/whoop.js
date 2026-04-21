"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whoopRouter = void 0;
const express_1 = require("express");
const requireAuth_1 = require("../middleware/requireAuth");
const store_1 = require("../lib/store");
exports.whoopRouter = (0, express_1.Router)();
exports.whoopRouter.get("/connect", (_req, res) => {
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
exports.whoopRouter.get("/callback", async (req, res) => {
    const code = String(req.query.code ?? "");
    if (!code)
        return res.status(400).send("Missing code");
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
    if (!tokenRes.ok)
        return res.status(502).send("WHOOP token exchange failed");
    const payload = await tokenRes.json();
    const user = store_1.store.users[0];
    user.whoop = {
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token,
        expiresAt: Date.now() + payload.expires_in * 1000
    };
    res.send("WHOOP connected. You can close this tab.");
});
exports.whoopRouter.get("/status", requireAuth_1.requireAuth, (req, res) => {
    const user = store_1.store.users.find((u) => u.id === req.userId);
    return res.json({ connected: Boolean(user?.whoop), expiresAt: user?.whoop?.expiresAt ?? null });
});
