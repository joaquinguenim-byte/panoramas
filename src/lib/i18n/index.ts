import { cookies } from "next/headers";
import { es, type Dict } from "./es";
import { en } from "./en";

export type Locale = "es" | "en";
export const LOCALES: Locale[] = ["es", "en"];
const dicts: Record<Locale, Dict> = { es, en };
export type MsgKey = keyof Dict;

export async function getLocale(): Promise<Locale> {
  const c = (await cookies()).get("locale")?.value;
  return c === "en" ? "en" : "es"; // Spanish first
}

export type T = (key: MsgKey, vars?: Record<string, string | number>) => string;

export function translator(locale: Locale): T {
  const d = dicts[locale];
  return (key, vars) => {
    let s = d[key] ?? es[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    return s;
  };
}

export async function getT() {
  const locale = await getLocale();
  return { t: translator(locale), locale };
}

export function formatDate(d: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "es" ? "es-CL" : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Santiago",
  }).format(d);
}
