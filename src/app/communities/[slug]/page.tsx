import Link from "next/link";
import { blockedIds, hostFilter } from "@/lib/safety";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { getT, type MsgKey } from "@/lib/i18n";
import { canPost } from "@/lib/communities";
import { upcomingWhere } from "@/lib/events";
import { joinCommunity, leaveCommunity, manageMember } from "@/app/actions";
import EventCard from "@/components/EventCard";
import ErrorNote from "@/components/ErrorNote";

export const dynamic = "force-dynamic";

export default async function CommunityPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ slug }, { error }] = await Promise.all([params, searchParams]);
  const [{ t, locale }, user] = await Promise.all([getT(), currentUser()]);
  const c = await db.community.findUnique({
    where: { slug },
    include: { members: { include: { user: { select: { name: true, bio: true } } }, orderBy: { createdAt: "asc" } } },
  });
  if (!c) notFound();

  const me = user ? c.members.find((m) => m.userId === user.id) : undefined;
  const isMember = me?.status === "active";
  const isAdmin = isMember && me?.role === "admin";
  const active = c.members.filter((m) => m.status === "active");
  const pending = c.members.filter((m) => m.status === "pending");
  const events = await db.event.findMany({
    where: { ...upcomingWhere(), ...hostFilter(await blockedIds(user?.id)), communityId: c.id, ...(isMember ? {} : { visibility: "public" }) },
    include: { host: { select: { name: true } }, participations: { select: { status: true } }, community: { select: { name: true } } },
    orderBy: { startsAt: "asc" },
  });
  const firstName = (n: string) => n.split(" ")[0];

  return (
    <div className="space-y-6">
      <ErrorNote error={error} />
      <section className="relative overflow-hidden rounded-3xl bg-ink px-6 py-8 text-white sm:px-10">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sea/50 blur-3xl" />
        <div className="relative">
          <div className="mb-3 flex flex-wrap gap-2 text-xs">
            <span className="chip bg-white/15 text-white">
              {c.kind === "closed" ? "🔒" : "🌐"} {t(`comm.kind.${c.kind}` as MsgKey)} · {t(`comm.kindHint.${c.kind}` as MsgKey)}
            </span>
            <span className="chip bg-white/15 text-white">👥 {t("comm.members", { n: active.length })}</span>
          </div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">{c.name}</h1>
          <p className="mt-3 max-w-2xl whitespace-pre-line text-white/80">{c.description}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {isMember ? (
              <>
                <span className="chip bg-sun text-white">{t(isAdmin ? "comm.isAdmin" : "comm.isMember")}</span>
                {canPost(c, me) && (
                  <Link href={`/events/new?community=${c.id}`} className="btn-primary">
                    ＋ {t("comm.newPlan")}
                  </Link>
                )}
              </>
            ) : me?.status === "pending" ? (
              <span className="chip bg-white/15 text-white">⏳ {t("comm.pending")}</span>
            ) : !user ? (
              <Link href={`/login?next=/communities/${c.slug}`} className="btn-primary">
                {t(c.kind === "open" ? "comm.join" : "comm.request")}
              </Link>
            ) : (
              <form action={joinCommunity} className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
                <input type="hidden" name="slug" value={c.slug} />
                {c.kind === "closed" && <input name="note" className="input text-ink" placeholder={t("comm.requestNote")} maxLength={300} />}
                <button className="btn-primary whitespace-nowrap">{t(c.kind === "open" ? "comm.join" : "comm.request")}</button>
              </form>
            )}
          </div>
          {me?.status === "rejected" && <p className="mt-2 text-sm text-white/70">{t("comm.rejected")}</p>}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <section>
          <h2 className="mb-3 text-xl font-bold">{t("comm.plans")}</h2>
          {c.kind === "closed" && !isMember && <p className="mb-3 text-sm text-muted">🔒 {t("comm.closedNotice")}</p>}
          {events.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {events.map((e) => (
                <EventCard key={e.id} e={e} t={t} locale={locale} />
              ))}
            </div>
          ) : (
            <p className="card text-sm text-muted">{t("comm.noPlans")}</p>
          )}
        </section>

        <aside className="space-y-4">
          {isAdmin && (
            <div className="card">
              <h3 className="mb-2 font-bold">{t("comm.requests")}</h3>
              {pending.length === 0 && <p className="text-sm text-muted">{t("comm.noRequests")}</p>}
              <ul className="space-y-3">
                {pending.map((m) => (
                  <li key={m.id} className="rounded-xl bg-sand p-3 text-sm">
                    <p className="font-semibold">{m.user.name}</p>
                    {m.note && <p className="italic">“{m.note}”</p>}
                    <div className="mt-2 flex gap-2">
                      {(["accept", "reject"] as const).map((op) => (
                        <form key={op} action={manageMember}>
                          <input type="hidden" name="memberId" value={m.id} />
                          <input type="hidden" name="op" value={op} />
                          <button className={op === "accept" ? "btn-primary px-3 py-1 text-sm" : "btn-ghost px-3 py-1 text-sm"}>
                            {t(op === "accept" ? "event.accept" : "event.reject")}
                          </button>
                        </form>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(isMember || c.kind === "open") && (
            <div className="card">
              <h3 className="mb-2 font-bold">{t("comm.memberList")}</h3>
              <ul className="space-y-2 text-sm">
                {active.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2">
                    <span>
                      {isMember ? m.user.name : firstName(m.user.name)}
                      {m.role === "admin" && <span className="ml-1 text-xs text-sun">· {t("comm.admin")}</span>}
                    </span>
                    {isAdmin && m.userId !== user?.id && (
                      <span className="flex gap-2 text-xs">
                        {m.role !== "admin" && (
                          <form action={manageMember}>
                            <input type="hidden" name="memberId" value={m.id} />
                            <input type="hidden" name="op" value="admin" />
                            <button className="text-muted underline">{t("comm.makeAdmin")}</button>
                          </form>
                        )}
                        <form action={manageMember}>
                          <input type="hidden" name="memberId" value={m.id} />
                          <input type="hidden" name="op" value="remove" />
                          <button className="text-muted underline">{t("comm.remove")}</button>
                        </form>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {me && (me.status === "active" || me.status === "pending") && (
            <form action={leaveCommunity} className="text-center">
              <input type="hidden" name="slug" value={c.slug} />
              <button className="text-sm text-muted underline">{t("comm.leave")}</button>
            </form>
          )}
          <p className="text-xs text-muted">{t("comm.officialNote")}</p>
        </aside>
      </div>
    </div>
  );
}
