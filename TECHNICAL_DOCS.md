# TECHNICAL_DOCS.md — CHIMGAN DARBAZA

Technical documentation for the **chimgandarbaza.uz** website.

> **Stack correction:** an earlier brief described this as "React + Vite/CRA on
> Cloudflare Pages with Ostrovok/Booking.com." That is **not** what this repo is.
> The real stack is documented below and verified against the codebase:
> **Next.js 16 (App Router) + React 19 + Tailwind v4, deployed on Vercel, booking
> via Exely.** There is currently **no** Ostrovok or Booking.com integration.

---

## 1. Project overview

**Purpose.** Marketing + booking website for **Chimgan Darbaza** — a day-use
mountain venue (topchans, BBQ/kazan, kitchen, pool) 45 min from Tashkent at
1700 m, with glamping/cottage stays. The site presents the venue in 3 languages
and funnels visitors into the **Exely** online booking engine.

**Tech stack (verified in `package.json`):**

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.4 |
| UI library | React | 19.2.4 |
| Animation | Framer Motion | 12.40 |
| Styling | Tailwind CSS | v4 (CSS variables) |
| Language | TypeScript (strict) | 5.x |
| Tests | Vitest + Playwright | — |
| Node | Node.js | 22.x (dev on 22.13) |
| Hosting | **Vercel** (auto-deploy from GitHub `master`) | — |
| Booking | **Exely** booking engine (hotel `514200`) | — |

**No database, no CMS, no auth.** All content is TypeScript modules under
`src/content/`. Two form submissions are handled by a Next.js Server Action
(`src/app/actions/contact.ts`) that sends to Telegram + email (Resend).

### Folder structure

```
chimgan-darbaza-site/
├─ public/                     Static assets served as-is
│  └─ images/resort/           All photos (hero, gallery, rooms, pool.jpg, ...)
├─ src/
│  ├─ app/                     Next.js App Router
│  │  ├─ [locale]/             All pages live under /ru, /uz, /en
│  │  │  ├─ page.tsx           Homepage
│  │  │  ├─ layout.tsx         Global layout (mounts Exely head-loader, header/footer)
│  │  │  ├─ bron/page.tsx      /bron — the Exely booking engine page
│  │  │  ├─ nomera/            Rooms list + nomera/[slug] room detail pages
│  │  │  ├─ services, place, about, contact, legal/[slug]
│  │  │  ├─ error.tsx, loading.tsx, not-found.tsx
│  │  ├─ actions/contact.ts    Server Action: Telegram + email (Resend)
│  │  └─ api/                   rates (CBU exchange), images proxy, sitemap, robots
│  ├─ components/
│  │  ├─ layout/               Header, Footer, ContactForm (inquiry), StickyBookingCta
│  │  ├─ sections/             Page blocks: Hero, PriceList, BookingWidget,
│  │  │                        BookingRequestForm, RoomCatalog, PoolBooking,
│  │  │                        ExelyBookingEngine, LeisureShowcase, ...
│  │  ├─ ui/                   DatePicker, GuestSelect, FaqPanel, ButtonLink,
│  │  │                        BookingEngineSlot, ScrollObserver, LogoIntro, Icon
│  │  └─ effects/              SnowParticles (winter hero)
│  ├─ content/                 ALL editable data (TypeScript modules)
│  │  ├─ translations.ts       BIG file — ru/uz/en UI strings (edit all 3)
│  │  ├─ pricing.ts            Day-use price list
│  │  ├─ contacts.ts           Phone, email, socials, address, hours, coordinates
│  │  ├─ images.ts             Image registry (key → { src, localSrc, alt })
│  │  ├─ rooms.ts              Glamping + cottage data
│  │  ├─ services.ts           Services cards
│  │  ├─ seo.ts                Per-page SEO titles/descriptions
│  │  ├─ navigation.ts         Header + footer nav links
│  │  └─ testimonials.ts, promotions.ts, assistant-knowledge.ts, ...
│  ├─ i18n/                    config.ts (locales ru/uz/en), routing.ts, domains.ts
│  └─ lib/                     metadata, localize, images, weather, search-params
├─ tests/                      load (autocannon) + e2e (Playwright)
├─ next.config.ts              Next.js config
├─ tailwind / postcss.config.mjs, eslint.config.mjs, vitest.config.ts
├─ CLAUDE.md / AGENTS.md       In-repo engineering guide (READ THIS for deep context)
└─ package.json
```

---

