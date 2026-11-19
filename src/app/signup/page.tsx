import Link from "next/link";
import { signup } from "@/app/actions";
import { getT } from "@/lib/i18n";
import ErrorNote from "@/components/ErrorNote";

export default async function Signup({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { t } = await getT();
  const max = new Date();
  max.setFullYear(max.getFullYear() - 18);
  return (
    <div className="mx-auto max-w-sm">
      <p className="mb-1 text-sm font-semibold text-sun">{t("auth.step")}</p>
      <h1 className="text-3xl font-extrabold">{t("auth.signupTitle")}</h1>
      <p className="mb-6 mt-2 text-sm text-muted">{t("auth.friendsNotDating")}</p>
      <ErrorNote error={error} />
      <form action={signup} className="card space-y-4">
        <div>
          <label className="label">{t("auth.name")}</label>
          <input className="input" name="name" required minLength={2} autoComplete="given-name" />
        </div>
        <div>
          <label className="label">{t("auth.email")}</label>
          <input className="input" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <label className="label">{t("auth.password")}</label>
          <input className="input" name="password" type="password" required minLength={8} autoComplete="new-password" />
        </div>
        <div>
          <label className="label">{t("auth.birthDate")}</label>
          <input className="input" name="birthDate" type="date" required max={max.toISOString().slice(0, 10)} />
          <p className="mt-1 text-xs text-muted">{t("auth.adultOnly")}</p>
        </div>
        <button className="btn-primary w-full">{t("nav.signup")}</button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        {t("auth.haveAccount")}{" "}
        <Link href="/login" className="font-semibold text-sun">
          {t("nav.login")}
        </Link>
      </p>
    </div>
  );
}
