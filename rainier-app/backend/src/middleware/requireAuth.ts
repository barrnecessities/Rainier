import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/auth";

export type AuthedRequest = Request & { userId?: number };

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const auth = req.header("authorization");
  if (!auth?.startsWith("Bearer ")) return res.status(401).send("Missing token");
  try {
    req.userId = verifyToken(auth.slice(7));
    next();
  } catch {
    return res.status(401).send("Invalid token");
  }
}
