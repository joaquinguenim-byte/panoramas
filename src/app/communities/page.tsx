import Link from "next/link";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import CommunityCard from "@/components/CommunityCard";

export const dynamic = "force-dynamic";

export default async function Communities() {
  const [{ t }, user] = await Promise.all([getT(), currentUser()]);
  const all = await db.community.findMany({
    include: { _count: { select: { members: { where: { status: "active" } } } }, members: user ? { where: { userId: user.id } } : false },
    orderBy: { name: "asc" },
  });
  const mine = all.filter((c) => c.members?.some((m) => m.status === "active" || m.status === "pending"));
  const rest = all.filter((c) => !mine.includes(c));
  const badge = (c: (typeof all)[number]) => {
    const m = c.members?.[0];
    if (!m) return undefined;
    return m.status === "pending" ? "⏳" : m.role === "admin" ? t("comm.isAdmin") : t("comm.isMember");
  };
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">{t("comm.title")}</h1>
          <p className="mt-2 max-w-2xl text-muted">{t("comm.intro")}</p>
        </div>
        <Link href="/communities/new" className="btn-primary">
          ＋ {t("comm.create")}
        </Link>
      </div>
      {mine.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold">{t("comm.mine")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((c) => (
              <CommunityCard key={c.id} c={c} members={c._count.members} t={t} badge={badge(c)} />
            ))}
          </div>
        </section>
      )}
      <section>
        <h2 className="mb-3 text-xl font-bold">{t("comm.all")}</h2>
        {rest.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((c) => (
              <CommunityCard key={c.id} c={c} members={c._count.members} t={t} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">{t("comm.empty")}</p>
        )}
      </section>
    </div>
  );
}
