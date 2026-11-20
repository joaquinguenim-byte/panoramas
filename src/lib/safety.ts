import { db } from "./db";

export const USER_REPORT_REASONS = ["harassment", "dating", "selling", "fake", "unsafe", "noshow", "other"] as const;

/** Everyone this person blocked or was blocked by. */
export async function blockedIds(userId: string | undefined | null): Promise<string[]> {
  if (!userId) return [];
  const rows = await db.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  });
  return [...new Set(rows.map((r) => (r.blockerId === userId ? r.blockedId : r.blockerId)))];
}

/** Prisma filter: hide plans hosted by blocked people (and by suspended people). */
export function hostFilter(blocked: string[]) {
  return { host: { suspendedAt: null, ...(blocked.length ? { id: { notIn: blocked } } : {}) } };
}

export async function audit(actorId: string, action: string, targetType: string, targetId: string, note = "") {
  await db.auditLog.create({ data: { actorId, action, targetType, targetId, note: note.slice(0, 500) } });
}
