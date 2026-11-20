import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import Header from "@/components/Header";
import { getT } from "@/lib/i18n";
import GastosBadge from "@/components/GastosBadge";

export const metadata: Metadata = {
  title: "Panoramas · Ese encuentro inesperado",
  description: "Panoramas pequeños con gente nueva en Chile. Para hacer amigos, no para buscar pareja.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#e8613c" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { t, locale } = await getT();
  return (
    <html lang={locale}>
      <body className="min-h-screen antialiased">
        <Header />
        <main className="mx-auto max-w-5xl px-4 pb-16 pt-6">{children}</main>
        <footer className="border-t border-line py-6 text-center text-xs text-muted">
          {t("app.name")} · {t("app.tagline")} ·{" "}
          <Link href="/rules" className="underline">
            {t("nav.rules")}
          </Link>
          <div className="mt-3">
            <GastosBadge t={t} />
          </div>
        </footer>
      </body>
    </html>
  );
}
