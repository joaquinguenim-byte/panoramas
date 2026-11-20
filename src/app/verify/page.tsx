import { verify } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import ErrorNote from "@/components/ErrorNote";
import type { MsgKey } from "@/lib/i18n";

export default async function Verify({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const user = await requireUser("/verify");
  const { t } = await getT();
  return (
    <div className="mx-auto max-w-sm">
      {!user.verifiedAt && <p className="mb-1 text-sm font-semibold text-sun">{t("verify.step")}</p>}
      <h1 className="text-3xl font-extrabold">{t("verify.title")}</h1>
      <p className="mb-6 mt-2 text-sm text-muted">{t("verify.intro")}</p>
      <ErrorNote error={error} />
      {!user.verifiedAt && user.idDocStatus === "rejected" && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {t("verify.rejected", { reason: t(`admin.reason.${user.idDocRejectReason ?? "other"}` as MsgKey).toLowerCase() })}
        </p>
      )}
      {user.verifiedAt ? (
        <p className="card font-semibold text-sea">
          {t("verify.done")} · {user.idNumber}
          {user.idDocStatus === "pending_review" && <span className="mt-1 block text-xs font-normal text-muted">{t("verify.docPending")}</span>}
          {user.idDocStatus === "approved" && <span className="mt-1 block text-xs font-normal text-muted">{t("verify.docApproved")}</span>}
        </p>
      ) : (
        <form action={verify} className="card space-y-4">
          <div>
            <label className="label">{t("verify.type")}</label>
            <select name="idType" className="input">
              <option value="rut">{t("verify.type.rut")}</option>
              <option value="passport">{t("verify.type.passport")}</option>
              <option value="foreign_id">{t("verify.type.foreign_id")}</option>
            </select>
          </div>
          <div>
            <label className="label">{t("verify.number")}</label>
            <input className="input" name="idNumber" required placeholder="12.345.678-5" />
          </div>
          <div>
            <label className="label">{t("verify.doc")}</label>
            <input
              className="input file:mr-3 file:rounded-full file:border-0 file:bg-sun/10 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-sun"
              type="file"
              name="idDoc"
              required
              accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
              capture="environment"
            />
            <p className="mt-1 text-xs text-muted">{t("verify.docHint")}</p>
          </div>
          <button className="btn-primary w-full">{t("verify.submit")}</button>
        </form>
      )}
      <p className="mt-4 text-xs text-muted">{t("verify.stubNote")}</p>
    </div>
  );
}
