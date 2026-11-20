import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import Link from "next/link";
import EventCard from "@/components/EventCard";

export const dynamic = "force-dynamic";

export default async function Mine() {
  const user = await requireUser("/me");
  const { t, locale } = await getT();
  const include = { host: { select: { name: true } }, participations: { select: { status: true } }, community: { select: { name: true } } };
  const [hosting, attending] = await Promise.all([
    db.event.findMany({ where: { hostId: user.id }, include, orderBy: { startsAt: "desc" } }),
    db.event.findMany({
      where: { participations: { some: { userId: user.id, status: { in: ["accepted", "pending"] } } } },
      include,
      orderBy: { startsAt: "desc" },
    }),
  ]);
  const Section = ({ title, list }: { title: string; list: typeof hosting }) => (
    <section>
      <h2 className="mb-3 text-xl font-bold">{title}</h2>
      {list.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((e) => (
            <EventCard key={e.id} e={e} t={t} locale={locale} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">{t("mine.empty")}</p>
      )}
    </section>
  );
  // Past plans (last 2 weeks) I was part of and haven't given feedback on.
  const twoWeeksAgo = new Date(Date.now() - 14 * 864e5);
  const toRate = await db.event.findMany({
    where: {
      status: "active",
      startsAt: { lt: new Date(), gt: twoWeeksAgo },
      OR: [{ hostId: user.id }, { participations: { some: { userId: user.id, status: "accepted" } } }],
      feedback: { none: { userId: user.id } },
      participations: { some: { status: "accepted" } },
    },
    select: { id: true, title: true },
    orderBy: { startsAt: "desc" },
  });
  return (
    <div className="space-y-8">
      {toRate.length > 0 && (
        <section className="card space-y-2 border-sun/40 bg-sun/5">
          <h2 className="font-bold">🙌 {t("feedback.pending")}</h2>
          {toRate.map((e) => (
            <Link key={e.id} href={`/events/${e.id}/feedback`} className="block text-sm font-semibold text-sun underline">
              {e.title}
            </Link>
          ))}
        </section>
      )}
      <Section title={t("mine.attending")} list={attending} />
      <Section title={t("mine.hosting")} list={hosting} />
    </div>
  );
}
