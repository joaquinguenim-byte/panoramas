import { getT, type MsgKey } from "@/lib/i18n";

export default async function ErrorNote({ error }: { error?: string }) {
  if (!error) return null;
  const { t } = await getT();
  const key = `error.${error}` as MsgKey;
  return <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{t(key) === key ? t("error.generic") : t(key)}</p>;
}
