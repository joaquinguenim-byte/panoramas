import Link from "next/link";
import { createEvent } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { getT, type MsgKey } from "@/lib/i18n";
import { AUDIENCES, CATEGORIES, CHAT_MODES, COMUNAS, JOIN_MODES, MAX_CAPACITY, MIN_CAPACITY } from "@/lib/constants";
import ErrorNote from "@/components/ErrorNote";

export default async function NewEvent({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const user = await requireUser("/events/new");
  const { t } = await getT();
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
      <form action={createEvent} className="card space-y-5">
        <div>
          <label className="label">{t("create.fTitle")}</label>
          <input className="input" name="title" required minLength={3} maxLength={100} />
        </div>
        <div>
          <label className="label">{t("create.fDescription")}</label>
          <textarea className="input min-h-28" name="description" required minLength={10} maxLength={2000} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{t("create.fCategory")}</label>
            <select className="input" name="category">
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
            <input className="input" type="number" name="capacity" min={MIN_CAPACITY} max={MAX_CAPACITY} defaultValue={6} required />
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
          <input className="input" name="costNote" maxLength={200} />
        </div>
        <div>
          <p className="label">{t("create.fJoinMode")}</p>
          <Radio name="joinMode" values={JOIN_MODES} prefix="joinMode" def="review" />
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
