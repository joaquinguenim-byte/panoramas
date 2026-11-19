import { getT, type MsgKey } from "@/lib/i18n";

export default async function Rules() {
  const { t } = await getT();
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-3xl font-extrabold">{t("rules.title")}</h1>
      <ol className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <li key={n} className="card flex gap-4">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sun font-bold text-white">{n}</span>
            <span>{t(`rules.${n}` as MsgKey)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
