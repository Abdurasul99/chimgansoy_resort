import Script from "next/script";

/**
 * Yandex.Metrica — the other half of the analytics picture.
 *
 * GA4 covers Google traffic well, but a large share of search in Uzbekistan
 * runs through Yandex, and Metrica is what reports on it. It also has the two
 * things GA4 has no equivalent for at all: Webvisor, which records the actual
 * session, and the click map. Those are what answer "where does a guest give
 * up on this page" — the question that has driven most of this site's fixes.
 *
 * Renders NOTHING until the counter id is present, so shipping it costs nothing
 * and switching it on is one variable in Vercel:
 *
 *   NEXT_PUBLIC_YANDEX_METRICA_ID = 111294737
 *
 * Get the id from metrika.yandex.ru → add counter → the number in the URL.
 *
 * Kept in step with the snippet Yandex generates today (2026-08-04), which is
 * not the one this file shipped with:
 *
 *   • the counter id now goes in the tag.js URL as well as in init(). The
 *     de-duplication guard compares `document.scripts[j].src` against exactly
 *     that URL, so the two have to agree or the guard stops working.
 *   • `ssr: true` — this site is server-rendered, and without it Metrica
 *     mis-attributes the first hit.
 *   • `referrer` / `url` passed explicitly, for the same reason.
 *   • `ecommerce: "dataLayer"` — nothing pushes ecommerce events yet. The
 *     array itself already exists because GA4 creates it, so this is inert
 *     today and ready if a purchase flow ever lands (Payme is pending).
 *
 * Funnel goals arrive through trackEvent() in lib/analytics.ts as JavaScript
 * events. The goal identifier created in the Metrica UI must match the event
 * name EXACTLY — see the list in that file.
 */
export function YandexMetrica() {
  const id = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID?.trim();
  if (!id) return null;

  // Digits only — the value is interpolated into a <script> and into a URL.
  if (!/^\d{6,12}$/.test(id)) return null;

  const tagUrl = `https://mc.yandex.ru/metrika/tag.js?id=${id}`;

  return (
    <>
      <Script id="yandex-metrica" strategy="afterInteractive">
        {`
          (function(m,e,t,r,i,k,a){
            m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
          })(window, document, "script", "${tagUrl}", "ym");
          ym(${id}, "init", {
            ssr: true,
            webvisor: true,
            clickmap: true,
            ecommerce: "dataLayer",
            referrer: document.referrer,
            url: location.href,
            accurateTrackBounce: true,
            trackLinks: true
          });
        `}
      </Script>
      <noscript>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://mc.yandex.ru/watch/${id}`}
            style={{ position: "absolute", left: "-9999px" }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
