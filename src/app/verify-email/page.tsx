import { redirect } from "next/navigation";
import { resendVerification } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import ErrorNote from "@/components/ErrorNote";

export default async function VerifyEmail({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  const { error, sent } = await searchParams;
  const user = await requireUser("/verify-email");
  if (user.emailVerifiedAt && !error) redirect(user.verifiedAt ? "/" : "/verify");
  const { t } = await getT();
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-3xl font-extrabold">{t("verifyEmail.title")}</h1>
      <p className="mb-6 mt-2 text-sm text-muted">{t("verifyEmail.intro", { email: user.email })}</p>
      <ErrorNote error={error} />
      {sent && <p className="mb-4 rounded-xl bg-sea/10 px-4 py-3 text-sm text-sea">{t("verifyEmail.sent")}</p>}
      <form action={resendVerification} className="card space-y-3">
        <p className="text-sm text-muted">{t("verifyEmail.noEmail")}</p>
        <button className="btn-ghost w-full">{t("verifyEmail.resend")}</button>
      </form>
    </div>
  );
}
