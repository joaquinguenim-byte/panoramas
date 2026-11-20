/**
 * Plan notifications by email. Each one is a short message with one button.
 * Sending never breaks the action that triggered it: failures are logged.
 * People can turn these off in their profile (User.emailNotifications);
 * security emails (verification, password reset) don't go through here.
 */
import { db } from "./db";
import { appUrl, layout, sendEmail } from "./email";
import { translator, formatDate, type Locale, type MsgKey } from "./i18n";

export type NotifyKind = "joined" | "applied" | "accepted" | "rejected" | "cancelled" | "reminder" | "feedback";

const CTA_PATH: Record<NotifyKind, (eventId: string) => string> = {
  joined: (id) => `/events/${id}`,
  applied: (id) => `/events/${id}`,
  accepted: (id) => `/events/${id}`,
  rejected: () => `/surprise`,
  cancelled: () => `/surprise`,
  reminder: (id) => `/events/${id}`,
  feedback: (id) => `/events/${id}/feedback`,
};

type Recipient = { id: string; email: string; name: string; locale: string; emailNotifications: boolean; suspendedAt?: Date | null };
type PlanInfo = { id: string; title: string; startsAt: Date; comuna: string };

export function buildNotification(kind: NotifyKind, to: Recipient, event: PlanInfo, vars: Record<string, string> = {}) {
  const locale = (to.locale === "en" ? "en" : "es") as Locale;
  const t = translator(locale);
  const all = { ...vars, title: event.title, when: formatDate(event.startsAt, locale), comuna: event.comuna, name: to.name.split(" ")[0] };
  const subject = t(`notify.${kind}.subject` as MsgKey, all);
  const paragraphs = [t("email.hi", { name: all.name }), t(`notify.${kind}.body` as MsgKey, all)];
  const url = appUrl(CTA_PATH[kind](event.id));
  const cta = { label: t(`notify.${kind}.cta` as MsgKey), url };
  const footer = `${t("email.footer")} · ${t("notify.optOut")}`;
  return {
    to: to.email,
    subject,
    text: `${paragraphs.join("\n\n")}\n\n${cta.label}: ${url}\n\n${footer}`,
    html: layout({ paragraphs, cta, footer }),
  };
}

export async function notify(kind: NotifyKind, to: Recipient | Recipient[], event: PlanInfo, vars: Record<string, string> = {}) {
  const list = (Array.isArray(to) ? to : [to]).filter((r) => r.emailNotifications && !r.suspendedAt);
  await Promise.all(
    list.map((r) => sendEmail(buildNotification(kind, r, event, vars)).catch((e) => console.error(`notify ${kind} to ${r.id} failed`, e))),
  );
}

const HOUR = 3600_000;

/**
 * Run from the cron endpoint (every 15 min or hourly):
 *  - reminder ~24 h before each plan, to accepted people and the host;
 *  - "¿Cómo estuvo?" ~3 h after it started.
 * Timestamps on Participation / Event make every send happen once.
 */
export async function runScheduledNotifications(now = new Date()) {
  const counts = { reminders: 0, feedback: 0 };
  const recipient = { id: true, email: true, name: true, locale: true, emailNotifications: true, suspendedAt: true } as const;

  const soon = await db.event.findMany({
    where: { status: "active", startsAt: { gt: now, lte: new Date(+now + 24 * HOUR) } },
    include: {
      host: { select: recipient },
      participations: { where: { status: "accepted", remindedAt: null }, include: { user: { select: recipient } } },
    },
  });
  for (const e of soon) {
    const people = e.participations.map((p) => p.user);
    if (!e.hostRemindedAt && people.length) {
      await notify("reminder", e.host, e);
      await db.event.update({ where: { id: e.id }, data: { hostRemindedAt: now } });
      counts.reminders++;
    }
    if (e.participations.length) {
      await notify("reminder", people, e);
      await db.participation.updateMany({ where: { id: { in: e.participations.map((p) => p.id) } }, data: { remindedAt: now } });
      counts.reminders += people.length;
    }
  }

  const done = await db.event.findMany({
    where: { status: "active", startsAt: { lte: new Date(+now - 3 * HOUR), gt: new Date(+now - 7 * 24 * HOUR) } },
    include: {
      host: { select: recipient },
      participations: { where: { status: "accepted" }, include: { user: { select: recipient } } },
    },
  });
  for (const e of done) {
    if (!e.participations.length) continue; // nobody came: nothing to ask
    const ask = e.participations.filter((p) => !p.feedbackAskedAt);
    if (ask.length) {
      await notify("feedback", ask.map((p) => p.user), e);
      await db.participation.updateMany({ where: { id: { in: ask.map((p) => p.id) } }, data: { feedbackAskedAt: now } });
      counts.feedback += ask.length;
    }
    if (!e.hostFeedbackAskedAt) {
      await notify("feedback", e.host, e);
      await db.event.update({ where: { id: e.id }, data: { hostFeedbackAskedAt: now } });
      counts.feedback++;
    }
  }
  return counts;
}
