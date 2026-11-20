import type { Event, User } from "@prisma/client";
import { blockedIds, hostFilter } from "./safety";
import { db } from "./db";
import { myCommunityIds, visibleTo } from "./communities";

export function eligibleFor(event: Pick<Event, "audience">, user: Pick<User, "gender" | "lgbtq" | "vegan">): boolean {
  // (community-only access is checked separately with canSeeEvent)
  switch (event.audience) {
    case "women_only":
      return user.gender === "woman";
    case "lgbtq_only":
      return user.lgbtq;
    case "vegan_only":
      return user.vegan;
    default:
      return true;
  }
}

/** Accepted participants + the host. */
export function takenSpots(event: { participations: { status: string }[] }) {
  return 1 + event.participations.filter((p) => p.status === "accepted").length;
}

export function chatOpen(event: Pick<Event, "chatMode" | "startsAt">, now = new Date()) {
  const before = now < event.startsAt;
  return (
    event.chatMode === "both" || (event.chatMode === "before" && before) || (event.chatMode === "after" && !before)
  );
}

export const upcomingWhere = () => ({ status: "active", startsAt: { gt: new Date() } });

export type SurpriseReason =
  | { kind: "newCategory"; category: string }
  | { kind: "newComuna"; comuna: string }
  | { kind: "random" };

/**
 * "Sorpréndeme": pick an upcoming event the user can join that is as far as
 * possible from their usual bubble: categories they never joined and didn't
 * list as interests, outside their comuna, hosted by someone they've never met.
 * We pick randomly among the best-scoring candidates so it stays a surprise.
 */
export async function pickSurprise(user: User | null, excludeId?: string) {
  const [ids, blocked] = await Promise.all([myCommunityIds(user?.id), blockedIds(user?.id)]);
  const candidates = await db.event.findMany({
    where: { ...upcomingWhere(), ...visibleTo(ids), ...hostFilter(blocked), ...(excludeId ? { id: { not: excludeId } } : {}) },
    include: { participations: true },
  });

  let pool = candidates.filter((e) => takenSpots(e) < e.capacity);
  if (!user) {
    const e = pool[Math.floor(Math.random() * pool.length)];
    return e ? { event: e, reason: { kind: "random" } as SurpriseReason } : null;
  }

  // Also skip plans with someone I said I'd rather not meet again.
  const notAgain = await db.peerFeedback.findMany({ where: { fromId: user.id, meetAgain: false }, select: { toId: true } });
  const avoid = new Set([...blocked, ...notAgain.map((n) => n.toId)]);
  pool = pool.filter((e) => !avoid.has(e.hostId) && !e.participations.some((p) => p.status === "accepted" && avoid.has(p.userId)));
  pool = pool.filter((e) => e.hostId !== user.id && eligibleFor(e, user) && !e.participations.some((p) => p.userId === user.id));
  if (!pool.length) return null;

  const history = await db.participation.findMany({
    where: { userId: user.id, status: { in: ["accepted", "pending"] } },
    include: { event: { include: { participations: { where: { status: "accepted" } } } } },
  });
  const knownCategories = new Set([...user.interests.split(",").filter(Boolean), ...history.map((h) => h.event.category)]);
  const knownComunas = new Set([user.comuna, ...history.map((h) => h.event.comuna)].filter(Boolean));
  const knownPeople = new Set(history.flatMap((h) => [h.event.hostId, ...h.event.participations.map((p) => p.userId)]));

  const scored = pool.map((e) => {
    let score = Math.random(); // tie-breaker / serendipity
    if (!knownCategories.has(e.category)) score += 3;
    if (!knownComunas.has(e.comuna)) score += 1.5;
    if (!knownPeople.has(e.hostId)) score += 1;
    return { e, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 3);
  const { e } = top[Math.floor(Math.random() * top.length)];

  const reason: SurpriseReason = !knownCategories.has(e.category)
    ? { kind: "newCategory", category: e.category }
    : !knownComunas.has(e.comuna)
      ? { kind: "newComuna", comuna: e.comuna }
      : { kind: "random" };
  return { event: e, reason };
}
