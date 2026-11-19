import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { suggestIdeas } from "@/lib/ideas";
import IdeaCard from "@/components/IdeaCard";

export const dynamic = "force-dynamic";

export default async function Ideas() {
  const [{ t, locale }, user] = await Promise.all([getT(), currentUser()]);
  const ideas = await suggestIdeas(user, 9);
  return (
    <div>
      <h1 className="text-3xl font-extrabold">💡 {t("ideas.title")}</h1>
      <p className="mb-6 mt-2 max-w-2xl text-muted">{t("ideas.intro")}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ideas.map((s) => (
          <IdeaCard key={s.idea.key} s={s} t={t} locale={locale} />
        ))}
      </div>
      <div className="mt-6 text-center">
        <Link href="/ideas" className="btn-ghost">
          🔀 {t("ideas.shuffle")}
        </Link>
      </div>
    </div>
  );
}
