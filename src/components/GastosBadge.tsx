import { GASTOS_HOME } from "@/lib/gastos";
import type { T } from "@/lib/i18n";

/** "Integrados con Gastos.lat" promo line, for the landing, plan pages and footer. */
export default function GastosBadge({ t, className = "" }: { t: T; className?: string }) {
  return (
    <a
      href={`${GASTOS_HOME}/?ref=panoramas`}
      target="_blank"
      rel="noopener"
      className={`inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-xs text-ink hover:border-sea ${className}`}
    >
      <span aria-hidden>🧾</span>
      <span>
        {t("gastos.badgePre")} <strong className="text-sea">Gastos.lat</strong>
      </span>
    </a>
  );
}
