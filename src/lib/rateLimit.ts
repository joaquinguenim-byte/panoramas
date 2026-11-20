import { headers } from "next/headers";
import { db } from "./db";

/** Limits per action: [max hits, window in seconds]. */
export const LIMITS = {
  loginIp: [30, 15 * 60],
  loginEmail: [10, 15 * 60],
  signupIp: [10, 60 * 60],
  resetIp: [10, 60 * 60],
  resetEmail: [3, 60 * 60],
  verifyEmailResend: [5, 60 * 60],
  idUpload: [5, 24 * 60 * 60],
  createEvent: [10, 24 * 60 * 60],
  join: [30, 60 * 60],
  message: [60, 10 * 60],
  report: [20, 24 * 60 * 60],
  createCommunity: [5, 24 * 60 * 60],
} as const satisfies Record<string, readonly [number, number]>;
export type LimitName = keyof typeof LIMITS;

/** Best-effort client IP behind Vercel / a proxy. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/**
 * Records a hit and returns false when the limit for this key is exceeded.
 * Sliding window over stored hits; old rows are cleaned up now and then.
 */
export async function hit(name: LimitName, id: string): Promise<boolean> {
  const [max, windowSec] = LIMITS[name];
  const key = `${name}:${id}`;
  const since = new Date(Date.now() - windowSec * 1000);
  const n = await db.rateHit.count({ where: { key, createdAt: { gte: since } } });
  if (n >= max) return false;
  await db.rateHit.create({ data: { key } });
  if (Math.random() < 0.01) await db.rateHit.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 2 * 864e5) } } });
  return true;
}
