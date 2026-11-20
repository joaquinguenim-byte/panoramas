import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { getT, type MsgKey } from "@/lib/i18n";
import { blockUser, reportUser, unblockUser } from "@/app/actions";
import { USER_REPORT_REASONS } from "@/lib/safety";
import { isStaff } from "@/lib/staff";
import ErrorNote from "@/components/ErrorNote";

export const dynamic = "force-dynamic";

type SP = Promise<{ reported?: string; blocked?: string; error?: string; event?: string }>;

export default async function UserPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [{ t }, me] = await Promise.all([getT(), currentUser()]);
  if (!me) notFound(); // profiles are only for signed-in members
  const person = await db.user.findUnique({
    where: { id },
    select: { id: true, name: true, bio: true, comuna: true, verifiedAt: true, createdAt: true, suspendedAt: true, _count: { select: { hostedEvents: true } } },
  });
  if (!person || (person.suspendedAt && !isStaff(me))) notFound();
  const [iBlocked, theyBlocked] = await Promise.all([
    db.block.findUnique({ where: { blockerId_blockedId: { blockerId: me.id, blockedId: id } } }),
    db.block.findUnique({ where: { blockerId_blockedId: { blockerId: id, blockedId: me.id } } }),
  ]);
  if (theyBlocked && !iBlocked) notFound();
  const self = me.id === id;
  const firstName = person.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-md space-y-4">
      <ErrorNote error={sp.error} />
      <div className="card">
        <h1 className="text-2xl font-extrabold">{firstName}</h1>
        <p className="mt-1 text-sm text-muted">
          {person.comuna && <>📍 {person.comuna} · </>}
          {person.verifiedAt ? <span className="text-sea">{t("verify.done")}</span> : t("verify.pending")}
        </p>
        {!iBlocked && person.bio && <p className="mt-4 whitespace-pre-line">{person.bio}</p>}
        {!iBlocked && <p className="mt-4 text-xs text-muted">{t("user.hosted", { n: person._count.hostedEvents })}</p>}
      </div>

      {self ? (
        <Link href="/profile" className="btn-ghost">
          {t("nav.profile")}
        </Link>
      ) : iBlocked ? (
        <div className="card space-y-3 text-sm">
          {sp.reported && <p className="font-semibold">{t("user.reported")}</p>}
          <p>{t("user.youBlocked", { name: firstName })}</p>
          <form action={unblockUser}>
            <input type="hidden" name="userId" value={id} />
            <button className="btn-ghost">{t("user.unblock")}</button>
          </form>
        </div>
      ) : (
        <>
          {sp.reported ? (
            <p className="card text-sm">{t("user.reported")}</p>
          ) : (
            <details className="card text-sm">
              <summary className="cursor-pointer font-semibold">🚩 {t("user.report", { name: firstName })}</summary>
              <form action={reportUser} className="mt-3 space-y-3">
                <input type="hidden" name="userId" value={id} />
                {sp.event && <input type="hidden" name="eventId" value={sp.event} />}
                <select name="reason" className="input" required>
                  {USER_REPORT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {t(`user.reason.${r}` as MsgKey)}
                    </option>
                  ))}
                </select>
                <textarea name="details" className="input" maxLength={1000} placeholder={t("user.reportDetails")} />
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="alsoBlock" /> {t("user.alsoBlock")}
                </label>
                <button className="btn-primary">{t("user.sendReport")}</button>
                <p className="text-xs text-muted">{t("user.reportPrivate")}</p>
              </form>
            </details>
          )}
          <form action={blockUser} className="card space-y-2 text-sm">
            <input type="hidden" name="userId" value={id} />
            <p className="text-muted">{t("user.blockExplain", { name: firstName })}</p>
            <button className="btn-ghost text-red-700">⛔ {t("user.block")}</button>
          </form>
        </>
      )}
    </div>
  );
}
