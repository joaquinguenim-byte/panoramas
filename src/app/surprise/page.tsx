import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { pickSurprise } from "@/lib/events";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function Surprise({ searchParams }: { searchParams: Promise<{ not?: string }> }) {
  const { not } = await searchParams;
  const user = await currentUser();
  const pick = await pickSurprise(user, not);
  if (pick) {
    const r = pick.reason;
    const q = new URLSearchParams({ surprise: r.kind, ...(r.kind === "newCategory" ? { v: r.category } : r.kind === "newComuna" ? { v: r.comuna } : {}) });
    redirect(`/events/${pick.event.id}?${q}`);
  }
  const { t } = await getT();
  return (
    <div className="card mx-auto max-w-md text-center">
      <p className="text-4xl">🌀</p>
      <p className="mt-3 text-muted">{t("surprise.none")}</p>
      <Link href="/events/new" className="btn-primary mt-5">
        {t("nav.create")}
      </Link>
    </div>
  );
}
