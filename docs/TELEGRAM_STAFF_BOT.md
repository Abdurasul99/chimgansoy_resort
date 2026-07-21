# Telegram staff bot — Exely PMS console

A Telegram bot for **hotel staff** (not guests) that reads live data from the
Exely PMS and lets staff:

- **🏠 Свободные номера** — free rooms per type for any date (the "шахматка" numbers)
- **💰 Деньги** — money flow (payments) for today / 7 / 30 days
- **👥 Гости** — visitor flow: arrivals, departures, headcount
- **🆕 Онлайн-бронь** — one-tap prefilled link to the Exely online booking engine
- **🔌 Диагностика** — checks the API connection and reports the exact error

It runs **inside the existing Next.js app** as a webhook route — no separate
server. Everything is stateless (state lives in inline-button `callback_data`),
so it works on Vercel serverless.

---

## How it works

```
Telegram  ──POST──▶  /api/telegram/staff  ──▶  src/lib/staff-bot.ts
(update)             (verify secret,            (renders views)
                      check allowlist)                │
                                                      ▼
                                          src/lib/exely-pms.ts
                                          (Exely WebPMS Universal API,
                                           X-API-KEY, /api/webpms/v1)
```

Files:

| File | Purpose |
|---|---|
| `src/app/api/telegram/staff/route.ts` | Webhook: secret check, allowlist, always 200 |
| `src/lib/staff-bot.ts` | Commands, inline menus, message formatting |
| `src/lib/exely-pms.ts` | Typed Exely WebPMS API client + aggregations |
| `src/lib/telegram.ts` | Tiny Telegram Bot API helper (fetch, no SDK) |
| `scripts/telegram-setup.mjs` | Register / inspect / delete the webhook |

---

## The Exely API — important

The bot uses Exely's **official** "Universal API Exely PMS" (aka TravelLine
WebPMS Universal API), **not** the unofficial widget scrape in `src/lib/exely.ts`.

- Auth: single integration key in the **`X-API-KEY`** header
  (Exely admin → Управление отелем → Настройки → Интеграции →
  «Доступ к Универсальному API Exely PMS»).
- Base path: **`/api/webpms/v1`**. Confirmed endpoints: `/rooms`, `/bookings`,
  `/analytics/payments`, `/analytics/services`, `/companies`.

### ⚠️ Host must be confirmed (one-time)

The key is an **Exely** key. During setup two hosts were tested from a dev machine:

- `partner.tlintegration.com` (TravelLine / RU cluster) → **401** (key not valid there)
- `partner.hopenapi.com` (Exely cluster) → **403** at the QRATOR edge

So the exact base host for hotel **514200** still needs confirming. Do one of:

1. In the Exely extranet, open the API/integration docs shown next to the key —
   it states the base URL. Set it in `EXELY_API_BASE` (include `/api/webpms/v1`).
2. Or ask Exely support: *"What is the base URL of the Universal API for hotel
   514200, and does my calling server IP need whitelisting?"*

Then set `EXELY_API_BASE` and run **🔌 Диагностика** in the bot — it prints
`✅` with a room count, or the exact HTTP error. If whitelisting is required,
the Vercel serverless egress IP is dynamic; in that case run this route on a
fixed-IP host (or a Vercel plan with a static egress IP) and allowlist it.

Default host if `EXELY_API_BASE` is unset: `https://partner.hopenapi.com/api/webpms/v1`.

---

## Environment variables

Add to Vercel (project `chimgandarbaza`) **and** `.env.local`:

```
# Exely official PMS API
EXELY_API_KEY=<integration-key>       # from the Exely admin Integrations tab
# EXELY_API_BASE=https://partner.hopenapi.com/api/webpms/v1   # set once confirmed

# Staff bot
TELEGRAM_STAFF_BOT_TOKEN=             # from @BotFather (a NEW, separate bot)
TELEGRAM_STAFF_IDS=111111111,222222222   # numeric Telegram user IDs allowed in
TELEGRAM_WEBHOOK_SECRET=              # any random string; Telegram echoes it back
```

`EXELY_API_KEY` and `TELEGRAM_STAFF_BOT_TOKEN` are server-only (no
`NEXT_PUBLIC_` prefix) — they are never exposed to the browser.

---

## Setup steps

1. **Create the bot**: message [@BotFather](https://t.me/BotFather) → `/newbot`
   → copy the token into `TELEGRAM_STAFF_BOT_TOKEN`.
2. **Get staff IDs**: each staffer messages the bot; it replies with their
   numeric ID (also get it from [@userinfobot](https://t.me/userinfobot)). Put the
   IDs, comma-separated, in `TELEGRAM_STAFF_IDS`.
3. **Set a webhook secret**: any random string in `TELEGRAM_WEBHOOK_SECRET`.
4. **Set the vars in Vercel** and deploy (this account deploys via the Vercel
   CLI — `git push` does not auto-deploy).
5. **Register the webhook** (after deploy):
   ```powershell
   & 'C:\Program Files\nodejs\node.exe' .\scripts\telegram-setup.mjs set https://chimgandarbaza.uz/api/telegram/staff
   & 'C:\Program Files\nodejs\node.exe' .\scripts\telegram-setup.mjs info   # verify
   ```
6. In Telegram, send `/start` to the bot → the menu appears. Tap
   **🔌 Диагностика** to confirm the Exely connection.

Quick health check without Telegram: open
`https://chimgandarbaza.uz/api/telegram/staff` in a browser — returns
`{"ok":true,"configured":true}` when all three (token, key, allowlist) are set.

---

## Commands

| Command | Action |
|---|---|
| `/start`, `/menu` | Main menu |
| `/svobodno` | Free rooms today |
| `/dengi` | Money flow today |
| `/gosti` | Visitor flow today |
| `/bron` | Online-booking links |
| `/ping` | API diagnostic |

Most navigation is via inline buttons (date arrows, period switches), so staff
rarely type commands.

---

## Notes / limits

- **Online booking** produces a prefilled link to the existing Exely booking
  engine (`/ru/bron?room-type=…`), which creates a real Exely reservation. The
  Universal API is read + operations (check-in/out, payments) — it has **no
  create-reservation endpoint**, so fully in-chat booking creation would need
  Exely's distribution/booking-process API (separate OAuth credentials). Add
  that later if desired.
- **Room-type names**: `ROOM_TYPE_NAMES` in `src/lib/exely-pms.ts` maps
  `roomTypeId → name`. PMS internal ids may differ from booking-engine codes;
  once a live `/rooms` response is seen, adjust the map if a type shows as
  «Тип 12345».
- **Query params** for `/bookings` and `/analytics/*` (`stayDateFrom` /
  `dateFrom`) follow the documented WebPMS build; if a live call returns empty
  where data is expected, confirm the exact param names for hotel 514200 and
  tweak `searchBookings` / `getPayments` in `exely-pms.ts`.
