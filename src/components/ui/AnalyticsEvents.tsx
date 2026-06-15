"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * One delegated click listener on the document that classifies the most
 * valuable funnel actions and forwards them to GA4 via trackEvent.
 *
 * This avoids turning every CTA / link into a client component — server-
 * rendered <a> tags and <ButtonLink>s are caught here by their href.
 * Form-submit conversions are tracked inside the form components themselves
 * (they already run on the client and know success vs error).
 */
export function AnalyticsEvents() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const link = target?.closest?.("a") as HTMLAnchorElement | null;
      if (!link) return;

      const href = link.getAttribute("href") || "";

      if (href.includes("/bron")) {
        trackEvent("booking_cta_click", { location: link.dataset.loc || "unknown", href });
      } else if (href.startsWith("tel:")) {
        trackEvent("call_click", { href });
      } else if (href.includes("wa.me") || href.includes("whatsapp")) {
        trackEvent("whatsapp_click", { href });
      } else if (href.includes("t.me") || href.includes("telegram")) {
        trackEvent("telegram_click", { href });
      } else if (href.includes("instagram.com")) {
        trackEvent("instagram_click", { href });
      } else if (href.includes("maps.app.goo.gl") || href.includes("google.com/maps")) {
        trackEvent("map_click", { href });
      }
    };

    document.addEventListener("click", onClick, { passive: true });
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
