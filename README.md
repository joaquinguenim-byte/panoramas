# Panoramas · *Ese encuentro inesperado*

Small plans with people you haven't met yet, in Chile. For making friends and connections — **not a dating app**.

A host proposes a plan (a book club, lunch near the office, a ski day, theatre and drinks after). People join instantly or apply, depending on what the host chose. Everyone pays their own way; the host is never the service provider and never receives money.

## Run it locally

Requires Node 20+.

```bash
cp .env.example .env
npm install
npm run db:setup     # creates the SQLite DB and loads demo data
npm run dev          # http://localhost:3000
```

Demo accounts (password `panoramas123`): `demo@demo.cl`, `camila@demo.cl`, `diego@demo.cl`, `vale@demo.cl`, `tomas@demo.cl`.

Tests: `npm test` (RUT validation, 18+ check, content rules, Chile time zone).

## What's in the MVP

| Area | How it works |
| --- | --- |
| Accounts | Email + password, 18+ enforced from birth date. |
| Verification | Chilean RUT (módulo 11 check digit) or passport / foreign ID, one account per document. **Stub:** real document + selfie KYC still to plug in (`src/lib/verification.ts → verifyIdentity`). Must be verified to create or join. |
| Plans | Title, category, comuna, date, capacity (2–12 incl. host), cost note ("cada uno paga lo suyo"). Host must confirm they're not the provider and receive no money, and that it's not a date / adult / illegal / animal-abuse plan. |
| Join mode | Per plan: *entrada directa* (instant) or *el anfitrión revisa* (host accepts/declines applications). |
| Location privacy | Only the comuna is public. Exact place shows once accepted, unless the host marks "the place is the plan" (concert, play). |
| Audiences | Open, women only, LGBTQ+ only, LGBTQ+ welcome, vegans only. Based on self-declared profile fields for now. |
| Sorpréndeme | Picks an upcoming plan you can join that's furthest from your bubble: categories you've never joined or listed, outside your comuna, hosts you've never met. Explains why ("nunca has ido a algo de Playa y surf") and offers another. |
| Chat & contacts | Host chooses: no chat, before, after, or both. Optional contact sharing among the group after the plan. |
| Safety | Keyword screen for dating / adult / illegal / animal-abuse content (ES + EN), report button, auto-hide after 3 reports. |
| Languages | Spanish first, English toggle (`src/lib/i18n`). |

## Stack

Next.js 15 (App Router, server actions) · Tailwind CSS 4 · Prisma. Mobile-first web; the data model and server logic are kept separate from UI so a React Native / Expo app can reuse them later through an API.

The pilot uses **SQLite** so it runs with zero setup. To deploy (e.g. Vercel), switch `provider` in `prisma/schema.prisma` to `postgresql` and point `DATABASE_URL` at Postgres (Supabase, Neon…).

## Next steps

- Real identity verification (document + selfie) and verified gender for women-only plans.
- Email/WhatsApp notifications (accepted, new message, reminder).
- Post-event "would meet again" feedback to tune Sorpréndeme and flag bad actors.
- Moderation dashboard for reports.
- Later: pooled payments with "minimum met or refund".