## 2. Local install & run

**Requirements:** Node.js **22.x**, npm (bundled). Git.

```bash
# 1. Clone
git clone https://github.com/Abdurasul99/chimgansoy_resort.git
cd chimgansoy_resort

# 2. Install dependencies
npm install

# 3. Create local env file (see below), then run dev server
npm run dev          # http://localhost:3000

# 4. Production build + run
npm run build
npm run start

# Other useful scripts
npm run lint         # ESLint
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright end-to-end
```

> On Windows without Node on PATH, use full paths, e.g.
> `& 'C:\Program Files\nodejs\node.exe' .\node_modules\next\dist\bin\next dev`.

### Environment variables

Create **`.env.local`** in the project root (git-ignored). **Values are not
stored in this doc** — get them from the existing `.env.local`, from Vercel
(Project → Settings → Environment Variables), or from your password manager.

**Currently used variables:**

| Variable | Purpose | Where the value lives |
|---|---|---|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps embed on /contact | `.env.local` + Vercel |
| `TELEGRAM_BOT_TOKEN` | Bot that posts form submissions to Telegram | `.env.local` + Vercel |
| `TELEGRAM_CHAT_ID` | Target chat/channel id for notifications | `.env.local` + Vercel |
| `RESEND_API_KEY` | Resend HTTP API — sends form emails | Vercel |
| `BOOKING_EMAIL_FROM` | Verified sender (e.g. `reception@chimgandarbaza.uz`) | Vercel |
| `RESERVATIONS_EMAIL_TO` | Recipient for booking-form emails | Vercel |
| `INFO_EMAIL_TO` | Recipient for footer inquiry emails | Vercel |

**Legacy variables still in `.env.local` — SAFE TO DELETE** (their integrations
were removed): `NEXT_PUBLIC_BNOVO_IFRAME_URL`, `NEXT_PUBLIC_BNOVO_UID`,
`PAYKEEPER_SERVER`, `PAYKEEPER_USER`, `PAYKEEPER_PASSWORD`, `DEEPSEEK_API_KEY`.

> Note: Exely needs **no** website env var — its loader is embedded directly in
> `src/app/[locale]/layout.tsx` (see §4).

---

## 3. Deploy — **Vercel** (not Cloudflare Pages)

The site is hosted on **Vercel** and **auto-deploys on every push to `master`**.

**Connect / settings (Vercel dashboard → the `chimgansoy-resort` project):**

- **Git**: connected to GitHub `Abdurasul99/chimgansoy_resort`, production branch `master`.
- **Framework preset**: Next.js (auto-detected).
- **Build command**: `next build` (default). **Output**: `.next` (managed by Vercel; do not set a static "output directory").
- **Install command**: `npm install`. **Node**: 22.x.
- **Env vars**: set the §2 variables under Settings → Environment Variables (Production + Preview).

**Custom domain `chimgandarbaza.uz`:**
1. Vercel → Project → **Settings → Domains** → add `chimgandarbaza.uz` (+ `www`).
2. Vercel shows the required records. Add them in the **DNS zone at PS Cloud** (see below).
3. Wait for verification + SSL (automatic).

**DNS — where to view/change it:** the domain is registered at **PS Cloud
Services (pscloud.uz)**; nameservers `ns1.pscloud.uz` / `ns2.pscloud.uz`; the DNS
zone is managed in the **PS Cloud console**.

Required records (already set; documented for reference):

| Type | Host | Value | Purpose |
|---|---|---|---|
| A | `@` | `216.198.79.1` | Vercel anycast (site) |
| CNAME | `www` | `chimgandarbaza.uz` | www → apex |
| MX | `@` | `smtp.google.com` (prio 1) | Google Workspace mail |
| TXT | `@` | `google-site-verification=…` | Search Console |
| TXT | `_resend._domainkey` etc. | DKIM/SPF | Resend email verification |

> Old Vercel IPs (`76.76.21.21`, `cname.vercel-dns.com`) still work. Don't change
> unless Vercel's dashboard tells you to.

---

## 4. Exely booking integration

Booking is powered by **Exely** (hotel code `514200`, integration
`BE-INT-chimgandarbaza-uz_2026-06-24`). There is **no** Ostrovok / Booking.com
integration in the site; if channel-manager distribution is wanted, it is
configured inside Exely (Channel Manager), not in this repo.

