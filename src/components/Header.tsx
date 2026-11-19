import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { logout } from "@/app/actions";
import LangToggle from "./LangToggle";

export default async function Header() {
  const [{ t, locale }, user] = await Promise.all([getT(), currentUser()]);
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-sand/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-sun text-white">P</span>
          <span className="hidden sm:inline">{t("app.name")}</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm sm:gap-3">
          <Link href="/surprise" className="btn-primary whitespace-nowrap px-3 py-1.5 text-sm">
            ✨ {t("surprise.button")}
          </Link>
          {user ? (
            <>
              <Link href="/events/new" className="rounded-full px-2 py-1 hover:bg-white" aria-label={t("nav.create")}>
                <span className="sm:hidden">＋</span>
                <span className="hidden sm:inline">{t("nav.create")}</span>
              </Link>
              <Link href="/me" className="whitespace-nowrap rounded-full px-2 py-1 hover:bg-white">
                <span className="sm:hidden">📅</span>
                <span className="hidden sm:inline">{t("nav.mine")}</span>
              </Link>
              <Link href="/profile" className="rounded-full px-2 py-1 hover:bg-white" aria-label={t("nav.profile")}>
                👤
              </Link>
              <form action={logout} className="hidden sm:block">
                <button className="rounded-full px-2 py-1 text-muted hover:bg-white">{t("nav.logout")}</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="rounded-full px-2 py-1 hover:bg-white">
              {t("nav.login")}
            </Link>
          )}
          <LangToggle next={locale === "es" ? "en" : "es"} label={locale === "es" ? "EN" : "ES"} title={t("common.lang")} />
        </nav>
      </div>
    </header>
  );
}
