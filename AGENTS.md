# AGENTS.md — CHIMGAN DARBAZA site

Context guide for future Codex sessions on this repo.

---

## What this site is

**Chimgan Darbaza** — a **day-use** mountain venue in the Tashkent region of Uzbekistan, 45 minutes from Tashkent at **1700 m** altitude. Open **08:00–18:00 daily**.

**What guests come for:** rent a topchan (traditional outdoor seating platform) with kurpacha cushions for up to 8 people, cook on a rented mangal (BBQ grill) or kazan, buy firewood/charcoal on site, order from the kitchen menu, enjoy mountain views.

**What they do NOT come for (yet):** overnight stays. The site originally pitched glamping + cottages, but those are **paused** ("в подготовке") and intentionally hidden from public navigation. They'll return when the operator opens them.

The brand name "CHIMGAN DARBAZA" appears everywhere. Domain is **`chimgandarbaza.uz`** (also a stale aspirational `chimgansoy.com` was referenced in early README but is not the live domain).

---

## Tech stack

- **Next.js 16** with the App Router under `src/app/[locale]/...`
- **React 19** (server components by default, "use client" only where needed)
- **Tailwind CSS v4** (CSS variables for the brand palette in `src/app/globals.css`)
- **TypeScript** strict
- **framer-motion** for the few scroll-driven animations
- **Vitest** for tests
- **No database, no CMS, no auth.** All content is TypeScript modules under `src/content/`. Server actions handle form submissions.
- **Deployed on Vercel** — auto-deploys every push to `master`. GitHub repo: `Abdurasul99/chimgansoy_resort`.

The Vercel project is named `chimgansoy-resort` (legacy naming from before the brand consolidated to `chimgandarbaza`).

---

## Project layout that matters

```
src/
  app/
    [locale]/                  ← all pages live under /ru, /uz, /en
      page.tsx                 ← homepage
      bron/page.tsx            ← /bron — request-form booking page
      contact/page.tsx         ← /contact — contacts + request form
      nomera/page.tsx          ← /nomera — "Coming soon" landing (glamping paused)
      nomera/[slug]/page.tsx   ← individual room pages (noindex, kept for return)
      services, place, about, legal/[slug]
      layout.tsx               ← global layout, mounts <FaqPanel>
    actions/contact.ts         ← submitContact server action (Telegram + email)
    api/
      rates/route.ts           ← CBU exchange rates JSON
      images/resort/[file]     ← image proxy
  components/
    layout/                    ← Header, Footer, ContactForm, StickyBookingCta
    sections/                  ← Hero, PriceList, BookingWidget, BookingRequestForm, etc.
    ui/                        ← DatePicker, GuestSelect, FaqPanel, ButtonLink, Icon
    effects/                   ← SnowParticles for winter hero
  content/                     ← all data lives here, TypeScript modules
    translations.ts            ← BIG file. Three locale blocks (ru/uz/en). Must update all 3.
    contacts.ts                ← phone, email, schedule, address, coordinates
    pricing.ts                 ← price list items + included perks + what-to-bring
    images.ts                  ← image asset registry (key → {src, localSrc, alt})
    navigation.ts              ← main nav + footer nav links
    attractions.ts             ← /place page cards
    services.ts                ← /services page items
    rooms.ts                   ← (paused) glamping + cottage data
    seo.ts                     ← per-page SEO copy
    assistant-knowledge.ts     ← FAQ knowledge base (21 entries) used by FaqPanel
    integrations.ts            ← Google Maps coords
    home-showcase.ts           ← editorial showcase blocks on home
    promotions.ts              ← seasonal promotion cards
  lib/
    metadata.ts, localize.ts, content.ts, images.ts, search-params.ts
  i18n/
    config.ts (locales: ru, uz, en), routing.ts, domains.ts
```

---

## Business logic & flows

### Booking flow (request form now; Exely online booking incoming)

The old Bnovo iframe widget and PayKeeper integration were removed (commit `d3fc6f9`). The current flow:

1. Guest picks dates / guests on the **homepage BookingWidget** (custom `DatePicker` + `GuestSelect`).
2. Submit redirects to **`/bron?checkin=…&checkout=…&guests=…&room=…`** — that page's `BookingRequestForm` pre-fills from URL.
3. Guest adds name + phone + optional message → submits.
4. `submitContact` server action sends to **Telegram** and **email** (best-effort, both can fail without breaking the form).
5. Admin replies manually.

The footer "Запросить отдых" form is a separate path — see **email routing** below.

**Exely PMS (June 2026): contract signed.** The operator signed with **Exely (exely.com)** — a PMS / channel manager that will provide an embeddable online-booking widget script. Status: waiting for the operator to finish Exely onboarding and hand over the embed code.

