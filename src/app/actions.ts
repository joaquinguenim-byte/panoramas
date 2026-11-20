"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { checkPassword, createSession, destroySession, hashPassword, requireUser } from "@/lib/auth";
import { isAdult, nextVerifyStep, normalizeId, verifyIdentity, type IdType } from "@/lib/verification";
import { issueToken, consumeToken, peekToken } from "@/lib/tokens";
import { sendEmail, appUrl, layout } from "@/lib/email";
import { clientIp, hit } from "@/lib/rateLimit";
import { translator, type Locale } from "@/lib/i18n";
import { deleteIdDoc, saveIdDoc } from "@/lib/idDocs";
import { REJECT_REASONS, requireStaff } from "@/lib/staff";
import { audit, blockedIds, USER_REPORT_REASONS } from "@/lib/safety";
import { notify } from "@/lib/notify";
import { canPost, canSeeEvent, COMMUNITY_KINDS, myCommunityIds, slugify, WHO_CAN_POST } from "@/lib/communities";
import { checkContent, REPORT_HIDE_THRESHOLD } from "@/lib/moderation";
import { chatOpen, eligibleFor, takenSpots } from "@/lib/events";
import { chileLocalToDate } from "@/lib/time";
import { AUDIENCES, CATEGORIES, CHAT_MODES, COMUNAS, GENDERS, JOIN_MODES, MAX_CAPACITY, MIN_CAPACITY } from "@/lib/constants";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const oneOf = <T extends readonly string[]>(list: T, v: string, fallback: T[number]): T[number] =>
  (list as readonly string[]).includes(v) ? (v as T[number]) : fallback;
const safeNext = (n: string) => (n.startsWith("/") && !n.startsWith("//") ? n : "/");

function mustBeVerified(u: { emailVerifiedAt: Date | null; verifiedAt: Date | null }) {
  const step = nextVerifyStep(u);
  if (step) redirect(step);
}

