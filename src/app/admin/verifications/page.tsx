import { db } from "@/lib/db";
import { requireStaff, REJECT_REASONS } from "@/lib/staff";
import { getT, formatDate, type MsgKey } from "@/lib/i18n";
import { ageOn } from "@/lib/verification";
import { reviewIdDoc } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function Verifications({ searchParams }: { searchParams: Promise<{ done?: string }> }) {
  await requireStaff("/admin/verifications");
  const { done } = await searchParams;
  const { t, locale } = await getT();
  const pending = await db.user.findMany({
    where: { idDocStatus: "pending_review" },
    orderBy: { idDocUploadedAt: "asc" },
    take: 50,
    select: { id: true, name: true, email: true, birthDate: true, idType: true, idNumber: true, idDocPath: true, idDocUploadedAt: true },
  });
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-extrabold">{t("admin.verifications")}</h1>
      <p className="mb-6 mt-2 text-sm text-muted">{t("admin.verifications.intro")}</p>
      {done && <p className="mb-4 rounded-xl bg-sea/10 px-4 py-3 text-sm text-sea">{t(`admin.done.${done}` as MsgKey)}</p>}
      {pending.length === 0 && <p className="text-sm text-muted">{t("admin.verifications.empty")}</p>}
      <div className="space-y-6">
        {pending.map((u) => {
          const src = `/admin/id-docs/${u.id}`;
          const isImage = u.idDocPath && /\.(jpg|png|webp)(\.enc)?$/.test(u.idDocPath);
          return (
            <section key={u.id} className="card space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-bold">{u.name}</h2>
                <span className="text-xs text-muted">{u.idDocUploadedAt && formatDate(u.idDocUploadedAt, locale)}</span>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <dt className="text-muted">{t("verify.type")}</dt>
                <dd>{u.idType && t(`verify.type.${u.idType}` as MsgKey)}</dd>
                <dt className="text-muted">{t("verify.number")}</dt>
                <dd className="font-mono">{u.idNumber}</dd>
                <dt className="text-muted">{t("admin.age")}</dt>
                <dd>{ageOn(u.birthDate)}</dd>
                <dt className="text-muted">Email</dt>
                <dd className="truncate">{u.email}</dd>
              </dl>
              {u.idDocPath ? (
                isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={t("verify.doc")} className="max-h-96 w-full rounded-xl border border-line object-contain" />
                ) : (
                  <a href={src} target="_blank" rel="noreferrer" className="btn-ghost inline-block">
                    {t("admin.openDoc")}
                  </a>
                )
              ) : (
                <p className="text-sm text-muted">{t("admin.noDoc")}</p>
              )}
              <p className="text-xs text-muted">{t("admin.checklist")}</p>
              <div className="flex flex-wrap items-end gap-3">
                <form action={reviewIdDoc}>
                  <input type="hidden" name="userId" value={u.id} />
                  <input type="hidden" name="decision" value="approve" />
                  <button className="btn-primary">{t("admin.approve")}</button>
                </form>
                <form action={reviewIdDoc} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="userId" value={u.id} />
                  <input type="hidden" name="decision" value="reject" />
                  <select name="reason" className="input w-auto">
                    {REJECT_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {t(`admin.reason.${r}` as MsgKey)}
                      </option>
                    ))}
                  </select>
                  <button className="btn-ghost text-red-700">{t("admin.reject")}</button>
                </form>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
