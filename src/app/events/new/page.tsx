import Link from "next/link";
import { createEvent } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { getT, type MsgKey } from "@/lib/i18n";
import { AUDIENCES, CATEGORIES, CHAT_MODES, COMUNAS, JOIN_MODES, MAX_CAPACITY, MIN_CAPACITY } from "@/lib/constants";
import ErrorNote from "@/components/ErrorNote";
import IdeaCard from "@/components/IdeaCard";
import { ideaByKey, suggestIdeas } from "@/lib/ideas";
import { postableCommunities } from "@/lib/communities";
import PublishAs from "@/components/PublishAs";

export default async function NewEvent({ searchParams }: { searchParams: Promise<{ error?: string; idea?: string; community?: string }> }) {
  const { error, idea: ideaKey, community } = await searchParams;
  const user = await requireUser("/events/new");
  const { t, locale } = await getT();
  const idea = ideaByKey(ideaKey);
  const it = idea?.[locale];
  const suggestions = idea ? [] : await suggestIdeas(user, 3);
  const communities = (await postableCommunities(user.id)).map((c) => ({ id: c.id, name: c.name }));
  if (!user.verifiedAt)
    return (
      <div className="card mx-auto max-w-md text-center">
        <p>{t("create.mustVerify")}</p>
        <Link href="/verify" className="btn-primary mt-4">
          {t("verify.title")}
        </Link>
      </div>
    );

  const Radio = ({ name, values, prefix, def }: { name: string; values: readonly string[]; prefix: string; def: string }) => (
    <div className="flex flex-wrap gap-2">
      {values.map((v) => (
        <label key={v} className="cursor-pointer">
          <input type="radio" name={name} value={v} defaultChecked={v === def} className="peer sr-only" />
          <span className="chip border border-line bg-white px-3 py-1.5 text-sm peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white">
            {t(`${prefix}.${v}` as MsgKey)}
          </span>
        </label>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-3xl font-extrabold">{t("create.title")}</h1>
      <p className="mb-6 mt-2 text-sm text-muted">{t("create.intro")}</p>
      <ErrorNote error={error} />
      {it && <p className="mb-4 rounded-xl bg-sun/10 px-4 py-3 text-sm text-sun-dark">💡 {t("ideas.prefilled", { title: it.title })}</p>}
      {suggestions.length > 0 && (
        <section className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-bold">{t("ideas.cta")}</h2>
            <Link href="/ideas" className="text-sm font-semibold text-sun">
              {t("ideas.more")} →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {suggestions.map((s) => (
              <IdeaCard key={s.idea.key} s={s} t={t} locale={locale} compact />
            ))}
          </div>
        </section>
      )}
      <form action={createEvent} className="card space-y-5">
        <PublishAs
          communities={communities}
          defaultId={communities.some((c) => c.id === community) ? community : undefined}
          labels={{
            publishAs: t("event.publishAs"),
            me: t("event.publishAsMe"),
            visibility: t("event.visibility"),
            public: t("event.visibility.public"),
            community: t("event.visibility.community"),
          }}
        />
        <div>
          <label className="label">{t("create.fTitle")}</label>
          <input className="input" name="title" defaultValue={it?.title} required minLength={3} maxLength={100} />
        </div>
        <div>
          <label className="label">{t("create.fDescription")}</label>
          <textarea className="input min-h-28" name="description" defaultValue={it?.description} required minLength={10} maxLength={2000} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{t("create.fCategory")}</label>
            <select className="input" name="category" defaultValue={idea?.category}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`category.${c}` as MsgKey)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t("create.fComuna")}</label>
            <select className="input" name="comuna" defaultValue={user.comuna || "Santiago Centro"}>
              {COMUNAS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t("create.fStartsAt")}</label>
            <input className="input" type="datetime-local" name="startsAt" required />
          </div>
          <div>
            <label className="label">{t("create.fCapacity", { max: MAX_CAPACITY })}</label>
            <input className="input" type="number" name="capacity" min={MIN_CAPACITY} max={MAX_CAPACITY} defaultValue={idea?.capacity ?? 6} required />
          </div>
        </div>
        <div>
          <label className="label">{t("create.fVenue")}</label>
          <input className="input" name="venue" maxLength={200} />
          <p className="mt-1 text-xs text-muted">{t("create.fVenueHint")}</p>
          <label className="mt-2 flex items-start gap-2 text-sm">
            <input type="checkbox" name="venuePublic" className="mt-1" /> {t("create.fVenuePublic")}
          </label>
        </div>
        <div>
          <label className="label">{t("create.fCostNote")}</label>
          <input className="input" name="costNote" defaultValue={it?.costNote} maxLength={200} />
        </div>
        <div>
          <p className="label">{t("create.fJoinMode")}</p>
          <Radio name="joinMode" values={JOIN_MODES} prefix="joinMode" def={idea?.joinMode ?? "review"} />
        </div>
        <div>
          <p className="label">{t("create.fAudience")}</p>
          <Radio name="audience" values={AUDIENCES} prefix="audience" def="open" />
        </div>
        <div>
          <p className="label">{t("create.fChatMode")}</p>
          <Radio name="chatMode" values={CHAT_MODES} prefix="chatMode" def="both" />
          <label className="mt-3 flex items-start gap-2 text-sm">
            <input type="checkbox" name="shareContacts" className="mt-1" /> {t("create.fShareContacts")}
          </label>
        </div>
        <div className="space-y-3 rounded-xl bg-sand p-4 text-sm">
          <label className="flex items-start gap-2">
            <input type="checkbox" name="pledge" required className="mt-1" /> {t("create.pledge")}
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" name="rules" required className="mt-1" /> {t("create.rules")}
          </label>
        </div>
        <button className="btn-primary w-full">{t("create.submit")}</button>
      </form>
    </div>
  );
}
