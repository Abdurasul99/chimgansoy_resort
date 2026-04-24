# Bnovo Integration Requirements — CHIMGANSOY

## Current Status

**Integration type**: iframe embed only  
**Booking page URL**: `https://reservationsteps.ru/rooms/index/{uid}`  
**UID**: `a0e409c0-d724-409f-9044-b8c45585aa76`  
**Env variable**: `NEXT_PUBLIC_BNOVO_IFRAME_URL` in `.env.local` / `.env.production`

The Bnovo booking system is embedded as an iframe inside a premium branded container. The iframe loads the full Bnovo booking flow (room selection → dates → guest details → payment). A loading skeleton is shown until the iframe content is ready.

---

## What Works Now

- Iframe embed on `/bron` page — full Bnovo booking flow
- Booking modal on room detail pages (`/nomera/glamping`, `/nomera/cottage`) via BookingDrawer component
- Date pre-fill: `dfrom` / `dto` / `adults` URL params passed to the iframe
- Branded container with CHIMGANSOY header bar
- Skeleton loader until iframe loads
- Fallback to `/bron` page when `NEXT_PUBLIC_BNOVO_IFRAME_URL` is not set

---

## What Requires Bnovo API Credentials

To build a **native booking experience** (no iframe, native dates/prices UI), the following is needed from the client's Bnovo account:

| Item | Details |
|------|---------|
| Bnovo API key | From Bnovo personal account → Settings → API |
| Property ID | The numeric ID of the property in Bnovo |
| API base URL | `https://api.bnovo.ru/v1/` (confirm with Bnovo support) |
| Room type IDs | IDs matching `glamping` and `cottage` rooms in Bnovo |
| Rate plan IDs | For pricing display |

With these, we can build:
- Real-time availability calendar
- Native pricing display (remove "Цена по запросу")
- Date picker with blocked dates
- Room-specific booking flow
- Confirmation emails via Bnovo

---

## Client Questions

1. **Does the client have a Bnovo account?** If yes, please provide login credentials or API key.
2. **What is the official widget URL?** (From Bnovo account → Widget → Copy URL)
3. **Are room names in Bnovo matching** `Глэмпинг` and `Коттедж`?
4. **Is payment processing** configured in Bnovo (CloudPayments, PayKeeper, etc.)?
5. **What email** should receive booking notifications?

---

## Fallback Strategy

If no Bnovo API access is provided:
- Keep iframe embed (current approach)
- Add contact request form as primary CTA
- WhatsApp / Telegram / phone as booking channels
- Status: fully functional for client-managed bookings
