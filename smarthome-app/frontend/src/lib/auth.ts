import jwt from 'jsonwebtoken';

const SECRET = process.env.SESSION_SECRET ?? 'dev-secret-change-in-prod';
const COOKIE_NAME = 'hearth_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function signSession(): string {
  return jwt.sign({ auth: true }, SECRET, { expiresIn: MAX_AGE });
}

export function verifySession(token: string): boolean {
  try {
    jwt.verify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}

export function sessionCookie(token: string): string {
  return `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${MAX_AGE}`;
}

export function clearCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`;
}

export { COOKIE_NAME };
