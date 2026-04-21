"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const auth_1 = require("../lib/auth");
function requireAuth(req, res, next) {
    const auth = req.header("authorization");
    if (!auth?.startsWith("Bearer "))
        return res.status(401).send("Missing token");
    try {
        req.userId = (0, auth_1.verifyToken)(auth.slice(7));
        next();
    }
    catch {
        return res.status(401).send("Invalid token");
    }
}
