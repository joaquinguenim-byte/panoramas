import { createHash, randomBytes } from "crypto";
import { db } from "./db";

export type TokenPurpose = "verify_email" | "reset_password";
const TTL_MIN: Record<TokenPurpose, number> = { verify_email: 60 * 48, reset_password: 60 };

export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

/** Creates a one-time token and invalidates earlier unused ones for the same purpose. */
export async function issueToken(userId: string, purpose: TokenPurpose): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await db.authToken.updateMany({ where: { userId, purpose, usedAt: null }, data: { usedAt: new Date() } });
  await db.authToken.create({
    data: { id: hashToken(token), userId, purpose, expiresAt: new Date(Date.now() + TTL_MIN[purpose] * 60_000) },
  });
  return token;
}

/** Returns the token row if it is valid, without using it up. */
export async function peekToken(token: string, purpose: TokenPurpose) {
  if (!token || token.length > 100) return null;
  const row = await db.authToken.findUnique({ where: { id: hashToken(token) } });
  if (!row || row.purpose !== purpose || row.usedAt || row.expiresAt < new Date()) return null;
  return row;
}

/** Marks the token as used. Returns the user id, or null if it was invalid or already used. */
export async function consumeToken(token: string, purpose: TokenPurpose): Promise<string | null> {
  const row = await peekToken(token, purpose);
  if (!row) return null;
  // Conditional update so two concurrent clicks can't both succeed.
  const { count } = await db.authToken.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: new Date() } });
  return count === 1 ? row.userId : null;
}
