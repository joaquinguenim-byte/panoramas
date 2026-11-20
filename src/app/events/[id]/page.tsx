import Link from "next/link";
import { nextVerifyStep } from "@/lib/verification";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { getT, formatDate, type MsgKey } from "@/lib/i18n";
import { chatOpen, eligibleFor, takenSpots } from "@/lib/events";
import { CATEGORY_EMOJI } from "@/lib/constants";
import { cancelEvent, decideApplication, joinEvent, leaveEvent, reportEvent, sendMessage } from "@/app/actions";
import ErrorNote from "@/components/ErrorNote";
import { canSeeEvent, myCommunityIds } from "@/lib/communities";
import { blockedIds } from "@/lib/safety";
import { isStaff } from "@/lib/staff";

export const dynamic = "force-dynamic";

type SP = Promise<{ surprise?: string; v?: string; error?: string; reported?: string }>;

export default async function EventPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [{ t, locale }, user] = await Promise.all([getT(), currentUser()]);
  const event = await db.event.findUnique({
    where: { id },
    include: {
      host: true,
      community: true,
      participations: { include: { user: true }, orderBy: { createdAt: "asc" } },
      messages: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!event || (event.status === "hidden" && event.hostId !== user?.id && !isStaff(user))) notFound();
  const blocked = new Set(await blockedIds(user?.id));
  if (blocked.has(event.hostId) || (event.host.suspendedAt && !isStaff(user))) notFound();
  const myIds = await myCommunityIds(user?.id);
  if (!canSeeEvent(event, user?.id, myIds)) {
    // Members-only plan: show only which community it belongs to.
    return (
      <div className="card mx-auto max-w-md text-center">
        <p className="text-4xl">🔒</p>
        <p className="mt-3">{t("event.visibility.community")}</p>
        {event.community && (
          <Link href={`/communities/${event.community.slug}`} className="btn-primary mt-5">
            👥 {event.community.name}
          </Link>
        )}
      </div>
    );
  }

  const isHost = user?.id === event.hostId;
  const mine = user ? event.participations.find((p) => p.userId === user.id) : undefined;
  const accepted = event.participations.filter((p) => p.status === "accepted");
  const pending = event.participations.filter((p) => p.status === "pending");
  const isMember = isHost || mine?.status === "accepted";
  const taken = takenSpots(event);
  const full = taken >= event.capacity;
  const past = event.startsAt <= new Date();
  const showVenue = event.venue && (event.venuePublic || isMember);
  const firstName = (n: string) => n.split(" ")[0];
  const Person = ({ u }: { u: { id: string; name: string } }) =>
    user && u.id !== user.id ? (
      <Link href={`/users/${u.id}?event=${event.id}`} className="hover:underline">
        {firstName(u.name)}
      </Link>
    ) : (
      <>{firstName(u.name)}</>
    );

  let surpriseReason = "";
  if (sp.surprise === "newCategory" && sp.v)
    surpriseReason = t("surprise.reason.newCategory", { category: t(`category.${sp.v}` as MsgKey) });
  else if (sp.surprise === "newComuna" && sp.v) surpriseReason = t("surprise.reason.newComuna", { comuna: sp.v });
  else if (sp.surprise) surpriseReason = t("surprise.reason.random");

  return (
    <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {surpriseReason && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-sun to-sun-dark px-5 py-4 text-white">
            <p className="font-semibold">✨ {t("surprise.banner", { reason: surpriseReason })}</p>
            <Link href={`/surprise?not=${event.id}`} className="rounded-full bg-white/20 px-3 py-1 text-sm hover:bg-white/30">
              🔀 {t("surprise.another")}
            </Link>
          </div>
        )}
        <ErrorNote error={sp.error} />

        <article className="card">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="chip">
              {CATEGORY_EMOJI[event.category]} {t(`category.${event.category}` as MsgKey)}
            </span>
            {event.audience !== "open" && (
              <span className="chip bg-sea/10 text-sea">{t(`audience.${event.audience}` as MsgKey)}</span>
            )}
            <span className="chip">{t(`joinMode.${event.joinMode}` as MsgKey)}</span>
          </div>
          {event.community && (
            <Link href={`/communities/${event.community.slug}`} className="mb-1 block text-sm font-semibold text-sea hover:underline">
              👥 {t("event.byCommunity", { name: event.community.name })}
              {event.visibility === "community" && <span className="ml-1 font-normal text-muted">· 🔒 {t("event.membersOnly")}</span>}
            </Link>
          )}
          <h1 className="text-3xl font-extrabold leading-tight">{event.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {user && !isHost ? (
              <Link href={`/users/${event.hostId}?event=${event.id}`} className="hover:underline">
                {t("event.host", { name: firstName(event.host.name) })}
              </Link>
            ) : (
              t("event.host", { name: firstName(event.host.name) })
            )}
          </p>
          {event.status === "cancelled" && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{t("event.cancelled")}</p>}
          <p className="mt-5 whitespace-pre-line">{event.description}</p>

          <dl className="mt-6 grid gap-4 border-t border-line pt-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">{t("event.when")}</dt>
              <dd className="font-semibold">{formatDate(event.startsAt, locale)}</dd>
            </div>
            <div>
              <dt className="text-muted">{t("event.area")}</dt>
              <dd className="font-semibold">📍 {event.comuna}</dd>
            </div>
            {event.venue && (
              <div>
                <dt className="text-muted">{t("event.venue")}</dt>
                <dd className="font-semibold">{showVenue ? event.venue : <span className="font-normal italic text-muted">🔒 {t("event.venueHidden")}</span>}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted">{t("event.costs")}</dt>
              <dd className="font-semibold">{event.costNote || t("event.noCosts")}</dd>
            </div>
          </dl>
        </article>

        {isMember && (
          <section id="chat" className="card">
            <h2 className="mb-3 font-bold">💬 {t("event.chat")}</h2>
            {event.chatMode === "none" || !chatOpen(event) ? (
              <p className="text-sm text-muted">{t("event.chatClosed")}</p>
            ) : (
              <>
                <ul className="mb-3 max-h-80 space-y-2 overflow-y-auto">
                  {event.messages.filter((m) => !blocked.has(m.userId)).map((m) => (
                    <li key={m.id} className={`rounded-xl px-3 py-2 text-sm ${m.userId === user?.id ? "ml-8 bg-sun/10" : "mr-8 bg-sand"}`}>
                      <span className="font-semibold">{firstName(m.user.name)}: </span>
                      {m.body}
                    </li>
                  ))}
                </ul>
                <form action={sendMessage} className="flex gap-2">
                  <input type="hidden" name="eventId" value={event.id} />
                  <input className="input" name="body" placeholder={t("event.chatPlaceholder")} required maxLength={1000} />
                  <button className="btn-primary">{t("event.chatSend")}</button>
                </form>
              </>
            )}
          </section>
        )}

        {isMember && event.shareContacts && (
          <section className="card">
            <h2 className="mb-1 font-bold">🤝 {t("event.contacts")}</h2>
            <p className="mb-3 text-xs text-muted">{t("event.contactsAfter")}</p>
            {past ? (
              <ul className="space-y-1 text-sm">
                {[event.host, ...accepted.map((p) => p.user)]
                  .filter((u) => u.contact && u.id !== user?.id)
                  .map((u) => (
                    <li key={u.id}>
                      <span className="font-semibold">{firstName(u.name)}</span> · {u.contact}
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">⏳</p>
            )}
          </section>
        )}
      </div>

      <aside className="space-y-4">
        <div className="card">
          <p className="text-2xl font-extrabold">{full ? t("event.full") : t("event.spots", { taken, total: event.capacity })}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand">
            <div className="h-full bg-sun" style={{ width: `${Math.min(100, (taken / event.capacity) * 100)}%` }} />
          </div>
          <div className="mt-4">
            <JoinArea />
          </div>
        </div>

        {isMember && (
          <div className="card">
            <h3 className="mb-2 font-bold">{t("event.attendees")}</h3>
            <ul className="space-y-1 text-sm">
              <li>
                ⭐ <Person u={event.host} />
              </li>
              {accepted.map((p) => (
                <li key={p.id}>• <Person u={p.user} /></li>
              ))}
            </ul>
          </div>
        )}

        {isHost && event.joinMode === "review" && (
          <div className="card">
            <h3 className="mb-2 font-bold">{t("event.applications")}</h3>
            {pending.length === 0 && <p className="text-sm text-muted">{t("event.noApplications")}</p>}
            <ul className="space-y-3">
              {pending.map((p) => (
                <li key={p.id} className="rounded-xl bg-sand p-3 text-sm">
                  <p className="font-semibold"><Person u={p.user} /></p>
                  {p.user.bio && <p className="text-muted">{p.user.bio}</p>}
                  {p.note && <p className="mt-1 italic">“{p.note}”</p>}
                  <div className="mt-2 flex gap-2">
                    {(["accept", "reject"] as const).map((d) => (
                      <form key={d} action={decideApplication}>
                        <input type="hidden" name="participationId" value={p.id} />
                        <input type="hidden" name="decision" value={d} />
                        <button className={d === "accept" ? "btn-primary px-3 py-1 text-sm" : "btn-ghost px-3 py-1 text-sm"}>
                          {t(d === "accept" ? "event.accept" : "event.reject")}
                        </button>
                      </form>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isMember && past && event.status === "active" && (
          <Link href={`/events/${event.id}/feedback`} className="btn-primary w-full">
            🙌 {t("feedback.title")}
          </Link>
        )}

        {isHost && event.status === "active" && !past && (
          <form action={cancelEvent}>
            <input type="hidden" name="eventId" value={event.id} />
            <button className="w-full text-sm text-muted underline">{t("event.cancel")}</button>
          </form>
        )}

        {user && !isHost && (
          <details className="text-sm text-muted">
            <summary className="cursor-pointer">🚩 {t("event.report")}</summary>
            {sp.reported ? (
              <p className="mt-2">{t("event.reported")}</p>
            ) : (
              <form action={reportEvent} className="mt-2 space-y-2">
                <input type="hidden" name="eventId" value={event.id} />
                <textarea name="reason" className="input text-sm" placeholder={t("event.reportReason")} required />
                <button className="btn-ghost px-3 py-1 text-sm">{t("event.report")}</button>
              </form>
            )}
          </details>
        )}
      </aside>
    </div>
  );

  function JoinArea() {
    if (event!.status === "cancelled") return <p className="text-sm text-muted">{t("event.cancelled")}</p>;
    if (isHost) return <p className="text-sm font-semibold text-sea">{t("event.isHost")}</p>;
    if (mine?.status === "accepted" || mine?.status === "pending")
      return (
        <div className="space-y-3">
          <p className={`text-sm font-semibold ${mine.status === "accepted" ? "text-sea" : ""}`}>{t(`event.status.${mine.status}` as MsgKey)}</p>
          {!past && (
            <form action={leaveEvent}>
              <input type="hidden" name="eventId" value={event!.id} />
              <button className="text-sm text-muted underline">{t("event.leave")}</button>
            </form>
          )}
        </div>
      );
    if (mine?.status === "rejected") return <p className="text-sm text-muted">{t("event.status.rejected")}</p>;
    if (past) return <p className="text-sm text-muted">{t("event.past")}</p>;
    if (!user)
      return (
        <Link href={`/login?next=/events/${event!.id}`} className="btn-primary w-full">
          {t("event.mustLogin")}
        </Link>
      );
    if (nextVerifyStep(user))
      return (
        <Link href={nextVerifyStep(user)!} className="btn-primary w-full">
          {t("event.mustVerify")}
        </Link>
      );
    if (!eligibleFor(event!, user))
      return <p className="text-sm text-muted">{t("event.notEligible", { audience: t(`audience.${event!.audience}` as MsgKey) })}</p>;
    if (full) return <p className="text-sm text-muted">{t("event.full")}</p>;
    return (
      <form action={joinEvent} className="space-y-3">
        <input type="hidden" name="eventId" value={event!.id} />
        {sp.surprise && <input type="hidden" name="surprise" value="1" />}
        {event!.joinMode === "review" && (
          <textarea name="note" className="input text-sm" placeholder={t("event.joinNote")} maxLength={300} />
        )}
        <button className="btn-primary w-full">{t(event!.joinMode === "instant" ? "event.joinInstant" : "event.joinReview")}</button>
      </form>
    );
  }
}
