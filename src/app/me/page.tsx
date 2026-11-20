import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
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
  return (
    <div className="space-y-8">
      <Section title={t("mine.attending")} list={attending} />
      <Section title={t("mine.hosting")} list={hosting} />
    </div>
  );
}
