# Panoramas · Backlog to launch and beyond

Last updated: 2026-11-20. Based on what is on `main` today (web MVP: sign-up with RUT/ID + ID photo, plans with join mode, audiences, area-only location, Sorpréndeme, ¿Qué organizo?, chat modes, keyword moderation, es/en).

## How to read this

**Phases** (in order):

| Phase | Goal | Exit criterion |
| --- | --- | --- |
| **P0 Polish** | Finish the MVP so real strangers can use it safely | Every P0 item done, app runs on Postgres |
| **P1 Online** | Live on panoramas.cl with real infra | Joaq + 5 friends can sign up and run a plan on production |
| **P2 Trust & legal** | Real identity check, terms, privacy, moderation | Lawyer sign-off, KYC live, moderation queue staffed |
| **P3 Closed pilot** | 50–150 invited people in Santiago | 4–6 weeks, ~30 plans happened, feedback collected |
| **P4 Iterate** | Fix what the pilot shows | Retention and "would meet again" targets met |
| **P5 Public launch** | Open sign-ups in Santiago, partners, ambassadors | Press/partner launch done |
| **P6 Beyond** | Mobile app, more cities, pooled payments | — |

**Priority**: 🔴 must (blocks the phase) · 🟠 should · 🟢 could.
**Owner**: **Joaq** (decision, money, accounts, legal, people) · **Claude** (code, docs, drafts) · **Both** (Claude drafts or builds, Joaq decides or signs).

---

## Top 15 (do these first)

| # | Item | Phase | Owner |
| --- | --- | --- | --- |
| 1 | Decide launch name/brand and buy `panoramas.cl` (check NIC Chile availability) | P1 | Joaq |
| 2 | Switch DB to Postgres + migrations (Prisma migrate) | P0 | Claude |
| 3 | Move ID photos to a private encrypted bucket (Supabase Storage) + admin review screen | P0 | Claude |
| 4 | Password reset + email verification (Resend) | P0 | Claude |
| 5 | Rate limiting, CSRF/abuse checks, security headers | P0 | Claude |
| 6 | Report **users** (not only plans), block a user, delete my account | P0 | Claude |
| 7 | Admin/moderation dashboard (reports, ID review, hide/ban) | P0 | Claude |
| 8 | Create Vercel + Supabase accounts and give access | P1 | Joaq |
| 9 | Deploy to production with CI (tests + lint on every PR) | P1 | Claude |
| 10 | Pick KYC provider (Metamap / Veriff / Truora / Sumsub) and sign up | P2 | Joaq |
| 11 | Draft Términos, Política de Privacidad, Reglas de la comunidad (Ley 19.628 + Ley 21.719) | P2 | Both |
| 12 | Lawyer review of terms/privacy, decide legal entity (SpA) | P2 | Joaq |
| 13 | Email notifications: accepted, new applicant, reminder 24h before, plan cancelled | P0 | Claude |
| 14 | Recruit the first 50–150 pilot users and 10–15 seed hosts | P3 | Joaq |
| 15 | Post-plan feedback ("¿Te volverías a juntar?") + basic analytics funnel | P0/P1 | Claude |

---

## Product

