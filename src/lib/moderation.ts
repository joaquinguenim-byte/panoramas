/**
 * Content rules: Panoramas is for friendship, not dating. No adult events,
 * nothing illegal, no animal abuse. This is a first keyword screen; reports
 * from users auto-hide an event after REPORT_HIDE_THRESHOLD reports.
 */
export const REPORT_HIDE_THRESHOLD = 3;

const BLOCKED: { rule: "dating" | "adult" | "illegal" | "animals"; patterns: RegExp[] }[] = [
  {
    rule: "dating",
    patterns: [/\bcitas?\b/i, /\bspeed ?dating\b/i, /\bdating\b/i, /\bligar\b/i, /\bbuscar pareja\b/i, /\bsingles?\b/i, /\bsolteros?\b/i, /\bsolteras?\b/i, /\bmedia naranja\b/i, /\bhookup\b/i],
  },
  {
    rule: "adult",
    patterns: [/\+ ?18\b/, /\bsexo\b/i, /\bsex\b/i, /\bswingers?\b/i, /\ber[oó]tic[oa]s?\b/i, /\bstrip/i, /\bnudis/i, /\bxxx\b/i],
  },
  {
    rule: "illegal",
    patterns: [/\bdrogas?\b/i, /\bdrugs?\b/i, /\bcoca[ií]na\b/i, /\bmarihuana\b/i, /\bweed\b/i, /\bapuestas? ilegal/i],
  },
  {
    rule: "animals",
    patterns: [/\brodeos?\b/i, /\bpeleas? de (gallos|perros)\b/i, /\b(dog|cock)\s?fight/i, /\bcorridas? de toros\b/i, /\bbullfight/i, /\bcaza\b/i, /\bhunting\b/i],
  },
];

export function checkContent(...texts: string[]): { ok: true } | { ok: false; rule: string } {
  const all = texts.join("\n");
  for (const { rule, patterns } of BLOCKED) {
    if (patterns.some((p) => p.test(all))) return { ok: false, rule };
  }
  return { ok: true };
}
