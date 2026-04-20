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
    opengraph-image.tsx
    robots.ts
    sitemap.ts
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

Replace the placeholder in:

```txt
src/components/sections/BookingWidget.tsx
```

The full booking page renders:

```html
<div id="bnovo-widget" data-bnovo-placeholder="replace-with-bnovo-embed-script-or-iframe">
```

Use that area for the Bnovo embed, iframe, or script after production credentials are available.

## Images

Demo imagery is centralized in:

```txt
src/content/images.ts
```

When real CHIMGANSOY photography is ready:

1. Add optimized images to `public/images/placeholders/` or another organized public folder.
2. Replace the URLs in `src/content/images.ts` with local paths such as `/images/placeholders/hero.jpg`.
3. Keep alt text translated for `ru`, `uz`, and `en`.

## Remaining Real Content Work

- Replace placeholder phone, email, messengers, address, and map coordinates.
- Add actual room sizes, capacity rules, tariffs, and booking policies.
- Replace legal placeholder copy with approved documents.
- Add real resort photography and Bnovo production integration.
- Confirm seasonality, opening hours, and activity availability with operations.
