import Link from "next/link";
import type { Event, Participation, User } from "@prisma/client";
import { CATEGORY_EMOJI } from "@/lib/constants";
import { formatDate, type MsgKey, type T, type Locale } from "@/lib/i18n";
import { takenSpots } from "@/lib/events";

type E = Event & { host: Pick<User, "name">; participations: Pick<Participation, "status">[]; community?: { name: string } | null };

export default function EventCard({ e, t, locale }: { e: E; t: T; locale: Locale }) {
  const taken = takenSpots(e);
  return (
    <Link href={`/events/${e.id}`} className="card block transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span className="chip">
          {CATEGORY_EMOJI[e.category]} {t(`category.${e.category}` as MsgKey)}
        </span>
        <span>{formatDate(e.startsAt, locale)}</span>
      </div>
      {e.community && (
        <p className="mb-1 text-xs font-semibold text-sea">
          👥 {e.community.name}
          {e.visibility === "community" && <span className="ml-1 text-muted">· 🔒 {t("event.membersOnly")}</span>}
        </p>
      )}
      <h3 className="text-lg font-bold leading-snug">{e.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-muted">{e.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="chip">📍 {e.comuna}</span>
        <span className={`chip ${taken >= e.capacity ? "bg-ink text-white" : ""}`}>
          {taken >= e.capacity ? t("event.full") : t("event.spots", { taken, total: e.capacity })}
        </span>
        {e.audience !== "open" && <span className="chip bg-sea/10 text-sea">{t(`audience.${e.audience}` as MsgKey)}</span>}
        <span className="chip">{t(`joinMode.${e.joinMode}` as MsgKey)}</span>
      </div>
    </Link>
  );
}
