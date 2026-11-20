import Link from "next/link";
import { logout, logoutEverywhere, updateProfile } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { getT, type MsgKey } from "@/lib/i18n";
import { CATEGORIES, CATEGORY_EMOJI, COMUNAS, GENDERS } from "@/lib/constants";
import ErrorNote from "@/components/ErrorNote";

export default async function Profile({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string; passwordReset?: string }> }) {
  const { error, saved, passwordReset } = await searchParams;
  const user = await requireUser("/profile");
  const { t } = await getT();
  const interests = new Set(user.interests.split(","));
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-2 text-3xl font-extrabold">{t("profile.title")}</h1>
      <p className="mb-6 text-sm">
        {user.verifiedAt ? (
          <span className="font-semibold text-sea">{t("verify.done")}</span>
        ) : (
          <Link href="/verify" className="font-semibold text-sun underline">
            {t("verify.pending")} → {t("verify.title")}
          </Link>
        )}
      </p>
      <ErrorNote error={error} />
      {passwordReset && <p className="mb-4 rounded-xl bg-sea/10 px-4 py-3 text-sm text-sea">{t("reset.done")}</p>}
      {saved && <p className="mb-4 rounded-xl bg-sea/10 px-4 py-3 text-sm text-sea">{t("profile.saved")}</p>}
      <form action={updateProfile} className="card space-y-5">
        <div>
          <label className="label">{t("auth.name")}</label>
          <input className="input" name="name" defaultValue={user.name} />
        </div>
        <div>
          <label className="label">{t("profile.bio")}</label>
          <textarea className="input min-h-24" name="bio" defaultValue={user.bio} maxLength={500} />
        </div>
        <div>
          <label className="label">{t("profile.comuna")}</label>
          <select className="input" name="comuna" defaultValue={user.comuna || "Santiago Centro"}>
            {COMUNAS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <fieldset>
          <legend className="label">{t("profile.interests")}</legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <label key={c} className="cursor-pointer">
                <input type="checkbox" name="interests" value={c} defaultChecked={interests.has(c)} className="peer sr-only" />
                <span className="chip border border-line bg-white px-3 py-1.5 text-sm peer-checked:border-sun peer-checked:bg-sun peer-checked:text-white">
                  {CATEGORY_EMOJI[c]} {t(`category.${c}` as MsgKey)}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="rounded-xl bg-sand p-4">
          <label className="label">{t("profile.gender")}</label>
          <select className="input" name="gender" defaultValue={user.gender}>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {t(`gender.${g}` as MsgKey)}
              </option>
            ))}
          </select>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" name="lgbtq" defaultChecked={user.lgbtq} /> {t("profile.lgbtq")}
          </label>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" name="vegan" defaultChecked={user.vegan} /> {t("profile.vegan")}
          </label>
          <p className="mt-2 text-xs text-muted">{t("profile.selfDeclaredHint")}</p>
        </div>
        <div>
          <label className="label">{t("profile.contact")}</label>
          <input className="input" name="contact" defaultValue={user.contact} placeholder="@instagram" />
          <p className="mt-1 text-xs text-muted">{t("profile.contactHint")}</p>
        </div>
        <button className="btn-primary w-full">{t("profile.save")}</button>
      </form>
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        <form action={logout}>
          <button className="text-sm text-muted underline">{t("nav.logout")}</button>
        </form>
        <form action={logoutEverywhere}>
          <button className="text-sm text-muted underline">{t("profile.logoutEverywhere")}</button>
        </form>
      </div>
    </div>
  );
}
