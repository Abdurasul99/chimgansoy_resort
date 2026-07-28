# Telegram guest bot — AI concierge

> **REPURPOSED 2026-07-23**: per the operator, this bot is for **GUESTS only**
> (was a staff PMS console before — see git history). No staff data, no
> occupancy, no guest lists, no finances. Public — no allowlist.

What guests get from **[@chimgandarbaza_bot](https://t.me/chimgandarbaza_bot)**:

- **🤖 ИИ-помощник** — the AI concierge (same Groq stack + shared venue
  knowledge as the site chat): prices, free dates, booking, directions, any
  language. Guests explicitly opt in via the «Поговорить с ИИ» screen and every
  AI answer is prefixed 🤖.
- **🌐 Онлайн-бронирование** — link into the Exely booking engine
- **🏷 Цены дня** — fixed day-use price list (from `pricing.ts`)
- **📞 Контакты** — phone/WhatsApp/Instagram, address, map, hours

It runs **inside the existing Next.js app** as a webhook route — no separate
server. Stateless (views carry state in `callback_data`), so it works on
Vercel serverless. The AI's only tool is the PUBLIC booking-engine
availability/prices (`src/lib/exely.ts`); the PMS client (`exely-pms.ts`)
stays in the repo unused, for a possible future owner/admin surface.

---

## How it works

```
Telegram  ──POST──▶  /api/telegram/staff  ──▶  src/lib/staff-bot.ts
(update)             (verify secret only,       (menus, photos, views)
                      bot is public)                 │
                                       ┌─────────────┴─────────────┐
                                       ▼                           ▼
                            src/lib/staff-ai.ts          src/lib/exely.ts
                            (Groq + venue-facts)         (public booking-engine
                                       │                  prices — the ONLY
                                       └──── tool ───────▶ live data source)
```

Files:

| File | Purpose |
|---|---|
| `src/app/api/telegram/staff/route.ts` | Webhook: secret check, always 200, `maxDuration=30` |
| `src/lib/staff-bot.ts` | Menus, views, photos, dispatch (`handleGuestUpdate`) |
| `src/lib/staff-ai.ts` | Guest AI concierge (`answerGuestQuestion`), Groq + 1 tool |
| `src/lib/venue-facts.ts` | **Shared** venue knowledge — used by the bot AND the site concierge |
| `src/lib/bot-weather.ts` | Live mountain weather (open-meteo, cached 10 min) |
| `src/lib/exely.ts` | Public booking-engine availability/prices |
| `src/lib/telegram.ts` | Telegram Bot API helper (sendMessage/Photo/MediaGroup) |
| `scripts/telegram-setup.mjs` | `set` / `info` / `delete` webhook, `meta` (bot profile) |
| `scripts/staff-bot-poll.mjs` | Local dev runner — **refuses to run while a webhook is set** |
| `scripts/check-webhook.mjs` | Guard used by `start-staff-bot.bat` |
| `src/lib/exely-pms.ts` | **Unused** PMS client (kept for a future owner-only surface) |

---

## The Exely PMS API (reference — NOT used by the guest bot)

> The guest bot deliberately uses **only** the public booking-engine prices
> (`src/lib/exely.ts`). The PMS API below is documented because it is confirmed
> working and `src/lib/exely-pms.ts` implements it — ready for a future
> **owner-only** surface (occupancy, arrivals, finances). Do not wire any of it
> into the public bot.

Exely's **official** "Универсальный API Exely PMS" (v1.5.0):

- **Base URL: `https://connect.hopenapi.com/api/exelypms/v1`** (confirmed live
  2026-07-22 — `GET /rooms` → 200). Set in `EXELY_API_BASE`; the code also
  defaults to this.
- Auth: single integration key in the **`X-API-KEY`** header
  (Exely admin → Управление отелем → Настройки → Интеграции →
  «Доступ к Универсальному API Exely PMS»). Stored as `EXELY_API_KEY`.
- **No IP whitelisting needed.**
- Full spec: PDF on Google Drive linked from
  <https://exely.com/ru/help/kb335710/>. Swagger:
  <https://connect.hopenapi.com/api/exelypms/swagger/ui/index>.

Endpoints used: `GET /rooms`; `GET /bookings?state=Active&affectsPeriodFrom&affectsPeriodTo`
(returns `{bookingNumbers:[]}` — then `GET /bookings/{number}` per number);
`GET /analytics/payments?startDateTime&endDateTime` (`yyyyMMddHHmm`, no future
dates, ≤31 days). Analytics endpoints return `{"data": null}` when the period is
empty — the client treats that as no data.

Inventory today: 20 rooms — 10 Глэмпинг (`roomTypeId 5075760`) + 10 Шале
(`5075761`). Topchan/pool are day-use and are **not** in the PMS room inventory.

---

## Environment variables

Add to Vercel (project `chimgandarbaza`) **and** `.env.local`:

```
# Exely official PMS API
EXELY_API_KEY=<integration-key>       # from the Exely admin Integrations tab
EXELY_API_BASE=https://connect.hopenapi.com/api/exelypms/v1

# Bot
TELEGRAM_STAFF_BOT_TOKEN=             # from @BotFather (a NEW, separate bot)
TELEGRAM_WEBHOOK_SECRET=              # any random string; Telegram echoes it back
```

`EXELY_API_KEY` and `TELEGRAM_STAFF_BOT_TOKEN` are server-only (no
`NEXT_PUBLIC_` prefix) — they are never exposed to the browser.

---

## ~~Finding staff Telegram IDs~~ (obsolete)

The bot is public now — `TELEGRAM_STAFF_IDS` is ignored and can be deleted.

---

## Production (LIVE since 2026-07-24)

The bot runs 24/7 on the **manager@ team** Vercel project `chimgandarbaza`
(team `manager-1855`), same deployment as the website:

- Webhook: **`https://chimgandarbaza.uz/api/telegram/staff`**
- Env vars (above) are set in that project's **Production** environment.

**Redeploying after code changes** — this project does **not** auto-deploy from
GitHub; a `git push` alone changes nothing in production. Deploy explicitly:

```powershell
# either: log in as manager@ once, then
& "C:\Program Files\nodejs\node.exe" "$env:APPDATA\npm\node_modules\vercel\dist\vc.js" --prod

# or: with a Vercel API token created under manager@ (Settings → Tokens)
& "C:\Program Files\nodejs\node.exe" "$env:APPDATA\npm\node_modules\vercel\dist\vc.js" --prod --yes --token <TOKEN>
```

The webhook keeps pointing at the same URL, so it survives redeploys — no need
to re-register it.

Health check without Telegram: open
`https://chimgandarbaza.uz/api/telegram/staff` — returns
`{"ok":true,"service":"chimgandarbaza guest bot","configured":true}` when the
bot token and Groq key are present.

Webhook state: `node scripts/telegram-setup.mjs info` (watch `last_error_message`
and `pending_update_count` — both should be empty/0).

---

## Test locally (rarely needed — the bot is live)

> ⚠️ **Local polling and the production webhook are mutually exclusive.**
> Telegram delivers each update to exactly one of them. To poll locally you must
> `delete` the webhook first — which **takes the bot offline for real guests**
> until you set it back. `staff-bot-poll.mjs` and `start-staff-bot.bat` now
> detect an active webhook and refuse to start, so this can't happen by accident.

Prefer testing against production instead: deploy and message the bot, or POST a
synthetic update to the live route with the `x-telegram-bot-api-secret-token`
header.

If you really need local polling:

```powershell
node scripts\telegram-setup.mjs delete            # ⚠️ bot stops answering guests
& 'C:\Program Files\nodejs\node.exe' .\node_modules\next\dist\bin\next dev -p 3000
& 'C:\Program Files\nodejs\node.exe' .\scripts\staff-bot-poll.mjs
# when done — ALWAYS restore production:
node scripts\telegram-setup.mjs set https://chimgandarbaza.uz/api/telegram/staff
```

---

## Commands

| Command | Action |
|---|---|
| `/start`, `/menu` | Hero photo + main menu |
| `/ai` | AI concierge intro |
| `/daty` | Date picker → live prices for that night |
| `/ceny` | Day-use price list |
| `/pogoda` | Live mountain weather + clothing tip |
| `/foto` | Photo album of the venue |
| `/bron` | Online-booking link |
| `/contacts` | Contacts & directions |

The same list is registered in Telegram's UI via
`node scripts/telegram-setup.mjs meta` (also sets the bot's description).

Most navigation is via inline buttons, so guests rarely type commands — free
text goes to the AI concierge.

---

## Notes / limits

- **Online booking**: the Universal API is read + operations (check-in/out,
  payments) — it has **no create-reservation endpoint**. So "book online" is a
  link to the Exely booking engine on `/bron`, where the guest picks dates + room
  and pays. The engine is a JS embed (`BE-INT-chimgandarbaza-uz_2026-06-24`) with
  no URL that pre-fills dates, so the bot can't deep-link specific dates/rooms.
- **Where content lives**: venue facts (day-use prices, room descriptions,
  cancellation rules, contacts) are in `src/lib/venue-facts.ts` — editing it
  updates **both** the bot and the site concierge. Day-use figures come from
  `src/content/pricing.ts`; the photo album and hero are URL lists at the top of
  `src/lib/staff-bot.ts` (images must exist under `public/images/resort/`).
- **AI budget**: Groq's free tier is shared with the site concierge —
  ~8K tokens/minute and roughly 30–40 AI questions/day across both. Buttons
  (prices, weather, photos, contacts) don't consume it. On rate-limit or any AI
  failure the bot falls back to the admin's phone/WhatsApp, so guests are never
  left without a route to a human.
- **Date accuracy**: the model gets a ready 14-day calendar in the prompt and is
  forbidden from computing dates itself (it got «суббота» wrong before this).
  Accommodation/pool prices are only ever quoted after a live `public_prices`
  call for that exact date.
