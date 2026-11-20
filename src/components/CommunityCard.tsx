import Link from "next/link";
import type { Community } from "@prisma/client";
import type { MsgKey, T } from "@/lib/i18n";

export default function CommunityCard({ c, members, t, badge }: { c: Community; members: number; t: T; badge?: string }) {
  return (
    <Link href={`/communities/${c.slug}`} className="card block transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className={`chip ${c.kind === "closed" ? "bg-ink text-white" : "bg-sea/10 text-sea"}`}>
          {c.kind === "closed" ? "🔒" : "🌐"} {t(`comm.kind.${c.kind}` as MsgKey)}
        </span>
        <span className="chip">👥 {t("comm.members", { n: members })}</span>
        {badge && <span className="chip bg-sun/10 text-sun-dark">{badge}</span>}
      </div>
      <h3 className="text-lg font-bold">{c.name}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-muted">{c.description}</p>
    </Link>
  );
}