function fail(path: string, error: string): never {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}error=${error}`);
}

async function sendVerificationEmail(user: { id: string; email: string; name: string; locale: string }) {
  const t = translator((user.locale === "en" ? "en" : "es") as Locale);
  const url = appUrl(`/verify-email/${await issueToken(user.id, "verify_email")}`);
  const paragraphs = [t("email.hi", { name: user.name }), t("email.verify.body")];
  await sendEmail({
    to: user.email,
    subject: t("email.verify.subject"),
    text: `${paragraphs.join("\n\n")}\n\n${url}\n\n${t("email.footer")}`,
    html: layout({ paragraphs, cta: { label: t("email.verify.cta"), url }, footer: t("email.footer") }),
  });
}

export async function signup(formData: FormData) {
  if (!(await hit("signupIp", await clientIp()))) fail("/signup", "tooMany");
  const email = s(formData, "email").toLowerCase();
  const password = s(formData, "password");
  const name = s(formData, "name");
  const birth = new Date(s(formData, "birthDate"));
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 200 || password.length < 8 || password.length > 200 || name.length < 2 || isNaN(+birth))
    fail("/signup", "generic");
  if (!isAdult(birth)) fail("/signup", "underage");
  if (await db.user.findUnique({ where: { email } })) fail("/signup", "emailTaken");
  const locale = (await cookies()).get("locale")?.value === "en" ? "en" : "es";
  const user = await db.user.create({
    data: { email, name: name.slice(0, 60), birthDate: birth, passwordHash: await hashPassword(password), locale },
  });
  await sendVerificationEmail(user).catch((e) => console.error("verification email failed", e));
  await createSession(user.id);
  redirect("/verify");
}

export async function login(formData: FormData) {
  const email = s(formData, "email").toLowerCase();
  const next = safeNext(s(formData, "next"));
  const ok = (await hit("loginIp", await clientIp())) && (await hit("loginEmail", email));
  if (!ok) fail(`/login?next=${encodeURIComponent(next)}`, "tooMany");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await checkPassword(s(formData, "password"), user.passwordHash))) fail(`/login?next=${encodeURIComponent(next)}`, "badLogin");
  if (user.suspendedAt) fail("/login", "suspended");
  await createSession(user.id);
  redirect(next);
}

export async function resendVerification() {
  const user = await requireUser("/verify-email");
  if (user.emailVerifiedAt) redirect("/verify");
  if (!(await hit("verifyEmailResend", user.id))) fail("/verify-email", "tooMany");
  await sendVerificationEmail(user);
  redirect("/verify-email?sent=1");
}

/** Always answers the same way so nobody can learn which emails have an account. */
export async function requestPasswordReset(formData: FormData) {
  const email = s(formData, "email").toLowerCase().slice(0, 200);
  if (!(await hit("resetIp", await clientIp()))) fail("/reset", "tooMany");
  const user = email && (await hit("resetEmail", email)) ? await db.user.findUnique({ where: { email } }) : null;
  if (user) {
    const t = translator((user.locale === "en" ? "en" : "es") as Locale);
    const url = appUrl(`/reset/${await issueToken(user.id, "reset_password")}`);
    const paragraphs = [t("email.hi", { name: user.name }), t("email.reset.body")];
    await sendEmail({
      to: user.email,
      subject: t("email.reset.subject"),
      text: `${paragraphs.join("\n\n")}\n\n${url}\n\n${t("email.reset.ignore")}`,
      html: layout({ paragraphs, cta: { label: t("email.reset.cta"), url }, footer: t("email.reset.ignore") }),
    }).catch((e) => console.error("reset email failed", e));
  }
  redirect("/reset?sent=1");
}

export async function resetPassword(formData: FormData) {
  const token = s(formData, "token");
  const password = s(formData, "password");
  if (password.length < 8 || password.length > 200) fail(`/reset/${token}`, "shortPassword");
  if (password !== s(formData, "confirm")) fail(`/reset/${token}`, "passwordMismatch");
  if (!(await peekToken(token, "reset_password"))) fail("/reset", "badToken");
  const userId = await consumeToken(token, "reset_password");
  if (!userId) fail("/reset", "badToken");
  await db.user.update({
    where: { id: userId },
    // Clicking the emailed link also proves the email address.
    data: { passwordHash: await hashPassword(password), emailVerifiedAt: new Date() },
  });
  await db.session.deleteMany({ where: { userId } }); // sign out everywhere else
  await createSession(userId);
  redirect("/profile?passwordReset=1");
}

export async function logoutEverywhere() {
  const user = await requireUser("/profile");
  await db.session.deleteMany({ where: { userId: user.id } });
  await destroySession();
  redirect("/login");
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function verify(formData: FormData) {
  const user = await requireUser("/verify");
  if (!(await hit("idUpload", user.id))) fail("/verify", "tooMany");
  const type = oneOf(["rut", "passport", "foreign_id"] as const, s(formData, "idType"), "rut") as IdType;
  const normalized = normalizeId(type, s(formData, "idNumber"));
  if (!normalized || !(await verifyIdentity(type, normalized))) fail("/verify", "badId");
  if (!isAdult(user.birthDate)) fail("/verify", "underage");
  const other = await db.user.findUnique({ where: { idNumber: normalized } });
  if (other && other.id !== user.id) fail("/verify", "idTaken");
  const doc = await saveIdDoc(user.id, formData.get("idDoc") as File | null);
  if (!doc.ok) fail("/verify", doc.error);
  if (user.idDocPath) await deleteIdDoc(user.idDocPath).catch(() => {}); // replaced after a rejection
  await db.user.update({
    where: { id: user.id },
    data: {
      idType: type,
      idNumber: normalized,
      idDocPath: doc.relPath,
      idDocUploadedAt: new Date(),
      idDocStatus: "pending_review",
      idDocReviewedAt: null,
      idDocReviewedById: null,
      idDocRejectReason: null,
      // PILOT: access is granted on upload; the document is reviewed afterwards.
      verifiedAt: new Date(),
    },
  });
  redirect("/profile?welcome=1");
}

/**
 * Staff decision on an uploaded ID document. Either way the photo is deleted
 * right after the decision: we only keep the outcome, not the image.
 * Rejecting removes access until the person uploads a new document.
 */
export async function reviewIdDoc(formData: FormData) {
  const staff = await requireStaff("/admin/verifications");
  const userId = s(formData, "userId");
  const decision = s(formData, "decision");
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target || target.idDocStatus !== "pending_review") redirect("/admin/verifications");
  const approve = decision === "approve";
  const reason = oneOf(REJECT_REASONS, s(formData, "reason"), "other");
  await db.user.update({
    where: { id: userId },
    data: {
      idDocStatus: approve ? "approved" : "rejected",
      idDocReviewedAt: new Date(),
      idDocReviewedById: staff.id,
      idDocRejectReason: approve ? null : reason,
      idDocPath: null,
      verifiedAt: approve ? (target.verifiedAt ?? new Date()) : null,
    },
  });
  if (target.idDocPath) await deleteIdDoc(target.idDocPath).catch((e) => console.error("ID doc delete failed", e));
  await audit(staff.id, approve ? "id.approve" : "id.reject", "user", userId, approve ? "" : reason);
  revalidatePath("/admin/verifications");
  redirect(`/admin/verifications?done=${approve ? "approved" : "rejected"}`);
}

export async function updateProfile(formData: FormData) {
  const user = await requireUser("/profile");
  const interests = formData
    .getAll("interests")
    .map(String)
    .filter((c) => (CATEGORIES as readonly string[]).includes(c));
  const bio = s(formData, "bio").slice(0, 500);
  const check = checkContent(bio);
  if (!check.ok) fail("/profile", `content.${check.rule}`);
  await db.user.update({
    where: { id: user.id },
    data: {
      name: s(formData, "name").slice(0, 60) || user.name,
      bio,
      comuna: oneOf(COMUNAS, s(formData, "comuna"), "Santiago Centro"),
      interests: interests.join(","),
      gender: oneOf(GENDERS, s(formData, "gender"), "unspecified"),
      lgbtq: formData.get("lgbtq") === "on",
      vegan: formData.get("vegan") === "on",
      contact: s(formData, "contact").slice(0, 120),
      emailNotifications: formData.get("emailNotifications") === "on",
    },
  });
  redirect("/profile?saved=1");
}

export async function createEvent(formData: FormData) {
  const user = await requireUser("/events/new");
  mustBeVerified(user);
  if (!(await hit("createEvent", user.id))) fail("/events/new", "tooMany");
  const title = s(formData, "title").slice(0, 100);
  const description = s(formData, "description").slice(0, 2000);
  const venue = s(formData, "venue").slice(0, 200);
  const costNote = s(formData, "costNote").slice(0, 200);
  const startsAt = chileLocalToDate(s(formData, "startsAt"));
  const capacity = Math.round(Number(s(formData, "capacity")));

  if (formData.get("pledge") !== "on" || formData.get("rules") !== "on") fail("/events/new", "pledge");
  if (title.length < 3 || description.length < 10 || !startsAt || !(capacity >= MIN_CAPACITY && capacity <= MAX_CAPACITY))
    fail("/events/new", "generic");
  if (startsAt <= new Date()) fail("/events/new", "past");
  const check = checkContent(title, description, venue, costNote);
  if (!check.ok) fail("/events/new", `content.${check.rule}`);

  let communityId: string | null = null;
  let visibility = "public";
  const cid = s(formData, "communityId");
  if (cid) {
    const m = await db.communityMember.findUnique({
      where: { communityId_userId: { communityId: cid, userId: user.id } },
      include: { community: true },
    });
    if (!m || !canPost(m.community, m)) fail("/events/new", "generic");
    communityId = cid;
    visibility = s(formData, "visibility") === "community" ? "community" : "public";
  }

  const event = await db.event.create({
    data: {
      hostId: user.id,
      title,
      description,
      venue,
      costNote,
      startsAt,
      capacity,
      category: oneOf(CATEGORIES, s(formData, "category"), "food"),
      comuna: oneOf(COMUNAS, s(formData, "comuna"), "Santiago Centro"),
      venuePublic: formData.get("venuePublic") === "on",
      joinMode: oneOf(JOIN_MODES, s(formData, "joinMode"), "review"),
      chatMode: oneOf(CHAT_MODES, s(formData, "chatMode"), "both"),
      audience: oneOf(AUDIENCES, s(formData, "audience"), "open"),
      shareContacts: formData.get("shareContacts") === "on",
      hostPledgeAt: new Date(),
      communityId,
      visibility,
    },
  });
  redirect(`/events/${event.id}`);
}

export async function joinEvent(formData: FormData) {
  const id = s(formData, "eventId");
  const user = await requireUser(`/events/${id}`);
  mustBeVerified(user);
  if (!(await hit("join", user.id))) fail(`/events/${id}`, "tooMany");
  const event = await db.event.findUnique({ where: { id }, include: { participations: true } });
  if (!event || event.status !== "active" || event.startsAt <= new Date() || event.hostId === user.id) fail(`/events/${id}`, "generic");
  if (!eligibleFor(event, user)) fail(`/events/${id}`, "generic");
  if (!canSeeEvent(event, user.id, await myCommunityIds(user.id))) fail(`/events/${id}`, "generic");
  if (takenSpots(event) >= event.capacity) fail(`/events/${id}`, "generic");
  const avoid = new Set(await blockedIds(user.id));
  if (avoid.has(event.hostId) || event.participations.some((p) => p.status === "accepted" && avoid.has(p.userId)))
    fail(`/events/${id}`, "blocked");
  const status = event.joinMode === "instant" ? "accepted" : "pending";
  const data = { status, note: s(formData, "note").slice(0, 300), viaSurprise: formData.get("surprise") === "1" };
  const before = event.participations.find((p) => p.userId === user.id);
  await db.participation.upsert({
    where: { eventId_userId: { eventId: id, userId: user.id } },
    create: { eventId: id, userId: user.id, ...data },
    update: data,
  });
  if (before?.status !== status) {
    const host = await db.user.findUnique({ where: { id: event.hostId } });
    if (host) await notify(status === "accepted" ? "joined" : "applied", host, event, { who: user.name.split(" ")[0] });
  }
  revalidatePath(`/events/${id}`);
  redirect(`/events/${id}`);
}

export async function leaveEvent(formData: FormData) {
  const id = s(formData, "eventId");
  const user = await requireUser(`/events/${id}`);
  await db.participation.updateMany({ where: { eventId: id, userId: user.id }, data: { status: "left" } });
  redirect(`/events/${id}`);
}

export async function decideApplication(formData: FormData) {
  const pid = s(formData, "participationId");
  const user = await requireUser();
  const p = await db.participation.findUnique({
    where: { id: pid },
    include: { event: { include: { participations: true } } },
  });
  if (!p || p.event.hostId !== user.id) redirect("/");
  const accept = s(formData, "decision") === "accept";
  if (accept && takenSpots(p.event) >= p.event.capacity) fail(`/events/${p.eventId}`, "generic");
  if (accept) {
    const avoid = new Set(await blockedIds(p.userId));
    if (avoid.has(user.id) || p.event.participations.some((o) => o.status === "accepted" && avoid.has(o.userId)))
      fail(`/events/${p.eventId}`, "blockedApplicant");
  }
  await db.participation.update({ where: { id: pid }, data: { status: accept ? "accepted" : "rejected" } });
  const applicant = await db.user.findUnique({ where: { id: p.userId } });
  if (applicant) await notify(accept ? "accepted" : "rejected", applicant, p.event);
  redirect(`/events/${p.eventId}`);
}

export async function cancelEvent(formData: FormData) {
  const id = s(formData, "eventId");
  const user = await requireUser();
  const { count } = await db.event.updateMany({ where: { id, hostId: user.id, status: "active" }, data: { status: "cancelled" } });
  if (count) {
    const event = await db.event.findUnique({
      where: { id },
      include: { participations: { where: { status: { in: ["accepted", "pending"] } }, include: { user: true } } },
    });
    if (event) await notify("cancelled", event.participations.map((p) => p.user), event);
  }
  redirect(`/events/${id}`);
}

export async function sendMessage(formData: FormData) {
  const id = s(formData, "eventId");
  const user = await requireUser(`/events/${id}`);
  const body = s(formData, "body").slice(0, 1000);
  if (!(await hit("message", user.id))) fail(`/events/${id}`, "tooMany");
  const event = await db.event.findUnique({ where: { id }, include: { participations: true } });
  if (!event || !body) redirect(`/events/${id}`);
  const member = event.hostId === user.id || event.participations.some((p) => p.userId === user.id && p.status === "accepted");
  if (!member || !chatOpen(event)) fail(`/events/${id}`, "generic");
  await db.message.create({ data: { eventId: id, userId: user.id, body } });
  redirect(`/events/${id}`);
}

export async function reportEvent(formData: FormData) {
  const id = s(formData, "eventId");
  const user = await requireUser(`/events/${id}`);
  const reason = s(formData, "reason").slice(0, 500) || "-";
  if (!(await hit("report", user.id))) fail(`/events/${id}`, "tooMany");
  await db.report.upsert({
    where: { eventId_reporterId: { eventId: id, reporterId: user.id } },
    create: { eventId: id, reporterId: user.id, reason },
    update: { reason },
  });
  const count = await db.report.count({ where: { eventId: id } });
  if (count >= REPORT_HIDE_THRESHOLD) await db.event.update({ where: { id }, data: { status: "hidden" } });
  redirect(`/events/${id}?reported=1`);
}

// ---------- Communities ----------

export async function createCommunity(formData: FormData) {
  const user = await requireUser("/communities/new");
  mustBeVerified(user);
  if (!(await hit("createCommunity", user.id))) fail("/communities/new", "tooMany");
  const name = s(formData, "name").slice(0, 80);
  const description = s(formData, "description").slice(0, 1000);
  if (name.length < 3 || description.length < 10) fail("/communities/new", "generic");
  const check = checkContent(name, description);
  if (!check.ok) fail("/communities/new", `content.${check.rule}`);
  let slug = slugify(name) || "comunidad";
  if (await db.community.findUnique({ where: { slug } })) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  const c = await db.community.create({
    data: {
      slug,
      name,
      description,
      kind: oneOf(COMMUNITY_KINDS, s(formData, "kind"), "open"),
      whoCanPost: oneOf(WHO_CAN_POST, s(formData, "whoCanPost"), "members"),
      createdById: user.id,
      members: { create: { userId: user.id, role: "admin", status: "active" } },
    },
  });
  redirect(`/communities/${c.slug}`);
}

export async function joinCommunity(formData: FormData) {
  const slug = s(formData, "slug");
  const user = await requireUser(`/communities/${slug}`);
  mustBeVerified(user);
  const c = await db.community.findUnique({ where: { slug } });
  if (!c) redirect("/communities");
  const status = c.kind === "open" ? "active" : "pending";
  const note = s(formData, "note").slice(0, 300);
  const existing = await db.communityMember.findUnique({ where: { communityId_userId: { communityId: c.id, userId: user.id } } });
  if (existing?.status === "active") redirect(`/communities/${slug}`);
  await db.communityMember.upsert({
    where: { communityId_userId: { communityId: c.id, userId: user.id } },
    create: { communityId: c.id, userId: user.id, status, note },
    update: { status, note, role: "member" },
  });
  redirect(`/communities/${slug}`);
}

export async function leaveCommunity(formData: FormData) {
  const slug = s(formData, "slug");
  const user = await requireUser(`/communities/${slug}`);
  const c = await db.community.findUnique({ where: { slug }, include: { members: true } });
  if (!c) redirect("/communities");
  const me = c.members.find((m) => m.userId === user.id);
  const otherAdmins = c.members.filter((m) => m.role === "admin" && m.status === "active" && m.userId !== user.id);
  if (me?.role === "admin" && otherAdmins.length === 0) fail(`/communities/${slug}`, "lastAdmin");
  await db.communityMember.deleteMany({ where: { communityId: c.id, userId: user.id } });
  redirect(`/communities/${slug}`);
}

/** Admin actions on a membership: accept / reject a request, make admin, remove. */
export async function manageMember(formData: FormData) {
  const user = await requireUser();
  const m = await db.communityMember.findUnique({ where: { id: s(formData, "memberId") }, include: { community: true } });
  if (!m) redirect("/communities");
  const me = await db.communityMember.findUnique({ where: { communityId_userId: { communityId: m.communityId, userId: user.id } } });
  if (me?.role !== "admin" || me.status !== "active" || m.userId === user.id) redirect(`/communities/${m.community.slug}`);
  const op = s(formData, "op");
  if (op === "accept") await db.communityMember.update({ where: { id: m.id }, data: { status: "active" } });
  else if (op === "reject") await db.communityMember.update({ where: { id: m.id }, data: { status: "rejected" } });
  else if (op === "admin") await db.communityMember.update({ where: { id: m.id }, data: { role: "admin" } });
  else if (op === "remove") await db.communityMember.delete({ where: { id: m.id } });
  redirect(`/communities/${m.community.slug}`);
}

// ---------- Safety: report and block people, delete account ----------

export async function reportUser(formData: FormData) {
  const reportedId = s(formData, "userId");
  const back = `/users/${reportedId}`;
  const user = await requireUser(back);
  if (reportedId === user.id) redirect(back);
  if (!(await hit("report", user.id))) fail(back, "tooMany");
  if (!(await db.user.findUnique({ where: { id: reportedId }, select: { id: true } }))) redirect("/");
  const data = {
    reason: oneOf(USER_REPORT_REASONS, s(formData, "reason"), "other"),
    details: s(formData, "details").slice(0, 1000),
    eventId: s(formData, "eventId") || null,
    status: "open",
    resolvedAt: null,
    resolvedById: null,
  };
  await db.userReport.upsert({
    where: { reportedId_reporterId: { reportedId, reporterId: user.id } },
    create: { reportedId, reporterId: user.id, ...data },
    update: data,
  });
  if (formData.get("alsoBlock") === "on") await doBlock(user.id, reportedId);
  redirect(`${back}?reported=1`);
}

async function doBlock(blockerId: string, blockedId: string) {
  await db.block.upsert({
    where: { blockerId_blockedId: { blockerId, blockedId } },
    create: { blockerId, blockedId },
    update: {},
  });
  const upcoming = { status: "active", startsAt: { gt: new Date() } };
  // Take the blocked person out of my upcoming plans, and me out of theirs.
  await db.participation.updateMany({
    where: { userId: blockedId, status: { in: ["pending", "accepted"] }, event: { hostId: blockerId, ...upcoming } },
    data: { status: "rejected" },
  });
  await db.participation.updateMany({
    where: { userId: blockerId, status: { in: ["pending", "accepted"] }, event: { hostId: blockedId, ...upcoming } },
    data: { status: "left" },
  });
}

export async function blockUser(formData: FormData) {
  const blockedId = s(formData, "userId");
  const user = await requireUser(`/users/${blockedId}`);
  if (blockedId !== user.id) await doBlock(user.id, blockedId);
  redirect(`/users/${blockedId}?blocked=1`);
}

export async function unblockUser(formData: FormData) {
  const blockedId = s(formData, "userId");
  const user = await requireUser(`/users/${blockedId}`);
  await db.block.deleteMany({ where: { blockerId: user.id, blockedId } });
  redirect(`/users/${blockedId}`);
}

/**
 * Deletes the account and personal data (Ley 19.628 / 21.719). Upcoming plans
 * the person hosts are cancelled first so attendees aren't left waiting.
 * Staff audit entries are kept, without personal data.
 */
export async function deleteAccount(formData: FormData) {
  const user = await requireUser("/account/delete");
  if (!(await checkPassword(s(formData, "password"), user.passwordHash))) fail("/account/delete", "badPassword");
  if (s(formData, "confirm").toUpperCase() !== "ELIMINAR" && s(formData, "confirm").toUpperCase() !== "DELETE")
    fail("/account/delete", "confirmWord");
  await db.event.updateMany({ where: { hostId: user.id, status: "active", startsAt: { gt: new Date() } }, data: { status: "cancelled" } });
  if (user.idDocPath) await deleteIdDoc(user.idDocPath).catch(() => {});
  await audit(user.id, "account.delete", "user", user.id);
  await destroySession();
  // Hosted events (past ones too) go with the account through the cascade.
  await db.user.delete({ where: { id: user.id } });
  redirect("/?deleted=1");
}

// ---------- Staff moderation ----------

export async function moderate(formData: FormData) {
  const staff = await requireStaff("/admin/reports");
  const op = s(formData, "op");
  const id = s(formData, "id");
  const note = s(formData, "note").slice(0, 500);
  const now = new Date();
  const resolved = (status: string) => ({ status, resolvedAt: now, resolvedById: staff.id });

  switch (op) {
    case "userReport.dismiss":
      await db.userReport.update({ where: { id }, data: resolved("dismissed") });
      await audit(staff.id, "report.dismiss", "userReport", id, note);
      break;
    case "eventReports.dismiss": // all open reports about one event
      await db.report.updateMany({ where: { eventId: id, status: "open" }, data: resolved("dismissed") });
      await audit(staff.id, "report.dismiss", "event", id, note);
      break;
    case "user.suspend": {
      const target = await db.user.findUnique({ where: { id } });
      if (!target || target.id === staff.id || target.role === "admin") fail("/admin/reports", "generic");
      await db.user.update({ where: { id }, data: { suspendedAt: now, suspendReason: note || null } });
      await db.session.deleteMany({ where: { userId: id } });
      await db.event.updateMany({ where: { hostId: id, status: "active", startsAt: { gt: now } }, data: { status: "cancelled" } });
      await db.userReport.updateMany({ where: { reportedId: id, status: "open" }, data: resolved("actioned") });
      await audit(staff.id, "user.suspend", "user", id, note);
      break;
    }
    case "user.unsuspend":
      await db.user.update({ where: { id }, data: { suspendedAt: null, suspendReason: null } });
      await audit(staff.id, "user.unsuspend", "user", id, note);
      break;
    case "event.hide":
      await db.event.update({ where: { id }, data: { status: "hidden" } });
      await db.report.updateMany({ where: { eventId: id, status: "open" }, data: resolved("actioned") });
      await audit(staff.id, "event.hide", "event", id, note);
      break;
    case "event.restore":
      await db.event.update({ where: { id }, data: { status: "active" } });
      await db.report.updateMany({ where: { eventId: id, status: "open" }, data: resolved("dismissed") });
      await audit(staff.id, "event.restore", "event", id, note);
      break;
    default:
      fail("/admin/reports", "generic");
  }
  revalidatePath("/admin/reports");
  redirect(`/admin/reports?done=1`);
}

// ---------- After the plan ----------

/** "¿Fuiste? ¿Te volverías a juntar?" Private: nobody sees what others said about them. */
export async function submitFeedback(formData: FormData) {
  const eventId = s(formData, "eventId");
  const back = `/events/${eventId}/feedback`;
  const user = await requireUser(back);
  const event = await db.event.findUnique({ where: { id: eventId }, include: { participations: { where: { status: "accepted" } } } });
  if (!event || event.startsAt > new Date()) redirect(`/events/${eventId}`);
  const people = [event.hostId, ...event.participations.map((p) => p.userId)];
  if (!people.includes(user.id)) redirect(`/events/${eventId}`);
  const attended = s(formData, "attended") !== "no";
  const comment = s(formData, "comment").slice(0, 1000);
  await db.eventFeedback.upsert({
    where: { eventId_userId: { eventId, userId: user.id } },
    create: { eventId, userId: user.id, attended, comment },
    update: { attended, comment },
  });
  if (attended) {
    for (const toId of people.filter((p) => p !== user.id)) {
      const v = s(formData, `meet_${toId}`);
      const data = { meetAgain: v === "yes" ? true : v === "no" ? false : null, noShow: v === "noshow" };
      await db.peerFeedback.upsert({
        where: { eventId_fromId_toId: { eventId, fromId: user.id, toId } },
        create: { eventId, fromId: user.id, toId, ...data },
        update: data,
      });
    }
  }
  redirect(`${back}?thanks=1`);
}
