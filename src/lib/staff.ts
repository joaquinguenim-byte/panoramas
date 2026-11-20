import { notFound } from "next/navigation";
import { currentUser, requireUser } from "./auth";

export const STAFF_ROLES = ["moderator", "admin"] as const;
export const REJECT_REASONS = ["unreadable", "mismatch", "underage", "fake", "other"] as const;
export type RejectReason = (typeof REJECT_REASONS)[number];

export const isStaff = (u: { role: string } | null | undefined) => !!u && (STAFF_ROLES as readonly string[]).includes(u.role);

/** For staff pages and actions. Non-staff get a plain 404 so the area isn't advertised. */
export async function requireStaff(next = "/admin") {
  const u = await requireUser(next);
  if (!isStaff(u)) notFound();
  return u;
}

/** For route handlers, which can't redirect to login. */
export async function staffOrNull() {
  const u = await currentUser();
  return isStaff(u) ? u : null;
}
