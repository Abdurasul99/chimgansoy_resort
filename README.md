# CHIMGANSOY Resort Website

Production-ready multilingual resort website for **CHIMGANSOY.UZ** and **CHIMGANSOY.COM**.

The project is a marketing website plus booking funnel for a resort property in the Tashkent region. It is built with route-based localization from the first version and is ready for Bnovo booking integration.

## Stack

- Next.js 16 with App Router
- React 19
- TypeScript
- Tailwind CSS 4
- SEO metadata, sitemap, robots, Open Graph image
- Static generation for all supported locales and content pages

## Languages

Supported locales:

- `ru` Russian, default
- `uz` Uzbek
- `en` English

All public routes are locale-prefixed:

- `/ru`
- `/uz`
- `/en`

The proxy redirects non-localized paths such as `/`, `/nomera`, and `/bron` to the default Russian locale.

## Main Routes

- `/{locale}` home
- `/{locale}/nomera`
- `/{locale}/nomera/glamping`
- `/{locale}/nomera/cottage`
- `/{locale}/services`
- `/{locale}/services/pool`
- `/{locale}/services/tapchan-zone`
- `/{locale}/services/picnic-zone`
- `/{locale}/services/experience`
- `/{locale}/services/restaurant`
- `/{locale}/services/tubing-track`
- `/{locale}/services/workout-zone`
- `/{locale}/services/padel-courts`
- `/{locale}/services/kids-playground`
- `/{locale}/services/mini-football`
- `/{locale}/services/outdoor-cooking`
- `/{locale}/about`
- `/{locale}/place`
- `/{locale}/contact`
- `/{locale}/bron`
- `/{locale}/legal/how-to-get-there`
- `/{locale}/legal/accommodation-rules`
- `/{locale}/legal/payment-refund`
- `/{locale}/legal/resort-visiting-rules`
- `/{locale}/legal/public-offer`
- `/{locale}/legal/user-agreement`
- `/{locale}/legal/privacy-policy`

## Folder Structure

```txt
src/
  app/
    [locale]/
      page.tsx
      layout.tsx
      nomera/
      services/
      about/
      place/
      contact/
      bron/
      legal/
    globals.css
    robots.ts
    sitemap.ts
    [locale]/opengraph-image.tsx
  components/
    layout/
    sections/
    ui/
  content/
    attractions.ts
    contacts.ts
    faq.ts
    images.ts
    navigation.ts
    policies.ts
    promotions.ts
    rooms.ts
    seo.ts
    services.ts
    testimonials.ts
    translations.ts
    types.ts
  i18n/
    config.ts
    routing.ts
  lib/
    content.ts
    localize.ts
    metadata.ts
public/
  images/
    placeholders/
src/proxy.ts
```

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Open:

```txt
http://localhost:3000/ru
```

## Environment Variables

Create `.env.local` from `.env.example` for local secrets and integration IDs:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Variables:

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps Embed API key. Keep the key restricted to approved domains in Google Cloud.
- `NEXT_PUBLIC_BNOVO_IFRAME_URL`: official Bnovo booking iframe URL generated in the Bnovo cabinet or provided by Bnovo support.
- `NEXT_PUBLIC_BNOVO_UID`: optional Bnovo object UID for integration documentation.

Do not commit `.env.local`.

## Production Build

```bash
npm run lint
npm run build
npm run start
```

## Deployment

This app is ready for deployment on Vercel or any platform that supports Next.js 16.

Recommended environment setup before launch:

- Point `chimgansoy.uz` and `chimgansoy.com` to the deployment.
- Update canonical domain in `src/lib/metadata.ts` and `src/app/sitemap.ts` if the primary domain changes.
- Replace placeholder contact details in `src/content/contacts.ts`.
- Replace placeholder legal text in `src/content/policies.ts`.

## Multilingual Content Model

Localized strings use typed records:

```ts
{
  ru: "...",
  uz: "...",
  en: "..."
}
```

Primary content files:

- Rooms: `src/content/rooms.ts`
- Services and infrastructure: `src/content/services.ts`
- Attractions: `src/content/attractions.ts`
- Contacts: `src/content/contacts.ts`
- FAQ: `src/content/faq.ts`
- Policies and legal pages: `src/content/policies.ts`
- Promotions: `src/content/promotions.ts`
- Testimonials: `src/content/testimonials.ts`
- Navigation: `src/content/navigation.ts`
- UI translations: `src/content/translations.ts`
- SEO copy: `src/content/seo.ts`

## Bnovo Integration Point

The booking funnel is intentionally frontend-only. There is no fake booking backend.

The booking form submits selected values to the localized booking page as query params:

```txt
/{locale}/bron?checkin=YYYY-MM-DD&checkout=YYYY-MM-DD&guests=2&promo=CODE
```

The Bnovo adapter lives in:

```txt
src/components/sections/BnovoEmbed.tsx
```

Set this env variable after receiving the official Bnovo iframe/module URL:

```txt
NEXT_PUBLIC_BNOVO_IFRAME_URL=
```

Official Bnovo documentation states that the widget code is generated in the Bnovo widget configurator and that iframe/module installation data can be generated with the object's UID or requested from Bnovo support. The current implementation keeps the site ready for that production iframe without adding a custom booking backend.

## Google Maps

The contact/map block uses the supplied Google Maps location:

```txt
https://maps.app.goo.gl/AE7scBBU9DykP3st5
```

Resolved place:

```txt
Surpa dam olish oromgohi
41.5193897, 69.9904599
```

Map logic:

- Uses `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` with Google Maps Embed API when present.
- Falls back to a no-key Google Maps iframe when the env key is missing.
- Keeps the external Google Maps link in `src/content/contacts.ts`.

## Images

Image usage is centralized in:

```txt
src/content/images.ts
```

Each image entry now has two layers:

- `localSrc`: the expected CHIMGANSOY resort file in `public/images/resort/`
- `src`: a temporary remote fallback so the interface still renders before the real files are copied

The fallback route is implemented in `src/app/images/resort/[file]/route.ts`. It serves a real local file when present and redirects to the temporary fallback when the file is still missing.

The supplied photo placement plan is documented in:

```txt
src/content/photo-plan.ts
public/images/resort/README.md
```

When real CHIMGANSOY photography files are available in the filesystem:

1. Add optimized images to `public/images/resort/` using the names from `public/images/resort/README.md`.
2. Keep the exact filenames already referenced by `localSrc`; no component changes are needed.
3. Keep alt text translated for `ru`, `uz`, and `en` when image meaning changes.

## Remaining Real Content Work

- Replace placeholder phone, email, messengers, address, and map coordinates.
- Add actual room sizes, capacity rules, tariffs, and booking policies.
- Replace legal placeholder copy with approved documents.
- Add real resort photography and Bnovo production integration.
- Confirm seasonality, opening hours, and activity availability with operations.