- `src/components/sections/ExelyWidget.tsx` is the prepared slot, already mounted on `/bron` above the request form.
- It renders **nothing** until `NEXT_PUBLIC_EXELY_WIDGET_URL` is set in Vercel env (optionally `NEXT_PUBLIC_EXELY_HOTEL_ID`).
- When the embed code arrives: check whether their snippet needs extra data-attributes or a container with a specific id (current container id: `exely-booking-widget`), adjust the script wiring in ExelyWidget, set env, redeploy.
- The request form stays as a fallback path even after Exely goes live.

### Email routing (Resend + Google Workspace)

Each form posts a hidden `formType` field which decides where the email lands:

| Form | `formType` | Email goes to env var | Telegram header |
|---|---|---|---|
| `BookingRequestForm` (on `/bron`, `/contact`, sticky on `/nomera/[slug]`) | `booking` | `RESERVATIONS_EMAIL_TO` | 🏡 Новая бронь |
| Footer `ContactForm` ("Запросить отдых") | `inquiry` | `INFO_EMAIL_TO` | 💬 Новый вопрос |

Both fall back to the legacy `BOOKING_EMAIL_TO` if the specific var isn't set. The Telegram channel is shared (one `TELEGRAM_CHAT_ID`); only the message header differs.

Email is sent via the **Resend HTTP API** (no SDK). The sender (`BOOKING_EMAIL_FROM`) must be a verified Resend domain or `onboarding@resend.dev` for testing.

### Telegram

`submitContact` posts to `https://api.telegram.org/bot<TOKEN>/sendMessage` using `parse_mode: HTML`. The bot must be added to the chat referenced by `TELEGRAM_CHAT_ID`. Best-effort: errors are swallowed so the form never fails on guest-side because of a missing bot.

### FAQ assistant (no AI any more)

The floating "Вопросы / Savollar / FAQ" button opens **`FaqPanel`** — a static accordion of localized questions powered by `src/content/assistant-knowledge.ts`. There's also a text search input on top that filters the visible list (no AI behind it, just substring matching with a keyword fallback).

The old DeepSeek AI chat (and `src/app/api/chat/route.ts`) was removed (commit `3c31f9f`). Env var `DEEPSEEK_API_KEY` is no longer used — safe to delete from Vercel.

`FaqPanel.tsx` only surfaces a curated subset of entries (`FAQ_ORDER`). Topics tied to overnight stays (cottage, glamping, checkin, cancellation, pool) are hidden but live in the knowledge file — re-add their ids to `FAQ_ORDER` when overnight stays open back up.

---

## i18n conventions

- Three locales: **ru, uz, en**.
- Every user-facing string lives in `src/content/translations.ts` under matching keys per locale, OR is co-located as a `LocalizedString` (`{ ru, uz, en }`) on the relevant content module.
- The `text(localizedString, locale)` helper in `src/lib/localize.ts` is the standard reader.
- Locale routing: `/ru/...`, `/uz/...`, `/en/...`. There's no default unprefixed URL — see `src/i18n/routing.ts` and `localizePath`.
- The Footer / Header use `mainNavigation` and `footerNavigation` from `src/content/navigation.ts`. After the day-use repositioning, `/nomera` is **removed** from main nav.

---

## Env vars required on Vercel

For the `chimgansoy-resort` Vercel project:

```
# Telegram notifications (forms)
TELEGRAM_BOT_TOKEN           = bot token from @BotFather
TELEGRAM_CHAT_ID             = chat/group id (use getUpdates to find)

# Resend email
RESEND_API_KEY               = re_... from resend.com
BOOKING_EMAIL_FROM           = bookings@chimgandarbaza.uz (verified) or onboarding@resend.dev (test)
RESERVATIONS_EMAIL_TO        = reservations@chimgandarbaza.uz   # booking flows
INFO_EMAIL_TO                = info@chimgandarbaza.uz           # inquiry flows
# BOOKING_EMAIL_TO           = legacy fallback (optional)

# Google Maps embed
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = AIza...   # used for the iframe on /contact
```

`info@`, `reservations@`, `bookings@` are aliases of one Google Workspace mailbox (`manager@chimgandarbaza.uz`) so all of them land in the same inbox.

**Removed env vars (safe to delete from Vercel):**
- `DEEPSEEK_API_KEY` (AI chat removed)
- `NEXT_PUBLIC_BNOVO_IFRAME_URL`, `NEXT_PUBLIC_BNOVO_UID` (Bnovo removed)
- `PAYKEEPER_SERVER`, `PAYKEEPER_USER`, `PAYKEEPER_PASSWORD` (online payment removed)

---

## DNS & domain

**Domain:** `chimgandarbaza.uz` — registered through **PS Cloud Services** (Uzbek registrar). Registered 2026-06-04.

