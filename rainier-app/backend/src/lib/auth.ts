import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET ?? "dev_secret_change_me";

export function signToken(userId: number) {
  return jwt.sign({ sub: userId }, secret, { expiresIn: "7d" });
}

export function verifyToken(token: string): number {
  const payload = jwt.verify(token, secret);
  if (typeof payload !== "object" || payload === null || typeof payload.sub !== "number") {
    throw new Error("Invalid token payload");
  }
  return payload.sub;
}
