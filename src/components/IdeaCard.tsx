import Link from "next/link";
import { CATEGORY_EMOJI } from "@/lib/constants";
import type { Suggestion } from "@/lib/ideas";
import type { Locale, MsgKey, T } from "@/lib/i18n";

export default function IdeaCard({ s, t, locale, compact }: { s: Suggestion; t: T; locale: Locale; compact?: boolean }) {
  const text = s.idea[locale];
  const category = t(`category.${s.idea.category}` as MsgKey);
  const tone =
    s.reason === "wildcard" ? "bg-ink text-white" : s.reason === "vegan" ? "bg-green-100 text-green-800" : "bg-sun/10 text-sun-dark";
  return (
    <Link href={`/events/new?idea=${s.idea.key}`} className="card group flex flex-col transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="chip">
          {CATEGORY_EMOJI[s.idea.category]} {category}
        </span>
        <span className={`chip ${tone}`}>{t(`ideas.reason.${s.reason}` as MsgKey, { category })}</span>
      </div>
      <h3 className="font-bold leading-snug">{text.title}</h3>
      {!compact && <p className="mt-1 text-sm text-muted">{text.description}</p>}
      <span className="mt-3 text-sm font-semibold text-sun group-hover:underline">{t("ideas.use")} →</span>
    </Link>
  );
}
