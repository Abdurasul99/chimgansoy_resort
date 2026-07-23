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
(update)             (verify secret,            (renders views)
                      check allowlist)                │
                                                      ▼
                                          src/lib/exely-pms.ts
                                          (Exely PMS API, X-API-KEY,
                                           connect.hopenapi.com/api/exelypms/v1)
```

Files:

| File | Purpose |
|---|---|
| `src/app/api/telegram/staff/route.ts` | Webhook: secret check, allowlist, always 200 |
| `src/lib/staff-bot.ts` | Commands, inline menus, message formatting |
| `src/lib/exely-pms.ts` | Typed Exely PMS API client + aggregations |
| `src/lib/telegram.ts` | Tiny Telegram Bot API helper (fetch, no SDK) |
| `scripts/telegram-setup.mjs` | Register / inspect / delete the webhook; find staff IDs |
| `scripts/staff-bot-poll.mjs` | Local runner: drive the bot without a public webhook |

---

## The Exely API (confirmed)

The bot uses Exely's **official** "Универсальный API Exely PMS" (v1.5.0), **not**
the unofficial widget scrape in `src/lib/exely.ts`.

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

# Staff bot
TELEGRAM_STAFF_BOT_TOKEN=             # from @BotFather (a NEW, separate bot)
TELEGRAM_WEBHOOK_SECRET=              # any random string; Telegram echoes it back
```

`EXELY_API_KEY` and `TELEGRAM_STAFF_BOT_TOKEN` are server-only (no
`NEXT_PUBLIC_` prefix) — they are never exposed to the browser.

---

## ~~Finding staff Telegram IDs~~ (obsolete)

The bot is public now — `TELEGRAM_STAFF_IDS` is ignored and can be deleted.

---

## Deploy (production, 24/7)

This Vercel account deploys via the **Vercel CLI** — `git push` does **not**
auto-deploy.

1. Set the env vars above in Vercel (project `chimgandarbaza`).
2. Deploy: `vercel --prod` (from the manager@ account).
3. Register the webhook (once the route is live):
   ```powershell
   & 'C:\Program Files\nodejs\node.exe' .\scripts\telegram-setup.mjs set https://chimgandarbaza.uz/api/telegram/staff
   & 'C:\Program Files\nodejs\node.exe' .\scripts\telegram-setup.mjs info   # verify
   ```
   `set` reads `TELEGRAM_WEBHOOK_SECRET` from `.env.local` and passes it as the
   webhook `secret_token`, so the value in Vercel must match.
4. In Telegram, send `/start` → the menu appears. Ask the bot any question
   (e.g. «сколько свободно завтра?») to confirm the Exely connection.

Health check without Telegram: open
`https://chimgandarbaza.uz/api/telegram/staff` — returns
`{"ok":true,"configured":true}` when token, key, and allowlist are all set.

---

## Test locally (no deploy)

Run the bot from your machine against the real Exely API, no public webhook:

```powershell
# terminal 1 — app
& 'C:\Program Files\nodejs\node.exe' .\node_modules\next\dist\bin\next dev -p 3000
# terminal 2 — poller (long-polls Telegram → forwards to the local route)
& 'C:\Program Files\nodejs\node.exe' .\scripts\staff-bot-poll.mjs
```

Make sure **no** webhook is set first (`telegram-setup.mjs delete`), otherwise
Telegram won't deliver updates to `getUpdates`. Stop the poller (and delete any
webhook) before switching to production.

---

## Commands

| Command | Action |
|---|---|
| `/start`, `/menu` | Main menu |
| `/ai` | AI concierge intro |
| `/ceny` | Day-use price list |
| `/contacts` | Contacts & directions |
| `/bron` | Online-booking link |

Most navigation is via inline buttons (date arrows, period switches), so staff
rarely type commands.

---

## Notes / limits

- **Online booking**: the Universal API is read + operations (check-in/out,
  payments) — it has **no create-reservation endpoint**. So "book online" is a
  link to the Exely booking engine on `/bron`, where the guest picks dates + room
  and pays. The engine is a JS embed (`BE-INT-chimgandarbaza-uz_2026-06-24`) with
  no URL that pre-fills dates, so the bot can't deep-link specific dates/rooms.
- **Room-type names**: `ROOM_TYPE_NAMES` in `src/lib/exely-pms.ts` maps
  `roomTypeId → name`; confirmed against live `/rooms` (`5075760` Глэмпинг,
  `5075761` Шале). If a new type appears as «Категория 12345», add it there.
