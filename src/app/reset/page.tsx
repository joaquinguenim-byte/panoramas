import { requestPasswordReset } from "@/app/actions";
import { getT } from "@/lib/i18n";
import ErrorNote from "@/components/ErrorNote";

export default async function Reset({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  const { error, sent } = await searchParams;
  const { t } = await getT();
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-2 text-3xl font-extrabold">{t("reset.title")}</h1>
      <p className="mb-6 text-sm text-muted">{t("reset.intro")}</p>
      <ErrorNote error={error} />
      {sent ? (
        <p className="card text-sm">{t("reset.sent")}</p>
      ) : (
        <form action={requestPasswordReset} className="card space-y-4">
          <div>
            <label className="label">{t("auth.email")}</label>
            <input className="input" name="email" type="email" required autoComplete="email" />
          </div>
          <button className="btn-primary w-full">{t("reset.send")}</button>
        </form>
      )}
    </div>
  );
}
