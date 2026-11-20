import Link from "next/link";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/staff";
import { getT, formatDate, type MsgKey } from "@/lib/i18n";
import { moderate } from "@/app/actions";
import ErrorNote from "@/components/ErrorNote";

export const dynamic = "force-dynamic";

function Op({ op, id, label, danger, note }: { op: string; id: string; label: string; danger?: boolean; note?: string }) {
  return (
    <form action={moderate} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="op" value={op} />
      <input type="hidden" name="id" value={id} />
      {note && <input name="note" className="input w-48 py-1 text-sm" placeholder={note} />}
      <button className={`btn-ghost px-3 py-1 text-sm ${danger ? "text-red-700" : ""}`}>{label}</button>
    </form>
  );
}

export default async function Reports({ searchParams }: { searchParams: Promise<{ done?: string; error?: string }> }) {
  await requireStaff("/admin/reports");
  const { done, error } = await searchParams;
  const { t, locale } = await getT();
  const [userReports, eventReports, suspended] = await Promise.all([
    db.userReport.findMany({
      where: { status: "open" },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: {
        reported: { select: { id: true, name: true, email: true, suspendedAt: true, _count: { select: { reportsReceived: true } } } },
        reporter: { select: { name: true } },
      },
    }),
    db.report.findMany({
      where: { status: "open" },
      orderBy: { createdAt: "asc" },
      take: 200,
      include: { event: { select: { id: true, title: true, status: true, hostId: true } }, reporter: { select: { name: true } } },
    }),
    db.user.findMany({ where: { suspendedAt: { not: null } }, select: { id: true, name: true, email: true, suspendedAt: true, suspendReason: true } }),
  ]);
  // Group plan reports by plan.
  const byEvent = new Map<string, typeof eventReports>();
  for (const r of eventReports) byEvent.set(r.eventId, [...(byEvent.get(r.eventId) ?? []), r]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">{t("admin.reports")}</h1>
        <p className="mt-2 text-sm text-muted">{t("admin.reports.intro")}</p>
      </div>
      <ErrorNote error={error} />
      {done && <p className="rounded-xl bg-sea/10 px-4 py-3 text-sm text-sea">{t("admin.saved")}</p>}

      <section className="space-y-3">
        <h2 className="text-xl font-bold">{t("admin.reports.people", { n: userReports.length })}</h2>
        {userReports.length === 0 && <p className="text-sm text-muted">{t("admin.reports.none")}</p>}
        {userReports.map((r) => (
          <div key={r.id} className="card space-y-2 text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p>
                <Link href={`/users/${r.reported.id}`} className="font-bold hover:underline">
                  {r.reported.name}
                </Link>{" "}
                <span className="text-muted">({r.reported.email})</span>
                <span className="chip ml-2">{t("admin.reports.total", { n: r.reported._count.reportsReceived })}</span>
              </p>
              <span className="text-xs text-muted">{formatDate(r.createdAt, locale)}</span>
            </div>
            <p>
              <span className="chip">{t(`user.reason.${r.reason}` as MsgKey)}</span> {t("admin.reports.by", { name: r.reporter.name })}
              {r.eventId && (
                <>
                  {" · "}
                  <Link href={`/events/${r.eventId}`} className="underline">
                    {t("admin.reports.plan")}
                  </Link>
                </>
              )}
            </p>
            {r.details && <p className="whitespace-pre-line rounded-xl bg-sand p-3">{r.details}</p>}
            <div className="flex flex-wrap gap-2">
              <Op op="userReport.dismiss" id={r.id} label={t("admin.dismiss")} />
              {!r.reported.suspendedAt && <Op op="user.suspend" id={r.reported.id} label={t("admin.suspend")} danger note={t("admin.reasonPlaceholder")} />}
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">{t("admin.reports.plans", { n: byEvent.size })}</h2>
        {byEvent.size === 0 && <p className="text-sm text-muted">{t("admin.reports.none")}</p>}
        {[...byEvent.values()].map((list) => {
          const e = list[0].event;
          return (
            <div key={e.id} className="card space-y-2 text-sm">
              <p>
                <Link href={`/events/${e.id}`} className="font-bold hover:underline">
                  {e.title}
                </Link>
                <span className="chip ml-2">{t(`admin.status.${e.status}` as MsgKey)}</span>
                <span className="chip ml-2">{t("admin.reports.count", { n: list.length })}</span>
              </p>
              <ul className="space-y-1">
                {list.map((r) => (
                  <li key={r.id} className="rounded-xl bg-sand px-3 py-2">
                    <span className="font-semibold">{r.reporter.name}:</span> {r.reason}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <Op op="eventReports.dismiss" id={e.id} label={t("admin.dismiss")} />
                {e.status === "hidden" ? (
                  <Op op="event.restore" id={e.id} label={t("admin.restore")} />
                ) : (
                  <Op op="event.hide" id={e.id} label={t("admin.hide")} danger />
                )}
                <Op op="user.suspend" id={e.hostId} label={t("admin.suspendHost")} danger note={t("admin.reasonPlaceholder")} />
              </div>
            </div>
          );
        })}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">{t("admin.suspended", { n: suspended.length })}</h2>
        {suspended.map((u) => (
          <div key={u.id} className="card flex flex-wrap items-center justify-between gap-2 text-sm">
            <p>
              <span className="font-bold">{u.name}</span> <span className="text-muted">({u.email})</span>
              {u.suspendReason && <span className="block text-muted">{u.suspendReason}</span>}
            </p>
            <Op op="user.unsuspend" id={u.id} label={t("admin.unsuspend")} />
          </div>
        ))}
      </section>
    </div>
  );
}
