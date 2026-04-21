"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const store_1 = require("../lib/store");
const auth_1 = require("../lib/auth");
const schema = zod_1.z.object({ email: zod_1.z.string().email(), password: zod_1.z.string().min(6) });
exports.authRouter = (0, express_1.Router)();
exports.authRouter.post("/login", (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "Invalid payload" });
    const user = store_1.store.users.find((u) => u.email.toLowerCase() === parsed.data.email.toLowerCase());
    if (!user)
        return res.status(401).json({ error: "Invalid credentials" });
    const ok = bcryptjs_1.default.compareSync(parsed.data.password, user.passwordHash);
    if (!ok)
        return res.status(401).json({ error: "Invalid credentials" });
    const token = (0, auth_1.signToken)(user.id);
    return res.json({ token, user: { id: user.id, email: user.email } });
});
