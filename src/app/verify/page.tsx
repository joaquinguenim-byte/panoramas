import { verify } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import ErrorNote from "@/components/ErrorNote";

export default async function Verify({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const user = await requireUser("/verify");
  const { t } = await getT();
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-3xl font-extrabold">{t("verify.title")}</h1>
      <p className="mb-6 mt-2 text-sm text-muted">{t("verify.intro")}</p>
      <ErrorNote error={error} />
      {user.verifiedAt ? (
        <p className="card font-semibold text-sea">
          {t("verify.done")} · {user.idNumber}
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
          <button className="btn-primary w-full">{t("verify.submit")}</button>
        </form>
      )}
      <p className="mt-4 text-xs text-muted">{t("verify.stubNote")}</p>
    </div>
  );
}
