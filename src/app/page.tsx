import Link from "next/link";
import { db } from "@/lib/db";
import { getT, type MsgKey } from "@/lib/i18n";
import { upcomingWhere } from "@/lib/events";
import { CATEGORIES, COMUNAS } from "@/lib/constants";
import EventCard from "@/components/EventCard";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ comuna?: string; category?: string }> }) {
  const { comuna, category } = await searchParams;
  const { t, locale } = await getT();
  const events = await db.event.findMany({
    where: { ...upcomingWhere(), ...(comuna ? { comuna } : {}), ...(category ? { category } : {}) },
    include: { host: { select: { name: true } }, participations: { select: { status: true } } },
    orderBy: { startsAt: "asc" },
    take: 60,
  });

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl bg-ink px-6 py-10 text-white sm:px-10 sm:py-14">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-sun/40 blur-3xl" />
        <div className="absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-sea/50 blur-3xl" />
        <div className="relative max-w-xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-sun">{t("app.name")}</p>
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">{t("app.tagline")}</h1>
          <p className="mt-4 text-white/80">{t("app.pitch")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/surprise" className="btn-primary text-base">
              ✨ {t("surprise.button")}
            </Link>
            <Link href="/events/new" className="btn border border-white/30 text-white hover:bg-white/10">
              {t("nav.create")}
            </Link>
          </div>
          <p className="mt-3 text-xs text-white/60">{t("surprise.hint")}</p>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-bold">{t("home.upcoming")}</h2>
          <form className="flex w-full flex-wrap gap-2 sm:w-auto">
            <select name="comuna" defaultValue={comuna ?? ""} className="input w-auto flex-1 py-2 text-sm sm:flex-none">
              <option value="">{t("filter.allComunas")}</option>
              {COMUNAS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select name="category" defaultValue={category ?? ""} className="input w-auto flex-1 py-2 text-sm sm:flex-none">
              <option value="">{t("filter.allCategories")}</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`category.${c}` as MsgKey)}
                </option>
              ))}
            </select>
            <button className="btn-ghost py-2 text-sm">{t("filter.apply")}</button>
          </form>
        </div>
        {events.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <EventCard key={e.id} e={e} t={t} locale={locale} />
            ))}
          </div>
        ) : (
          <p className="card text-center text-muted">{t("home.empty")}</p>
        )}
      </section>
    </div>
  );
}