**Nameservers** (at the .uz registry level): `ns1.pscloud.uz`, `ns2.pscloud.uz`. DNS zone is managed in the PS Cloud console.

**Required records in the PS Cloud DNS zone:**

| Type | Host | Value | Purpose |
|---|---|---|---|
| A | `@` (apex) | `216.198.79.1` | Vercel anycast for the website |
| CNAME | `www` | `chimgandarbaza.uz` | redirect www to apex |
| MX | `@` | `smtp.google.com` (priority 1) | Google Workspace for mail |
| TXT | `@` | `google-site-verification=...` | Google Search Console |
| (planned) TXT | `_resend._domainkey` etc. | DKIM / SPF | for Resend domain verification — adds **alongside** the Google MX, NOT replacing it |

**Note about Vercel IPs:** Vercel currently recommends `216.198.79.1`. The old `76.76.21.21` and `cname.vercel-dns.com` still work — both are anycast. Don't change unless Vercel's UI says to.

**Legacy EC2 (no longer used for the site):** `ec2-18-191-216-40.us-east-2.compute.amazonaws.com`, SSH user `ubuntu`, project path `/home/ubuntu/chimgansoy`, PM2 app `chimgansoy`, key at `C:\Users\Abdurasul\Desktop\Keypem_Sales\hotel.pem`. Kept around in case of rollback; not the production target any more.

---

## Component conventions

### Form fields

Two custom popup inputs replace the native ones:

- **`src/components/ui/DatePicker.tsx`** — month-grid calendar popup with localized weekday/month names, today highlight, past-date disable via `minToday`. Submits ISO `YYYY-MM-DD` via a hidden input.
- **`src/components/ui/GuestSelect.tsx`** — accordion dropdown with options `1..8`. Hidden input for form submission.

Both are client components that wrap a single visible `<button>` trigger and emit standard form values, so any `<form action="GET">` keeps working.

### Sections vs UI

- `src/components/sections/` — page-level blocks (Hero, PriceList, ServicesGrid, …).
- `src/components/ui/` — atomic widgets (DatePicker, ButtonLink, Icon, FaqPanel, …).
- `src/components/layout/` — Header, Footer, ContactForm, StickyBookingCta.

### Imagery

Image assets are registered in `src/content/images.ts` as `{ src, localSrc?, position?, alt: LocalizedString }`. `localSrc` is the preferred local file under `public/images/resort/...`; `src` is an Unsplash fallback used only when `localSrc` is missing or as a remote backup.

Real local photos: `chimgan.jpg`, `kanatnaya_doroga.jpg`, `gorniy_progulki.jpg`, `konniy_progulka.webp`, plus the original aerial set numbered `01-...` through `18-...`.

### CSS variables (brand palette)

Defined in `src/app/globals.css`. The ones used most:

- `--ink` — primary dark text / dark surfaces
- `--paper`, `--surface`, `--surface-warm` — neutrals
- `--accent`, `--accent-strong` — forest green
- `--sun`, `--sun-dark` — brand gold for CTAs
- `--line`, `--line-strong` — borders
- `--shadow-card`, `--shadow-card-hover` — card elevations

---

## Common gotchas

1. **`translations.ts` is huge** (~300 lines per locale × 3). When adding a new key, **always add it to all three locales** or TypeScript will complain at the call site.
2. **`.next` cache lies after structural changes** (deleting an API route, renaming a page). If `tsc --noEmit` fails with `Cannot find module '.../route.js'`, delete `.next/` and re-check.
3. **Forms must include a hidden `formType` input** (`booking` or `inquiry`) so `submitContact` knows which inbox to use. Forget it and submissions route via the legacy fallback.
4. **Push to `master` triggers a Vercel prod deploy.** Don't push WIP that breaks the build to `master` — use a feature branch first.
5. **CRLF warning on Windows** — the repo is set to normalize to LF. Git will warn `CRLF will be replaced by LF` on commits; this is fine.
6. **`assistant-knowledge.ts`** is partially out of sync with the day-use repositioning (mentions overnight, pool, etc.) — when re-aligning content, update there too.
7. **Glamping content is paused, not deleted.** `src/content/rooms.ts`, `src/app/[locale]/nomera/[slug]/page.tsx`, the FAQ entries for cottage/glamping/checkin/cancellation/pool — all kept for the eventual return. Don't rip them out.

---

## Useful command snippets (Windows / PowerShell)

The standard `node` / `npm` / `npx` aren't on PATH in this environment. Use the full paths:

```powershell
# Type check
& 'C:\Program Files\nodejs\node.exe' .\node_modules\typescript\bin\tsc --noEmit

# Lint
& 'C:\Program Files\nodejs\node.exe' .\node_modules\eslint\bin\eslint.js 'src/**/*.{ts,tsx}'

# Build (regenerates .next types)
& 'C:\Program Files\nodejs\node.exe' .\node_modules\next\dist\bin\next build

# Install a package
& 'C:\Program Files\nodejs\npm.cmd' install <pkg>
```

