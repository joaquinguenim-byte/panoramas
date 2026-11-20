/**
 * Gastos.lat (GastOS) integration: split a plan's costs after it happens.
 *
 * Gastos.lat is web-only today and has no public API or deep-link scheme, so
 * we hand off with a plain link that carries the plan as query params. The
 * param names below are the contract we propose to Gastos.lat:
 *
 *   name     plan title, used as the Gastos event/group name
 *   people   comma-separated first names of host + accepted attendees
 *   date     plan date, YYYY-MM-DD (Chile time)
 *   ref      always "panoramas", so Gastos can attribute and show a welcome
 *   ext_id   Panoramas plan id, so re-opening lands on the same Gastos group
 *
 * Until Gastos reads them, unknown params are ignored and the user simply
 * lands on sign-up / their dashboard. Set GASTOS_URL to point the handoff at a
 * dedicated route (e.g. https://www.gastos.lat/new) once it exists.
 */
export const GASTOS_HOME = "https://www.gastos.lat";
const DEFAULT_HANDOFF = `${GASTOS_HOME}/signup`;

export type GastosPlan = {
  id: string;
  title: string;
  startsAt: Date;
  people: string[]; // first names, host first
};

export function gastosUrl(plan: GastosPlan, base = process.env.GASTOS_URL || DEFAULT_HANDOFF): string {
  const url = new URL(base);
  const people = [...new Set(plan.people.map((p) => p.trim().replaceAll(",", " ")).filter(Boolean))];
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(plan.startsAt);
  url.searchParams.set("name", plan.title.slice(0, 120));
  if (people.length) url.searchParams.set("people", people.join(","));
  url.searchParams.set("date", date);
  url.searchParams.set("ref", "panoramas");
  url.searchParams.set("ext_id", plan.id);
  return url.toString();
}
