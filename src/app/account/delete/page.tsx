import Link from "next/link";
import { deleteAccount } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import ErrorNote from "@/components/ErrorNote";

export default async function DeleteAccount({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  await requireUser("/account/delete");
  const { t } = await getT();
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-2 text-3xl font-extrabold">{t("account.deleteTitle")}</h1>
      <p className="mb-2 text-sm text-muted">{t("account.deleteIntro")}</p>
      <p className="mb-6 text-sm">
        <Link href="/account/export" className="font-semibold text-sea underline" prefetch={false}>
          {t("account.exportFirst")}
        </Link>
      </p>
      <ErrorNote error={error} />
      <form action={deleteAccount} className="card space-y-4">
        <div>
          <label className="label">{t("auth.password")}</label>
          <input className="input" name="password" type="password" required autoComplete="current-password" />
        </div>
        <div>
          <label className="label">{t("account.typeWord")}</label>
          <input className="input" name="confirm" required autoComplete="off" />
        </div>
        <button className="w-full rounded-full bg-red-700 px-4 py-2 font-semibold text-white">{t("account.deleteButton")}</button>
      </form>
    </div>
  );
}
