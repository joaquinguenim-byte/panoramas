"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { checkPassword, createSession, destroySession, hashPassword, requireUser } from "@/lib/auth";
import { isAdult, normalizeId, verifyIdentity, type IdType } from "@/lib/verification";
import { saveIdDoc } from "@/lib/idDocs";
import { checkContent, REPORT_HIDE_THRESHOLD } from "@/lib/moderation";
import { chatOpen, eligibleFor, takenSpots } from "@/lib/events";
import { chileLocalToDate } from "@/lib/time";
import { AUDIENCES, CATEGORIES, CHAT_MODES, COMUNAS, GENDERS, JOIN_MODES, MAX_CAPACITY, MIN_CAPACITY } from "@/lib/constants";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const oneOf = <T extends readonly string[]>(list: T, v: string, fallback: T[number]): T[number] =>
  (list as readonly string[]).includes(v) ? (v as T[number]) : fallback;
const safeNext = (n: string) => (n.startsWith("/") && !n.startsWith("//") ? n : "/");

function fail(path: string, error: string): never {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}error=${error}`);
}

export async function signup(formData: FormData) {
  const email = s(formData, "email").toLowerCase();
  const password = s(formData, "password");
  const name = s(formData, "name");
  const birth = new Date(s(formData, "birthDate"));
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || name.length < 2 || isNaN(+birth)) fail("/signup", "generic");
  if (!isAdult(birth)) fail("/signup", "underage");
  if (await db.user.findUnique({ where: { email } })) fail("/signup", "emailTaken");
  const locale = (await cookies()).get("locale")?.value === "en" ? "en" : "es";
  const user = await db.user.create({
    data: { email, name, birthDate: birth, passwordHash: await hashPassword(password), locale },
  });
  await createSession(user.id);
  redirect("/verify");
}

export async function login(formData: FormData) {
  const email = s(formData, "email").toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await checkPassword(s(formData, "password"), user.passwordHash))) fail("/login", "badLogin");
  await createSession(user.id);
  redirect(safeNext(s(formData, "next")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function verify(formData: FormData) {
  const user = await requireUser("/verify");
  const type = oneOf(["rut", "passport", "foreign_id"] as const, s(formData, "idType"), "rut") as IdType;
  const normalized = normalizeId(type, s(formData, "idNumber"));
  if (!normalized || !(await verifyIdentity(type, normalized))) fail("/verify", "badId");
  if (!isAdult(user.birthDate)) fail("/verify", "underage");
  const other = await db.user.findUnique({ where: { idNumber: normalized } });
  if (other && other.id !== user.id) fail("/verify", "idTaken");
  const doc = await saveIdDoc(user.id, formData.get("idDoc") as File | null);
  if (!doc.ok) fail("/verify", doc.error);
  await db.user.update({
    where: { id: user.id },
    data: {
      idType: type,
      idNumber: normalized,
      idDocPath: doc.relPath,
      idDocUploadedAt: new Date(),
      idDocStatus: "pending_review",
      // PILOT: access is granted on upload; the document is reviewed afterwards.
      verifiedAt: new Date(),
    },
  });
  redirect("/profile?welcome=1");
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
    },
  });
  redirect("/profile?saved=1");
}

export async function createEvent(formData: FormData) {
  const user = await requireUser("/events/new");
  if (!user.verifiedAt) redirect("/verify");
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
    },
  });
  redirect(`/events/${event.id}`);
}

export async function joinEvent(formData: FormData) {
  const id = s(formData, "eventId");
  const user = await requireUser(`/events/${id}`);
  if (!user.verifiedAt) redirect("/verify");
  const event = await db.event.findUnique({ where: { id }, include: { participations: true } });
  if (!event || event.status !== "active" || event.startsAt <= new Date() || event.hostId === user.id) fail(`/events/${id}`, "generic");
  if (!eligibleFor(event, user)) fail(`/events/${id}`, "generic");
  if (takenSpots(event) >= event.capacity) fail(`/events/${id}`, "generic");
  const status = event.joinMode === "instant" ? "accepted" : "pending";
  const data = { status, note: s(formData, "note").slice(0, 300), viaSurprise: formData.get("surprise") === "1" };
  await db.participation.upsert({
    where: { eventId_userId: { eventId: id, userId: user.id } },
    create: { eventId: id, userId: user.id, ...data },
    update: data,
  });
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
  await db.participation.update({ where: { id: pid }, data: { status: accept ? "accepted" : "rejected" } });
  redirect(`/events/${p.eventId}`);
}

export async function cancelEvent(formData: FormData) {
  const id = s(formData, "eventId");
  const user = await requireUser();
  await db.event.updateMany({ where: { id, hostId: user.id }, data: { status: "cancelled" } });
  redirect(`/events/${id}`);
}

export async function sendMessage(formData: FormData) {
  const id = s(formData, "eventId");
  const user = await requireUser(`/events/${id}`);
  const body = s(formData, "body").slice(0, 1000);
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
  await db.report.upsert({
    where: { eventId_reporterId: { eventId: id, reporterId: user.id } },
    create: { eventId: id, reporterId: user.id, reason },
    update: { reason },
  });
  const count = await db.report.count({ where: { eventId: id } });
  if (count >= REPORT_HIDE_THRESHOLD) await db.event.update({ where: { id }, data: { status: "hidden" } });
  redirect(`/events/${id}?reported=1`);
}
