# Panoramas · *Ese encuentro inesperado*

Small plans with people you haven't met yet, in Chile. For making friends and connections — **not a dating app**.

A host proposes a plan (a book club, lunch near the office, a ski day, theatre and drinks after). People join instantly or apply, depending on what the host chose. Everyone pays their own way; the host is never the service provider and never receives money.

## Run it locally

Requires Node 20+ and Postgres 16 (Docker is the easiest way).

```bash
cp .env.example .env
docker compose up -d # local Postgres on :5432
npm install
npm run db:setup     # applies migrations and loads demo data
npm run dev          # http://localhost:3000
```

Email: without `RESEND_API_KEY`, emails are printed in the server log and saved to `storage/outbox.log` so you can click the links locally. In production set `RESEND_API_KEY`, `EMAIL_FROM` (a verified domain in Resend) and `APP_URL`.

Staff: `npm run set-role -- someone@example.com admin` (or `moderator`). The demo account `demo@demo.cl` is an admin. Staff see a 🛡️ link to `/admin`.

ID documents in production: create a **private** bucket `id-docs` in Supabase Storage, then set `ID_DOC_STORAGE=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `ID_DOC_ENCRYPTION_KEY` (`openssl rand -base64 32`). Keep the key safe: without it the stored documents can't be read.

Changing the schema: edit `prisma/schema.prisma`, then `npm run db:migrate -- --name what_changed` and commit the new folder in `prisma/migrations/`. Production runs `npm run db:deploy`.

Demo data includes a closed *CFA Society Chile* community (camila@ is admin, demo@ is a member, tomas@ has a pending request) and an open *Corredores de Ñuñoa*. It also includes vegan / animal-friendly plans such as *Voluntariado Santuario Clafiria + Almuerzo Vegano*.

Demo accounts (password `panoramas123`): `demo@demo.cl`, `camila@demo.cl`, `diego@demo.cl`, `vale@demo.cl`, `tomas@demo.cl`.

Tests: `npm test` (RUT validation, 18+ check, content rules, Chile time zone).

## What's in the MVP

| Area | How it works |
| --- | --- |
| Accounts | Email + password, 18+ enforced from birth date. Email must be confirmed by link (48 h) before creating or joining. Password reset by emailed link (1 h, single use, signs out every other device). "Sign out on all devices" in the profile. One-time tokens are stored only as SHA-256 hashes. |
| Verification | Step 2 of sign-up: Chilean RUT (módulo 11 check digit) or passport / foreign ID, one account per document, plus a required photo of the ID (JPG/PNG/HEIC/PDF, 6 MB, type checked from file bytes). The photo is **encrypted (AES-256-GCM) before storage** and kept in a private Supabase bucket in production (`./storage/id-docs` locally). Staff review it at `/admin/verifications`: approve or reject with a reason, and the photo is **deleted right after the decision**. A rejected person loses access until they upload a new one. **Still a stub:** access is granted on upload, before review; automatic document + selfie KYC comes later (`src/lib/verification.ts`). Must be verified to create or join. |
| Plans | Title, category, comuna, date, capacity (2–12 incl. host), cost note ("cada uno paga lo suyo"). Host must confirm they're not the provider and receive no money, and that it's not a date / adult / illegal / animal-abuse plan. |
| Join mode | Per plan: *entrada directa* (instant) or *el anfitrión revisa* (host accepts/declines applications). |
| Location privacy | Only the comuna is public. Exact place shows once accepted, unless the host marks "the place is the plan" (concert, play). |
| Audiences | Open, women only, LGBTQ+ only, LGBTQ+ welcome, vegans only. Based on self-declared profile fields for now. |
| Sorpréndeme | Picks an upcoming plan you can join that's furthest from your bubble: categories you've never joined or listed, outside your comuna, hosts you've never met. Explains why ("nunca has ido a algo de Playa y surf") and offers another. |
| ¿Qué organizo? | Plan ideas at `/ideas` and on top of the create form. Ranked by your interests, categories nobody hosts near you, the season (surf in summer, snow in winter) and vegan diet, plus one idea outside your bubble. "Usar esta idea" pre-fills the form. Ideas live in `src/lib/ideas.ts`. |
| Communities | `/communities`: open (join instantly) or closed (admins approve requests, with a note). Each community chooses who can publish plans (any member or admins only). Plans can be published *as* a community and be **members only** (hidden from feed, Sorpréndeme and direct links for non-members) or **open to everyone** (shown with the community badge). Admins accept/reject requests, promote admins and remove members. Not verified as official organizations yet. |
| Chat & contacts | Host chooses: no chat, before, after, or both. Optional contact sharing among the group after the plan. |
| Abuse limits | Per-IP and per-account rate limits on login, sign-up, password reset, ID upload, creating plans and communities, joining, messages and reports (`src/lib/rateLimit.ts`, stored in Postgres). Security headers (HSTS, no framing, nosniff) in `next.config.ts`. |
| Safety | Keyword screen for dating / adult / illegal / animal-abuse content (ES + EN), report button, auto-hide after 3 reports. |
| Languages | Spanish first, English toggle (`src/lib/i18n`). |

## Stack

Next.js 15 (App Router, server actions) · Tailwind CSS 4 · Prisma. Mobile-first web; the data model and server logic are kept separate from UI so a React Native / Expo app can reuse them later through an API.

Database is **Postgres** with Prisma migrations. To deploy (e.g. Vercel + Supabase), set `DATABASE_URL` to the pooled connection string (port 6543, `?pgbouncer=true`) and `DIRECT_URL` to the direct one (port 5432), then run `npm run db:deploy`.

## Next steps

- Real KYC (document + selfie) and verified gender for women-only plans.
- Email/WhatsApp notifications (accepted, new message, reminder).
- Post-event "would meet again" feedback to tune Sorpréndeme and flag bad actors.
- Moderation dashboard for reports.
- Verified / official communities (e.g. a society confirms its admins) and member import by email domain or list.
- Later: pooled payments with "minimum met or refund".
