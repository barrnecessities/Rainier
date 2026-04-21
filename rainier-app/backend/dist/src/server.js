"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = require("./routes/auth");
const dashboard_1 = require("./routes/dashboard");
const checklist_1 = require("./routes/checklist");
const whoop_1 = require("./routes/whoop");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", auth_1.authRouter);
app.use("/dashboard", dashboard_1.dashboardRouter);
app.use("/checklist", checklist_1.checklistRouter);
app.use("/whoop", whoop_1.whoopRouter);
const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
    console.log(`Rainier API listening on :${port}`);
});
