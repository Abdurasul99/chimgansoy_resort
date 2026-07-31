type GTagFunction = (command: string, ...args: unknown[]) => void;
type YmFunction = (counterId: number, action: string, ...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: GTagFunction;
    dataLayer?: unknown[];
    ym?: YmFunction;
  }
}

/**
 * Inlined at build time by Next, so this is a plain string in the client
 * bundle — no runtime lookup, and it is simply absent when unset.
 */
const YM_ID = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID;

/**
 * One funnel event, sent to every analytics tool that is switched on.
 *
 * Both destinations are optional and independent: GA4 fires if gtag loaded,
 * Metrica fires if a counter id is configured AND its tag loaded. Neither can
 * break the other, and with nothing configured this is a no-op.
 *
 * In Metrica these arrive as JavaScript-event goals, so the goal identifier
 * you create in the Metrica UI must match `name` exactly. Current names:
 *   booking_cta_click · call_click · whatsapp_click · telegram_click
 *   instagram_click · map_click · inquiry_submitted · booking_submitted
 */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }

  if (YM_ID && typeof window.ym === "function") {
    // reachGoal takes (id, 'reachGoal', target, params) — params is optional
    // and Metrica ignores unknown keys, so the GA4 payload passes through.
    window.ym(Number(YM_ID), "reachGoal", name, params);
  }
}