SSH to the legacy EC2 (rarely needed):

```powershell
# Copy the key to a temp location with strict ACL first
$key = "$env:TEMP\hotel-deploy.pem"
Copy-Item 'C:\Users\Abdurasul\Desktop\Keypem_Sales\hotel.pem' $key -Force
& 'C:\Windows\System32\icacls.exe' $key /inheritance:r /grant:r "${env:USERNAME}:R" | Out-Null
& 'C:\Windows\System32\OpenSSH\ssh.exe' -i $key ubuntu@ec2-18-191-216-40.us-east-2.compute.amazonaws.com
```

---

## Session history (high-level — what's been done)

In rough order, what previous sessions built / changed (commit hashes from `git log --oneline`):

- **Brand & layout foundation** — official SVG logo, favicon, header/footer, currency widget (UZS + CBU rates), winter season detector with snow/Santa/Christmas-tree hero, AI-chat assistant (later removed).
- **`b44c039` chore: bilingual SEO + winter slide refresh** — `robots.ts`/`sitemap.ts` switched to bilingual domain origins; winter hero photo swap.
- **`9e1a6cf` feat: scroll-expansion territory section on homepage** — added `ScrollExpandMedia` + framer-motion. Removed later (see below).
- **`44963bb` feat: real contact info + Instagram channel** — replaced placeholder phone with `+998 70 176 00 11`, added Instagram everywhere.
- **`d3fc6f9` feat: switch booking to request-form flow (drop Bnovo + PayKeeper)** — biggest single change. Removed `BnovoEmbed`, `PaymentForm`, `/api/pay`, dictionary `payment:` block. `BookingRequestForm` now has dates / guests / room hidden field. `BookingDrawer` no longer opens an iframe modal.
- **`1ac52c9` feat: forward booking requests to email (Resend) alongside Telegram** — `submitContact` now sends both. Best-effort. Required env vars introduced.
- **`d62fb8b` feat: reposition site as day-use mountain venue with real price list** — content overhaul. New `pricing.ts` (7-item Mon-Thu / Fri-Sun grid), `PriceList` section. Stats bar updated. Glamping/cottages hidden. `/nomera` becomes "Coming soon", noindex. Hours fixed to 08:00–18:00.
- **`04ead38` fix: scroll-expand title fragments** — patched the broken split title.
- **`349a6c8` feat: custom calendar + guest picker, lead with price list, drop scroll-expand** — new `DatePicker` and `GuestSelect` components, homepage reorder (Hero → PriceList → BookingWidget). `ScrollExpandMedia` use removed from page; component file kept.
- **`bcdc580` content: real photos for Chimgan attractions block** — 4 user-uploaded local photos wired into `/place` cards via new `chimganMountains` / `cableCars` / `mountainWalks` / `horseRiding` image keys.
- **`3c31f9f` feat: replace DeepSeek AI assistant with local FAQ matcher** — knowledge base + matcher (was user WIP merged separately).
- **`31daf8d` feat: replace chat-style assistant with proper FAQ panel** — chat UI swapped for an accordion FAQ with search and a contact-fallback footer. `AiAssistant.tsx` deleted, `FaqPanel.tsx` added.
- **`e592aed` style: footer contact form to match the dark editorial aesthetic** — labels above fields, gold focus ring, success-card with check icon.
- **`69a3bd8` feat: route booking vs inquiry submissions to separate inboxes** — hidden `formType` per form; action routes to `RESERVATIONS_EMAIL_TO` vs `INFO_EMAIL_TO`.
- **`1e0fb10` copy: drop the rigid 15-minute reply promise** — replaced "в течение 15 минут" with "в ближайшее время" across `translations.ts`, `PriceList`, `BookingDrawer`, `faq.ts`.

---

## Open / known issues to be aware of

- **Email delivery hadn't been verified end-to-end as of the last session.** Inboxes (`manager@`, `info@`, `reservations@` aliases) were empty after test submissions. Most likely cause: `RESEND_API_KEY` and friends not yet set in Vercel for the `chimgansoy-resort` project, OR Resend domain not yet verified. Telegram delivery status was never explicitly confirmed by the user either — that's the first signal to verify before chasing email config.
- **`assistant-knowledge.ts`** still references overnight stays / pool / 15-minute reply promise in some entries. When the user has time, those entries deserve a day-use rewrite (or just hide the obsolete ones via `FAQ_ORDER`).
- **`/services` page content** was last updated for the resort positioning; it may still reference pool / padel court / playground that aren't actually on the property. Not yet rewritten for day-use.
