import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { store } from "../lib/store";
import { signToken } from "../lib/auth";

const schema = z.object({ email: z.string().email(), password: z.string().min(6) });
export const authRouter = Router();

authRouter.post("/login", (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const user = store.users.find((u) => u.email.toLowerCase() === parsed.data.email.toLowerCase());
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = bcrypt.compareSync(parsed.data.password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken(user.id);
  return res.json({ token, user: { id: user.id, email: user.email } });
});
