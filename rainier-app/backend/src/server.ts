import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth";
import { dashboardRouter } from "./routes/dashboard";
import { checklistRouter } from "./routes/checklist";
import { whoopRouter } from "./routes/whoop";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", authRouter);
app.use("/dashboard", dashboardRouter);
app.use("/checklist", checklistRouter);
app.use("/whoop", whoopRouter);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`Rainier API listening on :${port}`);
});
