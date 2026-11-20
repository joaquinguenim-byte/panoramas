import Link from "next/link";
import { resetPassword } from "@/app/actions";
import { peekToken } from "@/lib/tokens";
import { getT } from "@/lib/i18n";
import ErrorNote from "@/components/ErrorNote";

export const dynamic = "force-dynamic";

export default async function ResetWithToken({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ token }, { error }] = await Promise.all([params, searchParams]);
  const { t } = await getT();
  const valid = await peekToken(token, "reset_password");
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-3xl font-extrabold">{t("reset.newTitle")}</h1>
      {!valid ? (
        <div className="card space-y-3 text-sm">
          <p>{t("error.badToken")}</p>
          <Link href="/reset" className="btn-primary">
            {t("reset.again")}
          </Link>
        </div>
      ) : (
        <>
          <ErrorNote error={error} />
          <form action={resetPassword} className="card space-y-4">
            <input type="hidden" name="token" value={token} />
            <div>
              <label className="label">{t("reset.newPassword")}</label>
              <input className="input" name="password" type="password" required minLength={8} autoComplete="new-password" />
            </div>
            <div>
              <label className="label">{t("reset.confirm")}</label>
              <input className="input" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
            </div>
            <button className="btn-primary w-full">{t("reset.save")}</button>
          </form>
        </>
      )}
    </div>
  );
}
