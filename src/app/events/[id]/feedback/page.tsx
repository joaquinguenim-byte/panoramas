import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { submitFeedback } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function Feedback({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ thanks?: string }> }) {
  const [{ id }, { thanks }] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/events/${id}/feedback`);
  const { t } = await getT();
  const event = await db.event.findUnique({
    where: { id },
    include: {
      host: { select: { id: true, name: true } },
      participations: { where: { status: "accepted" }, include: { user: { select: { id: true, name: true } } } },
    },
  });
  if (!event) notFound();
  if (event.startsAt > new Date()) redirect(`/events/${id}`);
  const people = [event.host, ...event.participations.map((p) => p.user)];
  if (!people.some((p) => p.id === user.id)) notFound();
  const others = people.filter((p) => p.id !== user.id);
  const [mine, peers] = await Promise.all([
    db.eventFeedback.findUnique({ where: { eventId_userId: { eventId: id, userId: user.id } } }),
    db.peerFeedback.findMany({ where: { eventId: id, fromId: user.id } }),
  ]);
  const prev = new Map(peers.map((p) => [p.toId, p.noShow ? "noshow" : p.meetAgain === true ? "yes" : p.meetAgain === false ? "no" : "skip"]));
  const firstName = (n: string) => n.split(" ")[0];

  if (thanks)
    return (
      <div className="card mx-auto max-w-md text-center">
        <p className="text-4xl">🙌</p>
        <p className="mt-3 font-semibold">{t("feedback.thanks")}</p>
        <Link href="/surprise" className="btn-primary mt-5">
          ✨ {t("surprise.button")}
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl font-extrabold">{t("feedback.title")}</h1>
      <p className="mb-6 mt-2 text-sm text-muted">{event.title}</p>
      <form action={submitFeedback} className="card space-y-6">
        <input type="hidden" name="eventId" value={id} />
        <fieldset>
          <legend className="label">{t("feedback.attended")}</legend>
          <div className="flex gap-4">
            {(["yes", "no"] as const).map((v) => (
              <label key={v} className="flex items-center gap-2">
                <input type="radio" name="attended" value={v} defaultChecked={mine ? (mine.attended ? v === "yes" : v === "no") : v === "yes"} />
                {t(v === "yes" ? "feedback.yes" : "feedback.no")}
              </label>
            ))}
          </div>
        </fieldset>
        {others.length > 0 && (
          <fieldset className="space-y-3">
            <legend className="label">{t("feedback.meetAgain")}</legend>
            <p className="-mt-1 text-xs text-muted">{t("feedback.private")}</p>
            {others.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-sand px-3 py-2">
                <span className="font-semibold">{firstName(p.name)}</span>
                <select name={`meet_${p.id}`} className="input w-auto py-1 text-sm" defaultValue={prev.get(p.id) ?? "skip"}>
                  <option value="yes">{t("feedback.opt.yes")}</option>
                  <option value="no">{t("feedback.opt.no")}</option>
                  <option value="skip">{t("feedback.opt.skip")}</option>
                  <option value="noshow">{t("feedback.opt.noshow")}</option>
                </select>
              </div>
            ))}
          </fieldset>
        )}
        <div>
          <label className="label">{t("feedback.comment")}</label>
          <textarea name="comment" className="input min-h-20" maxLength={1000} defaultValue={mine?.comment ?? ""} />
          <p className="mt-1 text-xs text-muted">{t("feedback.commentHint")}</p>
        </div>
        <button className="btn-primary w-full">{t("feedback.send")}</button>
      </form>
    </div>
  );
}
