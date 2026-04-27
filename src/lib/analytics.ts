type GTagFunction = (command: string, ...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: GTagFunction;
    dataLayer?: unknown[];
  }
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
}