| ID | Item | Phase | Prio | Owner |
| --- | --- | --- | --- | --- |
| PR-1 | **Communities** (open/closed, e.g. CFA Society) with members-only or public plans | P0 | 🔴 | Claude (in progress in another thread) |
| PR-2 | Post-plan feedback: attended / no-show / would meet again / private flag | P0 | 🔴 | Claude |
| PR-3 | Edit a plan after publishing (with notice to attendees on time/place change) | P0 | 🔴 | Claude |
| PR-4 | Waitlist when a plan is full; auto-promote when someone leaves | P0 | 🟠 | Claude |
| PR-5 | Host tools: remove an attendee, message all, mark plan as happened | P0 | 🟠 | Claude |
| PR-6 | Recurring plans (weekly book club, monthly hike) | P4 | 🟠 | Claude |
| PR-7 | Search and filters: date, comuna, category, cost, audience | P0 | 🟠 | Claude |
| PR-8 | Sorpréndeme v2: use feedback + "meet new people" score; daily surprise | P4 | 🟠 | Claude |
| PR-9 | ¿Qué organizo? v2: ideas from real places (partners), weather, holidays (Fiestas Patrias, feriados) | P4 | 🟢 | Claude |
| PR-10 | Calendar export (.ics) and "add to Google Calendar" | P0 | 🟢 | Claude |
| PR-11 | Public profile: plans attended, hosted, communities, badges (no ratings of people) | P4 | 🟠 | Both (Joaq decides what's shown) |
| PR-12 | Friends/connections after a plan ("conectar") and seeing friends' plans (opt-in) | P4 | 🟠 | Both |
| PR-13 | Invite link for a plan / for the app (pilot invite codes) | P3 | 🔴 | Claude |
| PR-14 | Minimum attendees per plan; auto-cancel if not met by a deadline | P4 | 🟠 | Claude |
| PR-15 | Pooled payments with escrow: "minimum met or refund" | P6 | 🟠 | Both |
| PR-16 | Decide rules for limits: max plans per host/week, max applications pending | P0 | 🟠 | Joaq |
| PR-17 | Decide what happens with no-shows (warning, strikes, temporary block) | P3 | 🟠 | Joaq |
| PR-18 | Confirm where Santuario Clafiria actually is (comuna) and fix the seed/demo plan | P0 | 🟢 | Joaq |

## Tech

| ID | Item | Phase | Prio | Owner |
| --- | --- | --- | --- | --- |
| TE-1 | Postgres (Supabase) + `prisma migrate` instead of `db push` | P0 | 🔴 | Claude |
| TE-2 | Private storage bucket for ID docs, signed URLs, encryption at rest, auto-delete after review | P0 | 🔴 | Claude |
| TE-3 | Email sending (Resend or Postmark) + templates in es/en | P0 | 🔴 | Claude (Joaq creates account) |
| TE-4 | Password reset, email verification, session list / log out everywhere | P0 | 🔴 | Claude |
| TE-5 | Rate limiting on login, sign-up, join, messages, reports (Upstash or DB-based) | P0 | 🔴 | Claude |
| TE-6 | Security headers (CSP, HSTS), input limits, dependency audit | P0 | 🔴 | Claude |
| TE-7 | CI on GitHub Actions: typecheck, lint, tests, build | P1 | 🔴 | Claude |
| TE-8 | Preview deployments per PR (Vercel) | P1 | 🟠 | Claude |
| TE-9 | Error monitoring (Sentry) and uptime check | P1 | 🔴 | Claude (Joaq creates account) |
| TE-10 | Backups and restore test for DB | P1 | 🔴 | Both |
| TE-11 | Realtime chat (Supabase Realtime) instead of reload | P4 | 🟠 | Claude |
| TE-12 | Notifications: WhatsApp (Meta Cloud API / Twilio) and web push | P4 | 🟠 | Both (Joaq: Meta business verification) |
| TE-13 | Comuna list as structured data (all 346 comunas, region) and maps for area only | P0 | 🟠 | Claude |
| TE-14 | E2E tests (Playwright) for sign-up, create, join, review, chat | P1 | 🟠 | Claude |
| TE-15 | Public API layer (route handlers) so a mobile app can reuse logic | P5 | 🟠 | Claude |
| TE-16 | Mobile app (Expo / React Native), store accounts | P6 | 🟠 | Both (Joaq: Apple/Google developer accounts) |
| TE-17 | Payments integration for escrow (Mercado Pago / Flow / Khipu / Transbank) | P6 | 🟠 | Both |
| TE-18 | Performance & SEO basics: metadata, OG images per plan, sitemap | P1 | 🟢 | Claude |

## Trust & safety

| ID | Item | Phase | Prio | Owner |
| --- | --- | --- | --- | --- |
| TS-1 | Choose KYC provider (document + selfie liveness + RUT check); compare price per check | P2 | 🔴 | Joaq (Claude prepares comparison) |
| TS-2 | Integrate KYC in `src/lib/verification.ts`; webhook updates `idDocStatus` | P2 | 🔴 | Claude |
| TS-3 | Verified gender from KYC for women-only plans; decide policy for LGBTQ+/vegan (stay self-declared?) | P2 | 🔴 | Joaq decides, Claude builds |
| TS-4 | Report users and messages, block users (blocked people never see each other's plans) | P0 | 🔴 | Claude |
| TS-5 | Moderation dashboard: report queue, ID review, hide plan, suspend/ban user, audit log | P0 | 🔴 | Claude |
| TS-6 | Who moderates during the pilot, response time target (e.g. < 12 h), escalation | P3 | 🔴 | Joaq |
| TS-7 | Safety page + in-plan tips: meet in public, tell a friend, emergency numbers (133, 131, 132) | P0 | 🟠 | Both |
| TS-8 | "Share my plan" with a trusted contact (time, comuna, host first name) | P4 | 🟢 | Claude |
| TS-9 | Better content screening (LLM moderation of plans/messages, dating & commerce detection) | P4 | 🟠 | Claude |
| TS-10 | Detect hosts that are really businesses (links, prices, repeated venue) | P4 | 🟠 | Claude |
| TS-11 | Incident response playbook (harassment, assault report, police request) | P2 | 🔴 | Both |
| TS-12 | One account per person enforcement: duplicate document, device/email heuristics | P2 | 🟠 | Claude |

## Legal

| ID | Item | Phase | Prio | Owner |
| --- | --- | --- | --- | --- |
| LE-1 | Create legal entity (SpA) and bank account; decide founders/ownership | P2 | 🔴 | Joaq |
| LE-2 | Términos y condiciones (platform is only a meeting tool; host not a provider; each pays own) | P2 | 🔴 | Both (Claude drafts, lawyer reviews) |
| LE-3 | Política de privacidad under Ley 19.628 and Ley 21.719 (sensitive data: ID, gender, sexual orientation, diet) | P2 | 🔴 | Both |
| LE-4 | Explicit consent flows for sensitive data and ID processing; data retention schedule | P2 | 🔴 | Claude |
| LE-5 | User rights: export my data, delete my account (ARCO+ rights) | P0 | 🔴 | Claude |
| LE-6 | Data processing agreements with Supabase, Vercel, KYC, email providers; data stored abroad disclosure | P2 | 🟠 | Joaq |
| LE-7 | Reglas de la comunidad (public, plain language) | P2 | 🔴 | Both |
| LE-8 | Trademark search and registration at INAPI ("Panoramas" + logo) | P2 | 🟠 | Joaq |
| LE-9 | Liability: waiver for risky plans (ski, hikes, surf); insurance quote | P2 | 🟠 | Joaq |
| LE-10 | Payments/escrow legal model (CMF rules, payment facilitator) before P6 | P6 | 🟠 | Joaq |

## Design

| ID | Item | Phase | Prio | Owner |
| --- | --- | --- | --- | --- |
| DE-1 | Brand: logo, colors, type, tone of voice ("Ese encuentro inesperado") | P1 | 🔴 | Both (Joaq picks) |
| DE-2 | Onboarding flow review: sign-up → ID → interests → first suggestion | P0 | 🔴 | Both |
| DE-3 | Plan detail page and card polish, empty states, loading states | P0 | 🟠 | Claude |
| DE-4 | Accessibility pass (contrast, labels, keyboard) | P1 | 🟠 | Claude |
| DE-5 | Landing page for pilot waitlist (what it is, how it's safe, sign up) | P1 | 🔴 | Claude |
| DE-6 | Illustrations / photos per category (no stock dating vibe) | P4 | 🟢 | Joaq |
| DE-7 | Usability test with 5 people before pilot | P3 | 🟠 | Joaq (Claude writes script) |
| DE-8 | Mobile app design (P6) | P6 | 🟠 | Both |

## Growth

| ID | Item | Phase | Prio | Owner |
| --- | --- | --- | --- | --- |
| GR-1 | Pilot waitlist + invite codes; pick 50–150 people with mixed circles | P3 | 🔴 | Joaq (Claude builds) |
| GR-2 | 10–15 seed hosts with a first plan each, before inviting attendees | P3 | 🔴 | Joaq |
| GR-3 | Analytics (PostHog or Plausible): sign-up → verified → first join → attended → second plan | P1 | 🔴 | Claude (Joaq creates account) |
| GR-4 | Pilot metrics & targets: % verified, plans/week, fill rate, would-meet-again, 30-day return | P3 | 🔴 | Both |
| GR-5 | First communities to onboard (CFA Society, running clubs, book clubs, vegan groups) | P3 | 🟠 | Joaq |
| GR-6 | Partners: cafés, bookshops, climbing gyms, sanctuaries (perks, not commissions to hosts) | P5 | 🟠 | Joaq |
| GR-7 | Ambassador program (per university / office area / comuna) | P5 | 🟠 | Joaq (Claude drafts program) |
| GR-8 | Instagram/TikTok presence, launch content, press kit | P5 | 🟠 | Both |
| GR-9 | Referral loop: "invite a friend to this plan" | P4 | 🟠 | Claude |
| GR-10 | Next cities: Valparaíso/Viña, Concepción | P6 | 🟢 | Joaq |
| GR-11 | Business model decision (free for users; options: partner perks, premium communities, escrow fee) | P4 | 🟠 | Joaq |

## Ops

| ID | Item | Phase | Prio | Owner |
| --- | --- | --- | --- | --- |
| OP-1 | Accounts: domain, Vercel, Supabase, Resend, Sentry, PostHog, Google Workspace (hola@panoramas.cl) | P1 | 🔴 | Joaq |
| OP-2 | Monthly budget for infra + KYC (estimate per verified user) | P1 | 🔴 | Both |
| OP-3 | Support channel (email/WhatsApp) and FAQ | P3 | 🔴 | Both |
| OP-4 | Pilot runbook: weekly check-in, feedback survey, moderation shifts | P3 | 🔴 | Both |
| OP-5 | Secrets management and who has admin access | P1 | 🔴 | Both |
| OP-6 | Weekly review of this backlog | ongoing | 🟠 | Both |

---

## Decisions Joaq owes (blocking)

1. Brand/name and domain (`panoramas.cl` availability).
2. Hosting accounts (Vercel + Supabase) and who pays.
3. KYC provider and budget per verification.
4. Policy for restricted audiences: is gender verified by ID? Do LGBTQ+/vegan stay self-declared?
5. Legal entity and lawyer for terms/privacy.
6. Pilot size, start date, and who moderates.
7. Location of Santuario Clafiria (for the demo plan).
