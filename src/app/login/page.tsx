import Link from "next/link";
import { login } from "@/app/actions";
import { getT } from "@/lib/i18n";
import ErrorNote from "@/components/ErrorNote";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  const { t } = await getT();
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-3xl font-extrabold">{t("auth.loginTitle")}</h1>
      <ErrorNote error={error} />
      <form action={login} className="card space-y-4">
        <input type="hidden" name="next" value={next ?? "/"} />
        <div>
          <label className="label">{t("auth.email")}</label>
          <input className="input" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <label className="label">{t("auth.password")}</label>
          <input className="input" name="password" type="password" required autoComplete="current-password" />
        </div>
        <button className="btn-primary w-full">{t("nav.login")}</button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        {t("auth.noAccount")}{" "}
        <Link href="/signup" className="font-semibold text-sun">
          {t("nav.signup")}
        </Link>
      </p>
    </div>
  );
}
