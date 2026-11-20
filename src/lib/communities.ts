import type { Community, CommunityMember } from "@prisma/client";
import { db } from "./db";

export const COMMUNITY_KINDS = ["open", "closed"] as const;
export const WHO_CAN_POST = ["members", "admins"] as const;

export function slugify(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

/** Ids of communities where the user is an active member. */
export async function myCommunityIds(userId?: string | null): Promise<string[]> {
  if (!userId) return [];
  const rows = await db.communityMember.findMany({ where: { userId, status: "active" }, select: { communityId: true } });
  return rows.map((r) => r.communityId);
}

/** Prisma filter: plans this person is allowed to see. */
export function visibleTo(communityIds: string[]) {
  return { OR: [{ visibility: "public" }, { communityId: { in: communityIds } }] };
}

export function canSeeEvent(e: { visibility: string; communityId: string | null; hostId: string }, userId: string | undefined, communityIds: string[]) {
  return e.visibility === "public" || e.hostId === userId || (!!e.communityId && communityIds.includes(e.communityId));
}

export function canPost(c: Pick<Community, "whoCanPost">, m?: Pick<CommunityMember, "role" | "status"> | null) {
  if (!m || m.status !== "active") return false;
  return c.whoCanPost === "members" || m.role === "admin";
}

/** Communities where the user may publish plans. */
export async function postableCommunities(userId: string) {
  const rows = await db.communityMember.findMany({
    where: { userId, status: "active" },
    include: { community: true },
    orderBy: { community: { name: "asc" } },
  });
  return rows.filter((r) => canPost(r.community, r)).map((r) => r.community);
}
