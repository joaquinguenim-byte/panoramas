import Link from "next/link";
import { createCommunity } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { getT, type MsgKey } from "@/lib/i18n";
import { COMMUNITY_KINDS, WHO_CAN_POST } from "@/lib/communities";
import ErrorNote from "@/components/ErrorNote";

export default async function NewCommunity({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const user = await requireUser("/communities/new");
  const { t } = await getT();
  if (!user.verifiedAt)
    return (
      <div className="card mx-auto max-w-md text-center">
        <p>{t("create.mustVerify")}</p>
        <Link href="/verify" className="btn-primary mt-4">
          {t("verify.title")}
        </Link>
      </div>
    );
  const Radio = ({ name, values, prefix, def, hint }: { name: string; values: readonly string[]; prefix: string; def: string; hint?: string }) => (
    <div className="grid gap-2 sm:grid-cols-2">
      {values.map((v) => (
        <label key={v} className="cursor-pointer">
          <input type="radio" name={name} value={v} defaultChecked={v === def} className="peer sr-only" />
          <span className="block rounded-xl border border-line bg-white px-4 py-3 peer-checked:border-ink peer-checked:ring-2 peer-checked:ring-ink/10">
            <span className="font-semibold">{t(`${prefix}.${v}` as MsgKey)}</span>
            {hint && <span className="block text-xs text-muted">{t(`${hint}.${v}` as MsgKey)}</span>}
          </span>
        </label>
      ))}
    </div>
  );
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-3xl font-extrabold">{t("comm.create")}</h1>
      <ErrorNote error={error} />
      <form action={createCommunity} className="card space-y-5">
        <div>
          <label className="label">{t("comm.fName")}</label>
          <input className="input" name="name" required minLength={3} maxLength={80} placeholder="CFA Society Chile" />
        </div>
        <div>
          <label className="label">{t("comm.fDescription")}</label>
          <textarea className="input min-h-24" name="description" required minLength={10} maxLength={1000} />
        </div>
        <div>
          <p className="label">{t("comm.fKind")}</p>
          <Radio name="kind" values={COMMUNITY_KINDS} prefix="comm.kind" hint="comm.kindHint" def="open" />
        </div>
        <div>
          <p className="label">{t("comm.fWho")}</p>
          <Radio name="whoCanPost" values={WHO_CAN_POST} prefix="comm.who" def="members" />
        </div>
        <button className="btn-primary w-full">{t("comm.create")}</button>
        <p className="text-center text-xs text-muted">{t("comm.officialNote")}</p>
      </form>
    </div>
  );
}