**How it's wired:**
- The Exely **head loader** is an inline script in
  `src/app/[locale]/layout.tsx`. It is **guarded to run only on `/bron`** (loads
  Exely's JS and embeds the engine into `#be-booking-form`). The context language
  is set per locale (ru/uz/en).
- The booking page is `src/app/[locale]/bron/page.tsx`, which renders
  `ExelyBookingEngine` → `BookingEngineSlot` (the `#be-booking-form` host + a
  loading/failure state). On the booking page the footer and the floating FAQ
  widget are hidden (per Exely's checklist).
- **All "book" paths do a FULL navigation to `/bron`** (plain `<a>`, GET forms) —
  Exely's engine only embeds on a full page load, not on SPA navigation.

**Room-type deep links** (open the engine on a specific item):
`/<locale>/bron?room-type=<ID>`

| Item | Type | ID |
|---|---|---|
| Glamping | room-type | `5075760` |
| Cottage / The Chalet | room-type | `5075761` |
| Topchan / day visit | room-type | `5075762` |
| **Swimming pool** | **service** (not a room-type) | `5075692` — can't use `?room-type=`; pool CTAs go to `/bron` and the guest selects it |

The full list of room links is in Exely's package: `…/scripts/chimgandarbaza/LINK/links_room.html`.

**Booking confirmation templates / emails / currency** are configured **in the
Exely admin** (secure.exely.com), not in this repo:
- Confirmation letters + the post-booking survey language → Exely admin (Документооборот / letters).
- Display currency (should be **UZS**; currently shows KRW until changed) → Exely admin.
- Prices & availability (rooms show as unavailable until priced/opened) → Exely (Управление номерами → цены/доступность).

---

## 5. Google Workspace email

- Primary mailbox: **`manager@chimgandarbaza.uz`** (Google Workspace user "Roman Hotel Owner").
- **Aliases** (all deliver to the manager@ mailbox): `info@`, `reservations@`,
  `bookings@`, `reception@`, `contact@`, `accounts@`, `sales@`. Managed in
  **Google Admin → Directory → Users → (user) → Alternate email addresses**.
- **MX records** are set in the **PS Cloud DNS zone** (`smtp.google.com`, prio 1).
- **Transactional email** (form notifications) is sent via **Resend** (HTTP API),
  from `BOOKING_EMAIL_FROM`; the domain must be verified in Resend (SPF/DKIM TXT
  records in PS Cloud, alongside the Google MX — not replacing it).

---

## 6. Components & how to edit common things

All editable content is under `src/content/` (TypeScript modules). Change these,
commit, push to `master` → Vercel redeploys automatically.

| I want to change… | Edit this file |
|---|---|
| Any UI text (buttons, headings) | `src/content/translations.ts` — **update all 3 locales (ru/uz/en)** |
| Day-use prices | `src/content/pricing.ts` |
| Phone / email / socials / address / hours | `src/content/contacts.ts` |
| Photos (swap/add) | put file in `public/images/resort/…`, then register the key in `src/content/images.ts` |
| Rooms (glamping / cottage) | `src/content/rooms.ts` |
| Services cards | `src/content/services.ts` |
| Pool block text | `src/components/sections/PoolBooking.tsx` (COPY object) |
| SEO titles/descriptions | `src/content/seo.ts` |
| Header / footer nav links | `src/content/navigation.ts` |

**Key components (where they live):**

| Component | File | Role |
|---|---|---|
| `Header` / `Footer` | `src/components/layout/` | Nav, language/season switch, footer |
| `Hero` | `src/components/sections/Hero.tsx` | Homepage hero + booking widget + pool CTA |
| `BookingWidget` | `src/components/sections/BookingWidget.tsx` | Date/guest search → `/bron` |
| `BookingRequestForm` | `src/components/sections/BookingRequestForm.tsx` | Contact-page search → `/bron?room-type` |
| `ExelyBookingEngine` / `BookingEngineSlot` | `src/components/sections/`, `src/components/ui/` | Hosts the Exely engine on `/bron` |
| `RoomCatalog` | `src/components/sections/RoomCatalog.tsx` | Room cards → `/bron?room-type=<ID>` |
| `PoolBooking` | `src/components/sections/PoolBooking.tsx` | Pool feature + "Book the pool" |
| `PriceList` | `src/components/sections/PriceList.tsx` | Day-use price list |
| `ContactForm` | `src/components/layout/ContactForm.tsx` | Footer inquiry → Telegram/email |

> For deeper engineering context (conventions, gotchas, history), read the
> in-repo **`CLAUDE.md`**.
